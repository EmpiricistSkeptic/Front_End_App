import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import apiService from '../services/apiService'; // Импортируем apiService
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// API endpoints (можно оставить для ясности, но запросы будут через apiService)
const POMODORO_ENDPOINT = '/pomodoro/';
const POMODORO_START_ENDPOINT = '/pomodoro/start/';

// Default pomodoro settings (с учётом полей модели)
const DEFAULT_POMODORO = {
  duration_minutes: 25,            // рабочее время (в минутах)
  short_break_minutes: 5,          // короткий перерыв (исправлено с short_break_monutes)
  long_break_minutes: 15,          // длинный перерыв (в минутах)
  is_completed: false,
};

export default function PomodoroScreen({ navigation }) {
  // State переменные
  const [pomodoro, setPomodoro] = useState({ ...DEFAULT_POMODORO });
  const [pomodoroId, setPomodoroId] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO.duration_minutes * 60);
  const [currentMode, setCurrentMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_POMODORO.duration_minutes * 60);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthorized = await apiService.checkAuthStatus();
        if (!isAuthorized) {
          // Перенаправление на экран входа, если пользователь не авторизован
          navigation.navigate('Login');
        } else {
          fetchPomodoroHistory();
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        navigation.navigate('Login');
      }
    };

    checkAuth();
  }, []);
  
  // Логика таймера
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
      clearInterval(interval);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);
  
  // Получение истории сессий с сервера через apiService
  const fetchPomodoroHistory = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(POMODORO_ENDPOINT);
      setSessionHistory(response.data || []); // Ensure it's an array
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load pomodoro history');
      console.error('Error fetching pomodoro history:', err.response?.data || err);
      setSessionHistory([]); // Reset to empty array on error
      setIsLoading(false);
    }
  };
  
  // Создание новой сессии помодоро через apiService
  const createPomodoroSession = async () => {
    try {
      const payload = {
        start_timer: new Date().toISOString(),
        duration_minutes: pomodoro.duration_minutes,
        short_break_minutes: pomodoro.short_break_minutes,
        long_break_minutes: pomodoro.long_break_minutes,
        is_completed: false,
      };
      
      const response = await apiService.post(POMODORO_START_ENDPOINT, payload);
      setPomodoroId(response.data.id);
      Alert.alert('Success', 'New pomodoro session started');
      return response.data;
    } catch (err) {
      Alert.alert('Error', 'Failed to start pomodoro session');
      console.error('Error creating pomodoro session:', err.response?.data || err);
      throw err;
    }
  };
  
  // Обновление сессии через apiService
  const updatePomodoroSession = async (id, data) => {
    try {
      const response = await apiService.patch(`${POMODORO_ENDPOINT}${id}/update/`, data);
      return response.data;
    } catch (err) {
      console.error('Error updating pomodoro session:', err.response?.data || err);
      throw err;
    }
  };
  
  // Удаление сессии через apiService
  const deletePomodoroSession = async (id) => {
    try {
      await apiService.delete(`${POMODORO_ENDPOINT}${id}/delete/`);
      fetchPomodoroHistory();
    } catch (err) {
      Alert.alert('Error', 'Failed to delete pomodoro session');
      console.error('Error deleting pomodoro session:', err.response?.data || err);
    }
  };
  
  // Логика завершения таймера
  const handleTimerComplete = async () => {
    if (currentMode === 'work') {
      // После рабочего интервала переходим на короткий перерыв
      setCurrentMode('shortBreak');
      setTimeLeft(pomodoro.short_break_minutes * 60);
      setTotalSeconds(pomodoro.short_break_minutes * 60);
      Alert.alert('Short Break', 'Time for a short break!');
    } else {
      // После перерыва возвращаемся к работе и отмечаем сессию как завершённую
      setCurrentMode('work');
      setTimeLeft(pomodoro.duration_minutes * 60);
      setTotalSeconds(pomodoro.duration_minutes * 60);
      Alert.alert('Work Session', 'Break over. Let\'s get back to work!');
      if (pomodoroId) {
        try {
          await updatePomodoroSession(pomodoroId, { is_completed: true });
        } catch (err) {
          console.error('Failed to update session completion:', err.response?.data || err);
        }
      }
    }
  };
  
  // Запуск таймера
  const startTimer = async () => {
    try {
      if (!pomodoroId) {
        const newSession = await createPomodoroSession();
        setPomodoroId(newSession.id);
      }
      setIsRunning(true);
    } catch (err) {
      console.error('Failed to start timer:', err.response?.data || err);
    }
  };
  
  // Пауза таймера
  const pauseTimer = () => {
    setIsRunning(false);
    if (pomodoroId) {
      updatePomodoroSession(pomodoroId, {}).catch(err => console.error('Failed to update paused state:', err.response?.data || err));
    }
  };
  
  // Сброс таймера
  const resetTimer = () => {
    setIsRunning(false);
    if (currentMode === 'work') {
      setTimeLeft(pomodoro.duration_minutes * 60);
      setTotalSeconds(pomodoro.duration_minutes * 60);
    } else if (currentMode === 'shortBreak') {
      setTimeLeft(pomodoro.short_break_minutes * 60);
      setTotalSeconds(pomodoro.short_break_minutes * 60);
    } else {
      setTimeLeft(pomodoro.long_break_minutes * 60);
      setTotalSeconds(pomodoro.long_break_minutes * 60);
    }
  };
  
  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Обновление рабочего времени
  const updateDuration = (value) => {
    const newPomodoro = { ...pomodoro, duration_minutes: value };
    setPomodoro(newPomodoro);
    if (currentMode === 'work' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  // Обновление короткого перерыва
  const updateShortBreak = (value) => {
    const newPomodoro = { ...pomodoro, short_break_minutes: value };
    setPomodoro(newPomodoro);
    if (currentMode === 'shortBreak' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  // Обновление длинного перерыва
  const updateLongBreak = (value) => {
    const newPomodoro = { ...pomodoro, long_break_minutes: value };
    setPomodoro(newPomodoro);
    if (currentMode === 'longBreak' && !isRunning) {
      setTimeLeft(value * 60);
      setTotalSeconds(value * 60);
    }
  };
  
  // Удаление текущей сессии
  const deleteSession = () => {
    if (!pomodoroId) {
      setIsRunning(false);
      setPomodoro({ ...DEFAULT_POMODORO });
      setTimeLeft(DEFAULT_POMODORO.duration_minutes * 60);
      setTotalSeconds(DEFAULT_POMODORO.duration_minutes * 60);
      setCurrentMode('work');
      return;
    }
    
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this Pomodoro session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: async () => {
            try {
              await deletePomodoroSession(pomodoroId);
              setIsRunning(false);
              setPomodoro({ ...DEFAULT_POMODORO });
              setTimeLeft(DEFAULT_POMODORO.duration_minutes * 60);
              setTotalSeconds(DEFAULT_POMODORO.duration_minutes * 60);
              setCurrentMode('work');
              setPomodoroId(null);
              Alert.alert('Success', 'Pomodoro session deleted successfully');
              fetchPomodoroHistory();
            } catch (err) {
              console.error('Failed to delete session:', err.response?.data || err);
            }
          },
          style: 'destructive' },
      ]
    );
  };
  
  // Удаление элемента из истории
  const deleteHistoryItem = (id) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: async () => {
            try {
              await deletePomodoroSession(id);
              Alert.alert('Success', 'History item deleted successfully');
            } catch (err) {
              console.error('Failed to delete history item:', err.response?.data || err);
            }
          },
          style: 'destructive' },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фоновая анимация частиц */}
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
        
        {/* Шапка */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#4dabf7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>POMODORO TIMER</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
        </View>
        
        {/* Основное содержимое */}
        <ScrollView style={styles.mainContent}>
          <View style={styles.timerSection}>
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'work' && styles.activeModeButton]}
                onPress={() => {
                  if (!isRunning) {
                    setCurrentMode('work');
                    setTimeLeft(pomodoro.duration_minutes * 60);
                    setTotalSeconds(pomodoro.duration_minutes * 60);
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
                    setTimeLeft(pomodoro.short_break_minutes * 60);
                    setTotalSeconds(pomodoro.short_break_minutes * 60);
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
                    setTimeLeft(pomodoro.long_break_minutes * 60);
                    setTotalSeconds(pomodoro.long_break_minutes * 60);
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
                  {currentMode === 'work' ? 'Work Session' : 'Break Session'}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${(timeLeft / totalSeconds) * 100}%` }]} />
                </View>
              </View>
            </View>
            
            <View style={styles.controlsContainer}>
              {!isRunning ? (
                <TouchableOpacity style={styles.controlButton} onPress={startTimer}>
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
                <TouchableOpacity style={styles.controlButton} onPress={pauseTimer}>
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
              
              <TouchableOpacity style={styles.controlButton} onPress={resetTimer}>
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
              
              <TouchableOpacity style={styles.controlButton} onPress={deleteSession}>
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
          
          {/* Настройки таймера */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>TIMER SETTINGS</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingHeader}>
                <Text style={styles.settingName}>Work Duration</Text>
                <Text style={styles.settingValue}>{pomodoro.duration_minutes} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={60}
                step={5}
                value={pomodoro.duration_minutes}
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
                <Text style={styles.settingValue}>{pomodoro.short_break_minutes} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={15}
                step={1}
                value={pomodoro.short_break_minutes}
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
                <Text style={styles.settingValue}>{pomodoro.long_break_minutes} min</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={30}
                step={5}
                value={pomodoro.long_break_minutes}
                onValueChange={updateLongBreak}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor="#4dabf7"
                disabled={isRunning}
              />
            </View>
          </View>
          
          {/* История сессий */}
          <View style={styles.historySection}>
            <Text style={styles.sectionTitle}>SESSION HISTORY</Text>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4dabf7" style={styles.loader} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (sessionHistory || []).length === 0 ? (
              <Text style={styles.emptyText}>No pomodoro sessions yet</Text>
            ) : (
              (sessionHistory || []).map((session) => (
                <View key={session.id} style={styles.historyItem}>
                  <View style={styles.historyLeft}>
                    <View style={[styles.historyStatus, { backgroundColor: session.is_completed ? '#34c759' : '#ff9500' }]}>
                      <MaterialIcons name={session.is_completed ? "check" : "timer"} size={16} color="#ffffff" />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyTask}>Pomodoro Session</Text>
                      <Text style={styles.historyDate}>{formatDate(session.created_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text style={styles.historyDuration}>{session.duration_minutes} min</Text>
                    <TouchableOpacity onPress={() => deleteHistoryItem(session.id)} style={styles.deleteHistoryButton}>
                      <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        
        {/* Нижняя навигация */}
        <View style={styles.bottomNav}>
          <LinearGradient colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']} style={styles.navBackground}>
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
    alignItems: 'center',
    marginBottom: 5,
  },
  settingName: {
    color: '#c8d6e5',
    fontSize: 14,
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
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.2)',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  historyInfo: {
    flex: 1,
  },
  historyTask: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  historyDate: {
    color: '#c8d6e5',
    fontSize: 12,
    marginTop: 2,
  },
  historyRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDuration: {
    color: '#4dabf7',
    fontSize: 14,
    marginRight: 10,
  },
  deleteHistoryButton: {
    padding: 5,
  },
  emptyText: {
    color: '#c8d6e5',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  loader: {
    padding: 20,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  navText: {
    color: '#4dabf7',
    fontSize: 12,
    marginTop: 3,
  }
});