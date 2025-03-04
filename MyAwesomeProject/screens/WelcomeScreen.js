import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
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
          
          {/* Status Window Content */}
          <View style={styles.windowContent}>
            <Text style={styles.appTitle}>LEVEL UP</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.welcomeText}>WELCOME, HUNTER</Text>
            <Text style={styles.subtitleText}>Please log in or register to continue</Text>
            
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
    justifyContent: 'center', // можно изменить на 'flex-start', если нужно еще больше отодвинуть содержимое от верха
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
    minHeight: height * 0.7, // расширяет окно по высоте
    justifyContent: 'space-between', // распределяет содержимое по вертикали
    marginVertical: 30, // отступы сверху и снизу
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


