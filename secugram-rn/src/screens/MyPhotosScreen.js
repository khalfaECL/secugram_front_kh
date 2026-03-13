import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  Modal, ScrollView, TextInput, Alert, Dimensions,
} from 'react-native';
import { Radius, Spacing } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import UploadModal from '../components/UploadModal';

const { width } = Dimensions.get('window');
const CARD = (width - 48) / 2;

const MOCK_MY_PHOTOS = [
  {
    image_id: 'img_001', description: 'Vacances Nice 2025 🌊',
    date_creation: '26 fév. 2025',
    preview_uri: 'https://picsum.photos/seed/beach/400/400',
    authorized: ['khakfa_youssef', 'chammakhi_malak'], access_count: 3,
    history: [
      { viewer: 'khakfa_youssef',   date: '2 mars · 14h23', type: 'app' },
      { viewer: 'chammakhi_malak',  date: '4 mars · 09h11', type: 'app' },
      { viewer: 'inconnu_device', date: '5 mars · 22h04', type: 'watermark' },
    ],
  },
  {
    image_id: 'img_002', description: 'Randonnée Vercors 🌲',
    date_creation: '3 mars 2025',
    preview_uri: 'https://picsum.photos/seed/forest/400/400',
    authorized: ['krid_amani'], access_count: 1,
    history: [
      { viewer: 'krid_amani', date: '5 mars · 11h30', type: 'app' },
    ],
  },
  {
    image_id: 'img_003', description: 'Conférence Lyon ☕',
    date_creation: '8 mars 2025',
    preview_uri: 'https://picsum.photos/seed/city/400/400',
    authorized: [], access_count: 0, history: [],
  },
];

const KNOWN_USERS = ['khakfa_youssef', 'chammakhi_malak', 'agrebi_marwane', 'krid_amani', 'felix_moreau'];

// ── Photo Detail Modal ────────────────────────────────────────────────────────

function PhotoDetailModal({ photo, visible, onClose, onDelete, onUpdateAuthorized, colors }) {
  const [newUser, setNewUser] = useState('');
  const [authorized, setAuthorized] = useState(photo?.authorized ?? []);
  const [tab, setTab] = useState('auth'); // 'auth' | 'history'

  if (!photo) return null;

  const addUser = () => {
    const u = newUser.trim().toLowerCase();
    if (!u || authorized.includes(u)) { setNewUser(''); return; }
    const updated = [...authorized, u];
    setAuthorized(updated);
    onUpdateAuthorized(photo.image_id, updated);
    setNewUser('');
  };

  const removeUser = (u) => {
    const updated = authorized.filter(x => x !== u);
    setAuthorized(updated);
    onUpdateAuthorized(photo.image_id, updated);
  };

  const confirmDelete = () => {
    Alert.alert('Supprimer', 'Supprimer définitivement cette image ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => { onDelete(photo.image_id); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={onClose}/>
      <View style={{
        backgroundColor: colors.card, maxHeight: '90%',
        borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
        borderWidth: 1, borderColor: colors.border, paddingBottom: 32,
      }}>
        {/* Drag handle */}
        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 12 }}/>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <Image source={{ uri: photo.preview_uri }} style={{ width: '100%', height: 220, resizeMode: 'cover' }}/>

          <View style={{ padding: Spacing.lg }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 4 }}>{photo.description}</Text>
            <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New', marginBottom: 20 }}>{photo.date_creation}</Text>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: Radius.full, padding: 3, marginBottom: 20 }}>
              {[['auth', '🔐 Autorisations'], ['history', '📋 Historique']].map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[{ flex: 1, paddingVertical: 9, borderRadius: Radius.full, alignItems: 'center' },
                    tab === key && { backgroundColor: colors.card }]}
                  onPress={() => setTab(key)}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: tab === key ? colors.textPri : colors.textSec }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Auth tab */}
            {tab === 'auth' && (
              <View>
                <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 12 }}>
                  PERSONNES AUTORISÉES
                </Text>

                {/* Add by identifier */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: colors.surface, borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: colors.border,
                  paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
                }}>
                  <TextInput
                    style={{ flex: 1, fontSize: 14, color: colors.textPri }}
                    placeholder="Ajouter par identifiant..."
                    placeholderTextColor={colors.textMut}
                    value={newUser}
                    onChangeText={setNewUser}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={addUser}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: newUser.trim() ? colors.accent : colors.border,
                      borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 6,
                    }}
                    onPress={addUser} disabled={!newUser.trim()}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Authorized list */}
                {authorized.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ fontSize: 13, color: colors.textMut, fontFamily: 'Courier New' }}>Aucun accès accordé</Text>
                  </View>
                ) : (
                  authorized.map(u => (
                    <View key={u} style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                      borderRadius: Radius.lg, padding: 12, marginBottom: 8,
                    }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.accent }}>{u[0].toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPri }}>{u}</Text>
                        {KNOWN_USERS.includes(u)
                          ? <Text style={{ fontSize: 11, color: colors.success, fontFamily: 'Courier New' }}>✓ Utilisateur vérifié</Text>
                          : <Text style={{ fontSize: 11, color: colors.warning, fontFamily: 'Courier New' }}>⚠ Invitation en attente</Text>
                        }
                      </View>
                      <TouchableOpacity
                        style={{ padding: 6 }}
                        onPress={() => removeUser(u)}
                      >
                        <Text style={{ color: colors.danger, fontSize: 16 }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <View>
                <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 12 }}>
                  HISTORIQUE D'ACCÈS
                </Text>
                {photo.history.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ fontSize: 13, color: colors.textMut, fontFamily: 'Courier New' }}>Aucun accès enregistré</Text>
                  </View>
                ) : (
                  photo.history.map((h, i) => (
                    <View key={i} style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                      borderRadius: Radius.lg, padding: 12, marginBottom: 8,
                    }}>
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        backgroundColor: h.type === 'watermark' ? 'rgba(255,107,0,0.15)' : 'rgba(0,207,255,0.1)',
                        alignItems: 'center', justifyContent: 'center', marginRight: 12,
                      }}>
                        <Text style={{ fontSize: 15 }}>{h.type === 'watermark' ? '🖼️' : '👁'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '500', color: colors.textPri }}>{h.viewer}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New' }}>{h.date}</Text>
                      </View>
                      <View style={{
                        borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3,
                        backgroundColor: h.type === 'watermark' ? 'rgba(255,107,0,0.12)' : 'rgba(0,207,255,0.1)',
                        borderWidth: 1,
                        borderColor: h.type === 'watermark' ? 'rgba(255,107,0,0.3)' : 'rgba(0,207,255,0.2)',
                      }}>
                        <Text style={{
                          fontSize: 9, fontWeight: '700', fontFamily: 'Courier New',
                          color: h.type === 'watermark' ? colors.accent : colors.cyan,
                        }}>
                          {h.type === 'watermark' ? 'FILIGRANE' : 'APP'}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
                <View style={{
                  marginTop: 8, backgroundColor: 'rgba(255,107,0,0.06)',
                  borderWidth: 1, borderColor: 'rgba(255,107,0,0.15)',
                  borderRadius: Radius.md, padding: 12,
                }}>
                  <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New', lineHeight: 18 }}>
                    {'👁 APP — accès via Secugram (utilisateur autorisé)\n🖼️ FILIGRANE — détecté via tatouage numérique (tout appareil)'}
                  </Text>
                </View>
              </View>
            )}

            {/* Delete */}
            <TouchableOpacity
              style={{
                marginTop: 28, paddingVertical: 14, borderRadius: Radius.xl,
                backgroundColor: 'rgba(255,69,58,0.07)',
                borderWidth: 1, borderColor: 'rgba(255,69,58,0.2)',
                alignItems: 'center',
              }}
              onPress={confirmDelete}
            >
              <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 14 }}>🗑  Supprimer cette image</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Photo Card ────────────────────────────────────────────────────────────────

