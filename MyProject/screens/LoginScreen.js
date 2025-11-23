// LoginScreen.js
import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { login as authLogin } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const passwordInputRef = useRef(null);

  // --- Мемоизированные частицы ---
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        key: `p-${i}`,
        left: Math.random() * width,
        top: Math.random() * height,
        size: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  const handleLogin = async () => {
    setErrorMessage('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMessage(t('login.errors.fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      await authLogin({ username: trimmedUsername, password: trimmedPassword });

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      const rawMessage = error?.message || '';

      let msg = t('login.errors.genericFail');

      if (rawMessage.includes('Network request failed')) {
        msg = t('login.errors.networkFail');
      } else if (rawMessage.includes('401') || rawMessage.includes('400')) {
        msg = t('login.errors.invalidCredentials');
      } else if (rawMessage.includes('500')) {
        msg = t('login.errors.serverFail');
      }

      setErrorMessage(msg);

      if (__DEV__) {
        console.error('Login error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToRegistration = () => {
    navigation.navigate('Registration');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фон с частицами */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map(p => (
            <View
              key={p.key}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <View style={styles.statusWindow}>
            {/* Header */}
            <View style={styles.windowHeader}>
              <View style={styles.headerDot} />
              <Text style={styles.headerText}>{t('login.systemHeader')}</Text>
            </View>

            {/* Скролл-контент — чтобы на маленьких экранах всё было доступно */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.formTitle}>{t('login.title')}</Text>

              <View style={styles.divider} />

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.inputsSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('login.fields.usernameLabel')}
                  </Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder={t('login.fields.usernamePlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    autoComplete="username"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('login.fields.passwordLabel')}
                  </Text>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.inputField}
                    placeholder={t('login.fields.passwordPlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"   // чтобы пароль не начинался с заглавной
                    autoCorrect={false}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    {t('login.stats.statusLabel')}
                  </Text>
                  <Text style={styles.statValue}>
                    {t('login.stats.statusValue')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    {t('login.stats.securityLabel')}
                  </Text>
                  <Text style={styles.statValue}>
                    {t('login.stats.securityValue')}
                  </Text>
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
                    <Text style={styles.buttonText}>
                      {t('login.buttons.login')}
                    </Text>
                  )}
                </LinearGradient>
                <View style={styles.buttonGlow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={goToRegistration}
              >
                <Text style={styles.registerLinkText}>
                  {t('login.buttons.toRegistration')}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('login.footer')}</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },

  keyboardAvoider: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  particlesContainer: {
    position: 'absolute',
    width,
    height,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4dabf7',
    borderRadius: 50,
  },

  statusWindow: {
    width: width * 0.95,
    height: height * 0.9,
    maxHeight: height * 0.95,
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

  formScroll: { flex: 1 },
  formContainer: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'flex-start',
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

  inputsSection: { marginBottom: 15 },
  inputContainer: { marginBottom: 15 },
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
  statItem: { alignItems: 'center' },
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
  disabledButton: { opacity: 0.7 },
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
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4dabf7',
    shadowColor: '#4dabf7',
    shadowOpacity: 0.8,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },

  registerLink: { marginTop: 15, alignItems: 'center' },
  registerLinkText: { color: '#4dabf7', fontSize: 14 },

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
