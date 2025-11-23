// src/screens/Groups/EditGroupScreen.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, SafeAreaView, StatusBar, Platform, Dimensions,
  TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getGroup, updateGroup } from './api/groupsApi';
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

export default function EditGroupScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { groupId, preGroup } = route.params || {};

  const [loading, setLoading] = useState(!preGroup);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(preGroup?.name || '');
  const [desc, setDesc] = useState(preGroup?.description || '');
  const [isPublic, setIsPublic] = useState(Boolean(preGroup?.is_public));

  // ✅ частицы мемоизированы — не дергаются на каждом рендере
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

  useEffect(() => {
    if (preGroup) return;
    let active = true;

    (async () => {
      setLoading(true);
      try {
        const g = await getGroup(groupId);
        if (!active) return;
        setName(g?.name || '');
        setDesc(g?.description || '');
        setIsPublic(Boolean(g?.is_public));
      } catch (e) {
        Alert.alert(t('groups.edit.alerts.errorTitle'), t('groups.edit.alerts.groupNotFound'));
        navigation.goBack();
      } finally {
        active && setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [groupId, preGroup, navigation, t]);

  const handleSave = useCallback(async () => {
    const nm = name.trim();
    if (!nm) {
      Alert.alert(t('groups.edit.alerts.validationTitle'), t('groups.edit.alerts.nameRequired'));
      return;
    }

    setSaving(true);
    try {
      const updated = await updateGroup(groupId, {
        name: nm,
        description: desc.trim(),
        is_public: Boolean(isPublic),
      });

      // обновляем параметры GroupDetails и возвращаемся
      navigation.navigate({
        name: 'GroupDetails',
        params: {
          groupId: updated.id,
          preGroup: updated,
          __refreshAt: Date.now(),
        },
        merge: true,
      });

      navigation.goBack();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        t('groups.edit.alerts.updateFail');

      Alert.alert(t('groups.edit.alerts.errorTitle'), msg);
    } finally {
      setSaving(false);
    }
  }, [name, desc, isPublic, groupId, navigation, t]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex:1 }}
      >
        {/* Particles */}
        <View style={{ position:'absolute', width, height }} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={{
                position:'absolute',
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
        <View style={{
          height:60, justifyContent:'center', alignItems:'center',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          borderBottomWidth:1, borderBottomColor: COLORS.headerBorder
        }}>
          <Text style={{ color: COLORS.textPrimary, fontSize:18, fontWeight:'bold', letterSpacing:1 }}>
            {t('groups.edit.header.title')}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ position:'absolute', left:15, top: 18 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
              {t('common.loading')}
            </Text>
          </View>
        ) : (
          <View style={{ flex:1, padding: 15 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>
              {t('groups.edit.fields.name')}
            </Text>
            <TextInput
              style={{
                backgroundColor: COLORS.inputBackground,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.borderBlue,
                color: COLORS.textPrimary,
                paddingHorizontal: 12,
                paddingVertical: 10
              }}
              placeholder={t('groups.edit.placeholders.name')}
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={setName}
            />

            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6, marginTop: 12 }}>
              {t('groups.edit.fields.description')}
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
                minHeight: 90
              }}
              placeholder={t('groups.edit.placeholders.description')}
              placeholderTextColor={COLORS.placeholder}
              value={desc}
              onChangeText={setDesc}
              multiline
            />

            <View style={{ flexDirection:'row', alignItems:'center', marginTop: 12 }}>
              <Text style={{ color: COLORS.textSecondary, marginRight: 10 }}>
                {t('groups.edit.fields.public')}
              </Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                marginTop: 18,
                alignSelf:'flex-start',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 22,
                backgroundColor: saving ? '#5f7191' : COLORS.accentBlue
              }}
            >
              <Text style={{ color: '#080b20', fontWeight: '700' }}>
                {saving ? t('groups.edit.buttons.saving') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
