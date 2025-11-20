import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import GroupsHomeScreen from '../screens/Groups/GroupsHomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
// 👇 1. Импортируй детали
import GroupDetailsScreen from '../screens/Groups/GroupDetailsScreen'; 
// 👇 2. Если там есть редактирование, добавь и его
import EditGroupScreen from '../screens/Groups/EditGroupScreen';
import CreateGroupScreen from '../screens/Groups/CreateGroupScreen';

const Stack = createNativeStackNavigator();

export default function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GroupsHomeMain" component={GroupsHomeScreen} />
      
      {/* Профиль доступен внутри стека */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      
      {/* 👇 Теперь детали группы открываются ТОЖЕ внутри стека */}
      <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
      
      {/* 👇 Редактирование тоже тут, чтобы после него вернуться назад корректно */}
      <Stack.Screen name="EditGroup" component={EditGroupScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
    </Stack.Navigator>
  );
}