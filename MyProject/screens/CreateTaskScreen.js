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
  Platform,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function CreateTaskScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [points, setPoints] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('Select category');
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedUnitType, setSelectedUnitType] = useState(null);
  const [selectedUnitTypeName, setSelectedUnitTypeName] = useState('Select unit type');
  const [unitAmount, setUnitAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Состояния для модальных окон выбора
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);
  
  // Состояния для работы с DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

  // Форматированная строка дедлайна для отображения
  const [formattedDeadline, setFormattedDeadline] = useState('');

  // Загружаем категории и типы единиц измерения при монтировании компонента
  useEffect(() => {
    fetchCategoriesAndUnitTypes();
  }, []);

  // Удаляем не сериализуемый callback из navigation params
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
  }, []);

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

  const fetchCategoriesAndUnitTypes = async () => {
  setLoadingData(true);

  // Categories
  try {
    const response = await apiService.get('categories/');
    console.log('categoriesResponse =', response);
    const categoriesData = Array.isArray(response)
      ? response
      : response.results ?? [];

    setCategories(categoriesData);
    if (categoriesData.length) {
      setSelectedCategory(categoriesData[0].id);
      setSelectedCategoryName(categoriesData[0].name);
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    Alert.alert('Error', 'Не удалось загрузить категории.');
    setLoadingData(false);
    return;
  }

  // Unit Types
  try {
    const response = await apiService.get('unit-types/');
    console.log('unitTypesResponse =', response);
    const unitTypesData = Array.isArray(response)
      ? response
      : response.results ?? [];

    setUnitTypes(unitTypesData);
    if (unitTypesData.length) {
      setSelectedUnitType(unitTypesData[0].id);
      setSelectedUnitTypeName(
        `${unitTypesData[0].name} (${unitTypesData[0].symbol})`
      );
    }
  } catch (err) {
    console.error('Error fetching unit types:', err);
    Alert.alert('Error', 'Не удалось загрузить типы единиц.');
  } finally {
    setLoadingData(false);
  }
};




  const handleCreateTask = async () => {
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
      // Формируем дедлайн в формате, который ожидает API
      const deadline = deadlineDate.toISOString();
      
      await apiService.post('tasks/', {
        title,
        description: description || "",
        difficulty,
        deadline,
        points: pointsNumber,
        completed: false,
        category_id: selectedCategory,
        unit_type_id: selectedUnitType,
        unit_amount: unitAmountNumber
      });

      Alert.alert('Success', 'Task created successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task', error.response ? error.response.data : error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
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
            style={styles.createButton}
            onPress={handleCreateTask}
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
                <Text style={styles.buttonText}>CREATE TASK</Text>
              )}
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </ScrollView>
        
        {/* Modal для выбора категории */}
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
        
        {/* Modal для выбора типа единицы измерения */}
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
  // Стили для компонентов выбора даты и времени
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