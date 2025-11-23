import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import DiscoverTab from './components/DiscoverTab';
import MyTab from './components/MyTab';
import HuntersTab from './components/HuntersTab';

const { width, height } = Dimensions.get('window');

const COLORS = {
  backgroundGradientStart: '#121539',
  backgroundGradientEnd: '#080b20',
  accentBlue: '#4dabf7',
  borderBlue: '#3250b4',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  particle: '#4dabf7',
  headerBorder: 'rgba(77, 171, 247, 0.3)',
  inputBackground: 'rgba(16, 20, 45, 0.85)',
  pillBg: 'rgba(26, 30, 60, 0.85)',
};

export default function GroupsHomeScreen({ navigation }) {
  const { t, i18n } = useTranslation();

  const [tab, setTab] = useState('discover'); // 'discover' | 'mine' | 'hunters'
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  // при каждом фокусе экрана — обновляем ключ, чтобы табы могли рефрешиться
  useFocusEffect(
    useCallback(() => {
      setRefreshTick((x) => x + 1);
    }, [])
  );

  // 🔹 мемоизированные частицы
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        width: Math.random() * 4 + 1,
        height: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  const activeTab = tab;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* 🔹 Частицы */}
        <View style={{ position: 'absolute', width, height }} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: p.width,
                height: p.height,
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
            {t('groups.header.title')}
          </Text>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 15, paddingTop: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: COLORS.inputBackground,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Ionicons
              name="search"
              size={18}
              color={COLORS.placeholder}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{
                flex: 1,
                color: COLORS.textPrimary,
                fontSize: 15,
                paddingVertical: 4,
              }}
              placeholder={t('groups.search.placeholder')}
              placeholderTextColor={COLORS.placeholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs — pill style */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: COLORS.pillBg,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              borderRadius: 12,
              padding: 4,
              marginTop: 12,
            }}
          >
            {/* Discover */}
            <TouchableOpacity
              onPress={() => setTab('discover')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'discover'
                    ? 'rgba(77,171,247,0.15)'
                    : 'transparent',
                borderWidth: activeTab === 'discover' ? 1 : 0,
                borderColor:
                  activeTab === 'discover'
                    ? COLORS.borderBlue
                    : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'discover'
                      ? COLORS.accentBlue
                      : COLORS.textSecondary,
                  fontWeight: '700',
                }}
              >
                {t('groups.tabs.discover')}
              </Text>
            </TouchableOpacity>

            {/* My */}
            <TouchableOpacity
              onPress={() => setTab('mine')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'mine'
                    ? 'rgba(77,171,247,0.15)'
                    : 'transparent',
                borderWidth: activeTab === 'mine' ? 1 : 0,
                borderColor:
                  activeTab === 'mine' ? COLORS.borderBlue : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'mine'
                      ? COLORS.accentBlue
                      : COLORS.textSecondary,
                  fontWeight: '700',
                }}
              >
                {t('groups.tabs.mine')}
              </Text>
            </TouchableOpacity>

            {/* Hunters */}
            <TouchableOpacity
              onPress={() => setTab('hunters')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 8,
                backgroundColor:
                  activeTab === 'hunters'
                    ? 'rgba(77,171,247,0.15)'
                    : 'transparent',
                borderWidth: activeTab === 'hunters' ? 1 : 0,
                borderColor:
                  activeTab === 'hunters'
                    ? COLORS.borderBlue
                    : 'transparent',
              }}
            >
              <Text
                style={{
                  color:
                    activeTab === 'hunters'
                      ? COLORS.accentBlue
                      : COLORS.textSecondary,
                  fontWeight: '700',
                }}
              >
                {t('groups.tabs.hunters')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab content */}
        <View
          style={{
            flex: 1,
            paddingHorizontal: 15,
            paddingTop: 10,
            paddingBottom: 80,
          }}
        >
          {activeTab === 'discover' ? (
            <DiscoverTab
              search={search}
              navigation={navigation}
              refreshKey={refreshTick}
            />
          ) : activeTab === 'mine' ? (
            <MyTab
              search={search}
              navigation={navigation}
              refreshKey={refreshTick}
            />
          ) : (
            <HuntersTab
              search={search}
              navigation={navigation}
              refreshKey={refreshTick}
            />
          )}
        </View>

        {/* FAB Create */}
        <TouchableOpacity
          onPress={() => navigation.navigate('CreateGroup')}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 110,
            width: 54,
            height: 54,
            borderRadius: 27,
            backgroundColor: COLORS.accentBlue,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: COLORS.accentBlue,
            shadowOpacity: 0.8,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={26} color="#080b20" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}
