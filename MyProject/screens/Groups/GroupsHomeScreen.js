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
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

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
  const [tab, setTab] = useState('discover'); // 'discover' | 'mine' | 'hunters'
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0); // ключ рефреша

  // каждый раз при возврате на экран (получении фокуса) — инкремент ключа
  useFocusEffect(
    useCallback(() => {
      setRefreshTick((t) => t + 1);
    }, [])
  );

  // 🔹 Мемоизированные частицы — генерируются один раз
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* 🔹 Частицы: больше не дергаются, pointerEvents отключены */}
        <View
          style={{ position: 'absolute', width, height }}
          pointerEvents="none"
        >
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
            GROUPS
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
              placeholder="Search groups..."
              placeholderTextColor={COLORS.placeholder}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={COLORS.placeholder}
                />
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
                Discover
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
                My
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
                Hunters
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
            bottom: 90,
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

        {/* Bottom nav — как в остальных экранах */}
        <View style={{ width: '100%', paddingBottom: 20 }}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: 'rgba(77, 171, 247, 0.3)',
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={{ alignItems: 'center' }}
            >
              <MaterialCommunityIcons
                name="sword-cross"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{ color: '#c8d6e5', fontSize: 10, marginTop: 5 }}
              >
                Tasks
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pomodoro')}
              style={{ alignItems: 'center' }}
            >
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text
                style={{ color: '#c8d6e5', fontSize: 10, marginTop: 5 }}
              >
                Timer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Nutrition')}
              style={{ alignItems: 'center' }}
            >
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{ color: '#c8d6e5', fontSize: 10, marginTop: 5 }}
              >
                Calories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupsHome')}
              style={{ alignItems: 'center' }}
            >
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text
                style={{ color: '#c8d6e5', fontSize: 10, marginTop: 5 }}
              >
                Guild
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Assistant')}
              style={{ alignItems: 'center' }}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{ color: '#c8d6e5', fontSize: 10, marginTop: 5 }}
              >
                AI Assistant
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

