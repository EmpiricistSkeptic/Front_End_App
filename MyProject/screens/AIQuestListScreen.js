import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/ru';

import apiService from '../services/apiService';
import { useProfile } from '../context/ProfileContext';

// русская локаль для дат
moment.locale('ru');

export default function AIQuestListScreen({ navigation }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questDetailsVisible, setQuestDetailsVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // берём refreshProfile из контекста, чтобы подтянуть XP/уровень после complete/fail
  const { refreshProfile } = useProfile();

  // единая обработка 401/истёкшей сессии
  const handleSessionError = useCallback(
    (error) => {
      console.error('Session or network error (quests):', error);

      const status = error?.response?.status ?? error?.status;
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        error?.message ||
        '';

      if (
        status === 401 ||
        message.toString().toLowerCase().includes('session expired')
      ) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return true;
      }

      return false;
    },
    [navigation]
  );

  // загрузка списка квестов
  const fetchQuests = useCallback(async () => {
    try {
      const responseData = await apiService.get('quests/');
      console.log('Fetched quests data object:', responseData);
      setQuests(responseData.results || []);
    } catch (error) {
      if (handleSessionError(error)) return;
      console.error('Error fetching quests', error);
      Alert.alert(
        'Ошибка',
        'Не удалось загрузить ваши квесты. Попробуйте еще раз.'
      );
      setQuests([]);
    }
  }, [handleSessionError]);

  // загрузка деталей конкретного квеста
  const fetchQuestDetails = useCallback(
    async (id) => {
      setLoadingDetails(true);
      try {
        const response = await apiService.get(`quests/${id}/`);
        console.log('Fetched quest details:', response);
        setSelectedQuest(response);
        setQuestDetailsVisible(true);
      } catch (error) {
        if (handleSessionError(error)) return;
        console.error('Error fetching quest details', error);
        Alert.alert(
          'Ошибка',
          'Не удалось загрузить детали квеста. Попробуйте еще раз.'
        );
      } finally {
        setLoadingDetails(false);
      }
    },
    [handleSessionError]
  );

  // единый паттерн: грузим квесты при фокусе экрана (и первом открытии),
  // без дублирующих useEffect
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const load = async () => {
        setLoading(true);
        try {
          await fetchQuests();
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      load();

      return () => {
        isActive = false;
      };
    }, [fetchQuests])
  );

  // выполнение квеста
  const handleCompleteQuest = async (questId) => {
    try {
      await apiService.patch(`quests/${questId}/complete/`);
      Alert.alert(
        'Квест выполнен',
        'Вы успешно выполнили этот квест! Награда получена.'
      );

      // бэк уже пересчитал XP/уровень → подтягиваем профиль
      await Promise.all([
        fetchQuests(),
        selectedQuest && selectedQuest.id === questId
          ? fetchQuestDetails(questId)
          : Promise.resolve(),
        refreshProfile(),
      ]);
    } catch (error) {
      if (handleSessionError(error)) return;
      console.error('Error completing quest', error);
      Alert.alert(
        'Ошибка',
        'Не удалось отметить квест как выполненный. Попробуйте еще раз.'
      );
    }
  };

  // провал квеста
  const handleFailQuest = (questId) => {
    Alert.alert(
      'Отметить как проваленный?',
      'Вы уверены, что хотите отметить этот квест как проваленный? Штрафы будут применены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Подтвердить',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.post(`quests/fail/${questId}/`);
              Alert.alert('Квест провален', 'Квест отмечен как проваленный.');

              await Promise.all([
                fetchQuests(),
                selectedQuest && selectedQuest.id === questId
                  ? fetchQuestDetails(questId)
                  : Promise.resolve(),
                refreshProfile(),
              ]);
            } catch (error) {
              if (handleSessionError(error)) return;
              console.error('Error failing quest', error);
              Alert.alert(
                'Ошибка',
                'Не удалось отметить квест как проваленный.'
              );
            }
          },
        },
      ]
    );
  };

  // фильтрация квестов мемоизирована
  const filteredQuests = useMemo(() => {
    if (activeFilter === 'ALL') return quests;
    return quests.filter((quest) => quest.quest_type === activeFilter);
  }, [quests, activeFilter]);

  const renderQuestTypeIcon = (type) => {
    switch (type) {
      case 'DAILY':
        return <MaterialIcons name="replay" size={20} color="#4caf50" />;
      case 'URGENT':
        return <MaterialIcons name="timer" size={20} color="#f44336" />;
      case 'MAIN':
        return <MaterialIcons name="star" size={20} color="#ffc107" />;
      case 'CHALLENGE':
        return <MaterialIcons name="flag" size={20} color="#9c27b0" />;
      default:
        return <MaterialIcons name="help-outline" size={20} color="#ffffff" />;
    }
  };

  const getQuestTypeColor = (type) => {
    switch (type) {
      case 'DAILY':
        return '#4caf50';
      case 'URGENT':
        return '#f44336';
      case 'MAIN':
        return '#ffc107';
      case 'CHALLENGE':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  };

  const getQuestTypeText = (type) => {
    switch (type) {
      case 'DAILY':
        return 'ЕЖЕДНЕВНЫЙ';
      case 'URGENT':
        return 'СРОЧНЫЙ';
      case 'MAIN':
        return 'ОСНОВНОЙ';
      case 'CHALLENGE':
        return 'ЧЕЛЛЕНДЖ';
      default:
        return type;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#2979ff';
      case 'COMPLETED':
        return '#4caf50';
      case 'FAILED':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;

    const now = moment();
    const expiry = moment(expiresAt);

    if (now > expiry) {
      return 'Просрочено';
    }

    const duration = moment.duration(expiry.diff(now));
    const hours = Math.floor(duration.asHours());
    const minutes = Math.floor(duration.minutes());

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} дн. ${hours % 24} ч.`;
    }

    return `${hours} ч. ${minutes} мин.`;
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return moment() > moment(expiresAt);
  };

  const shouldShowCompletedDate = (status, completedAt) => {
    return status !== 'ACTIVE' && completedAt;
  };

  const formatCompletedDate = (completedAt) => {
    return moment(completedAt).format('DD MMM YYYY, HH:mm');
  };

  // модалка деталей квеста
  const QuestDetailsModal = () => {
    if (!selectedQuest) return null;

    return (
      <Modal
        animationType="slide"
        transparent
        visible={questDetailsVisible}
        onRequestClose={() => setQuestDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1f274c', '#151a35']}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Детали квеста</Text>
                <TouchableOpacity
                  onPress={() => setQuestDetailsVisible(false)}
                >
                  <MaterialIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {loadingDetails ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#4dabf7" />
                  <Text style={styles.loadingText}>Загрузка...</Text>
                </View>
              ) : (
                <ScrollView style={styles.modalScrollView}>
                  <View style={styles.detailsTopRow}>
                    <View
                      style={[
                        styles.typeBadge,
                        {
                          backgroundColor: getQuestTypeColor(
                            selectedQuest.quest_type
                          ),
                        },
                      ]}
                    >
                      {renderQuestTypeIcon(selectedQuest.quest_type)}
                      <Text style={styles.typeText}>
                        {getQuestTypeText(selectedQuest.quest_type)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedQuest.status
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {selectedQuest.status === 'ACTIVE'
                          ? 'АКТИВЕН'
                          : selectedQuest.status === 'COMPLETED'
                          ? 'ВЫПОЛНЕН'
                          : 'ПРОВАЛЕН'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.detailsTitle}>{selectedQuest.title}</Text>

                  {selectedQuest.quest_type === 'URGENT' &&
                    selectedQuest.expires_at && (
                      <View style={styles.detailsInfoRow}>
                        <MaterialIcons
                          name={
                            isExpired(selectedQuest.expires_at)
                              ? 'timer-off'
                              : 'timer'
                          }
                          size={18}
                          color={
                            isExpired(selectedQuest.expires_at)
                              ? '#f44336'
                              : '#4dabf7'
                          }
                        />
                        <Text style={styles.detailsInfoText}>
                          Срок выполнения:{' '}
                          {moment(selectedQuest.expires_at).format(
                            'DD MMM YYYY, HH:mm'
                          )}
                          {isExpired(selectedQuest.expires_at)
                            ? ' (Просрочено)'
                            : ` (${getTimeRemaining(
                                selectedQuest.expires_at
                              )} осталось)`}
                        </Text>
                      </View>
                    )}

                  <View style={styles.detailsInfoRow}>
                    <MaterialIcons name="event" size={18} color="#4dabf7" />
                    <Text style={styles.detailsInfoText}>
                      Создан:{' '}
                      {moment(selectedQuest.created_at).format(
                        'DD MMM YYYY, HH:mm'
                      )}
                    </Text>
                  </View>

                  {shouldShowCompletedDate(
                    selectedQuest.status,
                    selectedQuest.completed_at
                  ) && (
                    <View style={styles.detailsInfoRow}>
                      <MaterialIcons
                        name={
                          selectedQuest.status === 'COMPLETED'
                            ? 'check-circle'
                            : 'cancel'
                        }
                        size={18}
                        color={
                          selectedQuest.status === 'COMPLETED'
                            ? '#4caf50'
                            : '#f44336'
                        }
                      />
                      <Text style={styles.detailsInfoText}>
                        {selectedQuest.status === 'COMPLETED'
                          ? 'Выполнен: '
                          : 'Провален: '}
                        {formatCompletedDate(selectedQuest.completed_at)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  <Text style={styles.sectionTitle}>Описание</Text>
                  <Text style={styles.detailsDescription}>
                    {selectedQuest.description}
                  </Text>

                  <Text style={styles.sectionTitle}>Награды</Text>
                  <View style={styles.detailsRewardsContainer}>
                    {selectedQuest.reward_points > 0 && (
                      <View style={styles.detailsRewardItem}>
                        <Ionicons name="star" size={18} color="#ffd700" />
                        <Text style={styles.detailsRewardText}>
                          {selectedQuest.reward_points} XP
                        </Text>
                      </View>
                    )}
                    {selectedQuest.reward_other && (
                      <View style={styles.detailsRewardItem}>
                        <MaterialIcons
                          name="card-giftcard"
                          size={18}
                          color="#4dabf7"
                        />
                        <Text style={styles.detailsRewardText}>
                          {selectedQuest.reward_other}
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedQuest.penalty_info && (
                    <>
                      <Text style={styles.sectionTitle}>
                        Штрафы при провале
                      </Text>
                      <View style={styles.detailsPenaltyContainer}>
                        <MaterialIcons
                          name="warning"
                          size={18}
                          color="#f44336"
                        />
                        <Text style={styles.detailsPenaltyText}>
                          {selectedQuest.penalty_info}
                        </Text>
                      </View>
                    </>
                  )}

                  {selectedQuest.status === 'ACTIVE' && (
                    <View style={styles.detailsActionButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.detailsActionButton,
                          styles.completeButton,
                        ]}
                        onPress={() => {
                          setQuestDetailsVisible(false);
                          handleCompleteQuest(selectedQuest.id);
                        }}
                      >
                        <LinearGradient
                          colors={['#4caf50', '#388e3c']}
                          style={styles.buttonGradient}
                        >
                          <MaterialIcons
                            name="check"
                            size={18}
                            color="#ffffff"
                          />
                          <Text style={styles.actionButtonText}>
                            ВЫПОЛНИТЬ
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.detailsActionButton, styles.failButton]}
                        onPress={() => {
                          setQuestDetailsVisible(false);
                          handleFailQuest(selectedQuest.id);
                        }}
                      >
                        <LinearGradient
                          colors={['#f44336', '#d32f2f']}
                          style={styles.buttonGradient}
                        >
                          <MaterialIcons
                            name="close"
                            size={18}
                            color="#ffffff"
                          />
                          <Text style={styles.actionButtonText}>
                            ПРОВАЛИТЬ
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              )}
            </LinearGradient>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={['#0c0e1a', '#1a1d33']} style={styles.container}>
      <Text style={styles.headerText}>QUESTS</Text>

      {/* Фильтры */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'ALL' && styles.activeFilter,
          ]}
          onPress={() => setActiveFilter('ALL')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === 'ALL' && styles.activeFilterText,
            ]}
          >
            ALL
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'DAILY' && styles.activeFilter,
            activeFilter === 'DAILY' && { borderColor: '#4caf50' },
          ]}
          onPress={() => setActiveFilter('DAILY')}
        >
          <MaterialIcons
            name="replay"
            size={16}
            color={activeFilter === 'DAILY' ? '#4caf50' : '#ffffff'}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              activeFilter === 'DAILY' && styles.activeFilterText,
              activeFilter === 'DAILY' && { color: '#4caf50' },
            ]}
          >
            DAILY
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'URGENT' && styles.activeFilter,
            activeFilter === 'URGENT' && { borderColor: '#f44336' },
          ]}
          onPress={() => setActiveFilter('URGENT')}
        >
          <MaterialIcons
            name="timer"
            size={16}
            color={activeFilter === 'URGENT' ? '#f44336' : '#ffffff'}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              activeFilter === 'URGENT' && styles.activeFilterText,
              activeFilter === 'URGENT' && { color: '#f44336' },
            ]}
          >
            URGENT
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'MAIN' && styles.activeFilter,
            activeFilter === 'MAIN' && { borderColor: '#ffc107' },
          ]}
          onPress={() => setActiveFilter('MAIN')}
        >
          <MaterialIcons
            name="star"
            size={16}
            color={activeFilter === 'MAIN' ? '#ffc107' : '#ffffff'}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              activeFilter === 'MAIN' && styles.activeFilterText,
              activeFilter === 'MAIN' && { color: '#ffc107' },
            ]}
          >
            BASIC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilter === 'CHALLENGE' && styles.activeFilter,
            activeFilter === 'CHALLENGE' && { borderColor: '#9c27b0' },
          ]}
          onPress={() => setActiveFilter('CHALLENGE')}
        >
          <MaterialIcons
            name="flag"
            size={16}
            color={activeFilter === 'CHALLENGE' ? '#9c27b0' : '#ffffff'}
            style={styles.filterIcon}
          />
          <Text
            style={[
              styles.filterText,
              activeFilter === 'CHALLENGE' && styles.activeFilterText,
              activeFilter === 'CHALLENGE' && { color: '#9c27b0' },
            ]}
          >
            CHALLENGES
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Список квестов */}
      <ScrollView style={styles.questsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading quests...</Text>
            <ActivityIndicator
              size="large"
              color="#4dabf7"
              style={styles.loadingIndicator}
            />
          </View>
        ) : filteredQuests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="search-off"
              size={60}
              color="#4dabf7"
              style={styles.emptyIcon}
            />
            <Text style={styles.noQuestsText}>There are no active quests</Text>
            <Text style={styles.noQuestsSubtext}>
              Come back later for new quests
            </Text>
          </View>
        ) : (
          filteredQuests.map((quest) => (
            <View key={quest.id} style={styles.questWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => fetchQuestDetails(quest.id)}
              >
                <LinearGradient
                  colors={['#1f274c', '#151a35']}
                  style={[
                    styles.questItem,
                    { borderLeftColor: getQuestTypeColor(quest.quest_type) },
                  ]}
                >
                  <View style={styles.questTopRow}>
                    <View style={styles.questTypeAndStatus}>
                      <View
                        style={[
                          styles.typeBadge,
                          {
                            backgroundColor: getQuestTypeColor(
                              quest.quest_type
                            ),
                          },
                        ]}
                      >
                        {renderQuestTypeIcon(quest.quest_type)}
                        <Text style={styles.typeText}>
                          {getQuestTypeText(quest.quest_type)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(quest.status) },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {quest.status === 'ACTIVE'
                            ? 'ACTIVE'
                            : quest.status === 'COMPLETED'
                            ? 'COMPLETED'
                            : 'FAILED'}
                        </Text>
                      </View>
                    </View>

                    {quest.quest_type === 'URGENT' &&
                      quest.expires_at &&
                      quest.status === 'ACTIVE' && (
                        <View
                          style={[
                            styles.timeRemainingContainer,
                            isExpired(quest.expires_at) &&
                              styles.expiredContainer,
                          ]}
                        >
                          <MaterialIcons
                            name={
                              isExpired(quest.expires_at)
                                ? 'timer-off'
                                : 'timer'
                            }
                            size={14}
                            color={
                              isExpired(quest.expires_at)
                                ? '#f44336'
                                : '#a0a0a0'
                            }
                          />
                          <Text
                            style={[
                              styles.timeRemainingText,
                              isExpired(quest.expires_at) &&
                                styles.expiredText,
                            ]}
                          >
                            {getTimeRemaining(quest.expires_at)}
                          </Text>
                        </View>
                      )}

                    {shouldShowCompletedDate(
                      quest.status,
                      quest.completed_at
                    ) && (
                      <View style={styles.completedDateContainer}>
                        <MaterialIcons
                          name={
                            quest.status === 'COMPLETED'
                              ? 'check-circle-outline'
                              : 'cancel-outline'
                          }
                          size={14}
                          color={
                            quest.status === 'COMPLETED'
                              ? '#4caf50'
                              : '#f44336'
                          }
                        />
                        <Text style={styles.completedDateText}>
                          {formatCompletedDate(quest.completed_at)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.questTitle}>{quest.title}</Text>

                  <Text
                    style={styles.questDescription}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {quest.description}
                  </Text>

                  <View style={styles.questBottomRow}>
                    <View style={styles.rewardsContainer}>
                      {quest.reward_points > 0 && (
                        <View style={styles.rewardItem}>
                          <Ionicons name="star" size={16} color="#ffd700" />
                          <Text style={styles.rewardText}>
                            {quest.reward_points} XP
                          </Text>
                        </View>
                      )}
                      {quest.reward_other && (
                        <View style={styles.rewardItem}>
                          <MaterialIcons
                            name="card-giftcard"
                            size={16}
                            color="#4dabf7"
                          />
                          <Text
                            style={styles.rewardText}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {quest.reward_other}
                          </Text>
                        </View>
                      )}
                    </View>

                    {quest.penalty_info && quest.status !== 'COMPLETED' && (
                      <View style={styles.penaltyContainer}>
                        <MaterialIcons
                          name="warning-amber"
                          size={16}
                          color="#f44336"
                        />
                        <Text
                          style={styles.penaltyText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {quest.penalty_info}
                        </Text>
                      </View>
                    )}

                    <View style={styles.detailsIndicator}>
                      <MaterialIcons
                        name="chevron-right"
                        size={22}
                        color="#64b5f6"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {quest.status === 'ACTIVE' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteQuest(quest.id)}
                  >
                    <LinearGradient
                      colors={['#4caf50', '#388e3c']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons
                        name="check"
                        size={18}
                        color="#ffffff"
                      />
                      <Text style={styles.actionButtonText}>COMPLETE</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.failButton]}
                    onPress={() => handleFailQuest(quest.id)}
                  >
                    <LinearGradient
                      colors={['#f44336', '#d32f2f']}
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons
                        name="close"
                        size={18}
                        color="#ffffff"
                      />
                      <Text style={styles.actionButtonText}>FAIL</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <QuestDetailsModal />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
  },
  headerText: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4dabf7',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(77, 171, 247, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 15,
    paddingBottom: 5,
    maxHeight: 45,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 35, 60, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  activeFilter: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderColor: '#4dabf7',
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    color: '#e0e0e0',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#64b5f6',
  },
  questsContainer: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'System',
    letterSpacing: 1,
  },
  loadingIndicator: {
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyIcon: {
    marginBottom: 15,
  },
  noQuestsText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 10,
  },
  noQuestsSubtext: {
    color: '#a0a0a0',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'System',
  },
  questWrapper: {
    marginHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#151a35',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22, // чуть легче тень
    shadowRadius: 4,
    elevation: 4, // легче по сравнению с 8
  },
  questItem: {
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  questTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTypeAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  expiredContainer: {},
  timeRemainingText: {
    color: '#a0a0a0',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  expiredText: {
    color: '#f44336',
  },
  completedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  completedDateText: {
    color: '#a0a0a0',
    fontSize: 11,
    marginLeft: 4,
  },
  questTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4,
  },
  questDescription: {
    color: '#c0c0c0',
    fontSize: 13,
    fontFamily: 'System',
    marginBottom: 10,
    lineHeight: 18,
  },
  questBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 1,
    marginRight: 8,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    maxWidth: 100,
  },
  penaltyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4,
  },
  penaltyText: {
    color: '#f8a0a0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    maxWidth: 100,
  },
  detailsIndicator: {
    marginLeft: 'auto',
    alignSelf: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    height: 40,
  },
  completeButton: {},
  failButton: {},
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontFamily: 'System',
  },

  // модалка
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalContainer: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  modalContent: {
    padding: 15,
    borderRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  modalTitle: {
    color: '#4dabf7',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    fontFamily: 'System',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  detailsTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  detailsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'System',
    lineHeight: 24,
  },
  detailsInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsInfoText: {
    color: '#d0d0d0',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'System',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    marginVertical: 15,
  },
  sectionTitle: {
    color: '#64b5f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'System',
  },
  detailsDescription: {
    color: '#d0d0d0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: 'System',
  },
  detailsRewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detailsRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  detailsRewardText: {
    color: '#ffffff',
    fontSize: 14,
    marginLeft: 6,
    fontFamily: 'System',
  },
  detailsPenaltyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
  },
  detailsPenaltyText: {
    color: '#f8a0a0',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'System',
    lineHeight: 20,
    flex: 1,
  },
  detailsActionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 5,
  },
  detailsActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 5,
  },
});
