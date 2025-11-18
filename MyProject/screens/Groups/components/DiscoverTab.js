// src/screens/Groups/components/DiscoverTab.js
import React, { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { listGroups, joinGroup } from '../api/groupsApi';
import GroupList from './GroupList';

export default function DiscoverTab({ search, navigation, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listGroups({ scope: 'discover', search });
      setItems(res?.results || []);
    } catch (e) {
      console.log('discover load error', e?.response?.data || e?.message);
    } finally {
      setLoading(false);
    }
  }, [search, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoin = async (group) => {
    try {
      await joinGroup(group); // передаём весь объект; API достанет id
      setItems((prev) =>
        prev.map(g => g.id === group.id ? { ...g, is_member: true, members_count: (g.members_count || 0) + 1 } : g)
      );
      Alert.alert('Joined', `You joined "${group.name}"`);
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to join');
    }
  };

  const handleOpen = (group) => {
    navigation.navigate('GroupDetails', { groupId: group.id, preGroup: group });
  };

  return (
    <GroupList
      data={items}
      loading={loading}
      onRefresh={load}
      onPressJoin={handleJoin}
      onPressOpen={handleOpen}
    />
  );
}




