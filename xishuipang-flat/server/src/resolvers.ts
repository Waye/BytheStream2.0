import { col } from './db.js';
import { getAudioEpisode, listAudioEpisodesForVolume } from './audio.js';
import { cached } from './cache.js';
import type { Loaders } from './loaders.js';
import type {
  ArticleDoc, TocDoc, UserDoc, FavoriteDoc,
  GqlArticle, GqlVolume, GqlUser, GqlAuthPayload, GqlFavorite, AuthProvider,
} from './types.js';
import {
  signToken, verifyGoogleIdToken, verifyFacebookAccessToken,
} from './auth.js';

// ─────────────────────────── helpers ───────────────────────────
function charSuffix(character: string): string {
  return character === 'traditional' ? '_t' : '_s';
}

function extractFirstImage(content?: string[]): string | null {
  if (!content) return null;
  for (const line of content) {
    const m = line.match(/^<([^,>]+\.(jpg|jpeg|png|gif|webp))\s*(?:,.*)?>/i);
    if (m) return m[1];
  }
  return null;
}

function toGqlArticle(doc: ArticleDoc): GqlArticle {
  const vol = parseInt(doc.volume, 10) || 0;
  return {
    id: `${doc.volume}:${doc.id}`,
    slug: doc.id,
    volume: vol,
    title: doc.title || doc.id,
    author: doc.author || '佚名',
    category: doc.category || '未分类',
    mins: doc.mins || Math.max(1, Math.ceil((doc.content?.length || 0) / 4)),
    content: doc.content || [],
    firstImage: extractFirstImage(doc.content),
  };
}

function findCoverSlug(articles: ArticleDoc[]): string | null {
  const cover = articles.find(
    a => a.id.endsWith('_s') && (
      (a.category && (a.category.includes('封面') || a.category.includes('簡介'))) ||
      a.id.includes('cover') || a.id.includes('fengmian')
    )
  );
  return cover?.id || null;
}

function findCoverImage(articles: ArticleDoc[]): string | null {
  const cover = articles.find(
    a => a.id.endsWith('_s') && (
      (a.category && (a.category.includes('封面') || a.category.includes('簡介'))) ||
      a.id.includes('cover') || a.id.includes('fengmian')
    )
  );
  if (!cover) return null;
  return extractFirstImage(cover.content);
}

function toGqlUser(doc: UserDoc): GqlUser {
  return {
    id: doc.id,
    email: doc.email ?? null,
    name: doc.name ?? null,
    avatar: doc.avatar ?? null,
    provider: (doc.provider || 'email').toUpperCase() as GqlUser['provider'],
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : null,
  };
}

function toGqlFavorite(doc: FavoriteDoc): GqlFavorite {
  return {
    id: `${doc.userId}:${doc.articleId}`,
    articleId: doc.articleId,
    volume: doc.volume,
    slug: doc.slug,
    title: doc.title,
    author: doc.author ?? null,
    category: doc.category ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

/** 解析 "volume:slug" */
function parseArticleId(articleId: string): { volume: number; slug: string } | null {
  const idx = articleId.indexOf(':');
  if (idx < 0) return null;
  const volStr = articleId.slice(0, idx);
  const slug = articleId.slice(idx + 1);
  const volume = parseInt(volStr, 10);
  if (Number.isNaN(volume) || !slug) return null;
  return { volume, slug };
}

/** 查找或创建 OAuth 用户。按 (provider, providerId) 匹配，缺失时回落 email。 */
async function upsertOAuthUser(args: {
  provider: AuthProvider;
  providerId: string;
  email?: string;
  name?: string;
  avatar?: string;
}): Promise<UserDoc> {
  const users = col<UserDoc>('Users');
  const now = new Date();

  let user = await users.findOne({ provider: args.provider, providerId: args.providerId });

  if (!user && args.email) {
    user = await users.findOne({ email: args.email });
    if (user) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            provider: args.provider,
            providerId: args.providerId,
            avatar: args.avatar ?? user.avatar,
            name: user.name ?? args.name,
            updatedAt: now,
          },
        },
      );
      user = (await users.findOne({ _id: user._id }))!;
      return user;
    }
  }

  if (user) return user;

  const last = await users.find().sort({ id: -1 }).limit(1).toArray();
  const nextId = last.length ? (last[0].id || 0) + 1 : 1;

  const newUser: Omit<UserDoc, '_id'> = {
    id: nextId,
    email: args.email,
    name: args.name,
    avatar: args.avatar,
    provider: args.provider,
    providerId: args.providerId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await users.insertOne(newUser as any);
  return { ...newUser, _id: result.insertedId } as UserDoc;
}

