import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const COLORS = {
  meBg: 'rgba(77,171,247,0.18)',
  meBorder: '#4dabf7',
  otherBg: 'rgba(26, 30, 60, 0.85)',
  otherBorder: '#3250b4',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  accentBlue: '#4dabf7',
  darkBg: '#080b20',
};

/**
 * Генерирует стабильный цвет на основе строки (например, имени пользователя).
 */
const generateColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 75%, 70%)`;
};

function timeHHMM(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// сортируем сообщения: СТАРЫЕ → НОВЫЕ
function sortMessagesAsc(messages) {
  return [...messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export default function MessageList({
  messages = [],
  currentUserId = null,
  currentUsername = null,
  canModerate = false,
  onDelete,
  // пропсы для пагинации, если понадобятся
  onLoadMore,
  isLoadingMore,
}) {
  const listRef = useRef(null);

  // Гарантируем порядок: СТАРЫЕ → НОВЫЕ
  const orderedMessages = useMemo(
    () => sortMessagesAsc(messages),
    [messages]
  );

  // Автопрокрутка в НИЗ при появлении новых сообщений
  useEffect(() => {
    if (orderedMessages.length === 0) return;
    if (listRef.current) {
      listRef.current.scrollToEnd({ animated: true });
    }
  }, [orderedMessages.length]);

  const renderItem = ({ item }) => {
    const isMe =
      currentUserId != null && String(item.sender) === String(currentUserId);
    const userColor = generateColor(item.sender_username || 'unknown');

    const bubbleStyles = {
      alignSelf: isMe ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
      marginVertical: 2,
      borderWidth: 1,
      backgroundColor: isMe ? COLORS.meBg : COLORS.otherBg,
      borderColor: isMe ? COLORS.meBorder : COLORS.otherBorder,
      borderBottomRightRadius: isMe ? 4 : 14,
      borderBottomLeftRadius: isMe ? 14 : 4,
    };

    const headerLine = !isMe ? (
      <View style={styles.headerContainer}>
        <Text style={[styles.usernameText, { color: userColor }]}>
          {item.sender_username || 'unknown'}
        </Text>
        <Text style={styles.timestampText}>{timeHHMM(item.created_at)}</Text>
      </View>
    ) : null;

    const onLongPress = () => {
      const canDelete = canModerate || isMe;
      if (!canDelete || !onDelete) return;
      Alert.alert(
        'Delete message',
        'Are you sure you want to delete this message?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onDelete(item.id),
          },
        ]
      );
    };

    return (
      <View style={styles.messageContainer}>
        {headerLine}
        <TouchableOpacity activeOpacity={0.8} onLongPress={onLongPress}>
          <View style={bubbleStyles}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 15, lineHeight: 20 }}>
              {item.text}
            </Text>
            {isMe && (
              <Text style={styles.timestampInsideBubble}>
                {timeHHMM(item.created_at)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLoader = () => {
    if (!isLoadingMore) return null;
    return (
      <ActivityIndicator
        style={{ marginVertical: 15 }}
        color={COLORS.accentBlue}
      />
    );
  };

  return (
    <FlatList
      ref={listRef}
      data={orderedMessages}              // СТАРЫЕ → НОВЫЕ
      keyExtractor={(m) => String(m.id)}
      renderItem={renderItem}
      // БЕЗ inverted и БЕЗ column-reverse
      showsVerticalScrollIndicator={false}
      ListFooterComponent={renderLoader}  // лоадер внизу
      // Если захочешь подгружать ещё сообщения при достижении верха/низа —
      // можно вернуть onEndReached:
      // onEndReached={onLoadMore}
      // onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 2,
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.placeholder,
    marginLeft: 8,
  },
  timestampInsideBubble: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
});

