// authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://52.91.185.120";

// --- Ключи для хранения в AsyncStorage ---
const ACCESS_KEY = 'jwt_access_token';
const REFRESH_KEY = 'jwt_refresh_token';
const USER_ID_KEY = 'userId';
const USERNAME_KEY = 'username';

// --- Вспомогательные функции для управления данными в AsyncStorage ---

/** Сохранение Access и Refresh токенов */
export const saveTokens = async ({ access, refresh }) => {
  try {
    if (access) await AsyncStorage.setItem(ACCESS_KEY, access);
    if (refresh) await AsyncStorage.setItem(REFRESH_KEY, refresh);
  } catch (e) {
    console.error('Error saving tokens', e);
  }
};

/** Сохранение данных пользователя (ID и username) */
const saveUserData = async (data) => {
  try {
    if (data && data.user_id) {
      await AsyncStorage.setItem(USER_ID_KEY, String(data.user_id));
    }
    if (data && data.username) {
      await AsyncStorage.setItem(USERNAME_KEY, data.username);
    }
  } catch (e) {
    console.error('Error saving user data', e);
  }
};

/** Получение Access токена */
export const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem(ACCESS_KEY);
  } catch (e) {
    console.error('Error getting access token', e);
    return null;
  }
};

/** Получение Refresh токена */
export const getRefreshToken = async () => {
  try {
    return await AsyncStorage.getItem(REFRESH_KEY);
  } catch (e) {
    console.error('Error getting refresh token', e);
    return null;
  }
};

/** Полная очистка всех данных аутентификации */
const clearAuthData = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USERNAME_KEY);
  } catch (e) {
    console.error('Error clearing auth data', e);
  }
};

// --- Основные функции API ---

/** Логин: POST /login/ */
export const login = async ({ username, password }) => {
  const resp = await fetch(`${BASE_URL}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) throw new Error(`Login failed: ${resp.status}`);
  const data = await resp.json();
  // Сохраняем и токены, и данные пользователя
  await saveTokens(data);
  await saveUserData(data);
  return data;
};

/** Регистрация: POST /register/ */
export const register = async (payload) => {
  const resp = await fetch(`${BASE_URL}/api/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let responseBodyText = '';
  let responseData = null;

  try {
    responseBodyText = await resp.text();
    if (resp.ok) {
      responseData = JSON.parse(responseBodyText);
    }
  } catch (e) {
    console.error("Error reading/parsing response body:", e);
    if (resp.ok) {
        throw new Error("Received OK status, but failed to process response body.");
    }
  }

  if (!resp.ok) {
    console.error(`Registration failed with status: ${resp.status}.`);
    console.error('Server response (text):', responseBodyText);

    let errorDetails = null;
    if (resp.status === 400) {
        try {
            errorDetails = JSON.parse(responseBodyText);
        } catch (e) {
            console.warn("Could not parse 400 error response as JSON, using raw text.");
        }
    }

    let errorMessage = `Registration failed: ${resp.status}`;
    if (errorDetails && typeof errorDetails === 'object') {
        const messages = Object.entries(errorDetails)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
        if (messages) {
            errorMessage += ` - ${messages}`;
        } else if (errorDetails.detail) {
            errorMessage += ` - ${errorDetails.detail}`;
        } else {
            errorMessage += ` - ${JSON.stringify(errorDetails)}`;
        }
    } else if (responseBodyText) {
        errorMessage += ` - Server response: ${responseBodyText.substring(0, 200)}...`;
    }
    throw new Error(errorMessage);
  }

  // Сохраняем и токены, и данные пользователя
  await saveTokens(responseData);
  await saveUserData(responseData);
  return responseData;
};

/** Обновление Access токена: POST /token/refresh/ */
export const refreshAccessToken = async () => {
  const refresh = await getRefreshToken();
  if (!refresh) throw new Error('No refresh token');
  const resp = await fetch(`${BASE_URL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!resp.ok) throw new Error(`Refresh failed: ${resp.status}`);
  const data = await resp.json();
  await AsyncStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
};

/** Выход: POST /logout/ и очистка локальных данных */
export const logout = async () => {
  try {
    const refresh = await getRefreshToken();
    if (refresh) {
      await fetch(`${BASE_URL}/api/logout/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      // Мы не проверяем resp.ok, так как хотим выйти локально в любом случае
    }
  } catch (e) {
    console.error("API Error on logout request:", e);
  } finally {
    // Гарантированно очищаем все данные, даже если запрос к API не удался
    await clearAuthData();
    console.log("Local auth data cleared.");
  }
};

/** Проверка авторизации (наличие access токена) */
export const isAuthenticated = async () => {
  const token = await getAccessToken();
  return Boolean(token);
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  // 1. Формируем полный URL
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  // 2. Получаем текущий токен
  let token = await getAccessToken();

  // 3. Настраиваем заголовки
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers, // позволяем переопределять заголовки
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Делаем первый запрос
  let response = await fetch(url, { ...options, headers });

  // 5. Если сервер ответил 401 (Unauthorized), пробуем обновить токен
  if (response.status === 401) {
    console.log("Access token expired. Attempting to refresh...");

    try {
      // Пытаемся обновить токен
      const newToken = await refreshAccessToken();
      
      if (newToken) {
        // Если успешно обновили, повторяем запрос с новым токеном
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Если обновить не вышло (например, refresh токен тоже истек),
      // logout() уже вызовется внутри refreshAccessToken или здесь
      await logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

export default {
  login,
  register,
  refreshAccessToken,
  logout,
  isAuthenticated,
  getAccessToken,
  fetchWithAuth,
};