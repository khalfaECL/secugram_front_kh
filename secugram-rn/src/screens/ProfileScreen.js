import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, StyleSheet,
} from 'react-native';
import { Radius, Spacing } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

// ── Editable Row ──────────────────────────────────────────────────────────────

function EditableRow({ label, value, onSave, secret, colors }) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState(value);

  const handleSave = () => {
    if (!draft.trim()) return;
    onSave(draft.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <View style={{
      backgroundColor: colors.card, borderWidth: 1, borderColor: editing ? colors.accent : colors.border,
      borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    }}>
      <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New', letterSpacing: 1.5, marginBottom: 6 }}>
        {label}
      </Text>
      {editing ? (
        <View>
          <TextInput
            style={{
              fontSize: 15, color: colors.textPri,
              borderBottomWidth: 1, borderBottomColor: colors.accent,
              paddingVertical: 4, marginBottom: 12,
            }}
            value={draft}
            onChangeText={setDraft}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={secret}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: 9, borderRadius: Radius.md,
                backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
                alignItems: 'center',
              }}
              onPress={handleCancel}
            >
              <Text style={{ fontSize: 13, color: colors.textSec, fontWeight: '500' }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: 9, borderRadius: Radius.md,
                backgroundColor: colors.accent, alignItems: 'center',
              }}
              onPress={handleSave}
            >
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 15, color: colors.textPri, fontWeight: '500' }}>
            {secret ? '••••••••' : value}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface, borderRadius: Radius.md,
              paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={() => setEditing(true)}
          >
            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>Modifier</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Read-only Row ─────────────────────────────────────────────────────────────

