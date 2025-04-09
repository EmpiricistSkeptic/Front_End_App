import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Modal} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/ru';  // Импорт русской локали отдельно

// Инициализируем moment на русском языке
moment.locale('ru');

export default function AIQuestListScreen({ navigation, route }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [questDetailsVisible, setQuestDetailsVisible] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchQuests();
    });
    
    return unsubscribe;
  }, [navigation]);

  const fetchQuests = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/quests/');
      console.log('Fetched quests:', response);
      setQuests(response);
    } catch (error) {
      console.error('Error fetching quests', error);
      Alert.alert('Ошибка', 'Не удалось загрузить ваши квесты. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestDetails = async (questId) => {
    setLoadingDetails(true);
    try {
      const response = await apiService.get(`/quests/${questId}/`);
      console.log('Fetched quest details:', response);
      setSelectedQuest(response);
      setQuestDetailsVisible(true);
    } catch (error) {
      console.error('Error fetching quest details', error);
      Alert.alert('Ошибка', 'Не удалось загрузить детали квеста. Попробуйте еще раз.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCompleteQuest = async (questId) => {
    try {
      await apiService.patch(`/quests/complete/${questId}/`);
      Alert.alert('Квест выполнен', 'Вы успешно выполнили этот квест! Награда получена.');
      fetchQuests(); // Обновляем список квестов

      if (selectedQuest && selectedQuest.id === questId) {
        fetchQuestDetails(questId);
      }

      if (route.params?.fetchProfileData) {
        route.params.fetchProfileData();
      }
    } catch (error) {
      console.error('Error completing quest', error);
      Alert.alert('Ошибка', 'Не удалось отметить квест как выполненный. Попробуйте еще раз.');
    }
  };

  const handleFailQuest = async (questId) => {
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
              await apiService.post(`/quests/fail/${questId}/`);
              Alert.alert('Квест провален', 'Квест отмечен как проваленный.');
              fetchQuests();
              if (selectedQuest && selectedQuest.id === questId) {
                fetchQuestDetails(questId);
              }
            } catch (error) {
              console.error('Error failing quest', error);
              Alert.alert('Ошибка', 'Не удалось отметить квест как проваленный.');
            }
          }
        }
      ]
    );
  };

  const getFilteredQuests = () => {
    if (activeFilter === 'ALL') {
      return quests;
    }
    return quests.filter(quest => quest.quest_type === activeFilter);
  };

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

  // Компонент для модального окна с деталями квеста
  const QuestDetailsModal = () => {
    if (!selectedQuest) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={questDetailsVisible}
        onRequestClose={() => setQuestDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['#1f274c', '#151a35']}
              style={styles.modalContent}
            >
              {/* Заголовок модального окна с кнопкой закрытия */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Детали квеста</Text>
                <TouchableOpacity onPress={() => setQuestDetailsVisible(false)}>
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
                  {/* Тип квеста и статус */}
                  <View style={styles.detailsTopRow}>
                    <View style={[styles.typeBadge, { backgroundColor: getQuestTypeColor(selectedQuest.quest_type) }]}>
                      {renderQuestTypeIcon(selectedQuest.quest_type)}
                      <Text style={styles.typeText}>{getQuestTypeText(selectedQuest.quest_type)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedQuest.status) }]}>
                      <Text style={styles.statusText}>
                        {selectedQuest.status === 'ACTIVE' ? 'АКТИВЕН' :
                        selectedQuest.status === 'COMPLETED' ? 'ВЫПОЛНЕН' : 'ПРОВАЛЕН'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Заголовок квеста */}
                  <Text style={styles.detailsTitle}>{selectedQuest.title}</Text>
                  
                  {/* Срок выполнения для срочных квестов */}
                  {selectedQuest.quest_type === 'URGENT' && selectedQuest.expires_at && (
                    <View style={styles.detailsInfoRow}>
                      <MaterialIcons 
                        name={isExpired(selectedQuest.expires_at) ? "timer-off" : "timer"}
                        size={18} 
                        color={isExpired(selectedQuest.expires_at) ? "#f44336" : "#4dabf7"} 
                      />
                      <Text style={styles.detailsInfoText}>
                        Срок выполнения: {moment(selectedQuest.expires_at).format('DD MMM YYYY, HH:mm')}
                        {isExpired(selectedQuest.expires_at) ? ' (Просрочено)' : ` (${getTimeRemaining(selectedQuest.expires_at)} осталось)`}
                      </Text>
                    </View>
                  )}
                  
                  {/* Дата создания квеста */}
                  <View style={styles.detailsInfoRow}>
                    <MaterialIcons name="event" size={18} color="#4dabf7" />
                    <Text style={styles.detailsInfoText}>
                      Создан: {moment(selectedQuest.created_at).format('DD MMM YYYY, HH:mm')}
                    </Text>
                  </View>
                  
                  {/* Дата выполнения/провала для завершенных квестов */}
                  {shouldShowCompletedDate(selectedQuest.status, selectedQuest.completed_at) && (
                    <View style={styles.detailsInfoRow}>
                      <MaterialIcons 
                        name={selectedQuest.status === 'COMPLETED' ? "check-circle" : "cancel"} 
                        size={18} 
                        color={selectedQuest.status === 'COMPLETED' ? "#4caf50" : "#f44336"} 
                      />
                      <Text style={styles.detailsInfoText}>
                        {selectedQuest.status === 'COMPLETED' ? 'Выполнен: ' : 'Провален: '}
                        {formatCompletedDate(selectedQuest.completed_at)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Разделитель */}
                  <View style={styles.divider} />
                  
                  {/* Полное описание квеста */}
                  <Text style={styles.sectionTitle}>Описание</Text>
                  <Text style={styles.detailsDescription}>{selectedQuest.description}</Text>
                  
                  {/* Награды */}
                  <Text style={styles.sectionTitle}>Награды</Text>
                  <View style={styles.detailsRewardsContainer}>
                    {selectedQuest.reward_points > 0 && (
                      <View style={styles.detailsRewardItem}>
                        <Ionicons name="star" size={18} color="#ffd700" />
                        <Text style={styles.detailsRewardText}>{selectedQuest.reward_points} XP</Text>
                      </View>
                    )}
                    {selectedQuest.reward_other && (
                      <View style={styles.detailsRewardItem}>
                        <MaterialIcons name="card-giftcard" size={18} color="#4dabf7" />
                        <Text style={styles.detailsRewardText}>{selectedQuest.reward_other}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Штрафы (если есть) */}
                  {selectedQuest.penalty_info && (
                    <>
                      <Text style={styles.sectionTitle}>Штрафы при провале</Text>
                      <View style={styles.detailsPenaltyContainer}>
                        <MaterialIcons name="warning" size={18} color="#f44336" />
                        <Text style={styles.detailsPenaltyText}>{selectedQuest.penalty_info}</Text>
                      </View>
                    </>
                  )}
                  
                  {/* Кнопки действий для активных квестов */}
                  {selectedQuest.status === 'ACTIVE' && (
                    <View style={styles.detailsActionButtonsContainer}>
                      <TouchableOpacity
                        style={[styles.detailsActionButton, styles.completeButton]}
                        onPress={() => {
                          setQuestDetailsVisible(false);
                          handleCompleteQuest(selectedQuest.id);
                        }}
                      >
                        <LinearGradient
                          colors={['#4caf50', '#388e3c']}
                          style={styles.buttonGradient}
                        >
                          <MaterialIcons name="check" size={18} color="#ffffff" />
                          <Text style={styles.actionButtonText}>ВЫПОЛНИТЬ</Text>
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
                          <MaterialIcons name="close" size={18} color="#ffffff" />
                          <Text style={styles.actionButtonText}>ПРОВАЛИТЬ</Text>
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
    <LinearGradient
      colors={['#0c0e1a', '#1a1d33']}
      style={styles.container}
    >
      {/* --- Заголовок и Фильтры остаются без изменений --- */}
      <Text style={styles.headerText}>КВЕСТЫ</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
         {/* ... твои TouchableOpacity для фильтров ... */}
        <TouchableOpacity style={[ styles.filterButton, activeFilter === 'ALL' && styles.activeFilter ]} onPress={() => setActiveFilter('ALL')}>
          <Text style={[ styles.filterText, activeFilter === 'ALL' && styles.activeFilterText ]}>ВСЕ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ styles.filterButton, activeFilter === 'DAILY' && styles.activeFilter, activeFilter === 'DAILY' && { borderColor: '#4caf50' } ]} onPress={() => setActiveFilter('DAILY')}>
          <MaterialIcons name="replay" size={16} color={activeFilter === 'DAILY' ? '#4caf50' : '#ffffff'} style={styles.filterIcon} />
          <Text style={[ styles.filterText, activeFilter === 'DAILY' && styles.activeFilterText, activeFilter === 'DAILY' && { color: '#4caf50' } ]}>ЕЖЕДНЕВНЫЕ</Text>
        </TouchableOpacity>
        {/* ... остальные фильтры ... */}
        <TouchableOpacity style={[ styles.filterButton, activeFilter === 'URGENT' && styles.activeFilter, activeFilter === 'URGENT' && { borderColor: '#f44336' } ]} onPress={() => setActiveFilter('URGENT')}>
          <MaterialIcons name="timer" size={16} color={activeFilter === 'URGENT' ? '#f44336' : '#ffffff'} style={styles.filterIcon} />
          <Text style={[ styles.filterText, activeFilter === 'URGENT' && styles.activeFilterText, activeFilter === 'URGENT' && { color: '#f44336' } ]}>СРОЧНЫЕ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ styles.filterButton, activeFilter === 'MAIN' && styles.activeFilter, activeFilter === 'MAIN' && { borderColor: '#ffc107' } ]} onPress={() => setActiveFilter('MAIN')}>
          <MaterialIcons name="star" size={16} color={activeFilter === 'MAIN' ? '#ffc107' : '#ffffff'} style={styles.filterIcon} />
          <Text style={[ styles.filterText, activeFilter === 'MAIN' && styles.activeFilterText, activeFilter === 'MAIN' && { color: '#ffc107' } ]}>ОСНОВНЫЕ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[ styles.filterButton, activeFilter === 'CHALLENGE' && styles.activeFilter, activeFilter === 'CHALLENGE' && { borderColor: '#9c27b0' } ]} onPress={() => setActiveFilter('CHALLENGE')}>
          <MaterialIcons name="flag" size={16} color={activeFilter === 'CHALLENGE' ? '#9c27b0' : '#ffffff'} style={styles.filterIcon} />
          <Text style={[ styles.filterText, activeFilter === 'CHALLENGE' && styles.activeFilterText, activeFilter === 'CHALLENGE' && { color: '#9c27b0' } ]}>ЧЕЛЛЕНДЖИ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- Отображение списка квестов (с изменениями) --- */}
      <ScrollView style={styles.questsContainer}>
        {loading ? (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Загрузка квестов...</Text>
                <ActivityIndicator size="large" color="#4dabf7" style={styles.loadingIndicator} />
            </View>
        ) : getFilteredQuests().length === 0 ? (
            <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={60} color="#4dabf7" style={styles.emptyIcon} />
                <Text style={styles.noQuestsText}>Нет активных квестов</Text>
                <Text style={styles.noQuestsSubtext}>Возвращайтесь позже для новых заданий</Text>
            </View>
        ) : (
          getFilteredQuests().map(quest => (
            <View key={quest.id} style={styles.questWrapper}>
              {/* TouchableOpacity теперь открывает детали квеста */}
              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={() => fetchQuestDetails(quest.id)}
              >
                <LinearGradient
                  colors={['#1f274c', '#151a35']} // Немного другие цвета для градиента карточки
                  style={[
                    styles.questItem,
                    { borderLeftColor: getQuestTypeColor(quest.quest_type) } // Убрали ширину отсюда, зададим в стиле
                  ]}
                >
                  {/* Верхняя часть: Тип, Статус и Время/Дата */}
                  <View style={styles.questTopRow}>
                    <View style={styles.questTypeAndStatus}>
                        <View style={[styles.typeBadge, { backgroundColor: getQuestTypeColor(quest.quest_type) }]}>
                            {renderQuestTypeIcon(quest.quest_type)}
                            <Text style={styles.typeText}>{getQuestTypeText(quest.quest_type)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quest.status) }]}>
                            <Text style={styles.statusText}>
                            {quest.status === 'ACTIVE' ? 'АКТИВЕН' :
                             quest.status === 'COMPLETED' ? 'ВЫПОЛНЕН' : 'ПРОВАЛЕН'}
                            </Text>
                        </View>
                    </View>
                    {/* Время/Дата справа */}
                    {quest.quest_type === 'URGENT' && quest.expires_at && quest.status === 'ACTIVE' && (
                        <View style={[ styles.timeRemainingContainer, isExpired(quest.expires_at) && styles.expiredContainer ]}>
                            <MaterialIcons
                            name={isExpired(quest.expires_at) ? "timer-off" : "timer"}
                            size={14} // Меньше иконка
                            color={isExpired(quest.expires_at) ? "#f44336" : "#a0a0a0"} // Менее яркий цвет
                            />
                            <Text style={[ styles.timeRemainingText, isExpired(quest.expires_at) && styles.expiredText ]}>
                            {getTimeRemaining(quest.expires_at)}
                            </Text>
                        </View>
                    )}
                    {shouldShowCompletedDate(quest.status, quest.completed_at) && (
                        <View style={styles.completedDateContainer}>
                            <MaterialIcons
                            name={quest.status === 'COMPLETED' ? "check-circle-outline" : "cancel-outline"} // Outline иконки
                            size={14}
                            color={quest.status === 'COMPLETED' ? "#4caf50" : "#f44336"}
                            />
                            <Text style={styles.completedDateText}>
                            {formatCompletedDate(quest.completed_at)}
                            </Text>
                        </View>
                    )}
                  </View>

                  {/* Заголовок */}
                  <Text style={styles.questTitle}>{quest.title}</Text>

                  {/* Описание (сокращенное) */}
                  <Text style={styles.questDescription} numberOfLines={2} ellipsizeMode="tail">
                      {quest.description}
                  </Text>

                  {/* Нижняя часть: Награды и Штрафы */}
                  <View style={styles.questBottomRow}>
                    {/* Награды */}
                    <View style={styles.rewardsContainer}>
                        {quest.reward_points > 0 && (
                            <View style={styles.rewardItem}>
                                <Ionicons name="star" size={16} color="#ffd700" />
                                <Text style={styles.rewardText}>{quest.reward_points} XP</Text>
                            </View>
                        )}
                        {quest.reward_other && (
                            <View style={styles.rewardItem}>
                                <MaterialIcons name="card-giftcard" size={16} color="#4dabf7" />
                                <Text style={styles.rewardText} numberOfLines={1} ellipsizeMode="tail">
                                    {quest.reward_other}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Штраф (если есть и квест активен или провален) */}
                    {quest.penalty_info && quest.status !== 'COMPLETED' && (
                      <View style={styles.penaltyContainer}>
                          <MaterialIcons name="warning-amber" size={16} color="#f44336" />
                          <Text style={styles.penaltyText} numberOfLines={1} ellipsizeMode="tail">
                              {quest.penalty_info}
                          </Text>
                      </View>
                    )}
                    <View style={styles.detailsIndicator}>
                      <MaterialIcons name="chevron-right" size={22} color="#64b5f6" />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Кнопки действий (вынесены из TouchableOpacity/LinearGradient) */}
              {quest.status === 'ACTIVE' && (
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleCompleteQuest(quest.id)}
                  >
                    <LinearGradient
                      colors={['#4caf50', '#388e3c']} // Зеленый для выполнения
                      style={styles.buttonGradient}
                    >
                      <MaterialIcons name="check" size={18} color="#ffffff" />
                      <Text style={styles.actionButtonText}>ВЫПОЛНИТЬ</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.failButton]}
                    onPress={() => handleFailQuest(quest.id)}
                  >
                    <LinearGradient
                       colors={['#f44336', '#d32f2f']} // Красный для провала
                       style={styles.buttonGradient}
                    >
                      <MaterialIcons name="close" size={18} color="#ffffff" />
                      <Text style={styles.actionButtonText}>ПРОВАЛИТЬ</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View> // questWrapper
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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
  
  // Модальное окно с деталями квеста
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
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 15,
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
  }
});