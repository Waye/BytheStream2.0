import React from 'react';
import { Pressable, Text, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';

export function Button({
  label, onPress, variant = 'primary', style,
}: {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: isPrimary
            ? (pressed ? theme.brandHover : theme.brand)
            : theme.surfaceBtn,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg + 2,
          borderRadius: radius.btn,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text style={{
        color: isPrimary ? theme.onBrand : theme.textPrimary,
        fontSize: fontSize.small,
        fontWeight: '600',
      }}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon, onPress, active = false, size = 38, style,
}: {
  icon: string;
  onPress?: () => void;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: active
            ? theme.brand
            : pressed ? theme.brandSoft : theme.surfaceCircle,
          alignItems: 'center', justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{
        color: active ? theme.onBrand : theme.textPrimary,
        fontSize: size * 0.4,
      }}>{icon}</Text>
    </Pressable>
  );
}
