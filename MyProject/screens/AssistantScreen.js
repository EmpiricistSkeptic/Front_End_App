import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

// --- Цвета и стили ---
const COLORS = {
  backgroundGradientStart: '#121539',
  backgroundGradientEnd: '#080b20',
  accentBlue: '#4dabf7',
  borderBlue: '#3250b4',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  aiBubbleBackground: 'rgba(16, 20, 45, 0.75)',
  userBubbleBackground: 'rgba(26, 30, 60, 0.85)',
  inputBackground: 'rgba(16, 20, 45, 0.9)',
  placeholder: '#5f7191',
  error: '#ff4d4d',
  particle: '#4dabf7',
  headerBorder: 'rgba(77, 171, 247, 0.3)',
  inputContainerBorder: 'rgba(77, 171, 247, 0.2)',
  sendButtonText: '#080b20',
  sendButtonDisabled: '#5f7191',
};

const AssistantScreen = ({ navigation }) => {
  // --- Состояния ---
  const [messages, setMessages] = useState([]); 
  const [inputText, setInputText] = useState(''); 
  const [isLoading, setIsLoading] = useState(false); 
  const [isHistoryLoading, setIsHistoryLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const flatListRef = useRef(null);
  
  // Упрощаем логику скролла
  const [userScrolled, setUserScrolled] = useState(false); 
  const listContentHeight = useRef(0);
  const initialLoad = useRef(true);

  // --- Загрузка истории при открытии экрана ---
  useEffect(() => {
    const loadHistory = async () => {
      setIsHistoryLoading(true);
      setError(null);
      try {
        const historyData = await apiService.get('/chat/history/');

        console.log("История получена с бэкенда:", JSON.stringify(historyData, null, 2));

        if (Array.isArray(historyData)) {
            setMessages(historyData);
            initialLoad.current = true;
        } else {
          console.error("Неожиданный формат ответа от /chat/history/:", historyData);
          setMessages([
            {
              id: 'error-format-history',
              text: '[Система] Ошибка: неверный формат истории от сервера.',
              sender: 'ai',
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("Ошибка загрузки истории чата:", err);
        let errorMessage = "Не удалось загрузить историю диалога.";
        if (err.response) {
          console.error('Детали ошибки ответа:', err.response.status, err.response.data);
          errorMessage = `Ошибка ${err.response.status}: ${err.response.data?.detail || 'Сервер не смог загрузить историю'}`;
        } else if (err.request) {
          console.error('Детали ошибки запроса:', err.request);
          errorMessage = 'Сервер истории не отвечает. Проверьте подключение.';
        } else {
          console.error('Другая ошибка:', err.message, err);
          errorMessage = err.message || 'Неизвестная ошибка при загрузке.';
        }
        setError(errorMessage);
        setMessages([
          {
            id: 'error-load-history',
            text: `[Система] ${errorMessage}`,
            sender: 'ai',
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Функция для прокрутки списка до конца
  const scrollToEnd = useCallback((animated = true) => {
    if (flatListRef.current && messages.length > 0) {
      try {
        flatListRef.current.scrollToEnd({ animated });
        console.log('Выполнен scrollToEnd, animated:', animated);
      } catch (e) {
        console.error('Ошибка при scrollToEnd:', e);
      }
    }
  }, [messages.length]);
  
  // Измеряем контент списка и скроллим при изменении сообщений
  useEffect(() => {
    if (!isHistoryLoading && messages.length > 0) {
      if (initialLoad.current || !userScrolled) {
        // Используем двойной setTimeout для большей надежности
        setTimeout(() => {
          // Первая попытка
          scrollToEnd(false);
          
          // Вторая попытка через 300ms для надежности
          setTimeout(() => {
            scrollToEnd(false);
            initialLoad.current = false;
          }, 300);
        }, 100);
      }
    }
  }, [messages, isHistoryLoading, scrollToEnd, userScrolled]);
  
  // Функция для обработки скролла пользователем
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // Сохраняем высоту контента для дальнейшего использования
    listContentHeight.current = contentHeight;
    
    // Определяем, находится ли список в самом низу (с небольшим запасом)
    const isAtBottom = layoutHeight + offsetY >= contentHeight - 20; 
    
    if (!isAtBottom) {
      setUserScrolled(true);
    } else {
      setUserScrolled(false);
    }
  };
  
  // Обработчик окончания прокрутки
  const handleScrollEndDrag = () => {
    // Если список близок к концу, автоматически доскроллить до конца
    if (flatListRef.current && !userScrolled) {
      scrollToEnd(true);
    }
  };
  
  // Handler для события изменения размера контента
  const handleContentSizeChange = (width, height) => {
    // Если это не первая загрузка и пользователь не скроллил или недавно был добавлен контент
    if (!initialLoad.current && !userScrolled && height > listContentHeight.current) {
      scrollToEnd(true);
    }
    
    // Обновляем текущую высоту контента
    listContentHeight.current = height;
  };

  // --- Отправка нового сообщения ---
  const handleSend = useCallback(async () => {
    if (inputText.trim() === '' || isLoading || isHistoryLoading) return;

    const userMessageText = inputText.trim();
    const userMessage = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    Keyboard.dismiss();
    
    // Сбрасываем флаг пользовательского скролла при отправке сообщения
    setUserScrolled(false);

    try {
      const responseData = await apiService.post('/assistant/', { message: userMessageText });

      console.log('Ответ от /assistant/:', JSON.stringify(responseData, null, 2));

      if (responseData?.response) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          text: responseData.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        console.error('Ответ от /assistant/ не содержит поля "response":', responseData);
        throw new Error('Некорректный ответ от ИИ-сервиса');
      }
    } catch (err) {
      console.error('Ошибка отправки сообщения или получения ответа:', err);
      let errorMessage = 'Не удалось получить ответ от Системы.';
      if (err.response) {
        console.error('Детали ошибки ответа:', err.response.status, err.response.data);
        errorMessage = `Ошибка ${err.response.status}: ${err.response.data?.detail || 'Сервер вернул ошибку'}`;
      } else if (err.request) {
        console.error('Детали ошибки запроса:', err.request);
        errorMessage = 'Система не отвечает. Проверьте подключение.';
      } else {
        console.error('Другая ошибка:', err.message, err);
        errorMessage = err.message || 'Неизвестная ошибка при коммуникации.';
      }
      setError(errorMessage);

      const errorMessageObj = {
        id: `error-${Date.now()}`,
        text: `[Система] Ошибка: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, isHistoryLoading]);

  // --- Рендер элемента списка (сообщения) ---
  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';
    const isSystemOrError = item.sender === 'ai' && item.text.startsWith('[Система]');
    const isError = isSystemOrError && item.text.toLowerCase().includes('ошибка');

    return (
      <View style={[styles.messageRow, isUser ? styles.userMessageRow : styles.aiMessageRow]}>
        {!isUser && (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name={isError ? "alert-circle-outline" : "hardware-chip-outline"}
              size={18}
              color={isError ? COLORS.error : COLORS.accentBlue}
            />
          </View>
        )}
        <View style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isError ? styles.errorBubble : {}
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText,
            isSystemOrError ? (isError ? styles.errorMessageTextInBubble : styles.systemMessageTextHighlight) : {}
          ]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  // --- Основной JSX компонента ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={styles.container}
      >
        {/* Частицы */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.particle,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3,
                },
              ]}
            />
          ))}
        </View>

        {/* Хедер */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI ASSISTANT</Text>
        </View>

        {/* Отображение загрузки истории или списка сообщений */}
        {isHistoryLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
            <Text style={styles.loadingText}>Загрузка истории диалога...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            ListEmptyComponent={
              !isHistoryLoading ? (
                <View style={styles.emptyChatContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color={COLORS.placeholder} />
                  <Text style={styles.emptyChatText}>История пуста. Начните диалог с Системой.</Text>
                </View>
              ) : null
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onScrollEndDrag={handleScrollEndDrag}
            onContentSizeChange={handleContentSizeChange}
            onLayout={() => {
              if (initialLoad.current && messages.length > 0) {
                // Скроллим после начального рендеринга
                setTimeout(() => scrollToEnd(false), 500);
              }
            }}
            removeClippedSubviews={false}
          />
        )}

        {/* Отображение ошибки под полем ввода */}
        {error && !isHistoryLoading && <Text style={styles.errorText}>{error}</Text>}

        {/* Контейнер ввода (не показывается во время загрузки истории) */}
        {!isHistoryLoading && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
            enabled={!isHistoryLoading}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Введите команду для Системы..."
                placeholderTextColor={COLORS.placeholder}
                multiline
                editable={!isLoading && !isHistoryLoading}
                textAlignVertical="top"
                paddingTop={Platform.OS === 'ios' ? 12 : 10}
                paddingBottom={Platform.OS === 'ios' ? 12 : 10}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isLoading || isHistoryLoading || inputText.trim() === '') && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={isLoading || isHistoryLoading || inputText.trim() === ''}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.sendButtonText} />
                ) : (
                  <Ionicons name="arrow-up" size={24} color={COLORS.sendButtonText} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* Нижняя навигация */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Quests</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pomodoro')}>
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Nutrition')}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Calories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Groups')}>
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Assistant')}>
              <Ionicons name="hardware-chip-outline" size={24} color="#4dabf7" />
              <Text style={styles.navText}>AI Assistant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// --- Стили ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundGradientEnd,
  },
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.particle,
    borderRadius: 50,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.headerBorder,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageListContent: {
    paddingTop: 15,
    paddingBottom: 15,
    flexGrow: 1,
  },
   emptyChatContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     padding: 20,
   },
   emptyChatText: {
     marginTop: 10,
     color: COLORS.placeholder,
     fontSize: 14,
     textAlign: 'center',
   },
  messageRow: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },
  userBubble: {
    backgroundColor: COLORS.userBubbleBackground,
    borderBottomRightRadius: 4,
    borderColor: COLORS.accentBlue,
  },
  aiBubble: {
    backgroundColor: COLORS.aiBubbleBackground,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
      borderColor: COLORS.error,
      backgroundColor: 'rgba(255, 77, 77, 0.1)',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: COLORS.textPrimary,
  },
  aiMessageText: {
    color: COLORS.textSecondary,
  },
  systemMessageTextHighlight: {
    color: COLORS.accentBlue,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  errorMessageTextInBubble: {
      color: COLORS.error,
      fontWeight: '600',
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    paddingHorizontal: 15,
    paddingBottom: 5,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputContainerBorder,
    backgroundColor: COLORS.backgroundGradientEnd,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.accentBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
    marginBottom: Platform.OS === 'android' ? 4 : 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.sendButtonDisabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  // Стили для нижней навигации
  bottomNav: {
    width: '100%',
    paddingBottom: 20,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    color: '#c8d6e5',
    fontSize: 10,
    marginTop: 5,
  },
});

export default AssistantScreen;