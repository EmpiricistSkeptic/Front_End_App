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
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function EditTaskScreen({ navigation, route }) {
  const { taskId } = route.params;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  // Вместо строки дедлайна используем дату
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [formattedDeadline, setFormattedDeadline] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(true);

  // Состояния для работы с DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

  // Remove onGoBack callback if present in route params
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
  }, []);

  // Check authentication and fetch task details
  useEffect(() => {
    const getTokenAndFetchTask = async () => {
      try {
        const token = await AsyncStorage.getItem('jwt_token');
        if (!token) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }
        fetchTaskDetails();
      } catch (e) {
        console.error('Failed to get token', e);
        setLoading(false);
      }
    };
    
    getTokenAndFetchTask();
  }, [taskId]);
  
  const fetchTaskDetails = async () => {
    try {
      console.log('Fetching task with ID:', taskId);
      
      if (!taskId) {
        console.error('Task ID is missing');
        Alert.alert('Error', 'Task ID is missing. Please try again.');
        setLoading(false);
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      console.log('Using token for fetch:', token ? 'Token exists' : 'No token');
      
      const response = await apiService.get(`/tasks/${taskId}/`);
      console.log('Task details response:', JSON.stringify(response));
      
      if (response) {
        const task = response;
        console.log('Task data received:', task);
        
        setTitle(task.title || '');
        setDescription(task.description || '');
        setDifficulty(task.difficulty || 'B');
        // Если получен дедлайн, преобразуем его в объект Date
        if (task.deadline) {
          setDeadlineDate(new Date(task.deadline));
        }
        setPoints((task.points || 0).toString());
      } else {
        console.error('Response exists but empty:', response);
        throw new Error('No data received from API');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task details', error);
      Alert.alert('Error', `Failed to load task details: ${error.message}`);
      setLoading(false);
    }
  };

  // Форматируем дату дедлайна для отображения
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

  const handleUpdateTask = async () => {
    if (!title || !description || !deadlineDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const pointsNumber = parseInt(points);
    if (isNaN(pointsNumber)) {
      Alert.alert('Error', 'Points must be a number');
      return;
    }
    
    setLoading(true);

    try {
      const updateData = {
        title,
        description,
        difficulty,
        deadline: deadlineDate.toISOString(), // Передача дедлайна в ISO формате
        points: pointsNumber,
      };
      
      console.log('Updating task with data:', updateData);
      
      if (typeof apiService.put === 'function') {
        await apiService.put(`/tasks/${taskId}/update/`, updateData);
      } else {
        console.log('apiService.put not available, using PATCH instead');
        await apiService.patch(`/tasks/${taskId}/update/`, updateData);
      }

      Alert.alert('Success', 'Task updated successfully!');
      navigation.navigate('Home', { taskUpdated: true });
    } catch (error) {
      console.error('Error updating task', error);
      
      if (error.response && error.response.status === 405) {
        try {
          console.log('PUT failed with 405, trying PATCH instead');
          await apiService.patch(`/tasks/${taskId}/update/`, {
            title,
            description,
            difficulty,
            deadline: deadlineDate.toISOString(),
            points: pointsNumber,
          });
          
          Alert.alert('Success', 'Task updated successfully!');
          navigation.navigate('Home', { taskUpdated: true });
        } catch (patchError) {
          console.error('Error updating task with PATCH', patchError);
          Alert.alert('Error', `Failed to update task with PATCH: ${patchError.message}`);
        }
      } else {
        Alert.alert('Error', `Failed to update task: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultySelection = (value) => {
    setDifficulty(value);
  };

  // Показываем DateTimePicker для выбора даты или времени
  const showDateTimePicker = (mode) => {
    setDateTimePickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  // Обработка выбора даты и времени
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadlineDate;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (dateTimePickerMode === 'date') {
      // Обновляем дату, сохраняя текущее время
      const newDate = new Date(currentDate);
      newDate.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
      setDeadlineDate(newDate);
      
      if (event.type === 'set' && Platform.OS === 'android') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 500);
      }
    } else {
      // Обновляем время, сохраняя дату
      const newDate = new Date(deadlineDate);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      setDeadlineDate(newDate);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT TASK</Text>
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
          
          {(showDatePicker || showTimePicker) && (
            <DateTimePicker
              value={deadlineDate}
              mode={dateTimePickerMode}
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              style={styles.dateTimePicker}
              minimumDate={new Date()}
              themeVariant="dark"
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
            style={styles.updateButton}
            onPress={handleUpdateTask}
          >
            <LinearGradient
              colors={['#4dabf7', '#3250b4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>UPDATE TASK</Text>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 10,
    fontSize: 16,
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
  updateButton: {
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
});
