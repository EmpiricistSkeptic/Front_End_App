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
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_URL = 'https://drf-project-6vzx.onrender.com';

export default function EditTaskScreen({ navigation, route }) {
  const { questId } = route.params;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadline, setDeadline] = useState('');
  const [exp, setExp] = useState('');
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getTokenAndFetchTask = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setToken(userToken);
        if (!userToken) {
          navigation.navigate('Login');
          return;
        }
        
        // Fetch task details
        fetchTaskDetails(userToken);
      } catch (e) {
        console.error('Failed to get token', e);
        setLoading(false);
      }
    };
    
    getTokenAndFetchTask();
  }, [questId]);
  
  const fetchTaskDetails = async (userToken) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${questId}/`, {
        headers: {
          'Authorization': `Token ${userToken}`
        }
      });
      
      const task = response.data;
      
      // Set form fields with task data
      setTitle(task.title);
      setDescription(task.description);
      setDifficulty(task.difficulty);
      setDeadline(task.deadline);
      setExp(task.exp.toString());
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching task details', error);
      Alert.alert('Error', 'Failed to load task details. Please try again.');
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
    const expNumber = parseInt(exp);
    if (isNaN(expNumber)) {
      Alert.alert('Error', 'EXP must be a number');
      return;
    }
    
    setLoading(true);

    try {
      const response = await axios.put(`${API_URL}/tasks/${questId}/update/`, {
        title,
        description,
        difficulty,
        deadline,
        exp: expNumber,
      }, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      Alert.alert('Success', 'Quest updated successfully!');
      // Navigate back with update flag
      navigation.navigate('Home', { taskUpdated: true });
    } catch (error) {
      console.error('Error updating quest', error.response || error);
      
      // Try PATCH if PUT fails with 405 (Method Not Allowed)
      if (error.response && error.response.status === 405) {
        try {
          await axios.patch(`${API_URL}/tasks/${questId}/update/`, {
            title,
            description,
            difficulty,
            deadline,
            exp: expNumber,
          }, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          Alert.alert('Success', 'Quest updated successfully!');
          navigation.navigate('Home', { taskUpdated: true });
        } catch (patchError) {
          console.error('Error updating quest with PATCH', patchError);
          Alert.alert('Error', 'Failed to update quest. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to update quest. Please try again.');
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
          <Text style={styles.loadingText}>Loading quest details...</Text>
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
          <Text style={styles.headerTitle}>EDIT QUEST</Text>
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

          <Text style={styles.label}>EXP Reward</Text>
          <TextInput
            style={styles.input}
            value={exp}
            onChangeText={setExp}
            placeholder="Enter EXP reward"
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
              <Text style={styles.buttonText}>UPDATE QUEST</Text>
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