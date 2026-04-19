/**
 * OAuth 登录辅助 — 基于 expo-auth-session。
 *
 * 需要安装：
 *   npx expo install expo-auth-session expo-crypto expo-web-browser
 *
 * 若 EXPO_PUBLIC_GOOGLE_* / EXPO_PUBLIC_FACEBOOK_APP_ID 未配置，
 * 对应 hook 会返回 stub（按钮 disabled），避免启动崩溃。
 */

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { apolloClient, LOGIN_WITH_GOOGLE, LOGIN_WITH_FACEBOOK } from '../graphql';
import { useAppStore, type User } from '../store';

WebBrowser.maybeCompleteAuthSession();

// ─────────────────────────── 环境变量 ───────────────────────────
const GOOGLE_IOS = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const GOOGLE_WEB = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const FB_APP_ID = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

const hasGoogleConfig = !!(GOOGLE_IOS || GOOGLE_ANDROID || GOOGLE_WEB);
const hasFacebookConfig = !!FB_APP_ID;

// stub：返回和真 hook 一样的三元组，但 request 永远是 null
const stubHook = () => [null, null, async () => ({ type: 'error' as const, errorCode: 'not-configured' })] as const;

// ─────────────────────────── Google ───────────────────────────
export function useGoogleAuth() {
  if (!hasGoogleConfig) return stubHook();
  return Google.useIdTokenAuthRequest({
    iosClientId: GOOGLE_IOS,
    androidClientId: GOOGLE_ANDROID,
    webClientId: GOOGLE_WEB,
  });
}

export async function handleGoogleResponse(
  response: AuthSession.AuthSessionResult,
): Promise<User | null> {
  if (response.type !== 'success') return null;
  const idToken = (response as any).params?.id_token;
  if (!idToken) {
    console.warn('Google response missing id_token');
    return null;
  }
  return sendGoogleIdToken(idToken);
}

export async function sendGoogleIdToken(idToken: string): Promise<User | null> {
  const { data } = await apolloClient.mutate({
    mutation: LOGIN_WITH_GOOGLE,
    variables: { idToken },
  });
  const payload = data?.loginWithGoogle;
  if (!payload) return null;
  await useAppStore.getState().loginSuccess(payload.user, payload.token);
  return payload.user;
}

// ─────────────────────────── Facebook ───────────────────────────
export function useFacebookAuth() {
  if (!hasFacebookConfig) return stubHook();
  return Facebook.useAuthRequest({
    clientId: FB_APP_ID,
    scopes: ['public_profile', 'email'],
  });
}

export async function handleFacebookResponse(
  response: AuthSession.AuthSessionResult,
): Promise<User | null> {
  if (response.type !== 'success') return null;
  const accessToken =
    (response as any).authentication?.accessToken ??
    (response as any).params?.access_token;
  if (!accessToken) {
    console.warn('Facebook response missing access_token');
    return null;
  }
  return sendFacebookAccessToken(accessToken);
}

export async function sendFacebookAccessToken(accessToken: string): Promise<User | null> {
  const { data } = await apolloClient.mutate({
    mutation: LOGIN_WITH_FACEBOOK,
    variables: { accessToken },
  });
  const payload = data?.loginWithFacebook;
  if (!payload) return null;
  await useAppStore.getState().loginSuccess(payload.user, payload.token);
  return payload.user;
}
