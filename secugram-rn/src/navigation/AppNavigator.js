import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal, ScrollView } from 'react-native';
import { Radius } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

import LoginScreen    from '../screens/LoginScreen';
import MyPhotosScreen from '../screens/MyPhotosScreen';
import FeedScreen     from '../screens/FeedScreen';
import SharedScreen   from '../screens/SharedScreen';
import HistoryScreen  from '../screens/HistoryScreen';
import ProfileScreen  from '../screens/ProfileScreen';

const TABS = [
  { label: 'Mes images', type: 'images',  title: 'Mes images' },
  { label: 'Feed',       type: 'feed',    title: 'Feed' },
  { label: 'Partagées',  type: 'shared',  title: 'Partagées avec moi' },
  { label: 'Historique', type: 'history', title: 'Historique' },
  { label: 'Profil',     type: 'profile', title: 'Mon profil' },
];

// ── Tab icons — pure View geometry, no emoji ───────────────────────────────

function TabIcon({ type, color, size = 20 }) {
  const sq = Math.round(size * 0.42);
  if (type === 'images') {
    return (
      <View style={{ width: size, height: size, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: sq, height: sq, borderRadius: 2.5, backgroundColor: color }}/>
          <View style={{ width: sq, height: sq, borderRadius: 2.5, backgroundColor: color }}/>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: sq, height: sq, borderRadius: 2.5, backgroundColor: color }}/>
          <View style={{ width: sq, height: sq, borderRadius: 2.5, backgroundColor: color }}/>
        </View>
      </View>
    );
  }
  if (type === 'shared') {
    // Lock silhouette: arch + body
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View style={{
          width: size * 0.48, height: size * 0.34,
          borderTopWidth: Math.ceil(size * 0.14),
          borderLeftWidth: Math.ceil(size * 0.14),
          borderRightWidth: Math.ceil(size * 0.14),
          borderTopLeftRadius: size * 0.24,
          borderTopRightRadius: size * 0.24,
          borderColor: color,
          marginBottom: -1,
        }}/>
        <View style={{
          width: size * 0.78, height: size * 0.46,
          backgroundColor: color, borderRadius: Math.round(size * 0.1),
          alignItems: 'center', justifyContent: 'center',
        }}>
          <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size, backgroundColor: 'rgba(255,255,255,0.38)' }}/>
        </View>
      </View>
    );
  }
  if (type === 'feed') {
    // Grid 2x2 with center dot — "feed" feel
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: size * 0.78, height: size * 0.78, borderWidth: Math.ceil(size * 0.1), borderColor: color, borderRadius: size * 0.15 }}/>
        <View style={{ position: 'absolute', width: size * 0.14, height: size * 0.14, borderRadius: size, backgroundColor: color }}/>
      </View>
    );
  }
  if (type === 'history') {
    // Three tapering bars — timeline / log feel
    const h = Math.round(size * 0.13);
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', gap: Math.round(size * 0.19) }}>
        <View style={{ width: size,        height: h, borderRadius: 4, backgroundColor: color }}/>
        <View style={{ width: size * 0.7,  height: h, borderRadius: 4, backgroundColor: color }}/>
        <View style={{ width: size * 0.42, height: h, borderRadius: 4, backgroundColor: color }}/>
      </View>
    );
  }
  // profile — head circle + shoulder arc
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', gap: Math.round(size * 0.07) }}>
      <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size, backgroundColor: color }}/>
      <View style={{ width: size * 0.74, height: size * 0.28, borderTopLeftRadius: size * 0.37, borderTopRightRadius: size * 0.37, backgroundColor: color }}/>
    </View>
  );
}

// ── Brand mark — lock icon + wordmark ─────────────────────────────────────

function BrandMark({ colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
      {/* Icon tile */}
      <View style={{
        width: 36, height: 36, borderRadius: 11,
        backgroundColor: colors.accent,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Lock shape in white */}
        <View style={{ alignItems: 'center', justifyContent: 'flex-end', width: 20, height: 20 }}>
          <View style={{
            width: 10, height: 6.5,
            borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5,
            borderTopLeftRadius: 5, borderTopRightRadius: 5,
            borderColor: 'rgba(255,255,255,0.95)',
            marginBottom: -1,
          }}/>
          <View style={{
            width: 15, height: 9.5, borderRadius: 2.5,
            backgroundColor: 'rgba(255,255,255,0.95)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.accent }}/>
          </View>
        </View>
      </View>
      {/* Wordmark */}
      <View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.textPri, letterSpacing: 2.5, lineHeight: 18 }}>
          SECUGRAM
        </Text>
        <Text style={{ fontSize: 8, fontWeight: '600', color: colors.accent, letterSpacing: 1.5 }}>
          SECURE VAULT
        </Text>
      </View>
    </View>
  );
}

const SCREENS = [MyPhotosScreen, FeedScreen, SharedScreen, HistoryScreen, ProfileScreen];

// ── Info Menu ─────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  {
    key: 'about',
    label: 'À propos',
    icon: 'ℹ',
    title: 'À propos de Secugram',
    content: `Secugram est une application de partage sécurisé d'images.\n\nVersion  1.0.0\nPlateforme  Android\nChiffrement  AES-256\n\nConçue pour protéger vos contenus visuels sensibles grâce à un système d'autorisations explicites, d'accès éphémères et de traçabilité complète.`,
  },
  {
    key: 'aide',
    label: 'Aide',
    icon: '?',
    title: 'Aide & FAQ',
    content: `❓ Comment déposer une image ?\nAppuyez sur « Déposer une image » depuis l'onglet Mes images, puis définissez les personnes autorisées.\n\n❓ Qu'est-ce qu'une image éphémère ?\nUne image partagée s'affiche pendant un temps limité (1–10 s), configurable dans votre profil. Elle se ferme automatiquement et l'accès est enregistré.\n\n❓ Que signifie FILIGRANE dans l'historique ?\nCela signifie que l'image a été vue en dehors de Secugram — le tatouage numérique invisible a été détecté sur un autre appareil.\n\n❓ Les images sont-elles stockées localement ?\nNon. Aucune image n'est conservée sur votre appareil. Elles sont chiffrées côté serveur.`,
  },
  {
    key: 'rules',
    label: 'Règles de sécurité',
    icon: '🛡',
    title: 'Règles de sécurité des données',
    content: `🔒 Chiffrement\nToutes les images sont chiffrées avec AES-256 avant stockage. Les clés ne transitent jamais en clair.\n\n👁 Traçabilité\nChaque accès à une image partagée est enregistré : date, heure, identifiant du viewer.\n\n📵 Captures d'écran\nLes captures d'écran et enregistrements d'écran sont bloqués nativement sur Android (FLAG_SECURE).\n\n🧠 Sessions éphémères\nLes sessions JWT sont conservées en mémoire vive uniquement — aucun token n'est écrit sur le disque.\n\n🚫 Zéro copie locale\nLes images partagées ne sont jamais mises en cache ni sauvegardées sur l'appareil du destinataire.`,
  },
];

