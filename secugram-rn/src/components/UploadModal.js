import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView,
  TouchableOpacity, Image, FlatList, TextInput,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Radius, Spacing } from '../theme';
import { PrimaryButton, SecondaryButton, SectionLabel, Chip, Avatar, ErrorBox } from './UI';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import * as API from '../api';

const STEPS = { IMAGE: 1, AUTH: 2, UPLOADING: 3, DONE: 4 };

export default function UploadModal({ visible, onClose, onSuccess, users }) {
  const { session } = useAuth();
  const { colors } = useTheme();

  const [step,              setStep]              = useState(STEPS.IMAGE);
  const [image,             setImage]             = useState(null);
  const [desc,              setDesc]              = useState('');
  const [selected,          setSelected]          = useState([]);
  const [progress,          setProgress]          = useState(0);
  const [error,             setError]             = useState('');
  const [uploadedId,        setUploadedId]        = useState(null);
  const [ephemeralDuration, setEphemeralDuration] = useState(5);  // 1–10 s
  const [maxViews,          setMaxViews]          = useState(3);   // 1–20

  const EPHEM_MIN = 1; const EPHEM_MAX = 10;
  const VIEWS_MIN = 1; const VIEWS_MAX = 20;

  const reset = () => {
    setStep(STEPS.IMAGE); setImage(null); setDesc('');
    setSelected([]); setProgress(0); setError(''); setUploadedId(null);
    setEphemeralDuration(5); setMaxViews(3);
  };

  const handleClose = () => { reset(); onClose(); };

  const pickImage = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo', includeBase64: true, quality: 0.85,
      maxWidth: 1920, maxHeight: 1920,
    });
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (asset) setImage({ uri: asset.uri, base64: asset.base64, fileName: asset.fileName });
  }, []);

  const toggleUser = (username) =>
    setSelected(s => s.includes(username) ? s.filter(u => u !== username) : [...s, username]);

  const handleUpload = async () => {
    setError('');
    setStep(STEPS.UPLOADING);
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 8, 90));
    }, 200);
    try {
      let imageId;
      if (session.isDemo) {
        // Mode démo : simulation locale, pas d'appel API
        await new Promise(r => setTimeout(r, 1800));
        imageId = `demo_${Date.now()}`;
      } else {
        const result = await API.uploadPhoto(
          session.token,
          {
            imageAsset:        image,   // { uri, fileName, type }
            description:       desc,
            authorizedUsers:   selected,
            ephemeralDuration,
            maxViews,
          },
          session,                      // { userId, username } requis par le TdC
        );
        imageId = result.image_id;
      }
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setUploadedId(imageId);
      setStep(STEPS.DONE);
    } catch (e) {
      clearInterval(progressInterval);
      setError(e.message || "Erreur lors de l'upload.");
      setStep(STEPS.AUTH);
    }
  };

  const renderImageStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionLabel label="Sélectionner une image"/>
      <TouchableOpacity
        style={{
          borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
          borderRadius: Radius.lg, overflow: 'hidden', marginBottom: 12,
          backgroundColor: colors.surface,
        }}
        onPress={pickImage} activeOpacity={0.8}
      >
        {image
          ? <Image source={{ uri: image.uri }} style={{ width: '100%', height: 180, resizeMode: 'cover' }}/>
          : <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📷</Text>
              <Text style={{ fontSize: 14, color: colors.textSec, marginBottom: 4 }}>Appuyer pour choisir</Text>
              <Text style={{ fontSize: 11, color: colors.textMut, fontFamily: 'Courier New' }}>JPG · PNG · WEBP</Text>
            </View>
        }
      </TouchableOpacity>

      {image && (
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 16 }} onPress={pickImage}>
          <Text style={{ fontSize: 12, color: colors.accent, fontFamily: 'Courier New' }}>Changer l'image</Text>
        </TouchableOpacity>
      )}

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 1.5, marginBottom: 6 }}>
          DESCRIPTION (OPTIONNEL)
        </Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 14,
        }}>
          <Text style={{ fontSize: 16, marginRight: 10 }}>📝</Text>
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.textPri }}
            value={desc}
            onChangeText={setDesc}
            placeholder="Vacances Nice 2025..."
            placeholderTextColor={colors.textMut}
            autoCorrect={false}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 8 }}>
        <SecondaryButton label="Annuler" icon="✕" onPress={handleClose} style={{ flex: 0.4 }}/>
        <PrimaryButton label="Suivant" icon="🔐" onPress={() => setStep(STEPS.AUTH)} disabled={!image} style={{ flex: 1, marginLeft: 10 }}/>
      </View>
    </ScrollView>
  );

  const [manualInput, setManualInput] = React.useState('');

  const addManualUser = () => {
    const u = manualInput.trim().toLowerCase();
    if (!u || selected.includes(u)) { setManualInput(''); return; }
    setSelected(s => [...s, u]);
    setManualInput('');
  };

  const renderAuthStep = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <SectionLabel label="Qui peut voir cette image ?"/>
      <ErrorBox message={error}/>

      {/* Invite manuelle par identifiant */}
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
          value={manualInput}
          onChangeText={setManualInput}
          autoCapitalize="none"
          autoCorrect={false}
          onSubmitEditing={addManualUser}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={{
            backgroundColor: manualInput.trim() ? colors.accent : colors.border,
            borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 6,
          }}
          onPress={addManualUser} disabled={!manualInput.trim()}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+</Text>
        </TouchableOpacity>
      </View>

      {selected.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
          {selected.map(u => <Chip key={u} label={u} onRemove={() => toggleUser(u)}/>)}
        </View>
      )}
      <FlatList
        data={users.filter(u => u.username !== session?.username)}
        keyExtractor={u => u.user_id || u.username}
        scrollEnabled={false}
        renderItem={({ item: u }) => {
          const isSelected = selected.includes(u.username);
          return (
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: isSelected ? colors.accentDim : colors.surface,
                borderWidth: 1, borderColor: isSelected ? colors.accent : colors.border,
                borderRadius: Radius.lg, padding: 12,
              }}
              onPress={() => toggleUser(u.username)} activeOpacity={0.8}
            >
              <Avatar initials={(u.username || 'U').slice(0, 2).toUpperCase()} size={42} radius={14}/>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPri, marginBottom: 2 }}>
                  {u.display || u.username}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSec, fontFamily: 'Courier New' }}>@{u.username}</Text>
              </View>
              <View style={{
                width: 24, height: 24, borderRadius: 7, borderWidth: 2,
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? colors.accent : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }}/>}
        style={{ marginBottom: 20 }}
      />
      {/* ── Paramètres de sécurité ── */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 10, color: colors.textSec, fontFamily: 'Courier New', letterSpacing: 2, marginBottom: 12 }}>
          PARAMÈTRES DE SÉCURITÉ
        </Text>

        {/* Ephemeral duration */}
        <View style={{
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          borderRadius: Radius.lg, padding: 14, marginBottom: 10,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPri }}>⏱  Durée d'affichage</Text>
              <Text style={{ fontSize: 11, color: colors.textSec, marginTop: 2 }}>Secondes avant fermeture auto</Text>
            </View>
            <View style={{
              backgroundColor: colors.accentDim, borderRadius: Radius.md,
              paddingHorizontal: 10, paddingVertical: 4,
              borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.accent }}>{ephemeralDuration}s</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: ephemeralDuration <= EPHEM_MIN ? colors.surface : colors.accent,
                borderWidth: 1, borderColor: ephemeralDuration <= EPHEM_MIN ? colors.border : colors.accent,
              }}
              onPress={() => setEphemeralDuration(v => Math.max(EPHEM_MIN, v - 1))}
              disabled={ephemeralDuration <= EPHEM_MIN}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: ephemeralDuration <= EPHEM_MIN ? colors.textMut : '#fff' }}>−</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                height: '100%', borderRadius: 3, backgroundColor: colors.accent,
                width: `${((ephemeralDuration - EPHEM_MIN) / (EPHEM_MAX - EPHEM_MIN)) * 100}%`,
              }}/>
            </View>
            <TouchableOpacity
              style={{
                width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: ephemeralDuration >= EPHEM_MAX ? colors.surface : colors.accent,
                borderWidth: 1, borderColor: ephemeralDuration >= EPHEM_MAX ? colors.border : colors.accent,
              }}
              onPress={() => setEphemeralDuration(v => Math.min(EPHEM_MAX, v + 1))}
              disabled={ephemeralDuration >= EPHEM_MAX}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: ephemeralDuration >= EPHEM_MAX ? colors.textMut : '#fff' }}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New', textAlign: 'center', marginTop: 8 }}>
            Spectre autorisé : {EPHEM_MIN}s — {EPHEM_MAX}s
          </Text>
        </View>

        {/* Max views */}
        <View style={{
          backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
          borderRadius: Radius.lg, padding: 14,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPri }}>👁  Nb. de visualisations</Text>
              <Text style={{ fontSize: 11, color: colors.textSec, marginTop: 2 }}>Accès autorisés par personne</Text>
            </View>
            <View style={{
              backgroundColor: colors.accentDim, borderRadius: Radius.md,
              paddingHorizontal: 10, paddingVertical: 4,
              borderWidth: 1, borderColor: 'rgba(255,107,0,0.25)',
            }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.accent }}>{maxViews}×</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{
                width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: maxViews <= VIEWS_MIN ? colors.surface : colors.accent,
                borderWidth: 1, borderColor: maxViews <= VIEWS_MIN ? colors.border : colors.accent,
              }}
              onPress={() => setMaxViews(v => Math.max(VIEWS_MIN, v - 1))}
              disabled={maxViews <= VIEWS_MIN}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: maxViews <= VIEWS_MIN ? colors.textMut : '#fff' }}>−</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, height: 5, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
              <View style={{
                height: '100%', borderRadius: 3, backgroundColor: colors.accent,
                width: `${((maxViews - VIEWS_MIN) / (VIEWS_MAX - VIEWS_MIN)) * 100}%`,
              }}/>
            </View>
            <TouchableOpacity
              style={{
                width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
                backgroundColor: maxViews >= VIEWS_MAX ? colors.surface : colors.accent,
                borderWidth: 1, borderColor: maxViews >= VIEWS_MAX ? colors.border : colors.accent,
              }}
              onPress={() => setMaxViews(v => Math.min(VIEWS_MAX, v + 1))}
              disabled={maxViews >= VIEWS_MAX}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: maxViews >= VIEWS_MAX ? colors.textMut : '#fff' }}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 10, color: colors.textMut, fontFamily: 'Courier New', textAlign: 'center', marginTop: 8 }}>
            Limite : {VIEWS_MIN} — {VIEWS_MAX} visualisations
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 8 }}>
        <SecondaryButton label="Retour" icon="←" onPress={() => setStep(STEPS.IMAGE)} style={{ flex: 0.4 }}/>
        <PrimaryButton
          label={selected.length > 0 ? `Partager (${selected.length})` : 'Déposer'}
          icon="⬆️" onPress={handleUpload}
          style={{ flex: 1, marginLeft: 10 }}
        />
      </View>
    </ScrollView>
  );

  const renderUploadingStep = () => (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ fontSize: 48, marginBottom: 20 }}>⬆️</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPri, marginBottom: 6 }}>Sécurisation en cours...</Text>
      <Text style={{ fontSize: 13, color: colors.textSec, marginBottom: 20, fontFamily: 'Courier New' }}>
        Tatouage invisible · Chiffrement AES-256
      </Text>
      <View style={{ width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <View style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.accent, borderRadius: 4 }}/>
      </View>
      <Text style={{ fontSize: 12, color: colors.accent, fontFamily: 'Courier New', marginBottom: 16 }}>{progress}%</Text>
      {progress >= 50 && (
        <View style={{
          backgroundColor: 'rgba(0,207,255,0.08)', borderWidth: 1,
          borderColor: 'rgba(0,207,255,0.2)', borderRadius: Radius.md,
          paddingVertical: 10, paddingHorizontal: 18,
        }}>
          <Text style={{ color: colors.cyan, fontFamily: 'Courier New', fontSize: 12 }}>🔒  Clé AES-256 appliquée</Text>
        </View>
      )}
    </View>
  );

  const renderDoneStep = () => (
    <View style={{ alignItems: 'center', paddingVertical: 20 }}>
      <Text style={{ fontSize: 64, marginBottom: 16 }}>🎉</Text>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPri, marginBottom: 6 }}>Image sécurisée !</Text>
      <Text style={{ fontSize: 13, color: colors.textSec, fontFamily: 'Courier New', marginBottom: 10 }}>
        Tatouage invisible · Chiffrée AES-256
      </Text>
      {selected.length > 0 && (
        <Text style={{ fontSize: 13, color: colors.accent, fontFamily: 'Courier New', marginBottom: 8 }}>
          Partagée avec {selected.length} utilisateur{selected.length > 1 ? 's' : ''}
        </Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {selected.map(u => <Chip key={u} label={u}/>)}
      </View>
      <PrimaryButton
        label="Parfait !" icon="✓"
        onPress={() => {
          onSuccess({ imageId: uploadedId, uri: image?.uri, description: desc, authorized: selected, ephemeralDuration, maxViews });
          handleClose();
        }}
        style={{ marginTop: 28, width: '100%' }}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} activeOpacity={1} onPress={handleClose}/>
      <View style={{
        backgroundColor: colors.card,
        borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
        borderWidth: 1, borderColor: colors.border,
        maxHeight: '92%', paddingBottom: 32,
      }}>
        <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 16 }}/>
        <Text style={{
          fontSize: 20, fontWeight: '700', color: colors.textPri,
          paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: Spacing.md,
        }}>
          {step === STEPS.IMAGE     && '📸 Déposer une image'}
          {step === STEPS.AUTH      && "🔐 Autorisations d'accès"}
          {step === STEPS.UPLOADING && '⬆️  Envoi en cours...'}
          {step === STEPS.DONE      && '✅ Succès'}
        </Text>
        <View style={{ paddingHorizontal: Spacing.lg }}>
          {step === STEPS.IMAGE     && renderImageStep()}
          {step === STEPS.AUTH      && renderAuthStep()}
          {step === STEPS.UPLOADING && renderUploadingStep()}
          {step === STEPS.DONE      && renderDoneStep()}
        </View>
      </View>
    </Modal>
  );
}
