import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Импортируй свои API и компоненты корректно относительно структуры папок
import { getSummary, getByDays, searchFood, postCalories, deleteNutritionLog } from './api/nutritionApi';
import NutritionSummary from './components/NutritionSummary';
import HistorySection from './components/HistorySection';
import FoodSearchSection from './components/FoodSearchSection';
import GoalsModal from './components/GoalsModal';

import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

const COLORS = {
  backgroundGradientStart: '#121539',
  backgroundGradientEnd: '#080b20',
  accentBlue: '#4dabf7',
  borderBlue: '#3250b4',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  particle: '#4dabf7',
  headerBorder: 'rgba(77, 171, 247, 0.3)',
};

export default function CaloriesScreen({ navigation }) {
  const { t } = useTranslation();

  // Стейт для управления прокруткой всего экрана
  // true = экран можно скроллить
  // false = экран заморожен (когда палец на выпадающем списке)
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [period, setPeriod] = useState('week');
  const [byDays, setByDays] = useState([]);
  const [byDaysLoading, setByDaysLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [weight, setWeight] = useState('');
  const [adding, setAdding] = useState(false);

  const [goalsVisible, setGoalsVisible] = useState(false);

  const openGoals = useCallback(() => setGoalsVisible(true), []);
  const closeGoals = useCallback(() => setGoalsVisible(false), []);

  const searchTimer = useRef(null);

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

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await getSummary();
      setSummary(data);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadByDays = useCallback(
    async (p = period) => {
      setByDaysLoading(true);
      try {
        const data = await getByDays(p);
        setByDays(Array.isArray(data) ? data : []);
      } finally {
        setByDaysLoading(false);
      }
    },
    [period]
  );

  useEffect(() => {
    loadSummary();
    loadByDays('week');
  }, [loadSummary, loadByDays]);

  useEffect(() => {
    const q = (query || '').trim();
    if (!q || q.length < 3) {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      setResults([]);
      setSearching(false);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const data = await searchFood(q);
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => searchTimer.current && clearTimeout(searchTimer.current);
  }, [query]);

  const closeDropdown = useCallback((pulse = true) => {
    setResults([]);
    if (pulse) {
      setSearching(true);
      setTimeout(() => setSearching(false), 150);
    }
  }, []);

  const handleSelectFood = useCallback(
    (item) => {
      setSelectedFood(item);
      closeDropdown(true);
    },
    [closeDropdown]
  );

  const handleClearSelected = useCallback(() => {
    setSelectedFood(null);
  }, []);

  const handleChangePeriod = useCallback(
    (p) => {
      if (p === period) return;
      setPeriod(p);
      loadByDays(p);
    },
    [period, loadByDays]
  );

  const handleAdd = useCallback(
    async () => {
      const name = (selectedFood?.description || query || '').trim();
      const grams = parseFloat((weight || '').replace(',', '.'));
      if (!name || !grams || grams <= 0) return;
      setAdding(true);
      try {
        await postCalories({ product_name: name, weight: grams });
        await loadSummary();
        setWeight('');
        closeDropdown(false);
      } finally {
        setAdding(false);
      }
    },
    [selectedFood, query, weight, loadSummary, closeDropdown]
  );

  const mealsToday = summary?.meals || [];
  const seed = useMemo(
    () => ({
      calories: summary?.calories_goal,
      proteins: summary?.proteins_goal,
      fats: summary?.fats_goal,
      carbs: summary?.carbs_goal,
    }),
    [summary]
  );

  const handleDeleteMeal = useCallback((item) => {
    Alert.alert(
      t('nutrition.alerts.deleteConfirmTitle'), // "Delete Meal"
      t('nutrition.alerts.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('nutrition.alerts.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Вызываем API удаления (предполагаем, что item.id — это ID записи)
              await deleteNutritionLog(item.id);
              
              // Обязательно обновляем сводку, чтобы пересчитать калории
              await loadSummary();
              
              Alert.alert(t('common.success'), t('nutrition.alerts.deleteSuccess'));
            } catch (error) {
              console.error(error);
              Alert.alert(t('common.error'), t('nutrition.alerts.deleteError'));
            }
          },
        },
      ]
    );
  }, [t, loadSummary]);

  const renderMealsToday = () => {
    const formatTime = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <View
        style={{
          backgroundColor: 'rgba(26, 30, 60, 0.85)',
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: COLORS.borderBlue,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: COLORS.textPrimary,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 6,
          }}
        >
          {t('nutrition.mealsToday.title')}
        </Text>
        {mealsToday.length === 0 ? (
          <Text style={{ color: COLORS.placeholder, fontSize: 13 }}>
            {t('nutrition.mealsToday.empty')}
          </Text>
        ) : (
          mealsToday.map((item) => (
            <View
              key={item.id}
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(77,171,247,0.2)',
              }}
            >
              {/* Верхняя строка: Название --- Калории + Кнопка удаления */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    color: COLORS.textPrimary,
                    fontSize: 14,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {item.product_name}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={{
                      color: COLORS.accentBlue,
                      fontSize: 14,
                      fontWeight: '600',
                      marginRight: 10, // Отступ до мусорки
                    }}
                  >
                    {Math.round(item.calories)} kcal
                  </Text>
                  
                  {/* КНОПКА УДАЛЕНИЯ */}
                  <TouchableOpacity 
                    onPress={() => handleDeleteMeal(item)}
                    style={{ padding: 4 }} // Увеличиваем область нажатия
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff2d55" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Нижняя строка: Вес, БЖУ, Время */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  {item.weight} g
                </Text>
                <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
                  P {Math.round(item.proteins)} · F {Math.round(item.fats)} · C{' '}
                  {Math.round(item.carbs)}
                </Text>
                <Text style={{ color: COLORS.placeholder, fontSize: 11 }}>
                  {formatTime(item.consumed_at)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* Particles */}
        <View style={{ position: 'absolute', width, height }} pointerEvents="none">
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

        {/* Header */}
        <View
          style={{
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.headerBorder,
          }}
        >
          <Text style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }}>
            {t('nutrition.header.title')}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {summaryLoading && !summary ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
            </View>
          ) : (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <ScrollView
                // УПРАВЛЕНИЕ СКРОЛЛОМ РОДИТЕЛЯ
                scrollEnabled={isScrollEnabled} 
                style={{ flex: 1, paddingHorizontal: 15 }}
                contentContainerStyle={{
                  paddingVertical: 15,
                  // БОЛЬШОЙ ОТСТУП СНИЗУ (чтобы контент не прятался за навигацией)
                  paddingBottom: 120,
                }}
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                <NutritionSummary summary={summary} onOpenGoals={openGoals} />

                <HistorySection
                  period={period}
                  onChangePeriod={handleChangePeriod}
                  data={byDays}
                  loading={byDaysLoading}
                />

                {/* Передаем функцию блокировки в FoodSearchSection */}
                <FoodSearchSection
                  query={query}
                  setQuery={setQuery}
                  results={results}
                  setResults={setResults}
                  searching={searching}
                  weight={weight}
                  setWeight={setWeight}
                  onSelectFood={handleSelectFood}
                  onAdd={handleAdd}
                  adding={adding}
                  disabledAdd={!query.trim() && !selectedFood}
                  selectedFood={selectedFood}
                  onClearSelected={handleClearSelected}
                  onForceCloseDropdown={closeDropdown}
                  onToggleParentScroll={setIsScrollEnabled} 
                />

                {renderMealsToday()}
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>

        <GoalsModal
          visible={goalsVisible}
          onClose={closeGoals}
          onSaved={loadSummary}
          seed={seed}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}