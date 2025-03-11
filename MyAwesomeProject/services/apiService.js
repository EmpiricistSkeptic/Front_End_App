import { getToken } from './authService';

// Базовый URL вашего API
const BASE_URL = 'https://drf-project-6vzx.onrender.com'; // Замените на ваш URL

// Функция для выполнения запросов с авторизацией
export const apiRequest = async (endpoint, method = 'GET', data = null) => {
  try {
    // Получаем токен
    const token = await getToken();
    
    // Формируем заголовки
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Добавляем токен авторизации, если он есть
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
    
    // Формируем параметры запроса
    const requestOptions = {
      method,
      headers,
    };
    
    // Если есть данные, добавляем их в тело запроса
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    
    // Выполняем запрос
    const response = await fetch(`${BASE_URL}${endpoint}`, requestOptions);
    
    // Проверяем статус ответа
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    // Возвращаем данные
    return await response.json();
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
};

export default apiService;
