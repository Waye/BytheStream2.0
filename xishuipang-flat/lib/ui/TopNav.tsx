import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, radius, spacing, fontSize, fontFamily, themeList } from '../theme';
import { useAppStore } from '../store';
import { Button } from './Button';

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
  const user = useAppStore(s => s.user);
  const [q, setQ] = useState('');
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleAvatarPress = () => {
    if (user) router.push('/profile');
    else if (onLoginPress) onLoginPress();
    else router.push('/login');
  };

  const avatarLetter =
    user?.name?.trim()?.[0]
    ?? user?.email?.trim()?.[0]?.toUpperCase()
    ?? '我';

  return (
    <View style={{
      backgroundColor: theme.bgCanvas,
      borderBottomWidth: 1, borderBottomColor: theme.borderSoft,
      paddingHorizontal: isMobile ? spacing.lg : spacing.xl,
      paddingVertical: isMobile ? spacing.sm : spacing.md + 2,
    }}>
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

        {/* 横向滚动主题选择器 */}
        <View style={{
          maxWidth: isMobile ? 200 : 360,
          flexShrink: 1,
        }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              gap: isMobile ? 6 : 8,
              paddingHorizontal: 4,
              alignItems: 'center',
            }}
          >
            {themeList.map(t => {
              const isActive = themeName === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setTheme(t.key)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: isMobile ? 8 : 10,
                    paddingVertical: isMobile ? 5 : 6,
                    borderRadius: radius.full,
                    backgroundColor: isActive ? theme.bgElevated : theme.bgSurface,
                    borderWidth: 1,
                    borderColor: isActive ? theme.brand : theme.borderSoft,
                  }}
                >
                  <View style={{
                    width: isMobile ? 10 : 12,
                    height: isMobile ? 10 : 12,
                    borderRadius: 999,
                    backgroundColor: t.swatch,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? theme.bgElevated : 'rgba(0,0,0,0.08)',
                  }} />
                  <Text style={{
                    fontSize: isMobile ? 11 : fontSize.caption,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? theme.textPrimary : theme.textSecondary,
                  }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {user ? (
          <Pressable
            onPress={handleAvatarPress}
            style={({ pressed }) => ({
              width: isMobile ? 34 : 38,
              height: isMobile ? 34 : 38,
              borderRadius: 999,
              backgroundColor: theme.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text style={{
              color: theme.onBrand,
              fontWeight: '700',
              fontSize: isMobile ? 14 : 15,
            }}>{avatarLetter}</Text>
          </Pressable>
        ) : (
          <Button label="登录" onPress={handleAvatarPress}/>
        )}
      </View>

      <View style={{ marginTop: spacing.sm, maxWidth: isMobile ? undefined : 560 }}>
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
