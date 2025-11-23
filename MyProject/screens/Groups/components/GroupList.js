// src/screens/Groups/components/GroupList.js
import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  ActivityIndicator,
} from 'react-native';
import GroupCard from './GroupCard';
import { useTranslation } from 'react-i18next';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  borderBlue: '#3250b4',
  cardBg: 'rgba(16, 20, 45, 0.75)',
  accentBlue: '#4dabf7',
  divider: 'rgba(77,171,247,0.2)',
};

function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderBlue,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.divider,
        }}
      >
        <View
          style={{
            height: 16,
            width: '60%',
            backgroundColor: 'rgba(200, 214, 229, 0.12)',
            borderRadius: 6,
          }}
        />
        <View
          style={{
            height: 12,
            width: '85%',
            backgroundColor: 'rgba(200, 214, 229, 0.08)',
            borderRadius: 6,
            marginTop: 8,
          }}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            height: 12,
            width: 100,
            backgroundColor: 'rgba(200, 214, 229, 0.08)',
            borderRadius: 6,
          }}
        />
        <View
          style={{
            height: 12,
            width: 140,
            backgroundColor: 'rgba(200, 214, 229, 0.08)',
            borderRadius: 6,
          }}
        />
        <View style={{ flex: 1 }} />
        <View
          style={{
            height: 18,
            width: 70,
            backgroundColor: 'rgba(200, 214, 229, 0.08)',
            borderRadius: 10,
          }}
        />
      </View>

      <View
        style={{
          paddingHorizontal: 14,
          paddingBottom: 12,
          paddingTop: 4,
          flexDirection: 'row',
          gap: 10,
        }}
      >
        <View
          style={{
            height: 36,
            width: 90,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(77,171,247,0.35)',
          }}
        />
        <View
          style={{
            height: 36,
            width: 90,
            borderRadius: 22,
            backgroundColor: 'rgba(77,171,247,0.25)',
          }}
        />
      </View>
    </View>
  );
}

export default function GroupList({
  data = [],
  loading = false,
  onRefresh,
  onPressOpen,
  onPressJoin,
  onPressLeave,
  onPressDelete,
}) {
  const { t } = useTranslation();

  const renderItem = ({ item }) => (
    <GroupCard
      item={item}
      onPressOpen={onPressOpen}
      onPressJoin={onPressJoin}
      onPressLeave={onPressLeave}
      onPressDelete={onPressDelete}
    />
  );

  const keyExtractor = (item, idx) =>
    item?.id != null ? String(item.id) : `idx-${idx}`;

  const ItemSeparator = () => (
    <View style={{ height: 2, backgroundColor: 'transparent' }} />
  );

  const ListEmpty = !loading ? (
    <View
      style={{
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
        {t('groups.list.empty.title')}
      </Text>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
        {t('groups.list.empty.subtitle')}
      </Text>
    </View>
  ) : null;

  const ListFooter = loading ? (
    <View style={{ paddingVertical: 10, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={COLORS.accentBlue} />
    </View>
  ) : (
    <View style={{ height: 10 }} />
  );

  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={ListEmpty}
      ListFooterComponent={ListFooter}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={COLORS.accentBlue}
        />
      }
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: 24,
      }}
      ListHeaderComponent={
        loading && (!data || data.length === 0) ? (
          <View style={{ paddingTop: 8 }}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null
      }
    />
  );
}
