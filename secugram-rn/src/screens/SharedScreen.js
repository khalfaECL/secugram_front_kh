import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, Modal, Animated, Alert,
} from 'react-native';
import { Radius, Spacing } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import * as API from '../api';

const MOCK_SHARED = [
  {
    image_id: 'img_010', owner_username: 'khakfa_youssef',
    description: 'Conférence Paris 2025 📊',
    date_shared: '15 fév. 2025',
    preview_uri: 'https://picsum.photos/seed/conf/800/800',
    ephemeralDuration: 5, maxViews: 2,
    blocked: true,
  },
  {
    image_id: 'img_011', owner_username: 'chammakhi_malak',
    description: 'Soirée équipe 🎉',
    date_shared: '22 fév. 2025',
    preview_uri: 'https://picsum.photos/seed/party/800/800',
    ephemeralDuration: 7, maxViews: 3,
    blocked: false,
  },
  {
    image_id: 'img_012', owner_username: 'krid_amani',
    description: 'Prototype V2 🔧',
    date_shared: '5 mars 2025',
    preview_uri: 'https://picsum.photos/seed/tech/800/800',
    ephemeralDuration: 10, maxViews: 1,
    blocked: false,
  },
];

// ── Ephemeral Image Viewer ────────────────────────────────────────────────────

function EphemeralViewer({ photo, onClose, colors, durationSec }) {
  const durationMs = durationSec * 1000;
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);

    Animated.timing(progress, {
      toValue: 0,
      duration: durationMs,
      useNativeDriver: false,
    }).start();

    const timeout = setTimeout(onClose, durationMs);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
        {/* Header */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'rgba(0,0,0,0.6)',
        }}>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{photo.description}</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Partagé par {photo.owner_username}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Image
          source={{ uri: photo.preview_uri }}
          style={{ width: '100%', height: '65%', resizeMode: 'contain' }}
        />

        {/* Countdown bar */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'Courier New' }}>
              ⏱  Image éphémère
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: secondsLeft <= 2 ? '#FF453A' : colors.accent, fontFamily: 'Courier New' }}>
              {secondsLeft}s
            </Text>
          </View>
          <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <Animated.View style={{
              height: '100%', borderRadius: 2,
              backgroundColor: secondsLeft <= 2 ? '#FF453A' : colors.accent,
              width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }}/>
          </View>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Courier New', textAlign: 'center', marginTop: 10 }}>
            L'image se ferme automatiquement · Accès enregistré
          </Text>
        </View>
      </View>
    </Modal>
  );
}

// ── Info Modal (avant accès) ──────────────────────────────────────────────────

