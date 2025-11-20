import * as React from 'react';
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
import TaskScreen from './screens/TaskScreen';
import AIQuestListScreen from './screens/AIQuestListScreen';
import HabitScreen from './screens/HabitScreen';

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
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
          />
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
          />

          {/* ГЛАВНЫЙ ЭКРАН С НИЖНИМ МЕНЮ */}
          {/* Вместо Home, Pomodoro и т.д. используем MainTabs */}
          <Stack.Screen
            name="MainTabs"
            component={TabNavigator}
          />

          {/* Экраны, которые открываются поверх меню (без меню внизу) */}
          <Stack.Screen
            name="CreateTask"
            component={CreateTaskScreen}
          />
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  );
}