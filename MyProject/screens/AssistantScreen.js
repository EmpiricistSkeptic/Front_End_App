import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
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
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import apiService from '../services/apiService';
import { useTranslation } from 'react-i18next';

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

const systemPrefixRegex = /^\[(System|Система)\]/i;
const SYSTEM_PREFIX = '[System]';

// --- Основной компонент ---
const AssistantScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();

  // Подсказки по возможностям ассистента
  const ASSISTANT_HELP_SECTIONS = useMemo(
    () => [
      {
        id: 'status',
        title: t('assistant.help.status.title'),
        subtitle: t('assistant.help.status.subtitle'),
        examples: [
          t('assistant.help.status.examples.0'),
          t('assistant.help.status.examples.1'),
        ],
      },
      {
        id: 'quests',
        title: t('assistant.help.quests.title'),
        subtitle: t('assistant.help.quests.subtitle'),
        examples: [
          t('assistant.help.quests.examples.0'),
          t('assistant.help.quests.examples.1'),
        ],
      },
      {
        id: 'motivation',
        title: t('assistant.help.motivation.title'),
        subtitle: t('assistant.help.motivation.subtitle'),
        examples: [
          t('assistant.help.motivation.examples.0'),
          t('assistant.help.motivation.examples.1'),
        ],
      },
      {
        id: 'skills',
        title: t('assistant.help.skills.title'),
        subtitle: t('assistant.help.skills.subtitle'),
        examples: [
          t('assistant.help.skills.examples.0'),
          t('assistant.help.skills.examples.1'),
        ],
      },
      {
        id: 'training',
        title: t('assistant.help.training.title'),
        subtitle: t('assistant.help.training.subtitle'),
        examples: [
          t('assistant.help.training.examples.0'),
          t('assistant.help.training.examples.1'),
        ],
      },
      {
        id: 'nutrition',
        title: t('assistant.help.nutrition.title'),
        subtitle: t('assistant.help.nutrition.subtitle'),
        examples: [
          t('assistant.help.nutrition.examples.0'),
          t('assistant.help.nutrition.examples.1'),
        ],
      },
      {
        id: 'media',
        title: t('assistant.help.media.title'),
        subtitle: t('assistant.help.media.subtitle'),
        examples: [
          t('assistant.help.media.examples.0'),
          t('assistant.help.media.examples.1'),
        ],
      },
      {
        id: 'reflection',
        title: t('assistant.help.reflection.title'),
        subtitle: t('assistant.help.reflection.subtitle'),
        examples: [
          t('assistant.help.reflection.examples.0'),
          t('assistant.help.reflection.examples.1'),
        ],
      },
    ],
    [t, i18n.language]
  );

  // --- Состояния ---
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  // пагинация
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // модалка
  const [helpVisible, setHelpVisible] = useState(false);

  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // Частицы фона
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: i,
        left: Math.random() * width,
        top: Math.random() * height,
        width: Math.random() * 4 + 1,
        height: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  const openHelp = useCallback(() => setHelpVisible(true), []);
  const closeHelp = useCallback(() => setHelpVisible(false), []);

  const handleInsertExample = useCallback(example => {
    setInputText(example);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isInitialHistorySystemMessage = useCallback(msgs => {
    if (msgs.length !== 1) return false;
    const m = msgs[0];
    if (m.sender !== 'ai') return false;
    const text = (m.text || '').toLowerCase();
    return (
      text.includes('история переписки пуста') ||
      (text.includes('history') && text.includes('empty'))
    );
  }, []);

  const isChatEmpty =
    !isHistoryLoading &&
    (messages.length === 0 || isInitialHistorySystemMessage(messages));

  // --- Загрузка истории ---
  const loadInitialHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    setError(null);
    try {
      const historyData = await apiService.get('/chat/history/');

      console.log(
        'История получена с бэкенда (raw):',
        JSON.stringify(historyData, null, 2)
      );

      let pageResults = [];
      let next = null;

      if (Array.isArray(historyData)) {
        pageResults = historyData;
      } else if (
        historyData &&
        typeof historyData === 'object' &&
        Array.isArray(historyData.results)
      ) {
        pageResults = historyData.results;
        next = historyData.next || null;
      } else {
        pageResults = [
          {
            id: 'error-format-history',
            text: `${SYSTEM_PREFIX} ${t('assistant.systemMessages.historyFormatError')}`,
            sender: 'ai',
            timestamp: new Date().toISOString(),
          },
        ];
      }

      const newestFirst = [...pageResults].reverse();
      setMessages(newestFirst);
      setNextPageUrl(next);
    } catch (err) {
      console.error('Ошибка загрузки истории чата:', err);
      let errorMessage = t('assistant.errors.loadHistoryDefault');
      if (err.response) {
        errorMessage = t('assistant.errors.loadHistoryWithStatus', {
          status: err.response.status,
          detail:
            err.response.data?.detail ||
            t('assistant.errors.loadHistoryServerFail'),
        });
      }
      setError(errorMessage);
      setMessages([
        {
          id: 'error-load-history',
          text: `${SYSTEM_PREFIX} ${errorMessage}`,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadInitialHistory();
  }, [loadInitialHistory]);

  // --- Дозагрузка истории ---
  const loadMoreHistory = useCallback(async () => {
    if (!nextPageUrl || loadingMore || isHistoryLoading) return;
    setLoadingMore(true);
    setError(null);

    try {
      let responseData;
      if (typeof nextPageUrl === 'string') {
        responseData = await apiService.get(nextPageUrl);
      } else {
        responseData = null;
      }

      let newPageResults = [];
      let newNext = null;

      if (Array.isArray(responseData)) {
        newPageResults = responseData;
      } else if (
        responseData &&
        typeof responseData === 'object' &&
        Array.isArray(responseData.results)
      ) {
        newPageResults = responseData.results;
        newNext = responseData.next || null;
      }

      if (newPageResults.length > 0) {
        const newestFirst = [...newPageResults].reverse();
        setMessages(prev => [...prev, ...newestFirst]);
      }
      setNextPageUrl(newNext);
    } catch (err) {
      console.error('Ошибка дозагрузки истории:', err);
      setError(t('assistant.errors.loadMoreDefault'));
    } finally {
      setLoadingMore(false);
    }
  }, [nextPageUrl, loadingMore, isHistoryLoading, t]);

  // --- Отправка сообщения ---
  const handleSend = useCallback(async () => {
    if (inputText.trim() === '' || isLoading || isHistoryLoading) return;

    const userMessageText = inputText.trim();
    const userMessage = {
      id: `user-${Date.now()}`,
      text: userMessageText,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [userMessage, ...prev]);
    setInputText('');
    setIsLoading(true);
    setError(null);
    // Не скрываем клавиатуру автоматически, чтобы пользователь мог писать дальше
    // Keyboard.dismiss(); 

    try {
      const responseData = await apiService.post('/assistant/', {
        message: userMessageText,
      });

      if (responseData?.response) {
        const aiMessage = {
          id: `ai-${Date.now()}`,
          text: responseData.response,
          sender: 'ai',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [aiMessage, ...prev]);
      } else {
        throw new Error(t('assistant.errors.badAssistantResponse'));
      }
    } catch (err) {
      console.error('Ошибка отправки:', err);
      let errorMessage = t('assistant.errors.sendDefault');
      if (err.response) {
        errorMessage = t('assistant.errors.sendWithStatus', {
          status: err.response.status,
          detail:
            err.response.data?.detail || t('assistant.errors.sendServerFail'),
        });
      }
      setError(errorMessage);
      const errorMessageObj = {
        id: `error-${Date.now()}`,
        text: `${SYSTEM_PREFIX} ${t('assistant.systemMessages.sendErrorPrefix')}: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [errorMessageObj, ...prev]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, isHistoryLoading, t]);

  // --- Рендер элемента сообщения ---
  const renderMessageItem = useCallback(({ item }) => {
    const isUser = item.sender === 'user';
    const isSystemOrError =
      item.sender === 'ai' && systemPrefixRegex.test(item.text || '');
    const isError =
      isSystemOrError && /ошибка|error/i.test((item.text || '').toLowerCase());

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.aiMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name={isError ? 'alert-circle-outline' : 'hardware-chip-outline'}
              size={18}
              color={isError ? COLORS.error : COLORS.accentBlue}
            />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
            isError ? styles.errorBubble : null,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.aiMessageText,
              isSystemOrError
                ? isError
                  ? styles.errorMessageTextInBubble
                  : styles.systemMessageTextHighlight
                : null,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  }, []);

  const renderEmptyState = () => (
    <ScrollView
      style={styles.emptyScroll}
      contentContainerStyle={styles.emptyScrollContent}
    >
      <View style={styles.emptyIntroCard}>
        <Text style={styles.emptyIntroTitle}>{t('assistant.empty.introTitle')}</Text>
        <Text style={styles.emptyIntroSubtitle}>
          {t('assistant.empty.introSubtitle')}
        </Text>
      </View>
      {ASSISTANT_HELP_SECTIONS.map(section => (
        <View key={section.id} style={styles.helpSectionCard}>
          <Text style={styles.helpSectionTitle}>{section.title}</Text>
          <Text style={styles.helpSectionSubtitle}>{section.subtitle}</Text>
          <View style={styles.helpExamplesContainer}>
            {section.examples.map(example => (
              <TouchableOpacity
                key={example}
                style={styles.exampleChip}
                onPress={() => handleInsertExample(example)}
              >
                <Text style={styles.exampleChipText}>{example}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // Высота хедера для смещения клавиатуры (примерно 60 + статус бар)
  const headerHeight = 60 + (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={styles.container}
      >
        {/* Фон: Частицы */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map(p => (
            <View
              key={p.key}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.width,
                  height: p.height,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Хедер (фиксированный) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('assistant.header')}</Text>
        </View>

        {/* Панель помощи */}
        {!isHistoryLoading && (
          <View style={styles.helpBar}>
            <TouchableOpacity style={styles.helpButton} onPress={openHelp}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={COLORS.accentBlue}
                style={{ marginRight: 10 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.helpButtonTitle}>
                  {t('assistant.protocols.buttonTitle')}
                </Text>
                <Text style={styles.helpButtonSubtitle}>
                  {t('assistant.protocols.buttonSubtitle')}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Основной контент внутри KeyboardAvoidingView */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
        >
          {isHistoryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
              <Text style={styles.loadingText}>{t('assistant.loadingHistory')}</Text>
            </View>
          ) : isChatEmpty ? (
            renderEmptyState()
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={item => item.id.toString()}
              style={styles.messageList}
              contentContainerStyle={styles.messageListContent}
              ListEmptyComponent={
                <View style={styles.emptyChatContainer}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color={COLORS.placeholder}
                  />
                  <Text style={styles.emptyChatText}>
                    {t('assistant.emptyHistoryShort')}
                  </Text>
                </View>
              }
              inverted
              onEndReached={loadMoreHistory}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={COLORS.accentBlue} />
                  </View>
                ) : null
              }
            />
          )}

          {/* Ошибка */}
          {error && !isHistoryLoading && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* Поле ввода с защитным отступом снизу для навигации */}
          {!isHistoryLoading && (
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={t('assistant.inputPlaceholder')}
                placeholderTextColor={COLORS.placeholder}
                multiline
                editable={!isLoading && !isHistoryLoading}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isLoading ||
                    isHistoryLoading ||
                    inputText.trim() === '') &&
                    styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={
                  isLoading || isHistoryLoading || inputText.trim() === ''
                }
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={COLORS.sendButtonText} />
                ) : (
                  <Ionicons
                    name="arrow-up"
                    size={24}
                    color={COLORS.sendButtonText}
                  />
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>

        {/* Модалка протоколов */}
        <Modal
          visible={helpVisible}
          transparent
          animationType="fade"
          onRequestClose={closeHelp}
        >
          <View style={styles.helpModalOverlay}>
            <View style={styles.helpModalContent}>
              <View style={styles.helpModalHeader}>
                <Text style={styles.helpModalTitle}>
                  {t('assistant.protocols.modalTitle')}
                </Text>
                <TouchableOpacity onPress={closeHelp}>
                  <Ionicons name="close" size={22} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helpModalIntro}>
                {t('assistant.protocols.modalIntro')}
              </Text>
              <ScrollView
                style={{ maxHeight: height * 0.6 }}
                contentContainerStyle={{ paddingBottom: 10 }}
              >
                {ASSISTANT_HELP_SECTIONS.map(section => (
                  <View key={section.id} style={styles.helpSectionCardModal}>
                    <Text style={styles.helpSectionTitle}>{section.title}</Text>
                    <Text style={styles.helpSectionSubtitle}>
                      {section.subtitle}
                    </Text>
                    <View style={styles.helpExamplesContainer}>
                      {section.examples.map(example => (
                        <TouchableOpacity
                          key={example}
                          style={styles.exampleChip}
                          onPress={() => {
                            handleInsertExample(example);
                            closeHelp();
                          }}
                        >
                          <Text style={styles.exampleChipText}>{example}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
};

// --- Стили ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundGradientStart, // Цвет верха
  },
  container: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width,
    height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.particle,
    borderRadius: 50,
  },
  header: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.headerBorder,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  helpBar: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 4,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.85)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.inputContainerBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  helpButtonTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  helpButtonSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
    paddingTop: 8,
    paddingBottom: 20, // Немного отступа для последнего сообщения
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
    paddingTop: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputContainerBorder,
    backgroundColor: COLORS.backgroundGradientEnd,
    // ИСПРАВЛЕНИЕ: Добавляем большой отступ снизу, чтобы поднять инпут над нижней навигацией
    paddingBottom: Platform.OS === 'ios' ? 90 : 70, 
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
  emptyScroll: {
    flex: 1,
    paddingHorizontal: 15,
  },
  emptyScrollContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  emptyIntroCard: {
    backgroundColor: 'rgba(16, 20, 45, 0.9)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    marginBottom: 12,
  },
  emptyIntroTitle: {
    color: COLORS.accentBlue,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  emptyIntroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
  },
  helpSectionCard: {
    backgroundColor: 'rgba(16, 20, 45, 0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.inputContainerBorder,
    marginBottom: 10,
  },
  helpSectionCardModal: {
    backgroundColor: 'rgba(16, 20, 45, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.inputContainerBorder,
    marginBottom: 10,
  },
  helpSectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  helpSectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
    marginBottom: 8,
  },
  helpExamplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  exampleChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accentBlue,
    backgroundColor: 'rgba(16, 24, 48, 0.9)',
    marginRight: 4,
    marginBottom: 4,
  },
  exampleChipText: {
    color: COLORS.textSecondary,
    fontSize: 11.5,
  },
  helpModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  helpModalContent: {
    width: '100%',
    maxHeight: height * 0.75,
    backgroundColor: '#121539',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    padding: 14,
  },
  helpModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  helpModalTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  helpModalIntro: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    marginBottom: 8,
  },
});

export default AssistantScreen;
