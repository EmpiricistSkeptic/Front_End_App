import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';

import TaskScreen from './TaskScreen';
import AIQuestListScreen from './AIQuestListScreen';
import HabitScreen from './HabitScreen';

import { useProfile } from '../context/ProfileContext';

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get('window');

// Хелпер ранга (вынесен вне компонента)
function getRankFromLevel(level) {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 30) return 'C';
  if (level < 40) return 'B';
  if (level < 50) return 'A';
  return 'S';
}

export default function HomeScreen({ navigation }) {
  // Достаём данные профиля из глобального контекста
  const { profileData, totalPoints, expPercentage, refreshProfile } = useProfile();

  // Безопасные значения, пока профиль ещё не успел загрузиться
  const level = profileData?.level ?? 1;
  const points = profileData?.points ?? 0;
  const username = profileData?.username ?? '';
  const avatar = profileData?.avatar ?? null;
  const safeTotalPoints = totalPoints || 1000;
  const safeExpPercentage =
    Number.isFinite(expPercentage) && expPercentage >= 0
      ? Math.min(100, expPercentage)
      : 0;

  // Мемоизированные частицы
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

  // Обновляем профиль при фокусе (и при первом открытии экрана)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadProfile = async () => {
        try {
          await refreshProfile();
        } catch (err) {
          if (!isActive) return;
          console.error('Fetch profile error (HomeScreen):', err);

          const status = err?.response?.status ?? err?.status;

          if (status === 401 || err?.message?.includes?.('Session expired')) {
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        }
      };

      loadProfile();

      return () => {
        isActive = false;
      };
    }, [refreshProfile, navigation])
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Particle effects background */}
        <View style={styles.particlesContainer}>
          {particles.map((p) => (
            <View
              key={p.key}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.width,
                  height: p.height,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>HUNTER RANK</Text>
              <Text style={styles.levelText}>LVL {level}</Text>
              <View style={styles.rankDecoration}>
                <Text style={styles.rankText}>RANK {getRankFromLevel(level)}</Text>
              </View>
            </View>

            <View style={styles.pointsBarOuterContainer}>
              <Text style={styles.pointsLabel}>COMBAT POWER</Text>
              <View style={styles.pointsBarContainer}>
                <View style={[styles.pointsBar, { width: `${safeExpPercentage}%` }]} />
                <View style={styles.pointsBarGlow} />
                <Text style={styles.pointsText}>
                  {points} / {safeTotalPoints}
                </Text>
              </View>
              <Text style={styles.expPercentage}>{Math.round(safeExpPercentage)}%</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarGlow}>
              <View style={styles.profileImageContainer}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.profileImage} />
                ) : (
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitial}>
                      {username ? username.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.levelBadgeContainer}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{level}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: 'rgba(16, 20, 45, 0.95)',
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(77, 171, 247, 0.3)',
              elevation: 0,
              shadowOpacity: 0,
            },
            tabBarIndicatorStyle: {
              backgroundColor: '#4dabf7',
              height: 3,
            },
            tabBarActiveTintColor: '#4dabf7',
            tabBarInactiveTintColor: '#c8d6e5',
            tabBarLabelStyle: {
              fontWeight: 'bold',
              fontSize: 14,
              textTransform: 'uppercase',
            },
            tabBarPressColor: 'rgba(77, 171, 247, 0.1)',
          }}
        >
          <Tab.Screen name="Tasks" component={TaskScreen} />
          <Tab.Screen name="Quests" component={AIQuestListScreen} />
          <Tab.Screen name="Habits" component={HabitScreen} />
        </Tab.Navigator>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  headerLeft: {
    flex: 1,
    marginRight: 15,
  },

  levelContainer: {
    marginBottom: 12,
  },
  levelLabel: {
    color: '#c8d6e5',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  levelText: {
    color: '#4dabf7',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  rankDecoration: {
    position: 'absolute',
    right: 0,
    top: 5,
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#4dabf7',
  },
  rankText: {
    color: '#4dabf7',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  pointsBarOuterContainer: {
    position: 'relative',
    marginBottom: 5,
  },
  pointsLabel: {
    color: '#c8d6e5',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  pointsBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(16, 20, 45, 0.8)',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  pointsBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 5,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  pointsBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  pointsText: {
    position: 'absolute',
    right: 6,
    top: -2,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  expPercentage: {
    position: 'absolute',
    right: 0,
    top: 14,
    color: '#4dabf7',
    fontSize: 10,
    fontWeight: 'bold',
  },

  profileButton: {
    position: 'relative',
  },
  avatarGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1c2454',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  levelBadgeContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    shadowColor: '#ff9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  levelBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101233',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  bottomNav: {
    width: '100%',
    paddingBottom: 20,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 5,
  },
});


