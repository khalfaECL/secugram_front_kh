/**
 * Secugram API Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Toutes les requêtes vers /api/*.
 * Le token JWT est passé en paramètre (jamais stocké dans ce module).
 *
 * CONVENTION DE NOMMAGE :
 *   • Le backend renvoie du JSON snake_case (MongoDB/Node.js convention).
 *   • Ce module normalise vers camelCase avant de retourner les données
 *     aux écrans React Native.
 *   • Les corps de requêtes sont envoyés en snake_case vers l'API.
 *
 * SCHÉMAS MONGODB ATTENDUS (à transmettre à l'équipe backend) :
 * ─────────────────────────────────────────────────────────────
 * Collection "users"     → { _id, username, email, created_at }
 * Collection "photos"    → { _id, owner_id, description, preview_url,
 *                            authorized_users[], ephemeral_duration,
 *                            max_views, blocked, access_count,
 *                            created_at, history[] }
 * Collection "accesses"  → { _id, image_id, viewer_id, viewer_username,
 *                            type: 'app'|'watermark', accessed_at }
 */

import { API_BASE_URL, API_TIMEOUT_MS } from '../config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Le Tiers de Confiance attend le token dans le body (pas Bearer header).
// authHeaders est gardé pour compatibilité future avec un backend intermédiaire.
function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// Headers pour les routes Tiers de Confiance (token dans body, pas header).
function tdcHeaders() {
  return { 'Content-Type': 'application/json' };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

/**
 * fetch() avec timeout.
 * Le Tiers de Confiance peut prendre du temps pour chiffrer/watermarker.
 */
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Normaliseurs (snake_case → camelCase) ───────────────────────────────────

/**
 * Photo appartenant à l'utilisateur connecté (galerie personnelle).
 * Champ MongoDB "_id" → "image_id" côté frontend.
 */
function normalizeMyPhoto(p) {
  return {
    image_id:          p._id ?? p.image_id,
    description:       p.description ?? '',
    date_creation:     p.created_at ?? p.date_creation ?? '',
    preview_uri:       p.preview_url ?? p.preview_uri ?? '',
    authorized:        p.authorized_users ?? p.authorized ?? [],
    access_count:      p.access_count ?? 0,
    ephemeralDuration: p.ephemeral_duration ?? p.ephemeralDuration ?? 5,
    maxViews:          p.max_views ?? p.maxViews ?? 3,
    blocked:           p.blocked ?? false,
    history:           (p.history ?? []).map(normalizeHistoryEntry),
  };
}

/**
 * Image partagée avec l'utilisateur connecté.
 */
function normalizeSharedPhoto(p) {
  return {
    image_id:          p._id ?? p.image_id,
    owner_username:    p.owner_username,
    description:       p.description ?? '',
    date_shared:       p.shared_at ?? p.date_shared ?? '',
    preview_uri:       p.preview_url ?? p.preview_uri ?? '',
    ephemeralDuration: p.ephemeral_duration ?? p.ephemeralDuration ?? 5,
    maxViews:          p.max_views ?? p.maxViews ?? 3,
    blocked:           p.blocked ?? false,
  };
}

function normalizeHistoryEntry(h) {
  return {
    viewer:  h.viewer_username ?? h.viewer,
    date:    h.accessed_at     ?? h.date,
    type:    h.type,             // 'app' | 'watermark'
  };
}

function normalizeAccessEntry(a) {
  return {
    id:                a._id ?? a.id,
    image_id:          a.image_id,
    image_description: a.image_description ?? a.description ?? '',
    preview_uri:       a.preview_url ?? a.preview_uri ?? '',
    viewer:            a.viewer_username ?? a.viewer,
    owner:             a.owner_username  ?? a.owner,
    date:              a.accessed_at     ?? a.date,
    type:              a.type,
  };
}

function normalizeUser(u) {
  return {
    user_id:  u._id ?? u.user_id,
    username: u.username,
    display:  u.display_name ?? u.username,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login  (Tiers de Confiance)
 * @returns {{ token: string, user_id: string, username: string, expires_in: number }}
 */
export async function login(username, password) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  // Le TdC retourne expires_at (ISO string), on calcule expires_in en secondes.
  const expiresIn = data.expires_at
    ? Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000)
    : (data.expires_in ?? 86400);
  return {
    token:      data.token,
    user_id:    data.user_id ?? data._id,
    username:   data.username,
    expires_in: expiresIn,
  };
}

/**
 * POST /auth/register  (Tiers de Confiance)
 * Le TdC ne retourne PAS de token à l'inscription → on enchaîne un login automatique.
 * @returns {{ token: string, user_id: string, username: string, expires_in: number }}
 */
export async function register(username, _email, password) {
  // email ignoré : le TdC ne l'accepte pas dans /auth/register
  const res = await fetchWithTimeout(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  await handleResponse(res); // { message, user_id } — pas de token
  // Auto-login pour obtenir le token de session.
  return login(username, password);
}

/**
 * POST /auth/logout  (Tiers de Confiance)
 * Invalide le token côté serveur.
 */
export async function logout(token) {
  await fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({ token }),
  }).catch(() => {}); // erreur silencieuse — la session mémoire est effacée de toute façon
}

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/users
 * Liste des utilisateurs connus (pour le formulaire d'autorisations).
 * @returns {{ users: Array<{ user_id, username, display }> }}
 */
export async function fetchUsers(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/users`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { users: (data.users ?? []).map(normalizeUser) };
}

// ─── Photos (galerie personnelle) ─────────────────────────────────────────────

/**
 * GET /api/photos
 * Images déposées par l'utilisateur connecté.
 * @returns {{ photos: Array<NormalizedMyPhoto> }}
 *
 * Réponse backend attendue :
 * { photos: [{ _id, description, preview_url, authorized_users[], ephemeral_duration,
 *              max_views, blocked, access_count, created_at, history[] }] }
 */
export async function fetchMyPhotos(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { photos: (data.photos ?? []).map(normalizeMyPhoto) };
}

/**
 * POST /api/photos/upload
 * Envoi de l'image brute (base64) vers le Tiers de Confiance via le backend.
 * Le Tiers applique : watermark invisible + chiffrement AES-256.
 *
 * Payload envoyé :
 * {
 *   image_data:          string (base64),
 *   description:         string,
 *   authorized_users:    string[] (usernames),
 *   ephemeral_duration:  number (secondes, 1–10),
 *   max_views:           number (1–20),
 * }
 *
 * IMPORTANT : Ne pas inclure d'image_id côté client.
 * Le _id MongoDB est généré par le backend et retourné dans la réponse.
 *
 * @returns {{ image_id: string, preview_url: string }}
 */
/**
 * Flux complet d'upload vers le Tiers de Confiance :
 *   1. POST /set_key   — crée la clé AES-256 pour l'image
 *   2. POST /add_post  — chiffre + watermark + stocke l'image
 *
 * @param {{ uri, fileName?, type? }} imageAsset
 * @param {{ description, authorizedUsers, ephemeralDuration, maxViews }} opts
 * @param {{ userId, username }} session
 * @returns {{ image_id: string, preview_uri: string|null }}
 */
export async function uploadPhoto(token, { imageAsset, description, authorizedUsers, ephemeralDuration: _ephem, maxViews: _maxV }, session) {
  // Génération d'un image_id côté client (UUID simplifié)
  const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // 1. Créer la clé de chiffrement pour cette image
  const keyRes = await fetchWithTimeout(`${API_BASE_URL}/set_key`, {
    method:  'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({
      owner_username: session.username,
      user_id:        session.userId,
      image_id:       imageId,
      token:          token,
      valid:          true,
    }),
  });
  await handleResponse(keyRes);

  // 2. Déposer l'image (le TdC chiffre + watermark avec la clé créée à l'étape 1)
  const formData = new FormData();
  formData.append('user_id',  session.userId);
  formData.append('caption',  description ?? '');
  formData.append('image_id', imageId);
  formData.append('image', {
    uri:  imageAsset.uri,
    name: imageAsset.fileName ?? 'photo.jpg',
    type: imageAsset.type     ?? 'image/jpeg',
  });
  (authorizedUsers ?? []).forEach(u => formData.append('authorized_users', u));

  const postRes = await fetchWithTimeout(`${API_BASE_URL}/add_post`, {
    method: 'POST',
    body:   formData,
  });
  const data = await handleResponse(postRes);
  return {
    image_id:    data.image_id ?? imageId,
    preview_uri: data.preview_url ?? null,
  };
}

/**
 * PATCH /api/photos/:imageId/authorize
 * Met à jour la liste complète des utilisateurs autorisés.
 * Remplace la liste existante (pas d'ajout incrémental côté API).
 *
 * @param {string[]} authorizedUsers  - liste de usernames
 * @returns {{ success: boolean }}
 */
/**
 * POST /authorize/{image_id}  (Tiers de Confiance)
 * Token dans le body (pas en header).
 */
export async function authorizePhoto(token, imageId, authorizedUsers, ownerUsername) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/authorize/${imageId}`, {
    method: 'POST',
    headers: tdcHeaders(),
    body: JSON.stringify({
      owner_username:   ownerUsername,
      token:            token,
      authorized_users: authorizedUsers,
    }),
  });
  return handleResponse(res);
}

