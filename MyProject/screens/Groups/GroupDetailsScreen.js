import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';

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

const { width, height } = Dimensions.get('window');

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
  const { groupId, preGroup } = route.params || {};
  const rnRoute = useRoute();
  const nav = useNavigation();

  const [group, setGroup] = useState(preGroup || null);
  const [loading, setLoading] = useState(!preGroup);
  const [authLoading, setAuthLoading] = useState(true); // Для отслеживания загрузки auth данных
  const [sending, setSending] = useState(false);
  const [auth, setAuth] = useState({ userId: null, username: null });

  // 🔹 Мемоизированные частицы — генерируются один раз, не прыгают
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

  // поднимем userId/username из AsyncStorage
  useEffect(() => {
    (async () => {
      try {
        const uid = await AsyncStorage.getItem('userId');
        const uname = await AsyncStorage.getItem('username');
        setAuth({ userId: uid ? Number(uid) : null, username: uname || null });
      } catch (e) {
        console.error('Failed to load auth data from AsyncStorage', e);
        setAuth({ userId: null, username: null });
      } finally {
        setAuthLoading(false); // Завершаем загрузку auth в любом случае
      }
    })();
  }, []);

  // первичная загрузка, если нет preGroup
  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const g = await getGroup(groupId);
        setGroup(g);
      } catch (e) {
        Alert.alert('Error', 'Group not found');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    if (!preGroup) fetchGroup();
  }, [groupId]);

  // принять обновлённые параметры после редактирования
  useEffect(() => {
    const updated = rnRoute.params?.preGroup;
    const refreshMark = rnRoute.params?.__refreshAt;
    if (updated && refreshMark) {
      setGroup(updated);
    }
  }, [rnRoute.params?.__refreshAt]);

  // подтягивать актуальные данные при фокусе (чтобы не видеть «старое имя» и т.п.)
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

  // Можно ли видеть чат (участник или владелец)
  const canSeeChat = group?.is_member === true || group?.owner === auth.userId;

  // Подключаем живой чат по вебсокету, когда можно видеть чат
  const chat = useGroupChat(groupId, { enabled: canSeeChat });

  // === handlers ===
  const handleJoin = async () => {
    try {
      await joinGroup(groupId);
      setGroup((g) => ({
        ...g,
        is_member: true,
        members_count: (g?.members_count || 0) + 1,
      }));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGroup(groupId);
      Alert.alert('Left', 'You left the group');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to leave');
    }
  };

  const handleDeleteGroup = async () => {
    Alert.alert('Delete group', 'This action cannot be undone. Delete the group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGroup(groupId);
            Alert.alert('Deleted', 'Group has been deleted');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete group');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    navigation.navigate('EditGroup', { groupId, preGroup: group });
  };

  const handleSend = async (text) => {
    const t = String(text || '').trim();
    if (!t) return;
    setSending(true);
    try {
      const ok = chat.sendMessage(t);
      if (!ok) {
        Alert.alert('Offline', 'Connection lost, please try again in a moment.');
      }
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
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to delete message');
    }
  };

  const canModerate = group?.is_owner === true || group?.is_admin === true;
  const canEditGroup = canModerate;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* 🔹 Частицы — фиксированные, не мешают тачам */}
        <View
          style={{ position: 'absolute', width, height }}
          pointerEvents="none"
        >
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

        {/* --- ХЕДЕР --- */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons
                name="chevron-back"
                size={26}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {group?.name || 'GROUP'}
            </Text>
          </View>
          <View style={[styles.headerSide, { alignItems: 'flex-end' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {canEditGroup && (
                <TouchableOpacity
                  onPress={handleEdit}
                  style={{ marginRight: 16 }}
                >
                  <Ionicons
                    name="pencil"
                    size={21}
                    color={COLORS.accentBlue}
                  />
                </TouchableOpacity>
              )}
              {group?.is_owner ? (
                <TouchableOpacity onPress={handleDeleteGroup}>
                  <Text
                    style={{
                      color: '#ff7675',
                      fontWeight: '800',
                      fontSize: 16,
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              ) : group?.is_member ? (
                <TouchableOpacity onPress={handleLeave}>
                  <Text
                    style={{
                      color: COLORS.accentBlue,
                      fontWeight: '700',
                    }}
                  >
                    Leave
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
        {/* --- КОНЕЦ ХЕДЕРА --- */}

        {loading || authLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
            <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>
              Loading...
            </Text>
          </View>
        ) : (
          <>
            <View
              style={{
                flex: 1,
                paddingHorizontal: 15,
                paddingTop: 10,
                paddingBottom: 10,
              }}
            >
              <Text
                style={{ color: COLORS.textSecondary, marginBottom: 8 }}
              >
                by {group?.owner_username} • {group?.members_count} members
              </Text>

              {canSeeChat ? (
                chat.connectionState === 'connecting' &&
                chat.messages.length === 0 ? (
                  <View style={{ alignItems: 'center', marginTop: 20 }}>
                    <ActivityIndicator
                      size="large"
                      color={COLORS.accentBlue}
                    />
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
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.borderBlue,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.textPrimary,
                      fontSize: 15,
                      marginBottom: 10,
                    }}
                  >
                    Join this public group to view and send messages.
                  </Text>
                  <TouchableOpacity
                    onPress={handleJoin}
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 22,
                      backgroundColor: COLORS.accentBlue,
                    }}
                  >
                    <Text
                      style={{
                        color: '#080b20',
                        fontWeight: '700',
                      }}
                    >
                      Join
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {canSeeChat && (
              <MessageInput onSend={handleSend} sending={sending} />
            )}
          </>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

// Добавляем StyleSheet для чистоты и производительности
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.backgroundGradientEnd,
  },
  header: {
    height: 70,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.headerBorder,
  },
  headerSide: {
    width: 90, // Фиксированная ширина для боковых колонок
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1, // Занимает всё оставшееся пространство
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
