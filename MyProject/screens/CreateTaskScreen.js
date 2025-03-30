import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService'; // проверьте корректность пути

const { width } = Dimensions.get('window');

export default function CreateTaskScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadline, setDeadline] = useState('');
  const [points, setPoints] = useState('');

  // Запускаем эффект один раз, чтобы удалить не сериализуемый callback из navigation params
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
  }, []); // пустой массив зависимостей — эффект сработает только при монтировании

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

  const handleCreateTask = async () => {
    if (!title || !description || !deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const pointsNumber = parseInt(points);
    if (isNaN(pointsNumber)) {
      Alert.alert('Error', 'Points must be a number');
      return;
    }

    try {
      await apiService.post('/tasks/create/', {
        title,
        description,
        difficulty,
        deadline,
        points: pointsNumber,
        completed: false
      });

      Alert.alert('Success', 'Quest created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating quest', error.response || error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    }
  };

  const handleDifficultySelection = (value) => {
    setDifficulty(value);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CREATE NEW QUEST</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter quest title"
            placeholderTextColor="#88889C"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter quest description"
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
            style={styles.createButton}
            onPress={handleCreateTask}
          >
            <LinearGradient
              colors={['#4dabf7', '#3250b4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.buttonText}>CREATE QUEST</Text>
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
});
