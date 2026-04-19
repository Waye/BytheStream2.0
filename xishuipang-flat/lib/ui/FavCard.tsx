import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';
import { ContentItem } from '../store';

export function FavCard({ item, onPress }: { item: ContentItem; onPress: () => void }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <Pressable
      onPress={onPress}
      style={{
        width: isMobile ? 220 : 238, // 桌面 280 → 238 (-15%)
        backgroundColor: theme.bgElevated,
        borderRadius: isMobile ? 14 : radius.btn,
        padding: isMobile ? 10 : spacing.md + 2,
        flexDirection: 'row', alignItems: 'center', gap: isMobile ? 10 : spacing.md + 2,
        borderWidth: 1, borderColor: theme.borderSoft,
      }}
    >
      <View style={{
        width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: isMobile ? 8 : 10,
        backgroundColor: theme.brand,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: theme.onBrand, fontSize: isMobile ? 14 : 18, fontWeight: '700' }}>
          {item.title.slice(0, 1)}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontSize: isMobile ? 12 : fontSize.small, fontWeight: '700', color: theme.textPrimary,
        }}>{item.title}</Text>
        <Text numberOfLines={1} style={{
          fontSize: isMobile ? 10 : fontSize.caption - 1, color: theme.textSecondary, marginTop: 2,
        }}>{item.author} · 第 {item.volume} 期</Text>
      </View>
    </Pressable>
  );
}