/**
 * PATCH /api/photos/:imageId/settings
 * Modifie les paramètres de sécurité d'une image existante
 * (durée éphémère, nombre de vues max).
 *
 * @param {{ ephemeralDuration?: number, maxViews?: number, description?: string }} updates
 * @returns {{ success: boolean }}
 */
export async function updatePhotoSettings(token, imageId, updates) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}/settings`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({
      ephemeral_duration: updates.ephemeralDuration,
      max_views:          updates.maxViews,
      description:        updates.description,
    }),
  });
  return handleResponse(res);
}

/**
 * PATCH /api/photos/:imageId/block
 * Bloque ou débloque l'accès à une image suite à une détection de filigrane.
 *
 * @param {boolean} blocked
 * @returns {{ success: boolean }}
 */
export async function setPhotoBlocked(token, imageId, blocked) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}/block`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ blocked }),
  });
  return handleResponse(res);
}

/**
 * DELETE /api/photos/:imageId
 * Supprime l'image et ses métadonnées (côté backend + Tiers de Confiance).
 *
 * @returns {{ success: boolean }}
 */
export async function deletePhoto(token, imageId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  return handleResponse(res);
}

// ─── Photos partagées (côté viewer) ──────────────────────────────────────────

/**
 * GET /api/photos/shared
 * Images que d'autres utilisateurs ont partagées avec le connecté.
 *
 * Réponse backend attendue :
 * { photos: [{ _id, owner_username, description, shared_at, preview_url,
 *              ephemeral_duration, max_views, blocked }] }
 *
 * NOTE : preview_url doit être une URL signée et temporaire renvoyée par
 * le Tiers de Confiance — l'image ne doit jamais être stockée localement.
 *
 * @returns {{ photos: Array<NormalizedSharedPhoto> }}
 */
