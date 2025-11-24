import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GroupsHomeScreen from '../screens/Groups/GroupsHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// 👇 2. Если там есть редактирование, добавь и его
import EditGroupScreen from '../screens/Groups/EditGroupScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';

const Stack = createNativeStackNavigator();

export default function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsHomeMain" component={GroupsHomeScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
      
      {/* Профиль доступен внутри стека */}
      <Stack.Screen name="Profile" component={ProfileScreen} options={{
              animation: 'slide_from_bottom' // Можно добавить красивую анимацию появления
            }} />
      
    </Stack.Navigator>
  );
}