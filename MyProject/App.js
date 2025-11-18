import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import CaloriesScreen from './screens/Nutrition/CaloriesScreen';
import AssistantScreen from './screens/AssistantScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import TaskScreen from './screens/TaskScreen';
import AIQuestListScreen from './screens/AIQuestListScreen';
import HabitScreen from './screens/HabitScreen';
import LoadingScreen from './screens/LoadingScreen';

import GroupsHomeScreen from './screens/Groups/GroupsHomeScreen';
import GroupDetailsScreen from './screens/Groups/GroupDetailsScreen';
import CreateGroupScreen from './screens/Groups/CreateGroupScreen';
import EditGroupScreen from './screens/Groups/EditGroupScreen';

// 🔹 ВАЖНО: импортируем ProfileProvider
import { ProfileProvider } from './context/ProfileContext'; // путь подгони под свой проект

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
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Вход' }}
          />
          <Stack.Screen
            name="Registration"
            component={RegistrationScreen}
            options={{ title: 'Регистрация' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'Главная' }}
          />
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ title: 'Добро Пожаловать' }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Профиль' }}
          />
          <Stack.Screen
            name="Pomodoro"
            component={PomodoroScreen}
            options={{ title: 'Таймер' }}
          />
          <Stack.Screen
            name="Nutrition"
            component={CaloriesScreen}
            options={{ title: 'Питание' }}
          />
          <Stack.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{ title: 'Assistant' }}
          />
          <Stack.Screen
            name="GroupsHome"
            component={GroupsHomeScreen}
            options={{ title: 'Группы' }}
          />
          <Stack.Screen
            name="GroupDetails"
            component={GroupDetailsScreen}
            options={{ title: 'Группа' }}
          />
          <Stack.Screen
            name="CreateGroup"
            component={CreateGroupScreen}
            options={{ title: 'Создать группу' }}
          />
          <Stack.Screen
            name="EditGroup"
            component={EditGroupScreen}
            options={{ title: 'Редактирование' }}
          />
          <Stack.Screen
            name="Groups"
            component={GroupsHomeScreen}
            options={{ title: 'Группы' }}
          />
          <Stack.Screen
            name="CreateTask"
            component={CreateTaskScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditTask"
            component={EditTaskScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="TaskScreen"
            component={TaskScreen}
            options={{ title: 'Tasks' }}
          />
          <Stack.Screen
            name="QuestScreen"
            component={AIQuestListScreen}
            options={{ title: 'Quests' }}
          />
          <Stack.Screen
            name="HabitScreen"
            component={HabitScreen}
            options={{ title: 'Habits' }}
          />
          <Stack.Screen
            name="Loading"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ProfileProvider>
  );
}

