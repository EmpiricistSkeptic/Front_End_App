import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMessages } from '../api/groupsApi';
import { getAccessToken } from '../../../services/authService';
import { API_BASE_URL } from '../../../services/apiService';

function httpToWs(url) {
  if (url.startsWith('https://')) return url.replace('https://', 'wss://');
  if (url.startsWith('http://')) return url.replace('http://', 'ws://');
  return url;
}

// Всегда держим сообщения в порядке: НОВЫЕ → СТАРЫЕ
// (messages[0] — самое новое сообщение)
function sortMessagesDesc(arr) {
  return [...arr].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export default function useGroupChat(groupId, { enabled = true } = {}) {
  const [messages, setMessages] = useState([]);
  const [connectionState, setConnectionState] = useState('idle'); // idle|connecting|open|closed|error
  const [error, setError] = useState(null);

  // --- СОСТОЯНИЯ ДЛЯ ПАГИНАЦИИ ---
  const [nextUrl, setNextUrl] = useState(null); // URL для следующей страницы
  const [loadingMore, setLoadingMore] = useState(false); // Индикатор загрузки старых сообщений
  const [hasMore, setHasMore] = useState(true); // Есть ли еще страницы для загрузки

  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const backoffRef = useRef(1000); // стартовый бэкофф 1s, x2 до 30s

  // 1) Первичная загрузка истории
  const loadHistory = useCallback(async () => {
    try {
      // API возвращает объект { next, previous, results }
      const data = await getMessages(groupId);
      if (Array.isArray(data.results)) {
        // Храним в стейте: [НОВОЕ, ..., СТАРОЕ]
        setMessages(sortMessagesDesc(data.results));
      }
      setNextUrl(data.next); // Сохраняем URL для следующей страницы
      setHasMore(!!data.next); // Если data.next не null, значит есть еще страницы
    } catch (e) {
      console.log('loadHistory error:', e?.message);
    }
  }, [groupId]);

  // --- ПОДГРУЗКА СТАРЫХ СООБЩЕНИЙ ---
  const loadMoreHistory = useCallback(async () => {
    // Предохранители от лишних вызовов
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      // Вызываем getMessages с сохраненным URL следующей страницы
      const data = await getMessages(groupId, nextUrl);
      if (Array.isArray(data.results) && data.results.length > 0) {
        // Склеиваем и пересортировываем, чтобы порядок опять был: новое → старое
        setMessages(prev => sortMessagesDesc([...prev, ...data.results]));
      }
      setNextUrl(data.next);
      setHasMore(!!data.next);
    } catch (e) {
      console.log('loadMoreHistory error:', e?.message);
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, nextUrl, loadingMore, hasMore]);

  // Хелперы для списка
  const upsertMessage = useCallback((msg) => {
    setMessages(prev => {
      const exists = prev.some(m => m.id === msg.id);
      let next;

      if (exists) {
        next = prev.map(m => (m.id === msg.id ? msg : m));
      } else {
        next = [...prev, msg];
      }

      // Гарантируем: [НОВОЕ, ..., СТАРОЕ]
      return sortMessagesDesc(next);
    });
  }, []);

  const removeMessage = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  // 2) открыть сокет
  const connect = useCallback(async () => {
    if (!enabled) return;
    setError(null);
    setConnectionState('connecting');

    try {
      const token = await getAccessToken();
      const wsBase = httpToWs(API_BASE_URL);
      const wsUrl = `${wsBase}/ws/group/${groupId}/?token=${encodeURIComponent(token || '')}`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnectionState('open');
        backoffRef.current = 1000; // сброс бэкоффа
      };

      ws.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload?.type === 'new_message' && payload?.message) {
            upsertMessage(payload.message);
          } else if (payload?.type === 'delete_message' && payload?.message_id != null) {
            removeMessage(payload.message_id);
          }
        } catch (e) {
          console.log('WS parse error', e);
        }
      };

      ws.onerror = (e) => {
        setConnectionState('error');
        setError('socket error');
      };

      ws.onclose = () => {
        setConnectionState('closed');
        // авто-реконнект
        if (enabled) {
          const timeout = Math.min(backoffRef.current, 30000);
          reconnectTimer.current = setTimeout(() => {
            backoffRef.current *= 2;
            connect();
          }, timeout);
        }
      };
    } catch (e) {
      setConnectionState('error');
      setError(e?.message || 'connect fail');
    }
  }, [groupId, enabled, upsertMessage, removeMessage]);

  // Управление жизненным циклом
  useEffect(() => {
    if (!enabled) return;
    loadHistory();
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (socketRef.current) {
        try { socketRef.current.close(); } catch {}
        socketRef.current = null;
      }
    };
  }, [enabled, groupId, connect, loadHistory]);

  // 3) публичное API
  const sendMessage = useCallback((text) => {
    const ws = socketRef.current;
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ message: String(text ?? '').trim() }));
      return true;
    }
    return false;
  }, []);

  const api = useMemo(() => ({
    messages,
    connectionState,
    error,
    sendMessage,
    deleteLocal: removeMessage, // локально убрать, если надо
    upsertLocal: upsertMessage, // локально подложить, если надо
    // --- ПОЛЯ ДЛЯ ПАГИНАЦИИ ---
    loadMoreHistory,
    loadingMore,
    hasMore,
  }), [
    messages, connectionState, error, sendMessage, removeMessage, upsertMessage,
    loadMoreHistory, loadingMore, hasMore
  ]);

  return api;
}

