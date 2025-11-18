// src/screens/Nutrition/api/nutritionApi.js
import apiService from '../../../services/apiService';

// сводка за сегодня + список блюд
export const getSummary = () => apiService.get('/consumed-calories/summary/');

// агрегаты по дням: 'week' | 'month'
export const getByDays = (period) =>
  apiService.get(`/consumed-calories/by-days/${period}/`);

// поиск продуктов USDA
export const searchFood = (q) => {
  const term = (q || '').trim();
  const url = `/food/search/?query=${encodeURIComponent(term)}`;
  console.log('[searchFood] GET', url);
  return apiService.get(url);
};

// добавление приёма пищи (расчёт + сохранение)
export const postCalories = (payload) =>
  apiService.post('/get-calories/', payload);

// ==== НОВОЕ: цели питания пользователя ====
const GOAL_URL = '/nutrition-goals/0/'; // get_object() игнорирует pk

export const getUserGoal = () => apiService.get(GOAL_URL);

// PATCH (частичное обновление)
export const updateUserGoal = (payload) => apiService.patch(GOAL_URL, payload);
