import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function CreateTaskScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [points, setPoints] = useState('');
  
  // Состояния для работы с DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

  // Форматированная строка дедлайна для отображения
  const [formattedDeadline, setFormattedDeadline] = useState('');

  // Запускаем эффект один раз, чтобы удалить не сериализуемый callback из navigation params
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
  }, []);

  // Проверка наличия токена для авторизации
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        navigation.navigate('Login');
      }
    };
    checkToken();
  }, [navigation]);

  // Форматируем дату для отображения при изменении выбранной даты
  useEffect(() => {
    const formatDeadline = () => {
      const dateStr = deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const timeStr = deadlineDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      setFormattedDeadline(`${dateStr} at ${timeStr}`);
    };
    
    formatDeadline();
  }, [deadlineDate]);

  const handleCreateTask = async () => {
    if (!title || !description || !formattedDeadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const pointsNumber = parseInt(points);
    if (isNaN(pointsNumber)) {
      Alert.alert('Error', 'Points must be a number');
      return;
    }

    try {
      // Формируем дедлайн в формате, который ожидает ваш API
      const deadline = deadlineDate.toISOString();
      
      await apiService.post('/tasks/create/', {
        title,
        description,
        difficulty,
        deadline,
        points: pointsNumber,
        completed: false
      });

      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task', error.response || error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const handleDifficultySelection = (value) => {
    setDifficulty(value);
  };

  const showDateTimePicker = (mode) => {
    setDateTimePickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadlineDate;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (dateTimePickerMode === 'date') {
      // Сохраняем только дату, сохраняя текущее время
      const newDate = new Date(currentDate);
      newDate.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
      setDeadlineDate(newDate);
      
      // На Android сразу после выбора даты показываем выбор времени
      if (event.type === 'set' && Platform.OS === 'android') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 500);
      }
    } else {
      // Сохраняем только время, сохраняя текущую дату
      const newDate = new Date(deadlineDate);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      setDeadlineDate(newDate);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CREATE NEW TASK</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#88889C"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter task description"
            placeholderTextColor="#88889C"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.difficultySelector}>
            {['S', 'A', 'B', 'C', 'D'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyOption,
                  difficulty === level && styles.selectedDifficulty,
                  {
                    backgroundColor: difficulty === level 
                      ? (level === 'S' ? '#ff2d55' 
                        : level === 'A' ? '#ff9500' 
                        : level === 'B' ? '#4dabf7' 
                        : level === 'C' ? '#34c759' 
                        : '#8e8e93') 
                      : 'rgba(255, 255, 255, 0.1)'
                  }
                ]}
                onPress={() => handleDifficultySelection(level)}
              >
                <Text style={styles.difficultyText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Deadline</Text>
          
          {/* Отображение выбранной даты и времени */}
          <View style={styles.dateTimeContainer}>
            <Text style={styles.deadlineDisplayText}>
              {formattedDeadline || 'No date selected'}
            </Text>
            
            <View style={styles.dateTimeButtonsContainer}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => showDateTimePicker('date')}
              >
                <LinearGradient
                  colors={['#4dabf7', '#3250b4']}
                  style={styles.dateTimeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#ffffff" />
                  <Text style={styles.dateTimeButtonText}>Select Date</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => showDateTimePicker('time')}
              >
                <LinearGradient
                  colors={['#4dabf7', '#3250b4']}
                  style={styles.dateTimeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="time-outline" size={18} color="#ffffff" />
                  <Text style={styles.dateTimeButtonText}>Select Time</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* DateTimePicker для iOS и Android */}
          {(showDatePicker || showTimePicker) && (
            <DateTimePicker
              value={deadlineDate}
              mode={dateTimePickerMode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              style={styles.dateTimePicker}
              minimumDate={new Date()}
              themeVariant="dark" // для iOS темной темы
            />
          )}

          <Text style={styles.label}>Points Reward</Text>
          <TextInput
            style={styles.input}
            value={points}
            onChangeText={setPoints}
            placeholder="Enter Points reward"
            placeholderTextColor="#88889C"
            keyboardType="numeric"
          />

          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateTask}
          >
            <LinearGradient
              colors={['#4dabf7', '#3250b4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>CREATE TASK</Text>
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </ScrollView>
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
  placeholder: {
    width: 34,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  label: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderWidth: 1,
    borderColor: '#3250b4',
    borderRadius: 8,
    color: '#ffffff',
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    width: (width - 60) / 5,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  selectedDifficulty: {
    borderColor: '#ffffff',
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 30,
    marginBottom: 30,
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
  // Новые стили для компонентов выбора даты и времени
  dateTimeContainer: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderWidth: 1,
    borderColor: '#3250b4',
    borderRadius: 8,
    padding: 12,
  },
  deadlineDisplayText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  dateTimeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateTimeButton: {
    flex: 0.45,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dateTimeButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dateTimePicker: {
    marginTop: 10,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(16, 20, 45, 0.95)' : 'transparent',
    borderRadius: 8,
  },
});