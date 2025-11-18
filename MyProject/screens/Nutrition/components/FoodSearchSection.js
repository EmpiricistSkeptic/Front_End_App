// src/screens/Nutrition/components/FoodSearchSection.js
import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  inputBg: 'rgba(16, 20, 45, 0.9)',
  btnText: '#080b20',
  disabled: '#5f7191',
  cardBg: 'rgba(16, 20, 45, 0.75)',
  dropdownBg: 'rgba(16, 20, 45, 0.98)',
};

export default function FoodSearchSection({
  query, setQuery,
  results, setResults,
  searching,
  weight, setWeight,
  onSelectFood,
  onAdd,
  adding,
  disabledAdd,
  selectedFood,
  onClearSelected,
  onForceCloseDropdown, // опционально из родителя
}) {
  const isDisabled = adding || disabledAdd || !weight.trim();

  const renderResultItem = (item) => (
    <TouchableOpacity
      key={item.fdc_id}
      onPress={() => {
        onSelectFood(item);
        Keyboard.dismiss();
      }}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(50, 80, 180, 0.35)',
      }}
    >
      <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>
        {item.description}
      </Text>
      {!!item.brand_name && (
        <Text style={{ color: COLORS.placeholder, fontSize: 11, marginTop: 2 }}>
          {item.brand_name}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <MaterialCommunityIcons
          name="fire"
          size={14}
          color={COLORS.accentBlue}
          style={{ marginRight: 6 }}
        />
        <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
          {item.calories_per_100g != null
            ? `${Math.round(item.calories_per_100g)} kcal / 100 г`
            : 'Нет данных по калориям'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // показывать «ничего не найдено» — только если НЕТ выбранного варианта
  const showNoResults = !!query && query.trim().length >= 3 && !searching && results.length === 0 && !selectedFood;

  // Показываем дропдаун только если НЕ выбран продукт
  const showDropdown = !selectedFood && (results.length > 0 || showNoResults);

  return (
    <View
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: COLORS.borderBlue,
        marginBottom: 16,
        position: 'relative',
        zIndex: 10,
      }}
    >
      <Text style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' }}>
        Добавить приём пищи
      </Text>

      {/* Выбранный продукт (бейдж) */}
      {selectedFood ? (
        <View
          style={{
            marginTop: 10,
            marginBottom: 4,
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(26, 30, 60, 0.9)',
            borderWidth: 1,
            borderColor: COLORS.borderBlue,
            borderRadius: 18,
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Ionicons name="pricetag-outline" size={14} color={COLORS.accentBlue} style={{ marginRight: 6 }} />
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, maxWidth: 220 }} numberOfLines={1}>
            {selectedFood.description}
          </Text>
          <TouchableOpacity
            onPress={() => {
              onClearSelected();
              onForceCloseDropdown?.(false);
            }}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={COLORS.placeholder} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Поле поиска */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 8, marginBottom: 4 }}>
        Продукт
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.inputBg,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: COLORS.borderBlue,
          paddingHorizontal: 12,
          paddingVertical: 6,
        }}
      >
        <Ionicons name="search" size={18} color={COLORS.placeholder} style={{ marginRight: 6 }} />
        <TextInput
          style={{ flex: 1, color: COLORS.textPrimary, fontSize: 14 }}
          value={query}
          onChangeText={(t) => {
            // если есть выбранный — любое ручное редактирование сбрасывает выбор
            if (selectedFood) onClearSelected();
            setQuery(t);
            if (!t || t.trim().length < 3) setResults([]);
          }}
          placeholder="Например, chicken breast cooked"
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
          returnKeyType="search"
          onFocus={() => onForceCloseDropdown?.(false)}
        />
        {searching ? (
          <ActivityIndicator size="small" color={COLORS.accentBlue} style={{ marginLeft: 6 }} />
        ) : null}
      </View>

      {/* Выпадающий список результатов — показываем только если НЕ выбран продукт */}
      {showDropdown && (
        <View
          onStartShouldSetResponder={() => true}
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            top: 118,
            maxHeight: 260,
            backgroundColor: COLORS.dropdownBg,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: COLORS.borderBlue,
            overflow: 'hidden',
            elevation: 12,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            zIndex: 100,
          }}
        >
          {results.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingVertical: 4 }}>
              {results.map(renderResultItem)}
            </ScrollView>
          ) : (
            <View style={{ padding: 12 }}>
              <Text style={{ color: COLORS.placeholder, fontSize: 13 }}>
                Ничего не найдено. Попробуйте другую формулировку (например, “chicken breast roasted”).
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Вес и кнопка Добавить */}
      <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 10, marginBottom: 4 }}>
        Вес (г)
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: COLORS.inputBg,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: COLORS.borderBlue,
            paddingHorizontal: 14,
            paddingVertical: 8,
            fontSize: 14,
            color: COLORS.textPrimary,
            marginRight: 10,
          }}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          placeholder="Например, 300"
          placeholderTextColor={COLORS.placeholder}
          returnKeyType="done"
          onFocus={() => onForceCloseDropdown?.(false)}
        />
        <TouchableOpacity
          onPress={onAdd}
          disabled={isDisabled}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 22,
            backgroundColor: isDisabled ? COLORS.disabled : COLORS.accentBlue,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: isDisabled ? 'transparent' : COLORS.accentBlue,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: isDisabled ? 0 : 0.8,
            shadowRadius: 6,
            elevation: isDisabled ? 0 : 8,
          }}
        >
          {adding ? (
            <ActivityIndicator size="small" color={COLORS.btnText} />
          ) : (
            <Text style={{ color: COLORS.btnText, fontSize: 14, fontWeight: '600' }}>Добавить</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 8 }}>
        <Text style={{ color: COLORS.placeholder, fontSize: 11 }}>
          1) Введите продукт → выберите из списка → 2) Укажите граммы → 3) Нажмите «Добавить».
        </Text>
      </View>
    </View>
  );
}


