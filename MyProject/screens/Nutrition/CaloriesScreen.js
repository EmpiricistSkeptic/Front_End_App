import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, SafeAreaView, StatusBar, Platform, Dimensions, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import { getSummary, getByDays, searchFood, postCalories } from './api/nutritionApi';
import NutritionSummary from './components/NutritionSummary';
import HistorySection from './components/HistorySection';
import FoodSearchSection from './components/FoodSearchSection';
import GoalsModal from './components/GoalsModal';

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

  // 🔹 Мемоизированные частицы — один раз на маунт, не прыгают
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
        console.log(
          'searchFood error:',
          e?.response?.status,
          e?.response?.data || e?.message
        );
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
    [
      summary?.calories_goal,
      summary?.proteins_goal,
      summary?.fats_goal,
      summary?.carbs_goal,
    ]
  );

  const renderMealsToday = () => {
    const meals = mealsToday;
    const COLORS_LOCAL = {
      textPrimary: '#ffffff',
      textSecondary: '#c8d6e5',
      placeholder: '#5f7191',
      borderBlue: '#3250b4',
      innerBg: 'rgba(26, 30, 60, 0.85)',
      accentBlue: '#4dabf7',
    };
    const formatTime = (iso) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return (
      <View
        style={{
          backgroundColor: COLORS_LOCAL.innerBg,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: COLORS_LOCAL.borderBlue,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: COLORS_LOCAL.textPrimary,
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 6,
          }}
        >
          Сегодняшние приёмы пищи
        </Text>
        {meals.length === 0 ? (
          <Text style={{ color: COLORS_LOCAL.placeholder, fontSize: 13 }}>
            Ещё ничего не съедено сегодня.
          </Text>
        ) : (
          meals.map((item) => (
            <View
              key={item.id}
              style={{
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(77,171,247,0.2)',
              }}
            >
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
                    color: COLORS_LOCAL.textPrimary,
                    fontSize: 14,
                    marginRight: 8,
                  }}
                  numberOfLines={1}
                >
                  {item.product_name}
                </Text>
                <Text
                  style={{
                    color: COLORS_LOCAL.accentBlue,
                    fontSize: 14,
                    fontWeight: '600',
                  }}
                >
                  {Math.round(item.calories)} kcal
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}
              >
                <Text
                  style={{
                    color: COLORS_LOCAL.textSecondary,
                    fontSize: 11,
                  }}
                >
                  {item.weight} g
                </Text>
                <Text
                  style={{
                    color: COLORS_LOCAL.textSecondary,
                    fontSize: 11,
                  }}
                >
                  P {Math.round(item.proteins)} · F {Math.round(item.fats)} · C{' '}
                  {Math.round(item.carbs)}
                </Text>
                <Text
                  style={{
                    color: COLORS_LOCAL.placeholder,
                    fontSize: 11,
                  }}
                >
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: COLORS.backgroundGradientEnd }}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[COLORS.backgroundGradientStart, COLORS.backgroundGradientEnd]}
        style={{ flex: 1 }}
      >
        {/* 🔹 Частицы — теперь мемоизированные */}
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

        {/* Header */}
        <View
          style={{
            height: 60,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop:
              Platform.OS === 'android' ? StatusBar.currentHeight : 0,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.headerBorder,
          }}
        >
          <Text
            style={{
              color: COLORS.textPrimary,
              fontSize: 18,
              fontWeight: 'bold',
              letterSpacing: 1,
            }}
          >
            NUTRITION
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {summaryLoading && !summary ? (
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="large" color={COLORS.accentBlue} />
              <Text
                style={{
                  color: COLORS.textSecondary,
                  marginTop: 15,
                }}
              >
                Загрузка данных...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 15 }}
              contentContainerStyle={{
                paddingVertical: 15,
                paddingBottom: 30,
              }}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
            >
              {/* сводка + кнопка "Редактировать" */}
              <NutritionSummary summary={summary} onOpenGoals={openGoals} />

              {/* история */}
              <HistorySection
                period={period}
                onChangePeriod={handleChangePeriod}
                data={byDays}
                loading={byDaysLoading}
              />

              {/* поиск + добавление */}
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
              />

              {/* сегодняшние приёмы пищи */}
              {renderMealsToday()}
            </ScrollView>
          )}
        </View>

        {/* bottom nav */}
        <View style={{ width: '100%', paddingBottom: 20 }}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: 'rgba(77, 171, 247, 0.3)',
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={{ alignItems: 'center' }}
            >
              <MaterialCommunityIcons
                name="sword-cross"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{
                  color: '#c8d6e5',
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Tasks
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Pomodoro')}
              style={{ alignItems: 'center' }}
            >
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text
                style={{
                  color: '#c8d6e5',
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Timer
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Nutrition')}
              style={{ alignItems: 'center' }}
            >
              <MaterialCommunityIcons
                name="food-apple"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{
                  color: '#c8d6e5',
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Calories
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Groups')}
              style={{ alignItems: 'center' }}
            >
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text
                style={{
                  color: '#c8d6e5',
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                Guild
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Assistant')}
              style={{ alignItems: 'center' }}
            >
              <Ionicons
                name="hardware-chip-outline"
                size={24}
                color="#4dabf7"
              />
              <Text
                style={{
                  color: '#c8d6e5',
                  fontSize: 10,
                  marginTop: 5,
                }}
              >
                AI Assistant
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* модалка целей — стабильные пропсы */}
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
