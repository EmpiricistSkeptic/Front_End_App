import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const getIcon = (routeName, color) => {
  const size = 24;
  switch (routeName) {
    case 'Tasks':      return <MaterialCommunityIcons name="sword-cross" size={size} color={color} />;
    case 'Timer':      return <MaterialIcons name="timer" size={size} color={color} />;
    case 'Calories':   return <MaterialCommunityIcons name="food-apple" size={size} color={color} />;
    case 'Guild':      return <Ionicons name="people" size={size} color={color} />;
    case 'Assistant':  return <Ionicons name="hardware-chip-outline" size={size} color={color} />;
    default:           return <MaterialCommunityIcons name="circle" size={size} color={color} />;
  }
};

export default function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets(); 

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(16, 20, 45, 0.98)', 'rgba(16, 20, 45, 0.9)']}
        style={[
          styles.gradient,
          { 
            // Динамический отступ снизу (для iPhone и Android жестов)
            paddingBottom: Math.max(insets.bottom, 10),
            height: 60 + Math.max(insets.bottom, 10) 
          }
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          // Используем tabBarLabel или title для текста
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const color = isFocused ? '#4dabf7' : '#c8d6e5';

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              {getIcon(label, color)}
              <Text style={[styles.tabText, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  gradient: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(77, 171, 247, 0.3)',
    paddingTop: 10,
    elevation: 10, // Тень для Android
    shadowColor: '#000', // Тень для iOS
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tabText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
});
