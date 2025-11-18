// src/screens/Groups/components/GroupCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const COLORS = {
  cardBg: 'rgba(16, 20, 45, 0.75)',
  accentBlue: '#4dabf7',
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  danger: '#ff7675',
  chipBg: 'rgba(26,30,60,0.6)',
  divider: 'rgba(77,171,247,0.2)',
};

const HIT = { top: 8, bottom: 8, left: 8, right: 8 };

export default function GroupCard({
  item,
  onPressOpen,
  onPressJoin,
  onPressLeave,
  onPressDelete, // <- передай, если хочешь кнопку Delete для владельца
}) {
  const isMember = !!item?.is_member;
  const isPublic = !!item?.is_public;
  const isAdmin  = !!item?.is_admin;
  const isOwner  = !!item?.is_owner;

  const canJoin  = isPublic && !isMember;
  const canLeave = isMember && !isOwner; // владельцу не показываем Leave
  const canDelete = isOwner && typeof onPressDelete === 'function';

  return (
    <View
      style={{
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.borderBlue,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 10,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.divider,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{ color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' }}
            numberOfLines={1}
          >
            {item?.name || '—'}
          </Text>
          {!!item?.description && (
            <Text
              style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>

        {/* статус public/private */}
        <View
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: COLORS.borderBlue,
            backgroundColor: COLORS.chipBg,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Ionicons
            name={isPublic ? 'earth' : 'lock-closed'}
            size={12}
            color={COLORS.textSecondary}
          />
          <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>
            {isPublic ? 'Public' : 'Private'}
          </Text>
        </View>
      </View>

      {/* Meta */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={18}
            color={COLORS.placeholder}
          />
          <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 6 }}>
            {item?.members_count ?? 0} members
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="person-circle-outline" size={18} color={COLORS.placeholder} />
          <Text
            style={{ color: COLORS.textSecondary, fontSize: 12, marginLeft: 6 }}
            numberOfLines={1}
          >
            by {item?.owner_username || 'unknown'}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* бейджи ролей */}
        {isOwner && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              backgroundColor: COLORS.chipBg,
              marginLeft: 6,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Owner</Text>
          </View>
        )}
        {!isOwner && isAdmin && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              backgroundColor: COLORS.chipBg,
              marginLeft: 6,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Admin</Text>
          </View>
        )}
        {isMember && !isOwner && !isAdmin && (
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.borderBlue,
              backgroundColor: COLORS.chipBg,
              marginLeft: 6,
            }}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 11 }}>Member</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingBottom: 12,
          paddingTop: 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <TouchableOpacity
          hitSlop={HIT}
          onPress={() => onPressOpen && onPressOpen(item)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: COLORS.accentBlue,
          }}
        >
          <Text style={{ color: COLORS.accentBlue, fontWeight: '700' }}>View</Text>
        </TouchableOpacity>

        {canJoin && onPressJoin && item?.id ? (
          <TouchableOpacity
            hitSlop={HIT}
            onPress={() => onPressJoin(item)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 22,
              backgroundColor: COLORS.accentBlue,
            }}
          >
            <Text style={{ color: '#080b20', fontWeight: '800' }}>Join</Text>
          </TouchableOpacity>
        ) : null}

        {canLeave && onPressLeave && item?.id ? (
          <TouchableOpacity
            hitSlop={HIT}
            onPress={() => onPressLeave(item)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: COLORS.accentBlue,
            }}
          >
            <Text style={{ color: COLORS.accentBlue, fontWeight: '700' }}>Leave</Text>
          </TouchableOpacity>
        ) : null}

        {canDelete ? (
          <TouchableOpacity
            hitSlop={HIT}
            onPress={() => onPressDelete(item)}
            style={{
              marginLeft: 'auto',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 22,
              borderWidth: 1,
              borderColor: COLORS.danger,
            }}
          >
            <Text style={{ color: COLORS.danger, fontWeight: '800' }}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}