function InfoMenuModal({ visible, onClose, colors }) {
  const [detail, setDetail] = useState(null);

  const handleClose = () => {
    setDetail(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-start', alignItems: 'flex-end' }}
        activeOpacity={1}
        onPress={handleClose}
      />
      <View style={{
        position: 'absolute',
        top: Platform.OS === 'android' ? 58 : 54,
        right: 14,
        backgroundColor: colors.card,
        borderRadius: Radius.lg,
        borderWidth: 1, borderColor: colors.border,
        minWidth: 210,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
        overflow: 'hidden',
      }}>
        {detail ? (
          /* Detail view */
          <View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
              onPress={() => setDetail(null)}
            >
              <Text style={{ fontSize: 14, color: colors.accent }}>‹</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPri }}>{detail.title}</Text>
            </TouchableOpacity>
            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ padding: 14 }}>
              <Text style={{ fontSize: 12, color: colors.textSec, lineHeight: 20, fontFamily: 'Courier New' }}>
                {detail.content}
              </Text>
            </ScrollView>
          </View>
        ) : (
          /* Menu list */
          MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.key}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < MENU_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
                borderBottomColor: colors.border,
              }}
              onPress={() => setDetail(item)}
              activeOpacity={0.7}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: colors.accentDim,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: 13, color: colors.accent }}>{item.icon}</Text>
              </View>
              <Text style={{ fontSize: 14, color: colors.textPri, fontWeight: '500', flex: 1 }}>{item.label}</Text>
              <Text style={{ fontSize: 14, color: colors.textMut }}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </Modal>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({ username }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (username || 'U').slice(0, 2).toUpperCase();
  return (
    <>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 18,
        paddingTop: Platform.OS === 'android' ? 14 : 10,
        paddingBottom: 12,
        backgroundColor: colors.bg,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}>
        <BrandMark colors={colors}/>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface, borderRadius: Radius.full,
              paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={toggleTheme} activeOpacity={0.8}
          >
            <Text style={{ fontSize: 13 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <View style={{
            width: 34, height: 34, borderRadius: 17,
            borderWidth: 2, borderColor: colors.accent,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.accentDim,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>{initials}</Text>
          </View>
          <TouchableOpacity
            style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
            }}
            onPress={() => setMenuOpen(true)}
            activeOpacity={0.75}
          >
            <Text style={{ fontSize: 11, color: colors.textSec, fontWeight: '700', lineHeight: 13 }}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>
      <InfoMenuModal visible={menuOpen} onClose={() => setMenuOpen(false)} colors={colors}/>
    </>
  );
}

// ── Tab Bar ───────────────────────────────────────────────────────────────────

function TabBar({ active, onPress }) {
  const { colors } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
      paddingTop: 10,
    }}>
      {TABS.map((t, i) => (
        <TouchableOpacity
          key={i}
          style={{ flex: 1, alignItems: 'center', gap: 3 }}
          onPress={() => onPress(i)}
          activeOpacity={0.7}
        >
          <View style={{
            width: 44, height: 30, alignItems: 'center', justifyContent: 'center',
            borderRadius: Radius.sm,
            backgroundColor: active === i ? colors.accentDim : 'transparent',
          }}>
            <TabIcon
              type={t.type}
              color={active === i ? colors.accent : colors.textMut}
            />
          </View>
          <Text style={{
            fontSize: 9, letterSpacing: 0.2,
            fontWeight: active === i ? '700' : '400',
            color: active === i ? colors.accent : colors.textSec,
          }}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const { session } = useAuth();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState(0);

  if (!session) return <LoginScreen/>;

  const Screen = SCREENS[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Header username={session.username}/>
      <View style={{ flex: 1 }}>
        <Screen/>
      </View>
      <TabBar active={activeTab} onPress={setActiveTab}/>
    </View>
  );
}
