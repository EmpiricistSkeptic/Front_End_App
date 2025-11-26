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
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import apiService from '../services/apiService';
import { format, isToday, parseISO } from 'date-fns';
import { enUS, es as esLocale } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

// --- Helpers ---
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

const safeFormatDate = (
  dateString,
  fallback = 'Never',
  pattern = 'MMM d, yyyy',
  locale = enUS
) => {
  if (!dateString) return fallback;
  try {
    const date = parseISO(dateString);
    if (Number.isNaN(date.getTime())) return fallback;
    return format(date, pattern, { locale });
  } catch (e) {
    console.warn('Error in safeFormatDate:', dateString, e);
    return fallback;
  }
};

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

export default function HabitScreen({ navigation }) {
  const { t, i18n } = useTranslation();

  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingHabitId, setTrackingHabitId] = useState(null);

  const [createEditModalVisible, setCreateEditModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'Daily',
    icon: defaultIcon,
    notification_enabled: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(defaultIcon);
  const [iconSelectorVisible, setIconSelectorVisible] = useState(false);

  const dateLocale = useMemo(() => {
    const lang = (i18n.language || 'en').toLowerCase();
    return lang.startsWith('es') ? esLocale : enUS;
  }, [i18n.language]);

  const getFrequencyLabel = useCallback(
    (freq) => {
      switch (freq) {
        case 'Weekly':
          return t('habits.frequency.weekly');
        case 'Monthly':
          return t('habits.frequency.monthly');
        case 'Daily':
        default:
          return t('habits.frequency.daily');
      }
    },
    [t]
  );

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
        console.error(
          'Error fetching habits:',
          error?.response?.data || error?.message
        );

        const status = error?.response?.status ?? error?.status;

        if (status === 401) {
          Alert.alert(
            t('habits.alerts.sessionExpiredTitle'),
            t('habits.alerts.sessionExpiredBody'),
            [
              {
                text: t('habits.alerts.ok'),
                onPress: () =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  }),
              },
            ]
          );
          setHabits([]);
          return;
        }

        Alert.alert(
          t('habits.alerts.loadingErrorTitle'),
          error?.response?.data?.detail ||
            t('habits.alerts.loadingErrorBody')
        );
        setHabits([]);
      } finally {
        if (withSpinner) setLoading(false);
      }
    },
    [navigation, t]
  );

  useEffect(() => {
    fetchHabits(1, { withSpinner: true });
  }, [fetchHabits]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHabits();
    });
    return unsubscribe;
  }, [navigation, fetchHabits]);

  const getSafeIconName = (iconName) =>
    iconName && availableIcons.includes(iconName) ? iconName : defaultIcon;

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

  const handleCloseDetailsModal = () => setSelectedHabit(null);
  const handleCloseCreateEditModal = () =>
    setCreateEditModalVisible(false);

  const handleSaveHabit = async () => {
    if (!formData.title.trim()) {
      Alert.alert(
        t('habits.alerts.missingTitleTitle'),
        t('habits.alerts.missingTitleBody')
      );
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
        await apiService.patch(
          `habits/${selectedHabit.id}/`,
          payload
        );
        Alert.alert(
          t('habits.alerts.successTitle'),
          t('habits.alerts.updatedBody')
        );
      } else {
        await apiService.post('habits/', payload);
        Alert.alert(
          t('habits.alerts.successTitle'),
          t('habits.alerts.createdBody')
        );
      }

      handleCloseCreateEditModal();

      if (isEditing && selectedHabit?.id) {
        setSelectedHabit((prev) =>
          prev ? { ...prev, ...payload } : prev
        );
      }

      fetchHabits();
    } catch (error) {
      console.error(
        `Error ${isEditing ? 'updating' : 'creating'} habit:`,
        error?.response?.data || error?.message
      );

      const status = error?.response?.status ?? error?.status;
      if (status === 401) {
        Alert.alert(
          t('habits.alerts.sessionExpiredTitle'),
          t('habits.alerts.sessionExpiredBody'),
          [
            {
              text: t('habits.alerts.ok'),
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                }),
            },
          ]
        );
      } else {
        Alert.alert(
          t('habits.alerts.saveErrorTitle'),
          t('habits.alerts.saveErrorBody', {
            action: isEditing
              ? t('habits.alerts.actionUpdate')
              : t('habits.alerts.actionCreate'),
            detail:
              error?.response?.data?.detail ||
              t('habits.alerts.tryAgain'),
          })
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = async (habitToDelete) => {
    if (!habitToDelete?.id) return;

    Alert.alert(
      t('habits.alerts.confirmDeletionTitle'),
      t('habits.alerts.confirmDeletionBody', {
        title: habitToDelete.title,
      }),
      [
        { text: t('habits.alerts.cancel'), style: 'cancel' },
        {
          text: t('habits.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.delete(
                `habits/${habitToDelete.id}/`
              );
              Alert.alert(
                t('habits.alerts.deletedTitle'),
                t('habits.alerts.deletedBody', {
                  title: habitToDelete.title,
                })
              );
              setHabits((prev) =>
                prev.filter((h) => h.id !== habitToDelete.id)
              );
              handleCloseDetailsModal();
            } catch (error) {
              console.error(
                'Error deleting habit:',
                error?.response?.data || error?.message
              );

              const status =
                error?.response?.status ?? error?.status;
              if (status === 401) {
                Alert.alert(
                  t('habits.alerts.sessionExpiredTitle'),
                  t('habits.alerts.sessionExpiredBody'),
                  [
                    {
                      text: t('habits.alerts.ok'),
                      onPress: () =>
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        }),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  t('habits.alerts.deletionErrorTitle'),
                  t('habits.alerts.deletionErrorBody', {
                    detail:
                      error?.response?.data?.detail ||
                      t('habits.alerts.tryAgain'),
                  })
                );
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleTrackHabit = async (habitToTrack) => {
    if (!habitToTrack?.id) {
      Alert.alert(
        t('habits.alerts.errorTitle'),
        t('habits.alerts.noIdBody')
      );
      return;
    }

    if (checkIsToday(habitToTrack.last_tracked)) {
      Alert.alert(
        t('habits.alerts.alreadyTrackedTitle'),
        t('habits.alerts.alreadyTrackedBody')
      );
      return;
    }

    setTrackingHabitId(habitToTrack.id);

    try {
      const response = await apiService.post(
        `habits/${habitToTrack.id}/track/`,
        {}
      );

      if (
        response &&
        response.streak !== undefined &&
        response.last_tracked
      ) {
        const updateData = {
          streak: response.streak,
          last_tracked: response.last_tracked,
        };
        setHabits((prevHabits) =>
          prevHabits.map((h) =>
            h.id === habitToTrack.id
              ? { ...h, ...updateData }
              : h
          )
        );
        if (selectedHabit?.id === habitToTrack.id) {
          setSelectedHabit((prev) =>
            prev ? { ...prev, ...updateData } : prev
          );
        }
      } else {
        fetchHabits();
      }
    } catch (error) {
      console.error(
        'Error tracking habit:',
        error?.response?.data ||
          error?.message ||
          error?.response?.status
      );

      const status =
        error?.response?.status ?? error?.status;

      if (status === 401) {
        Alert.alert(
          t('habits.alerts.sessionExpiredTitle'),
          t('habits.alerts.sessionExpiredBody'),
          [
            {
              text: t('habits.alerts.ok'),
              onPress: () =>
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                }),
            },
          ]
        );
      } else if (status === 400) {
        Alert.alert(
          t('habits.alerts.alreadyTrackedTitle'),
          error?.response?.data?.detail ||
            t('habits.alerts.alreadyTrackedBackendBody')
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
            prevHabits.map((h) =>
              h.id === habitToTrack.id
                ? { ...h, ...updateData }
                : h
            )
          );
          if (selectedHabit?.id === habitToTrack.id) {
            setSelectedHabit((prev) =>
              prev ? { ...prev, ...updateData } : prev
            );
          }
        }
      } else if (status === 404) {
        Alert.alert(
          t('habits.alerts.notFoundTitle'),
          t('habits.alerts.notFoundBody')
        );
        setHabits((prev) =>
          prev.filter((h) => h.id !== habitToTrack.id)
        );
        if (selectedHabit?.id === habitToTrack.id)
          setSelectedHabit(null);
      } else {
        Alert.alert(
          t('habits.alerts.trackingErrorTitle'),
          error?.response?.data?.detail ||
            t('habits.alerts.trackingErrorBody')
        );
      }
    } finally {
      setTrackingHabitId(null);
    }
  };

  const renderHabitItem = (habit) => {
    const isTracked = checkIsToday(habit.last_tracked);
    const iconName = getSafeIconName(habit.icon);
    const isTrackingThis = trackingHabitId === habit.id;

    return (
      <TouchableOpacity
        key={habit.id}
        style={[
          styles.habitItem,
          isTracked && styles.habitTrackedToday,
        ]}
        onPress={() => setSelectedHabit(habit)}
        activeOpacity={0.7}
      >
        <View style={styles.habitLeft}>
          <View style={styles.habitIconContainer}>
            <FontAwesome5
              name={iconName}
              size={20}
              color="#ffffff"
              solid
            />
          </View>
          <View style={styles.habitInfo}>
            <Text
              style={styles.habitTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {habit.title}
            </Text>
            <Text style={styles.habitFrequency}>
              {getFrequencyLabel(habit.frequency || 'Daily')}
            </Text>
          </View>
        </View>

        <View style={styles.habitRight}>
          <View style={styles.streakContainer}>
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color="#ff9500"
              style={styles.streakIcon}
            />
            <Text style={styles.streakText}>
              {habit.streak || 0}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.trackButton,
              isTracked && styles.trackButtonDisabled,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              handleTrackHabit(habit);
            }}
            disabled={isTrackingThis}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            {isTrackingThis ? (
              <ActivityIndicator size="small" color="#4dabf7" />
            ) : (
              <Ionicons
                name={
                  isTracked
                    ? 'checkmark-circle'
                    : 'ellipse-outline'
                }
                size={28}
                color={isTracked ? '#34c759' : '#4dabf7'}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedHabit) return null;

    const isTracked = checkIsToday(selectedHabit.last_tracked);
    const iconName = getSafeIconName(selectedHabit.icon);
    const isTrackingThis = trackingHabitId === selectedHabit.id;

    return (
      <Modal
        animationType="fade"
        transparent
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
                <FontAwesome5
                  name={iconName}
                  size={24}
                  color="#ffffff"
                  solid
                />
              </View>
              <Text
                style={styles.modalTitle}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {selectedHabit.title}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseDetailsModal}
                hitSlop={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#AEAEB2"
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContentScrollView}>
              <View style={styles.modalContent}>
                {selectedHabit.description ? (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>
                      {t('habits.details.description')}
                    </Text>
                    <Text style={styles.descriptionText}>
                      {selectedHabit.description}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStatItem}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={24}
                      color="#ff9500"
                    />
                    <Text style={styles.modalStatValue}>
                      {selectedHabit.streak || 0}
                    </Text>
                    <Text style={styles.modalStatLabel}>
                      {t('habits.details.streak')}
                    </Text>
                  </View>

                  <View style={styles.modalStatItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#4dabf7"
                    />
                    <Text style={styles.modalStatValue}>
                      {safeFormatDate(
                        selectedHabit.last_tracked,
                        t('habits.never'),
                        'MMM d, yyyy',
                        dateLocale
                      )}
                    </Text>
                    <Text style={styles.modalStatLabel}>
                      {t('habits.details.lastTracked')}
                    </Text>
                  </View>

                  <View style={styles.modalStatItem}>
                    <Ionicons
                      name="repeat"
                      size={24}
                      color="#8e8e93"
                    />
                    <Text style={styles.modalStatValue}>
                      {getFrequencyLabel(
                        selectedHabit.frequency || 'Daily'
                      )}
                    </Text>
                    <Text style={styles.modalStatLabel}>
                      {t('habits.details.frequency')}
                    </Text>
                  </View>
                </View>

                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      handleOpenEditModal(selectedHabit)
                    }
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
                      <Text style={styles.editDeleteText}>
                        {t('habits.buttons.edit')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      handleDeleteHabit(selectedHabit)
                    }
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
                      <Text style={styles.editDeleteText}>
                        {t('habits.buttons.delete')}
                      </Text>
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
                    colors={
                      isTracked
                        ? ['#555', '#333']
                        : ['#34C759', '#28a745']
                    }
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isTrackingThis ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
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
                          {isTracked
                            ? t('habits.buttons.completedToday')
                            : t('habits.buttons.markDone')}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>

                  {!isTracked && !isTrackingThis && (
                    <View
                      style={[styles.buttonGlow, styles.trackButtonGlow]}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCreateEditModal = () => {
    const frequencyOptions = [
      { value: 'Daily', label: t('habits.frequency.daily') },
      { value: 'Weekly', label: t('habits.frequency.weekly') },
      { value: 'Monthly', label: t('habits.frequency.monthly') },
    ];

    return (
      <Modal
        animationType="slide"
        transparent
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
                {isEditing
                  ? t('habits.form.editTitle')
                  : t('habits.form.createTitle')}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseCreateEditModal}
                hitSlop={{
                  top: 10,
                  bottom: 10,
                  left: 10,
                  right: 10,
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#AEAEB2"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formScrollView}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContent}>
                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    {t('habits.form.icon')}
                  </Text>

                  <TouchableOpacity
                    style={styles.iconSelector}
                    onPress={() =>
                      setIconSelectorVisible(!iconSelectorVisible)
                    }
                  >
                    <View style={styles.selectedIconContainer}>
                      <FontAwesome5
                        name={selectedIcon}
                        size={24}
                        color="#ffffff"
                        solid
                      />
                    </View>
                    <Text style={styles.iconSelectorText}>
                      {t('habits.form.changeIcon')}
                    </Text>
                    <Ionicons
                      name={
                        iconSelectorVisible
                          ? 'chevron-up'
                          : 'chevron-down'
                      }
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
                            selectedIcon === icon &&
                              styles.selectedIconOption,
                          ]}
                          onPress={() => {
                            setSelectedIcon(icon);
                            setIconSelectorVisible(false);
                          }}
                        >
                          <FontAwesome5
                            name={icon}
                            size={24}
                            color={
                              selectedIcon === icon
                                ? '#000000'
                                : '#ffffff'
                            }
                            solid
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    {t('habits.form.titleLabel')}
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={formData.title}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: text,
                      }))
                    }
                    placeholder={t('habits.form.titlePlaceholder')}
                    placeholderTextColor="#8e8e93"
                    autoCapitalize="sentences"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    {t('habits.form.descriptionLabel')}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      styles.textareaInput,
                    ]}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: text,
                      }))
                    }
                    placeholder={t('habits.form.descriptionPlaceholder')}
                    placeholderTextColor="#8e8e93"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.formField}>
                  <Text style={styles.formLabel}>
                    {t('habits.form.frequency')}
                  </Text>
                  <View style={styles.frequencySelector}>
                    {frequencyOptions.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.frequencyOption,
                          formData.frequency === opt.value &&
                            styles.frequencySelected,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            frequency: opt.value,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.frequencyText,
                            formData.frequency === opt.value &&
                              styles.frequencyTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View
                  style={[
                    styles.formField,
                    styles.notificationToggle,
                  ]}
                >
                  <Text style={styles.formLabel}>
                    {t('habits.form.notifications')}
                  </Text>
                  <Switch
                    value={formData.notification_enabled}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        notification_enabled: value,
                      }))
                    }
                    trackColor={{
                      false: '#767577',
                      true: '#3250b4',
                    }}
                    thumbColor={
                      formData.notification_enabled
                        ? '#4dabf7'
                        : '#f4f3f4'
                    }
                  />
                </View>

                <Text style={styles.notificationText}>
                  {t('habits.form.notificationsHint')}
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
                          {isEditing
                            ? t('habits.form.saveChanges')
                            : t('habits.form.createHabit')}
                        </Text>
                      )}
                    </LinearGradient>

                    {!submitting && (
                      <View
                        style={[
                          styles.buttonGlow,
                          styles.createButtonGlow,
                        ]}
                      />
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
                      <Text style={styles.buttonText}>
                        {t('habits.form.cancel')}
                      </Text>
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#121539', '#080b20']}
        style={styles.background}
      >
        <View
          style={styles.particlesContainer}
          pointerEvents="none"
        >
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
            <Text style={styles.sectionTitle}>
              {t('habits.sectionTitle')}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleOpenAddModal}
            >
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
              <View style={styles.noHabitsContainer}>
                <Text style={styles.noHabitsText}>
                  {t('habits.empty.title')}
                </Text>
                <Text style={styles.noHabitsSubText}>
                  {t('habits.empty.subtitle')}
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

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },

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
    paddingTop: StatusBar.currentHeight
      ? StatusBar.currentHeight + -30
      : 60,
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
    padding: 9, // Чуть увеличим область нажатия
    backgroundColor: '#4dabf7', // Яркий синий цвет (акцентный цвет твоего приложения)
    borderRadius: 50,
    // Добавим тень, чтобы кнопка парила над фоном
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },

  habitsContainer: { flex: 1 },
  habitsScrollContent: { paddingBottom: 20 },

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
    backgroundColor: '#1E2248', 
    
    borderRadius: 16, // Скруглим углы чуть сильнее для красоты
    padding: 16,      // Чуть больше воздуха внутри
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    // ГРАНИЦЫ: Делаем тонкую, но заметную рамку
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    
    // ТЕНЬ: Самое важное для отделения от фона (особенно на Android)
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  habitInfo: { flex: 1 },
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

  trackButton: { padding: 5 },
  trackButtonDisabled: {},

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
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

  modalContent: { padding: 20 },

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

  modalTrackButton: { marginTop: 10 },

  createEditModal: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
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

  formContent: { padding: 20 },

  formField: { marginBottom: 20 },

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

  frequencySelector: { flexDirection: 'row' },

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

  frequencyTextSelected: { fontWeight: 'bold' },

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

  formActions: { marginTop: 10 },

  actionButton: {
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 50,
    justifyContent: 'center',
  },

  actionButtonDisabled: { opacity: 0.6 },

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

  trackButtonGlow: { backgroundColor: '#34c759' },
  createButtonGlow: { backgroundColor: '#4dabf7' },
  cancelButton: {},
});
