// src/screens/Nutrition/components/NutritionSummary.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  textPrimary: '#ffffff',
  textSecondary: '#c8d6e5',
  placeholder: '#5f7191',
  borderBlue: '#3250b4',
  accentBlue: '#4dabf7',
  cardBg: 'rgba(16, 20, 45, 0.75)',
};

export default function NutritionSummary({ summary, onOpenGoals }) {
  const totalCalories  = Math.round(summary?.total_calories || 0);
  const caloriesGoal   = Math.round(summary?.calories_goal || 0);
  const remainCalories = Math.round(summary?.remaining?.calories ?? 0);

  const totalProteins  = Math.round(summary?.total_proteins || 0);
  const totalFats      = Math.round(summary?.total_fats || 0);
  const totalCarbs     = Math.round(summary?.total_carbs || 0);

  const proteinsGoal   = Math.round(summary?.proteins_goal || 0);
  const fatsGoal       = Math.round(summary?.fats_goal || 0);
  const carbsGoal      = Math.round(summary?.carbs_goal || 0);

  return (
    <View style={{
      backgroundColor: COLORS.cardBg,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: COLORS.borderBlue,
      marginBottom: 16,
    }}>
      {/* Заголовок + кнопка редактирования */}
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
        <View>
          <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 }}>Сегодня</Text>
          <Text style={{ color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold' }}>
            {totalCalories} / {caloriesGoal} kcal
          </Text>
        </View>
        <TouchableOpacity onPress={onOpenGoals} style={{ paddingHorizontal: 10, paddingVertical: 6 }}>
          <Ionicons name="create-outline" size={18} color={COLORS.accentBlue} />
        </TouchableOpacity>
      </View>

      <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginTop: 4 }}>
        Осталось: {remainCalories} kcal
      </Text>

      <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12 }}>
        <View style={{ flex:1, marginHorizontal:4 }}>
          <Text style={{ color: COLORS.placeholder, fontSize:12 }}>Белки</Text>
          <Text style={{ color: COLORS.textPrimary, fontSize:14, fontWeight:'600' }}>
            {totalProteins} / {proteinsGoal} г
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize:11 }}>
            Осталось: {Math.round((summary?.remaining?.proteins ?? 0))} г
          </Text>
        </View>
        <View style={{ flex:1, marginHorizontal:4 }}>
          <Text style={{ color: COLORS.placeholder, fontSize:12 }}>Жиры</Text>
          <Text style={{ color: COLORS.textPrimary, fontSize:14, fontWeight:'600' }}>
            {totalFats} / {fatsGoal} г
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize:11 }}>
            Осталось: {Math.round((summary?.remaining?.fats ?? 0))} г
          </Text>
        </View>
        <View style={{ flex:1, marginHorizontal:4 }}>
          <Text style={{ color: COLORS.placeholder, fontSize:12 }}>Углеводы</Text>
          <Text style={{ color: COLORS.textPrimary, fontSize:14, fontWeight:'600' }}>
            {totalCarbs} / {carbsGoal} г
          </Text>
          <Text style={{ color: COLORS.textSecondary, fontSize:11 }}>
            Осталось: {Math.round((summary?.remaining?.carbs ?? 0))} г
          </Text>
        </View>
      </View>
    </View>
  );
}



