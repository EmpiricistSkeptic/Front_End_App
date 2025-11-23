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
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import apiService from '../services/apiService';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function CreateTaskScreen({ navigation, route }) {
  const { t, i18n } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('B');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [points, setPoints] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [unitTypes, setUnitTypes] = useState([]);
  const [selectedUnitType, setSelectedUnitType] = useState(null);
  const [unitAmount, setUnitAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Модалки выбора
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitTypeModal, setShowUnitTypeModal] = useState(false);

  // DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateTimePickerMode, setDateTimePickerMode] = useState('date');

  // --- Derived: имена для dropdown'ов ---
  const selectedCategoryName = useMemo(() => {
    const found = categories.find((c) => c.id === selectedCategory);
    return found ? found.name : t('createTask.placeholders.selectCategory');
  }, [categories, selectedCategory, t]);

  const selectedUnitTypeName = useMemo(() => {
    const found = unitTypes.find((u) => u.id === selectedUnitType);
    if (!found) return t('createTask.placeholders.selectUnitType');
    const symbol = found.symbol ? ` (${found.symbol})` : '';
    return `${found.name}${symbol}`;
  }, [unitTypes, selectedUnitType, t]);

  // Форматированная строка дедлайна
  const formattedDeadline = useMemo(() => {
    if (!deadlineDate) return '';

    const locale = i18n.language || 'en-US';

    const dateStr = deadlineDate.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const timeStr = deadlineDate.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return t('createTask.deadline.formatted', { date: dateStr, time: timeStr });
  }, [deadlineDate, i18n.language, t]);

  // --- Эффекты ---

  // Загрузка категорий и unit types параллельно
  useEffect(() => {
    const fetchCategoriesAndUnitTypes = async () => {
      setLoadingData(true);
      try {
        const [categoriesRes, unitTypesRes] = await Promise.all([
          apiService.get('categories/'),
          apiService.get('unit-types/'),
        ]);

        const categoriesData = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes.results ?? [];

        const unitTypesData = Array.isArray(unitTypesRes)
          ? unitTypesRes
          : unitTypesRes.results ?? [];

        setCategories(categoriesData);
        if (categoriesData.length) {
          setSelectedCategory(categoriesData[0].id);
        }

        setUnitTypes(unitTypesData);
        if (unitTypesData.length) {
          setSelectedUnitType(unitTypesData[0].id);
        }
      } catch (err) {
        console.error('Error fetching dictionaries:', err);
        Alert.alert(
          t('createTask.alerts.errorTitle'),
          t('createTask.alerts.loadDictionariesFail')
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchCategoriesAndUnitTypes();
  }, [t]);

  // Удаляем не сериализуемый callback из navigation params — только один раз
  useEffect(() => {
    if (route?.params?.onGoBack) {
      const { onGoBack, ...rest } = route.params;
      navigation.setParams(rest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Валидация формы для disabled кнопки ---
  const isFormValid =
    title.trim().length > 0 &&
    selectedCategory &&
    selectedUnitType &&
    points.trim() !== '' &&
    unitAmount.trim() !== '';

  // --- Handlers ---

  const handleCreateTask = async () => {
    if (!title.trim()) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.titleRequired'));
      return;
    }

    if (!selectedCategory) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.categoryRequired'));
      return;
    }

    if (!selectedUnitType) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.unitTypeRequired'));
      return;
    }

    const pointsNumber = parseInt(points, 10);
    if (isNaN(pointsNumber) || pointsNumber <= 0) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.pointsPositive'));
      return;
    }

    const unitAmountNumber = parseInt(unitAmount, 10);
    if (isNaN(unitAmountNumber) || unitAmountNumber <= 0) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.unitAmountPositive'));
      return;
    }

    if (deadlineDate.getTime() <= Date.now()) {
      Alert.alert(t('createTask.alerts.errorTitle'), t('createTask.alerts.deadlineFuture'));
      return;
    }

    setLoading(true);
    try {
      const deadline = deadlineDate.toISOString();

      await apiService.post('tasks/', {
        title: title.trim(),
        description: description || '',
        difficulty,
        deadline,
        points: pointsNumber,
        completed: false,
        category_id: selectedCategory,
        unit_type_id: selectedUnitType,
        unit_amount: unitAmountNumber,
      });

      Alert.alert(
        t('createTask.alerts.successTitle'),
        t('createTask.alerts.createSuccess')
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error creating task', error.response ? error.response.data : error);

      const detail =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        t('createTask.alerts.createFailDefault');

      Alert.alert(t('createTask.alerts.errorTitle'), detail);
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
      const newDate = new Date(currentDate);
      newDate.setHours(deadlineDate.getHours(), deadlineDate.getMinutes());
      setDeadlineDate(newDate);

      if (event.type === 'set' && Platform.OS === 'android') {
        setTimeout(() => {
          showDateTimePicker('time');
        }, 500);
      }
    } else {
      const newDate = new Date(deadlineDate);
      newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      setDeadlineDate(newDate);
    }
  };

  // --- Loading state для справочников ---
  if (loadingData) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>{t('createTask.loading')}</Text>
        </LinearGradient>
      </View>
    );
  }

  // --- Render ---
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('createTask.header')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.form} contentContainerStyle={{ paddingBottom: 50 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>{t('createTask.fields.title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('createTask.placeholders.title')}
            placeholderTextColor="#88889C"
            autoCapitalize="sentences"
            autoCorrect
          />

          <Text style={styles.label}>{t('createTask.fields.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('createTask.placeholders.description')}
            placeholderTextColor="#88889C"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>{t('createTask.fields.category')}</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={styles.dropdownButtonText}>{selectedCategoryName}</Text>
            <Ionicons name="chevron-down" size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.label}>{t('createTask.fields.difficulty')}</Text>
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

          <Text style={styles.label}>{t('createTask.fields.deadline')}</Text>

          <View style={styles.dateTimeContainer}>
            <Text style={styles.deadlineDisplayText}>
              {formattedDeadline || t('createTask.deadline.noDateSelected')}
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
                  <Text style={styles.dateTimeButtonText}>
                    {t('createTask.buttons.selectDate')}
                  </Text>
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
                  <Text style={styles.dateTimeButtonText}>
                    {t('createTask.buttons.selectTime')}
                  </Text>
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

          <Text style={styles.label}>{t('createTask.fields.unitType')}</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowUnitTypeModal(true)}
          >
            <Text style={styles.dropdownButtonText}>{selectedUnitTypeName}</Text>
            <Ionicons name="chevron-down" size={20} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.label}>{t('createTask.fields.unitAmount')}</Text>
          <TextInput
            style={styles.input}
            value={unitAmount}
            onChangeText={setUnitAmount}
            placeholder={t('createTask.placeholders.unitAmount')}
            placeholderTextColor="#88889C"
            keyboardType="numeric"
          />

          <Text style={styles.label}>{t('createTask.fields.pointsReward')}</Text>
          <TextInput
            style={styles.input}
            value={points}
            onChangeText={setPoints}
            placeholder={t('createTask.placeholders.pointsReward')}
            placeholderTextColor="#88889C"
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[
              styles.createButton,
              (!isFormValid || loading) && { opacity: 0.6 },
            ]}
            onPress={handleCreateTask}
            disabled={loading || !isFormValid}
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
                <Text style={styles.buttonText}>
                  {t('createTask.buttons.createTask')}
                </Text>
              )}
            </LinearGradient>
            <View style={styles.buttonGlow} />
          </TouchableOpacity>
        </ScrollView>

        {/* Modal: Category */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t('createTask.modals.selectCategory')}
              </Text>
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
                <Text style={styles.modalCloseButtonText}>
                  {t('common.close')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal: Unit Type */}
        <Modal
          visible={showUnitTypeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowUnitTypeModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {t('createTask.modals.selectUnitType')}
              </Text>
              <FlatList
                data={unitTypes}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const symbol = item.symbol ? ` (${item.symbol})` : '';
                  const label = `${item.name}${symbol}`;
                  return (
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
                        {label}
                      </Text>
                      {selectedUnitType === item.id && (
                        <Ionicons name="checkmark" size={20} color="#4dabf7" />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowUnitTypeModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>
                  {t('common.close')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

// styles ниже без изменений
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#ffffff', marginTop: 10, fontSize: 16 },
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
  backButton: { padding: 5 },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  placeholder: { width: 34 },
  form: { flex: 1, padding: 20 },
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
  textArea: { height: 100, paddingTop: 12 },
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
  dropdownButtonText: { color: '#ffffff', fontSize: 14 },
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
  modalItemText: { color: '#ffffff', fontSize: 16 },
  selectedModalItemText: { color: '#4dabf7', fontWeight: '500' },
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
  selectedDifficulty: { borderColor: '#ffffff' },
  difficultyText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  createButton: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 30,
    marginBottom: 30,
  },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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
