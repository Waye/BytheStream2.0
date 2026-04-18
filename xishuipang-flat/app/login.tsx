import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { TopNav, IconButton } from '../lib/ui';

export default function Login() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const goBack = () => { if (router.canGoBack?.()) router.back(); else router.replace('/'); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav onLogoPress={() => router.push('/')} onLoginPress={() => {}}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{
          maxWidth: 480, width: '100%', alignSelf: 'center',
          paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 120,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg, alignSelf: 'flex-start' }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>
        <View style={{
          padding: isMobile ? spacing.xl : 40, backgroundColor: theme.bgElevated,
          borderRadius: 24, borderWidth: 1, borderColor: theme.borderSoft,
        }}>
          <Text style={{ fontSize: isMobile ? 26 : 32, fontWeight: '700', letterSpacing: -1, color: theme.textPrimary, textAlign: 'center' }}>
            欢迎回到溪水旁
          </Text>
          <Text style={{ textAlign: 'center', fontSize: fontSize.body, color: theme.textSecondary, marginTop: 8, marginBottom: spacing.xl }}>
            登录后可同步你的收藏、阅读进度与播放队列
          </Text>
          <TextInput placeholder="邮箱地址" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bgCanvas, borderRadius: 14,
              paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: fontSize.body, color: theme.textPrimary, marginBottom: spacing.md }} />
          <TextInput placeholder="密码" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bgCanvas, borderRadius: 14,
              paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: fontSize.body, color: theme.textPrimary, marginBottom: spacing.md }} />
          <Pressable onPress={() => router.push('/profile')}
            style={({ pressed }) => ({ backgroundColor: pressed ? theme.brandHover : theme.brand, borderRadius: 14, padding: 13, alignItems: 'center', marginTop: 8 })}>
            <Text style={{ color: theme.onBrand, fontSize: fontSize.body, fontWeight: '600' }}>登录</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSoft }} />
            <Text style={{ marginHorizontal: spacing.md, color: theme.textMuted, fontSize: fontSize.caption }}>或使用第三方登录</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSoft }} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm + 2 }}>
            <OAuthBtn label="🔵 Google" onPress={() => router.push('/profile')} />
            <OAuthBtn label="🍎 Apple" onPress={() => router.push('/profile')} />
          </View>
          <Text style={{ textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.small, color: theme.textSecondary }}>
            还没有账号?{' '}<Text style={{ color: theme.brand, fontWeight: '600' }}>免费注册</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function OAuthBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, padding: 11, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
        backgroundColor: pressed ? theme.bgSurface : theme.bgCanvas, alignItems: 'center',
      })}>
      <Text style={{ fontSize: fontSize.small, fontWeight: '600', color: theme.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
