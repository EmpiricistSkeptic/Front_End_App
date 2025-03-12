import { getToken } from './authService';

// Базовый URL вашего API
const BASE_URL = 'https://drf-project-6vzx.onrender.com'; // Замените на ваш URL

// Функция для выполнения запросов с авторизацией
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }

    const requestOptions = {
      method,
      headers,
    };

    if (data) {
      requestOptions.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Читаем ответ как текст
    const responseText = await response.text();
    // Если есть содержимое, пытаемся его распарсить, иначе возвращаем null
    return responseText ? JSON.parse(responseText) : null;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};


// Объект с методами для работы с API
const apiService = {
  // Метод для проверки авторизации (например, по наличию валидного токена)
  checkAuthStatus: async () => {
    try {
      const token = await getToken();
      // Дополнительную проверку можно добавить, если есть соответствующий API-эндпоинт
      return Boolean(token);
    } catch (error) {
      console.error('Error in checkAuthStatus:', error);
      return false;
    }
  },
  // GET-запрос
  get: (endpoint) => apiRequest(endpoint, 'GET'),
  // POST-запрос
  post: (endpoint, data) => apiRequest(endpoint, 'POST', data),
  // PATCH-запрос
  patch: (endpoint, data) => apiRequest(endpoint, 'PATCH', data),
  // DELETE-запрос
  delete: (endpoint) => apiRequest(endpoint, 'DELETE'),

  put: (endpoint, data) => apiRequest(endpoint, 'PUT', data),
};

export default apiService;
