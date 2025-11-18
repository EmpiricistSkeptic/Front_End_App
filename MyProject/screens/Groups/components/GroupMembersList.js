// screens/groups/components/GroupMembersList.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getGroupMembers } from '../api/groupsApi';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  cardBg: 'rgba(16, 20, 45, 0.9)',
};

function getRankFromLevel(level) {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 30) return 'C';
  if (level < 40) return 'B';
  if (level < 50) return 'A';
  return 'S';
}

export default function GroupMembersList({ groupId, navigation }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!groupId) return;
      setLoading(true);
      setErrorText(null);
      try {
        const resp = await getGroupMembers(groupId);
        const data = Array.isArray(resp)
          ? resp
          : Array.isArray(resp?.results)
          ? resp.results
          : [];
        if (isActive) {
          setMembers(data);
        }
      } catch (e) {
        console.error('Failed to load group members', e);
        if (isActive) {
          setErrorText(e?.response?.data?.detail || 'Failed to load members');
          setMembers([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, [groupId]);

  const renderItem = ({ item }) => {
    const level = item.level ?? 1;
    const points = item.points ?? 0;
    const rank = getRankFromLevel(level);

    let roleLabel = 'Member';
    if (item.is_owner) roleLabel = 'Owner';
    else if (item.is_admin) roleLabel = 'Officer';

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Profile', { userId: item.id })}
        style={styles.memberCard}
      >
        {/* Аватар + уровень */}
        <View style={styles.memberAvatarWrap}>
          <View style={styles.memberAvatarInner}>
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={styles.memberAvatarImage}
              />
            ) : (
              <Text style={styles.memberAvatarLetter}>
                {item.username ? item.username.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View style={styles.memberLevelBadge}>
            <Text style={styles.memberLevelBadgeText}>{level}</Text>
          </View>
        </View>

        {/* Информация */}
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item.username}
            </Text>
            <View style={styles.memberRankPill}>
              <Text style={styles.memberRankText}>RANK {rank}</Text>
            </View>
          </View>

          <View style={styles.memberMetaRow}>
            <MaterialCommunityIcons
              name="sword-cross"
              size={16}
              color={COLORS.accentBlue}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.memberPointsText}>
              CP:{' '}
              <Text style={{ color: COLORS.accentBlue, fontWeight: '700' }}>
                {points}
              </Text>
            </Text>
          </View>

          <View style={styles.memberMetaRow}>
            <Ionicons
              name="flame"
              size={14}
              color={COLORS.accentBlue}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.memberRoleText}>{roleLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerWrapper}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
        <Text style={styles.centerText}>Loading hunters...</Text>
      </View>
    );
  }

  if (errorText) {
    return (
      <View style={styles.centerWrapper}>
        <Text style={styles.centerText}>{errorText}</Text>
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.centerWrapper}>
        <Text style={styles.centerText}>No hunters in this group yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  memberCard: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  memberAvatarWrap: {
    marginRight: 12,
  },
  memberAvatarInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(28, 36, 84, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.accentBlue,
    overflow: 'hidden',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberAvatarLetter: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 24,
  },
  memberLevelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#080b20',
  },
  memberLevelBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  memberRankPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(77,171,247,0.15)',
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },
  memberRankText: {
    color: COLORS.accentBlue,
    fontSize: 10,
    fontWeight: '700',
  },
  memberMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  memberPointsText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  memberRoleText: {
    color: COLORS.placeholder,
    fontSize: 11,
  },
});
