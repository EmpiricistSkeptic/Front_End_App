import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width, height } = Dimensions.get('window');

// Sample pomodoro data
const DEFAULT_POMODORO = {
  duration_time: 25, // minutes
  short_brake_minutes: 5,
  long_brake_minutes: 15,
  is_completed: false,
  sessions_completed: 0,
  total_sessions: 4
};

export default function PomodoroScreen({ navigation }) {
  const [pomodoro, setPomodoro] = useState({...DEFAULT_POMODORO});
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(pomodoro.duration_time * 60);
  const [currentMode, setCurrentMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [totalSeconds, setTotalSeconds] = useState(pomodoro.duration_time * 60);
  const [sessionHistory, setSessionHistory] = useState([
    { date: '2025-03-02', duration: 25, completed: true, task: 'Study Programming' },
    { date: '2025-03-02', duration: 25, completed: true, task: 'Learn French' },
    { date: '2025-03-01', duration: 25, completed: true, task: 'Project Planning' },
    { date: '2025-03-01', duration: 25, completed: false, task: 'Reading' },
    { date: '2025-02-28', duration: 25, completed: true, task: 'Morning Workout Planning' },
  ]);
  
  useEffect(() => {
    let interval = null;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer completed
      handleTimerComplete();
      clearInterval(interval);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);
  
  const handleTimerComplete = () => {
    // Play notification sound or vibration here
    
    if (currentMode === 'work') {
      // Completed a work session
      const newSessionsCompleted = pomodoro.sessions_completed + 1;
      setPomodoro({...pomodoro, sessions_completed: newSessionsCompleted});
      
      if (newSessionsCompleted % 4 === 0) {
        // Long break after 4 sessions
        setCurrentMode('longBreak');
        setTimeLeft(pomodoro.long_brake_minutes * 60);
        setTotalSeconds(pomodoro.long_brake_minutes * 60);
        Alert.alert('Long Break', 'Time for a longer break! Great job completing 4 sessions!');
      } else {
        // Short break
        setCurrentMode('shortBreak');
        setTimeLeft(pomodoro.short_brake_minutes * 60);
        setTotalSeconds(pomodoro.short_brake_minutes * 60);
        Alert.alert('Short Break', 'Take a short break!');
      }
    } else {
      // Break completed, back to work
      setCurrentMode('work');
      setTimeLeft(pomodoro.duration_time * 60);
      setTotalSeconds(pomodoro.duration_time * 60);
      Alert.alert('Work Session', 'Break completed. Let\'s get back to work!');
    }
  };
  
  const startTimer = () => {
    setIsRunning(true);
  };
  
  const pauseTimer = () => {
    setIsRunning(false);
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    if (currentMode === 'work') {
      setTimeLeft(pomodoro.duration_time * 60);
      setTotalSeconds(pomodoro.duration_time * 60);
    } else if (currentMode === 'shortBreak') {
      setTimeLeft(pomodoro.short_brake_minutes * 60);
      setTotalSeconds(pomodoro.short_brake_minutes * 60);
    } else {
      setTimeLeft(pomodoro.long_brake_minutes * 60);
      setTotalSeconds(pomodoro.long_brake_minutes * 60);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const updateDuration = (value) => {
    const newPomodoro = {...pomodoro, duration_time: value};
    setPomodoro(newPomodoro);
    if (currentMode === 'work' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  const updateShortBreak = (value) => {
    const newPomodoro = {...pomodoro, short_brake_minutes: value};
    setPomodoro(newPomodoro);
    if (currentMode === 'shortBreak' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  const updateLongBreak = (value) => {
    const newPomodoro = {...pomodoro, long_brake_minutes: value};
    setPomodoro(newPomodoro);
    if (currentMode === 'longBreak' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  const deleteSession = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this Pomodoro session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            setIsRunning(false);
            setPomodoro({...DEFAULT_POMODORO});
            setTimeLeft(DEFAULT_POMODORO.duration_time * 60);
            setTotalSeconds(DEFAULT_POMODORO.duration_time * 60);
            setCurrentMode('work');
            Alert.alert('Success', 'Pomodoro session deleted successfully');
          },
          style: 'destructive',
        },
      ]
    );
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
          
          <Text style={styles.headerTitle}>POMODORO TIMER</Text>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <ScrollView style={styles.mainContent}>
          {/* Timer Display */}
          <View style={styles.timerSection}>
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'work' && styles.activeModeButton]}
                onPress={() => {
                  if (!isRunning) {
                    setCurrentMode('work');
                    setTimeLeft(pomodoro.duration_time * 60);
                    setTotalSeconds(pomodoro.duration_time * 60);
                  }
                }}
              >
                <Text style={[styles.modeButtonText, currentMode === 'work' && styles.activeModeButtonText]}>
                  WORK
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'shortBreak' && styles.activeModeButton]}
                onPress={() => {
                  if (!isRunning) {
                    setCurrentMode('shortBreak');
                    setTimeLeft(pomodoro.short_brake_minutes * 60);
                    setTotalSeconds(pomodoro.short_brake_minutes * 60);
                  }
                }}
              >
                <Text style={[styles.modeButtonText, currentMode === 'shortBreak' && styles.activeModeButtonText]}>
                  SHORT BREAK
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'longBreak' && styles.activeModeButton]}
                onPress={() => {
                  if (!isRunning) {
                    setCurrentMode('longBreak');
                    setTimeLeft(pomodoro.long_brake_minutes * 60);
                    setTotalSeconds(pomodoro.long_brake_minutes * 60);
                  }
                }}
              >
                <Text style={[styles.modeButtonText, currentMode === 'longBreak' && styles.activeModeButtonText]}>
                  LONG BREAK
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timerContainer}>
              <View style={styles.timerInner}>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                <Text style={styles.sessionText}>
                  Session {pomodoro.sessions_completed + 1}/{pomodoro.total_sessions}
                </Text>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${(timeLeft / totalSeconds) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.controlsContainer}>
              {!isRunning ? (
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={startTimer}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="play" size={24} color="#ffffff" />
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={pauseTimer}
                >
                  <LinearGradient
                    colors={['#ff9500', '#ff2d55']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="pause" size={24} color="#ffffff" />
                  </LinearGradient>
                  <View style={[styles.buttonGlow, {borderColor: '#ff9500'}]} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={resetTimer}
              >
                <LinearGradient
                  colors={['#8e8e93', '#636366']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="refresh" size={24} color="#ffffff" />
                </LinearGradient>
                <View style={[styles.buttonGlow, {borderColor: '#8e8e93'}]} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={deleteSession}
              >
                <LinearGradient
                  colors={['#ff3b30', '#c70011']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="trash" size={24} color="#ffffff" />
                </LinearGradient>
                <View style={[styles.buttonGlow, {borderColor: '#ff3b30'}]} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Timer Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>TIMER SETTINGS</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingName}>Work Duration</Text>
                <Text style={styles.settingValue}>{pomodoro.duration_time} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={60}
                step={5}
                value={pomodoro.duration_time}
                onValueChange={updateDuration}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#4dabf7"
                disabled={isRunning}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingName}>Short Break</Text>
                <Text style={styles.settingValue}>{pomodoro.short_brake_minutes} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={15}
                step={1}
                value={pomodoro.short_brake_minutes}
                onValueChange={updateShortBreak}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#4dabf7"
                disabled={isRunning}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingName}>Long Break</Text>
                <Text style={styles.settingValue}>{pomodoro.long_brake_minutes} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={30}
                step={5}
                value={pomodoro.long_brake_minutes}
                onValueChange={updateLongBreak}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#4dabf7"
                disabled={isRunning}
              />
            </View>
          </View>
          
          {/* Session History */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>SESSION HISTORY</Text>
            
            {sessionHistory.map((session, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <View style={[
                    styles.historyStatus, 
                    { backgroundColor: session.completed ? '#34c759' : '#ff9500' }
                  ]}>
                    <MaterialIcons 
                      name={session.completed ? "check" : "timer"} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyTask}>{session.task}</Text>
                    <Text style={styles.historyDate}>{session.date}</Text>
                  </View>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyDuration}>{session.duration} min</Text>
                </View>
              </View>
            ))}
          </View>
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
              <MaterialIcons name="timer" size={24} color="#fff" />
              <Text style={[styles.navText, { color: '#fff' }]}>Timer</Text>
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
  timerSection: {
    marginBottom: 30,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeModeButton: {
    backgroundColor: 'rgba(77, 171, 247, 0.3)',
  },
  modeButtonText: {
    color: '#c8d6e5',
    fontSize: 12,
    fontWeight: '600',
  },
  activeModeButtonText: {
    color: '#ffffff',
  },
  timerContainer: {
    borderRadius: 150,
    width: 300,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#4dabf7',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    marginBottom: 30,
    shadowColor: '#4dabf7',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 5,
  },
  timerInner: {
    borderRadius: 140,
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
    backgroundColor: 'rgba(10, 14, 35, 0.9)',
  },
  timerText: {
    color: '#ffffff',
    fontSize: 60,
    fontWeight: 'bold',
    letterSpacing: 2,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sessionText: {
    color: '#c8d6e5',
    fontSize: 16,
    marginTop: 10,
  },
  progressBarContainer: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 3,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginHorizontal: 10,
    position: 'relative',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#4dabf7',
    shadowColor: '#4dabf7',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  settingsSection: {
    marginBottom: 30,
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  settingItem: {
    marginBottom: 15,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  settingName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingValue: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  historySection: {
    marginBottom: 30,
  },
  historyItem: {
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
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  historyInfo: {
    flex: 1,
  },
  historyTask: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyDuration: {
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
});