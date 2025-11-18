// LoadingScreen.js
import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { isAuthenticated } from '../services/authService';

const { width, height } = Dimensions.get('window');

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    let isActive = true;

    const verifyToken = async () => {
      const start = Date.now();

      try {
        const authed = await isAuthenticated();

        // Минимальное время показа лоадера (примерно 400ms),
        // чтобы не было "мигания" экрана
        const elapsed = Date.now() - start;
        if (elapsed < 400) {
          await new Promise(resolve => setTimeout(resolve, 400 - elapsed));
        }

        if (!isActive) return;

        navigation.replace(authed ? 'Home' : 'Welcome');
      } catch (e) {
        console.error('Auth check failed:', e);

        const elapsed = Date.now() - start;
        if (elapsed < 400) {
          await new Promise(resolve => setTimeout(resolve, 400 - elapsed));
        }

        if (!isActive) return;

        // В случае ошибки проверки авторизации — отправляем на Welcome
        navigation.replace('Welcome');
      }
    };

    verifyToken();

    return () => {
      isActive = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#121539', '#080b20']}
        style={styles.background}
      >
        <ActivityIndicator size="large" color="#4dabf7" />
        <Text style={styles.loadingText}>Checking authorization...</Text>
        <Text style={styles.subText}>SYSTEM BOOTING</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#c8d6e5',
    fontSize: 14,
  },
  subText: {
    marginTop: 4,
    color: '#4dabf7',
    fontSize: 12,
    letterSpacing: 2,
  },
});

export default LoadingScreen;
