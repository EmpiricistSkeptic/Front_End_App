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
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function EditTaskScreen({ navigation, route }) {
  const { taskId } = route.params;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadline, setDeadline] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(true);

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
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          navigation.navigate('Login');
          return;
        }
        
        // Fetch task details
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
      
      // Проверяем наличие ID задачи
      if (!taskId) {
        console.error('Task ID is missing');
        Alert.alert('Error', 'Task ID is missing. Please try again.');
        setLoading(false);
        return;
      }
      
      const token = await AsyncStorage.getItem('userToken');
      console.log('Using token for fetch:', token ? 'Token exists' : 'No token');
      
      const response = await apiService.get(`/tasks/${taskId}/`);
      
      // Подробное логирование ответа
      console.log('Task details response:', JSON.stringify(response));
      
      // Проверяем, что response существует (без .data)
      if (response) {
        const task = response; // Используем response напрямую
        console.log('Task data received:', task);
        
        // Set form fields with task data
        setTitle(task.title || '');
        setDescription(task.description || '');
        setDifficulty(task.difficulty || 'B');
        setDeadline(task.deadline || '');
        setPoints((task.points || 0).toString());
      } else {
        console.error('Response exists but empty:', response);
        throw new Error('No data received from API');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task details', error);
      console.error('Error details:', error.response ? JSON.stringify(error.response) : 'No response data');
      

      
      Alert.alert('Error', `Failed to load task details: ${error.message}`);
      setLoading(false);
    }
  };

  const handleUpdateTask = async () => {
    // Validation of required fields
    if (!title || !description || !deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Check that EXP is a number
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
        deadline,
        points: pointsNumber,
      };
      
      console.log('Updating task with data:', updateData);
      
      // Добавляем проверку для метода PUT
      // Поскольку в apiService может отсутствовать метод put
      if (typeof apiService.put === 'function') {
        await apiService.put(`/tasks/${taskId}/update/`, updateData);
      } else {
        // Альтернативно используем apiRequest напрямую с методом PUT
        console.log('apiService.put not available, using PATCH instead');
        await apiService.patch(`/tasks/${taskId}/update/`, updateData);
      }

      Alert.alert('Success', 'Task updated successfully!');
      // Navigate back with update flag
      navigation.navigate('Home', { taskUpdated: true });
    } catch (error) {
      console.error('Error updating quest', error);
      console.error('Error response:', error.response ? JSON.stringify(error.response) : 'No response data');
      
      // Try PATCH if PUT fails with 405 (Method Not Allowed)
      if (error.response && error.response.status === 405) {
        try {
          console.log('PUT failed with 405, trying PATCH instead');
          await apiService.patch(`/tasks/${taskId}/update/`, {
            title,
            description,
            difficulty,
            deadline,
            points: pointsNumber,
          });
          
          Alert.alert('Success', 'Task updated successfully!');
          navigation.navigate('Home', { taskUpdated: true });
        } catch (patchError) {
          console.error('Error updating quest with PATCH', patchError);
          console.error('PATCH error response:', patchError.response ? JSON.stringify(patchError.response) : 'No response data');
          Alert.alert('Error', `Failed to update quest with PATCH: ${patchError.message}`);
        }
      } else {
        Alert.alert('Error', `Failed to update quest: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDifficultySelection = (value) => {
    setDifficulty(value);
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
          <TextInput
            style={styles.input}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="e.g. 9:00 AM or 2023-12-31"
            placeholderTextColor="#88889C"
          />

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
    width: 34, // To balance with the back button
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
    width: (width - 60) / 5, // Evenly distributed across width (accounting for padding)
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