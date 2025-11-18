import { getAccessToken, refreshAccessToken, logout } from './authService';

// Базовый URL вашего API
const BASE_URL = 'http://192.168.0.103:8000';
// Общий префикс для всех API-эндпоинтов
const API_PREFIX = '/api';

// Вспомогательная функция для построения полного URL
const buildUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BASE_URL}${API_PREFIX}${path}`;
};

/**
 * Выполняет fetch и при 401 пытается обновить токен и повторить запрос
 */
const rawRequest = async (url, options) => {
  let response = await fetch(url, options);

  if (response.status === 401) {
    try {
      // Попытка обновить токен
      await refreshAccessToken();
      const newToken = await getAccessToken();
      if (!newToken) {
        throw new Error('No new access token');
      }
      // Повторный запрос с новым токеном
      options.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, options);
    } catch (err) {
      // Если не удалось обновить — выходим из сессии
      logout();
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
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (data) options.body = JSON.stringify(data);

  const fullUrl = buildUrl(endpoint);
  console.log(`API Request: ${method} ${fullUrl}`); // Отладочный вывод
  console.log('Headers:', headers); // Отладочный вывод


  const response = await rawRequest(buildUrl(endpoint), options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

const apiService = {
  checkAuthStatus: async () => {
    try {
      const token = await getAccessToken();
      return Boolean(token);
    } catch (e) {
      console.error('Error in checkAuthStatus:', e);
      return false;
    }
  },
  get: (endpoint) => apiRequest(endpoint, 'GET'),
  post: (endpoint, data) => apiRequest(endpoint, 'POST', data),
  patch: (endpoint, data) => apiRequest(endpoint, 'PATCH', data),
  put: (endpoint, data) => apiRequest(endpoint, 'PUT', data),
  delete: (endpoint) => apiRequest(endpoint, 'DELETE'),
  putFormData: async (endpoint, formData) => {
    const token = await getAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const options = { method: 'PUT', headers, body: formData };

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
    const headers = { 'Authorization': `Bearer ${token}` };
    const options = { method: 'PATCH', headers, body: formData };

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


