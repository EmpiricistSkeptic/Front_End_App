import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

import TaskScreen from './TaskScreen';
import AIQuestListScreen from './AIQuestListScreen';
import HabitScreen from './HabitScreen';

const Tab = createMaterialTopTabNavigator();
const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation, route }) {
  const [profileData, setProfileData] = useState({
    level: 1,
    points: 0,
    totalPoints: 1000,
    username: ''
  });

  // Load token and profile data on component mount
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const userToken = await AsyncStorage.getItem('jwt_token');
        if (userToken) {
          fetchProfileData();
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (e) {
        console.error('Failed to get token', e);
      }
    };
    
    initializeScreen();
  }, []);
  
  // Add listener to update data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Function to calculate XP threshold, matching backend
  const calculateXpThreshold = (level) => {
    return Math.floor(1000 * (1.5 ** (level - 1)));
  };
  
  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      const response = await apiService.get('/profile/');

      const level = response.level || 1;
      const totalPoints = calculateXpThreshold(level);
      
      setProfileData({
        level: level,
        points: response.points || 0,
        totalPoints: totalPoints,
        username: response.username || '',
        avatar: response.avatar_url || null
      });
      console.log('Fetched profile data:', response);
    } catch (error) {
      console.error('Error fetching profile data', error);
    }
  };

  // Add this helper function
  function getRankFromLevel(level) {
    if (level < 10) return 'E';
    if (level < 20) return 'D';
    if (level < 30) return 'C';
    if (level < 40) return 'B';
    if (level < 50) return 'A';
    return 'S';
  }
  
  // Calculate experience progress percentage for display
  const calculateExpPercentage = () => {
    return (profileData.points / profileData.totalPoints) * 100;
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Particle effects background */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.particle, 
                { 
                  left: Math.random() * width, 
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3
                }
              ]} 
            />
          ))}
        </View>
        
        {/* Enhanced Header with Solo Leveling theme */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Level display with glowing effect */}
            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>HUNTER RANK</Text>
              <Text style={styles.levelText}>LVL {profileData.level}</Text>
              <View style={styles.rankDecoration}>
                <Text style={styles.rankText}>RANK {getRankFromLevel(profileData.level)}</Text>
              </View>
            </View>
            
            {/* Enhanced EXP bar with glow effect */}
            <View style={styles.pointsBarOuterContainer}>
              <Text style={styles.pointsLabel}>COMBAT POWER</Text>
              <View style={styles.pointsBarContainer}>
                <View style={[styles.pointsBar, { width: `${calculateExpPercentage()}%` }]} />
                <View style={styles.pointsBarGlow} />
                <Text style={styles.pointsText}>{profileData.points} / {profileData.totalPoints}</Text>
              </View>
              <Text style={styles.expPercentage}>{Math.round(calculateExpPercentage())}%</Text>
            </View>
          </View>
          
          {/* Avatar with glowing effect similar to ProfileScreen */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.avatarGlow}>
              <View style={styles.profileImageContainer}>
                {profileData.avatar ? (
                  <Image 
                    source={{ uri: `${profileData.avatar}?t=${Date.now()}` }} 
                    style={styles.profileImage} 
                  />
                ) : (
                  <View style={styles.profileImage}>
                    <Text style={styles.profileInitial}>
                      {profileData.username ? profileData.username.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Level badge with glow */}
            <View style={styles.levelBadgeContainer}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{profileData.level}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Tab Navigation */}
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
          <Tab.Screen 
            name="Tasks" 
            component={TaskScreen}
            initialParams={{ fetchProfileData: fetchProfileData }}
          />
          <Tab.Screen 
            name="Quests" 
            component={AIQuestListScreen} 
            initialParams={{ fetchProfileData: fetchProfileData }}
          />
          <Tab.Screen 
            name="Habits" 
            component={HabitScreen} 
          />
        </Tab.Navigator>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pomodoro')}>
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Nutrition')}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Calories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Groups')}>
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Assistant')}>
              <Ionicons name="hardware-chip-outline" size={24} color="#4dabf7" /> 
              <Text style={styles.navText}>AI Assistant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

// Updated styles with Solo Leveling/anime aesthetic for HomeScreen header
const styles = StyleSheet.create({
  // Keep your existing styles...
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
  
  // Enhanced header styles
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
  
  // Level display with anime-style decoration
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
  
  // Enhanced EXP bar with glow effect
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
  
  // Enhanced profile button with glow effects
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
  
  // Level badge with glow
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
  
  // Keep all other styles from your existing code...
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