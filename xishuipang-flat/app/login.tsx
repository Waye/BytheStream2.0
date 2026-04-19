import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { TopNav, IconButton } from '../lib/ui';
import { LOGIN_OR_REGISTER } from '../lib/graphql';
import { useAppStore } from '../lib/store';
import {
  useGoogleAuth, handleGoogleResponse,
  useFacebookAuth, handleFacebookResponse,
} from '../lib/auth';

export default function Login() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loginSuccess = useAppStore(s => s.loginSuccess);
  const [loginOrRegister] = useMutation(LOGIN_OR_REGISTER);

  // OAuth hooks
  const [googleReq, googleRes, promptGoogle] = useGoogleAuth();
  const [fbReq, fbRes, promptFacebook] = useFacebookAuth();

  useEffect(() => {
    if (!googleRes) return;
    (async () => {
      if (googleRes.type !== 'success') {
        if (googleRes.type === 'error') setErr('Google 登录失败');
        return;
      }
      setBusy(true);
      try {
        const user = await handleGoogleResponse(googleRes);
        if (user) router.replace('/profile');
      } catch (e: any) {
        setErr(e?.message || 'Google 登录失败');
      } finally {
        setBusy(false);
      }
    })();
  }, [googleRes]);

  useEffect(() => {
    if (!fbRes) return;
    (async () => {
      if (fbRes.type !== 'success') {
        if (fbRes.type === 'error') setErr('Facebook 登录失败');
        return;
      }
      setBusy(true);
      try {
        const user = await handleFacebookResponse(fbRes);
        if (user) router.replace('/profile');
      } catch (e: any) {
        setErr(e?.message || 'Facebook 登录失败');
      } finally {
        setBusy(false);
      }
    })();
  }, [fbRes]);

  const onEmailLogin = async () => {
    if (!email.trim()) { setErr('请输入邮箱'); return; }
    setBusy(true);
    setErr(null);
    try {
      const { data } = await loginOrRegister({
        variables: { email: email.trim(), name: name.trim() || undefined },
      });
      const payload = data?.loginOrRegister;
      if (payload) {
        await loginSuccess(payload.user, payload.token);
        router.replace('/profile');
      }
    } catch (e: any) {
      setErr(e?.message || '登录失败');
    } finally {
      setBusy(false);
    }
  };

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
            登录后可同步你的文章收藏
          </Text>

          <OAuthBtn
            label="使用 Google 登录"
            disabled={!googleReq || busy}
            onPress={() => promptGoogle()}
          />
          <View style={{ height: spacing.md }} />
          <OAuthBtn
            label="使用 Facebook 登录"
            disabled={!fbReq || busy}
            onPress={() => promptFacebook()}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xl }}>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSoft }} />
            <Text style={{ marginHorizontal: spacing.md, color: theme.textMuted, fontSize: fontSize.caption }}>或用邮箱</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: theme.borderSoft }} />
          </View>

          <TextInput placeholder="邮箱地址" placeholderTextColor={theme.textMuted}
            value={email} onChangeText={setEmail}
            keyboardType="email-address" autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bgCanvas, borderRadius: 14,
              paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: fontSize.body, color: theme.textPrimary, marginBottom: spacing.md }} />
          <TextInput placeholder="昵称（可选）" placeholderTextColor={theme.textMuted}
            value={name} onChangeText={setName}
            style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.bgCanvas, borderRadius: 14,
              paddingHorizontal: spacing.lg, paddingVertical: 12, fontSize: fontSize.body, color: theme.textPrimary, marginBottom: spacing.md }} />

          <Pressable onPress={onEmailLogin} disabled={busy}
            style={({ pressed }) => ({
              backgroundColor: pressed ? theme.brandHover : theme.brand,
              opacity: busy ? 0.6 : 1,
              borderRadius: 14, padding: 13, alignItems: 'center', marginTop: 4,
            })}>
            {busy
              ? <ActivityIndicator color={theme.onBrand} />
              : <Text style={{ color: theme.onBrand, fontSize: fontSize.body, fontWeight: '600' }}>邮箱登录 / 注册</Text>}
          </Pressable>

          {err && (
            <Text style={{ marginTop: spacing.md, color: theme.danger ?? '#c0392b', fontSize: fontSize.small, textAlign: 'center' }}>
              {err}
            </Text>
          )}

          <Text style={{ textAlign: 'center', marginTop: spacing.xl, fontSize: fontSize.small, color: theme.textSecondary }}>
            登录即表示你同意我们的{' '}
            <Text style={{ color: theme.brand, fontWeight: '600' }} onPress={() => router.push('/privacy')}>
              隐私政策
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function OAuthBtn({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={disabled}
      style={({ pressed }) => ({
        padding: 13, borderRadius: 14, borderWidth: 1, borderColor: theme.border,
        backgroundColor: pressed ? theme.bgSurface : theme.bgCanvas,
        alignItems: 'center',
        opacity: disabled ? 0.55 : 1,
      })}>
      <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: theme.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
