import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, fontSize, spacing } from '../theme';

export function SectionHead({
  title, linkLabel, onLinkPress,
}: {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginTop: isMobile ? 28 : 44, marginBottom: isMobile ? 12 : 18,
    }}>
      <Text style={{
        fontSize: isMobile ? 20 : 26, fontWeight: '700',
        letterSpacing: -0.8,
        color: theme.textPrimary,
      }}>{title}</Text>
      {linkLabel && (
        <Pressable onPress={onLinkPress}>
          <Text style={{
            fontSize: isMobile ? 12 : fontSize.small, fontWeight: '600',
            color: theme.textSecondary,
          }}>{linkLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
