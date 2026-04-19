import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// ─────────────────────────── JWT ───────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export interface JwtPayload {
  userId: number;
  provider: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as any);
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** 从 "Authorization: Bearer xxx" 解析 userId */
export function parseAuthHeader(header?: string): JwtPayload | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  return verifyToken(m[1]);
}

// ─────────────────────────── Google ───────────────────────────
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const googleClient = new OAuth2Client();

export interface GoogleProfile {
  providerId: string;
  email: string;
  name?: string;
  avatar?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (GOOGLE_CLIENT_IDS.length === 0) {
    throw new Error('GOOGLE_CLIENT_IDS not configured');
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.sub) throw new Error('Invalid Google id token');
  if (!payload.email_verified) throw new Error('Google email not verified');
  return {
    providerId: payload.sub,
    email: payload.email!,
    name: payload.name,
    avatar: payload.picture,
  };
}

// ─────────────────────────── Facebook ───────────────────────────
export interface FacebookProfile {
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
}

/**
 * 验证 Facebook access token 并拉取基本资料。
 * 注意：FB 不总是返回 email（用户可能没授权 email scope）。
 */
export async function verifyFacebookAccessToken(accessToken: string): Promise<FacebookProfile> {
  const APP_ID = process.env.FACEBOOK_APP_ID;
  const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

  // 校验 token 合法性
  if (APP_ID && APP_SECRET) {
    const appToken = `${APP_ID}|${APP_SECRET}`;
    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`,
    );
    const debugJson: any = await debugRes.json();
    if (!debugJson?.data?.is_valid) {
      throw new Error('Invalid Facebook access token');
    }
    if (debugJson.data.app_id !== APP_ID) {
      throw new Error('Facebook token app_id mismatch');
    }
  }

  // 拉取用户资料
  const fields = 'id,name,email,picture.type(large)';
  const meRes = await fetch(
    `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!meRes.ok) throw new Error(`Facebook /me failed: ${meRes.status}`);
  const me: any = await meRes.json();
  if (!me.id) throw new Error('Facebook /me returned no id');

  return {
    providerId: me.id,
    email: me.email,
    name: me.name,
    avatar: me.picture?.data?.url,
  };
}
