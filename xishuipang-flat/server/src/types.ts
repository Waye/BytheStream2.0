import { ObjectId } from 'mongodb';

export interface ArticleDoc {
  _id: ObjectId;
  volume: string;
  id: string;
  title?: string;
  author?: string;
  category?: string;
  content?: string[];
  mins?: number;
}

export interface TocDoc {
  _id: ObjectId;
  volume: string;
  character: string;
  articles?: TocArticleEntry[];
  subtitle?: string;
}

export interface TocArticleEntry {
  id: string;
  title: string;
  author?: string;
  category?: string;
}

// ─────────────────────────── 用户 ───────────────────────────
export type AuthProvider = 'email' | 'google' | 'facebook';

export interface UserDoc {
  _id: ObjectId;
  id: number;                  // 自增，保留兼容
  email?: string;
  name?: string;
  avatar?: string;
  provider: AuthProvider;
  providerId?: string;         // OAuth sub / fb user id
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────── 文章收藏 ───────────────────────────
export interface FavoriteDoc {
  _id: ObjectId;
  userId: number;
  articleId: string;           // "volume:slug"
  volume: number;
  slug: string;
  title: string;
  author?: string;
  category?: string;
  createdAt: Date;
}

export interface UsageDoc {
  _id: ObjectId;
  userId: number;
  volumeId: string;
  category?: string;
  articleTitle?: string;
  articleId?: string;
  time: Date;
}

// ─────────────────────────── GraphQL 返回类型 ───────────────────────────
export interface GqlArticle {
  id: string;
  slug: string;
  volume: number;
  title: string;
  author: string;
  category: string;
  mins: number;
  content: string[];
  firstImage: string | null;
}

export interface GqlVolume {
  id: number;
  subtitle: string;
  count: number;
  coverSlug: string | null;
  coverImage: string | null;
  articles: GqlArticle[];
}

export interface GqlUser {
  id: number;
  email: string | null;
  name: string | null;
  avatar: string | null;
  provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
  createdAt: string | null;
}

export interface GqlAuthPayload {
  token: string;
  user: GqlUser;
}

export interface GqlFavorite {
  id: string;
  articleId: string;
  volume: number;
  slug: string;
  title: string;
  author: string | null;
  category: string | null;
  createdAt: string;
}
