import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Sample user data
const USER = {
  username: 'Heroic123',
  bio: 'Level up your life! Fitness enthusiast, coding wizard, and language learner. Working on becoming the best version of myself.',
  level: 23,
  points: 1250,
  totalPoints: 2000,
  achievements: [
    {
      id: 1,
      title: 'Early Riser',
      description: 'Completed 10 quests before 9 AM',
      icon: 'sunrise',
      unlocked: true,
    },
    {
      id: 2,
      title: 'Code Master',
      description: 'Completed 20 programming study sessions',
      icon: 'code',
      unlocked: true,
    },
    {
      id: 3,
      title: 'Fitness Warrior',
      description: 'Logged 30 workout sessions',
      icon: 'dumbbell',
      unlocked: false,
    },
    {
      id: 4,
      title: 'Polyglot',
      description: 'Practiced 5 different languages',
      icon: 'language',
      unlocked: false,
    },
    {
      id: 5,
      title: 'Nutrition Expert',
      description: 'Tracked healthy meals for 14 consecutive days',
      icon: 'food-apple',
      unlocked: true,
    },
  ],
  stats: [
    { name: 'Strength', value: 75 },
    { name: 'Intelligence', value: 85 },
    { name: 'Creativity', value: 60 },
    { name: 'Discipline', value: 90 },
    { name: 'Vitality', value: 70 },
  ]
};

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('stats');
  
  const getAchievementIcon = (icon) => {
    switch(icon) {
      case 'sunrise': return <Feather name="sunrise" size={24} color="#ffffff" />;
      case 'code': return <FontAwesome5 name="code" size={24} color="#ffffff" />;
      case 'dumbbell': return <FontAwesome5 name="dumbbell" size={24} color="#ffffff" />;
      case 'language': return <FontAwesome5 name="language" size={24} color="#ffffff" />;
      case 'food-apple': return <MaterialCommunityIcons name="food-apple" size={24} color="#ffffff" />;
      default: return <AntDesign name="trophy" size={24} color="#ffffff" />;
    }
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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4dabf7" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>PROFILE</Text>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <ScrollView style={styles.mainContent}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{USER.username.charAt(0)}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{USER.level}</Text>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{USER.username}</Text>
              <View style={styles.expBarContainer}>
                <View style={[styles.expBar, { width: `${(USER.points/USER.totalPoints) * 100}%` }]} />
                <Text style={styles.expText}>{USER.points} / {USER.totalPoints} EXP</Text>
              </View>
              <Text style={styles.bio}>{USER.bio}</Text>
              
              <TouchableOpacity style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>EDIT PROFILE</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'stats' && styles.activeTab]}
              onPress={() => setActiveTab('stats')}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>STATS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'achievements' && styles.activeTab]}
              onPress={() => setActiveTab('achievements')}
            >
              <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>ACHIEVEMENTS</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>HISTORY</Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          {activeTab === 'stats' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>CHARACTER STATS</Text>
              
              {USER.stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={styles.statHeader}>
                    <Text style={styles.statName}>{stat.name}</Text>
                    <Text style={styles.statValue}>{stat.value}/100</Text>
                  </View>
                  <View style={styles.statBarContainer}>
                    <View style={[styles.statBar, { width: `${stat.value}%` }]} />
                  </View>
                </View>
              ))}
              
              <View style={styles.totalPointsContainer}>
                <Text style={styles.totalPointsLabel}>Total Skill Points:</Text>
                <Text style={styles.totalPointsValue}>
                  {USER.stats.reduce((total, stat) => total + stat.value, 0)}
                </Text>
              </View>
            </View>
          )}
          
          {activeTab === 'achievements' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
              
              {USER.achievements.map((achievement) => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementItem, 
                    !achievement.unlocked && styles.achievementLocked
                  ]}
                >
                  <View 
                    style={[
                      styles.achievementIcon, 
                      !achievement.unlocked && styles.achievementIconLocked
                    ]}
                  >
                    {getAchievementIcon(achievement.icon)}
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  </View>
                  <View style={styles.achievementStatus}>
                    {achievement.unlocked ? (
                      <AntDesign name="checkcircle" size={20} color="#34c759" />
                    ) : (
                      <Ionicons name="lock-closed" size={20} color="#8e8e93" />
                    )}
                  </View>
                </View>
              ))}
              
              <View style={styles.achievementSummary}>
                <Text style={styles.achievementSummaryText}>
                  Unlocked: {USER.achievements.filter(a => a.unlocked).length}/{USER.achievements.length}
                </Text>
              </View>
            </View>
          )}
          
          {activeTab === 'history' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>QUEST HISTORY</Text>
              
              <View style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDateText}>TODAY</Text>
                </View>
                
                <View style={styles.historyQuest}>
                  <View style={[styles.difficultyBadge, {backgroundColor: '#4dabf7'}]}>
                    <Text style={styles.difficultyText}>B</Text>
                  </View>
                  <View style={styles.historyQuestInfo}>
                    <Text style={styles.historyQuestTitle}>Complete Morning Workout</Text>
                    <Text style={styles.historyQuestExp}>+150 EXP</Text>
                  </View>
                  <View style={styles.historyQuestStatus}>
                    <AntDesign name="checkcircle" size={20} color="#34c759" />
                  </View>
                </View>
                
                <View style={styles.historyQuest}>
                  <View style={[styles.difficultyBadge, {backgroundColor: '#ff9500'}]}>
                    <Text style={styles.difficultyText}>A</Text>
                  </View>
                  <View style={styles.historyQuestInfo}>
                    <Text style={styles.historyQuestTitle}>Study Programming</Text>
                    <Text style={styles.historyQuestExp}>+300 EXP</Text>
                  </View>
                  <View style={styles.historyQuestStatus}>
                    <AntDesign name="checkcircle" size={20} color="#34c759" />
                  </View>
                </View>
              </View>
              
              <View style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDateText}>YESTERDAY</Text>
                </View>
                
                <View style={styles.historyQuest}>
                  <View style={[styles.difficultyBadge, {backgroundColor: '#34c759'}]}>
                    <Text style={styles.difficultyText}>C</Text>
                  </View>
                  <View style={styles.historyQuestInfo}>
                    <Text style={styles.historyQuestTitle}>Meal Prep</Text>
                    <Text style={styles.historyQuestExp}>+100 EXP</Text>
                  </View>
                  <View style={styles.historyQuestStatus}>
                    <AntDesign name="checkcircle" size={20} color="#34c759" />
                  </View>
                </View>
                
                <View style={styles.historyQuest}>
                  <View style={[styles.difficultyBadge, {backgroundColor: '#8e8e93'}]}>
                    <Text style={styles.difficultyText}>D</Text>
                  </View>
                  <View style={styles.historyQuestInfo}>
                    <Text style={styles.historyQuestTitle}>Meditation Session</Text>
                    <Text style={styles.historyQuestExp}>+50 EXP</Text>
                  </View>
                  <View style={styles.historyQuestStatus}>
                    <Ionicons name="close-circle" size={20} color="#ff2d55" />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Quests</Text>
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
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
              <FontAwesome5 name="book" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Learn</Text>
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
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  settingsButton: {
    padding: 5,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3250b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#121539',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  expBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  expBar: {
    width: '62.5%', // Based on sample exp
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 5,
  },
  expText: {
    position: 'absolute',
    right: 0,
    top: 12,
    color: '#c8d6e5',
    fontSize: 10,
  },
  bio: {
    color: '#c8d6e5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  editProfileButton: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  editProfileText: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    color: '#c8d6e5',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4dabf7',
  },
  activeTabText: {
    color: '#4dabf7',
  },
  tabContent: {
    flex: 1,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  statItem: {
    marginBottom: 15,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  statName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
  statBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 4,
  },
  totalPointsContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  totalPointsLabel: {
    color: '#c8d6e5',
    fontSize: 14,
    marginRight: 10,
  },
  totalPointsValue: {
    color: '#4dabf7',
    fontSize: 18,
    fontWeight: 'bold',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementIconLocked: {
    backgroundColor: '#8e8e93',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  achievementDescription: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  achievementStatus: {
    paddingLeft: 10,
  },
  achievementSummary: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  achievementSummaryText: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  historyItem: {
    marginBottom: 20,
  },
  historyDate: {
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  historyDateText: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
  historyQuest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  difficultyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  historyQuestInfo: {
    flex: 1,
  },
  historyQuestTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyQuestExp: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: '600',
  },
  historyQuestStatus: {
    paddingLeft: 10,
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