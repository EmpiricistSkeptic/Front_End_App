import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Импортируем только Главную (где внутри живут твои верхние табы) и Профиль
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 
          HomeMain — это твой HomeScreen.js. 
          Внутри него уже работают Top Tabs (Tasks/Quests/Habits).
          Навигатор об этом не знает, для него это просто "Один экран".
      */}
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />

      {/* 
          Добавляем Профиль сюда. 
          Так как он внутри этого стека, а этот стек внутри Нижнего Меню,
          меню останется видимым!
      */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
    </Stack.Navigator>
  );
}