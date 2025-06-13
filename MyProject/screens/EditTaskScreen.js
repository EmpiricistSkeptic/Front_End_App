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
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function EditTaskScreen({ navigation, route }) {
  const { taskId } = route.params;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [formattedDeadline, setFormattedDeadline] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

  // Added fields to match CreateTaskScreen
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('Select category');
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedUnitType, setSelectedUnitType] = useState(null);
  const [selectedUnitTypeName, setSelectedUnitTypeName] = useState('Select unit type');
  const [unitAmount, setUnitAmount] = useState('');
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);
  
  // DateTimePicker states
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

  useEffect(() => {
    fetchCategoriesAndUnitTypes();
  }, []);

  // Format deadline date for display
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

  const fetchCategoriesAndUnitTypes = async () => {
    setLoadingData(true);

    // Fetch Categories
    try {
      const response = await apiService.get('categories/');
      console.log('categoriesResponse =', response);
      const categoriesData = Array.isArray(response)
        ? response
        : response.results ?? [];

      setCategories(categoriesData);
    } catch (err) {
      console.error('Error fetching categories:', err);
      Alert.alert('Error', 'Failed to load categories.');
      setLoadingData(false);
      return;
    }

    // Fetch Unit Types
    try {
      const response = await apiService.get('unit-types/');
      console.log('unitTypesResponse =', response);
      const unitTypesData = Array.isArray(response)
        ? response
        : response.results ?? [];

      setUnitTypes(unitTypesData);
    } catch (err) {
      console.error('Error fetching unit types:', err);
      Alert.alert('Error', 'Failed to load unit types.');
    } finally {
      setLoadingData(false);
      // Now fetch task details after categories and unit types are loaded
      fetchTaskDetails();
    }
  };
  
  const fetchTaskDetails = async () => {
    try {
      console.log('Fetching task with ID:', taskId);
      
      if (!taskId) {
        console.error('Task ID is missing');
        Alert.alert('Error', 'Task ID is missing. Please try again.');
        setLoading(false);
        return;
      }
      
      const response = await apiService.get(`tasks/${taskId}/`);
      console.log('Task details response:', JSON.stringify(response));
      
      if (response) {
        const task = response;
        console.log('Task data received:', task);
        
        setTitle(task.title || '');
        setDescription(task.description || '');
        setDifficulty(task.difficulty || 'B');
        
        // Set deadline date
        if (task.deadline) {
          setDeadlineDate(new Date(task.deadline));
        }
        
        setPoints((task.points || 0).toString());
        
        // Set category if exists
        if (task.category_id) {
          setSelectedCategory(task.category_id);
          // Find category name by ID
          const category = categories.find(cat => cat.id === task.category_id);
          if (category) {
            setSelectedCategoryName(category.name);
          }
        }
        
        // Set unit type if exists
        if (task.unit_type_id) {
          setSelectedUnitType(task.unit_type_id);
          // Find unit type name by ID
          const unitType = unitTypes.find(ut => ut.id === task.unit_type_id);
          if (unitType) {
            setSelectedUnitTypeName(`${unitType.name} (${unitType.symbol})`);
          }
        }
        
        // Set unit amount if exists
        if (task.unit_amount) {
          setUnitAmount(task.unit_amount.toString());
        }
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

  const handleUpdateTask = async () => {
    if (!title) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const pointsNumber = parseInt(points);
    if (isNaN(pointsNumber) || pointsNumber < 0) {
      Alert.alert('Error', 'Points must be a positive number');
      return;
    }

    const unitAmountNumber = parseInt(unitAmount);
    if (isNaN(unitAmountNumber) || unitAmountNumber < 0) {
      Alert.alert('Error', 'Unit amount must be a positive number');
      return;
    }
    
    setLoading(true);

    try {
      const updateData = {
        title,
        description: description || "",
        difficulty,
        deadline: deadlineDate.toISOString(),
        points: pointsNumber,
        category_id: selectedCategory,
        unit_type_id: selectedUnitType,
        unit_amount: unitAmountNumber
      };
      
      console.log('Updating task with data:', updateData);
      
      await apiService.put(`tasks/${taskId}/`, updateData);

      Alert.alert('Success', 'Task updated successfully!');
      navigation.navigate('Home', { taskUpdated: true });
    } catch (error) {
      console.error('Error updating task', error);
      
      if (error.response && error.response.status === 405) {
        try {
          console.log('PUT failed with 405, trying PATCH instead');
          await apiService.patch(`tasks/${taskId}/update/`, {
            title,
            description: description || "",
            difficulty,
            deadline: deadlineDate.toISOString(),
            points: pointsNumber,
            category_id: selectedCategory,
            unit_type_id: selectedUnitType,
            unit_amount: unitAmountNumber
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

  // Show DateTimePicker for selecting date or time
  const showDateTimePicker = (mode) => {
    setDateTimePickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  // Handle date/time changes
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadlineDate;
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
    
    if (dateTimePickerMode === 'date') {
      // Update date while preserving time
      const newDate = new Date(currentDate);
      newDate.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
      setDeadlineDate(newDate);
      
      // On Android, show time picker after date selection
      if (event.type === 'set' && Platform.OS === 'android') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 500);
      }
    } else {
      // Update time while preserving date
      const newDate = new Date(deadlineDate);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      setDeadlineDate(newDate);
    }
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </LinearGradient>
      </View>
    );
  }

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

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.dropdownButtonText}>{selectedCategoryName}</Text>
            <Ionicons name="chevron-down" size={20} color="#ffffff" />
          </TouchableOpacity>

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

          <Text style={styles.label}>Unit Type</Text>
          <TouchableOpacity 
            style={styles.dropdownButton}
            onPress={() => setShowUnitTypeModal(true)}
          >
            <Text style={styles.dropdownButtonText}>{selectedUnitTypeName}</Text>
            <Ionicons name="chevron-down" size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.label}>Unit Amount</Text>
          <TextInput
            style={styles.input}
            value={unitAmount}
            onChangeText={setUnitAmount}
            placeholder="Enter unit amount"
            placeholderTextColor="#88889C"
            keyboardType="numeric"
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
            disabled={loading}
          >
            <LinearGradient
              colors={['#4dabf7', '#3250b4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>UPDATE TASK</Text>
              )}
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </ScrollView>

        {/* Modal for category selection */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <FlatList
                data={categories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      setSelectedCategoryName(item.name);
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText, 
                      selectedCategory === item.id && styles.selectedModalItemText
                    ]}>
                      {item.name}
                    </Text>
                    {selectedCategory === item.id && (
                      <Ionicons name="checkmark" size={20} color="#4dabf7" />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Modal for unit type selection */}
        <Modal
          visible={showUnitTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUnitTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Unit Type</Text>
              <FlatList
                data={unitTypes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedUnitType(item.id);
                      setSelectedUnitTypeName(`${item.name} (${item.symbol})`);
                      setShowUnitTypeModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText, 
                      selectedUnitType === item.id && styles.selectedModalItemText
                    ]}>
                      {`${item.name} (${item.symbol})`}
                    </Text>
                    {selectedUnitType === item.id && (
                      <Ionicons name="checkmark" size={20} color="#4dabf7" />
                    )}
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUnitTypeModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  dropdownButton: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderWidth: 1,
    borderColor: '#3250b4',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: 400,
    backgroundColor: '#121539',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3250b4',
    padding: 20,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  modalItemText: {
    color: '#ffffff',
    fontSize: 16,
  },
  selectedModalItemText: {
    color: '#4dabf7',
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
