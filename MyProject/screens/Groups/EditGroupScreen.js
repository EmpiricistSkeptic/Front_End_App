// src/screens/Groups/EditGroupScreen.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  cardBackground: 'rgba(255, 255, 255, 0.05)',
};

export default function EditGroupScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { groupId, preGroup } = route.params || {};

  const [loading, setLoading] = useState(!preGroup);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(preGroup?.name || '');
  const [desc, setDesc] = useState(preGroup?.description || '');
  const [isPublic, setIsPublic] = useState(Boolean(preGroup?.is_public));

  // ✅ Частицы мемоизированы
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
        Alert.alert(
          t('groups.edit.alerts.errorTitle'),
          t('groups.edit.alerts.groupNotFound')
        );
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
      Alert.alert(
        t('groups.edit.alerts.validationTitle'),
        t('groups.edit.alerts.nameRequired')
      );
      return;
    }

    setSaving(true);
    try {
      const updated = await updateGroup(groupId, {
        name: nm,
        description: desc.trim(),
        is_public: Boolean(isPublic),
      });

      // Обновляем параметры GroupDetails и возвращаемся
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

        <SafeAreaView style={{ flex: 1 }}>
          
          {/* Header */}
          <View
            style={{
              height: 60,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.headerBorder,
              marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            }}
          >
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
              {t('groups.edit.header.title')}
            </Text>
          </View>

          {/* Main Content */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
                {t('common.loading')}
              </Text>
            </View>
          ) : (
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
                      {t('groups.edit.fields.name')}
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
                      placeholder={t('groups.edit.placeholders.name')}
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
                      {t('groups.edit.fields.description')}
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
                        textAlignVertical: 'top', // Важно для Android
                      }}
                      placeholder={t('groups.edit.placeholders.description')}
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
                        {t('groups.edit.fields.public')}
                      </Text>
                      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                        {isPublic 
                          ? 'Group is visible to everyone' 
                          : 'Group is invite only'
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

                  {/* Save Button */}
                  <TouchableOpacity
                    onPress={handleSave}
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
                      {saving ? t('groups.edit.buttons.saving') : t('common.save')}
                    </Text>
                  </TouchableOpacity>

                </ScrollView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}