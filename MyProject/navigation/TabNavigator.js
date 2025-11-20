// navigation/TabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Импортируем экраны из папки screens
import HomeStack from './HomeStack';
import GroupsStack from './GroupsStack';
import PomodoroScreen from '../screens/PomodoroScreen';
import CaloriesScreen from '../screens/Nutrition/CaloriesScreen';
import GroupsHomeScreen from '../screens/Groups/GroupsHomeScreen';
import AssistantScreen from '../screens/AssistantScreen';

// Импортируем наш кастомный бар
import CustomTabBar from '../components/CustomTabBar';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false, // Скрываем стандартный заголовок, у тебя свои хедеры
        tabBarHideOnKeyboard: true, // Скрываем меню при вводе текста
      }}
    >
      <Tab.Screen 
        name="TasksStack" 
        component={HomeStack} 
        options={{ title: 'Tasks' }} 
      />
      <Tab.Screen 
        name="Pomodoro" 
        component={PomodoroScreen} 
        options={{ title: 'Timer' }} 
      />
      <Tab.Screen 
        name="Nutrition" 
        component={CaloriesScreen} 
        options={{ title: 'Calories' }} 
      />
      <Tab.Screen 
        name="GroupsStack" 
        component={GroupsStack} 
        options={{ title: 'Guild' }} 
      />
      <Tab.Screen 
        name="Assistant" 
        component={AssistantScreen} 
        options={{ title: 'Assistant' }} 
      />
    </Tab.Navigator>
  );
}