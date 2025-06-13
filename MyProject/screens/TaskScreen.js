import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

export default function TasksScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    level: 1,
    points: 0,
    totalPoints: 1000,
    username: ''
  });
  
  // Инициализация экрана: сразу пытаемся загрузить данные
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await fetchTasks(1);
        await fetchProfileData();
      } catch (err) {
        console.error('Init error:', err);
        if (err.message.includes('Session expired')) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        } else {
          Alert.alert('Error', 'Failed to initialize. Please try again.');
        }
      }
    };
    initializeScreen();
  }, []);
  
  // Обновление при возврате на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchTasks(currentPage).catch(handleSessionError);
      fetchProfileData().catch(handleSessionError);
    });
    return unsubscribe;
  }, [navigation, currentPage]);
  
  // Обновляем после создания/обновления задачи
  useEffect(() => {
    if (route.params?.taskCreated || route.params?.taskUpdated) {
      fetchTasks(currentPage).catch(handleSessionError);
      navigation.setParams({ taskCreated: undefined, taskUpdated: undefined });
    }
  }, [route.params, currentPage]);

  const calculateXpThreshold = (level) => Math.floor(1000 * (1.5 ** (level - 1)));

  // Вспомогательная функция для обработки 401
  const handleSessionError = (err) => {
    console.error('Session or network error:', err);
    if (err.message.includes('Session expired')) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const fetchProfileData = async () => {
    const response = await apiService.get('profile/{pk}/');
    const level = response.level || 1;
    const totalPoints = calculateXpThreshold(level);
    setProfileData({
      level,
      points: response.points || 0,
      totalPoints,
      username: response.username || '',
      avatar: response.avatar_url || null
    });
  };
  
  const fetchTasks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await apiService.get(`tasks/?page=${page}`);
      console.log('tasksResponse =', response);

      // Пагинированный ответ
      if (response && typeof response === 'object' && response.results) {
        const tasksData = response.results;
        setTasks(tasksData);

        // Пагинация
        setTotalCount(response.count ?? 0);
        setCurrentPage(page);
        setHasNextPage(!!response.next);
        setHasPrevPage(!!response.previous);

      } else {
        // Непагинированный ответ (на всякий случай)
        const tasksData = Array.isArray(response) ? response : [];
        setTasks(tasksData);
        setCurrentPage(1);
        setHasNextPage(false);
        setHasPrevPage(false);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      Alert.alert('Error', 'Не удалось загрузить задачи.');
    } finally {
      setLoading(false);
    }
  };

  // Пагинация
  const handleNextPage = () => {
    if (hasNextPage) {
      fetchTasks(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      fetchTasks(currentPage - 1);
    }
  };
  
  const handleAddTask = () => {
    navigation.navigate('CreateTask', { onGoBack: fetchTasks });
  };

  const handleEditTask = (task) => {
    navigation.navigate('EditTask', { taskId: task.id, onGoBack: fetchTasks });
    setSelectedTask(null);
  };

  const handleDeleteTask = async (task) => {
    try {
      await apiService.delete(`tasks/${task.id}/`);
      setTasks(tasks.filter(t => t.id !== task.id));
      Alert.alert('Success', 'Task deleted successfully');
      setSelectedTask(null);
      // Если удалили последнюю задачу на странице, переходим на предыдущую
      if (tasks.length === 1 && hasPrevPage) {
        fetchTasks(currentPage - 1);
      } else {
        fetchTasks(currentPage);
      }
    } catch (err) {
      if (err.message.includes('Session expired')) {
        return handleSessionError(err);
      }
      console.error('Error deleting task', err);
      const errorMessage = err.message || 'Failed to delete task. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const updateProfileData = async (newPoints, newLevel) => {
    await apiService.put('profile/{pk}/', { points: newPoints, level: newLevel });
    const totalPoints = calculateXpThreshold(newLevel);
    setProfileData(prev => ({ ...prev, points: newPoints, level: newLevel, totalPoints }));
  };
  
  const handleCompleteTask = async (task) => {
  try {
    await apiService.put(`tasks/${task.id}/complete/`, {});
    
    const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, completed: true } : t);
    setTasks(updatedTasks);
    if (selectedTask?.id === task.id) setSelectedTask({ ...selectedTask, completed: true });
    
    let newPoints = profileData.points + task.points;
    let newLevel = profileData.level;
    let xpThreshold = calculateXpThreshold(newLevel);
    while (newPoints >= xpThreshold) {
      newLevel++;
      newPoints -= xpThreshold;
      xpThreshold = calculateXpThreshold(newLevel);
    }
    await updateProfileData(newPoints, newLevel);
    
    Alert.alert('Success', `Task completed! Gained ${task.points} POINTS!`);
  } catch (err) {
    if (err.message.includes('Session expired')) return handleSessionError(err);
    console.error('Error completing task', err);
    Alert.alert('Error', 'Failed to complete task. Please try again.');
    fetchTasks(currentPage);
    fetchProfileData();
  }
};
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'S': return '#ff2d55';
      case 'A': return '#ff9500';
      case 'B': return '#4dabf7';
      case 'C': return '#34c759';
      case 'D': return '#8e8e93';
      case 'E': return '#636366';
      default: return '#4dabf7';
    }
  };

  const getDifficultyName = (difficulty) => {
    switch(difficulty) {
      case 'S': return 'Supreme';
      case 'A': return 'Advanced';
      case 'B': return 'Beginner';
      case 'C': return 'Casual';
      case 'D': return 'Daily';
      case 'E': return 'Easy';
      default: return 'Unknown';
    }
  };
  
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  // Рассчитываем прогресс опыта в процентах для отображения в шкале
  const calculateExpPercentage = () => {
    return (profileData.points / profileData.totalPoints) * 100;
  };

  // Форматирование даты дедлайна
  const formatDeadline = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Particle effects background */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.particle, 
                { 
                  left: Math.random() * width, 
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3
                }
              ]} 
            />
          ))}
        </View>
        
        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACTIVE TASKS</Text>
            <View style={styles.headerRight}>
              {totalCount > 0 && (
                <Text style={styles.totalCountText}>
                  Total: {totalCount}
                </Text>
              )}
              <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
                <Ionicons name="add" size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.tasksContainer}>
            {loading ? (
              <Text style={styles.loadingText}>Loading tasks...</Text>
            ) : tasks.length === 0 ? (
              <Text style={styles.noTasksText}>No active tasks. Add a new one!</Text>
            ) : (
              tasks.map(task => (
                <TouchableOpacity 
                  key={task.id} 
                  style={[
                    styles.taskItem,
                    task.completed && styles.taskCompleted
                  ]}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={styles.taskLeft}>
                    <View 
                      style={[
                        styles.difficultyBadge, 
                        { backgroundColor: getDifficultyColor(task.difficulty) }
                      ]}
                    >
                      <Text style={styles.difficultyText}>{task.difficulty}</Text>
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskDeadline}>
                        {formatDeadline(task.deadline)}
                      </Text>
                      {task.category && (
                        <Text style={styles.taskCategory}>
                          {task.category.name || task.category}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.taskRight}>
                    <Text style={styles.pointsReward}>+{task.points} POINTS</Text>
                    {task.unit_type && task.unit_amount > 0 && (
                      <Text style={styles.unitInfo}>
                        {task.unit_amount} {task.unit_type.name || task.unit_type}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Пагинация */}
          {(hasNextPage || hasPrevPage) && (
            <View style={styles.paginationContainer}>
              <TouchableOpacity 
                style={[styles.paginationButton, !hasPrevPage && styles.paginationButtonDisabled]}
                onPress={handlePrevPage}
                disabled={!hasPrevPage}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={hasPrevPage ? "#4dabf7" : "#636366"} 
                />
                <Text style={[styles.paginationText, !hasPrevPage && styles.paginationTextDisabled]}>
                  Previous
                </Text>
              </TouchableOpacity>

              <Text style={styles.pageInfo}>Page {currentPage}</Text>

              <TouchableOpacity 
                style={[styles.paginationButton, !hasNextPage && styles.paginationButtonDisabled]}
                onPress={handleNextPage}
                disabled={!hasNextPage}
              >
                <Text style={[styles.paginationText, !hasNextPage && styles.paginationTextDisabled]}>
                  Next
                </Text>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={hasNextPage ? "#4dabf7" : "#636366"} 
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Task Details Modal */}
        {selectedTask && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeTaskDetails} />
            <View style={styles.taskDetailsModal}>
              <View style={styles.modalHeader}>
                <View 
                  style={[
                    styles.modalDifficultyBadge, 
                    { backgroundColor: getDifficultyColor(selectedTask.difficulty) }
                  ]}
                >
                  <Text style={styles.difficultyText}>{selectedTask.difficulty}</Text>
                </View>
                <View style={styles.modalTitleContainer}>
                  <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                  <Text style={styles.modalDifficultyName}>
                    {getDifficultyName(selectedTask.difficulty)}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={closeTaskDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Deadline:</Text>
                  <Text style={styles.modalInfoValue}>
                    {formatDeadline(selectedTask.deadline)}
                  </Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Points Reward:</Text>
                  <Text style={styles.modalInfoValue}>{selectedTask.points} POINTS</Text>
                </View>

                {selectedTask.category && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Category:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedTask.category.name || selectedTask.category}
                    </Text>
                  </View>
                )}

                {selectedTask.unit_type && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Target Amount:</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedTask.unit_amount} {selectedTask.unit_type.name || selectedTask.unit_type}
                    </Text>
                  </View>
                )}
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Status:</Text>
                  <Text 
                    style={[
                      styles.modalInfoValue, 
                      { color: selectedTask.completed ? '#34c759' : '#ff9500' }
                    ]}
                  >
                    {selectedTask.completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </Text>
                </View>

                {selectedTask.updated && (
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Last Updated:</Text>
                    <Text style={styles.modalInfoValue}>
                      {formatDeadline(selectedTask.updated)}
                    </Text>
                  </View>
                )}
                
                {selectedTask.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Description:</Text>
                    <Text style={styles.descriptionText}>{selectedTask.description}</Text>
                  </View>
                )}
                
                {/* Кнопки для редактирования и удаления задачи */}
                <View style={styles.editDeleteContainer}>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEditTask(selectedTask)}>
                    <LinearGradient
                      colors={['#4dabf7', '#3250b4']}
                      style={styles.editDeleteGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.editDeleteText}>Edit</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteTask(selectedTask)}>
                    <LinearGradient
                      colors={['#ff2d55', '#d11a3a']}
                      style={styles.editDeleteGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.editDeleteText}>Delete</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
                
                {!selectedTask.completed && (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleCompleteTask(selectedTask)}
                  >
                    <LinearGradient
                      colors={['#34c759', '#28a745']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>COMPLETE TASK</Text>
                    </LinearGradient>
                    <View style={styles.buttonGlow} />
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>
          </View>
        )}
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
  particlesContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalCountText: {
    color: '#c8d6e5',
    fontSize: 12,
    marginRight: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksContainer: {
    flex: 1,
  },
  loadingText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noTasksText: {
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  taskCompleted: {
    opacity: 0.6,
    borderColor: '#34c759',
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  difficultyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDeadline: {
    color: '#c8d6e5',
    fontSize: 12,
    marginBottom: 2,
  },
  taskCategory: {
    color: '#4dabf7',
    fontSize: 11,
    fontStyle: 'italic',
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  pointsReward: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  unitInfo: {
    color: '#c8d6e5',
    fontSize: 11,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  paginationButtonDisabled: {
    borderColor: '#636366',
    opacity: 0.5,
  },
  paginationText: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 5,
  },
  paginationTextDisabled: {
    color: '#636366',
  },
  pageInfo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40, 
    paddingHorizontal: 20,
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  taskDetailsModal: {
    width: '100%',
    maxWidth: width * 0.9,
    maxHeight: height * 0.85, 
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3250b4',
    paddingVertical: 12,
    paddingHorizontal: 15,
    minHeight: 60,
  },
  modalDifficultyBadge: {
    width: 24, 
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  modalDifficultyName: {
    color: '#c8d6e5',
    fontSize: 11,
    fontStyle: 'italic',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 15,
    maxHeight: height * 0.6,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12, 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.2)',
    paddingBottom: 6, 
  },
  modalInfoLabel: {
    color: '#c8d6e5',
    fontSize: 13,
    flex: 1,
  },
  modalInfoValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  descriptionContainer: {
    marginBottom: 15,
    marginTop: 8,
  },
  descriptionLabel: {
    color: '#c8d6e5',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
  },
  descriptionText: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.2)',
    maxHeight: 80,
  },
  editDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
  },
  editDeleteGradient: {
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editDeleteText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionButton: {
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
    marginBottom: 5,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34c759',
    shadowColor: '#34c759',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});

