import { getAccessToken, refreshAccessToken, logout } from './authService';

// Базовый URL вашего API
const BASE_URL = 'http://52.91.185.120';
// Общий префикс для всех API-эндпоинтов
const API_PREFIX = '/api';

// Вспомогательная функция для построения полного URL
const buildUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${API_PREFIX}${path}`;
};

/**
 * Внутренняя функция для выполнения запросов.
 * Она выполняет fetch, и если получает 401 (Unauthorized):
 * 1. Пытается обновить токен через refreshAccessToken.
 * 2. Если успешно — повторяет исходный запрос с новым токеном.
 * 3. Если не вышло — делает logout и выбрасывает ошибку.
 */
const rawRequest = async (url, options) => {
  // 1. Выполняем первичный запрос
  let response = await fetch(url, options);

  // 2. Если сервер ответил, что токен протух (401)
  if (response.status === 401) {
    console.log('[apiService] Token expired (401). Attempting to refresh...');

    try {
      // Пытаемся получить новый токен. 
      // Функция refreshAccessToken из authService сама сходит на сервер.
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Если токен получен, обновляем заголовок авторизации в options
        options.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Повторяем запрос с новым токеном (Retry)
        console.log('[apiService] Token refreshed. Retrying request...');
        response = await fetch(url, options);
      }
    } catch (err) {
      console.error('[apiService] Refresh failed or session expired:', err);
      // Если обновить не удалось (например, refresh токен тоже истек)
      // Чистим данные пользователя
      await logout();
      // Выбрасываем ошибку, чтобы остановить выполнение
      throw new Error('Session expired, please log in again');
    }
  }

  return response;
};

/**
 * Универсальный метод для запросов к API с JSON и авторизацией
 */
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const token = await getAccessToken();
  const headers = { 'Content-Type': 'application/json' };
  
  // Добавляем токен, если есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  
  // Если есть данные, добавляем их в тело запроса
  if (data) {
    options.body = JSON.stringify(data);
  }

  const fullUrl = buildUrl(endpoint);
  
  // ИСПОЛЬЗУЕМ rawRequest ВМЕСТО fetch ДЛЯ АВТО-ОБНОВЛЕНИЯ
  const response = await rawRequest(fullUrl, options);

  // Обработка ошибок (как было в вашем коде)
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  // Парсинг ответа (как было в вашем коде)
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const apiService = {
  // Проверка авторизации
  checkAuthStatus: async () => {
    try {
      const token = await getAccessToken();
      return Boolean(token);
    } catch (e) {
      console.error('Error in checkAuthStatus:', e);
      return false;
    }
  },

  // Основные методы
  get: (endpoint) => apiRequest(endpoint, 'GET'),
  post: (endpoint, data) => apiRequest(endpoint, 'POST', data),
  patch: (endpoint, data) => apiRequest(endpoint, 'PATCH', data),
  put: (endpoint, data) => apiRequest(endpoint, 'PUT', data),
  delete: (endpoint) => apiRequest(endpoint, 'DELETE'),

  // Методы для FormData (загрузка файлов/картинок)
  putFormData: async (endpoint, formData) => {
    const token = await getAccessToken();
    const headers = {}; // Content-Type браузер выставит сам для FormData
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = { method: 'PUT', headers, body: formData };

    // Используем rawRequest, чтобы загрузка файлов тоже не падала при истечении токена
    const response = await rawRequest(buildUrl(endpoint), options);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },

  patchFormData: async (endpoint, formData) => {
    const token = await getAccessToken();
    const headers = {}; 
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = { method: 'PATCH', headers, body: formData };

    // Используем rawRequest
    const response = await rawRequest(buildUrl(endpoint), options);
    
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API Error ${response.status}: ${text}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  },
};

export const API_BASE_URL = BASE_URL;
export default apiService;