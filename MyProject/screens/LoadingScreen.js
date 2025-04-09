// LoadingScreen.js или добавьте в App.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { checkAuth } from '../services/authService';

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const verifyToken = async () => {
      const isAuthenticated = await checkAuth();
      
      if (isAuthenticated) {
        navigation.replace('Home'); // Перенаправление на главный экран
      } else {
        navigation.replace('Login'); // Перенаправление на экран входа
      }
    };

    verifyToken();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingScreen;