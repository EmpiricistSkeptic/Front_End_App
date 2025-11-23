import React, { memo, useRef, useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getUserGoal, updateUserGoal } from '../api/nutritionApi';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  inputBg: 'rgba(16, 20, 45, 0.9)',
  danger: '#ff4d4d',
};

// Field вынесен за пределы GoalsModal
const Field = memo(({ label, value, onChangeText, autoFocus }) => (
  <View style={{ marginBottom: 10 }}>
    <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>
      {label}
    </Text>
    <TextInput
      style={{
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.borderBlue,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: COLORS.textPrimary,
        fontSize: 14,
      }}
      keyboardType="numeric"
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={COLORS.placeholder}
      returnKeyType="done"
      blurOnSubmit={false}
      autoFocus={autoFocus}
    />
  </View>
));

function GoalsModal({ visible, onClose, onSaved, seed }) {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    calories_goal: String(seed?.calories ?? 2000),
    proteins_goal: String(seed?.proteins ?? 50),
    fats_goal:     String(seed?.fats ?? 70),
    carbs_goal:    String(seed?.carbs ?? 260),
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  const userTypedRef = useRef(false);

  const toNumber = (v) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };

  const validate = () => {
    const c  = toNumber(form.calories_goal);
    const p  = toNumber(form.proteins_goal);
    const f  = toNumber(form.fats_goal);
    const cb = toNumber(form.carbs_goal);

    if (c <= 0 || c > 10000) return t('nutrition.goals.errors.caloriesRange');
    if (p < 0 || p > 1000)   return t('nutrition.goals.errors.proteinsRange');
    if (f < 0 || f > 1000)   return t('nutrition.goals.errors.fatsRange');
    if (cb < 0 || cb > 1500) return t('nutrition.goals.errors.carbsRange');
    return null;
  };

  const handleChange = useCallback((field, value) => {
    userTypedRef.current = true;
    setForm((s) => ({ ...s, [field]: value }));
  }, []);

  const handleSave = async () => {
    const err = validate();
    if (err) return setError(err);
    setSaving(true); setError(null);
    Keyboard.dismiss();

    try {
      await updateUserGoal({
        calories_goal: toNumber(form.calories_goal),
        proteins_goal: toNumber(form.proteins_goal),
        fats_goal:     toNumber(form.fats_goal),
        carbs_goal:    toNumber(form.carbs_goal),
      });
      await onSaved?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data
          ? Object.entries(e.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join('\n')
          : t('nutrition.goals.errors.saveFailed');
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleOnShow = async () => {
    setError(null);
    userTypedRef.current = false;

    setForm({
      calories_goal: String(seed?.calories ?? 2000),
      proteins_goal: String(seed?.proteins ?? 50),
      fats_goal:     String(seed?.fats ?? 70),
      carbs_goal:    String(seed?.carbs ?? 260),
    });

    setLoading(true);
    try {
      const data = await getUserGoal();
      if (!userTypedRef.current) {
        setForm({
          calories_goal: String(data?.calories_goal ?? seed?.calories ?? 2000),
          proteins_goal: String(data?.proteins_goal ?? seed?.proteins ?? 50),
          fats_goal:     String(data?.fats_goal     ?? seed?.fats ?? 70),
          carbs_goal:    String(data?.carbs_goal    ?? seed?.carbs ?? 260),
        });
      }
    } catch (_) {
      // оставим seed
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onShow={handleOnShow}
      animationType="fade"
      transparent
      hardwareAccelerated
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
      >
        <View style={{
          backgroundColor: '#0f1331',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: 16,
          borderTopWidth: 1,
          borderColor: COLORS.borderBlue,
          maxHeight: '85%',
        }}>
          {/* Header */}
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' }}>
              {t('nutrition.goals.title')}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems:'center', paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={COLORS.accentBlue} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>
                {t('nutrition.goals.loading')}
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
            >
              <Field
                label={t('nutrition.goals.fields.calories')}
                value={form.calories_goal}
                onChangeText={(t2) => handleChange('calories_goal', t2)}
                autoFocus
              />
              <Field
                label={t('nutrition.goals.fields.proteins')}
                value={form.proteins_goal}
                onChangeText={(t2) => handleChange('proteins_goal', t2)}
              />
              <Field
                label={t('nutrition.goals.fields.fats')}
                value={form.fats_goal}
                onChangeText={(t2) => handleChange('fats_goal', t2)}
              />
              <Field
                label={t('nutrition.goals.fields.carbs')}
                value={form.carbs_goal}
                onChangeText={(t2) => handleChange('carbs_goal', t2)}
              />

              {error ? (
                <Text style={{ color: COLORS.danger, marginTop: 6, fontSize: 12, lineHeight: 16 }}>
                  {error}
                </Text>
              ) : null}

              <View style={{ flexDirection:'row', justifyContent:'flex-end', marginTop: 12 }}>
                <TouchableOpacity onPress={onClose} disabled={saving} style={{
                  paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22,
                  borderWidth: 1, borderColor: COLORS.borderBlue, marginRight: 8,
                }}>
                  <Text style={{ color: COLORS.textSecondary, fontSize: 14 }}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSave} disabled={saving} style={{
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22,
                  backgroundColor: saving ? '#5f7191' : COLORS.accentBlue,
                  justifyContent: 'center', alignItems: 'center',
                }}>
                  {saving ? (
                    <ActivityIndicator size="small" color="#080b20" />
                  ) : (
                    <Text style={{ color: '#080b20', fontSize: 14, fontWeight: '700' }}>
                      {t('common.save')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default memo(GoalsModal);
