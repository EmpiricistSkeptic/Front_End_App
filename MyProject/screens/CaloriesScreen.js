import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import apiService from '../services/apiService';

const { width, height } = Dimensions.get('window');

export default function CaloriesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('meals');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [weightInput, setWeightInput] = useState('100'); // Default weight 100g
  // Новые состояния для модального окна установки целей
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProteins, setGoalProteins] = useState('');
  const [goalFats, setGoalFats] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');

  
  // State for storing data from the API
  const [nutritionData, setNutritionData] = useState({
    total_calories: 0,
    total_proteins: 0,
    total_fats: 0,
    total_carbs: 0,
    calories_goal: 0,
    proteins_goal: 0,
    fats_goal: 0,
    carbs_goal: 0,
    remaining: {
      calories: 0,
      proteins: 0,
      fats: 0,
      carbs: 0
    },
    meals: []
  });
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch nutrition summary data
  const fetchNutritionData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await apiService.get('/nutrition-summary/');
      setNutritionData(data);

      // Устанавливаем текущие цели из данных API
      setGoalCalories(data.calories_goal?.toString() || '');
      setGoalProteins(data.proteins_goal?.toString() || '');
      setGoalFats(data.fats_goal?.toString() || '');
      setGoalCarbs(data.carbs_goal?.toString() || '');
      
      // Fetch history data based on selected period
      fetchHistoryData();
    } catch (err) {
      console.error('Error fetching nutrition data:', err);
      setError('Failed to load nutrition data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch history data based on selected period
  const fetchHistoryData = async () => {
    try {
      const data = await apiService.get(`/calories-by-days/${selectedPeriod}/`);
      
      if (data && Array.isArray(data)) {
        // Format dates for better display
        const formattedData = data.map(item => ({
          ...item,
          // Format date for chart display
          day: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        
        setHistoryData(formattedData);
      }
    } catch (err) {
      console.error('Error fetching history data:', err);
      setError('Failed to load history data');
    }
  };
  
  // Function to search for food items
  const searchFood = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    
    try {
      // Clear previous results
      setSearchResults([]);
      
      // Make API call to Nutritionix through your backend
      const result = await apiService.post('/get-calories/', {
        product_name: searchQuery,
        weight: parseInt(weightInput, 10) || 100
      });
      
      // Add to search results if successful
      if (result) {
        setSearchResults([{
          id: Date.now().toString(),
          product_name: result.product_name,
          weight: parseFloat(weightInput) || 100,
          calories: result.calories,
          proteins: result.proteins,
          fats: result.fats,
          carbs: result.carbs
        }]);
      }
    } catch (err) {
      console.error('Error searching food:', err);
      Alert.alert('Error', 'Failed to search for food. Please try again.');
    } finally {
      setSearching(false);
    }
  };
  
  // Calculate progress percentage
  const getProgressPercentage = (current, goal) => {
    if (!goal) return 0;
    const percentage = (current / goal) * 100;
    return percentage > 100 ? 100 : percentage;
  };
  
  // Modal handlers
  const closeAddMeal = () => {
    setShowAddMeal(false);
    setSearchQuery('');
    setSearchResults([]);
    setWeightInput('100');
  };
  
  const closeMealDetails = () => {
    setSelectedMeal(null);
  };
  
  // Handle meal deletion
  const handleDeleteMeal = async (mealId) => {
    try {
      await apiService.delete(`/consumed-calories/${mealId}/`);
      
      // Close modal and refresh data
      closeMealDetails();
      fetchNutritionData();
      
      Alert.alert('Success', 'Meal deleted successfully');
    } catch (err) {
      console.error('Error deleting meal:', err);
      Alert.alert('Error', 'Failed to delete meal');
    }
  };
  
  // Add meal handler
  const handleAddMeal = async (foodItem) => {
    try {
      // The API already creates the meal record when searching
      // We just need to close the modal and refresh
      closeAddMeal();
      fetchNutritionData();
      
      Alert.alert('Success', 'Meal added successfully');
    } catch (err) {
      console.error('Error adding meal:', err);
      Alert.alert('Error', 'Failed to add meal');
    }
  };

  // Функция обновления целей питания
  const handleUpdateGoals = async () => {
    const newGoals = {
      calories_goal: parseInt(goalCalories, 10) || 0,
      proteins_goal: parseInt(goalProteins, 10) || 0,
      fats_goal: parseInt(goalFats, 10) || 0,
      carbs_goal: parseInt(goalCarbs, 10) || 0,
    };

    try {
      await apiService.patch('/update-nutrition-goals/', newGoals);
      fetchNutritionData();
      Alert.alert('Success', 'Nutrition goals updated successfully');
      setShowGoalsModal(false);
    } catch (err) {
      console.error('Error updating goals:', err);
      Alert.alert('Error', 'Failed to update nutrition goals');
    }
  };

  
  // Update nutrition goals
  const updateNutritionGoals = async (goals) => {
    try {
      await apiService.patch('/update-nutrition-goals/', goals);
      fetchNutritionData();
      Alert.alert('Success', 'Nutrition goals updated successfully');
    } catch (err) {
      console.error('Error updating goals:', err);
      Alert.alert('Error', 'Failed to update nutrition goals');
    }
  };
  
  // Effects
  useEffect(() => {
    // Fetch data when component mounts
    fetchNutritionData();
    
    // Set up a refresh when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      fetchNutritionData();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  useEffect(() => {
    // Fetch history data when period changes
    if (!isLoading) {
      fetchHistoryData();
    }
  }, [selectedPeriod]);
  
  // Calculate averages for stats tab
  const calculateAverage = (property) => {
    if (!historyData || historyData.length === 0) return 0;
    
    const sum = historyData.reduce((acc, curr) => {
      const value = property === 'calories' ? curr.total_calories :
                   property === 'proteins' ? curr.total_proteins :
                   property === 'fats' ? curr.total_fats :
                   curr.total_carbs;
      return acc + (value || 0);
    }, 0);
    
    return Math.round(sum / historyData.length);
  };

  const renderGoalsModal = () => {
    if (!showGoalsModal) return null;
  
    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setShowGoalsModal(false)}
        />
        <View style={styles.goalsModal}>
          <LinearGradient colors={['#182052', '#121539']} style={styles.modalGradient}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Nutrition Goals</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowGoalsModal(false)}>
                <Ionicons name="close" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.inputField}
                placeholder="Calories Goal"
                placeholderTextColor="#8d9db5"
                keyboardType="numeric"
                value={goalCalories}
                onChangeText={setGoalCalories}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Proteins Goal (g)"
                placeholderTextColor="#8d9db5"
                keyboardType="numeric"
                value={goalProteins}
                onChangeText={setGoalProteins}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Fats Goal (g)"
                placeholderTextColor="#8d9db5"
                keyboardType="numeric"
                value={goalFats}
                onChangeText={setGoalFats}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Carbs Goal (g)"
                placeholderTextColor="#8d9db5"
                keyboardType="numeric"
                value={goalCarbs}
                onChangeText={setGoalCarbs}
              />
              <TouchableOpacity style={styles.updateGoalsButton} onPress={handleUpdateGoals}>
                <LinearGradient
                  colors={['#3250b4', '#4dabf7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Update Goals</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  // Render meals tab
  const renderMealsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>Loading your nutrition data...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchNutritionData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    
    return (
      <View style={styles.tabContent}>
        <View style={styles.todaySummary}>
          <Text style={styles.todayTitle}>TODAY'S NUTRITION</Text>
          <TouchableOpacity 
            style={styles.setGoalsButton}
            onPress={() => setShowGoalsModal(true)}
          >
            <Text style={styles.setGoalsButtonText}>Set Goals</Text>
          </TouchableOpacity>
          
          <View style={styles.nutritionCards}>
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionCardHeader}>
                <Ionicons name="flame" size={16} color="#ff9500" />
                <Text style={styles.nutritionCardTitle}>CALORIES</Text>
              </View>
              <Text style={styles.nutritionCardValue}>{nutritionData.total_calories || 0}</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progress, 
                  { 
                    width: `${getProgressPercentage(nutritionData.total_calories, nutritionData.calories_goal)}%`, 
                    backgroundColor: '#ff9500' 
                  }
                ]} />
              </View>
              <Text style={styles.nutritionCardGoal}>
                Goal: {nutritionData.calories_goal || 0}
              </Text>
            </View>
            
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionCardHeader}>
                <MaterialCommunityIcons name="food-steak" size={16} color="#ff2d55" />
                <Text style={styles.nutritionCardTitle}>PROTEINS</Text>
              </View>
              <Text style={styles.nutritionCardValue}>{nutritionData.total_proteins || 0}g</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progress, 
                  { 
                    width: `${getProgressPercentage(nutritionData.total_proteins, nutritionData.proteins_goal)}%`, 
                    backgroundColor: '#ff2d55' 
                  }
                ]} />
              </View>
              <Text style={styles.nutritionCardGoal}>
                Goal: {nutritionData.proteins_goal || 0}g
              </Text>
            </View>
            
            <View style={styles.nutritionCardRow}>
              {/* Fats Card */}
              <View style={[styles.nutritionCardSmall, { marginRight: 10 }]}>
                <View style={styles.nutritionCardHeader}>
                  <MaterialCommunityIcons name="oil" size={14} color="#34c759" />
                  <Text style={styles.nutritionCardTitleSmall}>FATS</Text>
                </View>
                <Text style={styles.nutritionCardValueSmall}>{nutritionData.total_fats || 0}g</Text>
                <View style={styles.progressBarSmall}>
                  <View style={[
                    styles.progress,
                    {
                      width: `${getProgressPercentage(nutritionData.total_fats, nutritionData.fats_goal)}%`,
                      backgroundColor: '#34c759'
                    }
                  ]} />
                </View>
                {/* --- ИСПРАВЛЕНИЕ: Добавлена строка для цели жиров --- */}
                <Text style={styles.nutritionCardGoal}>
                Goal: {nutritionData.fats_goal || 0}g
              </Text>
              </View>
              
              {/* Carbs Card */}
              <View style={styles.nutritionCardSmall}>
                <View style={styles.nutritionCardHeader}>
                  <MaterialCommunityIcons name="grain" size={14} color="#4dabf7" />
                  <Text style={styles.nutritionCardTitleSmall}>CARBS</Text>
                </View>
                <Text style={styles.nutritionCardValueSmall}>{nutritionData.total_carbs || 0}g</Text>
                <View style={styles.progressBarSmall}>
                  <View style={[
                    styles.progress,
                    {
                      width: `${getProgressPercentage(nutritionData.total_carbs, nutritionData.carbs_goal)}%`,
                      backgroundColor: '#4dabf7'
                    }
                  ]} />
                </View>
                 {/* --- ИСПРАВЛЕНИЕ: Добавлена строка для цели углеводов --- */}
                 <Text style={styles.nutritionCardGoal}>
                    Goal: {nutritionData.carbs_goal || 0}g
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.mealsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S MEALS</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => setShowAddMeal(true)}>
              <AntDesign name="plus" size={18} color="#4dabf7" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.mealsList}>
            {nutritionData.meals && nutritionData.meals.length > 0 ? (
              nutritionData.meals.map(meal => (
                <TouchableOpacity 
                  key={meal.id} 
                  style={styles.mealItem}
                  onPress={() => setSelectedMeal(meal)}
                >
                  <View style={styles.mealLeft}>
                    <View style={styles.mealIcon}>
                      <MaterialCommunityIcons name="food" size={16} color="#ffffff" />
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealTitle}>{meal.product_name}</Text>
                      <Text style={styles.mealDetails}>
                        {meal.weight}g • {new Date(meal.consumed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mealRight}>
                    <Text style={styles.caloriesText}>{Math.round(meal.calories)} kcal</Text>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroText}>P: {Math.round(meal.proteins)}g</Text>
                      <Text style={styles.macroText}>F: {Math.round(meal.fats)}g</Text>
                      <Text style={styles.macroText}>C: {Math.round(meal.carbs)}g</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyMealsContainer}>
                <MaterialCommunityIcons name="food-off" size={48} color="#3250b4" />
                <Text style={styles.emptyMealsText}>No meals tracked today</Text>
                <TouchableOpacity 
                  style={styles.addMealButton}
                  onPress={() => setShowAddMeal(true)}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>ADD MEAL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };
  
  // Render stats tab
  const renderStatsTab = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dabf7" />
          <Text style={styles.loadingText}>Loading your statistics...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={48} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchHistoryData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    // If no history data
    if (!historyData || historyData.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="chart-line-variant" size={48} color="#3250b4" />
          <Text style={styles.errorText}>No historical data available</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
              LAST 7 DAYS
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              LAST 30 DAYS
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Calories Intake</Text>
          <LineChart
            data={{
              labels: historyData.map(item => item.day),
              datasets: [
                {
                  data: historyData.map(item => item.total_calories || 0),
                }
              ]
            }}
            width={width - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#121539',
              backgroundGradientFrom: '#121539',
              backgroundGradientTo: '#121539',
              decimalPlaces: 0,
              color: () => '#4dabf7',
              labelColor: () => '#c8d6e5',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#3250b4'
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 8
            }}
          />
        </View>
        
        <View style={styles.statsCards}>
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>PROTEINS</Text>
            <LineChart
              data={{
                labels: [],
                datasets: [
                  {
                    data: historyData.map(item => item.total_proteins || 0),
                  }
                ]
              }}
              width={width * 0.42}
              height={80}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: () => '#ff2d55',
                labelColor: () => 'transparent',
                propsForDots: {
                  r: '0',
                },
                propsForLabels: {
                  opacity: 0
                }
              }}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={false}
              style={{
                marginBottom: 4,
              }}
            />
            <Text style={styles.statAverage}>
              Avg: {calculateAverage('proteins')}g
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>FATS</Text>
            <LineChart
              data={{
                labels: [],
                datasets: [
                  {
                    data: historyData.map(item => item.total_fats || 0),
                  }
                ]
              }}
              width={width * 0.42}
              height={80}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: () => '#34c759',
                labelColor: () => 'transparent',
                propsForDots: {
                  r: '0',
                }
              }}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={false}
              style={{
                marginBottom: 4,
              }}
            />
            <Text style={styles.statAverage}>
              Avg: {calculateAverage('fats')}g
            </Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statTitle}>CARBS</Text>
            <LineChart
              data={{
                labels: [],
                datasets: [
                  {
                    data: historyData.map(item => item.total_carbs || 0),
                  }
                ]
              }}
              width={width * 0.42}
              height={80}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: () => '#4dabf7',
                labelColor: () => 'transparent',
                propsForDots: {
                  r: '0',
                }
              }}
              bezier
              withHorizontalLabels={false}
              withVerticalLabels={false}
              withDots={false}
              style={{
                marginBottom: 4,
              }}
            />
            <Text style={styles.statAverage}>
              Avg: {calculateAverage('carbs')}g
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Particle effects background */}
        <View style={styles.particlesContainer}>
          {[...Array(20)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.particle, 
                { 
                  left: Math.random() * width, 
                  top: Math.random() * height,
                  width: Math.random() * 4 + 1,
                  height: Math.random() * 4 + 1,
                  opacity: Math.random() * 0.5 + 0.3
                }
              ]} 
            />
          ))}
        </View>
        
        
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'meals' && styles.tabButtonActive]}
            onPress={() => setActiveTab('meals')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'meals' && styles.tabButtonTextActive]}>
              TODAY'S MEALS
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'stats' && styles.tabButtonActive]}
            onPress={() => setActiveTab('stats')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'stats' && styles.tabButtonTextActive]}>
              STATISTICS
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <ScrollView
          style={styles.mainContent}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }}
        >
          {activeTab === 'meals' ? renderMealsTab() : renderStatsTab()}
        </ScrollView>
        
        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(16, 20, 45, 0.9)', 'rgba(16, 20, 45, 0.75)']}
            style={styles.navBackground}
          >
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
              <MaterialCommunityIcons name="sword-cross" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Quests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Pomodoro')}>
              <MaterialIcons name="timer" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Timer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.navItem, { opacity: 1 }]} onPress={() => navigation.navigate('Nutrition')}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#ffffff" />
              <Text style={[styles.navText, { color: '#ffffff' }]}>Calories</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Groups')}>
              <Ionicons name="people" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Guild</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Assistant')}>
              <Ionicons name="hardware-chip-outline" size={24} color="#4dabf7" /> 
              <Text style={styles.navText}>AI Assistant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {/* Add Meal Modal */}
        {showAddMeal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeAddMeal} />
            <View style={styles.addMealModal}>
              <LinearGradient
                colors={['#182052', '#121539']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add New Meal</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={closeAddMeal}>
                    <Ionicons name="close" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                      <Ionicons name="search" size={18} color="#4dabf7" style={styles.searchIcon} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search food..."
                        placeholderTextColor="#8d9db5"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                    
                    <View style={styles.inputRow}>
                      <View style={styles.weightInputContainer}>
                        <TextInput
                          style={styles.weightInput}
                          placeholder="100"
                          placeholderTextColor="#8d9db5"
                          keyboardType="numeric"
                          value={weightInput}
                          onChangeText={setWeightInput}
                        />
                        <Text style={styles.weightUnit}>g</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.searchButton}
                        onPress={searchFood}
                      >
                        <LinearGradient
                          colors={['#3250b4', '#4dabf7']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.buttonGradient}
                        >
                          <Text style={styles.searchButtonText}>Search</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.searchResults}>
                    {searching ? (
                      <ActivityIndicator size="large" color="#4dabf7" style={styles.loader} />
                    ) : (
                      searchResults.length > 0 ? (
                        <ScrollView style={styles.resultsList}>
                          {searchResults.map(item => (
                            <TouchableOpacity 
                              key={item.id} 
                              style={styles.resultItem}
                              onPress={() => handleAddMeal(item)}
                            >
                              <View style={styles.resultLeft}>
                                <Text style={styles.resultTitle}>{item.product_name}</Text>
                                <Text style={styles.resultDetails}>{item.weight}g</Text>
                              </View>
                              <View style={styles.resultRight}>
                                <Text style={styles.resultCalories}>{Math.round(item.calories)} kcal</Text>
                                <View style={styles.macroRow}>
                                  <View style={styles.macroPill}>
                                    <Text style={styles.macroText}>P: {Math.round(item.proteins)}g</Text>
                                  </View>
                                  <View style={styles.macroPill}>
                                    <Text style={styles.macroText}>F: {Math.round(item.fats)}g</Text>
                                  </View>
                                  <View style={styles.macroPill}>
                                    <Text style={styles.macroText}>C: {Math.round(item.carbs)}g</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      ) : searchQuery.length > 0 ? (
                        <View style={styles.emptyStateContainer}>
                          <Ionicons name="search-outline" size={48} color="#4dabf7" style={styles.promptIcon} />
                          <Text style={styles.noResults}>No results found</Text>
                          <Text style={styles.noResultsSubtext}>Try different keywords or food name</Text>
                        </View>
                      ) : (
                        <View style={styles.searchPrompt}>
                          <Ionicons name="nutrition" size={48} color="#4dabf7" style={styles.promptIcon} />
                          <Text style={styles.promptText}>Search for food to add to your diary</Text>
                          <Text style={styles.promptSubtext}>Enter food name and portion weight</Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
        
        {/* Meal Details Modal */}
        {selectedMeal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeMealDetails} />
            <View style={styles.mealDetailsModal}>
              <LinearGradient
                colors={['#182052', '#121539']}
                style={styles.modalGradient}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Meal Details</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={closeMealDetails}>
                    <Ionicons name="close" size={20} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalContent}>
                  <Text style={styles.mealDetailTitle}>{selectedMeal.product_name}</Text>
                  
                  <View style={styles.nutritionDetailsCard}>
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionDetail}>
                        <View style={styles.nutritionIcon}>
                          <Ionicons name="flame" size={16} color="#ff9500" />
                        </View>
                        <View>
                          <Text style={styles.nutritionValue}>{Math.round(selectedMeal.calories)}</Text>
                          <Text style={styles.nutritionLabel}>Calories</Text>
                        </View>
                      </View>
                      
                      <View style={styles.nutritionDetail}>
                        <View style={styles.nutritionIcon}>
                          <Ionicons name="barbell" size={16} color="#4dabf7" />
                        </View>
                        <View>
                          <Text style={styles.nutritionValue}>{Math.round(selectedMeal.proteins)}g</Text>
                          <Text style={styles.nutritionLabel}>Protein</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionDetail}>
                        <View style={styles.nutritionIcon}>
                          <Ionicons name="water" size={16} color="#ff7675" />
                        </View>
                        <View>
                          <Text style={styles.nutritionValue}>{Math.round(selectedMeal.fats)}g</Text>
                          <Text style={styles.nutritionLabel}>Fat</Text>
                        </View>
                      </View>
                      
                      <View style={styles.nutritionDetail}>
                        <View style={styles.nutritionIcon}>
                          <Ionicons name="nutrition" size={16} color="#55efc4" />
                        </View>
                        <View>
                          <Text style={styles.nutritionValue}>{Math.round(selectedMeal.carbs)}g</Text>
                          <Text style={styles.nutritionLabel}>Carbs</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.mealDetailInfo}>
                    <Text style={styles.infoLabel}>Serving Size</Text>
                    <Text style={styles.infoValue}>{selectedMeal.weight}g</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteMeal(selectedMeal.id)}
                  >
                    <LinearGradient
                      colors={['#ff6b6b', '#d63031']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ffffff" style={styles.buttonIcon} />
                      <Text style={styles.deleteButtonText}>Delete Meal</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
      </LinearGradient>
      {renderGoalsModal()}
    </View>
  );
}
  
  

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  particlesContainer: {
    position: 'absolute',
    width: width,
    height: height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
  },
  tabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#4dabf7',
  },
  tabButtonText: {
    color: '#8d9db5',
    fontSize: 14,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#4dabf7',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    flex: 1,
  },
  todaySummary: {
    marginTop: 15,
  },
  todayTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  nutritionCards: {
    marginBottom: 20,
  },
  nutritionCard: {
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  nutritionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  nutritionCardTitle: {
    color: '#c8d6e5',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  nutritionCardValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 5,
  },
  progress: {
    height: '100%',
    borderRadius: 3,
  },
  nutritionCardGoal: {
    color: '#8d9db5',
    fontSize: 12,
    textAlign: 'right',
  },
  nutritionCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionCardSmall: {
    flex: 1,
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  nutritionCardTitleSmall: {
    color: '#c8d6e5',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
    letterSpacing: 1,
  },
  nutritionCardValueSmall: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progressBarSmall: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mealsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  mealsList: {
    flex: 1,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#3250b4',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  mealDetails: {
    color: '#8d9db5',
    fontSize: 12,
  },
  mealRight: {
    alignItems: 'flex-end',
  },
  caloriesText: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroText: {
    color: '#8d9db5',
    fontSize: 11,
    marginLeft: 6,
  },
  periodSelector: {
    flexDirection: 'row',
    marginTop: 15,
    marginBottom: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.1)',
  },
  periodButtonActive: {
    borderColor: 'rgba(77, 171, 247, 0.5)',
    backgroundColor: 'rgba(50, 80, 180, 0.3)',
  },
  periodButtonText: {
    color: '#8d9db5',
    fontSize: 12,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#4dabf7',
  },
  chartContainer: {
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  chartTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statsCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  statTitle: {
    color: '#c8d6e5',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 1,
  },
  statAverage: {
    color: '#8d9db5',
    fontSize: 12,
    textAlign: 'right',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
  },
  navBackground: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: '100%',
    paddingBottom: 10,
  },
  navItem: {
    alignItems: 'center',
    opacity: 0.7,
  },
  navText: {
    color: '#4dabf7',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  addMealModal: {
    width: width * 0.9,
    maxHeight: height * 0.7,
    backgroundColor: '#121539',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
    overflow: 'hidden',
    shadowColor: "#4dabf7",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  mealDetailsModal: {
    width: width * 0.9,
    backgroundColor: '#121539',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
    overflow: 'hidden',
    shadowColor: "#4dabf7",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalGradient: {
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderRadius: 17,
  },
  modalContent: {
    padding: 18,
  },
  searchBarContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
    height: 48,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 15,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
    height: 48,
    width: '48%',
  },
  weightInput: {
    flex: 1,
    height: 48,
    color: '#ffffff',
    fontSize: 15,
    textAlign: 'center',
  },
  weightUnit: {
    color: '#8d9db5',
    fontSize: 15,
    fontWeight: '600',
  },
  searchButton: {
    width: '48%',
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  searchResults: {
    flex: 1,
    minHeight: 250,
  },
  resultsList: {
    maxHeight: 320,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  resultLeft: {
    flex: 1,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultDetails: {
    color: '#8d9db5',
    fontSize: 13,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultCalories: {
    color: '#ff9500',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
  },
  macroPill: {
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  macroText: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginTop: 40,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  noResults: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  noResultsSubtext: {
    color: '#8d9db5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  searchPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  promptIcon: {
    marginBottom: 15,
    opacity: 0.9,
  },
  promptText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  promptSubtext: {
    color: '#8d9db5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
  },
  mealDetailTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  nutritionDetailsCard: {
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutritionRow: {
    marginBottom: 0,
  },
  nutritionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
  },
  nutritionIcon: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(77, 171, 247, 0.15)',
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  nutritionValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nutritionLabel: {
    color: '#8d9db5',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  mealDetailInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  infoLabel: {
    color: '#8d9db5',
    fontSize: 14,
    fontWeight: '600',
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  setGoalsButton: {
    backgroundColor: '#3250b4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  setGoalsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalsModal: {
    width: width * 0.9,
    backgroundColor: '#121539',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
    overflow: 'hidden',
    elevation: 10,
  },
  inputField: {
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
  },
  updateGoalsButton: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 5,
  },
});