import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing, fontSize, fontFamily, ThemeName } from '../theme';
import { useAppStore } from '../store';
import { Button } from './Button';

const THEMES: { key: ThemeName; label: string }[] = [
  { key: 'light', label: '暖白' },
  { key: 'dark', label: '深色' },
  { key: 'sepia', label: '护眼' },
];

export function TopNav({
  onLogoPress, onLoginPress, onSearchSubmit,
}: {
  onLogoPress?: () => void;
  onLoginPress?: () => void;
  onSearchSubmit?: (q: string) => void;
}) {
  const { theme } = useTheme();
  const themeName = useAppStore(s => s.theme);
  const setTheme = useAppStore(s => s.setTheme);
  const [q, setQ] = useState('');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{
      backgroundColor: theme.bgCanvas,
      borderBottomWidth: 1, borderBottomColor: theme.borderSoft,
      paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
      paddingVertical: isMobile ? spacing.sm : spacing.md + 2,
    }}>
      {/* 第一行: Logo + 主题切换 + 登录 */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        gap: isMobile ? spacing.sm : spacing.lg,
      }}>
        <Pressable onPress={onLogoPress}>
          <Text style={{
            fontSize: isMobile ? 20 : 24, fontWeight: '700',
            color: theme.brand, letterSpacing: 2,
            fontFamily: fontFamily.serif,
          }}>溪水旁</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        <View style={{
          flexDirection: 'row', gap: 3, padding: 3,
          backgroundColor: theme.bgSurface,
          borderRadius: 12,
          borderWidth: 1, borderColor: theme.borderSoft,
        }}>
          {THEMES.map(t => (
            <Pressable
              key={t.key}
              onPress={() => setTheme(t.key)}
              style={{
                paddingHorizontal: isMobile ? 8 : spacing.md,
                paddingVertical: isMobile ? 4 : 6,
                borderRadius: 8,
                backgroundColor: themeName === t.key ? theme.bgElevated : 'transparent',
              }}
            >
              <Text style={{
                fontSize: isMobile ? 11 : fontSize.caption,
                fontWeight: themeName === t.key ? '700' : '500',
                color: themeName === t.key ? theme.textPrimary : theme.textSecondary,
              }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Button label="登录" onPress={onLoginPress}/>
      </View>

      {/* 第二行: 搜索框 (移动端独占一行) */}
      <View style={{ marginTop: isMobile ? spacing.sm : spacing.sm, maxWidth: isMobile ? undefined : 560 }}>
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={() => q && onSearchSubmit?.(q)}
          placeholder="搜索文章、作者、主题..."
          placeholderTextColor={theme.textMuted}
          style={{
            backgroundColor: theme.bgSurface,
            borderWidth: 1, borderColor: theme.borderSoft,
            borderRadius: radius.btn,
            paddingHorizontal: spacing.lg, paddingVertical: isMobile ? 8 : 11,
            fontSize: isMobile ? fontSize.small : fontSize.body,
            color: theme.textPrimary,
          }}
        />
      </View>
    </View>
  );
}