function requireUser(ctx: { userId?: number }): number {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');
  return ctx.userId;
}

// 音频 stub —— 暂时返空，将来接入真实数据
const MOCK_AUDIO_EPISODES: Array<{
  id: string; title: string; author: string; volume: number;
  durationSeconds: number; coverImage: string | null;
}> = [];

async function buildVolume(volNum: number, loaders: Loaders): Promise<GqlVolume | null> {
  const volStr = String(volNum);
  const [toc, articles] = await Promise.all([
    loaders.tocByVolume.load(volStr),
    loaders.articlesByVolume.load(volStr),
  ]);
  if (!toc && articles.length === 0) return null;
  return {
    id: volNum,
    subtitle: toc?.subtitle || '',
    count: articles.filter(a => a.id.endsWith('_s')).length,
    coverSlug: findCoverSlug(articles),
    coverImage: findCoverImage(articles),
    articles: articles.map(toGqlArticle),
  };
}

// ─────────────────────────── resolvers ───────────────────────────
export const resolvers = {
  Query: {
    article: async (
      _: unknown,
      { volume, slug }: { volume: number; slug: string },
      { loaders }: { loaders: Loaders },
    ) => {
      const key = `${volume}:${slug}`;
      const doc = await cached(`art:${key}`, () => loaders.articleByKey.load(key));
      return doc ? toGqlArticle(doc) : null;
    },

    articlesByVolume: async (
      _: unknown,
      { volume, character }: { volume: number; character: string },
      { loaders }: { loaders: Loaders },
    ) => {
      const docs = await loaders.articlesByVolume.load(String(volume));
      const suffix = charSuffix(character);
      return docs.filter(d => d.id.endsWith(suffix)).map(toGqlArticle);
    },

    volume: async (
      _: unknown,
      { id }: { id: number },
      { loaders }: { loaders: Loaders },
    ) => buildVolume(id, loaders),

    volumes: async (
      _: unknown,
      { offset, limit }: { offset: number; limit: number },
    ) => {
      return cached(`vols:${offset}:${limit}`, async () => {
        const allVols = await col<TocDoc>('TableOfContents').distinct('volume') as string[];
        const sorted = [...allVols]
          .map(v => parseInt(v, 10))
          .filter(n => !Number.isNaN(n))
          .sort((a, b) => b - a);

        const page = sorted.slice(offset, offset + limit);
        const pageStrs = page.map(String);

        const tocs = await col<TocDoc>('TableOfContents')
          .find({ volume: { $in: pageStrs }, character: 'simplified' })
          .toArray();

        const articles = await col<ArticleDoc>('Articles')
          .find({ volume: { $in: pageStrs }, id: { $regex: /_s$/ } })
          .toArray();

        const countAgg = pageStrs.map(vs => ({
          _id: vs,
          count: articles.filter(a => a.volume === vs).length,
        }));

        const coverDocs = pageStrs
          .map(vs => {
            const arts = articles.filter(a => a.volume === vs);
            const cover = arts.find(a =>
              (a.category && (a.category.includes('封面') || a.category.includes('簡介'))) ||
              a.id.includes('cover') || a.id.includes('fengmian')
            );
            return cover || null;
          })
          .filter(Boolean) as ArticleDoc[];

        return page.map(v => {
          const vs = String(v);
          const tc = tocs.find(t => t.volume === vs);
          const ca = countAgg.find(c => c._id === vs);
          const coverDoc = coverDocs.find(d => d.volume === vs);
          return {
            id: v,
            subtitle: tc?.subtitle || '',
            count: ca?.count || 0,
            coverSlug: coverDoc?.id || null,
            coverImage: coverDoc ? extractFirstImage(coverDoc.content) : null,
            articles: [],
          };
        });
      });
    },

    latestVolume: async () => {
      return cached('latest-vol', async () => {
        const allVols = await col<TocDoc>('TableOfContents').distinct('volume') as string[];
        return Math.max(...allVols.map(v => parseInt(v, 10) || 0));
      });
    },

    search: async (
      _: unknown,
      { query, character, limit, offset }: { query: string; character: string; limit: number; offset: number },
    ) => {
      const suffix = charSuffix(character);
      const filter = { $text: { $search: query }, id: { $regex: new RegExp(`${suffix}$`) } };
      const total = await col<ArticleDoc>('Articles').countDocuments(filter);
      const docs = await col<ArticleDoc>('Articles')
        .find(filter).skip(offset).limit(limit).toArray();
      return { articles: docs.map(toGqlArticle), total };
    },

    me: async (_: unknown, __: unknown, ctx: { userId?: number }) => {
      if (!ctx.userId) return null;
      const user = await col<UserDoc>('Users').findOne({ id: ctx.userId });
      return user ? toGqlUser(user) : null;
    },

    myFavorites: async (_: unknown, __: unknown, ctx: { userId?: number }) => {
      if (!ctx.userId) return [];
      const docs = await col<FavoriteDoc>('Favorites')
        .find({ userId: ctx.userId })
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map(toGqlFavorite);
    },

    // ─────── 音频（接 TTS 本地产物）───────
    audioEpisode: async (_: unknown, { id }: { id: string }) => {
      const [volStr, slug] = String(id).split(':');
      const volume = Number(volStr);
      if (!volume || !slug) return null;

      const audio = getAudioEpisode(volume, slug);
      if (!audio) return null;

      const article = await col<ArticleDoc>('Articles').findOne({
        volume: String(volume),
        id: audio.canonicalSlug,
      });

      return {
        id: audio.id,
        title: article?.title || '',
        author: article?.author || null,
        volume,
        durationSeconds: audio.durationSeconds,
        coverImage: null,
        streamUrl: audio.streamUrl,
        streamExpiresAt: null,
      };
    },

    audioEpisodes: async (_: unknown, { volume }: { volume?: number }) => {
      if (!volume) return [];

      const audios = listAudioEpisodesForVolume(volume);
      if (audios.length === 0) return [];

      const slugs = audios.map(a => a.canonicalSlug);
      const articles = await col<ArticleDoc>('Articles')
        .find({ volume: String(volume), id: { $in: slugs } })
        .toArray();
      const byId = new Map(articles.map(a => [a.id, a]));

      return audios.map(a => {
        const article = byId.get(a.canonicalSlug);
        return {
          id: a.id,
          title: article?.title || '',
          author: article?.author || null,
          volume,
          durationSeconds: a.durationSeconds,
          coverImage: null,
          streamUrl: a.streamUrl,
          streamExpiresAt: null,
        };
      });
    },
  },

  Mutation: {
    // ───────────────── 认证 ─────────────────
    loginWithGoogle: async (
      _: unknown,
      { idToken }: { idToken: string },
    ): Promise<GqlAuthPayload> => {
      const profile = await verifyGoogleIdToken(idToken);
      const user = await upsertOAuthUser({
        provider: 'google',
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      });
      const token = signToken({ userId: user.id, provider: 'google' });
      return { token, user: toGqlUser(user) };
    },

    loginWithFacebook: async (
      _: unknown,
      { accessToken }: { accessToken: string },
    ): Promise<GqlAuthPayload> => {
      const profile = await verifyFacebookAccessToken(accessToken);
      const user = await upsertOAuthUser({
        provider: 'facebook',
        providerId: profile.providerId,
        email: profile.email,
        name: profile.name,
        avatar: profile.avatar,
      });
      const token = signToken({ userId: user.id, provider: 'facebook' });
      return { token, user: toGqlUser(user) };
    },

    loginOrRegister: async (
      _: unknown,
      { email, name }: { email: string; name?: string },
    ): Promise<GqlAuthPayload> => {
      const users = col<UserDoc>('Users');
      const now = new Date();
      let user = await users.findOne({ email });
      if (!user) {
        const last = await users.find().sort({ id: -1 }).limit(1).toArray();
        const nextId = last.length ? (last[0].id || 0) + 1 : 1;
        const doc: Omit<UserDoc, '_id'> = {
          id: nextId, email, name,
          provider: 'email',
          createdAt: now, updatedAt: now,
        };
        const result = await users.insertOne(doc as any);
        user = { ...doc, _id: result.insertedId } as UserDoc;
      }
      const token = signToken({ userId: user.id, provider: 'email' });
      return { token, user: toGqlUser(user) };
    },

    logout: async () => {
      return true;
    },

    // ───────────────── 文章收藏 ─────────────────
    addFavorite: async (
      _: unknown,
      args: {
        articleId: string;
        title: string;
        author?: string;
        category?: string;
      },
      ctx: { userId?: number },
    ): Promise<GqlFavorite> => {
      const userId = requireUser(ctx);
      const parsed = parseArticleId(args.articleId);
      if (!parsed) throw new Error(`Invalid articleId: ${args.articleId}`);
      const now = new Date();

      await col<FavoriteDoc>('Favorites').updateOne(
        { userId, articleId: args.articleId },
        {
          $setOnInsert: {
            userId,
            articleId: args.articleId,
            volume: parsed.volume,
            slug: parsed.slug,
            createdAt: now,
          },
          $set: {
            title: args.title,
            author: args.author,
            category: args.category,
          },
        },
        { upsert: true },
      );

      const doc = await col<FavoriteDoc>('Favorites').findOne({
        userId, articleId: args.articleId,
      });
      return toGqlFavorite(doc!);
    },

    removeFavorite: async (
      _: unknown,
      { articleId }: { articleId: string },
      ctx: { userId?: number },
    ): Promise<boolean> => {
      const userId = requireUser(ctx);
      const result = await col<FavoriteDoc>('Favorites').deleteOne({
        userId, articleId,
      });
      return result.deletedCount > 0;
    },

    trackUsage: async (
      _: unknown,
      args: { volumeId: number; articleId: string; articleTitle?: string; category?: string },
      ctx: { userId?: number },
    ) => {
      await col('Usage').insertOne({
        userId: ctx.userId || 0,
        volumeId: String(args.volumeId),
        articleId: args.articleId,
        articleTitle: args.articleTitle,
        category: args.category,
        time: new Date(),
      });
      return true;
    },
  },

  Volume: {
    articles: async (
      parent: GqlVolume,
      _: unknown,
      { loaders }: { loaders: Loaders },
    ) => {
      if (parent.articles.length > 0) return parent.articles;
      const docs = await loaders.articlesByVolume.load(String(parent.id));
      return docs.map(toGqlArticle);
    },
  },

  // ─────── Favorite → Article 关联 ───────
  Favorite: {
    article: async (
      parent: GqlFavorite,
      _: unknown,
      { loaders }: { loaders: Loaders },
    ) => {
      const doc = await loaders.articleByKey.load(parent.articleId);
      return doc ? toGqlArticle(doc) : null;
    },
  },
};
