import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, TextInput, Alert, Image, Platform, ActivityIndicator } from 'react-native'; // Добавил ActivityIndicator
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import apiService from '../services/apiService';
import { calculateXpThreshold } from '../utils/xpUtils';
import Color from 'color'; // <-- Убедись, что эта библиотека установлена (npm install color)

const { width, height } = Dimensions.get('window');
const BASE_URL_MEDIA = 'https://drf-project-6vzx.onrender.com'; // <-- УКАЖИ, ЕСЛИ ICON URL С БЭКА ОТНОСИТЕЛЬНЫЙ, ИНАЧЕ ЗАКОММЕНТИРУЙ

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [activeTab, setActiveTab] = useState('achievements');
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Для общих загрузок типа обновления профиля
  const [completedTasks, setCompletedTasks] = useState([]);

  // --- НАЧАЛО БЛОКА ИЗМЕНЕНИЙ ДЛЯ ДОСТИЖЕНИЙ (ЛОГИКА) ---
  const [userAchievementsData, setUserAchievementsData] = useState([]); // Единый стейт для данных по ачивкам пользователя
  const [achievementsLoading, setAchievementsLoading] = useState(true); // Изначально true, пока не загрузим

  // Функция загрузки данных о прогрессе достижений пользователя
  const fetchUserAchievementsProgress = async () => {
    if (!achievementsLoading) setAchievementsLoading(true); // Показываем загрузчик, если еще не активен
    try {
      // Эндпоинт 'user-achievements/progress/' возвращает массив объектов UserAchievementSerializer
      const response = await apiService.get('achievements/me/progress/');
      // Данные могут быть напрямую массивом или в поле 'results' при пагинации
      setUserAchievementsData(response.results || response || []);
      console.log('User achievements progress loaded:', response.results || response);
    } catch (error) {
      console.error('Error fetching user achievements progress:', error);
      setUserAchievementsData([]); // В случае ошибки сбрасываем в пустой массив
      Alert.alert("Error", "Could not load achievements progress.");
    } finally {
      setAchievementsLoading(false);
    }
  };
  // --- КОНЕЦ БЛОКА ИЗМЕНЕНИЙ ДЛЯ ДОСТИЖЕНИЙ (ЛОГИКА) ---

  useEffect(() => {
    fetchProfile();
    // --- ИЗМЕНЕНИЯ ДЛЯ ДОСТИЖЕНИЙ ---
    fetchUserAchievementsProgress(); // Загружаем ачивки при первом рендере
    // fetchAllAchievements(); // Удалено, т.к. 'user-achievements/progress/' должен давать все нужное

    // Запрос разрешений для ImagePicker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need camera roll permissions to upload avatars');
        }
      }
    })();
  }, []);

  const fetchCompletedTasks = async () => {
    try {
      const responseData = await apiService.get('tasks/completed/');
      if (responseData && Array.isArray(responseData.results)) {
        setCompletedTasks(responseData.results);
      } else {
        setCompletedTasks([]);
      }
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      setCompletedTasks([]);
    }
  };

  // Отдельный useEffect для fetchCompletedTasks при монтировании
  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, fetching data...');
      fetchProfile();
      // --- ИЗМЕНЕНИЯ ДЛЯ ДОСТИЖЕНИЙ ---
      fetchUserAchievementsProgress(); // Обновляем ачивки при фокусе
      fetchCompletedTasks();
    });
    return unsubscribe;
  }, [navigation]);

  // Константа BASE_URL (если нужна для чего-то еще, кроме медиа)
  // const BASE_URL_API = 'https://drf-project-6vzx.onrender.com'; // Если apiService не настроен глобально

  // Функции fetchProfile, pickImage, updateProfile, logout, getDifficultyColor, getRankFromLevel, getExpDisplay ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ
  // (Код этих функций из твоего примера)
  const fetchProfile = async () => {
    try { 
      const data = await apiService.get('profile/{pk}/'); // ОСТАВЛЯЮ {pk} КАК В ТВОЕМ КОДЕ
      setProfile(data);
      setUsername(data.username);
      setBio(data.bio || '');
      setAvatarChanged(false);
      setAvatar(data.avatar_url || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };
    
  const pickImage = async () => {
    try {
      let mediaTypesOption = ImagePicker.MediaTypeOptions.Images; // Упрощено, так как ImagePicker.MediaType устарело
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypesOption,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
        
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      console.error('Ошибка выбора изображения:', error);
      Alert.alert('Ошибка', 'Не удалось выбрать изображение: ' + error.message);
    }
  };
    
  const updateProfile = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio || '');
      
      if (avatarChanged) {
        if (avatar && (avatar.startsWith('file:') || avatar.startsWith('content:'))) {
          let fileType = 'jpeg';
          const uriParts = avatar.split('.');
          const extension = uriParts[uriParts.length - 1].toLowerCase();
          if (['jpg', 'jpeg', 'png'].includes(extension)) { // Проверяем популярные расширения
            fileType = extension === 'jpg' ? 'jpeg' : extension;
          }
          
          formData.append('avatar', {
            uri: avatar,
            name: `avatar.${fileType}`,
            type: `image/${fileType}`,
          });
        } else if (avatar === null) {
          formData.append('avatar_clear', 'true');
        }
      }
      
      const updatedData = await apiService.patchFormData('profile/{pk}/', formData); // ОСТАВЛЯЮ {pk}
      
      setAvatar(updatedData.avatar_url || null);
      setAvatarChanged(false);
      setProfile(updatedData); // Обновляем весь профиль, включая имя и био, если они изменились на бэке
      setUsername(updatedData.username);
      setBio(updatedData.bio || '');
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully!');
      // setTimeout(() => fetchProfile(), 1500); // Можно рассмотреть удаление, если updatedData содержит все
    } catch (error) {
      console.error('Profile update error:', error);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.response && error.response.data) {
        // Пытаемся извлечь сообщение об ошибке с бэкенда
        const serverError = error.response.data;
        if (typeof serverError === 'string') {
          errorMessage = serverError;
        } else if (typeof serverError === 'object') {
          // Если ошибки по полям: { username: ["This field is required."] }
          const fieldErrors = Object.entries(serverError).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
          if (fieldErrors.length > 0) errorMessage = fieldErrors.join('\n');
        }
      } else if (error.message && error.message.includes('413')) {
        errorMessage = 'Avatar image too large. Please choose a smaller image.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = async () => {
try {
await apiService.post('logout/');
navigation.navigate('Login');
} catch (error) {
console.error('Ошибка логаута:', error);
Alert.alert('Ошибка', 'Не удалось выйти из аккаунта');
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


  // --- НАЧАЛО БЛОКА ИЗМЕНЕНИЙ ДЛЯ ДОСТИЖЕНИЙ (ХЕЛПЕРЫ И КОМПОНЕНТЫ) ---

  // Цвета для тиров достижений (стиль Solo Leveling)
  const getAchievementTierColor = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'BRONZE': return '#bf6a32'; // Насыщенная бронза
      case 'SILVER': return '#a8a8b2'; // Холодное серебро
      case 'GOLD': return '#ffbf00';   // Яркое золото, можно #ffd700
      case 'PLATINUM': return '#89cff0';// Ледяная платина / Небесно-голубой
      case 'DIAMOND': return '#b026ff'; // Магический фиолетовый / Аметист
      default: return '#6c757d';       // Нейтральный серый
    }
  };

  const getAchievementTierGlow = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'BRONZE': return 'rgba(191, 106, 50, 0.7)';
      case 'SILVER': return 'rgba(168, 168, 178, 0.6)';
      case 'GOLD': return 'rgba(255, 191, 0, 0.8)';
      case 'PLATINUM': return 'rgba(137, 207, 240, 0.7)';
      case 'DIAMOND': return 'rgba(176, 38, 255, 0.8)';
      default: return 'rgba(108, 117, 125, 0.5)';
    }
  };

  // Отображение иконки достижения
  const RenderAchievementIcon = ({ achievementData, currentTier }) => {
    const iconSize = 28;
    const activeColor = getAchievementTierColor(currentTier);

    // 1. Иконка с бэкенда (ImageField URL в achievementData.icon)
    if (achievementData.icon && typeof achievementData.icon === 'string') {
      let iconUrl = achievementData.icon;
      // Если URL относительный и BASE_URL_MEDIA определена:
      if (BASE_URL_MEDIA && !iconUrl.startsWith('http') && !iconUrl.startsWith('file:')) {
         iconUrl = `${BASE_URL_MEDIA}${iconUrl}`;
      }
      return <Image source={{ uri: iconUrl }} style={[styles.achievementImageIcon, { borderColor: activeColor }]} onError={(e) => console.log("Error loading achievement image:", e.nativeEvent.error, iconUrl)} />;
    }

    // 2. Фолбэк: иконки по категориям (achievementData.category.name)
    // Категории с бэка: 'English', 'Fitness', 'Reading', 'Coding'
    if (achievementData.category && achievementData.category.name) {
      const categoryName = achievementData.category.name.toLowerCase();
      switch (categoryName) {
        case 'english': return <MaterialCommunityIcons name="translate" size={iconSize} color={activeColor} />;
        case 'fitness': return <MaterialCommunityIcons name="sword-cross" size={iconSize} color={activeColor} />;
        case 'reading': return <FontAwesome5 name="book-dead" size={iconSize * 0.9} color={activeColor} />;
        case 'coding':  return <Ionicons name="hardware-chip-outline" size={iconSize} color={activeColor} />;
        default: return <AntDesign name="star" size={iconSize} color={activeColor} />;
      }
    }
    // 3. Дефолтная иконка
    return <AntDesign name="trophy" size={iconSize} color={activeColor} />;
  };

  // Компонент для одного элемента достижения
  const AchievementDisplayItem = ({ userAchievement }) => {
    // userAchievement - это объект из массива userAchievementsData,
    // он содержит все поля от UserAchievementSerializer
    const {
      id, // ID самой записи UserAchievement
      achievement, // Вложенный объект с деталями шаблона Achievement
      current_progress,
      current_tier,
      next_tier,
      next_requirement,
      progress_percentage,
      completed,
      completed_at
    } = userAchievement;

    const tierColor = getAchievementTierColor(current_tier);
    const tierGlow = getAchievementTierGlow(current_tier);

    let progressText = `${current_progress}`;
    if (!completed && next_requirement !== null) { // next_requirement может быть 0
      progressText += ` / ${next_requirement}`;
    }
    // achievement.unit_type.symbol - символ единицы измерения
    if (achievement.unit_type && achievement.unit_type.symbol) {
      progressText += ` ${achievement.unit_type.symbol}`;
    }

    return (
      <View style={[styles.achievementItemContainerStyle, { borderColor: tierColor, shadowColor: tierGlow }]}>
        <View style={[styles.achievementIconWrapperStyle, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: tierColor, shadowColor: tierGlow }]}>
          <RenderAchievementIcon achievementData={achievement} currentTier={current_tier} />
        </View>
        
        <View style={styles.achievementDetailsStyle}>
          <Text style={[styles.achievementNameStyle, { textShadowColor: tierGlow }]}>{achievement.name}</Text>
          {achievement.description && <Text style={styles.achievementDescriptionStyle}>{achievement.description}</Text>}
          
          {!completed ? (
            <View style={styles.achievementProgressContainerStyle}>
              <View style={styles.achievementProgressBarWrapperStyle}>
                <View style={styles.achievementProgressBarBackgroundStyle}>
                  <LinearGradient
                    colors={[tierColor, Color(tierColor).darken(0.3).hex()]}
                    style={[styles.achievementProgressFillStyle, { width: `${progress_percentage}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                {progress_percentage > 0 && progress_percentage < 100 && ( // Искра только если прогресс есть, но не 100%
                   <View style={[styles.achievementProgressSparkStyle, { left: `${Math.min(98, progress_percentage)}%`, backgroundColor: Color(tierColor).lighten(0.5).hex() }]} />
                )}
              </View>
              <Text style={[styles.achievementProgressTextStyle, { color: tierColor }]}>
                {progressText}
              </Text>
            </View>
          ) : (
            <Text style={[styles.achievementCompletedTextStyle, { color: tierColor }]}>
              COMPLETED! {completed_at ? `(${new Date(completed_at).toLocaleDateString()})` : ''}
            </Text>
          )}
          
          <View style={styles.achievementTierContainerStyle}>
            <Text style={[styles.achievementCurrentTierStyle, { color: tierColor, textShadowColor: tierGlow }]}>
              TIER: {current_tier}
            </Text>
            {!completed && next_tier && (
              <Text style={styles.achievementNextTierStyle}>
                Next: {next_tier}
              </Text>
            )}
          </View>
        </View>
        
        {completed && (
          <View style={[styles.achievementCompletedBadgeStyle, {backgroundColor: tierColor}]}>
            <Ionicons name="checkmark-done-outline" size={18} color="#080b20" />
          </View>
        )}
      </View>
    );
  };

  // Функция рендеринга секции достижений
  const renderAchievementsContent = () => {
    if (achievementsLoading) {
      return (
        <View style={styles.achievementLoadingContainerStyle}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.achievementLoadingTextStyle}>Accessing Achievement Records...</Text>
        </View>
      );
    }

    if (!userAchievementsData || userAchievementsData.length === 0) {
      return (
        <View style={styles.achievementEmptyContainerStyle}>
          <MaterialCommunityIcons name="coffin" size={60} color="rgba(255, 255, 255, 0.3)" />
          <Text style={styles.achievementEmptyTextStyle}>No Trophies Unlocked Yet.</Text>
          <Text style={styles.achievementEmptySubTextStyle}>Embark on new quests to claim your glory!</Text>
        </View>
      );
    }

    return (
      <View style={styles.achievementsListWrapperStyle}>
        {userAchievementsData.map((uAch) => (
          <AchievementDisplayItem key={uAch.id} userAchievement={uAch} /> // Используем uAch.id как ключ
        ))}
      </View>
    );
  };
  // --- КОНЕЦ БЛОКА ИЗМЕНЕНИЙ ДЛЯ ДОСТИЖЕНИЙ (ХЕЛПЕРЫ И КОМПОНЕНТЫ) ---

  // Экран загрузки профиля (основного)
  if (!profile) {
    return (
      <LinearGradient colors={['#121539', '#080b20']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={{ color: '#ffffff', marginTop: 20, fontSize: 16 }}>Loading Hunter Data...</Text>
      </LinearGradient>
    );
  }

  // Твой JSX для всего экрана ProfileScreen
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        <View style={styles.particlesContainer}>
          {[...Array(30)].map((_, i) => (
            <View key={i} style={[styles.particle, { left: Math.random() * width, top: Math.random() * height, width: Math.random() * 6 + 1, height: Math.random() * 6 + 1, opacity: Math.random() * 0.5 + 0.3, borderRadius: 50 }]} />
          ))}
        </View>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
        
        <ScrollView style={styles.mainContent} contentContainerStyle={{ paddingBottom: 80 }}> {/* Добавлен paddingBottom для ScrollView */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow}>
                <TouchableOpacity style={styles.avatar} onPress={isEditing ? pickImage : null} activeOpacity={isEditing ? 0.7 : 1}>
                  {avatar ? (
                    <Image source={{ uri: avatar.includes('?') ? avatar : `${avatar}?timestamp=${Date.now()}` }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{profile.username ? profile.username.charAt(0).toUpperCase() : '?'}</Text>
                  )}
                  {isEditing && (
                    <View style={styles.editAvatarOverlay}><Feather name="camera" size={20} color="#ffffff" /></View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>{profile.level}</Text></View>
              </View>
            </View>
            
            <View style={styles.profileInfo}>
              {isEditing ? (
                <>
                  <TextInput style={[styles.username, styles.usernameEditing]} value={username} onChangeText={setUsername} placeholder="Username..." placeholderTextColor="#777" />
                  <TextInput style={[styles.bio, styles.bioEditing]} value={bio} onChangeText={setBio} multiline placeholder="Hunter Status..." placeholderTextColor="#777"/>
                  <TouchableOpacity style={styles.editProfileButton} onPress={updateProfile} disabled={isLoading}>
                    <LinearGradient colors={['#4dabf7', '#2b6ed9']} style={styles.editProfileGradient}>
                      <Text style={styles.editProfileText}>{isLoading ? 'SAVING...' : 'SAVE CHANGES'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.usernameContainer}>
                    <Text style={styles.username}>{profile.username}</Text>
                    <View style={styles.rankDecoration}><Text style={styles.rankText}>RANK {getRankFromLevel(profile.level)}</Text></View>
                  </View>
                  {(() => {
                    const { points: displayPoints, total: displayTotal } = getExpDisplay();
                    const percentage = displayTotal > 0 ? (displayPoints / displayTotal) * 100 : 0;
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
                  <View style={styles.bioContainer}>
                    <Text style={styles.bioTitle}>HUNTER STATUS</Text>
                    <Text style={styles.bio}>{profile.bio || "This hunter has not yet set a status."}</Text>
                  </View>
                  <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
                    <LinearGradient colors={['#4dabf7', '#2b6ed9']} style={styles.editProfileGradient}>
                      <Text style={styles.editProfileText}>EDIT PROFILE</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
          
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'achievements' && styles.activeTab]} onPress={() => setActiveTab('achievements')}>
              <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>TROPHIES</Text> {/* Изменено название */}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, activeTab === 'history' && styles.activeTab]} onPress={() => { setActiveTab('history'); fetchCompletedTasks(); }}>
              <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>QUEST LOG</Text> {/* Изменено название */}
            </TouchableOpacity>
          </View>
          
          {/* --- ИЗМЕНЕНИЯ ДЛЯ ДОСТИЖЕНИЙ (РЕНДЕРИНГ) --- */}
          {activeTab === 'achievements' && renderAchievementsContent()}
          {/* --- КОНЕЦ БЛОКА ИЗМЕНЕНИЙ ДЛЯ ДОСТИЖЕНИЙ (РЕНДЕРИНГ) --- */}
            
          {activeTab === 'history' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>COMPLETED QUESTS</Text>
              {completedTasks.length === 0 ? (
                <Text style={{ color: '#c8d6e5', textAlign: 'center', marginTop: 20 }}>Quest Log is empty.</Text>
              ) : (
                completedTasks.map(task => (
                  <View key={task.id || Math.random().toString()} style={styles.historyItem}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(task.difficulty || 'C') }]}>
                      <Text style={styles.difficultyText}>{task.difficulty || '?'}</Text>
                    </View>
                    <View style={styles.historyItemContent}>
                      <View style={styles.historyItemLeft}>
                        <Text style={styles.historyItemTitle}>{task.title || 'Unnamed Quest'}</Text>
                        <Text style={styles.historyItemDate}>
                          Completed: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Recently'}
                        </Text>
                      </View>
                      <Text style={styles.historyItemPoints}>+{task.points || 0} CP</Text> {/* CP = Combat Power (XP) */}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomNav}>
                  <LinearGradient
                    colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
                    style={styles.navBackground}
                  >
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
                      <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
                      <Text style={styles.navText}>Tasks</Text>
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
                    
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Assistant')}>
                      <Ionicons name="hardware-chip-outline" size={24} color="#4dabf7" /> 
                      <Text style={styles.navText}>AI Assistant</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
      </LinearGradient>
    </View>
  );
}
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50, // Адаптация под StatusBar
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
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Убрал Platform dependency, сделал более общим
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
    // paddingHorizontal: 20, // Убираем горизонтальный padding отсюда, чтобы список ачивок мог быть на всю ширину если надо
    paddingTop: 20,
    zIndex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingHorizontal: 20, // Добавляем горизонтальный padding сюда
  },
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
    width: '100%', // Заполняем контейнер
    height: '100%',
    // borderRadius: 40, // Уже есть у родителя avatar
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
  usernameEditing: { // Применяется к TextInput когда isEditing=true
    backgroundColor: 'rgba(28, 36, 84, 0.5)', // Полупрозрачный фон для инпута
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingVertical: 8,   // Немного больше высоты
    paddingHorizontal: 10,
    borderRadius: 5,     // Слегка скруглить углы
    marginBottom: 10,    // Отступ снизу
  },
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
    borderRadius: 7, // Совпадает с родителем
    // Тени для expBar можно убрать, если они конфликтуют с expBarGlow или выглядят излишне
    // shadowColor: '#4dabf7',
    // shadowOffset: { width: 0, height: 0 },
    // shadowOpacity: 1,
    // shadowRadius: 8,
    // elevation: 5,
  },
  expBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0, // Растягиваем по всей ширине родителя
    height: '50%', // Только верхняя половина для блика
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Менее интенсивный блик
    borderTopLeftRadius: 7, // Совпадает с родителем
    borderTopRightRadius: 7,
  },
  expPercentage: {
    position: 'absolute',
    right: 8,
    top: Platform.OS === 'ios' ? -1 : -1.5, // Подгонка для разных платформ
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.7)', // Более четкая тень
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
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
  bioEditing: { // Применяется к TextInput когда isEditing=true
    backgroundColor: 'rgba(28, 36, 84, 0.5)',
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    minHeight: 60, // Минимальная высота для био
    textAlignVertical: 'top', // Для Android, чтобы текст начинался сверху
    marginBottom: 15,
  },
  editProfileButton: {
    borderRadius: 8, // Более скругленные кнопки
    overflow: 'hidden',
    alignSelf: 'flex-start', // Кнопка не на всю ширину
    marginTop: 5,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  editProfileGradient: {
    paddingVertical: 10, // Кнопка чуть выше
    paddingHorizontal: 20, // И шире
    borderRadius: 8,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 13, // Чуть крупнее
    fontWeight: '600',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
    marginHorizontal: 20, // Добавляем горизонтальный padding сюда
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12, // Вкладки чуть выше
    alignItems: 'center',
  },
  tabText: {
    color: '#c8d6e5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeTab: {
    borderBottomWidth: 3, // Активная вкладка жирнее
    borderBottomColor: '#4dabf7',
  },
  activeTabText: {
    color: '#4dabf7', // Цвет текста активной вкладки
    textShadowColor: 'rgba(77, 171, 247, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8, // Более выраженное свечение
  },
  tabContent: { // Общий контейнер для содержимого вкладок (например, истории)
    flex: 1,
    marginBottom: 30, // Чтобы был отступ от нижней навигации
    paddingHorizontal: 20, // Добавляем горизонтальный padding сюда
  },
  sectionTitle: { // Заголовок внутри вкладки (например, "COMPLETED QUESTS")
    color: '#ffffff',
    fontSize: 18, // Крупнее
    fontWeight: 'bold',
    marginBottom: 18, // Больше отступ
    letterSpacing: 1.5,
    textAlign: 'center', // По центру, если это главный заголовок вкладки
    textShadowColor: 'rgba(77, 171, 247, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // --- НАЧАЛО СТИЛЕЙ ДЛЯ СЕКЦИИ ДОСТИЖЕНИЙ (TROPHIES) ---
  achievementsListWrapperStyle: {
    // paddingVertical: 10, // Если нужен дополнительный отступ сверху/снизу списка
    paddingHorizontal: 10, // Небольшой отступ по краям, чтобы элементы не прилипали
  },
  achievementItemContainerStyle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 21, 57, 0.75)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
    // borderColor и shadowColor будут динамически
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 7,
    alignItems: 'center',
  },
  achievementIconWrapperStyle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    // backgroundColor, borderColor и shadowColor будут динамически
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 9,
  },
  achievementImageIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    // borderColor будет динамическим
  },
  achievementDetailsStyle: {
    flex: 1,
  },
  achievementNameStyle: {
    color: '#E0E7FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    // textShadowColor будет динамическим (tierGlow)
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  achievementDescriptionStyle: {
    color: '#a0a8d0',
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  achievementProgressContainerStyle: {
    marginBottom: 8,
  },
  achievementProgressBarWrapperStyle: {
    position: 'relative',
    height: 12,
    marginBottom: 6,
  },
  achievementProgressBarBackgroundStyle: {
    height: '100%',
    backgroundColor: 'rgba(8, 11, 32, 0.9)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.2)',
  },
  achievementProgressFillStyle: {
    height: '100%',
    borderRadius: 5,
  },
  achievementProgressSparkStyle: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 16,
    borderRadius: 2,
    // backgroundColor будет динамически
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 10,
  },
  achievementProgressTextStyle: {
    // color будет динамически
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  achievementTierContainerStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  achievementCurrentTierStyle: {
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    // color и textShadowColor будут динамически
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
    letterSpacing: 1.2,
  },
  achievementNextTierStyle: {
    color: '#828bb8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  achievementCompletedBadgeStyle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    // backgroundColor будет tierColor
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(8, 11, 32, 0.6)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 10,
  },
  achievementCompletedTextStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    // color будет tierColor
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  achievementLoadingContainerStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  achievementLoadingTextStyle: {
    color: '#a0a8d0',
    fontSize: 16,
    marginTop: 15,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  achievementEmptyContainerStyle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    minHeight: 250,
  },
  achievementEmptyTextStyle: {
    color: '#c8d6e5',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
    textShadowColor: 'rgba(77, 171, 247, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  achievementEmptySubTextStyle: {
    color: '#828bb8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  // --- КОНЕЦ СТИЛЕЙ ДЛЯ СЕКЦИИ ДОСТИЖЕНИЙ ---

  bottomNav: {
    width: '100%',
    // paddingBottom: 20, // Убираем, т.к. safe area может быть разной. Лучше использовать SafeAreaView или отступы в navBackground
    position: 'absolute', // Позиционируем абсолютно внизу
    bottom: 0,            // Прижимаем к низу
    left: 0,
    right: 0,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10, // Уменьшил немного
    paddingBottom: Platform.OS === 'ios' ? 25 : 10, // Отступ снизу для iOS (notch)
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.4)', // Чуть заметнее
    // backgroundColor: 'rgba(10, 12, 30, 0.95)', // Можно добавить основной цвет фона, если градиент не покрывает полностью
  },
  navItem: {
    alignItems: 'center',
    flex: 1, // Чтобы элементы равномерно распределялись
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 4, // Чуть меньше отступ
  },
  loadingOverlay: { // Если используется для общих загрузок
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(8, 11, 32, 0.85)', // Более плотный фон
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999, // Поверх всего
  },
  // Стили для истории (Quest Log)
  historyItem: {
    backgroundColor: 'rgba(24, 30, 60, 0.7)', // Немного прозрачнее
    borderRadius: 12,
    marginBottom: 12,
    padding: 15, // Больше padding
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.2)', // Легкая обводка
  },
  difficultyBadge: { // Для сложности квеста
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Отступ от контента
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  difficultyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyItemContent: {
    marginLeft: 0, // Уже есть отступ от badge
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemLeft: {
    flex: 1, // Занимает доступное место, чтобы очки прижались вправо
    marginRight: 10, // Отступ от очков
  },
  historyItemTitle: {
    color: '#E0E7FF', // Светлее
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5, // Больше отступ
  },
  historyItemDate: {
    color: '#a0a8d0', // Приглушеннее
    fontSize: 12,
  },
  historyItemPoints: {
    color: '#4dabf7',
    fontWeight: 'bold',
    fontSize: 15, // Крупнее
    textShadowColor: 'rgba(77, 171, 247, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
  