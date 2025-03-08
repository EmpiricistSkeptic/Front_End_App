import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function RegistrationScreen({ navigation }) {
  // Состояния для хранения введенных пользователем данных
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Функция для отправки данных на сервер
  const handleRegistration = async () => {
    // Сбросить сообщение об ошибке
    setErrorMessage('');
    
    // Проверки валидности введенных данных
    if (!username || !email || !password || !confirmPassword) {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Пароли не совпадают');
      return;
    }
    
    // Базовая проверка формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Пожалуйста, введите корректный email');
      return;
    }
    
    try {
      setLoading(true);
      
      // Отправка запроса на регистрацию
      const response = await fetch('https://drf-project-6vzx.onrender.com/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Обработка ошибок от API
        throw new Error(data.detail || JSON.stringify(data));
      }
      
      // Регистрация успешна
      Alert.alert('Успешно', 'Вы успешно зарегистрировались!', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
      
    } catch (error) {
      // Отображение ошибки пользователю
      setErrorMessage(`Ошибка регистрации: ${error.message}`);
      console.error('Ошибка регистрации:', error);
    } finally {
      setLoading(false);
    }
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
          
          {/* Registration Form Content */}
          <View style={styles.windowContent}>
            <Text style={styles.appTitle}>REGISTRATION</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.welcomeText}>NEW HUNTER</Text>
            <Text style={styles.subtitleText}>Create your hunter profile</Text>
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>USERNAME</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter username"
                  placeholderTextColor="rgba(200, 214, 229, 0.5)"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>EMAIL</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Enter email"
                  placeholderTextColor="rgba(200, 214, 229, 0.5)"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
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
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Confirm password"
                  placeholderTextColor="rgba(200, 214, 229, 0.5)"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STATUS</Text>
                <Text style={styles.statValue}>REGISTRATION</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>LEVEL</Text>
                <Text style={styles.statValue}>INIT</Text>
              </View>
            </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, loading && styles.disabledButton]} 
                onPress={handleRegistration}
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
                    <Text style={styles.buttonText}>REGISTER</Text>
                  )}
                </LinearGradient>
                <View style={styles.buttonGlow} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.loginLink} 
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>Already have an account? LOG IN</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>HUNTER ASSOCIATION</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
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
  windowContent: {
    padding: 20,
    alignItems: 'center',
  },
  appTitle: {
    color: '#4dabf7',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
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
  welcomeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 5,
  },
  subtitleText: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 15,
  },
  formContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 12,
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
  buttonsContainer: {
    width: '100%',
  },
  button: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
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
  loginLink: {
    marginTop: 15,
    alignItems: 'center',
  },
  loginLinkText: {
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