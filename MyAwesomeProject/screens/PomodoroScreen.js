import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Значения по умолчанию (в минутах)
const DEFAULT_POMODORO = {
  duration_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
};

export default function PomodoroScreen({ navigation }) {
  // Состояния длительностей
  const [workDuration, setWorkDuration] = useState(DEFAULT_POMODORO.duration_minutes);
  const [shortBreakDuration, setShortBreakDuration] = useState(DEFAULT_POMODORO.short_break_minutes);
  const [longBreakDuration, setLongBreakDuration] = useState(DEFAULT_POMODORO.long_break_minutes);

  // Состояния таймера
  const [timeLeft, setTimeLeft] = useState(workDuration * 60);
  const [totalSeconds, setTotalSeconds] = useState(workDuration * 60);
  const [currentMode, setCurrentMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [isRunning, setIsRunning] = useState(false);
  const [workSessionsCompleted, setWorkSessionsCompleted] = useState(0);

  // Функция звукового уведомления
  const playSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/notification.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.error('Ошибка воспроизведения звука', error);
    }
  };

  // Переключение режимов по окончании таймера
  const handleTimerComplete = () => {
    playSound();
    if (currentMode === 'work') {
      if (workSessionsCompleted === 0) {
        Alert.alert('Рабочая сессия завершена!', 'Время на короткий перерыв');
        setCurrentMode('shortBreak');
        setTimeLeft(shortBreakDuration * 60);
        setTotalSeconds(shortBreakDuration * 60);
        setWorkSessionsCompleted(1);
      } else {
        Alert.alert('Рабочая сессия завершена!', 'Время на длинный перерыв');
        setCurrentMode('longBreak');
        setTimeLeft(longBreakDuration * 60);
        setTotalSeconds(longBreakDuration * 60);
        setWorkSessionsCompleted(0);
      }
    } else {
      Alert.alert('Перерыв завершён!', 'Пора возвращаться к работе');
      setCurrentMode('work');
      setTimeLeft(workDuration * 60);
      setTotalSeconds(workDuration * 60);
    }
    setIsRunning(false);
  };

  // Логика работы таймера
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      clearInterval(interval);
      handleTimerComplete();
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Форматирование времени
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Управление таймером
  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    if (currentMode === 'work') {
      setTimeLeft(workDuration * 60);
      setTotalSeconds(workDuration * 60);
    } else if (currentMode === 'shortBreak') {
      setTimeLeft(shortBreakDuration * 60);
      setTotalSeconds(shortBreakDuration * 60);
    } else {
      setTimeLeft(longBreakDuration * 60);
      setTotalSeconds(longBreakDuration * 60);
    }
  };

  // Ручное переключение режима (если таймер не запущен)
  const switchMode = (mode) => {
    if (!isRunning) {
      setCurrentMode(mode);
      if (mode === 'work') {
        setTimeLeft(workDuration * 60);
        setTotalSeconds(workDuration * 60);
      } else if (mode === 'shortBreak') {
        setTimeLeft(shortBreakDuration * 60);
        setTotalSeconds(shortBreakDuration * 60);
      } else {
        setTimeLeft(longBreakDuration * 60);
        setTotalSeconds(longBreakDuration * 60);
      }
    }
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
            {/* Выбор режима */}
            <View style={styles.modeSelector}>
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'work' && styles.activeModeButton]}
                onPress={() => switchMode('work')}
              >
                <Text style={[styles.modeButtonText, currentMode === 'work' && styles.activeModeButtonText]}>
                  WORK
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'shortBreak' && styles.activeModeButton]}
                onPress={() => switchMode('shortBreak')}
              >
                <Text style={[styles.modeButtonText, currentMode === 'shortBreak' && styles.activeModeButtonText]}>
                  SHORT BREAK
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modeButton, currentMode === 'longBreak' && styles.activeModeButton]}
                onPress={() => switchMode('longBreak')}
              >
                <Text style={[styles.modeButtonText, currentMode === 'longBreak' && styles.activeModeButtonText]}>
                  LONG BREAK
                </Text>
              </TouchableOpacity>
            </View>

            {/* Таймер */}
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

            {/* Управление таймером */}
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
                  <View style={[styles.buttonGlow, { borderColor: '#ff9500' }]} />
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
                <View style={[styles.buttonGlow, { borderColor: '#8e8e93' }]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Настройки таймера */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>TIMER SETTINGS</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingName}>Work Duration: {workDuration} min</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={60}
                step={1}
                value={workDuration}
                onValueChange={(value) => {
                  setWorkDuration(value);
                  if (currentMode === 'work' && !isRunning) {
                    setTimeLeft(value * 60);
                    setTotalSeconds(value * 60);
                  }
                }}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#4dabf7"
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingName}>Short Break: {shortBreakDuration} min</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={15}
                step={1}
                value={shortBreakDuration}
                onValueChange={(value) => {
                  setShortBreakDuration(value);
                  if (currentMode === 'shortBreak' && !isRunning) {
                    setTimeLeft(value * 60);
                    setTotalSeconds(value * 60);
                  }
                }}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#4dabf7"
              />
            </View>
            <View style={styles.settingItem}>
              <Text style={styles.settingName}>Long Break: {longBreakDuration} min</Text>
              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={30}
                step={1}
                value={longBreakDuration}
                onValueChange={(value) => {
                  setLongBreakDuration(value);
                  if (currentMode === 'longBreak' && !isRunning) {
                    setTimeLeft(value * 60);
                    setTotalSeconds(value * 60);
                  }
                }}
                minimumTrackTintColor="#4dabf7"
                maximumTrackTintColor="rgba(255,255,255,0.2)"
                thumbTintColor="#4dabf7"
              />
            </View>
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
  settingName: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
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
  },
});

