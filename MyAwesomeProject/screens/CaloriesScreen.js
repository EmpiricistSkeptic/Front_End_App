import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

const { width, height } = Dimensions.get('window');

// Пример данных питания
const NUTRITION_DATA = {
  daily: {
    calories: 1850,
    proteins: 95,
    fat: 62,
    carbs: 205,
    goal: {
      calories: 2200,
      proteins: 120,
      fat: 73,
      carbs: 250,
    }
  },
  history: [
    { day: 'Mon', calories: 1950, proteins: 100, fat: 65, carbs: 210 },
    { day: 'Tue', calories: 2100, proteins: 110, fat: 70, carbs: 240 },
    { day: 'Wed', calories: 1850, proteins: 95, fat: 62, carbs: 205 },
    { day: 'Thu', calories: 2050, proteins: 105, fat: 68, carbs: 230 },
    { day: 'Fri', calories: 1900, proteins: 98, fat: 64, carbs: 215 },
    { day: 'Sat', calories: 2200, proteins: 115, fat: 73, carbs: 250 },
    { day: 'Sun', calories: 1800, proteins: 92, fat: 60, carbs: 200 },
  ],
  meals: [
    {
      id: 1,
      product_name: 'Greek Yogurt',
      weight: 200,
      calories: 180,
      proteins: 20,
      fat: 5,
      carbs: 8,
      consumed_at: '8:30 AM',
    },
    {
      id: 2,
      product_name: 'Chicken Breast',
      weight: 150,
      calories: 240,
      proteins: 45,
      fat: 6,
      carbs: 0,
      consumed_at: '1:15 PM',
    },
    {
      id: 3,
      product_name: 'Brown Rice',
      weight: 100,
      calories: 130,
      proteins: 3,
      fat: 1,
      carbs: 28,
      consumed_at: '1:15 PM',
    },
    {
      id: 4,
      product_name: 'Broccoli',
      weight: 100,
      calories: 55,
      proteins: 4,
      fat: 0.5,
      carbs: 11,
      consumed_at: '1:15 PM',
    },
    {
      id: 5,
      product_name: 'Protein Shake',
      weight: 350,
      calories: 210,
      proteins: 35,
      fat: 2,
      carbs: 8,
      consumed_at: '5:30 PM',
    },
    {
      id: 6,
      product_name: 'Salmon',
      weight: 150,
      calories: 280,
      proteins: 32,
      fat: 18,
      carbs: 0,
      consumed_at: '7:45 PM',
    },
    {
      id: 7,
      product_name: 'Sweet Potato',
      weight: 150,
      calories: 130,
      proteins: 2,
      fat: 0.3,
      carbs: 30,
      consumed_at: '7:45 PM',
    }
  ]
};

