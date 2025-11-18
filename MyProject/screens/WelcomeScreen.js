// WelcomeScreen.js
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  // Мемоизированные частицы, чтобы не прыгали на каждый рендер
  const particles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        id: i,
        left: Math.random() * width,
        top: Math.random() * height,
        w: Math.random() * 4 + 1,
        h: Math.random() * 4 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      })),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#121539', '#080b20']} style={styles.background}>
        {/* Фоновые частицы */}
        <View style={styles.particlesContainer} pointerEvents="none">
          {particles.map((p) => (
            <View
              key={p.id}
              style={[
                styles.particle,
                {
                  left: p.left,
                  top: p.top,
                  width: p.w,
                  height: p.h,
                  opacity: p.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* ScrollView, чтобы на маленьких экранах всё можно было увидеть */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statusWindow}>
            {/* Header окна */}
            <View className="window-header" style={styles.windowHeader}>
              <View style={styles.headerDot} />
              <Text style={styles.headerText}>SYSTEM</Text>
            </View>

            {/* Content */}
            <View style={styles.windowContent}>
              <Text style={styles.appTitle}>LEVEL UP</Text>

              <View style={styles.divider} />

              <Text style={styles.welcomeText}>WELCOME, HUNTER</Text>
              <Text style={styles.subtitleText}>
                Please log in or register to continue
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>STATUS</Text>
                  <Text style={styles.statValue}>STANDBY</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>ACCESS</Text>
                  <Text style={styles.statValue}>PENDING</Text>
                </View>
              </View>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => navigation.navigate('Login')}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>LOG IN</Text>
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { marginTop: 15 }]}
                  onPress={() => navigation.navigate('Registration')}
                >
                  <LinearGradient
                    colors={['#4dabf7', '#3250b4']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.buttonText}>REGISTER</Text>
                  </LinearGradient>
                  <View style={styles.buttonGlow} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>HUNTER ASSOCIATION</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080b20',
  },
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusWindow: {
    width: width * 0.9,                // шире, как на экране логина
    minHeight: height * 0.8,           // высокий, на весь экран
    maxHeight: height * 0.9,
    backgroundColor: 'rgba(16, 20, 45, 0.75)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4dabf7',
    overflow: 'hidden',
    justifyContent: 'space-between',
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
    fontSize: 36,
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
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitleText: {
    color: '#c8d6e5',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 25,
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
});



