import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { saveToken } from '../services/authService'; // Импортируем функцию сохранения токена

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  // Состояния для хранения введенных пользователем данных
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Функция для отправки данных на сервер
  const handleLogin = async () => {
    // Сбросить сообщение об ошибке
    setErrorMessage('');
    
    // Проверки валидности введенных данных
    if (!username || !password) {
      setErrorMessage('Пожалуйста, введите имя пользователя и пароль');
      return;
    }
    
    try {
      setLoading(true);
      
      // Отправка запроса на аутентификацию
      const response = await fetch('https://drf-project-6vzx.onrender.com/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Обработка ошибок от API
        throw new Error(data.detail || 'Неверное имя пользователя или пароль');
      }
      
      // Сохранение токена аутентификации с использованием нашего сервиса
      if (data.token) {
        // Вместо прямого сохранения в AsyncStorage используем наш сервис
        await saveToken(data.token);
        
        // Если в ответе есть дополнительные данные пользователя, можно также сохранить их
        // Это можно также перенести в отдельную функцию в authService, если нужно
        if (data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        // Переход на главный экран приложения
        navigation.navigate('Home');
      } else {
        throw new Error('Токен не получен');
      }
      
    } catch (error) {
      // Отображение ошибки пользователю
      setErrorMessage(`Ошибка входа: ${error.message}`);
      console.error('Ошибка входа:', error);
    } finally {
      setLoading(false);
    }
  };

  // Функция для перехода на экран регистрации
  const goToRegistration = () => {
    navigation.navigate('Registration');
  };

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
        
        <View style={styles.statusWindow}>
          {/* Status Window Header */}
          <View style={styles.windowHeader}>
            <View style={styles.headerDot} />
            <Text style={styles.headerText}>SYSTEM</Text>
          </View>
          
          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>
              LOGIN
            </Text>
            
            <View style={styles.divider} />

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            <View style={styles.inputsSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter username"
                  placeholderTextColor="rgba(200, 214, 229, 0.5)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter password"
                  placeholderTextColor="rgba(200, 214, 229, 0.5)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STATUS</Text>
                <Text style={styles.statValue}>VERIFICATION</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SECURITY</Text>
                <Text style={styles.statValue}>LEVEL 1</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#4dabf7', '#3250b4']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>LOG IN</Text>
                )}
              </LinearGradient>
              <View style={styles.buttonGlow} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={goToRegistration}
            >
              <Text style={styles.registerLinkText}>
                Don't have an account? REGISTER
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>HUNTER ASSOCIATION</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  // стили остаются без изменений
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusWindow: {
    width: width * 0.85,
    height: height * 0.8,
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
  },
  windowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3250b4',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4dabf7',
    marginRight: 8,
  },
  headerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  formTitle: {
    color: '#4dabf7',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#4dabf7',
    marginVertical: 15,
    opacity: 0.5,
  },
  inputsSection: {
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    color: '#c8d6e5',
    fontSize: 12,
    marginBottom: 5,
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: 'rgba(16, 24, 48, 0.8)',
    borderWidth: 1,
    borderColor: '#3250b4',
    color: '#ffffff',
    height: 45,
    paddingHorizontal: 10,
    borderRadius: 4,
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#c8d6e5',
    fontSize: 12,
    marginBottom: 5,
  },
  statValue: {
    color: '#4dabf7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 15,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  buttonGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4dabf7',
    shadowColor: '#4dabf7',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  registerLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#4dabf7',
    fontSize: 14,
  },
  footer: {
    backgroundColor: 'rgba(16, 20, 45, 0.9)',
    padding: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#3250b4',
  },
  footerText: {
    color: '#4dabf7',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#dc3545',
    marginBottom: 15,
    width: '100%',
  },
  errorText: {
    color: '#ff8a8a',
    textAlign: 'center',
  },
});

export default LoginScreen;