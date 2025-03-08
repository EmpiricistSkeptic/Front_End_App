import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import CaloriesScreen from './screens/CaloriesScreen';
import EducationalScreen from './screens/EducationalScreen';
import GroupsScreen from './screens/GroupScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
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
          name="Main" 
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
          name="Learn" 
          component={EducationalScreen} 
          options={{ title: 'Образование' }} 
        />
        <Stack.Screen 
          name="Groups" 
          component={GroupsScreen} 
          options={{ title: 'Группы' }} 
        />
        <Stack.Screen 
          name="CreateTask" 
          component={CreateTaskScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