function InfoModal({ photo, onClose, onAccess, colors, accessStatus }) {
  if (!photo) return null;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={onClose}/>
      <View style={{
        backgroundColor: colors.card,
        borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
        borderWidth: 1, borderColor: colors.border, paddingBottom: 36,
      }}>
        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 20 }}/>

        <View style={{ paddingHorizontal: Spacing.lg }}>
          {/* Locked preview */}
          <View style={{
            height: 140, backgroundColor: '#080810', borderRadius: Radius.lg,
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
          }}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Text key={i} style={{ fontFamily: 'Courier New', fontSize: 9, color: 'rgba(255,107,0,0.08)', letterSpacing: 2, marginBottom: 2 }}>
                  4A2F 8C1E B37D 9F56 2A4E 1C8B 5F3D 7E2A
                </Text>
              ))}
            </View>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔒</Text>
            <Text style={{ fontSize: 10, fontFamily: 'Courier New', color: 'rgba(255,255,255,0.3)', letterSpacing: 2 }}>
              CHIFFRÉ · AES-256
            </Text>
          </View>

          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 6 }}>{photo.description}</Text>

          {/* Owner + stats row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent }}>{photo.owner_username[0].toUpperCase()}</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.textSec }}>
                De <Text style={{ fontWeight: '600', color: colors.textPri }}>{photo.owner_username}</Text>
                {'  ·  '}
                <Text style={{ fontFamily: 'Courier New' }}>{photo.date_shared}</Text>
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <View style={{ backgroundColor: colors.accentDim, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent, fontFamily: 'Courier New' }}>⏱{photo.ephemeralDuration}s</Text>
              </View>
              <View style={{ backgroundColor: colors.accentDim, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.accent, fontFamily: 'Courier New' }}>👁{accessStatus?.count ?? 0}/{photo.maxViews}</Text>
              </View>
            </View>
          </View>

          {/* Status-based bottom section */}
          {accessStatus?.reason === 'blocked' ? (
            <View style={{ backgroundColor: 'rgba(255,69,58,0.08)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: Radius.md, padding: 16, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 28 }}>🚫</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, textAlign: 'center' }}>Accès suspendu</Text>
              <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New', lineHeight: 18, textAlign: 'center' }}>
                Le propriétaire a détecté un accès non autorisé{'\n'}via filigrane numérique.{'\n'}L'image est temporairement bloquée.
              </Text>
            </View>
          ) : accessStatus?.reason === 'quota' ? (
            <View style={{ backgroundColor: 'rgba(255,69,58,0.08)', borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)', borderRadius: Radius.md, padding: 16, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 28 }}>🔢</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: colors.danger, textAlign: 'center' }}>Quota atteint</Text>
              <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New', lineHeight: 18, textAlign: 'center' }}>
                Vous avez atteint la limite de {accessStatus.max} visualisation{accessStatus.max > 1 ? 's' : ''}{'\n'}autorisée{accessStatus.max > 1 ? 's' : ''} par le propriétaire.
              </Text>
            </View>
          ) : accessStatus?.reason === 'cooldown' ? (
            <View style={{ backgroundColor: 'rgba(255,149,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,149,0,0.3)', borderRadius: Radius.md, padding: 16, alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 28 }}>⏳</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#FF9500', textAlign: 'center' }}>Accès temporairement indisponible</Text>
              <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New', lineHeight: 18, textAlign: 'center' }}>
                Délai entre deux accès non écoulé.{'\n'}Réessayez dans {accessStatus.remainMin} min.
              </Text>
            </View>
          ) : (
            <>
              <View style={{ backgroundColor: 'rgba(255,107,0,0.07)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.2)', borderRadius: Radius.md, padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Courier New', lineHeight: 18 }}>
                  ⏱  Affichage éphémère — {photo.ephemeralDuration} secondes{'\n'}
                  👁  Votre accès sera enregistré{'\n'}
                  🚫  Aucune copie locale
                </Text>
              </View>
              <TouchableOpacity
                style={{ backgroundColor: colors.accent, borderRadius: Radius.xl, paddingVertical: 15, alignItems: 'center', shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 }}
                onPress={onAccess}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Accéder à l'image</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SharedScreen() {
  const { session } = useAuth();
  const { colors, viewCooldown } = useTheme();
  const [photos, setPhotos]         = useState([]);
  const [selected, setSelected]     = useState(null);
  const [viewing,  setViewing]      = useState(null);
  const [viewCount,    setViewCount]    = useState({});   // { imageId: number }
  const [lastViewedAt, setLastViewedAt] = useState({});   // { imageId: timestamp }

  useEffect(() => {
    if (session.isDemo) {
      setPhotos(MOCK_SHARED);
      return;
    }
    API.fetchSharedPhotos(session.token, session.username)
      .then(({ photos: p }) => setPhotos(p))
      .catch(() => setPhotos([]));
  }, []);

  const getAccessStatus = (item) => {
    if (item.blocked) return { ok: false, reason: 'blocked' };
    const count = viewCount[item.image_id] ?? 0;
    if (count >= item.maxViews) return { ok: false, reason: 'quota', count, max: item.maxViews };
    const last = lastViewedAt[item.image_id];
    if (last) {
      const elapsedMs = Date.now() - last;
      const cooldownMs = viewCooldown * 60 * 1000;
      if (elapsedMs < cooldownMs) {
        const remainMin = Math.ceil((cooldownMs - elapsedMs) / 60000);
        return { ok: false, reason: 'cooldown', remainMin };
      }
    }
    return { ok: true, count, max: item.maxViews };
  };

  const handleAccess = async () => {
    const item = selected;
    const id = item.image_id;
    try {
      let viewingPhoto = { ...item };
      if (!session.isDemo) {
        const { signed_url } = await API.recordAccess(session.token, id, session.username);
        viewingPhoto = { ...item, preview_uri: signed_url };
        API.logAccess({
          imageId: id,
          imageDescription: item.description,
          viewerUsername: session.username,
          ownerUsername: item.owner_username,
        }).catch(() => {});
      }
      setViewCount(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
      setLastViewedAt(t => ({ ...t, [id]: Date.now() }));
      setViewing(viewingPhoto);
      setSelected(null);
    } catch (e) {
      setSelected(null);
      Alert.alert('Accès refusé', e.message || "Impossible d'accéder à cette image.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={photos}
        keyExtractor={p => p.image_id}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
              PARTAGÉES AVEC MOI ({photos.length})
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const count = viewCount[item.image_id] ?? 0;
          const wasAccessed = count > 0;
          const remaining = item.maxViews - count;
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: item.blocked ? 'rgba(255,69,58,0.3)' : colors.border,
                borderRadius: Radius.lg, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden',
                opacity: item.blocked ? 0.75 : 1,
              }}
              onPress={() => setSelected(item)} activeOpacity={0.85}
            >
              <View style={{
                width: 80, height: 80,
                backgroundColor: item.blocked ? 'rgba(255,69,58,0.08)' : '#080810',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 22 }}>{item.blocked ? '🚫' : '🔒'}</Text>
              </View>

              <View style={{ flex: 1, padding: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPri, marginBottom: 4 }} numberOfLines={1}>
                  {item.description}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSec, marginBottom: 6 }}>
                  De : <Text style={{ fontWeight: '500' }}>{item.owner_username}</Text>
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New' }}>{item.date_shared}</Text>
              </View>

              <View style={{ paddingRight: 14, alignItems: 'center', gap: 4 }}>
                {item.blocked ? (
                  <View style={{
                    backgroundColor: 'rgba(255,69,58,0.1)', borderRadius: Radius.full,
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderWidth: 1, borderColor: 'rgba(255,69,58,0.3)',
                  }}>
                    <Text style={{ fontSize: 9, color: colors.danger, fontFamily: 'Courier New' }}>BLOQUÉ</Text>
                  </View>
                ) : wasAccessed ? (
                  <View style={{
                    backgroundColor: remaining > 0 ? 'rgba(0,207,255,0.1)' : 'rgba(255,69,58,0.1)',
                    borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: remaining > 0 ? 'rgba(0,207,255,0.2)' : 'rgba(255,69,58,0.3)',
                  }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Courier New', color: remaining > 0 ? colors.cyan : colors.danger }}>
                      {remaining > 0 ? `${remaining} RESTANT` : 'ÉPUISÉ'}
                    </Text>
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: colors.accentDim, borderRadius: Radius.full,
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)',
                  }}>
                    <Text style={{ fontSize: 9, color: colors.accent, fontFamily: 'Courier New' }}>{item.maxViews}× DISPO</Text>
                  </View>
                )}
                <Text style={{ fontSize: 18, color: colors.textSec }}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>🔐</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 8 }}>
              Aucune image partagée
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSec, textAlign: 'center' }}>
              Personne ne vous a encore accordé d'accès
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />

      {selected && (
        <InfoModal
          photo={selected}
          onClose={() => setSelected(null)}
          onAccess={handleAccess}
          colors={colors}
          accessStatus={getAccessStatus(selected)}
        />
      )}

      {viewing && (
        <EphemeralViewer
          photo={viewing}
          onClose={() => setViewing(null)}
          colors={colors}
          durationSec={viewing.ephemeralDuration ?? 5}
        />
      )}
    </View>
  );
}
