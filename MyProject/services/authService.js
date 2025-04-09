import AsyncStorage from '@react-native-async-storage/async-storage';
// ИЛИ для более безопасного хранения:
// import * as SecureStore from 'expo-secure-store';

// Ключ для хранения токена
const TOKEN_KEY = 'jwt_token';

// Сохранение токена
export const saveToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    // ИЛИ для SecureStore:
    // await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token', error);
  }
};

// Получение токена
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    // ИЛИ для SecureStore:
    // const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('Error getting token', error);
    return null;
  }
};

// Удаление токена (для выхода из системы)
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    // ИЛИ для SecureStore:
    // await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token', error);
  }
};

export const checkAuth = async () => {
  try {
    const token = await getToken();
    return !!token; // Возвращает true, если токен существует
  } catch (error) {
    console.error('Error checking authentication', error);
    return false;
  }
};