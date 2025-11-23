// src/screens/Nutrition/components/HistorySection.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  inputBg: 'rgba(16, 20, 45, 0.9)',
  cardBg: 'rgba(26, 30, 60, 0.85)',
};

export default function HistorySection({ period, onChangePeriod, data, loading }) {
  const { t } = useTranslation();

  return (
    <View
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.borderBlue,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: 16,
            fontWeight: '600',
          }}
        >
          {t('nutrition.history.title')}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.borderBlue,
            overflow: 'hidden',
          }}
        >
          {['week', 'month'].map((p) => {
            const active = p === period;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => onChangePeriod(p)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: active ? COLORS.accentBlue : 'transparent',
                }}
              >
                <Text
                  style={{
                    color: active ? '#080b20' : COLORS.textSecondary,
                    fontSize: 11,
                    fontWeight: active ? '600' : '400',
                  }}
                >
                  {t(`nutrition.history.periods.${p}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 8, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={COLORS.accentBlue} />
        </View>
      ) : data?.length ? (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 4 }}
          data={data}
          keyExtractor={(item, idx) => `${item.date}-${idx}`}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                marginRight: 8,
                borderRadius: 10,
                backgroundColor: COLORS.inputBg,
                borderWidth: 1,
                borderColor: COLORS.borderBlue,
              }}
            >
              <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
                {item.date}
              </Text>
              <Text
                style={{
                  color: COLORS.textPrimary,
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 2,
                }}
              >
                {Math.round(item.total_calories || 0)} {t('nutrition.units.kcal')}
              </Text>
            </View>
          )}
        />
      ) : (
        <Text style={{ color: COLORS.placeholder, fontSize: 13 }}>
          {t('nutrition.history.empty')}
        </Text>
      )}
    </View>
  );
}
