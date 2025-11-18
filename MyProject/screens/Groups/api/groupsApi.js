// src/screens/Groups/api/groupsApi.js
import apiService from '../../../services/apiService';

const BASE = '/groups';

/** Достаём ID группы из объекта или числа. Бросаем понятную ошибку, если нет */
const mustId = (groupOrId) => {
  const id = typeof groupOrId === 'object' ? groupOrId?.id : groupOrId;
  if (id === null || id === undefined || id === '') {
    throw new Error('groupsApi: group id is required (got undefined/null)');
  }
  return id;
};

/** ---- Группы ---- */

/**
 * Получить список групп
 * scope: 'discover' | 'mine' | 'created' | 'all'
 */
export async function listGroups({ scope = 'discover', search = '', page = 1 } = {}) {
  const params = new URLSearchParams();
  if (scope) params.append('scope', scope);
  if (search) params.append('search', search);
  if (page) params.append('page', String(page));
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiService.get(`${BASE}/${qs}`);
}

/** Получить одну группу */
export async function getGroup(groupOrId) {
  const id = mustId(groupOrId);
  return apiService.get(`${BASE}/${id}/`);
}

/** Создать группу */
export async function createGroup({ name, description = '', is_public = true }) {
  if (!name || !String(name).trim()) {
    throw new Error('Group name is required');
  }
  return apiService.post(`${BASE}/`, {
    name: String(name).trim(),
    description: String(description || ''),
    is_public: Boolean(is_public),
  });
}

/** Обновить группу (для будущего UI управления владельцем/админом) */
export async function updateGroup(groupOrId, patch) {
  const id = mustId(groupOrId);
  return apiService.patch(`${BASE}/${id}/`, patch);
}

/** Удалить группу (может только владелец) */
export async function deleteGroup(groupOrId) {
  const id = mustId(groupOrId);
  return apiService.delete(`${BASE}/${id}/`);
}

/** Вступить в группу (публичную) */
export async function joinGroup(groupOrId) {
  const id = mustId(groupOrId);
  return apiService.post(`${BASE}/${id}/join/`, {}); // пустое тело ок
}

/** Покинуть группу */
export async function leaveGroup(groupOrId) {
  const id = mustId(groupOrId);
  return apiService.post(`${BASE}/${id}/leave/`, {}); // пустое тело ок
}

/** ---- Сообщения ---- */
export async function getMessages(groupOrId, nextUrl = null) {
  const id = mustId(groupOrId);
  let url = `${BASE}/${id}/messages/`;

  // Если передан URL для следующей страницы, извлекаем из него query string
  if (nextUrl) {
    try {
      // new URL() - надежный способ распарсить URL
      const urlObject = new URL(nextUrl);
      url += urlObject.search; // .search вернет "?cursor=..."
    } catch (e) {
      console.error("Invalid nextUrl provided to getMessages:", nextUrl);
      // Не прерываем выполнение, просто делаем запрос без курсора
    }
  }

  // apiService.get уже должен уметь обрабатывать URL с query string
  return apiService.get(url);
}

/** Отправить сообщение в группу */
export async function postMessage(groupOrId, text) {
  const id = mustId(groupOrId);
  const payload = { group: id, text: String(text ?? '').trim() };
  if (!payload.text) {
    // backend вернёт 400, но дадим быстрый фидбек ещё до запроса
    throw new Error('Message text cannot be empty');
  }
  return apiService.post(`${BASE}/${id}/messages/`, payload);
}

/** Удалить сообщение (доступно владельцу/админу или расширите логику по бэку) */
export async function deleteMessage(groupOrId, messageId) {
  const id = mustId(groupOrId);
  if (messageId === null || messageId === undefined) {
    throw new Error('deleteMessage: message id is required');
  }
  return apiService.delete(`${BASE}/${id}/messages/${messageId}/`);
}
