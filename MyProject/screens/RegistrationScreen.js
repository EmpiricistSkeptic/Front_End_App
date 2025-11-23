import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { register } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function RegistrationScreen({ navigation }) {
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmInputRef = useRef(null);

  // Мемоизированные частицы (чтобы фон не прыгал на каждый рендер)
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

  const handleRegistration = async () => {
    setErrorMessage('');

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // простая фронтенд-валидация
    if (
      !trimmedUsername ||
      !trimmedEmail ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      setErrorMessage(t('registration.errors.fillAllFields'));
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setErrorMessage(t('registration.errors.passwordsMismatch'));
      return;
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage(t('registration.errors.passwordTooShort'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage(t('registration.errors.invalidEmail'));
      return;
    }

    try {
      setLoading(true);

      await register({
        username: trimmedUsername,
        email: trimmedEmail,
        password: trimmedPassword,
        password2: trimmedConfirmPassword,
      });

      Alert.alert(
        t('registration.alerts.successTitle'),
        t('registration.alerts.successMessage'),
        [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]
      );
    } catch (error) {
      const rawMessage = error?.message || '';

      let msg = t('registration.errors.genericFail');

      if (rawMessage.includes('Network request failed')) {
        msg = t('registration.errors.networkFail');
      } else if (rawMessage) {
        // показываем то, что собрал authService.register
        msg = rawMessage;
      }

      setErrorMessage(msg);

      if (__DEV__) {
        console.error('Registration error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фоновые частицы */}
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
              <Text style={styles.headerText}>
                {t('registration.systemHeader')}
              </Text>
            </View>

            {/* Скролл-контент чтобы не ломаться на маленьких экранах */}
            <ScrollView
              style={styles.contentScroll}
              contentContainerStyle={styles.windowContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.appTitle}>
                {t('registration.title')}
              </Text>

              <View style={styles.divider} />

              <Text style={styles.welcomeText}>
                {t('registration.subtitleTitle')}
              </Text>
              <Text style={styles.subtitleText}>
                {t('registration.subtitleText')}
              </Text>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('registration.fields.usernameLabel')}
                  </Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder={t('registration.fields.usernamePlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="username"
                    autoComplete="username"
                    returnKeyType="next"
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('registration.fields.emailLabel')}
                  </Text>
                  <TextInput
                    ref={emailInputRef}
                    style={styles.inputField}
                    placeholder={t('registration.fields.emailPlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('registration.fields.passwordLabel')}
                  </Text>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.inputField}
                    placeholder={t('registration.fields.passwordPlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmInputRef.current?.focus()}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('registration.fields.confirmPasswordLabel')}
                  </Text>
                  <TextInput
                    ref={confirmInputRef}
                    style={styles.inputField}
                    placeholder={t('registration.fields.confirmPasswordPlaceholder')}
                    placeholderTextColor="rgba(200, 214, 229, 0.5)"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    returnKeyType="go"
                    onSubmitEditing={handleRegistration}
                  />
                </View>
              </View>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    {t('registration.stats.statusLabel')}
                  </Text>
                  <Text style={styles.statValue}>
                    {t('registration.stats.statusValue')}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>
                    {t('registration.stats.levelLabel')}
                  </Text>
                  <Text style={styles.statValue}>
                    {t('registration.stats.levelValue')}
                  </Text>
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
                      <Text style={styles.buttonText}>
                        {t('registration.buttons.register')}
                      </Text>
                    )}
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.loginLink} onPress={goToLogin}>
                  <Text style={styles.loginLinkText}>
                    {t('registration.buttons.toLogin')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {t('registration.footer')}
              </Text>
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
    width: width * 0.95,         // как на LoginScreen
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

  contentScroll: { flex: 1 },
  windowContent: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
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
    textAlign: 'center',
  },

  formContainer: {
    width: '100%',
    marginBottom: 15,
  },
  inputContainer: { marginBottom: 12 },
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

  buttonsContainer: { width: '100%' },
  button: {
    height: 50,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
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
