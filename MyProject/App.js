import * as React from 'react';
import './i18n/i18n';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Импортируем экраны
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoadingScreen from './screens/LoadingScreen';

// Экраны "второго уровня" (детали), которые открываются ПОВЕРХ табов
import GroupDetailsScreen from './screens/Groups/GroupDetailsScreen';
import CreateGroupScreen from './screens/Groups/CreateGroupScreen';
import EditGroupScreen from './screens/Groups/EditGroupScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import AssistantScreen from './screens/AssistantScreen';

// Импортируем наш НОВЫЙ навигатор табов
import TabNavigator from './navigation/TabNavigator';

import { ProfileProvider } from './context/ProfileContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ProfileProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Экраны авторизации */}
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />

          {/* ГЛАВНЫЙ ЭКРАН С НИЖНИМ МЕНЮ */}
          {/* Вместо Home, Pomodoro и т.д. используем MainTabs */}
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />

          {/* Экраны, которые открываются поверх меню (без меню внизу) */}
          <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
          <Stack.Screen 
            name="AssistantDetail" // Назовем уникально, чтобы не путать с табом
            component={AssistantScreen} 
          />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
          <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
          <Stack.Screen
            name="CreateTask"
            component={CreateTaskScreen}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
            options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  );
}