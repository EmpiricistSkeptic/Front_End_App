import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, TextInput, Alert, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../services/apiService';
import { calculateXpThreshold } from '../utils/xpUtils';



const { width, height } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [activeTab, setActiveTab] = useState('achievements');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState([]);

  useEffect(() => {
    fetchProfile();
    // Request permission for image library
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload avatars');
      }
    })();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      console.log('Fetching completed tasks from endpoint: /tasks/completed/');
      const completedTasksData = await apiService.get('/tasks/completed/');
      
      if (Array.isArray(completedTasksData) && completedTasksData.length === 0) {
        console.log('No completed tasks returned from API');
      }
      
      console.log('Completed tasks count:', completedTasksData.length);
      setCompletedTasks(completedTasksData);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      if (error.message) console.error('Error message:', error.message);
    }
  };

  
  

  // Add this new useEffect after the first one
  useEffect(() => {
    // Fetch completed tasks on initial load
    fetchCompletedTasks();
  }, []);


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, fetching profile data...');
      fetchProfile();
      
      // Always fetch completed tasks when screen comes into focus
      console.log('Fetching tasks on screen focus...');
      fetchCompletedTasks();
    });
    return unsubscribe;
  }, [navigation]);

  const BASE_URL = 'https://drf-project-6vzx.onrender.com';

  const fetchProfile = async () => {
    try { 
      const data = await apiService.get('/profile/');
      setProfile(data);
      setUsername(data.username);
      setBio(data.bio)
      setAvatarChanged(false);

      if (data.avatar_url) {
        setAvatar(data.avatar_url);
      } else {
        setAvatar(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };
  

  const pickImage = async () => {
    try {
      let mediaTypesOption = ImagePicker.MediaType ? ImagePicker.MediaType.Images : ImagePicker.MediaTypeOptions.Images;
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesOption,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
  
      console.log('Image picker result:', result);
      
      // Проверяем структуру ответа (она может различаться в разных версиях)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        console.log('Selected image URI:', selectedUri);
        setAvatar(selectedUri);
        setAvatarChanged(true);
      } else if (!result.canceled && result.uri) { // для более старых версий
        console.log('Selected image URI (legacy format):', result.uri);
        setAvatar(result.uri);
        setAvatarChanged(true);
      } else {
        console.log('No image selected or selection canceled');
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение: ' + error.message);
    }
  };
  

  const updateProfile = async () => {
    setIsLoading(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio || ''); // Убедитесь, что bio не null
      
      // Avatar processing
      if (avatarChanged) {
        if (avatar && (avatar.startsWith('file:') || avatar.startsWith('content:'))) {
          // Проверка, что avatar не null и это локальный файл
          let fileType = 'jpeg'; // Default
          if (avatar.includes('.')) {
            const uriParts = avatar.split('.');
            fileType = uriParts[uriParts.length - 1].toLowerCase();
          }
          
          formData.append('avatar', {
            uri: avatar,
            name: `avatar.${fileType}`,
            type: `image/${fileType}`,
          });
          
          console.log(`Uploading avatar as ${fileType} from ${avatar}`);
        } else if (avatar === null) {
          // Если аватар был удален, отправляем сигнал очистки на бэкенд
          formData.append('avatar_clear', 'true');
          console.log('Clearing avatar');
        }
      }
      
      console.log('Sending form data:', formData);
      const updatedData = await apiService.putFormData('/profile/', formData);
      console.log('Received updated data:', updatedData);
  
      // Обновляем avatar после успешного запроса
      if (updatedData.avatar_url) {
        setAvatar(updatedData.avatar_url);
      } else {
        setAvatar(null);
      }
      
      setAvatarChanged(false);
      setProfile(updatedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
      
      // Увеличиваем задержку перед повторной загрузкой профиля
      setTimeout(() => {
        fetchProfile();
      }, 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Show appropriate error message
      if (error.response && error.response.status === 413) {
        Alert.alert('Error', 'Avatar image too large. Please choose a smaller image.');
      } else if (error.response && error.response.data && error.response.data.error) {
        Alert.alert('Error', error.response.data.error);
      } else {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  const logout = async () => {
    try {
      await apiService.post('/logout/');
      navigation.navigate('Login');
    } catch (error) {
      console.error('Ошибка логаута:', error);
      Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
    }
  };

  const getAchievementIcon = (icon) => {
    switch(icon) {
      case 'sunrise': return <Feather name="sunrise" size={24} color="#ffffff" />;
      case 'code': return <FontAwesome5 name="code" size={24} color="#ffffff" />;
      case 'dumbbell': return <FontAwesome5 name="dumbbell" size={24} color="#ffffff" />;
      case 'language': return <FontAwesome5 name="language" size={24} color="#ffffff" />;
      case 'food-apple': return <MaterialCommunityIcons name="food-apple" size={24} color="#ffffff" />;
      default: return <AntDesign name="trophy" size={24} color="#ffffff" />;
    }
  };

  // Добавьте эту функцию, если её ещё нет в ProfileScreen
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

    // Add this helper function
  function getRankFromLevel(level) {
    if (level < 10) return 'E';
    if (level < 20) return 'D';
    if (level < 30) return 'C';
    if (level < 40) return 'B';
    if (level < 50) return 'A';
    return 'S';
  }

  const getExpDisplay = () => {
    let currentLevel = profile.level;
    let xpThreshold = calculateXpThreshold(currentLevel);
    let currentPoints = profile.points;
    
    // Если набрано больше, чем нужно для текущего уровня – перерасчет
    while (currentPoints >= xpThreshold) {
      currentPoints -= xpThreshold;
      currentLevel += 1;
      xpThreshold = calculateXpThreshold(currentLevel);
    }
    
    return { points: currentPoints, total: xpThreshold };
  };
  
  // Пока данные профиля не загружены, показываем сообщение
  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ffffff' }}>Загрузка профиля...</Text>
      </View>
    );
  }

  // Return statement with updated styling for ProfileScreen
return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" />
    <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
      {/* Background particles with improved glow effect */}
      <View style={styles.particlesContainer}>
        {[...Array(30)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.particle, 
              { 
                left: Math.random() * width, 
                top: Math.random() * height,
                width: Math.random() * 6 + 1,
                height: Math.random() * 6 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                borderRadius: 50
              }
            ]} 
          />
        ))}
      </View>
      
      {/* Header with updated icon and styling */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#4dabf7" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>HUNTER PROFILE</Text>
        
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={styles.settingsButton} onPress={() => setIsEditing(!isEditing)}>
            <Ionicons name="settings-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#4dabf7" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Main content */}
      <ScrollView style={styles.mainContent}>
        {/* Profile header with improved styling */}
        <View style={styles.profileHeader}>
          {/* Avatar container with glowing effects */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow}>
              <TouchableOpacity 
                style={styles.avatar}
                onPress={isEditing ? pickImage : null}
                activeOpacity={isEditing ? 0.7 : 1}
              >
                {avatar ? (
                  <Image 
                    source={{ uri: `${avatar}?t=${Date.now()}` }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <Text style={styles.avatarText}>{profile.username.charAt(0)}</Text>
                )}

                {isEditing && (
                  <View style={styles.editAvatarOverlay}>
                    <Feather name="camera" size={20} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Rank/Level badge with glowing effect */}
            <View style={styles.levelBadgeContainer}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{profile.level}</Text>
              </View>
            </View>
          </View>
          
          {/* Profile info with improved styling */}
          <View style={styles.profileInfo}>
            {isEditing ? (
              <>
                <TextInput 
                  style={[styles.username, styles.usernameEditing]} 
                  value={username} 
                  onChangeText={setUsername} 
                />
                <TextInput 
                  style={[styles.bio, styles.bioEditing]} 
                  value={bio} 
                  onChangeText={setBio} 
                  multiline 
                />
                <TouchableOpacity style={styles.editProfileButton} onPress={updateProfile}>
                  <LinearGradient
                    colors={['#4dabf7', '#2b6ed9']}
                    style={styles.editProfileGradient}
                  >
                    <Text style={styles.editProfileText}>СОХРАНИТЬ</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Username with rank decoration */}
                <View style={styles.usernameContainer}>
                  <Text style={styles.username}>{profile.username}</Text>
                  <View style={styles.rankDecoration}>
                    <Text style={styles.rankText}>RANK {getRankFromLevel(profile.level)}</Text>
                  </View>
                </View>
                
                {/* Stylized EXP Bar */}
                {(() => {
                  const { points: displayPoints, total: displayTotal } = getExpDisplay();
                  const percentage = (displayPoints / displayTotal) * 100;
                  return (
                    <View style={styles.expSection}>
                      <View style={styles.expLabels}>
                        <Text style={styles.expLabel}>COMBAT POWER</Text>
                        <Text style={styles.expValue}>{displayPoints} / {displayTotal}</Text>
                      </View>
                      <View style={styles.expBarContainer}>
                        <View style={[styles.expBar, { width: `${percentage}%` }]} />
                        <View style={styles.expBarGlow} />
                        <Text style={styles.expPercentage}>{Math.round(percentage)}%</Text>
                      </View>
                    </View>
                  );
                })()}
                
                {/* Bio with quotation styling */}
                <View style={styles.bioContainer}>
                  <Text style={styles.bioTitle}>HUNTER STATUS</Text>
                  <Text style={styles.bio}>{profile.bio || "This hunter has not set a status yet."}</Text>
                </View>
                
                {/* Edit profile button with gradient */}
                <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
                  <LinearGradient
                    colors={['#4dabf7', '#2b6ed9']}
                    style={styles.editProfileGradient}
                  >
                    <Text style={styles.editProfileText}>EDIT PROFILE</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        
        {/* Rest of your code remains the same */}
        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'achievements' && styles.activeTab]}
            onPress={() => setActiveTab('achievements')}
          >
            <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>ACHIEVEMENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'history' && styles.activeTab]}
            onPress={() => {
              setActiveTab('history');
              fetchCompletedTasks();
            }}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>HISTORY</Text>
          </TouchableOpacity>
        </View>
        
        {/* Содержимое активной вкладки */}
        {activeTab === 'achievements' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
              {profile.achievements && profile.achievements.map((achievement) => (
                <View 
                  key={achievement.id} 
                  style={[
                    styles.achievementItem, 
                    !achievement.unlocked && styles.achievementLocked
                  ]}
                >
                  <View 
                    style={[
                      styles.achievementIcon, 
                      !achievement.unlocked && styles.achievementIconLocked
                    ]}
                  >
                    {getAchievementIcon(achievement.icon)}
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  </View>
                  <View style={styles.achievementStatus}>
                    {achievement.unlocked ? (
                      <AntDesign name="checkcircle" size={20} color="#34c759" />
                    ) : (
                      <Ionicons name="lock-closed" size={20} color="#8e8e93" />
                    )}
                  </View>
                </View>
              ))}
              <View style={styles.achievementSummary}>
                <Text style={styles.achievementSummaryText}>
                  Unlocked: {profile.achievements ? profile.achievements.filter(a => a.unlocked).length : 0}/{profile.achievements ? profile.achievements.length : 0}
                </Text>
              </View>
            </View>
          )}
          
          {activeTab === 'history' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>QUEST HISTORY</Text>
              {completedTasks.length === 0 ? (
                <Text style={{ color: '#c8d6e5' }}>История отсутствует</Text>
              ) : (
                completedTasks.map(task => {
                  // Log each task being rendered
                  console.log('Rendering history item:', task);
                    
                  return (
                    <View key={task.id || Math.random().toString()} style={styles.historyItem}>
                      <View 
                        style={[
                          styles.difficultyBadge, 
                          { backgroundColor: getDifficultyColor(task.difficulty || 'C') }
                        ]}
                      >
                        <Text style={styles.difficultyText}>{task.difficulty || '?'}</Text>
                      </View>
                      <View style={styles.historyItemContent}>
                        <View style={styles.historyItemLeft}>
                          <Text style={styles.historyItemTitle}>{task.title || 'Unnamed task'}</Text>
                          <Text style={styles.historyItemDate}>
                            Completed: Recently
                          </Text>
                        </View>
                        <Text style={styles.historyItemPoints}>+{task.points || 0} POINTS</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

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
      </LinearGradient>
    </View>
  );
}
      
      
          

// Updated styles with Solo Leveling/anime aesthetic
// Import required at the top of your file
// import { Platform } from 'react-native';

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
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 5,
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
    zIndex: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
    // Removed Platform dependency
    fontFamily: 'Roboto',
    textShadowColor: 'rgba(77, 171, 247, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  settingsButton: {
    padding: 5,
    marginLeft: 10,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 25,
  },
  // Enhanced avatar with glow effects
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarGlow: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1c2454',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  editAvatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Enhanced level badge with better styling
  levelBadgeContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    shadowColor: '#ff9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101233',
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileInfo: {
    flex: 1,
  },
  // Username with rank styling
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  username: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginRight: 10,
    textShadowColor: 'rgba(77, 171, 247, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
    letterSpacing: 1,
  },
  rankDecoration: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#4dabf7',
  },
  rankText: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  usernameEditing: {
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingBottom: 4,
  },
  // Enhanced experience bar styling
  expSection: {
    marginBottom: 15,
  },
  expLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  expLabel: {
    color: '#c8d6e5',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  expValue: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
  },
  expBarContainer: {
    width: '100%',
    height: 14,
    backgroundColor: 'rgba(16, 20, 45, 0.8)',
    borderRadius: 7,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
    position: 'relative',
  },
  expBar: {
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 7,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
  },
  expBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  expPercentage: {
    position: 'absolute',
    right: 8,
    top: -1,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Bio styling
  bioContainer: {
    backgroundColor: 'rgba(16, 20, 45, 0.6)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 3,
    borderLeftColor: '#4dabf7',
  },
  bioTitle: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  bio: {
    color: '#c8d6e5',
    fontSize: 14,
    lineHeight: 20,
  },
  bioEditing: {
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingBottom: 4,
    marginBottom: 10,
  },
  // Enhanced button styling
  editProfileButton: {
    borderRadius: 5,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    marginTop: 5,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  editProfileGradient: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Tab styling
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    color: '#c8d6e5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4dabf7',
  },
  activeTabText: {
    color: '#4dabf7',
    textShadowColor: 'rgba(77, 171, 247, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  // Extra styles from your original code
  tabContent: {
    flex: 1,
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3250b4',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  achievementIconLocked: {
    backgroundColor: '#8e8e93',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  achievementDescription: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  achievementStatus: {
    paddingLeft: 10,
  },
  achievementSummary: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  achievementSummaryText: {
    color: '#c8d6e5',
    fontSize: 14,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  historyItem: {
    backgroundColor: 'rgba(24, 30, 60, 0.6)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyItemContent: {
    marginLeft: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyItemTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  historyItemDate: {
    color: '#c8d6e5',
    fontSize: 12,
  },
  historyItemPoints: {
    color: '#4dabf7',
    fontWeight: 'bold',
    fontSize: 14,
  },
});