export async function fetchSharedPhotos(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/shared`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { photos: (data.photos ?? []).map(normalizeSharedPhoto) };
}

/**
 * POST /api/photos/:imageId/access
 * Enregistre un accès éphémère côté serveur.
 * Le backend :
 *   1. Vérifie que le viewer est autorisé.
 *   2. Vérifie le quota (max_views) et le cooldown.
 *   3. Logue l'accès dans la collection "accesses".
 *   4. Renvoie une URL signée temporaire pour afficher l'image déchiffrée.
 *
 * @returns {{ success: boolean, access_id: string, signed_url: string }}
 *   signed_url : URL valable uniquement le temps de l'affichage éphémère.
 *   En cas de quota/cooldown/blocage, une erreur HTTP est renvoyée avec
 *   { message, reason: 'quota'|'cooldown'|'blocked', remain_min? }
 */
export async function recordAccess(token, imageId) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/photos/${imageId}/access`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return {
    access_id:  data.access_id ?? data._id,
    signed_url: data.signed_url ?? data.preview_url,
  };
}

// ─── Historique ───────────────────────────────────────────────────────────────

/**
 * GET /api/history/my-images
 * Accès enregistrés sur les images de l'utilisateur connecté.
 * Inclut les accès APP (via Secugram) et FILIGRANE (détection tierce).
 *
 * Réponse attendue :
 * { accesses: [{ _id, image_id, image_description, preview_url,
 *                viewer_username, accessed_at, type: 'app'|'watermark' }] }
 *
 * @returns {{ accesses: Array<NormalizedAccessEntry> }}
 */
export async function fetchMyImageHistory(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/history/my-images`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { accesses: (data.accesses ?? []).map(normalizeAccessEntry) };
}

/**
 * GET /api/history/my-accesses
 * Images auxquelles l'utilisateur connecté a accédé (en tant que viewer).
 *
 * Réponse attendue :
 * { accesses: [{ _id, image_id, image_description, preview_url,
 *                owner_username, accessed_at }] }
 *
 * @returns {{ accesses: Array<NormalizedAccessEntry> }}
 */
export async function fetchMyAccesses(token) {
  const res = await fetchWithTimeout(`${API_BASE_URL}/history/my-accesses`, {
    headers: authHeaders(token),
  });
  const data = await handleResponse(res);
  return { accesses: (data.accesses ?? []).map(normalizeAccessEntry) };
}