function ReadOnlyRow({ label, value, green, colors }) {
  return (
    <View style={{
      backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
      borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    }}>
      <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New', letterSpacing: 1.5, marginBottom: 6 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: green ? colors.success : colors.textPri, fontFamily: 'Courier New' }}>
        {value}
      </Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { session, logout } = useAuth();
  const { colors, isDark, toggleTheme, viewCooldown, setViewCooldown, COOLDOWN_MIN, COOLDOWN_MAX } = useTheme();

  const [displayName, setDisplayName] = useState(session?.username ?? '');
  const [email,       setEmail]       = useState('alice@secugram.io');

  const initials = (displayName || 'U').slice(0, 2).toUpperCase();

  const handleChangePassword = (newPassword) => {
    // En mode démo, juste confirmer visuellement
    Alert.alert('Mot de passe', 'Mot de passe mis à jour avec succès.');
  };

  const confirmLogout = () => {
    Alert.alert('Déconnexion', 'La session sera effacée de la mémoire.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logout(session?.token) },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + nom */}
      <View style={{
        alignItems: 'center', paddingTop: 28, paddingBottom: 24,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
      }}>
        <View style={{
          width: 88, height: 88, borderRadius: 44,
          borderWidth: 2.5, borderColor: colors.accent,
          alignItems: 'center', justifyContent: 'center', marginBottom: 14,
          shadowColor: colors.accent, shadowOpacity: 0.35, shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 }, elevation: 10,
        }}>
          <View style={{
            width: 78, height: 78, borderRadius: 39,
            backgroundColor: colors.accentDim,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 26, fontWeight: '800', color: colors.accent }}>{initials}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 19, fontWeight: '700', color: colors.textPri, marginBottom: 2 }}>
          {displayName}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSec, fontFamily: 'Courier New' }}>
          {email}
        </Text>
      </View>

      {/* Informations personnelles */}
      <View style={{ padding: Spacing.lg }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
          INFORMATIONS PERSONNELLES
        </Text>

        <EditableRow
          label="NOM D'UTILISATEUR"
          value={displayName}
          onSave={setDisplayName}
          colors={colors}
        />
        <EditableRow
          label="ADRESSE EMAIL"
          value={email}
          onSave={setEmail}
          colors={colors}
        />
      </View>

      {/* Coordonnées de connexion */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
          COORDONNÉES DE CONNEXION
        </Text>

        <ReadOnlyRow
          label="IDENTIFIANT"
          value={displayName}
          colors={colors}
        />
        <EditableRow
          label="MOT DE PASSE"
          value="demo1234"
          onSave={handleChangePassword}
          secret
          colors={colors}
        />
      </View>

      {/* Session */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
          SESSION ACTIVE
        </Text>
        <ReadOnlyRow label="USER ID"   value={session?.userId ?? '—'} colors={colors}/>
        <ReadOnlyRow label="STOCKAGE"  value="Mémoire vive · Non persistant" green colors={colors}/>
        <ReadOnlyRow label="TOKEN"     value={`${session?.token?.slice(0, 22)}…`} colors={colors}/>
      </View>

      {/* Préférences */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 14 }}>
          PRÉFÉRENCES
        </Text>
        {/* Thème */}
        <View style={{
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
          borderRadius: Radius.lg, padding: 14, marginBottom: 10,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPri, marginBottom: 2 }}>Thème</Text>
            <Text style={{ fontSize: 11, color: colors.textSec }}>
              {isDark ? 'Mode sombre activé' : 'Mode clair activé'}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface, borderRadius: Radius.full,
              paddingHorizontal: 16, paddingVertical: 8,
              borderWidth: 1, borderColor: colors.border,
            }}
            onPress={toggleTheme} activeOpacity={0.8}
          >
            <Text style={{ fontSize: 15 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>

        {/* Intervalle entre visualisations */}
        <View style={{
          backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
          borderRadius: Radius.lg, padding: 14,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPri, marginBottom: 2 }}>
                🕐  Intervalle entre vues
              </Text>
              <Text style={{ fontSize: 11, color: colors.textSec }}>
                Délai minimum entre deux accès à la même image
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.accentDim, borderRadius: Radius.md,
              paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)',
            }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.accent }}>
                {viewCooldown}min
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: viewCooldown <= COOLDOWN_MIN ? colors.surface : colors.accent,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: viewCooldown <= COOLDOWN_MIN ? colors.border : colors.accent,
              }}
              onPress={() => setViewCooldown(viewCooldown - 1)}
              disabled={viewCooldown <= COOLDOWN_MIN}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: viewCooldown <= COOLDOWN_MIN ? colors.textMut : '#fff' }}>−</Text>
            </TouchableOpacity>

            <View style={{ flex: 1, height: 6, backgroundColor: colors.surface, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                height: '100%', borderRadius: 3, backgroundColor: colors.accent,
                width: `${((viewCooldown - COOLDOWN_MIN) / (COOLDOWN_MAX - COOLDOWN_MIN)) * 100}%`,
              }}/>
            </View>

            <TouchableOpacity
              style={{
                width: 40, height: 40, borderRadius: Radius.md,
                backgroundColor: viewCooldown >= COOLDOWN_MAX ? colors.surface : colors.accent,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: viewCooldown >= COOLDOWN_MAX ? colors.border : colors.accent,
              }}
              onPress={() => setViewCooldown(viewCooldown + 1)}
              disabled={viewCooldown >= COOLDOWN_MAX}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20, fontWeight: '700', color: viewCooldown >= COOLDOWN_MAX ? colors.textMut : '#fff' }}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New', textAlign: 'center', marginTop: 10 }}>
            Spectre autorisé : {COOLDOWN_MIN}min — {COOLDOWN_MAX}min
          </Text>
        </View>
      </View>

      {/* Déconnexion */}
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <TouchableOpacity
          style={{
            backgroundColor: 'rgba(255,69,58,0.07)', borderWidth: 1,
            borderColor: 'rgba(255,69,58,0.2)', borderRadius: Radius.xl,
            paddingVertical: 15, alignItems: 'center', marginBottom: 8,
          }}
          onPress={confirmLogout} activeOpacity={0.8}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.danger }}>🚪  Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 10, color: colors.textMut, textAlign: 'center', fontFamily: 'Courier New' }}>
          La session sera définitivement effacée de la mémoire.
        </Text>
      </View>
    </ScrollView>
  );
}
