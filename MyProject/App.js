import * as React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import './i18n/i18n';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Импортируем экраны
import LoginScreen from './screens/LoginScreen';
import RegistrationScreen from './screens/RegistrationScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import LoadingScreen from './screens/LoadingScreen';

// Экраны "второго уровня"
import GroupDetailsScreen from './screens/Groups/GroupDetailsScreen';
import CreateGroupScreen from './screens/Groups/CreateGroupScreen';
import EditGroupScreen from './screens/Groups/EditGroupScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import EditTaskScreen from './screens/EditTaskScreen';
import AssistantScreen from './screens/AssistantScreen';

// Импортируем наш навигатор табов
import TabNavigator from './navigation/TabNavigator';

import { ProfileProvider } from './context/ProfileContext';

// 1. Предотвращаем скрытие нативного экрана, пока грузится JS
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  // 2. Имитация или реальная загрузка данных перед стартом
  React.useEffect(() => {
    async function prepare() {
      try {
        // Здесь можно загружать шрифты, проверять токен и т.д.
        // Искусственная задержка, чтобы сплэш точно успел показаться и не мигал
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // 3. Скрываем нативный сплэш, когда корневой View отрисовался
  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // 4. РИСУЕМ СВОЙ СПЛЭШ НА ВЕСЬ ЭКРАН
  // Это картинка, которая будет видна пользователю вместо белых полей
  if (!appIsReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <Image
          // Убедитесь, что этот путь совпадает с вашим файлом
          source={require('./assets/splash-icon.png')}
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            resizeMode: 'cover', // Ключевой момент: растягивает на весь экран без рамок
          }}
        />
      </View>
    );
  }

  // 5. Основное приложение
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ProfileProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Loading"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Loading" component={LoadingScreen} />
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="Registration"
              component={RegistrationScreen}
              options={{ animation: 'slide_from_bottom' }}
            />

            {/* ГЛАВНЫЙ ЭКРАН С НИЖНИМ МЕНЮ */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ animation: 'slide_from_bottom' }}
            />

            {/* Детальные экраны */}
            <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="AssistantDetail" component={AssistantScreen} />
            <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditGroup" component={EditGroupScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="CreateTask" component={CreateTaskScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="EditTask" component={EditTaskScreen} options={{ animation: 'slide_from_bottom' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </ProfileProvider>
    </View>
  );
}