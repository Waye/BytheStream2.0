import React from 'react';
import { View, Text } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';

export function EmptyHint({ children }: { children: string }) {
  const { theme } = useTheme();
  return (
    <View style={{
      padding: 40, alignItems: 'center',
      backgroundColor: theme.bgSurface,
      borderRadius: radius.btn,
    }}>
      <Text style={{ color: theme.textMuted, fontSize: fontSize.body }}>
        {children}
      </Text>
    </View>
  );
}
