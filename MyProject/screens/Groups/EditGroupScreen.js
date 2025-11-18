// src/screens/Groups/EditGroupScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, SafeAreaView, StatusBar, Platform, Dimensions,
  TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getGroup, updateGroup } from './api/groupsApi';

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
  const { groupId, preGroup } = route.params || {};
  const [loading, setLoading] = useState(!preGroup);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(preGroup?.name || '');
  const [desc, setDesc] = useState(preGroup?.description || '');
  const [isPublic, setIsPublic] = useState(Boolean(preGroup?.is_public));

  useEffect(() => {
    if (preGroup) return;
    (async () => {
      setLoading(true);
      try {
        const g = await getGroup(groupId);
        setName(g?.name || '');
        setDesc(g?.description || '');
        setIsPublic(Boolean(g?.is_public));
      } catch (e) {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const renderParticles = () => (
    <View style={{ position:'absolute', width, height }} pointerEvents="none">
      {[...Array(20)].map((_, i) => (
        <View key={i} style={{
          position:'absolute',
          left: Math.random()*width, top: Math.random()*height,
          width: Math.random()*4+1, height: Math.random()*4+1,
          opacity: Math.random()*0.5+0.3, backgroundColor: COLORS.particle, borderRadius: 50,
        }} />
      ))}
    </View>
  );

  const handleSave = async () => {
    const nm = name.trim();
    if (!nm) {
      Alert.alert('Validation', 'Name is required');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateGroup(groupId, {
        name: nm,
        description: desc.trim(),
        is_public: Boolean(isPublic),
      });

      // ВАЖНО: не replace! Обновляем ПАРАМЕТРЫ существующего GroupDetails и возвращаемся.
      navigation.navigate({
        name: 'GroupDetails',
        params: {
          groupId: updated.id,
          preGroup: updated,
          __refreshAt: Date.now(), // специальный маркер для эффекта на детальном экране
        },
        merge: true,
      });
      navigation.goBack();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to update';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]} style={{ flex:1 }}>
        {renderParticles()}

        {/* Header */}
        <View style={{
          height:60, justifyContent:'center', alignItems:'center',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          borderBottomWidth:1, borderBottomColor: COLORS.headerBorder
        }}>
          <Text style={{ color: COLORS.textPrimary, fontSize:18, fontWeight:'bold', letterSpacing:1 }}>
            EDIT GROUP
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ position:'absolute', left:15, top: 18 }}>
            <Ionicons name="chevron-back" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Loading...</Text>
          </View>
        ) : (
          <View style={{ flex:1, padding: 15 }}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 }}>Name</Text>
            <TextInput
              style={{
                backgroundColor: COLORS.inputBackground,
                borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderBlue,
                color: COLORS.textPrimary, paddingHorizontal: 12, paddingVertical: 10
              }}
              placeholder="Group name"
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={setName}
            />

            <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 6, marginTop: 12 }}>Description</Text>
            <TextInput
              style={{
                backgroundColor: COLORS.inputBackground,
                borderRadius: 12, borderWidth: 1, borderColor: COLORS.borderBlue,
                color: COLORS.textPrimary, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90
              }}
              placeholder="Optional"
              placeholderTextColor={COLORS.placeholder}
              value={desc}
              onChangeText={setDesc}
              multiline
            />

            <View style={{ flexDirection:'row', alignItems:'center', marginTop: 12 }}>
              <Text style={{ color: COLORS.textSecondary, marginRight: 10 }}>Public</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                marginTop: 18,
                alignSelf:'flex-start',
                paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 22,
                backgroundColor: saving ? '#5f7191' : COLORS.accentBlue
              }}
            >
              <Text style={{ color: '#080b20', fontWeight: '700' }}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}
