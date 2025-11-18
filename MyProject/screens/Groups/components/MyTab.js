// src/screens/Groups/components/MyTab.js
import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { listGroups, leaveGroup } from '../api/groupsApi';
import GroupList from './GroupList';

export default function MyTab({ search, navigation, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGroups({ scope: 'mine', search });
      setItems(res?.results || []);
    } catch (e) {
      console.log('my load error', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  }, [search, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (group) => {
    navigation.navigate('GroupDetails', { groupId: group.id, preGroup: group });
  };

  const handleLeave = async (group) => {
    try {
      await leaveGroup(group); // объект — ок
      Alert.alert('Left', `You left "${group.name}"`);
      // или убираем из списка, или ставим is_member=false
      setItems(prev => prev.filter(g => g.id !== group.id));
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to leave');
    }
  };

  return (
    <GroupList
      data={items}
      loading={loading}
      onRefresh={load}
      onPressOpen={handleOpen}
      onPressLeave={handleLeave}
    />
  );
}

