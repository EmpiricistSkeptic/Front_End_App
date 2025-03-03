import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// Sample quest data
const QUESTS = [
  {
    id: 1,
    title: 'Complete Morning Workout',
    difficulty: 'B',
    exp: 150,
    description: 'Finish 30 minutes of cardio and strength training before 9 AM.',
    deadline: '9:00 AM',
    completed: false,
  },
  {
    id: 2,
    title: 'Study Programming',
    difficulty: 'A',
    exp: 300,
    description: 'Learn React Native animations for 2 hours and implement a custom animation.',
    deadline: '3:00 PM',
    completed: false,
  },
  {
    id: 3,
    title: 'Meal Prep',
    difficulty: 'C',
    exp: 100,
    description: 'Prepare healthy meals for the next 3 days following nutrition plan.',
    deadline: '7:00 PM',
    completed: true,
  },
  {
    id: 4,
    title: 'Language Practice',
    difficulty: 'B',
    exp: 200,
    description: 'Complete 2 chapters of language exercises and practice speaking for 30 minutes.',
    deadline: '8:00 PM',
    completed: false,
  },
  {
    id: 5,
    title: 'Meditation Session',
    difficulty: 'D',
    exp: 50,
    description: 'Complete a 15-minute guided meditation session for mental clarity.',
    deadline: '10:00 PM',
    completed: false,
  },
];

export default function HomeScreen({ navigation }) {
  const [selectedQuest, setSelectedQuest] = useState(null);
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'S': return '#ff2d55';
      case 'A': return '#ff9500';
      case 'B': return '#4dabf7';
      case 'C': return '#34c759';
      case 'D': return '#8e8e93';
      default: return '#4dabf7';
    }
  };
  
  const closeQuestDetails = () => {
    setSelectedQuest(null);
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
            <Text style={styles.levelText}>LVL 23</Text>
            <View style={styles.expBarContainer}>
              <View style={styles.expBar} />
              <Text style={styles.expText}>1250 / 2000 EXP</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>H</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>ACTIVE QUESTS</Text>
          
          <ScrollView style={styles.questsContainer}>
            {QUESTS.map(quest => (
              <TouchableOpacity 
                key={quest.id} 
                style={[
                  styles.questItem,
                  quest.completed && styles.questCompleted
                ]}
                onPress={() => setSelectedQuest(quest)}
              >
                <View style={styles.questLeft}>
                  <View 
                    style={[
                      styles.difficultyBadge, 
                      {backgroundColor: getDifficultyColor(quest.difficulty)}
                    ]}
                  >
                    <Text style={styles.difficultyText}>{quest.difficulty}</Text>
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questDeadline}>{quest.deadline}</Text>
                  </View>
                </View>
                <View style={styles.questRight}>
                  <Text style={styles.expReward}>+{quest.exp} EXP</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
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
        
        {/* Quest Details Modal */}
        {selectedQuest && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeQuestDetails} />
            <View style={styles.questDetailsModal}>
              <View style={styles.modalHeader}>
                <View 
                  style={[
                    styles.modalDifficultyBadge, 
                    {backgroundColor: getDifficultyColor(selectedQuest.difficulty)}
                  ]}
                >
                  <Text style={styles.difficultyText}>{selectedQuest.difficulty}</Text>
                </View>
                <Text style={styles.modalTitle}>{selectedQuest.title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeQuestDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Deadline:</Text>
                  <Text style={styles.modalInfoValue}>{selectedQuest.deadline}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>EXP Reward:</Text>
                  <Text style={styles.modalInfoValue}>{selectedQuest.exp} EXP</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Status:</Text>
                  <Text 
                    style={[
                      styles.modalInfoValue, 
                      {color: selectedQuest.completed ? '#34c759' : '#ff9500'}
                    ]}
                  >
                    {selectedQuest.completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </Text>
                </View>
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>{selectedQuest.description}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={closeQuestDetails}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>
                      {selectedQuest.completed ? 'DETAILS' : 'START QUEST'}
                    </Text>
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  expBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  expBar: {
    width: '62.5%', // Based on sample exp: 1250/2000
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
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  questsContainer: {
    flex: 1,
  },
  questItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  questCompleted: {
    opacity: 0.6,
    borderColor: '#34c759',
  },
  questLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  questInfo: {
    flex: 1,
  },
  questTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  questDeadline: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  questRight: {
    alignItems: 'flex-end',
  },
  expReward: {
    color: '#4dabf7',
    fontSize: 14,
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  questDetailsModal: {
    width: width * 0.85,
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3250b4',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  modalDifficultyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.2)',
    paddingBottom: 8,
  },
  modalInfoLabel: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  modalInfoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4dabf7',
    shadowColor: '#4dabf7',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});