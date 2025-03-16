import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  StatusBar, 
  ScrollView, 
  TextInput 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
// Импорт apiService для работы с авторизационным токеном и запросами
import apiService from '../services/apiService'; // Проверьте корректность пути

const { width, height } = Dimensions.get('window');

export default function GroupsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All'); // 'All' или 'Joined'
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  
  // Состояния для создания новой группы
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const currentUser = 'You';

  // Загружаем группы при монтировании компонента
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Используем относительный URL '/groups/'
      const response = await apiService.get('/groups/');
      setGroups(response);
    } catch (error) {
      console.error('Ошибка получения групп:', error);
    }
  };

  // При выборе группы загружаем сообщения для этой группы
  const openGroupDetails = async (group) => {
    try {
      // Используем относительный URL для сообщений группы
      const response = await apiService.get(`/groups/${group.id}/messages/`);
      setSelectedGroup({ ...group, messages: response });
    } catch (error) {
      console.error('Ошибка получения сообщений группы:', error);
    }
  };

  // Присоединение или выход из группы
  const handleJoinLeaveGroup = async (group) => {
    try {
      if (group.members.includes(currentUser)) {
        await apiService.post(`/groups/${group.id}/leave/`);
      } else {
        await apiService.post(`/groups/${group.id}/join/`);
      }
      // Обновляем список групп и детали выбранной группы
      await fetchGroups();
      if (selectedGroup && selectedGroup.id === group.id) {
        openGroupDetails(group);
      }
    } catch (error) {
      console.error('Ошибка при присоединении/выходе из группы:', error);
    }
  };

  // Отправка сообщения в группе
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;
    try {
      const response = await apiService.post(`/groups/${selectedGroup.id}/messages/send/`, { content: newMessage });
      // Предполагается, что эндпоинт возвращает объект отправленного сообщения
      setSelectedGroup(prev => ({ ...prev, messages: [...prev.messages, response] }));
      setNewMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  // Создание новой группы через модальное окно
  const handleSubmitCreateGroup = async () => {
    if (!newGroupName.trim() || !newGroupDescription.trim()) return;
    try {
      const response = await apiService.post('/groups/create/', {
        name: newGroupName,
        description: newGroupDescription,
      });
      // Предполагается, что ответ возвращает созданную группу
      setGroups(prev => [response, ...prev]);
      // Закрываем модальное окно и очищаем поля
      setCreateGroupModalVisible(false);
      setNewGroupName('');
      setNewGroupDescription('');
    } catch (error) {
      console.error('Ошибка создания группы:', error);
    }
  };

  // Фильтрация групп по поисковому запросу и выбранной вкладке
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          group.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'Joined') {
      return group.members.includes(currentUser);
    }
    return true;
  });

  const closeGroupDetails = () => {
    setSelectedGroup(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фон с частицами */}
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

        {/* Хедер */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Groups</Text>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>E</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Поисковая строка */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#c8d6e5" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            placeholderTextColor="#c8d6e5"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Вкладки: All и Joined */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {['All', 'Joined'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.categoryItem, activeTab === tab && styles.categoryItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.categoryText, activeTab === tab && styles.categoryTextActive]}>
                {tab} Groups
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Основной контент - список групп */}
        <View style={styles.mainContent}>
          <ScrollView style={styles.contentContainer}>
            {filteredGroups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={styles.contentItem}
                onPress={() => openGroupDetails(group)}
              >
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{group.name}</Text>
                  <Text style={styles.contentSnippet}>
                    {group.description.substring(0, 60)}...
                  </Text>
                </View>
                <View style={styles.contentMeta}>
                  <Text style={styles.contentCategory}>{group.created_at}</Text>
                  <Text style={styles.contentDate}>{group.members.length} members</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Нижняя навигация */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Quests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pomodoro')}>
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Nutrition')}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Calories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Groups')}>
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
              <FontAwesome5 name="book" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Learn</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Плавающая кнопка для создания группы */}
        <TouchableOpacity style={styles.fabButton} onPress={() => setCreateGroupModalVisible(true)}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* Модальное окно деталей группы */}
        {selectedGroup && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeGroupDetails} />
            <View style={styles.contentDetailsModal}>
              {/* Заголовок модального окна */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeGroupDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              {/* Содержимое модального окна */}
              <View style={styles.modalContent}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Created by:</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.created_by}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Created at:</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.created_at}</Text>
                </View>
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description:</Text>
                  <Text style={styles.descriptionText}>{selectedGroup.description}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Members:</Text>
                  <Text style={styles.modalInfoValue}>{selectedGroup.members.join(', ')}</Text>
                </View>
                {/* Кнопка для присоединения/выхода из группы */}
                <TouchableOpacity 
                  style={{ marginVertical: 10, alignSelf: 'flex-end', width: '40%' }} 
                  onPress={() => handleJoinLeaveGroup(selectedGroup)}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>
                      {selectedGroup.members.includes(currentUser) ? 'Leave Group' : 'Join Group'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Секция сообщений */}
                <View style={{ maxHeight: 200, marginTop: 15 }}>
                  <ScrollView>
                    {selectedGroup.messages && selectedGroup.messages.map(msg => (
                      <View key={msg.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: '#4dabf7', fontWeight: 'bold' }}>{msg.sender}</Text>
                        <Text style={{ color: '#ffffff' }}>{msg.content}</Text>
                        <Text style={{ color: '#c8d6e5', fontSize: 10 }}>{msg.timestamp}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
                {/* Поле ввода для нового сообщения */}
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <TextInput
                    style={[styles.searchInput, { flex: 1, marginRight: 10 }]}
                    placeholder="Type a message..."
                    placeholderTextColor="#c8d6e5"
                    value={newMessage}
                    onChangeText={setNewMessage}
                  />
                  <TouchableOpacity onPress={handleSendMessage}>
                    <Ionicons name="send" size={24} color="#4dabf7" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Модальное окно создания группы */}
        {createGroupModalVisible && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={() => setCreateGroupModalVisible(false)} />
            <View style={styles.createGroupModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Group</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setCreateGroupModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <TextInput 
                  style={styles.inputField}
                  placeholder="Group Name"
                  placeholderTextColor="#c8d6e5"
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                />
                <TextInput 
                  style={[styles.inputField, { height: 80 }]}
                  placeholder="Group Description"
                  placeholderTextColor="#c8d6e5"
                  multiline
                  value={newGroupDescription}
                  onChangeText={setNewGroupDescription}
                />
                <TouchableOpacity onPress={handleSubmitCreateGroup}>
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>Create Group</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
  },
  categoriesContainer: {
    marginTop: 15,
    maxHeight: 40,
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryItemActive: {
    backgroundColor: '#4dabf7',
  },
  categoryText: {
    color: '#c8d6e5',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flex: 1,
  },
  contentItem: {
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
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contentSnippet: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  contentMeta: {
    alignItems: 'flex-end',
  },
  contentCategory: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentDate: {
    color: '#c8d6e5',
    fontSize: 10,
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
  contentDetailsModal: {
    width: width * 0.85,
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  createGroupModal: {
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
  inputField: {
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    color: '#ffffff',
    borderRadius: 6,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#4dabf7',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
});


