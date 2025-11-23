import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics'; 
// 👇 1. Импортируем хук перевода
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function LevelUpModal({ visible, level, onClose }) {
  // 👇 2. Инициализируем перевод
  const { t } = useTranslation();

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      scaleAnim.setValue(0.8);
      fadeAnim.setValue(0);
      glowAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 1500,
              useNativeDriver: true,
            }),
          ])
        ).start(),
      ]).start();
    }
  }, [visible]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.overlay}>
        <View style={styles.backdrop} />

        <Animated.View
          style={[
            styles.cardContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              shadowOpacity: glowOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(18, 21, 57, 0.95)', 'rgba(8, 11, 32, 0.98)']}
            style={styles.cardGradient}
          >
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Header */}
            <View style={styles.systemHeader}>
              <View style={styles.alertIcon}>
                <Text style={styles.exclamation}>!</Text>
              </View>
              {/* 👇 Замена текста */}
              <Text style={styles.systemTitle}>{t('levelUp.systemTitle')}</Text>
            </View>

            <View style={styles.separator} />

            {/* Content */}
            <View style={styles.contentContainer}>
              {/* 👇 Замена текста */}
              <Text style={styles.congratsText}>{t('levelUp.title')}</Text>
              
              <View style={styles.levelValueContainer}>
                {/* 👇 Замена текста */}
                <Text style={styles.levelLabel}>{t('levelUp.currentLevelLabel')}</Text>
                <Text style={styles.levelValue}>{level}</Text>
              </View>

              {/* 👇 Замена текста */}
              <Text style={styles.descText}>
                {t('levelUp.description')}
              </Text>
              <Text style={styles.subText}>
                {t('levelUp.subDescription')}
              </Text>
            </View>

            {/* Button */}
            <TouchableOpacity 
              style={styles.buttonContainer} 
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['rgba(77, 171, 247, 0.1)', 'rgba(77, 171, 247, 0.3)']}
                style={styles.buttonGradient}
              >
                {/* 👇 Замена текста */}
                <Text style={styles.buttonText}>{t('levelUp.button')}</Text>
              </LinearGradient>
              <View style={styles.buttonBorder} />
            </TouchableOpacity>

          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ... стили остаются без изменений ...
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  cardContainer: {
    width: width * 0.85,
    maxWidth: 400,
    shadowColor: '#4dabf7',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 15,
  },
  cardGradient: {
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(77, 171, 247, 0.5)',
    padding: 2,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderColor: '#4dabf7',
    zIndex: 10,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },

  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
  },
  alertIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exclamation: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  systemTitle: {
    color: '#c8d6e5',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(77, 171, 247, 0.3)',
    width: '100%',
  },

  contentContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  congratsText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#4dabf7',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginBottom: 20,
  },
  levelValueContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelLabel: {
    color: '#8899a6',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 5,
  },
  levelValue: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#ff9500',
    textShadowColor: 'rgba(255, 149, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    includeFontPadding: false,
  },
  descText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  subText: {
    fontSize: 14,
    color: '#c8d6e5',
    textAlign: 'center',
    opacity: 0.7,
  },

  buttonContainer: {
    margin: 15,
    height: 50,
    justifyContent: 'center',
    position: 'relative',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  buttonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: '#4dabf7',
    borderRadius: 2,
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 3,
    textShadowColor: '#4dabf7',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});