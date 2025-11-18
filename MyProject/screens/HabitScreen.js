import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
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
      console.warn('Invalid date string for checkIsToday:', dateString);
      return false;
    }
    return isToday(date);
  } catch (e) {
    console.error('Error in checkIsToday:', dateString, e);
    return false;
  }
};

// Безопасное форматирование даты
const safeFormatDate = (dateString, fallback = 'Never', pattern = 'MMM d, yyyy') => {
  if (!dateString) return fallback;
  try {
    const date = parseISO(dateString);
    if (Number.isNaN(date.getTime())) return fallback;
    return format(date, pattern);
  } catch (e) {
    console.warn('Error in safeFormatDate:', dateString, e);
    return fallback;
  }
};

// Список доступных иконок и иконка по умолчанию
const availableIcons = [
  'dumbbell',
  'running',
  'book',
  'bed',
  'apple-alt',
  'tint',
  'pray',
  'list-ul',
  'laptop-code',
  'music',
  'paint-brush',
  'ban',
  'leaf',
  'tasks',
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
  const [formData, setFormData] = useState({
    // Данные формы
    title: '',
    description: '',
    frequency: 'Daily', // <-- значение по умолчанию
    icon: defaultIcon,
    notification_enabled: false, // <-- значение по умолчанию
  });
  const [submitting, setSubmitting] = useState(false); // Индикатор отправки формы
  const [selectedIcon, setSelectedIcon] = useState(defaultIcon); // Выбранная иконка в форме
  const [iconSelectorVisible, setIconSelectorVisible] = useState(false); // Видимость выбора иконок

  // --- Мемоизированные частицы фона ---
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        width: Math.random() * 4 + 1,
        height: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  // --- Логика и Эффекты ---

  // Получение списка привычек с сервера
  const fetchHabits = useCallback(
    async (page = 1, { withSpinner = false } = {}) => {
      if (withSpinner) setLoading(true);
      try {
        const response = await apiService.get(`habits/?page=${page}`);
        console.log('habitsResponse =', response);

        let habitsData = [];
        if (response && typeof response === 'object') {
          habitsData = response.results || [];
        } else if (Array.isArray(response)) {
          habitsData = response;
        }

        setHabits(habitsData);
      } catch (error) {
        console.error('Error fetching habits:', error?.response?.data || error?.message);

        const status = error?.response?.status ?? error?.status;

        if (status === 401) {
          // истекшая сессия / неавторизован
          Alert.alert('Session expired', 'Please log in again.', [
            {
              text: 'OK',
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                }),
            },
          ]);
          setHabits([]);
          return;
        }

        Alert.alert(
          'Loading Error',
          error?.response?.data?.detail || 'Could not load your habits. Please try again later.'
        );
        setHabits([]);
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [navigation]
  );

  // Загрузка при монтировании с индикатором
  useEffect(() => {
    fetchHabits(1, { withSpinner: true });
  }, [fetchHabits]);

  // Обновление данных при фокусе экрана (без мерцания загрузки)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHabits();
    });
    return unsubscribe;
  }, [navigation, fetchHabits]);

  // Безопасное получение имени иконки
  const getSafeIconName = (iconName) => {
    return iconName && availableIcons.includes(iconName) ? iconName : defaultIcon;
  };

  // --- Обработчики Действий ---

  // Открыть модалку для добавления
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      frequency: 'Daily',
      icon: defaultIcon,
      notification_enabled: false,
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
      frequency: habit.frequency || 'Daily',
      icon: safeIcon,
      notification_enabled: habit.notification_enabled || false,
    });
    setSelectedIcon(safeIcon);
    setIconSelectorVisible(false);
    setCreateEditModalVisible(true);
  };

  // Закрыть модалку деталей
  const handleCloseDetailsModal = () => {
    setSelectedHabit(null);
  };

  // Закрыть модалку создания/редактирования
  const handleCloseCreateEditModal = () => {
    setCreateEditModalVisible(false);
  };

  // Обработчик сохранения (создание или обновление)
  const handleSaveHabit = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the habit.');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      frequency: formData.frequency,
      notification_enabled: formData.notification_enabled,
      icon: selectedIcon,
    };

    try {
      if (isEditing) {
        if (!selectedHabit?.id) {
          throw new Error('Cannot update habit without ID.');
        }
        console.log(`Updating habit ${selectedHabit.id}`);
        await apiService.patch(`habits/${selectedHabit.id}/`, payload);
        Alert.alert('Success', 'Habit updated successfully!');
      } else {
        console.log('Creating new habit');
        await apiService.post('habits/', payload);
        Alert.alert('Success', 'Habit created successfully!');
      }

      handleCloseCreateEditModal();

      if (isEditing && selectedHabit?.id) {
        setSelectedHabit((prev) => (prev ? { ...prev, ...payload } : prev));
      }

      fetchHabits();
    } catch (error) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} habit:`,
        error?.response?.data || error?.message
      );

      const status = error?.response?.status ?? error?.status;
      if (status === 401) {
        Alert.alert('Session expired', 'Please log in again.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ]);
      } else {
        Alert.alert(
          'Save Error',
          `Failed to ${isEditing ? 'update' : 'create'} habit. ${
            error?.response?.data?.detail || 'Please try again.'
          }`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Обработчик удаления привычки
  const handleDeleteHabit = async (habitToDelete) => {
    if (!habitToDelete?.id) return;

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${habitToDelete.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`Deleting habit ${habitToDelete.id}`);
              await apiService.delete(`habits/${habitToDelete.id}/`);
              Alert.alert('Deleted', `Habit "${habitToDelete.title}" deleted.`);
              setHabits((prev) => prev.filter((h) => h.id !== habitToDelete.id));
              handleCloseDetailsModal();
            } catch (error) {
              console.error('Error deleting habit:', error?.response?.data || error?.message);

              const status = error?.response?.status ?? error?.status;
              if (status === 401) {
                Alert.alert('Session expired', 'Please log in again.', [
                  {
                    text: 'OK',
                    onPress: () =>
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      }),
                  },
                ]);
              } else {
                Alert.alert(
                  'Deletion Error',
                  `Failed to delete habit. ${
                    error?.response?.data?.detail || 'Please try again.'
                  }`
                );
              }
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

    // 🔹 Ранний выход: уже отмечено сегодня — не шлём лишний запрос
    if (checkIsToday(habitToTrack.last_tracked)) {
      Alert.alert('Already Tracked', 'You have already marked this habit today.');
      return;
    }

    setTrackingHabitId(habitToTrack.id);

    try {
      console.log(`Sending track request for habit ${habitToTrack.id}`);
      const response = await apiService.post(`habits/${habitToTrack.id}/track/`, {});

      if (response && response.streak !== undefined && response.last_tracked) {
        const updateData = {
          streak: response.streak,
          last_tracked: response.last_tracked,
        };
        setHabits((prevHabits) =>
          prevHabits.map((h) => (h.id === habitToTrack.id ? { ...h, ...updateData } : h))
        );
        if (selectedHabit?.id === habitToTrack.id) {
          setSelectedHabit((prev) => (prev ? { ...prev, ...updateData } : prev));
        }
        console.log(
          `Habit ${habitToTrack.id} tracked successfully. New streak: ${response.streak}`
        );
      } else {
        console.warn(
          'Unexpected successful response format from track endpoint, fetching habits again.'
        );
        fetchHabits();
      }
    } catch (error) {
      console.error(
        'Error tracking habit:',
        error?.response?.data || error?.message,
        error?.response?.status
      );

      const status = error?.response?.status ?? error?.status;

      if (status === 401) {
        Alert.alert('Session expired', 'Please log in again.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
          },
        ]);
      } else if (status === 400) {
        // Уже отмечено на бэке (рассинхрон)
        Alert.alert(
          'Already Tracked',
          error?.response?.data?.detail || 'This habit has already been tracked today.'
        );
        if (
          error?.response?.data?.streak !== undefined &&
          error?.response?.data?.last_tracked
        ) {
          const updateData = {
            streak: error.response.data.streak,
            last_tracked: error.response.data.last_tracked,
          };
          setHabits((prevHabits) =>
            prevHabits.map((h) => (h.id === habitToTrack.id ? { ...h, ...updateData } : h))
          );
          if (selectedHabit?.id === habitToTrack.id) {
            setSelectedHabit((prev) => (prev ? { ...prev, ...updateData } : prev));
          }
        }
      } else if (status === 404) {
        Alert.alert('Not Found', 'Could not find the habit to track.');
        setHabits((prev) => prev.filter((h) => h.id !== habitToTrack.id));
        if (selectedHabit?.id === habitToTrack.id) setSelectedHabit(null);
      } else {
        Alert.alert(
          'Tracking Error',
          error?.response?.data?.detail || 'An unexpected error occurred. Please try again.'
        );
      }
    } finally {
      setTrackingHabitId(null);
    }
  };

  // --- Рендер Функции ---

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
            <Text style={styles.habitTitle} numberOfLines={1} ellipsizeMode="tail">
              {habit.title}
            </Text>
            <Text style={styles.habitFrequency}>{habit.frequency || 'Daily'}</Text>
          </View>
        </View>

        {/* Правая часть: Стрик и Кнопка отметки */}
        <View style={styles.habitRight}>
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color="#ff9500"
              style={styles.streakIcon}
            />
            <Text style={styles.streakText}>{habit.streak || 0}</Text>
          </View>
          <TouchableOpacity
            style={[styles.trackButton, isTracked && styles.trackButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              handleTrackHabit(habit);
            }}
            disabled={isTrackingThis}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isTrackingThis ? (
              <ActivityIndicator size="small" color="#4dabf7" />
            ) : (
              <Ionicons
                name={isTracked ? 'checkmark-circle' : 'ellipse-outline'}
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
    if (!selectedHabit) return null;

    const isTracked = checkIsToday(selectedHabit.last_tracked);
    const iconName = getSafeIconName(selectedHabit.icon);
    const isTrackingThis = trackingHabitId === selectedHabit.id;

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!selectedHabit}
        onRequestClose={handleCloseDetailsModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={handleCloseDetailsModal}
            activeOpacity={1}
          />
          <View style={styles.habitDetailsModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <FontAwesome5 name={iconName} size={24} color="#ffffff" solid />
              </View>
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

            <ScrollView style={styles.modalContentScrollView}>
              <View style={styles.modalContent}>
                {selectedHabit.description ? (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{selectedHabit.description}</Text>
                  </View>
                ) : null}

                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatItem}>
                    <MaterialCommunityIcons name="fire" size={24} color="#ff9500" />
                    <Text style={styles.modalStatValue}>{selectedHabit.streak || 0}</Text>
                    <Text style={styles.modalStatLabel}>Streak</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="calendar-outline" size={24} color="#4dabf7" />
                    <Text style={styles.modalStatValue}>
                      {safeFormatDate(selectedHabit.last_tracked, 'Never', 'MMM d, yyyy')}
                    </Text>
                    <Text style={styles.modalStatLabel}>Last Tracked</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Ionicons name="repeat" size={24} color="#8e8e93" />
                    <Text style={styles.modalStatValue}>
                      {selectedHabit.frequency || 'Daily'}
                    </Text>
                    <Text style={styles.modalStatLabel}>Frequency</Text>
                  </View>
                </View>

                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleOpenEditModal(selectedHabit)}
                  >
                    <LinearGradient
                      colors={['#5856D6', '#4B49AF']}
                      style={styles.editDeleteGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#ffffff"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.editDeleteText}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteHabit(selectedHabit)}
                  >
                    <LinearGradient
                      colors={['#FF3B30', '#D12C22']}
                      style={styles.editDeleteGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#ffffff"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.editDeleteText}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.modalTrackButton,
                    isTracked && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handleTrackHabit(selectedHabit)}
                  disabled={isTrackingThis}
                >
                  <LinearGradient
                    colors={isTracked ? ['#555', '#333'] : ['#34C759', '#28a745']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isTrackingThis ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons
                          name={
                            isTracked
                              ? 'checkmark-done-circle-outline'
                              : 'checkmark-circle-outline'
                          }
                          size={20}
                          color="#ffffff"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.buttonText}>
                          {isTracked ? 'COMPLETED TODAY' : 'MARK AS DONE'}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                  {!isTracked && !isTrackingThis && (
                    <View style={[styles.buttonGlow, styles.trackButtonGlow]} />
                  )}
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
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={handleCloseCreateEditModal}
            activeOpacity={1}
          />
          <View style={styles.createEditModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Habit' : 'Create New Habit'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseCreateEditModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#AEAEB2" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScrollView}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContent}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Icon</Text>
                  <TouchableOpacity
                    style={styles.iconSelector}
                    onPress={() => setIconSelectorVisible(!iconSelectorVisible)}
                  >
                    <View style={styles.selectedIconContainer}>
                      <FontAwesome5 name={selectedIcon} size={24} color="#ffffff" solid />
                    </View>
                    <Text style={styles.iconSelectorText}>Change Icon</Text>
                    <Ionicons
                      name={iconSelectorVisible ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#ffffff"
                    />
                  </TouchableOpacity>
                  {iconSelectorVisible && (
                    <View style={styles.iconsGrid}>
                      {availableIcons.map((icon) => (
                        <TouchableOpacity
                          key={icon}
                          style={[
                            styles.iconOption,
                            selectedIcon === icon && styles.selectedIconOption,
                          ]}
                          onPress={() => {
                            setSelectedIcon(icon);
                            setIconSelectorVisible(false);
                          }}
                        >
                          <FontAwesome5
                            name={icon}
                            size={24}
                            color={selectedIcon === icon ? '#000000' : '#ffffff'}
                            solid
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, title: text }))
                    }
                    placeholder="E.g., Drink Water, Read a Book"
                    placeholderTextColor="#8e8e93"
                    autoCapitalize="sentences"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Description (optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.textareaInput]}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, description: text }))
                    }
                    placeholder="Add details or motivation"
                    placeholderTextColor="#8e8e93"
                    multiline={true}
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>Frequency</Text>
                  <View style={styles.frequencySelector}>
                    {['Daily', 'Weekly', 'Monthly'].map((freq) => (
                      <TouchableOpacity
                        key={freq}
                        style={[
                          styles.frequencyOption,
                          formData.frequency === freq && styles.frequencySelected,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({ ...prev, frequency: freq }))
                        }
                      >
                        <Text
                          style={[
                            styles.frequencyText,
                            formData.frequency === freq && styles.frequencyTextSelected,
                          ]}
                        >
                          {freq}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.formField, styles.notificationToggle]}>
                  <Text style={styles.formLabel}>Notifications</Text>
                  <Switch
                    value={formData.notification_enabled}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        notification_enabled: value,
                      }))
                    }
                    trackColor={{ false: '#767577', true: '#3250b4' }}
                    thumbColor={formData.notification_enabled ? '#4dabf7' : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.notificationText}>
                  Enable reminders for this habit (feature coming soon).
                </Text>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { opacity: submitting ? 0.7 : 1 },
                    ]}
                    onPress={handleSaveHabit}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={['#4dabf7', '#3250b4']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.buttonText}>
                          {isEditing ? 'SAVE CHANGES' : 'CREATE HABIT'}
                        </Text>
                      )}
                    </LinearGradient>
                    {!submitting && (
                      <View style={[styles.buttonGlow, styles.createButtonGlow]} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.cancelButton,
                      { opacity: submitting ? 0.7 : 1 },
                    ]}
                    onPress={handleCloseCreateEditModal}
                    disabled={submitting}
                  >
                    <LinearGradient
                      colors={['#8e8e93', '#636366']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
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

  // --- Основной Рендер Компонента ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Частицы на фоне (мемоизированы, не прыгают) */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.width,
                  height: p.height,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE HABITS</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleOpenAddModal}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.habitsContainer}
            contentContainerStyle={styles.habitsScrollContent}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color="#4dabf7"
                style={{ marginTop: 50 }}
              />
            ) : habits.length === 0 ? (
              <View className="noHabitsContainer" style={styles.noHabitsContainer}>
                <Text style={styles.noHabitsText}>No active habits yet.</Text>
                <Text style={styles.noHabitsSubText}>
                  Tap the '+' button to add your first habit!
                </Text>
              </View>
            ) : (
              habits.map((habit) => renderHabitItem(habit))
            )}
          </ScrollView>
        </View>

        {renderDetailsModal()}
        {renderCreateEditModal()}
      </LinearGradient>
    </View>
  );
}

// --- Стили ---
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
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 5,
  },
  mainContent: {
    flex: 1,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + -30 : 60,
    paddingHorizontal: 15,
    paddingBottom: 10,
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#AEAEB2',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  addButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  habitsContainer: {
    flex: 1,
  },
  habitsScrollContent: {
    paddingBottom: 20,
  },
  noHabitsContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50,
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
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  habitFrequency: {
    fontSize: 13,
    color: '#AEAEB2',
  },
  habitRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ff9500',
    marginRight: 3,
  },
  streakIcon: {},
  trackButton: {
    padding: 5,
  },
  trackButtonDisabled: {},
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  habitDetailsModal: {
    width: width * 0.9,
    maxHeight: height * 0.75,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10,
    shadowColor: '#000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    flex: 1,
    marginRight: 10,
  },
  closeButton: {
    padding: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalContentScrollView: {},
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
    justifyContent: 'space-around',
    marginBottom: 25,
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 5,
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
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    marginRight: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  deleteButton: {
    flex: 1,
    marginLeft: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  editDeleteGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
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
    marginTop: 10,
  },
  createEditModal: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  formScrollView: {},
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
    minHeight: 50,
    paddingVertical: 12,
  },
  textareaInput: {
    minHeight: 90,
    paddingVertical: 15,
    textAlignVertical: 'top',
  },
  iconSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    minHeight: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedIconContainer: {
    width: 36,
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
    padding: 10,
    justifyContent: 'center',
  },
  iconOption: {
    width: (width * 0.9 - 40 - 20 - 12) / 6,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedIconOption: {
    backgroundColor: '#4dabf7',
    borderColor: '#ffffff',
  },
  frequencySelector: {
    flexDirection: 'row',
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    marginHorizontal: 3,
  },
  frequencySelected: {
    backgroundColor: '#4dabf7',
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
  },
  notificationText: {
    fontSize: 13,
    color: '#AEAEB2',
    marginTop: -15,
    marginBottom: 15,
    paddingLeft: 5,
  },
  formActions: {
    marginTop: 10,
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 50,
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonGlow: {
    position: 'absolute',
    bottom: -5,
    left: '15%',
    width: '70%',
    height: 15,
    borderRadius: 10,
    opacity: 0.4,
    zIndex: -1,
  },
  trackButtonGlow: {
    backgroundColor: '#34c759',
  },
  createButtonGlow: {
    backgroundColor: '#4dabf7',
  },
  cancelButton: {},
});
