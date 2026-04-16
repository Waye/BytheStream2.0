import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTheme, fontSize, spacing } from '../theme';

export function Placeholder({ title, route }: { title: string; route: string }) {
  const { theme } = useTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: theme.bgCanvas,
      alignItems: 'center', justifyContent: 'center',
      padding: spacing.xl,
    }}>
      <Text style={{
        fontSize: fontSize.h1, fontWeight: '700',
        color: theme.textPrimary, letterSpacing: -1,
      }}>{title}</Text>
      <Text style={{
        marginTop: spacing.md, fontSize: fontSize.body,
        color: theme.textSecondary, textAlign: 'center',
      }}>批次 2 待实现 · 路由 {route}</Text>
      <Pressable
        onPress={() => router.replace('/')}
        style={{
          marginTop: spacing.xl,
          paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
          backgroundColor: theme.brand, borderRadius: 16,
        }}
      >
        <Text style={{ color: theme.onBrand, fontWeight: '600' }}>返回首页</Text>
      </Pressable>
    </View>
  );
}
