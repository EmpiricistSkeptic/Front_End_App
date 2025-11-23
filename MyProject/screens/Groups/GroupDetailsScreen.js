import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  getGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  deleteMessage,
} from './api/groupsApi';
import MessageList from './components/MessageList';
import MessageInput from './components/MessageInput';
import useGroupChat from './hooks/useGroupChat';
import GroupMembersList from './components/GroupMembersList';

const { width, height } = Dimensions.get('window');

// Высота контента хедера
const HEADER_CONTENT_HEIGHT = 50;

const COLORS = {
  backgroundGradientStart: '#121539',
  backgroundGradientEnd: '#080b20',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  particle: '#4dabf7',
  headerBorder: 'rgba(77, 171, 247, 0.3)',
};

export default function GroupDetailsScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { groupId, preGroup } = route.params || {};
  const rnRoute = useRoute();
  
  // Хук для безопасных зон (челка, нижняя полоска)
  const insets = useSafeAreaInsets();

  const [group, setGroup] = useState(preGroup || null);
  const [loading, setLoading] = useState(!preGroup);
  const [authLoading, setAuthLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [auth, setAuth] = useState({ userId: null, username: null });
  const [showMembers, setShowMembers] = useState(false);

  // Частицы
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

  // Загрузка auth
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('userId');
        const uname = await AsyncStorage.getItem('username');
        setAuth({ userId: uid ? Number(uid) : null, username: uname || null });
      } catch (e) {
        console.error('Failed to load auth', e);
        setAuth({ userId: null, username: null });
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  // Загрузка группы
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const g = await getGroup(groupId);
        setGroup(g);
      } catch (e) {
        Alert.alert(t('groups.details.alerts.errorTitle'), t('groups.details.alerts.groupNotFound'));
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    if (!preGroup) fetchGroup();
  }, [groupId, preGroup, navigation, t]);

  // Обновление данных
  useEffect(() => {
    const updated = rnRoute.params?.preGroup;
    const refreshMark = rnRoute.params?.__refreshAt;
    if (updated && refreshMark) {
      setGroup(updated);
    }
  }, [rnRoute.params?.__refreshAt, rnRoute.params?.preGroup]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const g = await getGroup(groupId);
          if (isActive) setGroup(g);
        } catch {}
      })();
      return () => {
        isActive = false;
      };
    }, [groupId])
  );

  const canSeeChat = group?.is_member === true || group?.owner === auth.userId;
  const canModerate = group?.is_owner === true || group?.is_admin === true;
  const canEditGroup = canModerate;

  const chat = useGroupChat(groupId, { enabled: canSeeChat });

  // --- Handlers ---
  const handleJoin = async () => {
    try {
      await joinGroup(groupId);
      setGroup((g) => ({
        ...g,
        is_member: true,
        members_count: (g?.members_count || 0) + 1,
      }));
    } catch (e) {
      Alert.alert(t('groups.details.alerts.errorTitle'), t('groups.details.alerts.joinFail'));
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId);
      navigation.goBack();
    } catch (e) {
      Alert.alert(t('groups.details.alerts.errorTitle'), t('groups.details.alerts.leaveFail'));
    }
  };

  const handleDeleteGroup = async () => {
    Alert.alert(
      t('groups.details.alerts.deleteConfirmTitle'),
      t('groups.details.alerts.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('groups.details.buttons.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGroup(groupId);
              navigation.goBack();
            } catch (e) {
              Alert.alert(t('groups.details.alerts.errorTitle'), t('groups.details.alerts.deleteFail'));
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EditGroup', { groupId, preGroup: group });
  };

  const handleSend = async (text) => {
    const msg = String(text || '').trim();
    if (!msg) return;
    setSending(true);
    try {
      const ok = chat.sendMessage(msg);
      if (!ok) Alert.alert('Offline', 'Message not sent');
    } catch (e) {
      Alert.alert('Error', 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(groupId, messageId);
      chat.deleteLocal(messageId);
    } catch (e) {
      Alert.alert('Error', 'Failed to delete');
    }
  };

  const handleMemberPress = useCallback((userId) => {
    // Используем push, чтобы профиль открылся поверх текущего экрана
    navigation.push('Profile', { userId: userId });
  }, [navigation]);

  // Вычисляем полную высоту хедера для отступа
  const totalHeaderHeight = HEADER_CONTENT_HEIGHT + insets.top;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* Частицы */}
        <View style={styles.particlesLayer} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.key}
              style={{
                position: 'absolute',
                left: p.left,
                top: p.top,
                width: p.width,
                height: p.height,
                opacity: p.opacity,
                backgroundColor: COLORS.particle,
                borderRadius: 50,
              }}
            />
          ))}
        </View>

        {/* Хедер (вне KeyboardAvoidingView, чтобы он стоял на месте) */}
        <View style={[styles.header, { height: totalHeaderHeight, paddingTop: insets.top }]}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={26} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {group?.name || t('groups.details.fallbackTitle')}
            </Text>
          </View>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {canEditGroup && (
                <TouchableOpacity onPress={handleEdit} style={{ marginRight: 16 }}>
                  <Ionicons name="pencil" size={21} color={COLORS.accentBlue} />
                </TouchableOpacity>
              )}
              {group?.is_owner ? (
                <TouchableOpacity onPress={handleDeleteGroup}>
                  <Text style={styles.deleteText}>{t('groups.details.buttons.delete')}</Text>
                </TouchableOpacity>
              ) : group?.is_member ? (
                <TouchableOpacity onPress={handleLeave}>
                  <Text style={styles.leaveText}>{t('groups.details.buttons.leave')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* 
          ОСНОВНОЕ ИСПРАВЛЕНИЕ:
          1. behavior: iOS = 'padding', Android = 'height'.
             'height' на Android сжимает View, когда клава выезжает, и поле остается внизу сжатой области.
          2. keyboardVerticalOffset: равен высоте хедера, чтобы контент не уезжал под него.
        */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? totalHeaderHeight : 0}
        >
          {loading || authLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
              <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
                {t('common.loading')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.content}>
                <View style={styles.bylineRow}>
                  <Text style={styles.bylineText} numberOfLines={1}>
                    {t('groups.details.by', { username: group?.owner_username })}
                  </Text>
                  <TouchableOpacity
                    style={styles.membersChip}
                    onPress={() => setShowMembers((prev) => !prev)}
                  >
                    <Ionicons name="people" size={16} color={COLORS.accentBlue} style={{ marginRight: 4 }} />
                    <Text style={styles.membersChipText}>
                      {t('groups.details.members', { count: group?.members_count ?? 0 })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showMembers ? (
                  <GroupMembersList groupId={groupId} navigation={navigation} onMemberPress={handleMemberPress}/>
                ) : canSeeChat ? (
                  chat.connectionState === 'connecting' && chat.messages.length === 0 ? (
                    <View style={styles.chatLoaderContainer}>
                      <ActivityIndicator size="large" color={COLORS.accentBlue} />
                    </View>
                  ) : (
                    <MessageList
                      messages={chat.messages}
                      currentUserId={auth.userId}
                      currentUsername={auth.username}
                      canModerate={canModerate}
                      onDelete={handleDeleteMessage}
                    />
                  )
                ) : (
                  <View style={styles.joinCard}>
                    <Text style={styles.joinCardTitle}>{t('groups.details.joinCard.title')}</Text>
                    <TouchableOpacity onPress={handleJoin} style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>{t('groups.details.buttons.join')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {!showMembers && canSeeChat && (
                // Отступ снизу для iPhone X и выше, но только если это iOS.
                // На Android поведение 'height' само прижмет к низу экрана, поэтому лишний паддинг не нужен (или минимальный).
                <View 
                  style={[
                    styles.inputWrapper, 
                    { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 10 }
                  ]}
                >
                  <MessageInput onSend={handleSend} sending={sending} />
                </View>
              )}
            </>
          )}
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundGradientEnd,
  },
  particlesLayer: {
    position: 'absolute',
    width,
    height,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.headerBorder,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerSide: {
    width: 90,
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  deleteText: {
    color: '#ff7675',
    fontWeight: '800',
    fontSize: 16,
  },
  leaveText: {
    color: COLORS.accentBlue,
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  bylineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bylineText: {
    flex: 1,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  membersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    backgroundColor: 'rgba(16,20,45,0.8)',
  },
  membersChipText: {
    color: COLORS.accentBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  chatLoaderContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  joinCard: {
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 12,
    padding: 12,
  },
  joinCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 10,
  },
  joinButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: COLORS.accentBlue,
  },
  joinButtonText: {
    color: '#080b20',
    fontWeight: '700',
  },
  inputWrapper: {
    backgroundColor: COLORS.backgroundGradientEnd,
    paddingTop: 5,
  },
});