export default function CaloriesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('meals');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  // Имитация API-запроса
  const searchFood = (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    
    // Имитация задержки запроса
    setTimeout(() => {
      // Примеры результатов
      const results = [
        { id: 101, product_name: `${query} Chicken Breast`, weight: 100, calories: 165, proteins: 31, fat: 3.6, carbs: 0 },
        { id: 102, product_name: `${query} Oatmeal`, weight: 100, calories: 389, proteins: 16.9, fat: 6.9, carbs: 66.3 },
        { id: 103, product_name: `${query} Greek Yogurt`, weight: 100, calories: 59, proteins: 10, fat: 0.4, carbs: 3.6 },
      ];
      
      setSearchResults(results);
      setSearching(false);
    }, 1000);
  };
  
  const getProgressPercentage = (current, goal) => {
    const percentage = (current / goal) * 100;
    return percentage > 100 ? 100 : percentage;
  };
  
  const closeAddMeal = () => {
    setShowAddMeal(false);
    setSearchQuery('');
    setSearchResults([]);
  };
  
  const closeMealDetails = () => {
    setSelectedMeal(null);
  };
  
  useEffect(() => {
    if (searchQuery) {
      searchFood(searchQuery);
    }
  }, [searchQuery]);
  
  const renderMealsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.todaySummary}>
        <Text style={styles.todayTitle}>TODAY'S NUTRITION</Text>
        
        <View style={styles.nutritionCards}>
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionCardHeader}>
              <Ionicons name="flame" size={16} color="#ff9500" />
              <Text style={styles.nutritionCardTitle}>CALORIES</Text>
            </View>
            <Text style={styles.nutritionCardValue}>{NUTRITION_DATA.daily.calories}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${getProgressPercentage(NUTRITION_DATA.daily.calories, NUTRITION_DATA.daily.goal.calories)}%`, backgroundColor: '#ff9500' }]} />
            </View>
            <Text style={styles.nutritionCardGoal}>
              Goal: {NUTRITION_DATA.daily.goal.calories}
            </Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <View style={styles.nutritionCardHeader}>
              <MaterialCommunityIcons name="food-steak" size={16} color="#ff2d55" />
              <Text style={styles.nutritionCardTitle}>PROTEINS</Text>
            </View>
            <Text style={styles.nutritionCardValue}>{NUTRITION_DATA.daily.proteins}g</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progress, { width: `${getProgressPercentage(NUTRITION_DATA.daily.proteins, NUTRITION_DATA.daily.goal.proteins)}%`, backgroundColor: '#ff2d55' }]} />
            </View>
            <Text style={styles.nutritionCardGoal}>
              Goal: {NUTRITION_DATA.daily.goal.proteins}g
            </Text>
          </View>
          
          <View style={styles.nutritionCardRow}>
            <View style={[styles.nutritionCardSmall, { marginRight: 10 }]}>
              <View style={styles.nutritionCardHeader}>
                <MaterialCommunityIcons name="oil" size={14} color="#34c759" />
                <Text style={styles.nutritionCardTitleSmall}>FATS</Text>
              </View>
              <Text style={styles.nutritionCardValueSmall}>{NUTRITION_DATA.daily.fat}g</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progress, { width: `${getProgressPercentage(NUTRITION_DATA.daily.fat, NUTRITION_DATA.daily.goal.fat)}%`, backgroundColor: '#34c759' }]} />
              </View>
            </View>
            
            <View style={styles.nutritionCardSmall}>
              <View style={styles.nutritionCardHeader}>
                <MaterialCommunityIcons name="grain" size={14} color="#4dabf7" />
                <Text style={styles.nutritionCardTitleSmall}>CARBS</Text>
              </View>
              <Text style={styles.nutritionCardValueSmall}>{NUTRITION_DATA.daily.carbs}g</Text>
              <View style={styles.progressBarSmall}>
                <View style={[styles.progress, { width: `${getProgressPercentage(NUTRITION_DATA.daily.carbs, NUTRITION_DATA.daily.goal.carbs)}%`, backgroundColor: '#4dabf7' }]} />
              </View>
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
          {NUTRITION_DATA.meals.map(meal => (
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
                  <Text style={styles.mealDetails}>{meal.weight}g • {meal.consumed_at}</Text>
                </View>
              </View>
              <View style={styles.mealRight}>
                <Text style={styles.caloriesText}>{meal.calories} kcal</Text>
                <View style={styles.macroRow}>
                  <Text style={styles.macroText}>P: {meal.proteins}g</Text>
                  <Text style={styles.macroText}>F: {meal.fat}g</Text>
                  <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
  
  const renderStatsTab = () => (
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
            labels: NUTRITION_DATA.history.map(item => item.day),
            datasets: [
              {
                data: NUTRITION_DATA.history.map(item => item.calories),
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
                  data: NUTRITION_DATA.history.map(item => item.proteins),
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
            Avg: {Math.round(NUTRITION_DATA.history.reduce((acc, curr) => acc + curr.proteins, 0) / NUTRITION_DATA.history.length)}g
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>FATS</Text>
          <LineChart
            data={{
              labels: [],
              datasets: [
                {
                  data: NUTRITION_DATA.history.map(item => item.fat),
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
            Avg: {Math.round(NUTRITION_DATA.history.reduce((acc, curr) => acc + curr.fat, 0) / NUTRITION_DATA.history.length)}g
          </Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>CARBS</Text>
          <LineChart
            data={{
              labels: [],
              datasets: [
                {
                  data: NUTRITION_DATA.history.map(item => item.carbs),
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
            Avg: {Math.round(NUTRITION_DATA.history.reduce((acc, curr) => acc + curr.carbs, 0) / NUTRITION_DATA.history.length)}g
          </Text>
        </View>
      </View>
    </View>
  );
  
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
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.levelText}>LVL 23</Text>
            <View style={styles.expBarContainer}>
              <View style={styles.expBar} />
              <Text style={styles.expText}>1250 / 2000 EXP</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>H</Text>
            </View>
          </TouchableOpacity>
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
  contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} // paddingBottom для обеспечения видимости нижней навигации
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
            
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Learn')}>
              <FontAwesome5 name="book" size={24} color="#4dabf7" />
              <Text style={styles.navText}>Learn</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        
        {/* Add Meal Modal */}
        {showAddMeal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeAddMeal} />
            <View style={styles.addMealModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Meal</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeAddMeal}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color="#c8d6e5" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search food..."
                    placeholderTextColor="#8d9db5"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                
                <View style={styles.searchResults}>
                  {searching ? (
                    <ActivityIndicator size="large" color="#4dabf7" style={styles.loader} />
                  ) : (
                    searchResults.length > 0 ? (
                      <ScrollView style={styles.resultsList}>
                        {searchResults.map(item => (
                          <TouchableOpacity key={item.id} style={styles.resultItem}>
                            <View style={styles.resultLeft}>
                              <Text style={styles.resultTitle}>{item.product_name}</Text>
                              <Text style={styles.resultDetails}>{item.weight}g</Text>
                            </View>
                            <View style={styles.resultRight}>
                              <Text style={styles.resultCalories}>{item.calories} kcal</Text>
                              <View style={styles.macroRow}>
                                <Text style={styles.macroText}>P: {item.proteins}g</Text>
                                <Text style={styles.macroText}>F: {item.fat}g</Text>
                                <Text style={styles.macroText}>C: {item.carbs}g</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    ) : searchQuery.length > 0 ? (
                      <Text style={styles.noResults}>No results found</Text>
                    ) : (
                      <View style={styles.searchPrompt}>
                        <Ionicons name="nutrition" size={48} color="#3250b4" style={styles.promptIcon} />
                        <Text style={styles.promptText}>Search for food to add to your diary</Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
        
        {/* Meal Details Modal */}
        {selectedMeal && (
          <View style={styles.modalOverlay}>
            <TouchableOpacity style={styles.modalBackground} onPress={closeMealDetails} />
            <View style={styles.mealDetailsModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedMeal.product_name}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={closeMealDetails}>
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <View style={styles.mealDetailRow}>
                  <Text style={styles.mealDetailLabel}>Consumed at:</Text>
                  <Text style={styles.mealDetailValue}>{selectedMeal.consumed_at}</Text>
                </View>
                
                <View style={styles.mealDetailRow}>
                  <Text style={styles.mealDetailLabel}>Weight:</Text>
                  <Text style={styles.mealDetailValue}>{selectedMeal.weight}g</Text>
                </View>
                
                <View style={styles.nutritionDetails}>
                  <View style={styles.nutritionDetailItem}>
                    <Ionicons name="flame" size={20} color="#ff9500" />
                    <Text style={styles.nutritionDetailValue}>{selectedMeal.calories}</Text>
                    <Text style={styles.nutritionDetailLabel}>CALORIES</Text>
                  </View>
                  
                  <View style={styles.nutritionDetailItem}>
                    <MaterialCommunityIcons name="food-steak" size={20} color="#ff2d55" />
                    <Text style={styles.nutritionDetailValue}>{selectedMeal.proteins}g</Text>
                    <Text style={styles.nutritionDetailLabel}>PROTEINS</Text>
                  </View>
                  
                  <View style={styles.nutritionDetailItem}>
                    <MaterialCommunityIcons name="oil" size={20} color="#34c759" />
                    <Text style={styles.nutritionDetailValue}>{selectedMeal.fat}g</Text>
                    <Text style={styles.nutritionDetailLabel}>FATS</Text>
                  </View>
                  
                  <View style={styles.nutritionDetailItem}>
                    <MaterialCommunityIcons name="grain" size={20} color="#4dabf7" />
                    <Text style={styles.nutritionDetailValue}>{selectedMeal.carbs}g</Text>
                    <Text style={styles.nutritionDetailLabel}>CARBS</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                >
                  <LinearGradient
                    colors={['#ff2d55', '#ff3b30']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>DELETE MEAL</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  headerLeft: {
    flex: 1,
  },
  levelText: {
    color: '#4dabf7',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  expBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  expBar: {
    width: '62.5%', // Based on sample exp: 1250/2000
    height: '100%',
    backgroundColor: '#4dabf7',
    borderRadius: 5,
  },
  expText: {
    position: 'absolute',
    right: 0,
    top: 12,
    color: '#c8d6e5',
    fontSize: 10,
  },
  profileButton: {
    marginLeft: 15,
  },
  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#3250b4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
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
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
  },
  mealDetailsModal: {
    width: width * 0.9,
    backgroundColor: '#121539',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.3)',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
  },
  modalContent: {
    padding: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.3)',
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 42,
    color: '#ffffff',
  },
  searchResults: {
    flex: 1,
    minHeight: 200,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
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
  resultLeft: {
    flex: 1,
  },
  resultTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  resultDetails: {
    color: '#8d9db5',
    fontSize: 12,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultCalories: {
    color: '#ff9500',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  loader: {
    marginTop: 30,
  },
  noResults: {
    color: '#8d9db5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 30,
  },
  searchPrompt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  promptIcon: {
    marginBottom: 15,
    opacity: 0.7,
  },
  promptText: {
    color: '#8d9db5',
    fontSize: 14,
    textAlign: 'center',
  },
  mealDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(77, 171, 247, 0.1)',
    paddingBottom: 10,
  },
  mealDetailLabel: {
    color: '#8d9db5',
    fontSize: 14,
  },
  mealDetailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  nutritionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  nutritionDetailItem: {
    width: '48%',
    backgroundColor: 'rgba(16, 20, 45, 0.7)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(77, 171, 247, 0.2)',
  },
  nutritionDetailValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 2,
  },
  nutritionDetailLabel: {
    color: '#8d9db5',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  deleteButton: {
    width: '100%',
    height: 44,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});