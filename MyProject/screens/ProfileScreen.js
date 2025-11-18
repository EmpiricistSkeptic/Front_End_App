import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  MaterialIcons,
  AntDesign,
  Feather,
} from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import Color from 'color';

import apiService from '../services/apiService';
import { useProfile } from '../context/ProfileContext';
import { useFocusEffect } from '@react-navigation/native';
import { logout as authLogout } from '../services/authService';

const { width, height } = Dimensions.get('window');
const BASE_URL_MEDIA = 'http://192.168.0.102:8000';

// ---- Вспомогательные функции ----

// Формула расчета порога опыта (для чужих профилей)
function calculateXpThreshold(level) {
  return Math.floor(1000 * Math.pow(1.5, level - 1));
}

function getRankFromLevel(level) {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 30) return 'C';
  if (level < 40) return 'B';
  if (level < 50) return 'A';
  return 'S';
}

export default function ProfileScreen({ navigation, route }) {
  // 1. Получаем ID из параметров навигации (если перешли к другу)
  const { userId } = route.params || {};

  // 2. Контекст (ТОЛЬКО для текущего юзера)
  const {
    profileData: myProfileData,
    refreshProfile,
  } = useProfile();

  // 3. Определяем владельца
  // Если userId нет ИЛИ он совпадает с моим ID -> это мой профиль
  const isOwner = !userId || (myProfileData && userId === myProfileData.id);

  // 4. Локальный стейт для ЧУЖОГО профиля
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [loadingOtherProfile, setLoadingOtherProfile] = useState(false);

  // Локальные стейты UI
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [activeTab, setActiveTab] = useState('achievements');
  const [isLoading, setIsLoading] = useState(false); // Для сохранения изменений

  // История (только для владельца)
  const [completedTasks, setCompletedTasks] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // ---- Единый объект профиля для отображения ----
  const displayProfile = isOwner ? myProfileData : otherUserProfile;

  // Безопасные значения для рендера
  const level = displayProfile?.level ?? 1;
  const points = displayProfile?.points ?? 0;
  
  // Считаем математику на лету (чтобы работало и для Context, и для API данных)
  const totalPoints = calculateXpThreshold(level);
  const expPercentage = totalPoints > 0 ? (points / totalPoints) * 100 : 0;
  const safeExpPercentage = Math.min(100, Math.max(0, expPercentage));

  const profileUsername = displayProfile?.username ?? '';
  const profileBio = displayProfile?.bio ?? '';
  // Если редактируем - показываем локальный аватар, иначе - из профиля
  const profileAvatar = (isEditing && avatar) ? avatar : (displayProfile?.avatar_url || displayProfile?.avatar);

  // ---- Частицы ----
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({ // Ставим 20 штук, как в логине
        key: `p-${i}`,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 4 + 1, // Используем size вместо width/height
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  // ---- Эффекты ----

  // Синхронизация полей редактирования (Только если владелец)
  useEffect(() => {
    if (isOwner && displayProfile) {
      setUsername(profileUsername);
      setBio(profileBio);
      setAvatar(null); // Сбрасфываем локальный выбор при обновлении данных
      setAvatarChanged(false);
    }
  }, [displayProfile, isOwner, profileUsername, profileBio]);

  // Загрузка данных (Главный эффект)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        try {
          if (isOwner) {
            // Если я хозяин - обновляем контекст
            await refreshProfile();
          } else {
            // Если чужой - грузим по ID
            setLoadingOtherProfile(true);
            const response = await apiService.get(`profile/${userId}/`);
            if (isActive) {
              setOtherUserProfile(response);
            }
          }

          // Историю грузим только если это мой профиль и вкладка активна
          if (isOwner && activeTab === 'history') {
            await fetchCompletedTasks();
          }
        } catch (err) {
          if (!isActive) return;
          console.error('Error loading profile:', err);
          if (err?.response?.status === 404) {
             Alert.alert('Error', 'User not found');
             navigation.goBack();
          }
        } finally {
          if (isActive) setLoadingOtherProfile(false);
        }
      };

      loadData();
      return () => { isActive = false; };
    }, [userId, isOwner, refreshProfile, activeTab])
  );

  // Загрузка истории (отдельно, если переключили вкладку)
  const fetchCompletedTasks = async () => {
    if (!isOwner) return; // Чужую историю не грузим
    try {
      const responseData = await apiService.get('tasks/completed/');
      if (responseData && Array.isArray(responseData.results)) {
        setCompletedTasks(responseData.results);
      } else {
        setCompletedTasks([]);
      }
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      setCompletedTasks([]);
    }
  };

  // Выбор картинки (Только владелец)
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web' && isOwner) {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
           // Можно показать алерт, но не блокировать
        }
      }
    })();
  }, [isOwner]);

  const pickImage = async () => {
    if (!isOwner) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0].uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not select image');
    }
  };

  // Обновление профиля (Только владелец)
  const updateProfile = async () => {
    if (!isOwner) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio || '');

      if (avatarChanged && avatar) {
          let fileType = 'jpeg';
          const uriParts = avatar.split('.');
          const extension = uriParts[uriParts.length - 1].toLowerCase();
          if (['jpg', 'jpeg', 'png'].includes(extension)) {
            fileType = extension === 'jpg' ? 'jpeg' : extension;
          }

          formData.append('avatar', {
            uri: avatar,
            name: `avatar.${fileType}`,
            type: `image/${fileType}`,
          });
      } else if (avatar === null && avatarChanged) {
          // Логика удаления аватара, если нужно
          formData.append('avatar_clear', 'true');
      }

      // Используем ID из контекста для надежности
      await apiService.patchFormData('profile/me/', formData);

      await refreshProfile();
      setAvatarChanged(false);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
    } catch (error) {
      console.error('Ошибка логаута:', error);
    } finally {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
  };

  // ---- Цвета (Helper functions) ----
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'S': return '#ff2d55';
      case 'A': return '#ff9500';
      case 'B': return '#4dabf7';
      case 'C': return '#34c759';
      case 'D': return '#8e8e93';
      default: return '#4dabf7';
    }
  };

  const getAchievementTierColor = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'BRONZE': return '#bf6a32';
      case 'SILVER': return '#a8a8b2';
      case 'GOLD': return '#ffbf00';
      case 'PLATINUM': return '#89cff0';
      case 'DIAMOND': return '#b026ff';
      default: return '#6c757d';
    }
  };

  const getAchievementTierGlow = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'BRONZE': return 'rgba(191, 106, 50, 0.6)';
      case 'SILVER': return 'rgba(168, 168, 178, 0.5)';
      case 'GOLD': return 'rgba(255, 191, 0, 0.6)';
      case 'PLATINUM': return 'rgba(137, 207, 240, 0.6)';
      case 'DIAMOND': return 'rgba(176, 38, 255, 0.7)';
      default: return 'rgba(108, 117, 125, 0.4)';
    }
  };

  // ---- Компонент Иконки ----
  const RenderAchievementIcon = ({ achievementData, currentTier }) => {
    const iconSize = 28;
    const activeColor = getAchievementTierColor(currentTier);

    // ВАЖНО: Данные теперь вложены в .achievement
    const staticData = achievementData.achievement || {}; 

    if (staticData.icon && typeof staticData.icon === 'string') {
      let iconUrl = staticData.icon;
      if (
        BASE_URL_MEDIA &&
        !iconUrl.startsWith('http') &&
        !iconUrl.startsWith('file:')
      ) {
        iconUrl = `${BASE_URL_MEDIA}${iconUrl}`;
      }
      return (
        <Image
          source={{ uri: iconUrl }}
          style={[
            styles.achievementImageIcon,
            { borderColor: activeColor },
          ]}
        />
      );
    }

    if (staticData.category && staticData.category.name) {
      const categoryName = staticData.category.name.toLowerCase();
      switch (categoryName) {
        case 'english': return <MaterialCommunityIcons name="translate" size={iconSize} color={activeColor} />;
        case 'fitness': return <MaterialCommunityIcons name="sword-cross" size={iconSize} color={activeColor} />;
        case 'reading': return <FontAwesome5 name="book-dead" size={iconSize * 0.9} color={activeColor} />;
        case 'coding': return <Ionicons name="hardware-chip-outline" size={iconSize} color={activeColor} />;
        default: return <AntDesign name="star" size={iconSize} color={activeColor} />;
      }
    }

    return <AntDesign name="trophy" size={iconSize} color={activeColor} />;
  };

  // ---- Элемент Достижения ----
  const AchievementDisplayItem = ({ userAchievement }) => {
    // ВАЖНО: Распаковка с учетом вложенности
    const {
      id,
      current_progress,
      current_tier,
      next_tier,
      next_requirement,
      progress_percentage,
      completed,
      completed_at,
    } = userAchievement;

    // Статические данные из вложенного объекта
    const { name, description, unit_type } = userAchievement.achievement || {};

    const tierColor = getAchievementTierColor(current_tier);
    const tierGlow = getAchievementTierGlow(current_tier);

    let progressText = `${current_progress}`;
    if (!completed && next_requirement !== null) {
      progressText += ` / ${next_requirement}`;
    }
    if (unit_type && unit_type.symbol) {
      progressText += ` ${unit_type.symbol}`;
    }

    const safeProgress =
      Number.isFinite(progress_percentage) && progress_percentage >= 0
        ? Math.min(100, progress_percentage)
        : 0;

    return (
      <View
        key={id}
        style={[
          styles.achievementItemContainerStyle,
          {
            borderColor: tierColor,
            shadowColor: tierGlow,
            shadowOpacity: 0.4,
            shadowRadius: 4,
            elevation: 4,
          },
        ]}
      >
        <View
          style={[
            styles.achievementIconWrapperStyle,
            {
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderColor: tierColor,
              shadowColor: tierGlow,
              shadowOpacity: 0.7,
              shadowRadius: 5,
              elevation: 5,
            },
          ]}
        >
          <RenderAchievementIcon
            achievementData={userAchievement} // Передаем весь объект, внутри разберемся
            currentTier={current_tier}
          />
        </View>

        <View style={styles.achievementDetailsStyle}>
          <Text style={[styles.achievementNameStyle, { textShadowColor: tierGlow }]}>
            {name}
          </Text>
          {description && (
            <Text style={styles.achievementDescriptionStyle}>{description}</Text>
          )}

          {!completed ? (
            <View style={styles.achievementProgressContainerStyle}>
              <View style={styles.achievementProgressBarWrapperStyle}>
                <View style={styles.achievementProgressBarBackgroundStyle}>
                  <LinearGradient
                    colors={[tierColor, Color(tierColor).darken(0.3).hex()]}
                    style={[styles.achievementProgressFillStyle, { width: `${safeProgress}%` }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                {safeProgress > 0 && safeProgress < 100 && (
                  <View
                    style={[
                      styles.achievementProgressSparkStyle,
                      {
                        left: `${Math.min(98, safeProgress)}%`,
                        backgroundColor: Color(tierColor).lighten(0.5).hex(),
                      },
                    ]}
                  />
                )}
              </View>
              <Text style={[styles.achievementProgressTextStyle, { color: tierColor }]}>
                {progressText}
              </Text>
            </View>
          ) : (
            <Text style={[styles.achievementCompletedTextStyle, { color: tierColor }]}>
              COMPLETED!{' '}
              {completed_at ? `(${new Date(completed_at).toLocaleDateString()})` : ''}
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
          <View style={[styles.achievementCompletedBadgeStyle, { backgroundColor: tierColor }]}>
            <Ionicons name="checkmark-done-outline" size={18} color="#080b20" />
          </View>
        )}
      </View>
    );
  };

  // ---- Рендер списков ----
  const renderAchievementsContent = () => {
    // Данные берем из displayProfile
    const userAchievementsData = displayProfile?.achievements || [];

    if (!userAchievementsData || userAchievementsData.length === 0) {
      return (
        <View style={styles.achievementEmptyContainerStyle}>
          <MaterialCommunityIcons
            name="coffin"
            size={60}
            color="rgba(255, 255, 255, 0.3)"
          />
          <Text style={styles.achievementEmptyTextStyle}>
            No Trophies Unlocked Yet.
          </Text>
          <Text style={styles.achievementEmptySubTextStyle}>
            Embark on new quests to claim your glory!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.achievementsListWrapperStyle}>
        {userAchievementsData.map((uAch) => (
          <AchievementDisplayItem
            key={uAch.id}
            userAchievement={uAch}
          />
        ))}
      </View>
    );
  };

  // ---- MAIN RENDER ----
  
  // Если данные еще грузятся (особенно для чужого профиля)
  if (!displayProfile && loadingOtherProfile) {
    return (
      <LinearGradient
        colors={['#121539', '#080b20']}
        style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}
      >
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={{ color: '#ffffff', marginTop: 20 }}>Loading Profile...</Text>
      </LinearGradient>
    );
  }
  
  // Если профиль не найден совсем
  if (!displayProfile) {
      return (
          <LinearGradient colors={['#121539', '#080b20']} style={styles.container}>
             <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
                 <Text style={{color:'white'}}>Profile not found.</Text>
                 <TouchableOpacity onPress={()=>navigation.goBack()} style={{marginTop:20}}>
                     <Text style={{color:'#4dabf7'}}>Go Back</Text>
                 </TouchableOpacity>
             </View>
          </LinearGradient>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Частицы */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.size,  // Берем размер из p.size
                  height: p.size, // Берем размер из p.size
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#4dabf7" />
          </TouchableOpacity>
          
          {/* Заголовок меняется */}
          <Text style={styles.headerTitle}>
             {isOwner ? 'MY PROFILE' : 'HUNTER PROFILE'}
          </Text>
          
          {/* Кнопки настроек ТОЛЬКО для владельца */}
          {isOwner ? (
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setIsEditing((prev) => !prev)}
              >
                <Ionicons name="settings-outline" size={24} color="#4dabf7" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={24} color="#4dabf7" />
              </TouchableOpacity>
            </View>
          ) : (
             <View style={{ width: 60 }} /> // Пустой блок для баланса
          )}
        </View>

        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Верхний блок профиля */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarGlow}>
                <TouchableOpacity
                  style={styles.avatar}
                  onPress={isEditing ? pickImage : null} // Чужие не могут кликать
                  activeOpacity={isEditing ? 0.7 : 1}
                >
                  {profileAvatar ? (
                    <Image
                      source={{ uri: profileAvatar }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {profileUsername
                        ? profileUsername.charAt(0).toUpperCase()
                        : '?'}
                    </Text>
                  )}
                  {/* Иконка камеры только при редактировании */}
                  {isEditing && (
                    <View style={styles.editAvatarOverlay}>
                      <Feather name="camera" size={20} color="#ffffff" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.levelBadgeContainer}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{level}</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileInfo}>
              {isEditing ? (
                <>
                  <TextInput
                    style={[styles.username, styles.usernameEditing]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username..."
                    placeholderTextColor="#777"
                  />
                  <TextInput
                    style={[styles.bio, styles.bioEditing]}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    placeholder="Hunter Status..."
                    placeholderTextColor="#777"
                  />
                  <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={updateProfile}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#4dabf7', '#2b6ed9']}
                      style={styles.editProfileGradient}
                    >
                      <Text style={styles.editProfileText}>
                        {isLoading ? 'SAVING...' : 'SAVE CHANGES'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.usernameContainer}>
                    <Text style={styles.username}>
                      {profileUsername}
                    </Text>
                    <View style={styles.rankDecoration}>
                      <Text style={styles.rankText}>
                        RANK {getRankFromLevel(level)}
                      </Text>
                    </View>
                  </View>

                  {/* XP / COMBAT POWER */}
                  <View style={styles.expSection}>
                    <View style={styles.expLabels}>
                      <Text style={styles.expLabel}>
                        COMBAT POWER
                      </Text>
                      <Text style={styles.expValue}>
                        {points} / {totalPoints}
                      </Text>
                    </View>
                    <View style={styles.expBarContainer}>
                      <View
                        style={[
                          styles.expBar,
                          { width: `${safeExpPercentage}%` },
                        ]}
                      />
                      <View style={styles.expBarGlow} />
                      <Text style={styles.expPercentage}>
                        {Math.round(safeExpPercentage)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bioContainer}>
                    <Text style={styles.bioTitle}>
                      HUNTER STATUS
                    </Text>
                    <Text style={styles.bio}>
                      {profileBio || 'This hunter has not yet set a status.'}
                    </Text>
                  </View>
                  
                  {/* Кнопка "EDIT PROFILE" только для владельца */}
                  {isOwner && (
                    <TouchableOpacity
                        style={styles.editProfileButton}
                        onPress={() => setIsEditing(true)}
                    >
                        <LinearGradient
                        colors={['#4dabf7', '#2b6ed9']}
                        style={styles.editProfileGradient}
                        >
                        <Text style={styles.editProfileText}>
                            EDIT PROFILE
                        </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'achievements' &&
                  styles.activeTab,
              ]}
              onPress={() => setActiveTab('achievements')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'achievements' &&
                    styles.activeTabText,
                ]}
              >
                TROPHIES
              </Text>
            </TouchableOpacity>

            {/* Кнопка "QUEST LOG" скрыта для чужаков */}
            {isOwner && (
                <TouchableOpacity
                style={[
                    styles.tabButton,
                    activeTab === 'history' && styles.activeTab,
                ]}
                onPress={() => {
                    setActiveTab('history');
                    if (!historyLoaded) {
                       fetchCompletedTasks();
                    }
                }}
                >
                <Text
                    style={[
                    styles.tabText,
                    activeTab === 'history' &&
                        styles.activeTabText,
                    ]}
                >
                    QUEST LOG
                </Text>
                </TouchableOpacity>
            )}
          </View>

          {/* Контент вкладок */}
          {activeTab === 'achievements' && renderAchievementsContent()}

          {/* Вкладка истории только для владельца */}
          {activeTab === 'history' && isOwner && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>
                COMPLETED QUESTS
              </Text>
              {completedTasks.length === 0 ? (
                <Text
                  style={{
                    color: '#c8d6e5',
                    textAlign: 'center',
                    marginTop: 20,
                  }}
                >
                  Quest Log is empty.
                </Text>
              ) : (
                completedTasks.map((task) => (
                  <View
                    key={task.id}
                    style={styles.historyItem}
                  >
                    <View
                      style={[
                        styles.difficultyBadge,
                        {
                          backgroundColor: getDifficultyColor(
                            task.difficulty || 'C'
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.difficultyText}>
                        {task.difficulty || '?'}
                      </Text>
                    </View>
                    <View style={styles.historyItemContent}>
                      <View style={styles.historyItemLeft}>
                        <Text style={styles.historyItemTitle}>
                          {task.title || 'Unnamed Quest'}
                        </Text>
                        <Text style={styles.historyItemDate}>
                          Completed:{' '}
                          {task.completed_at
                            ? new Date(
                                task.completed_at
                              ).toLocaleDateString()
                            : 'Recently'}
                        </Text>
                      </View>
                      <Text style={styles.historyItemPoints}>
                        +{task.points || 0} CP
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom nav (как в оригинале) */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={[
              'rgba(16, 20, 45, 0.9)',
              'rgba(16, 20, 45, 0.75)',
            ]}
            style={styles.navBackground}
          >
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Home')}
            >
              <MaterialCommunityIcons
                name="sword-cross"
                size={24}
                color="#4dabf7"
              />
              <Text style={styles.navText}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Pomodoro')}
            >
              <MaterialIcons
                name="timer"
                size={24}
                color="#4dabf7"
              />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                navigation.navigate('Nutrition')
              }
            >
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color="#4dabf7"
              />
              <Text style={styles.navText}>Calories</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => navigation.navigate('Groups')}
            >
              <Ionicons
                name="people"
                size={24}
                color="#4dabf7"
              />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() =>
                navigation.navigate('Assistant')
              }
            >
              <Ionicons
                name="hardware-chip-outline"
                size={24}
                color="#4dabf7"
              />
              <Text style={styles.navText}>AI Assistant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>
    </View>
  );
}

/* ---- СТИЛИ — оставил твои, только слегка ослабил тени у ачивок ---- */
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
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight + 10
        : 50,
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
    paddingTop: 20,
    zIndex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 25,
    paddingHorizontal: 20,
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
    width: '100%',
    height: '100%',
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
  usernameEditing: {
    backgroundColor: 'rgba(28, 36, 84, 0.5)',
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 10,
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
    borderRadius: 7,
  },
  expBarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
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
  bioEditing: {
    backgroundColor: 'rgba(28, 36, 84, 0.5)',
    borderBottomWidth: 1,
    borderColor: '#4dabf7',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 5,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  editProfileButton: {
    borderRadius: 8,
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
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 13,
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
    marginHorizontal: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: '#c8d6e5',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#4dabf7',
  },
  activeTabText: {
    color: '#4dabf7',
    textShadowColor: 'rgba(77, 171, 247, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  tabContent: {
    flex: 1,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 18,
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(77, 171, 247, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  achievementsListWrapperStyle: {
    paddingHorizontal: 10,
  },
  achievementItemContainerStyle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 21, 57, 0.75)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    borderWidth: 1,
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
  },
  achievementImageIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  achievementDetailsStyle: {
    flex: 1,
  },
  achievementNameStyle: {
    color: '#E0E7FF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
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
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  achievementProgressTextStyle: {
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(8, 11, 32, 0.6)',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  achievementCompletedTextStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 12,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
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
  bottomNav: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.4)',
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 4,
  },
  historyItem: {
    backgroundColor: 'rgba(24, 30, 60, 0.7)',
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.2)',
  },
  difficultyBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  difficultyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  historyItemTitle: {
    color: '#E0E7FF',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  historyItemDate: {
    color: '#a0a8d0',
    fontSize: 12,
  },
  historyItemPoints: {
    color: '#4dabf7',
    fontWeight: 'bold',
    fontSize: 15,
    textShadowColor: 'rgba(77, 171, 247, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});
