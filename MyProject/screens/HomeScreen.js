import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import TaskScreen from './TaskScreen';
// Placeholder for QuestScreen - replace with actual import when available
import AIQuestListScreen from './AIQuestListScreen';

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
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          fetchProfileData();
        } else {
          navigation.navigate('Login');
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
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.levelText}>LVL {profileData.level}</Text>
            <View style={styles.pointsBarContainer}>
              <View style={[styles.pointsBar, { width: `${calculateExpPercentage()}%` }]} />
              <Text style={styles.pointsText}>{profileData.points} / {profileData.totalPoints} POINTS</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
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
  },
  levelText: {
    color: '#4dabf7',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pointsBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pointsBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 3,
  },
  pointsText: {
    position: 'absolute',
    right: 0,
    top: 8,
    color: '#c8d6e5',
    fontSize: 10,
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3250b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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