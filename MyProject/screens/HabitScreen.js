import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar,
  ScrollView, Alert, ActivityIndicator, TextInput, Modal, Switch
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService'; // Убедись, что путь правильный
import { format, isToday, parseISO } from 'date-fns';

// Получаем размеры экрана
const { width, height } = Dimensions.get('window');

// --- Хелперы ---

// Проверка, является ли дата сегодняшней
const checkIsToday = (dateString) => {
  if (!dateString) return false;
  try {
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) {
      console.warn("Invalid date string for checkIsToday:", dateString);
      return false;
    }
    return isToday(date);
  } catch (e) {
    console.error("Error in checkIsToday:", dateString, e);
    return false;
  }
};

// Список доступных иконок и иконка по умолчанию
const availableIcons = [
  'dumbbell', 'running', 'book', 'bed', 'apple-alt', 'tint', 'pray',
  'list-ul', 'laptop-code', 'music', 'paint-brush', 'ban', 'leaf', 'tasks'
];
const defaultIcon = 'list-ul';

// --- Компонент Экрана ---

export default function HabitScreen({ navigation }) {

  // --- Состояния Компонента ---
  const [habits, setHabits] = useState([]); // Список привычек
  const [selectedHabit, setSelectedHabit] = useState(null); // Привычка для просмотра деталей
  const [loading, setLoading] = useState(true); // Индикатор загрузки списка
  const [trackingHabitId, setTrackingHabitId] = useState(null); // ID привычки, которая трекается

  // Состояния для модалки создания/редактирования
  const [createEditModalVisible, setCreateEditModalVisible] = useState(false); // Видимость модалки
  const [isEditing, setIsEditing] = useState(false); // Режим (создание/редактирование)
  const [formData, setFormData] = useState({ // Данные формы
    title: '',
    description: '',
    frequency: 'Daily', // <-- Добавлено значение по умолчанию
    icon: defaultIcon,
    notification_enabled: false // <-- Добавлено значение по умолчанию
  });
  const [submitting, setSubmitting] = useState(false); // Индикатор отправки формы
  const [selectedIcon, setSelectedIcon] = useState(defaultIcon); // Выбранная иконка в форме
  const [iconSelectorVisible, setIconSelectorVisible] = useState(false); // Видимость выбора иконок

  // --- Логика и Эффекты ---

  // Получение списка привычек с сервера
  const fetchHabits = useCallback(async () => {
    // Не устанавливаем setLoading(true) здесь, чтобы избежать мерцания при фокусе
    try {
      const response = await apiService.get('/habits/');
      setHabits(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching habits:', error.response?.data || error.message);
      // Обертка текста ошибки в <Text> не нужна, Alert сам это сделает
      Alert.alert('Loading Error', 'Could not load your habits. Please try again later.');
      setHabits([]);
    } finally {
      // Завершаем начальную загрузку, если она была
      if (loading) setLoading(false);
    }
  }, [loading]); // Зависимость от loading для установки false

  // Начальная загрузка при монтировании компонента
  useEffect(() => {
    const initializeScreen = async () => {
      setLoading(true); // Показываем индикатор при инициализации
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (!userToken) {
          navigation.navigate('Login'); // Переход на логин, если нет токена
          setLoading(false); // Скрываем индикатор
          return;
        }
        await fetchHabits(); // Загружаем данные
      } catch (e) {
        console.error('Initialization failed:', e);
        setLoading(false); // Скрываем индикатор при ошибке
        Alert.alert('Error', 'Failed to initialize the screen.');
      }
    };
    initializeScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]); // Зависимости: navigation (fetchHabits добавлена ниже)

  // Обновление данных при фокусе экрана
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Не устанавливаем setLoading(true) при каждом фокусе, чтобы не было мерцания
      fetchHabits();
    });
    return unsubscribe; // Отписка при размонтировании
  }, [navigation, fetchHabits]); // Зависимости: navigation и fetchHabits

  // Безопасное получение имени иконки
  const getSafeIconName = (iconName) => {
    return iconName && availableIcons.includes(iconName) ? iconName : defaultIcon;
  };

  // --- Обработчики Действий ---

  // Открыть модалку для добавления
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({
      title: '', description: '', frequency: 'Daily',
      icon: defaultIcon, notification_enabled: false
    });
    setSelectedIcon(defaultIcon);
    setIconSelectorVisible(false);
    setCreateEditModalVisible(true);
  };

  // Открыть модалку для редактирования
  const handleOpenEditModal = (habit) => {
    if (!habit) return;
    setIsEditing(true);
    const safeIcon = getSafeIconName(habit.icon);
    setFormData({
      title: habit.title,
      description: habit.description || '',
      frequency: habit.frequency || 'Daily', // Используем значение из привычки
      icon: safeIcon,
      notification_enabled: habit.notification_enabled || false // Используем значение из привычки
    });
    setSelectedIcon(safeIcon);
    // setSelectedHabit(habit); // Не нужно, так как детали уже открыты
    setIconSelectorVisible(false);
    setCreateEditModalVisible(true); // Открываем модалку редактирования
  };

  // Закрыть модалку деталей
  const handleCloseDetailsModal = () => {
    setSelectedHabit(null);
  };

  // Закрыть модалку создания/редактирования
  const handleCloseCreateEditModal = () => {
    setCreateEditModalVisible(false);
    // Сбрасывать formData и selectedIcon здесь не обязательно,
    // т.к. handleOpenAddModal/handleOpenEditModal установят их заново
  };

  // Обработчик сохранения (создание или обновление)
  const handleSaveHabit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the habit.');
      return;
    }
    setSubmitting(true);
    const payload = { title: formData.title.trim(),
      description: formData.description.trim(),
      frequency: formData.frequency, // Добавлено
      notification_enabled: formData.notification_enabled, // Добавлено
      icon: selectedIcon  }; // Используем selectedIcon из состояния

    try {
      if (isEditing) {
        // Обновление существующей привычки
        if (!selectedHabit?.id) {
          throw new Error("Cannot update habit without ID.");
        }
        console.log(`Updating habit ${selectedHabit.id}`);
        response = await apiService.patch(`/habit/${selectedHabit.id}/update/`, payload);
        Alert.alert('Success', 'Habit updated successfully!');
      } else {
        // Создание новой привычки
        console.log('Creating new habit');
        response = await apiService.post('/habit/', payload); // Убедись, что эндпоинт `/habit/` правильный для POST
        Alert.alert('Success', 'Habit created successfully!');
      }
      handleCloseCreateEditModal(); // Закрываем модалку
      if (isEditing && selectedHabit?.id) {
          // Обновляем детали открытой привычки после редактирования
          setSelectedHabit(prev => ({...prev, ...payload}));
      }
      fetchHabits(); // Обновляем список привычек

    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} habit:`, error.response?.data || error.message);
      Alert.alert('Save Error', `Failed to ${isEditing ? 'update' : 'create'} habit. ${error.response?.data?.detail || 'Please try again.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Обработчик удаления привычки
  const handleDeleteHabit = async (habitToDelete) => {
    if (!habitToDelete?.id) return;

    Alert.alert(
      "Confirm Deletion",
      // Явно используем <Text> здесь не нужно, Alert обрабатывает строки
      `Are you sure you want to delete "${habitToDelete.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            try {
              console.log(`Deleting habit ${habitToDelete.id}`);
              await apiService.patch(`/habit/${habitToDelete.id}/delete/`); // Используем PATCH для деактивации
              Alert.alert('Deleted', `Habit "${habitToDelete.title}" deleted.`);
              setHabits(prev => prev.filter(h => h.id !== habitToDelete.id)); // Удаляем из списка локально
              handleCloseDetailsModal(); // Закрываем модалку деталей, если удалили ее
            } catch (error) {
              console.error('Error deleting habit:', error.response?.data || error.message);
              Alert.alert('Deletion Error', `Failed to delete habit. ${error.response?.data?.detail || 'Please try again.'}`);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Обработчик отметки привычки
  const handleTrackHabit = async (habitToTrack) => {
    if (!habitToTrack?.id) {
        Alert.alert('Error', 'Cannot track habit without ID.');
        return;
    }
    setTrackingHabitId(habitToTrack.id);

    try {
      console.log(`Sending track request for habit ${habitToTrack.id}`);
      // Используем URL '/habits/{id}/track/' и метод POST
      const response = await apiService.post(`/habits/${habitToTrack.id}/track/`, {});

      // Обработка успешного ответа (200 OK)
      if (response && response.streak !== undefined && response.last_tracked) {
        const updateData = {
            streak: response.streak,
            last_tracked: response.last_tracked
        };
        setHabits(prevHabits =>
          prevHabits.map(h => h.id === habitToTrack.id ? { ...h, ...updateData } : h)
        );
        if (selectedHabit?.id === habitToTrack.id) {
          setSelectedHabit(prev => ({ ...prev, ...updateData }));
        }
        console.log(`Habit ${habitToTrack.id} tracked successfully. New streak: ${response.streak}`);
      } else {
         console.warn('Unexpected successful response format from track endpoint, fetching habits again.');
         fetchHabits();
      }

    } catch (error) {
      console.error('Error tracking habit:', error.response?.data || error.message, error.response?.status);
      // Обработка ошибки 400 (Уже отмечено)
      if (error.response && error.response.status === 400) {
        Alert.alert('Already Tracked', error.response.data?.detail || 'This habit has already been tracked today.');
        if (error.response.data?.streak !== undefined && error.response.data?.last_tracked) {
             const updateData = { streak: error.response.data.streak, last_tracked: error.response.data.last_tracked };
             setHabits(prevHabits => prevHabits.map(h => h.id === habitToTrack.id ? { ...h, ...updateData } : h));
             if (selectedHabit?.id === habitToTrack.id) setSelectedHabit(prev => ({ ...prev, ...updateData }));
        }
      }
      // Обработка ошибки 404 (Не найдено)
      else if (error.response && error.response.status === 404) {
           Alert.alert('Not Found', 'Could not find the habit to track.');
           setHabits(prev => prev.filter(h => h.id !== habitToTrack.id));
           if (selectedHabit?.id === habitToTrack.id) setSelectedHabit(null);
      }
      // Обработка других ошибок (500 и т.д.)
      else {
          Alert.alert('Tracking Error', error.response?.data?.detail || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setTrackingHabitId(null);
    }
  };


  // --- Рендер Функции для Частей UI (для чистоты) ---

  // Рендер элемента списка привычек
  const renderHabitItem = (habit) => {
    const isTracked = checkIsToday(habit.last_tracked);
    const iconName = getSafeIconName(habit.icon);
    const isTrackingThis = trackingHabitId === habit.id;

    return (
      <TouchableOpacity
        key={habit.id}
        style={[styles.habitItem, isTracked && styles.habitTrackedToday]}
        onPress={() => setSelectedHabit(habit)}
        activeOpacity={0.7}
      >
        {/* Левая часть: Иконка и Информация */}
        <View style={styles.habitLeft}>
          <View style={styles.habitIconContainer}>
            <FontAwesome5 name={iconName} size={20} color="#ffffff" solid />
          </View>
          <View style={styles.habitInfo}>
            {/* Текст названия привычки */}
            <Text style={styles.habitTitle} numberOfLines={1} ellipsizeMode="tail">
              {habit.title}
            </Text>
            {/* Текст частоты */}
            <Text style={styles.habitFrequency}>
              {habit.frequency || 'Daily'}
            </Text>
          </View>
        </View>

        {/* Правая часть: Стрик и Кнопка отметки */}
        <View style={styles.habitRight}>
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons name="fire" size={18} color="#ff9500" style={styles.streakIcon} />
            {/* Текст стрика */}
            <Text style={styles.streakText}>{habit.streak || 0}</Text>
          </View>
          <TouchableOpacity
            style={[styles.trackButton, isTracked && styles.trackButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation(); // Не открывать детали при нажатии на кнопку
              handleTrackHabit(habit);
            }}
            disabled={isTrackingThis} // Дизейблим только во время запроса
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isTrackingThis ? (
              <ActivityIndicator size="small" color="#4dabf7" />
            ) : (
              <Ionicons
                name={isTracked ? "checkmark-circle" : "ellipse-outline"}
                size={28}
                color={isTracked ? '#34c759' : '#4dabf7'}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Рендер модального окна деталей
  const renderDetailsModal = () => {
    if (!selectedHabit) return null; // Не рендерим, если нет выбранной привычки

    const isTracked = checkIsToday(selectedHabit.last_tracked);
    const iconName = getSafeIconName(selectedHabit.icon);
    const isTrackingThis = trackingHabitId === selectedHabit.id;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={true} // Управляется наличием selectedHabit
        onRequestClose={handleCloseDetailsModal}
      >
        <View style={styles.modalOverlay}>
          {/* Фон для закрытия */}
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={handleCloseDetailsModal}
            activeOpacity={1}
          />
          {/* Контейнер модалки */}
          <View style={styles.habitDetailsModal}>
            {/* Заголовок модалки */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <FontAwesome5 name={iconName} size={24} color="#ffffff" solid />
              </View>
              {/* Текст заголовка */}
              <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="middle">
                {selectedHabit.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseDetailsModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#AEAEB2" />
              </TouchableOpacity>
            </View>

            {/* Контент модалки (скроллируемый) */}
            <ScrollView style={styles.modalContentScrollView}>
              <View style={styles.modalContent}>
                {/* Описание (если есть) */}
                {selectedHabit.description ? (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{selectedHabit.description}</Text>
                  </View>
                ) : null /* Важно вернуть null, а не пустую строку */}

                {/* Статистика */}
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatItem}>
                    <MaterialCommunityIcons name="fire" size={24} color="#ff9500" />
                    <Text style={styles.modalStatValue}>{selectedHabit.streak || 0}</Text>
                    <Text style={styles.modalStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="calendar-outline" size={24} color="#4dabf7" />
                    {/* Текст даты последней отметки */}
                    <Text style={styles.modalStatValue}>
                      {selectedHabit.last_tracked
                        ? format(parseISO(selectedHabit.last_tracked), 'MMM d, yyyy')
                        : 'Never' /* Текст, если не отмечено */}
                    </Text>
                    <Text style={styles.modalStatLabel}>Last Tracked</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="repeat" size={24} color="#8e8e93" />
                    <Text style={styles.modalStatValue}>{selectedHabit.frequency || 'Daily'}</Text>
                    <Text style={styles.modalStatLabel}>Frequency</Text>
                  </View>
                </View>

                {/* Кнопки Редактировать/Удалить */}
                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleOpenEditModal(selectedHabit)}>
                    <LinearGradient colors={['#5856D6', '#4B49AF']} style={styles.editDeleteGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="create-outline" size={18} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.editDeleteText}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteHabit(selectedHabit)}>
                    <LinearGradient colors={['#FF3B30', '#D12C22']} style={styles.editDeleteGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name="trash-outline" size={18} color="#ffffff" style={{ marginRight: 5 }} />
                      <Text style={styles.editDeleteText}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {/* Кнопка Отметить */}
                <TouchableOpacity
                  style={[styles.actionButton, styles.modalTrackButton, isTracked && styles.actionButtonDisabled]}
                  onPress={() => handleTrackHabit(selectedHabit)}
                  disabled={isTrackingThis} // Дизейблим во время запроса
                >
                  <LinearGradient
                    colors={isTracked ? ['#555', '#333'] : ['#34C759', '#28a745']}
                    style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {isTrackingThis ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name={isTracked ? "checkmark-done-circle-outline" : "checkmark-circle-outline"} size={20} color="#ffffff" style={{ marginRight: 8 }} />
                        {/* Текст кнопки */}
                        <Text style={styles.buttonText}>
                          {isTracked ? 'COMPLETED TODAY' : 'MARK AS DONE'}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  {/* Свечение под кнопкой */}
                  {!isTracked && !isTrackingThis && <View style={[styles.buttonGlow, styles.trackButtonGlow]} />}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Рендер модального окна создания/редактирования
  const renderCreateEditModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={createEditModalVisible}
        onRequestClose={handleCloseCreateEditModal}
      >
        <View style={styles.modalOverlay}>
          {/* Фон для закрытия */}
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={handleCloseCreateEditModal}
            activeOpacity={1}
          />
          {/* Контейнер модалки */}
          <View style={styles.createEditModal}>
            {/* Заголовок */}
            <View style={styles.modalHeader}>
              {/* Текст заголовка */}
              <Text style={styles.modalTitle}>{isEditing ? "Edit Habit" : "Create New Habit"}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseCreateEditModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#AEAEB2" />
              </TouchableOpacity>
            </View>

            {/* Форма (скроллируемая) */}
            <ScrollView style={styles.formScrollView} keyboardShouldPersistTaps="handled">
              <View style={styles.formContent}>
                {/* Поле: Иконка */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Icon</Text>
                  <TouchableOpacity style={styles.iconSelector} onPress={() => setIconSelectorVisible(!iconSelectorVisible)}>
                    <View style={styles.selectedIconContainer}>
                      <FontAwesome5 name={selectedIcon} size={24} color="#ffffff" solid />
                    </View>
                    <Text style={styles.iconSelectorText}>Change Icon</Text>
                    <Ionicons name={iconSelectorVisible ? "chevron-up" : "chevron-down"} size={20} color="#ffffff" />
                  </TouchableOpacity>
                  {/* Выбор иконок (если видимый) */}
                  {iconSelectorVisible && (
                    <View style={styles.iconsGrid}>
                      {availableIcons.map(icon => (
                        <TouchableOpacity
                          key={icon}
                          style={[styles.iconOption, selectedIcon === icon && styles.selectedIconOption]}
                          onPress={() => { setSelectedIcon(icon); setIconSelectorVisible(false); }}
                        >
                          <FontAwesome5 name={icon} size={24} color={selectedIcon === icon ? '#000000' : '#ffffff'} solid />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Поле: Название */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.title}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                    placeholder="E.g., Drink Water, Read a Book"
                    placeholderTextColor="#8e8e93"
                    autoCapitalize="sentences"
                  />
                </View>

                {/* Поле: Описание */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textareaInput]}
                    value={formData.description}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                    placeholder="Add details or motivation"
                    placeholderTextColor="#8e8e93"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Поле: Частота */}
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Frequency</Text>
                  <View style={styles.frequencySelector}>
                    {['Daily', 'Weekly', 'Monthly'].map(freq => (
                      <TouchableOpacity
                        key={freq}
                        style={[styles.frequencyOption, formData.frequency === freq && styles.frequencySelected]}
                        onPress={() => setFormData(prev => ({ ...prev, frequency: freq }))}
                      >
                        {/* Текст опции частоты */}
                        <Text style={[styles.frequencyText, formData.frequency === freq && styles.frequencyTextSelected]}>
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Поле: Уведомления */}
                <View style={[styles.formField, styles.notificationToggle]}>
                  <Text style={styles.formLabel}>Notifications</Text>
                  <Switch
                    value={formData.notification_enabled}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, notification_enabled: value }))}
                    trackColor={{ false: '#767577', true: '#3250b4' }}
                    thumbColor={formData.notification_enabled ? '#4dabf7' : '#f4f3f4'}
                  />
                </View>
                {/* Поясняющий текст под переключателем */}
                 <Text style={styles.notificationText}>
                    Enable reminders for this habit (feature coming soon).
                 </Text>

                {/* Кнопки Сохранить/Отмена */}
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleSaveHabit}
                    disabled={submitting}
                  >
                    <LinearGradient colors={['#4dabf7', '#3250b4']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        // Текст кнопки сохранения
                        <Text style={styles.buttonText}>{isEditing ? 'SAVE CHANGES' : 'CREATE HABIT'}</Text>
                      )}
                    </LinearGradient>
                    {/* Свечение под кнопкой */}
                    {!submitting && <View style={[styles.buttonGlow, styles.createButtonGlow]} />}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton, { opacity: submitting ? 0.7 : 1 }]}
                    onPress={handleCloseCreateEditModal}
                    disabled={submitting}
                  >
                    <LinearGradient colors={['#8e8e93', '#636366']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      {/* Текст кнопки отмены */}
                      <Text style={styles.buttonText}>CANCEL</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Рендер частиц фона (если нужны)
  const renderParticles = () => {
      return (
        <View style={styles.particlesContainer} pointerEvents="none">
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.particle,
                { // Динамические стили для случайного расположения
                  left: Math.random() * width,
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3
                }
              ]}
            >
              {/* ВАЖНО: Пустой <Text /> внутри пустого <View>, чтобы избежать потенциальной ошибки */}
              <Text />
            </View>
          ))}
        </View>
      );
  };

  // --- Основной Рендер Компонента ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>

        {/* Частицы на фоне */}
        {renderParticles()}

        {/* Основной контент экрана */}
        <View style={styles.mainContent}>
          {/* Заголовок секции и кнопка добавления */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE HABITS</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Контейнер для списка привычек */}
          <ScrollView
            style={styles.habitsContainer}
            contentContainerStyle={styles.habitsScrollContent} // Добавляет отступ снизу
          >
            {/* Условный рендеринг: Загрузка / Пустой список / Список привычек */}
            {loading ? (
              <ActivityIndicator size="large" color="#4dabf7" style={{ marginTop: 50 }} />
            ) : habits.length === 0 ? (
              // Сообщение, если привычек нет (текст обернут)
              <View style={styles.noHabitsContainer}>
                <Text style={styles.noHabitsText}>No active habits yet.</Text>
                <Text style={styles.noHabitsSubText}>Tap the '+' button to add your first habit!</Text>
              </View>
            ) : (
              // Рендерим список привычек
              habits.map(habit => renderHabitItem(habit))
            )}
          </ScrollView>
        </View>

        {/* Рендер модальных окон (будут показаны только если есть selectedHabit или createEditModalVisible) */}
        {renderDetailsModal()}
        {renderCreateEditModal()}

      </LinearGradient>
    </View>
  );
}

// --- Стили ---
// Используем твои стили без изменений
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    // pointerEvents: 'none', // Добавлено в JSX
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Полупрозрачные белые точки
    borderRadius: 5, // Круглые частицы
  },
  mainContent: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + -30 : 60, // Отступ сверху
    paddingHorizontal: 15,
    paddingBottom: 10,
    zIndex: 1, // Поверх частиц
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    // borderBottomWidth: 1,
    // borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AEAEB2', // Серый цвет для заголовка секции
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  habitsContainer: {
    flex: 1, // Занимает оставшееся место
  },
  habitsScrollContent: {
    paddingBottom: 20, // Отступ снизу для последнего элемента
  },
  noHabitsContainer: {
      flexGrow: 1, // Чтобы занимало место, если ScrollView пустой
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 50, // Сдвинуть текст чуть выше центра
  },
  noHabitsText: {
      fontSize: 18,
      color: '#ffffff',
      marginBottom: 10,
      textAlign: 'center',
  },
  noHabitsSubText: {
      fontSize: 14,
      color: '#AEAEB2',
      textAlign: 'center',
      paddingHorizontal: 20,
  },
  habitItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  habitTrackedToday: {
    // borderColor: '#34c759', // Зеленая рамка
    // borderWidth: 1.5,
    backgroundColor: 'rgba(52, 199, 89, 0.15)', // Полупрозрачный зеленый фон
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Занимает доступное место слева
    marginRight: 10,
  },
  habitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: {
    flex: 1, // Позволяет тексту сужаться
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 13,
    color: '#AEAEB2', // Серый цвет
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15, // Отступ до кнопки трека
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ff9500', // Оранжевый цвет для стрика
    marginRight: 3,
  },
  streakIcon: {
    // Стили для иконки огня уже заданы
  },
  trackButton: {
    padding: 5, // Небольшой паддинг для области нажатия
  },
  trackButtonDisabled: {
    // Стили для дизейбл кнопки не нужны, иконка меняет цвет
  },

  // Стили для модальных окон
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Используем position absolute для рендеринга поверх всего
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000, // Высокий zIndex
  },
  modalBackground: { // Фон для закрытия по тапу
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', // Более темный фон
      zIndex: 1, // Под модалкой, но над остальным контентом
  },

  // Стили для модалки деталей
  habitDetailsModal: {
    width: width * 0.9,
    maxHeight: height * 0.75, // Ограничение высоты
    backgroundColor: '#1C1C1E', // Темно-серый фон модалки
    borderRadius: 20,
    padding: 0, // Убираем общий паддинг, добавляем в header/content
    overflow: 'hidden', // Чтобы градиенты кнопок не вылезали
    zIndex: 2, // Поверх фона
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10, // Тень для Android
    shadowColor: '#000', // Тень для iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)' // Немного другой фон для хедера
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1, // Занимает доступное место
    marginRight: 10, // Отступ от кнопки закрытия
  },
  closeButton: {
    padding: 8, // Увеличим область нажатия
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContentScrollView: {
     // maxHeight учтен в habitDetailsModal
  },
  modalContent: {
    padding: 20,
  },
  descriptionContainer: {
      marginBottom: 20,
      padding: 15,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 8,
  },
  descriptionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: '#AEAEB2',
      marginBottom: 5,
      textTransform: 'uppercase',
  },
  descriptionText: {
      fontSize: 15,
      color: '#ffffff',
      lineHeight: 21,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Используем space-around для отступов
    marginBottom: 25,
    // Убрал рамки сверху/снизу, они были лишними
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1, // Равномерно делят ширину
    paddingHorizontal: 5, // Небольшой отступ между элементами
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 5,
    marginBottom: 2,
    textAlign: 'center',
  },
  modalStatLabel: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  editDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Кнопки по краям
    marginBottom: 20, // Отступ до кнопки трека
  },
  editButton: { // Используем flex: 1 для равной ширины
    flex: 1,
    marginRight: 5, // Маленький отступ между кнопками
    borderRadius: 10,
    overflow: 'hidden',
  },
  deleteButton: { // Используем flex: 1 для равной ширины
    flex: 1,
    marginLeft: 5, // Маленький отступ между кнопками
    borderRadius: 10,
    overflow: 'hidden',
  },
  editDeleteGradient: {
    paddingVertical: 12,
    // borderRadius уже есть у родителя
    flexDirection: 'row', // Для иконки и текста
    justifyContent: 'center',
    alignItems: 'center',
  },
  editDeleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalTrackButton: {
      marginTop: 10, // Отступ сверху для кнопки трека в модалке
  },

  // Стили для модалки создания/редактирования
  createEditModal: {
    width: width * 0.9,
    maxHeight: height * 0.85, // Чуть больше высота
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
    zIndex: 2, // Поверх фона
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10, // Тень для Android
    shadowColor: '#000', // Тень для iOS
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  formScrollView: {
      // MaxHeight учтен в createEditModal
  },
  formContent: {
    padding: 20,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AEAEB2',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minHeight: 50, // Минимальная высота для однострочного
    paddingVertical: 12, // Вертикальный паддинг
  },
  textareaInput: {
    minHeight: 90, // Увеличил высоту для удобства
    paddingVertical: 15, // Увеличил вертикальный паддинг
    textAlignVertical: 'top', // Для Android
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10, // Уменьшил паддинг
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedIconContainer: {
      width: 36, // Уменьшил размер
      height: 36,
      borderRadius: 6,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  iconSelectorText: {
      flex: 1,
      fontSize: 16,
      color: '#ffffff',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10, // Паддинг вокруг сетки
    justifyContent: 'center', // Центрируем иконки если их мало
  },
  iconOption: {
    // Рассчитываем ширину на основе доступного пространства и количества иконок в ряду (например, 6)
    // width = (modalWidth - totalPadding) / itemsPerRow
    width: (width * 0.9 - 40 - 20 - 12) / 6, // 40=padding*2, 20=gridPadding*2, 12=margin*2*кол-во_пробелов
    aspectRatio: 1, // Квадратные иконки
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3, // Уменьшил отступ
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedIconOption: {
    backgroundColor: '#4dabf7', // Цвет выделения
    borderColor: '#ffffff',
  },
  frequencySelector: {
    flexDirection: 'row',
    // backgroundColor: 'rgba(255, 255, 255, 0.1)', // Фон не нужен, т.к. у опций есть
    borderRadius: 8,
    overflow: 'hidden', // Чтобы скруглить углы у опций
    // borderWidth: 1, // Убрал общую рамку
    // borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  frequencyOption: {
    flex: 1, // Равномерно делит пространство
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Добавляем отступы между кнопками и скругление
    borderRadius: 8,
    marginHorizontal: 3,
  },
  frequencySelected: {
    backgroundColor: '#4dabf7', // Цвет выделения
    borderColor: '#4dabf7',
  },
  frequencyText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  frequencyTextSelected: {
    fontWeight: 'bold',
  },
  notificationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Убрал стили контейнера, теперь это просто поле
    // marginBottom у formField
  },
  notificationText: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: -15, // Поднимаем под переключатель
    marginBottom: 15, // Отодвигаем кнопки
    paddingLeft: 5, // Небольшой отступ слева
  },
  formActions: {
    marginTop: 10, // Небольшой отступ перед кнопками
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 15, // Отступ между кнопками
    overflow: 'hidden', // Для градиента и свечения
    position: 'relative', // Для свечения
    minHeight: 50, // Минимальная высота
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6, // Делаем кнопку полупрозрачной, если она disabled
  },
  buttonGradient: {
    paddingVertical: 16, // Вертикальный паддинг
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row', // Для иконки + текста
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonGlow: { // Эффект свечения (опционально)
      position: 'absolute',
      bottom: -5, // Позиция свечения
      left: '15%',
      width: '70%',
      height: 15, // Высота свечения
      borderRadius: 10,
      opacity: 0.4,
      zIndex: -1,
  },
  trackButtonGlow: {
      backgroundColor: '#34c759', // Зеленое свечение
  },
  createButtonGlow: {
      backgroundColor: '#4dabf7', // Синее свечение
  },
  cancelButton: {
    // Стили для кнопки отмены (можно убрать градиент и сделать проще)
  },
});