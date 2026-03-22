/**
 * AuthContext
 * - Stockage du token en mémoire uniquement (pas AsyncStorage = pas de persistance)
 * - Conforme aux specs : session éphémère, token JWT
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as API from '../api';
import { clearSessionPhotos } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ⚠️  État en mémoire uniquement — disparaît à la fermeture de l'app
  const [session, setSession] = useState(null);
  // session = { token, userId, username, expiresAt }

  const DEMO_CREDENTIALS = { username: 'alice_dupont', password: 'demo1234' };

  const login = useCallback(async (username, password) => {
    // Compte démo intégré — fonctionne sans backend
    if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
      const sess = {
        token:     'demo_jwt_token_abc123xyz',
        userId:    'u1',
        username:  'alice_dupont',
        expiresAt: Date.now() + 3600 * 1000,
        isDemo:    true,
      };
      setSession(sess);
      return sess;
    }
    const data = await API.login(username, password);
    const sess = {
      token:     data.token,
      userId:    data.user_id,
      username:  data.username,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    setSession(sess);
    return sess;
  }, []);

  const register = useCallback(async (username, email, password) => {
    // API.register enchaîne automatiquement un login → retourne token + expires_in
    const data = await API.register(username, email, password);
    const sess = {
      token:     data.token,
      userId:    data.user_id,
      username:  data.username,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    setSession(sess);
    return sess;
  }, []);

  const logout = useCallback((token) => {
    if (token) API.logout(token); // invalide côté TdC (fire-and-forget)
    clearSessionPhotos();
    setSession(null);
  }, []);

  const demoLogin = useCallback(() => {
    setSession({
      token:     'demo_jwt_token_abc123xyz',
      userId:    'u1',
      username:  'alice_dupont',
      expiresAt: Date.now() + 3600 * 1000,
      isDemo:    true,
    });
  }, []);

  const isTokenValid = useCallback(() => {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, login, register, logout, demoLogin, isTokenValid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
