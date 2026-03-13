import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Radius, Spacing } from '../theme';
import { useTheme } from '../hooks/useTheme';

// Accès à mes images
const MOCK_MY_IMAGE_ACCESSES = [
  {
    id: 'h1', image_id: 'img_001',
    image_description: 'Vacances Nice 2025 🌊',
    preview_uri: 'https://picsum.photos/seed/beach/80/80',
    viewer: 'khakfa_youssef', date: '2 mars · 14h23', type: 'app',
  },
  {
    id: 'h2', image_id: 'img_001',
    image_description: 'Vacances Nice 2025 🌊',
    preview_uri: 'https://picsum.photos/seed/beach/80/80',
    viewer: 'chammakhi_malak', date: '4 mars · 09h11', type: 'app',
  },
  {
    id: 'h3', image_id: 'img_001',
    image_description: 'Vacances Nice 2025 🌊',
    preview_uri: 'https://picsum.photos/seed/beach/80/80',
    viewer: 'inconnu_device_3F2A', date: '5 mars · 22h04', type: 'watermark',
  },
  {
    id: 'h4', image_id: 'img_002',
    image_description: 'Randonnée Vercors 🌲',
    preview_uri: 'https://picsum.photos/seed/forest/80/80',
    viewer: 'krid_amani', date: '5 mars · 11h30', type: 'app',
  },
];

// Images que j'ai accédées
const MOCK_MY_ACCESSES = [
  {
    id: 'a1', image_id: 'img_010',
    image_description: 'Conférence Paris 2025 📊',
    preview_uri: 'https://picsum.photos/seed/conf/80/80',
    owner: 'khakfa_youssef', date: '16 fév. · 10h05',
  },
  {
    id: 'a2', image_id: 'img_012',
    image_description: 'Prototype V2 🔧',
    preview_uri: 'https://picsum.photos/seed/tech/80/80',
    owner: 'chammakhi_malak', date: '6 mars · 15h40',
  },
];

function TypeBadge({ type, colors }) {
  const isWatermark = type === 'watermark';
  return (
    <View style={{
      borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 4,
      backgroundColor: isWatermark ? 'rgba(255,107,0,0.12)' : 'rgba(0,207,255,0.1)',
      borderWidth: 1,
      borderColor: isWatermark ? 'rgba(255,107,0,0.3)' : 'rgba(0,207,255,0.2)',
    }}>
      <Text style={{
        fontSize: 9, fontWeight: '700', fontFamily: 'Courier New',
        color: isWatermark ? colors.accent : colors.cyan,
      }}>
        {isWatermark ? '🖼️ FILIGRANE' : '👁 APP'}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const [tab, setTab] = useState('my_images');

  const data = tab === 'my_images' ? MOCK_MY_IMAGE_ACCESSES : MOCK_MY_ACCESSES;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Segment */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row', backgroundColor: colors.surface,
          borderRadius: Radius.full, padding: 3,
        }}>
          {[['my_images', 'Mes images'], ['my_access', 'Mon accès']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[{ flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center' },
                tab === key && { backgroundColor: colors.card }]}
              onPress={() => setTab(key)}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: tab === key ? colors.textPri : colors.textSec }}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          tab === 'my_images' ? (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{
                backgroundColor: 'rgba(0,207,255,0.06)', borderWidth: 1,
                borderColor: 'rgba(0,207,255,0.15)', borderRadius: Radius.md, padding: 12,
              }}>
                <Text style={{ fontSize: 11, color: colors.cyan, fontFamily: 'Courier New', lineHeight: 18 }}>
                  {'👁 APP — accès via Secugram (utilisateur autorisé)\n🖼️ FILIGRANE — détecté via tatouage numérique invisible'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
              <View style={{
                backgroundColor: 'rgba(255,107,0,0.06)', borderWidth: 1,
                borderColor: 'rgba(255,107,0,0.15)', borderRadius: Radius.md, padding: 12,
              }}>
                <Text style={{ fontSize: 11, color: colors.accent, fontFamily: 'Courier New', lineHeight: 18 }}>
                  Images consultées via Secugram lorsque vous étiez autorisé.{'\n'}Votre accès a été enregistré chez le propriétaire.
                </Text>
              </View>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            borderRadius: Radius.lg, marginHorizontal: 16, marginBottom: 10, overflow: 'hidden',
          }}>
            <Image source={{ uri: item.preview_uri }} style={{ width: 64, height: 64, resizeMode: 'cover' }}/>
            <View style={{ flex: 1, padding: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPri, marginBottom: 3 }} numberOfLines={1}>
                {item.image_description}
              </Text>
              {tab === 'my_images' ? (
                <Text style={{ fontSize: 12, color: colors.textSec, marginBottom: 5 }}>
                  {item.type === 'watermark' ? '⚠ Accès non autorisé — ' : 'Consulté par '}
                  <Text style={{ fontWeight: '500', color: item.type === 'watermark' ? colors.accent : colors.textPri }}>
                    {item.viewer}
                  </Text>
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textSec, marginBottom: 5 }}>
                  De : <Text style={{ fontWeight: '500', color: colors.textPri }}>{item.owner}</Text>
                </Text>
              )}
              <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New' }}>{item.date}</Text>
            </View>
            {tab === 'my_images' && (
              <View style={{ paddingRight: 12 }}>
                <TypeBadge type={item.type} colors={colors}/>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 52, marginBottom: 16 }}>📋</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPri, marginBottom: 8 }}>
              Aucun historique
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