function PhotoCard({ photo, onPress, colors }) {
  return (
    <TouchableOpacity
      style={{
        width: CARD, backgroundColor: colors.card,
        borderRadius: Radius.lg, overflow: 'hidden',
        borderWidth: 1, borderColor: colors.border,
      }}
      onPress={() => onPress(photo)} activeOpacity={0.85}
    >
      {photo.preview_uri
        ? <Image source={{ uri: photo.preview_uri }} style={{ width: '100%', height: CARD, resizeMode: 'cover' }}/>
        : <View style={{ width: '100%', height: CARD, backgroundColor: '#080810', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>🔒</Text>
          </View>
      }
      <View style={{ padding: 10 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPri, marginBottom: 6 }} numberOfLines={1}>
          {photo.description}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: colors.accent, fontFamily: 'Courier New' }}>
            🔐 {photo.authorized.length}
          </Text>
          <Text style={{ fontSize: 10, color: photo.access_count > 0 ? colors.cyan : colors.textMut, fontFamily: 'Courier New' }}>
            👁 {photo.access_count}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MyPhotosScreen() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [photos, setPhotos] = useState(MOCK_MY_PHOTOS);
  const [selected, setSelected] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const handleDelete = (imageId) => setPhotos(p => p.filter(x => x.image_id !== imageId));

  const handleUpdateAuthorized = (imageId, authorized) =>
    setPhotos(p => p.map(x => x.image_id === imageId ? { ...x, authorized } : x));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={photos}
        keyExtractor={p => p.image_id}
        numColumns={2}
        columnWrapperStyle={{ gap: 16, paddingHorizontal: 16, marginBottom: 16 }}
        ListHeaderComponent={
          <View style={{ padding: 16, paddingBottom: 8 }}>
            {/* Déposer button */}
            <TouchableOpacity
              style={{
                backgroundColor: colors.accent, borderRadius: Radius.xl,
                paddingVertical: 16, alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 10, marginBottom: 20,
                shadowColor: colors.accent, shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
              }}
              onPress={() => setShowUpload(true)} activeOpacity={0.88}
            >
              <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300' }}>+</Text>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>Déposer une image</Text>
            </TouchableOpacity>

            {photos.length > 0 && (
              <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
                MES IMAGES ({photos.length})
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <PhotoCard photo={item} onPress={setSelected} colors={colors}/>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>📁</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 8 }}>Aucune image déposée</Text>
            <Text style={{ fontSize: 13, color: colors.textSec, textAlign: 'center' }}>
              Déposez votre première image sécurisée
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />

      <PhotoDetailModal
        photo={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
        onUpdateAuthorized={handleUpdateAuthorized}
        colors={colors}
      />

      <UploadModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSuccess={({ imageId, uri, description, authorized }) => {
          setPhotos(prev => [{
            image_id: imageId,
            description: description || 'Image sans titre',
            date_creation: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            preview_uri: uri,
            authorized,
            access_count: 0,
            history: [],
          }, ...prev]);
          setShowUpload(false);
        }}
        users={KNOWN_USERS.map((u, i) => ({ user_id: `u${i+2}`, username: u, display: u.split('_')[0] }))}
      />
    </View>
  );
}
