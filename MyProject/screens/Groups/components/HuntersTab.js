// src/screens/groups/components/HuntersTab.js

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import apiService from '../../../services/apiService';
import { useTranslation } from 'react-i18next';

const COLORS = {
  cardBg: 'rgba(16, 20, 45, 0.9)',
  cardBorder: 'rgba(77, 171, 247, 0.35)',
  cardShadow: '#4dabf7',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  accentBlue: '#4dabf7',
  mutedBlue: '#5f7191',
  levelBadgeBg: '#ff9500',
};

function getRankFromLevel(level) {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 30) return 'C';
  if (level < 40) return 'B';
  if (level < 50) return 'A';
  return 'S';
}

export default function HuntersTab({ search, navigation, refreshKey }) {
  const { t } = useTranslation();

  const [hunters, setHunters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState(null);

  // 'level_desc' | 'level_asc' | 'points_desc' | 'points_asc'
  const [sortMode, setSortMode] = useState('level_desc');

  // --- Load from backend, sorting only on server ---
  useEffect(() => {
    let isActive = true;

    const loadHunters = async () => {
      setLoading(true);
      setErrorText(null);
      try {
        let orderingParam = '-level'; // default: top by level

        if (sortMode === 'level_asc') orderingParam = 'level';
        if (sortMode === 'points_desc') orderingParam = '-points';
        if (sortMode === 'points_asc') orderingParam = 'points';

        const response = await apiService.get(
          `profile/?ordering=${orderingParam}`
        );

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.results)
          ? response.results
          : [];

        if (isActive) {
          setHunters(data);
        }
      } catch (err) {
        console.error('Error loading hunters:', err);
        if (isActive) {
          setErrorText(t('groups.huntersTab.errors.loadFailed'));
          setHunters([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadHunters();
    return () => {
      isActive = false;
    };
  }, [refreshKey, sortMode, t]);

  // filter by search only, no client sorting
  const filteredHunters = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hunters;
    return hunters.filter((h) =>
      (h.username || '').toLowerCase().includes(q)
    );
  }, [hunters, search]);

  const renderHunterItem = ({ item }) => {
    const level = item.level ?? 1;
    const points = item.points ?? 0;
    const rank = getRankFromLevel(level);

    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate('Profile', { userId: item.id })
        }
        style={{
          flexDirection: 'row',
          padding: 14,
          marginBottom: 10,
          borderRadius: 14,
          backgroundColor: COLORS.cardBg,
          borderWidth: 1,
          borderColor: COLORS.cardBorder,
          shadowColor: COLORS.cardShadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
        }}
        activeOpacity={0.9}
      >
        {/* Avatar + level */}
        <View style={{ marginRight: 12 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: 'rgba(28, 36, 84, 0.9)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: COLORS.accentBlue,
              overflow: 'hidden',
            }}
          >
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontWeight: 'bold',
                  fontSize: 24,
                }}
              >
                {item.username
                  ? item.username.charAt(0).toUpperCase()
                  : '?'}
              </Text>
            )}
          </View>

          {/* Level badge */}
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: COLORS.levelBadgeBg,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#080b20',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 12,
              }}
            >
              {level}
            </Text>
          </View>
        </View>

        {/* Main info */}
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                color: COLORS.textPrimary,
                fontSize: 16,
                fontWeight: '700',
                marginRight: 8,
              }}
              numberOfLines={1}
            >
              {item.username}
            </Text>
            <View
              style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: 'rgba(77,171,247,0.15)',
                borderWidth: 1,
                borderColor: COLORS.cardBorder,
              }}
            >
              <Text
                style={{
                  color: COLORS.accentBlue,
                  fontSize: 10,
                  fontWeight: '700',
                }}
              >
                {t('groups.huntersTab.labels.rank', { rank })}
              </Text>
            </View>
          </View>

          {/* Combat Power */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <MaterialCommunityIcons
              name="sword-cross"
              size={16}
              color={COLORS.accentBlue}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: COLORS.textSecondary,
                fontSize: 12,
              }}
            >
              {t('groups.huntersTab.labels.combatPower', { points })}
            </Text>
          </View>

          {/* Elite hint */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="flame"
              size={14}
              color={COLORS.accentBlue}
              style={{ marginRight: 4 }}
            />
            <Text
              style={{
                color: COLORS.mutedBlue,
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {t('groups.huntersTab.labels.eliteHint')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- Loading / error / empty states ---

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
        <Text
          style={{
            color: COLORS.textSecondary,
            marginTop: 12,
          }}
        >
          {t('groups.huntersTab.loading')}
        </Text>
      </View>
    );
  }

  if (errorText) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={40}
          color={COLORS.mutedBlue}
        />
        <Text
          style={{
            color: COLORS.textSecondary,
            marginTop: 10,
          }}
        >
          {errorText}
        </Text>
      </View>
    );
  }

  if (filteredHunters.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 30,
        }}
      >
        <MaterialCommunityIcons
          name="account-search-outline"
          size={50}
          color={COLORS.mutedBlue}
        />
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: 16,
            fontWeight: '600',
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          {t('groups.huntersTab.empty.title')}
        </Text>
        <Text
          style={{
            color: COLORS.textSecondary,
            fontSize: 13,
            marginTop: 6,
            textAlign: 'center',
          }}
        >
          {t('groups.huntersTab.empty.subtitle')}
        </Text>
      </View>
    );
  }

  // --- Main render with sort buttons ---

  const levelArrow =
    sortMode === 'level_desc'
      ? t('groups.huntersTab.sort.desc')
      : sortMode === 'level_asc'
      ? t('groups.huntersTab.sort.asc')
      : '';

  const powerArrow =
    sortMode === 'points_desc'
      ? t('groups.huntersTab.sort.desc')
      : sortMode === 'points_asc'
      ? t('groups.huntersTab.sort.asc')
      : '';

  return (
    <View style={{ flex: 1 }}>
      {/* Sort panel */}
      <View
        style={{
          flexDirection: 'row',
          marginBottom: 8,
        }}
      >
        {/* Sort by Level */}
        <TouchableOpacity
          onPress={() =>
            setSortMode((prev) =>
              prev === 'level_desc' ? 'level_asc' : 'level_desc'
            )
          }
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(77,171,247,0.4)',
            backgroundColor: 'rgba(16,20,45,0.9)',
            marginRight: 8,
          }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {t('groups.huntersTab.sort.level')} {levelArrow}
          </Text>
        </TouchableOpacity>

        {/* Sort by Power */}
        <TouchableOpacity
          onPress={() =>
            setSortMode((prev) =>
              prev === 'points_desc' ? 'points_asc' : 'points_desc'
            )
          }
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(77,171,247,0.4)',
            backgroundColor: 'rgba(16,20,45,0.9)',
          }}
        >
          <Text
            style={{
              color: COLORS.textSecondary,
              fontSize: 12,
              fontWeight: '600',
            }}
          >
            {t('groups.huntersTab.sort.power')} {powerArrow}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredHunters}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderHunterItem}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}


