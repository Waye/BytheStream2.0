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

export interface UserDoc {
  _id: ObjectId;
  id: number;
  email?: string;
  name?: string;
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
