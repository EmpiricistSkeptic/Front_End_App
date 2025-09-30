// authService.js
// authService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://192.168.0.102:8000";
const ACCESS_KEY = 'jwt_access_token';
const REFRESH_KEY = 'jwt_refresh_token';

/** Сохранение Access и Refresh токенов */
export const saveTokens = async ({ access, refresh }) => {
  try {
    if (access) await AsyncStorage.setItem(ACCESS_KEY, access);
    if (refresh) await AsyncStorage.setItem(REFRESH_KEY, refresh);
  } catch (e) {
    console.error('Error saving tokens', e);
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

/** Удаление токенов */
export const clearTokens = async () => {
  try {
    await AsyncStorage.removeItem(ACCESS_KEY);
    await AsyncStorage.removeItem(REFRESH_KEY);
  } catch (e) {
    console.error('Error clearing tokens', e);
  }
};

/** Логин: POST /login/ возвращает access и refresh */
export const login = async ({ username, password }) => {
  const resp = await fetch(`${BASE_URL}/api/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!resp.ok) throw new Error(`Login failed: ${resp.status}`);
  const data = await resp.json();
  await saveTokens(data);
  return data;
};

/** Регистрация: POST /register/ возвращает access и refresh */
export const register = async (payload) => {
  const resp = await fetch(`${BASE_URL}/api/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let responseBodyText = ''; // Будем хранить тело ответа здесь
  let responseData = null;   // Для распарсенного JSON, если успешно

  try {
    responseBodyText = await resp.text(); // Читаем тело как текст ОДИН РАЗ
    if (resp.ok) { // Если статус OK, пытаемся распарсить как JSON
      responseData = JSON.parse(responseBodyText);
    }
  } catch (e) {
    // Ошибка при чтении тела или парсинге JSON для успешного ответа
    console.error("Error reading/parsing response body:", e);
    if (resp.ok) { // Если статус был OK, но тело невалидно
        throw new Error("Received OK status, but failed to process response body.");
    }
    // Если статус не OK, то responseBodyText уже содержит текст ошибки (или пуст)
    // и мы обработаем это ниже
  }

  if (!resp.ok) {
    console.error(`Registration failed with status: ${resp.status}.`);
    console.error('Server response (text):', responseBodyText); // ВЫВОДИМ ТЕКСТ ОТВЕТА 500

    // Пытаемся распарсить текст как JSON, если это ошибка 400 (может содержать детали)
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
    } else if (responseBodyText) { // Если не 400 или не парсится, используем сырой текст
        errorMessage += ` - Server response: ${responseBodyText.substring(0, 200)}...`; // Обрезаем для краткости
    }
    throw new Error(errorMessage);
  }

  // Если дошли сюда, значит resp.ok === true и responseData содержит успешный JSON
  await saveTokens(responseData);
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

/** Выход: удаляем токены */
export const logout = async () => {
  try {
    const refresh = await getRefreshToken();
    console.log("DEBUG refresh token (before logout):", refresh); // <-- важный лог
    if (!refresh) throw new Error("No refresh token stored");

    const body = JSON.stringify({ refresh: refresh });
    console.log("DEBUG logout body:", body); // <-- ещё лог

    const resp = await fetch(`${BASE_URL}/api/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`API Error ${resp.status}: ${text}`);
    }

    await clearTokens();
    console.log("Logout successful");
  } catch (e) {
    console.error("Ошибка логаута:", e);
  }
};


/** Проверка авторизации (наличие access токена) */
export const isAuthenticated = async () => {
  const token = await getAccessToken();
  return Boolean(token);
};

export default {
  login,
  register,
  refreshAccessToken,
  logout,
  isAuthenticated,
  getAccessToken,
};
