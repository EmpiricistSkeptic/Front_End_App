import React, { useState, useEffect, useMemo } from 'react';
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
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';

const { width } = Dimensions.get('window');

export default function EditTaskScreen({ navigation, route }) {
  const taskId = route?.params?.taskId;

  // Основные поля задачи
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [points, setPoints] = useState('');
  const [unitAmount, setUnitAmount] = useState('');

  // Справочники
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedUnitType, setSelectedUnitType] = useState(null);

  // Загрузка / сохранение
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Модалки
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);

  // DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

  // Убираем не сериализуемый callback из params, если он там есть
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
  }, []); // один раз при монтировании

  // Загрузка категорий, типов единиц и деталей задачи (параллельно)
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!taskId) {
        Alert.alert('Error', 'Task ID is missing. Please try again.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      try {
        const [categoriesRes, unitTypesRes, taskRes] = await Promise.all([
          apiService.get('categories/'),
          apiService.get('unit-types/'),
          apiService.get(`tasks/${taskId}/`),
        ]);

        if (!isMounted) return;

        const categoriesData = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.results ?? [];
        const unitTypesData = Array.isArray(unitTypesRes)
          ? unitTypesRes
          : unitTypesRes?.results ?? [];

        setCategories(categoriesData);
        setUnitTypes(unitTypesData);

        const task = taskRes || {};

        setTitle(task.title || '');
        setDescription(task.description || '');
        setDifficulty(task.difficulty || 'B');

        if (task.deadline) {
          const parsed = new Date(task.deadline);
          if (!Number.isNaN(parsed.getTime())) {
            setDeadlineDate(parsed);
          }
        }

        if (task.points !== undefined && task.points !== null) {
          setPoints(String(task.points));
        }

        if (task.category_id) {
          setSelectedCategory(task.category_id);
        }

        if (task.unit_type_id) {
          setSelectedUnitType(task.unit_type_id);
        }

        if (task.unit_amount !== undefined && task.unit_amount !== null) {
          setUnitAmount(String(task.unit_amount));
        }
      } catch (error) {
        console.error(
          'Error loading task data',
          error?.response?.data || error?.message || error
        );
        if (!isMounted) return;
        Alert.alert('Error', 'Failed to load task data. Please try again.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [taskId, navigation]);

  // Имя выбранной категории — вычисляем, не храним отдельно
  const selectedCategoryName = useMemo(() => {
    if (!selectedCategory) return 'Select category';
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat ? cat.name : 'Select category';
  }, [selectedCategory, categories]);

  // Имя выбранного типа единиц — тоже вычисляем
  const selectedUnitTypeName = useMemo(() => {
    if (!selectedUnitType) return 'Select unit type';
    const ut = unitTypes.find((u) => u.id === selectedUnitType);
    return ut ? `${ut.name} (${ut.symbol})` : 'Select unit type';
  }, [selectedUnitType, unitTypes]);

  // Форматированная дата дедлайна
  const formattedDeadline = useMemo(() => {
    if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) {
      return 'No date selected';
    }
    const dateStr = deadlineDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = deadlineDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${dateStr} at ${timeStr}`;
  }, [deadlineDate]);

  // Минимальная дата для выбора в DateTimePicker:
  // не даём уйти раньше самого раннего из (текущий дедлайн, сейчас)
  const deadlineMinDate = useMemo(() => {
    const now = new Date();
    if (!deadlineDate || Number.isNaN(deadlineDate.getTime())) return now;
    return deadlineDate < now ? deadlineDate : now;
  }, [deadlineDate]);

  const handleDifficultySelection = (value) => {
    setDifficulty(value);
  };

  // Показываем выбор даты/времени
  const showDateTimePicker = (mode) => {
    setDateTimePickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  // Обработка выбора даты / времени
  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || deadlineDate;

    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }

    if (!currentDate || Number.isNaN(new Date(currentDate).getTime())) {
      return;
    }

    if (dateTimePickerMode === 'date') {
      // Обновляем дату, сохраняя текущее время
      const newDate = new Date(currentDate);
      newDate.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
      setDeadlineDate(newDate);

      // На Android сразу после выбора даты открываем время
      if (event.type === 'set' && Platform.OS === 'android') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 300);
      }
    } else {
      // Обновляем время, сохраняя дату
      const newDate = new Date(deadlineDate);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      setDeadlineDate(newDate);
    }
  };

  // Проверки валидности формы
  const isDeadlineValid =
    deadlineDate && !Number.isNaN(deadlineDate.getTime());

  const isFormValid =
    title.trim().length > 0 &&
    !!selectedCategory &&
    !!selectedUnitType &&
    points.trim().length > 0 &&
    unitAmount.trim().length > 0 &&
    isDeadlineValid;

  const handleUpdateTask = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!selectedUnitType) {
      Alert.alert('Error', 'Please select a unit type');
      return;
    }

    if (!isDeadlineValid) {
      Alert.alert('Error', 'Invalid deadline date');
      return;
    }

    const pointsNumber = parseInt(points, 10);
    if (Number.isNaN(pointsNumber) || pointsNumber < 0) {
      Alert.alert('Error', 'Points must be a non-negative integer');
      return;
    }

    const unitAmountNumber = parseInt(unitAmount, 10);
    if (Number.isNaN(unitAmountNumber) || unitAmountNumber < 0) {
      Alert.alert('Error', 'Unit amount must be a non-negative integer');
      return;
    }

    setIsSaving(true);

    const payload = {
      title: title.trim(),
      description: (description || '').trim(),
      difficulty,
      deadline: deadlineDate.toISOString(),
      points: pointsNumber,
      category_id: selectedCategory,
      unit_type_id: selectedUnitType,
      unit_amount: unitAmountNumber,
    };

    try {
      console.log('Updating task with data:', payload);
      await apiService.put(`tasks/${taskId}/`, payload);

      Alert.alert('Success', 'Task updated successfully!');
      navigation.navigate('Home', { taskUpdated: true });
    } catch (error) {
      console.error(
        'Error updating task',
        error?.response?.data || error?.message || error
      );

      // Если бэк не поддерживает PUT, пробуем PATCH по твоей логике
      if (error?.response?.status === 405) {
        try {
          console.log('PUT failed with 405, trying PATCH instead');
          await apiService.patch(`tasks/${taskId}/update/`, payload);

          Alert.alert('Success', 'Task updated successfully!');
          navigation.navigate('Home', { taskUpdated: true });
        } catch (patchError) {
          console.error(
            'Error updating task with PATCH',
            patchError?.response?.data || patchError?.message || patchError
          );
          Alert.alert(
            'Error',
            `Failed to update task with PATCH: ${
              patchError?.message || 'Unknown error'
            }`
          );
        }
      } else {
        Alert.alert(
          'Error',
          `Failed to update task: ${error?.message || 'Unknown error'}`
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  // === Рендер ===

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>Loading task data...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>EDIT TASK</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Форма */}
        <ScrollView style={styles.form}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor="#88889C"
            autoCapitalize="sentences"
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
            autoCapitalize="sentences"
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
                    backgroundColor:
                      difficulty === level
                        ? level === 'S'
                          ? '#ff2d55'
                          : level === 'A'
                          ? '#ff9500'
                          : level === 'B'
                          ? '#4dabf7'
                          : level === 'C'
                          ? '#34c759'
                          : '#8e8e93'
                        : 'rgba(255, 255, 255, 0.1)',
                  },
                ]}
                onPress={() => handleDifficultySelection(level)}
              >
                <Text style={styles.difficultyText}>{level}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Deadline</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.deadlineDisplayText}>{formattedDeadline}</Text>
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
              minimumDate={deadlineMinDate}
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
            style={[
              styles.updateButton,
              (isSaving || !isFormValid) && { opacity: 0.7 },
            ]}
            onPress={handleUpdateTask}
            disabled={isSaving || !isFormValid}
          >
            <LinearGradient
              colors={['#4dabf7', '#3250b4']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>UPDATE TASK</Text>
              )}
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </ScrollView>

        {/* Modal: выбор категории */}
        <Modal
          visible={showCategoryModal}
          transparent
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
                      setShowCategoryModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedCategory === item.id &&
                          styles.selectedModalItemText,
                      ]}
                    >
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

        {/* Modal: выбор unit type */}
        <Modal
          visible={showUnitTypeModal}
          transparent
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
                      setShowUnitTypeModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedUnitType === item.id &&
                          styles.selectedModalItemText,
                      ]}
                    >
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
    backgroundColor:
      Platform.OS === 'ios' ? 'rgba(16, 20, 45, 0.95)' : 'transparent',
    borderRadius: 8,
  },
});
