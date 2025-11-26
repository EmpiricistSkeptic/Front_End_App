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
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
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
  cardBackground: 'rgba(255, 255, 255, 0.05)',
};

export default function CreateGroupScreen({ navigation }) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Мемоизированные частицы
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

      // Подтягиваем детальные поля (is_member, members_count)
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
    <View style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* Particles Background */}
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

        {/* SafeAreaView для контента */}
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* Header */}
          <View
            style={{
              height: 60,
              flexDirection: 'row',
              alignItems: 'center', // Выравнивание по центру по вертикали
              justifyContent: 'center', // Выравнивание заголовка по центру
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.headerBorder,
              marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            }}
          >
            {/* Кнопка Назад (абсолютное позиционирование слева, но выровнено по центру высоты) */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                position: 'absolute',
                left: 10,
                height: '100%',
                justifyContent: 'center',
                paddingHorizontal: 10,
                zIndex: 10,
              }}
            >
              <Ionicons name="chevron-back" size={28} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: 18,
                fontWeight: 'bold',
                letterSpacing: 0.5,
              }}
            >
              {t('groups.create.header.title')}
            </Text>
          </View>

          {/* Main Content */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView 
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Name Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '600' }}>
                    {t('groups.create.fields.name')}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.inputBackground,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.borderBlue,
                      color: COLORS.textPrimary,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                    }}
                    placeholder={t('groups.create.placeholders.name')}
                    placeholderTextColor={COLORS.placeholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                  />
                </View>

                {/* Description Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14, marginBottom: 8, fontWeight: '600' }}>
                    {t('groups.create.fields.description')}
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: COLORS.inputBackground,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: COLORS.borderBlue,
                      color: COLORS.textPrimary,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 16,
                      minHeight: 100,
                      textAlignVertical: 'top', // Для Android, чтобы текст начинался сверху
                    }}
                    placeholder={t('groups.create.placeholders.description')}
                    placeholderTextColor={COLORS.placeholder}
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                  />
                </View>

                {/* Public Switch Block */}
                <View
                  style={{
                    backgroundColor: COLORS.cardBackground,
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                      {t('groups.create.fields.public')}
                    </Text>
                    <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                      {isPublic 
                        ? t('groups.create.fields.publicHintOn') || 'Anyone can find and join' 
                        : t('groups.create.fields.publicHintOff') || 'Invitation only'
                      }
                    </Text>
                  </View>
                  <Switch 
                    value={isPublic} 
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#3e3e3e', true: COLORS.borderBlue }}
                    thumbColor={isPublic ? COLORS.accentBlue : '#f4f3f4'} 
                  />
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={saving}
                  activeOpacity={0.8}
                  style={{
                    width: '100%',
                    paddingVertical: 16,
                    borderRadius: 24,
                    backgroundColor: saving ? '#5f7191' : COLORS.accentBlue,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: COLORS.accentBlue,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#080b20" style={{ marginRight: 8 }} />
                  ) : null}
                  <Text 
                    style={{ 
                      color: '#080b20', 
                      fontSize: 16, 
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: 1
                    }}
                  >
                    {saving ? t('groups.create.buttons.creating') : t('groups.create.buttons.create')}
                  </Text>
                </TouchableOpacity>

              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
