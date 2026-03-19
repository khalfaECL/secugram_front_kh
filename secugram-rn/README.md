# Secugram — Frontend React Native

Interface Android-first pour le système décentralisé de gestion d'images chiffrées.
Se connecte directement au **Tiers de Confiance** (FastAPI, port 8300).

---

## Architecture

```
secugram-rn/
├── App.js                          ← Point d'entrée, FLAG_SECURE (anti-screenshot)
├── src/
│   ├── config.js                   ← API_BASE_URL (IP + port du Tiers de Confiance)
│   ├── api/
│   │   └── index.js                ← Tous les appels API + normaliseurs snake→camel
│   ├── hooks/
│   │   ├── useAuth.js              ← Token en mémoire uniquement (pas AsyncStorage)
│   │   └── useTheme.js             ← Thème + viewCooldown (intervalle entre vues)
│   ├── navigation/
│   │   └── AppNavigator.js         ← Tab nav + Auth gate + menu info
│   ├── screens/
│   │   ├── LoginScreen.js          ← Connexion / Inscription
│   │   ├── MyPhotosScreen.js       ← Galerie personnelle (dépôt, blocage, historique)
│   │   ├── SharedScreen.js         ← Images partagées + viewer éphémère
│   │   ├── HistoryScreen.js        ← Historique accès
│   │   └── ProfileScreen.js        ← Session + intervalle entre vues
│   ├── components/
│   │   ├── UI.js                   ← Composants réutilisables
│   │   └── UploadModal.js          ← Bottom sheet : image → autorisations → dépôt
│   └── theme/
│       └── index.js                ← Couleurs, radius, espacement
└── package.json
```

---

## Prérequis

- Node.js ≥ 18
- Android Studio + Android SDK (API 33+)
- JDK 17
- Le **Tiers de Confiance** doit tourner sur le réseau local (voir section dédiée)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd secugram-rn
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Permissions Android

Dans `android/app/src/main/AndroidManifest.xml`, vérifier la présence de :

```xml
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
    android:maxSdkVersion="32"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

### 4. Configurer l'URL du Tiers de Confiance

Ouvrir `src/config.js` et renseigner l'IP de la machine qui fait tourner le TdC :

```js
// Émulateur Android (AVD) → localhost de la machine hôte
export const API_BASE_URL = 'http://10.0.2.2:8300';

// Device physique → IP de la machine sur le réseau local
export const API_BASE_URL = 'http://<IP_DE_LA_MACHINE>:8300';
```

> Pour trouver l'IP de la machine : `ipconfig` (Windows) → adresse IPv4 Wi-Fi.

### 5. Lancer en mode développement

```bash
npm start            # Terminal 1 — Metro bundler
npm run android      # Terminal 2 — build + install sur device/émulateur
```

---

## Générer un APK (installation autonome)

```bash
cd android
./gradlew assembleRelease
```

L'APK est généré dans :
```
android/app/build/outputs/apk/release/app-release.apk
```

Installer sur un device connecté en USB :
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## Mode démo (sans backend)

Utiliser les identifiants `alice_dupont` / `demo1234` sur l'écran de connexion.
Toutes les actions réseau sont bypassées — les données mock sont dans les fichiers `MOCK_*` en tête de chaque écran.

---

## Sécurité implémentée

| Mesure | Implémentation |
|--------|----------------|
| Pas de persistance du token | Stocké en mémoire React (`useState`) uniquement |
| Anti-screenshot | `FLAG_SECURE` activé dans `App.js` (Android natif) |
| Image jamais en clair | Envoyée au TdC qui applique watermark + AES-256 |
| Viewer éphémère | Auto-fermeture + compte à rebours configurable (1–10s) |
| Quota de vues | Configurable par image (1–20 vues max) |
| Cooldown entre vues | Configurable dans Profil (1–60 min, défaut 10 min) |
| Blocage watermark | Détection filigrane → blocage auto, levée par le propriétaire |

---

## Flux d'upload — connexion avec le Tiers de Confiance

L'upload d'une image suit ce flux en deux étapes :

```
1. POST /set_key
   { owner_username, user_id, image_id, token, valid: true }
   → Le TdC génère et stocke la clé AES-256 pour cet image_id

2. POST /add_post  (multipart/form-data)
   { user_id, caption, image_id, image (fichier), authorized_users[] }
   → Le TdC chiffre l'image + applique le watermark invisible
   → Retourne { image_id, ... }
```

---

## Endpoints Tiers de Confiance utilisés

| Action | Méthode | Route |
|--------|---------|-------|
| Inscription | POST | `/auth/register` |
| Connexion | POST | `/auth/login` |
| Déconnexion | POST | `/auth/logout` |
| Créer clé image | POST | `/set_key` |
| Déposer image | POST | `/add_post` |
| Récupérer image | POST | `/posts/{image_id}` |
| Autoriser viewers | POST | `/authorize/{image_id}` |
| Révoquer accès | DELETE | `/revoke/{image_id}/{username}` |
| Watermark | POST | `/trust/watermark` |
| Déchiffrer | POST | `/decrypt_image/{image_id}` |

> Documentation interactive Swagger du TdC : `http://localhost:8300/docs`

---

## Démarrer le Tiers de Confiance (pour les autres membres)

```bash
cd tiers-de-confiance-v1

# Créer l'environnement virtuel (première fois uniquement)
python -m venv venv

# Activer l'environnement
.\venv\Scripts\activate          # Windows
source venv/bin/activate         # Linux / macOS

# Installer les dépendances (première fois uniquement)
pip install -r requirements.txt

# Créer le fichier .env à la racine
# Contenu pour MongoDB local :
# MONGO_URI="mongodb://localhost:27017"
# PORT=8100

# Démarrer MongoDB (si local)
mongod --dbpath "C:\data\db"

# Lancer le serveur (dans un autre terminal)
uvicorn main:app --host 0.0.0.0 --reload --port 8300
```

> `--host 0.0.0.0` est obligatoire pour que les devices physiques sur le réseau puissent atteindre le serveur.

---

## Convention de nommage API ↔ Frontend

Le TdC renvoie du snake_case — le frontend normalise automatiquement dans `src/api/index.js`.

| TdC (JSON) | Frontend (React state) |
|------------|------------------------|
| `_id` / `image_id` | `image_id` |
| `preview_url` | `preview_uri` |
| `authorized_users` | `authorized` |
| `ephemeral_duration` | `ephemeralDuration` |
| `max_views` | `maxViews` |
| `accessed_at` | `date` |
| `viewer_username` | `viewer` |
| `owner_username` | `owner` |
| `expires_at` (ISO) | `expiresAt` (timestamp ms) |

---

## Écrans et fonctionnalités

### LoginScreen
- Tabs Connexion / Inscription
- En cas d'inscription : login automatique enchaîné (le TdC ne retourne pas de token à l'inscription)

### MyPhotosScreen — Galerie personnelle
- Dépôt d'image via `UploadModal` (set_key → add_post)
- Gestion des utilisateurs autorisés par image
- Blocage / déblocage suite à détection de filigrane
- Historique d'accès par image

### SharedScreen — Images partagées
- Liste des images partagées avec le compte connecté
- Viewer éphémère avec compte à rebours
- Contrôle quota et cooldown entre vues

### HistoryScreen
- Accès reçus sur mes images (type APP ou FILIGRANE)
- Images auxquelles j'ai accédé

### ProfileScreen
- Informations de session
- Intervalle minimum entre deux vues (viewCooldown)
- Déconnexion (invalide le token côté TdC)
