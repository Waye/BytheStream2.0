import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';

export interface VolumeMeta {
  id: number;
  subtitle: string;
  count: number;
}

export function VolumeCard({
  vol, onPress,
}: {
  vol: VolumeMeta;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardWidth = isMobile ? 130 : 180;

  return (
    <Pressable onPress={onPress} style={{ width: cardWidth }}>
      <View style={{
        width: '100%', aspectRatio: 3 / 4,
        borderRadius: isMobile ? 12 : 14,
        backgroundColor: theme.gradB,
        padding: isMobile ? 12 : spacing.lg,
        justifyContent: 'space-between', overflow: 'hidden',
      }}>
        <Text style={{ color: '#fff', fontSize: isMobile ? 11 : fontSize.small, fontWeight: '600', opacity: 0.92 }}>
          溪水旁
        </Text>
        <View>
          <Text style={{
            color: '#fff', fontSize: isMobile ? 32 : 42, fontWeight: '700',
            letterSpacing: -2, lineHeight: isMobile ? 34 : 44,
          }}>{vol.id}</Text>
          <Text style={{
            color: '#fff', fontSize: isMobile ? 11 : fontSize.small, fontWeight: '600',
            opacity: 0.92, marginTop: 4,
          }}>{vol.subtitle}</Text>
        </View>
      </View>
      <View style={{ marginTop: isMobile ? 8 : spacing.md, paddingHorizontal: 4 }}>
        <Text style={{
          fontSize: isMobile ? 12 : fontSize.small, fontWeight: '700',
          color: theme.textPrimary,
        }}>第 {vol.id} 期</Text>
        <Text style={{
          fontSize: isMobile ? 10 : fontSize.caption - 1,
          color: theme.textSecondary, marginTop: 2,
        }}>{vol.count} 篇文章</Text>
      </View>
    </Pressable>
  );
}
