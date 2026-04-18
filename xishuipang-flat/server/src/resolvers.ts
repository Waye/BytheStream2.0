import { col } from './db.js';
import { cached } from './cache.js';
import type { Loaders } from './loaders.js';
import type { ArticleDoc, TocDoc, UserDoc, GqlArticle, GqlVolume } from './types.js';

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
      const volStr = String(volume);
      const suffix = charSuffix(character);
      const docs = await cached(`arts:v${volume}:${suffix}`, () =>
        loaders.articlesByVolume.load(volStr),
      );
      return docs.filter(a => a.id.endsWith(suffix)).map(toGqlArticle);
    },

    volume: async (
      _: unknown,
      { id }: { id: number },
      { loaders }: { loaders: Loaders },
    ) => {
      return cached(`vol:${id}`, () => buildVolume(id, loaders));
    },

    volumes: async (
      _: unknown,
      { offset, limit }: { offset: number; limit: number },
    ) => {
      return cached(`vols:${offset}:${limit}`, async () => {
        // 1. 所有期号
        const allVols = await col<TocDoc>('TableOfContents')
          .distinct('volume') as string[];
        const sorted = allVols
          .map(v => parseInt(v, 10))
          .filter(n => !isNaN(n))
          .sort((a, b) => b - a);
        const page = sorted.slice(offset, offset + limit);
        const pageStrs = page.map(String);

        // 2. 一次聚合查所有期的简体文章数（替代 N 次 countDocuments）
        const countAgg = await col<ArticleDoc>('Articles').aggregate([
          { $match: { volume: { $in: pageStrs }, id: { $regex: /_s$/ } } },
          { $group: { _id: '$volume', count: { $sum: 1 } } },
        ]).toArray();

        // 3. 批量查封面文章（只取 volume, id, content）
        const coverDocs = await col<ArticleDoc>('Articles')
          .find({
            volume: { $in: pageStrs },
            id: { $regex: /_s$/ },
            $or: [
              { category: { $regex: /封面/ } },
              { id: { $regex: /cover|fengmian/ } },
            ],
          })
          .toArray();

        // 4. 批量查目录
        const tocs = await col<TocDoc>('TableOfContents')
          .find({ volume: { $in: pageStrs }, character: 'simplified' })
          .toArray();

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
        const allVols = await col<TocDoc>('TableOfContents')
          .distinct('volume') as string[];
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

    me: () => null,
  },

  Mutation: {
    loginOrRegister: async (
      _: unknown,
      { email, name }: { email: string; name?: string },
    ) => {
      const users = col<UserDoc>('Users');
      const existing = await users.findOne({ email });
      if (existing) return { id: existing.id, email: existing.email, name: existing.name };
      const last = await users.find().sort({ id: -1 }).limit(1).toArray();
      const nextId = last.length ? last[0].id + 1 : 1;
      await users.insertOne({ id: nextId, email, name } as any);
      return { id: nextId, email, name };
    },

    trackUsage: async (
      _: unknown,
      args: { volumeId: number; articleId: string; articleTitle?: string; category?: string },
      { userId }: { userId?: number },
    ) => {
      await col('Usage').insertOne({
        userId: userId || 0,
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
};
