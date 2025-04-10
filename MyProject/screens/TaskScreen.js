import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, Alert, Image} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';


const { width, height } = Dimensions.get('window');

export default function TasksScreen({ navigation, route }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    level: 1,
    points: 0,
    totalPoints: 1000,
    username: ''
  });
  
  // Получение токена и данных при загрузке компонента
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        const userToken = await AsyncStorage.getItem('jwt_token');
        if (userToken) {
          fetchTasks();
          fetchProfileData(); // Загружаем данные профиля
        } else {
          // Перенаправление на экран входа, если токен отсутствует
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (e) {
        console.error('Failed to get token on TaskScreen mount, resetting to Login.', e);
      await removeToken(); // На всякий случай удалим потенциально поврежденный токен
      navigation.reset({ // ПРАВИЛЬНО: Используй reset
        index: 0,
        routes: [{ name: 'Login' }],
      });
      }
    };
    
    initializeScreen();
  }, []);
  
  // Добавляем listener для обновления данных при возврате на экран
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Обновляем список задач и профиль каждый раз, когда экран становится активным
      fetchTasks();
      fetchProfileData();
    });
    
    // Очистка listener при размонтировании компонента
    return unsubscribe;
  }, [navigation]);
  
  // Отслеживаем параметры маршрута для обновления после создания новой задачи
  useEffect(() => {
    if (route.params?.taskCreated || route.params?.taskUpdated) {
      // Если задача была создана или обновлена, перезагружаем список
      fetchTasks();
      // Сбрасываем параметр, чтобы избежать повторного обновления
      navigation.setParams({taskCreated: undefined, taskUpdated: undefined});
    }
  }, [route.params]);

  // Функция для расчета порога XP, соответствующая бэкенду
  const calculateXpThreshold = (level) => {
    return Math.floor(1000 * (1.5 ** (level - 1)));
  };
  
  // Получение данных профиля
  const fetchProfileData = async () => {
    try {
      const response = await apiService.get('/profile/');

      const level = response.level || 1;

      const totalPoints = calculateXpThreshold(level);
      setProfileData({
        level: level,
        points: response.points || 0,
        totalPoints: totalPoints,
        username: response.username || '',
        avatar: response.avatar_url || null
      });
      console.log('Fetched profile data:', response);
    } catch (error) {
      console.error('Error fetching profile data', error);
    }
  };
  
  // Получение списка задач с сервера через apiService
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/tasks/');
      console.log('Fetched tasks:', response);
      setTasks(response);
    } catch (error) {
      console.error('Error fetching tasks', error);
      Alert.alert('Error', 'Failed to load your tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Добавление новой задачи
  const handleAddTask = () => {
    navigation.navigate('CreateTask', { onGoBack: () => fetchTasks() });
  };

  // Редактирование задачи
  const handleEditTask = (task) => {
    navigation.navigate('EditTask', { 
      taskId: task.id,
      onGoBack: () => fetchTasks() 
    });
    closeTaskDetails();
  };

  // Удаление задачи через apiService
  const handleDeleteTask = async (task) => {
    try {
      await apiService.delete(`/tasks/${task.id}/delete/`);
      
      // Обновление списка задач после удаления
      setTasks(tasks.filter(t => t.id !== task.id));
      Alert.alert('Success', 'Task deleted successfully');
      closeTaskDetails();
    } catch (error) {
      console.error('Error deleting task', error);
      Alert.alert('Error', 'Failed to delete task. Please try again.');
    }
  };
  
  // Обновление профиля с новыми значениями опыта и уровня
  const updateProfileData = async (newPoints, newLevel) => {
    try {
      // Отправляем обновленные данные на сервер
      await apiService.put('/profile/', {
        points: newPoints,
        level: newLevel,
      });

      const calculatedTotalPoints = calculateXpThreshold(newLevel);
      
      // Обновляем локальное состояние
      setProfileData({
        ...profileData,
        points: newPoints,
        level: newLevel,
        totalPoints: calculatedTotalPoints
      });
    } catch (error) {
      console.error('Error updating profile data', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };
  
  // Отметка задачи как выполненной через apiService
  const handleCompleteTask = async (task) => {
    try {
      // Пробуем использовать put или patch для завершения задачи
      try {
        await apiService.put(`/tasks/complete/${task.id}/`, {});
      } catch (putError) {
        // Если PUT не работает, пробуем PATCH
        if (putError.response && putError.response.status === 405) {
          await apiService.patch(`/tasks/complete/${task.id}/`, {});
        } else {
          throw putError;
        }
      }
      
      // Обновление статуса задачи в локальном состоянии
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: true } : t
      );
      setTasks(updatedTasks);
      
      // Обновление выбранной задачи, если она открыта
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, completed: true });
      }
      
      // Расчет нового опыта и уровня
      let newPoints = profileData.points + task.points;
      let newLevel = profileData.level;
      let xpThreshold = calculateXpThreshold(newLevel);

      // Если опыт превышает порог, переносим избыточные очки на следующий уровень
      while (newPoints >= xpThreshold) {
        newLevel += 1;
        newPoints -= xpThreshold;
        xpThreshold = calculateXpThreshold(newLevel);
      }

      
      // Обновляем профиль на сервере
      await updateProfileData(newPoints, newLevel);
      if (route.params?.fetchProfileData) {
        route.params.fetchProfileData();
      }
      
      Alert.alert('Success', `Task completed! Gained ${task.points} POINTS!`);
      
    } catch (error) {
      console.error('Error completing task', error);
      
      let errorMessage = 'Failed to complete task. Please try again.';
      if (error.response) {
        errorMessage += ` Status: ${error.response.status}`;
      }
      
      Alert.alert('Error', errorMessage);
      
      // Перезагрузим данные, чтобы убедиться, что они актуальны
      fetchTasks();
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
      default: return '#4dabf7';
    }
  };
  
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };
  
  // Рассчитываем прогресс опыта в процентах для отображения в шкале
  const calculateExpPercentage = () => {
    return (profileData.points / profileData.totalPoints) * 100;
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
            <TouchableOpacity style={styles.addButton} onPress={handleAddTask}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
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
                      <Text style={styles.taskDeadline}>{task.deadline}</Text>
                    </View>
                  </View>
                  <View style={styles.taskRight}>
                    <Text style={styles.pointsReward}>+{task.points} POINTS</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeTaskDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Deadline:</Text>
                  <Text style={styles.modalInfoValue}>{selectedTask.deadline}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>points Reward:</Text>
                  <Text style={styles.modalInfoValue}>{selectedTask.points} POINTS</Text>
                </View>
                
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
                
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>{selectedTask.description}</Text>
                </View>
                
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
                      colors={['#4dabf7', '#3250b4']}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>COMPLETE TASK</Text>
                    </LinearGradient>
                    <View style={styles.buttonGlow} />
                  </TouchableOpacity>
                )}
              </View>
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
  headerLeft: {
    flex: 1,
  },
  levelText: {
    color: '#4dabf7',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  pointsBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  pointsBar: {
    width: '62.5%',
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 3,
  },
  pointsText: {
    position: 'absolute',
    right: 0,
    top: 8,
    color: '#c8d6e5',
    fontSize: 10,
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#3250b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
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
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  pointsReward: {
    color: '#4dabf7',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomNav: {
    width: '100%',
    paddingBottom: 20,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: width * 0.85,
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 8,
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
  modalTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.2)',
    paddingBottom: 8,
  },
  modalInfoLabel: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  modalInfoValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 10,
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
  editDeleteContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  editButton: {
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    flex: 1,
  },
  editDeleteGradient: {
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editDeleteText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

