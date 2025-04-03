import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import apiService from '../services/apiService';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/ru';  // Импорт русской локали отдельно

// Инициализируем moment на русском языке
moment.locale('ru');

export default function AIQuestListScreen({ navigation }) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

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

  const handleCompleteQuest = async (questId) => {
    try {
      await apiService.patch(`/quests/complete/${questId}/`);
      Alert.alert('Квест выполнен', 'Вы успешно выполнили этот квест! Награда получена.');
      fetchQuests(); // Обновляем список квестов
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
              {/* Используем TouchableOpacity для возможного расширения карточки в будущем */}
              <TouchableOpacity activeOpacity={0.8} onPress={() => { /* Можно добавить логику раскрытия деталей */ }}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15, // Немного уменьшил верхний отступ
    // paddingHorizontal убран, т.к. отступы теперь у wrapper'ов
  },
  headerText: {
    fontFamily: 'System', // Используем системный шрифт, если нет кастомного
    fontSize: 22, // Чуть меньше
    fontWeight: 'bold',
    color: '#4dabf7',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 1.5, // Чуть меньше
    textShadowColor: 'rgba(77, 171, 247, 0.4)', // Менее интенсивная тень
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingHorizontal: 15, // Горизонтальный отступ для фильтров
    paddingBottom: 5,
    maxHeight: 45, // Чуть ниже
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(25, 35, 60, 0.7)', // Чуть светлее фон
    paddingHorizontal: 12,
    paddingVertical: 6, // Меньше по вертикали
    borderRadius: 16, // Более круглые
    marginRight: 8, // Меньше отступ
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)', // Синяя рамка
  },
  activeFilter: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)', // Полупрозрачный синий фон
    borderColor: '#4dabf7', // Яркая синяя рамка
  },
  filterIcon: {
    marginRight: 4,
  },
  filterText: {
    color: '#e0e0e0', // Немного светлее текст
    fontSize: 12,
    fontWeight: '600', // Полужирный
  },
  activeFilterText: {
    color: '#64b5f6', // Более светлый синий для активного текста
  },
  questsContainer: {
    flex: 1,
  },
  loadingContainer: { // Стили для загрузки и пустого состояния без изменений
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
  // --- Стили самой карточки квеста ---
  questWrapper: {
    marginHorizontal: 15, // Отступы по бокам для каждой карточки
    marginBottom: 15, // Отступ снизу
    backgroundColor: '#151a35', // Фон для кнопок, если они есть
    borderRadius: 10, // Скругление общее
    shadowColor: '#000', // Тень для объема
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  questItem: {
    borderLeftWidth: 4, // Левая граница для типа квеста
    borderTopLeftRadius: 10, // Скругление углов
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10, // Скругление правых углов
    paddingHorizontal: 12, // Уменьшили паддинги
    paddingTop: 10,
    paddingBottom: 12,
  },
  questTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Выравнивание по верху
    marginBottom: 8,
  },
  questTypeAndStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1, // Позволяет сжиматься, если время/дата длинные
    marginRight: 8, // Отступ от времени/даты
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6, // Отступ от статуса
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
    paddingVertical: 3, // Меньше паддинг
  },
  expiredContainer: {}, // Убрали фон, цвет текста и иконки уже задан
  timeRemainingText: {
    color: '#a0a0a0', // Менее яркий текст
    fontSize: 11, // Меньше шрифт
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
    fontSize: 16, // Чуть меньше
    fontWeight: 'bold',
    fontFamily: 'System',
    marginBottom: 4, // Меньше отступ
  },
  questDescription: {
    color: '#c0c0c0', // Светлее текст описания
    fontSize: 13, // Чуть меньше
    fontFamily: 'System',
    marginBottom: 10, // Отступ до наград/штрафов
    lineHeight: 18, // Межстрочный интервал
  },
  questBottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap', // Позволяет переносить элементы, если не влезают
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Перенос наград
    flexShrink: 1, // Позволяет сжиматься
    marginRight: 8, // Отступ от штрафа
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Легкий фон для награды
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginRight: 6, // Отступ между наградами
    marginBottom: 4, // Отступ если переносятся
  },
  rewardText: {
    color: '#ffffff',
    fontSize: 12, // Меньше шрифт
    fontWeight: '600',
    marginLeft: 4,
    maxWidth: 100, // Ограничение ширины для длинных названий бонусов
  },
  penaltyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.15)', // Легкий фон для штрафа
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 4, // На случай переноса
  },
  penaltyText: {
    color: '#f8a0a0', // Светло-красный
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    maxWidth: 100, // Ограничение ширины
  },
  // --- Стили кнопок действий ---
  actionButtonsContainer: {
    flexDirection: 'row',
    // Кнопки теперь вне основного градиента, имеют свой фон через questWrapper
    borderBottomLeftRadius: 10, // Скругление углов контейнера кнопок
    borderBottomRightRadius: 10,
    overflow: 'hidden', // Обрезать градиенты кнопок по радиусу
  },
  actionButton: {
    flex: 1,
    height: 40, // Меньше высота кнопок
  },
  completeButton: {
    // marginRight не нужен, т.к. flex: 1 распределит место
  },
  failButton: {
    // marginLeft не нужен
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13, // Меньше шрифт
    letterSpacing: 0.5,
    marginLeft: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)', // Чуть сильнее тень на кнопках
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    fontFamily: 'System',
  },
});