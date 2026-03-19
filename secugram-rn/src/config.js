/**
 * Secugram — Configuration centralisée
 *
 * En développement Android emulator, l'hôte local est accessible via 10.0.2.2.
 * En production, remplacer par l'URL réelle du backend.
 *
 * Pour surcharger sans modifier ce fichier, définir la variable d'environnement
 * SECUGRAM_API_URL dans un fichier .env à la racine du projet.
 */

export const API_BASE_URL = __DEV__
  ? 'http://10.26.138.187:8300'          // Device physique → Tiers de Confiance (port 8300)
  : 'https://api.secugram.io';           // Production

/**
 * Timeout par défaut pour les requêtes réseau (ms).
 * Le Tiers de Confiance peut être lent sur le chiffrement/watermark.
 */
export const API_TIMEOUT_MS = 30_000;
