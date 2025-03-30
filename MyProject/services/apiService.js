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

  putFormData: async (endpoint, formData) => {
    try {
      const token = await getToken();
      
      // Log the formData contents for debugging (in a safe way)
      console.log('FormData contents:');
      for (let [key, value] of formData._parts) {
        if (typeof value === 'object' && value.uri) {
          console.log(`${key}: [File object with uri: ${value.uri}]`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`
          // Content-Type is automatically set when using FormData
        },
        body: formData
      });
      
      // Log server response status
      console.log('Server response status:', response.status);
      
      if (!response.ok) {
        // Try to get error details from the response
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const responseText = await response.text();
      console.log('Server response:', responseText);
      return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      console.error('PUT FormData Error:', error);
      throw error;
    }
  },
  // DELETE-запрос
  delete: (endpoint) => apiRequest(endpoint, 'DELETE'),

  put: (endpoint, data) => apiRequest(endpoint, 'PUT', data),
};

export default apiService;
