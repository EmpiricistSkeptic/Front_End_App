// src/screens/Groups/CreateGroupScreen.js
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createGroup, getGroup } from './api/groupsApi';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const COLORS = {
  backgroundGradientStart: '#121539',
  backgroundGradientEnd: '#080b20',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  particle: '#4dabf7',
  headerBorder: 'rgba(77, 171, 247, 0.3)',
  inputBackground: 'rgba(16, 20, 45, 0.9)',
};

export default function CreateGroupScreen({ navigation }) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ мемоизированные частицы
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  const pickErrorMessage = useCallback(
    (err) => {
      if (err?.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string') return data;
        if (data.detail) return String(data.detail);

        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const v = data[firstKey];
          if (Array.isArray(v)) return `${firstKey}: ${v[0]}`;
          return `${firstKey}: ${String(v)}`;
        }
      }
      return err?.message || t('groups.create.alerts.createFailDefault');
    },
    [t]
  );

  const handleCreate = useCallback(async () => {
    const nm = name.trim();
    if (!nm) {
      Alert.alert(
        t('groups.create.alerts.validationTitle'),
        t('groups.create.alerts.nameRequired')
      );
      return;
    }

    setSaving(true);
    try {
      const created = await createGroup({
        name: nm,
        description: desc.trim(),
        is_public: Boolean(isPublic),
      });

      // подтягиваем детальные поля (is_member, members_count)
      let detailed;
      try {
        detailed = await getGroup(created.id);
      } catch {
        detailed = { ...created, is_member: true, members_count: 1 };
      }

      navigation.replace('GroupDetails', {
        groupId: created.id,
        preGroup: detailed,
      });
    } catch (e) {
      console.log(
        'create group error:',
        e?.response?.status,
        e?.response?.data || e?.message
      );
      Alert.alert(t('groups.create.alerts.errorTitle'), pickErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }, [name, desc, isPublic, navigation, t, pickErrorMessage]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* Particles */}
        <View style={{ position: 'absolute', width, height }} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                opacity: p.opacity,
                backgroundColor: COLORS.particle,
                borderRadius: 50,
              }}
            />
          ))}
        </View>

        {/* Header */}
        <View
          style={{
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.headerBorder,
          }}
        >
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            {t('groups.create.header.title')}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position: 'absolute', left: 15, top: 18 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, padding: 15 }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>
            {t('groups.create.fields.name')}
          </Text>
          <TextInput
            style={{
              backgroundColor: COLORS.inputBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              color: COLORS.textPrimary,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
            placeholder={t('groups.create.placeholders.name')}
            placeholderTextColor={COLORS.placeholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              marginBottom: 6,
              marginTop: 12,
            }}
          >
            {t('groups.create.fields.description')}
          </Text>
          <TextInput
            style={{
              backgroundColor: COLORS.inputBackground,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              color: COLORS.textPrimary,
              paddingHorizontal: 12,
              paddingVertical: 10,
              minHeight: 90,
            }}
            placeholder={t('groups.create.placeholders.description')}
            placeholderTextColor={COLORS.placeholder}
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: COLORS.textSecondary, marginRight: 10 }}>
              {t('groups.create.fields.public')}
            </Text>
            <Switch value={isPublic} onValueChange={setIsPublic} />
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            style={{
              marginTop: 18,
              alignSelf: 'flex-start',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 22,
              backgroundColor: saving ? '#5f7191' : COLORS.accentBlue,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#080b20" style={{ marginRight: 8 }} />
                <Text style={{ color: '#080b20', fontWeight: '700' }}>
                  {t('groups.create.buttons.creating')}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#080b20', fontWeight: '700' }}>
                {t('groups.create.buttons.create')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
