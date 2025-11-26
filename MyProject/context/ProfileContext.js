// context/ProfileContext.js
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import apiService from '../services/apiService';

// Локальная функция расчёта XP-порога
const calculateXpThreshold = (level) =>
  Math.floor(1000 * Math.pow(1.5, level - 1));

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(null);

  const refreshProfile = useCallback(async () => {
    const response = await apiService.get('profile/me/');

    const level = response.level || 1;
    const points = response.points || 0;
    const totalPoints = calculateXpThreshold(level);
    const expPercentage =
      totalPoints > 0 ? (points / totalPoints) * 100 : 0;

    // “сырой” URL аватара, который приходит с бэка
    const rawAvatar = response.avatar_url || response.avatar || null;

    // Добавляем параметр версии, чтобы ломать кеш
    const avatarWithVersion = rawAvatar
      ? `${rawAvatar}${rawAvatar.includes('?') ? '&' : '?'}v=${Date.now()}`
      : null;

    setProfileData({
      ...response,
      level,
      points,
      totalPoints,
      expPercentage,
      // используем урл с версией
      avatar: avatarWithVersion,
      // если вдруг где-то понадобится — хранится и сырой вариант
      avatarRaw: rawAvatar,
    });
  }, []);

  // Один раз подгружаем профиль при старте приложения
  useEffect(() => {
    refreshProfile().catch((err) =>
      console.error('Initial profile load error:', err)
    );
  }, [refreshProfile]);

  const value = {
    profileData,
    totalPoints: profileData?.totalPoints ?? 0,
    expPercentage: profileData?.expPercentage ?? 0,
    refreshProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileContext.Provider');
  }
  return ctx;
};

export { ProfileContext };
