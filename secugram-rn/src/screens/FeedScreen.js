import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Image, Modal, Animated,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { Radius } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import * as API from '../api';

// ── Ephemeral Viewer ─────────────────────────────────────────────────────────

function EphemeralViewer({ uri, durationSec = 5, onClose }) {
  const { colors } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(durationSec);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => { if (s <= 1) { clearInterval(interval); return 0; } return s - 1; });
    }, 1000);
    Animated.timing(progress, { toValue: 0, duration: durationSec * 1000, useNativeDriver: false }).start();
    const timeout = setTimeout(onClose, durationSec * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, []);

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' }}>
        {/* Progress bar */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Animated.View style={{ height: 3, backgroundColor: colors.accent, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}/>
        </View>
        <Image source={{ uri }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="contain"/>
        <View style={{ position: 'absolute', top: 18, right: 18, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{secondsLeft}s</Text>
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 }}
          onPress={onClose}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Blurred placeholder ───────────────────────────────────────────────────────

function EncryptedPlaceholder({ uri, size }) {
  return (
    <View style={{ width: '100%', height: size, backgroundColor: '#080810', overflow: 'hidden' }}>
      {uri && (
        <Image source={{ uri }} style={{ width: '100%', height: size, opacity: 0.12 }} blurRadius={20} resizeMode="cover"/>
      )}
      {/* Hex pattern overlay */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Text key={i} style={{ fontFamily: 'Courier New', fontSize: 9, color: 'rgba(255,107,0,0.08)', letterSpacing: 2, marginTop: 2 }}>
            {'4A2F 8C1E B37D 9F56 2A4E 1C8B 5F3D 7E2A '.repeat(3)}
          </Text>
        ))}
      </View>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 20, height: 13,
            borderTopWidth: 3, borderLeftWidth: 3, borderRightWidth: 3,
            borderTopLeftRadius: 10, borderTopRightRadius: 10,
            borderColor: 'rgba(255,255,255,0.5)', marginBottom: -1,
          }}/>
          <View style={{ width: 32, height: 20, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.5)' }}/>
        </View>
        <Text style={{ fontSize: 10, fontFamily: 'Courier New', letterSpacing: 3, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
          AES-256-GCM
        </Text>
      </View>
    </View>
  );
}

// ── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ item, currentUsername, isPending, onRequestAccess, token }) {
  const { colors } = useTheme();
  const isOwner      = item.owner_username === currentUsername;
  const isAuthorized = isOwner || (item.authorized ?? []).includes(currentUsername);
  const initials     = (item.owner_username || '?').slice(0, 2).toUpperCase();
  const IMG_H        = 320;
  const [decryptedUri, setDecryptedUri] = useState(null);
  const [decrypting,   setDecrypting]   = useState(false);

  const handleTapImage = async () => {
    if (!isAuthorized || isOwner) return;
    if (decryptedUri) { setDecryptedUri(null); return; } // toggle off
    setDecrypting(true);
    try {
      const { signed_url } = await API.recordAccess(token, item.image_id, currentUsername);
      setDecryptedUri(signed_url);
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de déchiffrer.');
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <View style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 10 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19,
          borderWidth: 2, borderColor: colors.accent,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPri }}>{item.owner_username}</Text>
          <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New' }}>{item.date_creation ?? ''}</Text>
        </View>
        <View style={{
          backgroundColor: isAuthorized ? 'rgba(50,215,75,0.1)' : 'rgba(255,107,0,0.1)',
          borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 3,
          borderWidth: 1, borderColor: isAuthorized ? 'rgba(50,215,75,0.25)' : 'rgba(255,107,0,0.25)',
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'Courier New', color: isAuthorized ? '#30d158' : colors.accent }}>
            {isAuthorized ? 'AUTORISÉ' : 'CHIFFRÉ'}
          </Text>
        </View>
      </View>

      {/* Image */}
      <TouchableOpacity onPress={handleTapImage} activeOpacity={isAuthorized && !isOwner ? 0.85 : 1}>
        {isOwner && item.preview_uri ? (
          <Image source={{ uri: item.preview_uri }} style={{ width: '100%', height: IMG_H }} resizeMode="cover"/>
        ) : (
          <View>
            <EncryptedPlaceholder uri={item.preview_uri} size={IMG_H}/>
            {isAuthorized && !isOwner && (
              <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                {decrypting
                  ? <ActivityIndicator size="small" color="#fff"/>
                  : <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Appuyer pour déchiffrer</Text>
                }
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Ephemeral viewer */}
      {decryptedUri && (
        <EphemeralViewer uri={decryptedUri} durationSec={5} onClose={() => setDecryptedUri(null)}/>
      )}

      {/* Footer */}
      <View style={{ paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 }}>
        {(item.description || item.caption) ? (
          <Text style={{ fontSize: 13, color: colors.textPri, marginBottom: 10, lineHeight: 19 }}>
            <Text style={{ fontWeight: '700' }}>{item.owner_username} </Text>
            {item.description ?? item.caption}
          </Text>
        ) : null}

        {!isOwner && !isAuthorized && (
          <TouchableOpacity
            style={{
              backgroundColor: isPending ? colors.surface : colors.accent,
              borderRadius: Radius.lg, paddingVertical: 12,
              alignItems: 'center',
              borderWidth: isPending ? 1 : 0,
              borderColor: colors.border,
              opacity: isPending ? 0.65 : 1,
            }}
            onPress={() => !isPending && onRequestAccess(item)}
            activeOpacity={isPending ? 1 : 0.85}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: isPending ? colors.textSec : '#fff' }}>
              {isPending ? 'En attente de réponse…' : 'Demander l\'accès'}
            </Text>
          </TouchableOpacity>
        )}

        {!isOwner && isAuthorized && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#30d158' }}/>
            <Text style={{ fontSize: 11, color: '#30d158', fontFamily: 'Courier New' }}>ACCÈS AUTORISÉ</Text>
          </View>
        )}

        {isOwner && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }}/>
            <Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Courier New' }}>VOTRE IMAGE</Text>
          </View>
        )}
      </View>

      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }}/>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const { session }   = useAuth();
  const { colors }    = useTheme();
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [pendingIds, setPendingIds]   = useState({}); // { image_id: true }

  const load = useCallback(async () => {
    if (session.isDemo) {
      setPosts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    const { posts: p } = await API.fetchFeed();
    setPosts(p);
    // Marquer les demandes déjà envoyées
    const { photos: shared } = await API.fetchSharedPhotos(null, session.username).catch(() => ({ photos: [] }));
    const pending = {};
    shared.filter(s => s.status === 'pending').forEach(s => { pending[s.image_id] = true; });
    setPendingIds(pending);
    setLoading(false);
    setRefreshing(false);
  }, [session.username, session.isDemo]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleRequestAccess = async (item) => {
    try {
      await API.requestImageAccess({
        imageId:           item.image_id,
        imageDescription:  item.description ?? item.caption ?? '',
        ownerUsername:     item.owner_username,
        requesterUsername: session.username,
      });
      setPendingIds(p => ({ ...p, [item.image_id]: true }));
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible d\'envoyer la demande.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large"/>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={p => p.image_id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent}/>}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2 }}>
            FEED PUBLIC ({posts.length})
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📷</Text>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 8 }}>Aucune publication</Text>
          <Text style={{ fontSize: 13, color: colors.textSec, textAlign: 'center', lineHeight: 20 }}>
            Déposez une image depuis "Mes images" pour qu'elle apparaisse ici.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          item={item}
          currentUsername={session.username}
          isPending={!!pendingIds[item.image_id]}
          onRequestAccess={handleRequestAccess}
          token={session.token}
        />
      )}
    />
  );
}
