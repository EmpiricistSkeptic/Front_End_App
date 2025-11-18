import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  inputBg: 'rgba(16, 20, 45, 0.9)',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  textPrimary: '#ffffff',
  placeholder: '#5f7191',
};

export default function MessageInput({ onSend, sending }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const t = (text || '').trim();
    if (!t || sending) return;
    onSend?.(t);
    setText('');
  };

  return (
    <View
      style={{
        paddingHorizontal: 15,
        paddingBottom: Platform.OS === 'ios' ? 20 : 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(77, 171, 247, 0.3)',
        backgroundColor: 'rgba(8, 11, 32, 0.95)',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          backgroundColor: COLORS.inputBg,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.borderBlue,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            color: COLORS.textPrimary,
            fontSize: 15,
            paddingVertical: 8,
            maxHeight: 120,
          }}
          placeholder="Write a message..."
          placeholderTextColor={COLORS.placeholder}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !text.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: sending || !text.trim() ? '#5f7191' : COLORS.accentBlue,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#080b20" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#080b20" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

