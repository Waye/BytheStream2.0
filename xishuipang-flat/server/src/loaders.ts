import DataLoader from 'dataloader';
import { col } from './db.js';
import type { ArticleDoc, TocDoc } from './types.js';

// 每个请求创建新的 DataLoader 实例,防止跨请求泄漏

export function createLoaders() {
  return {
    // 按 volume+id 批量加载文章
    articleByKey: new DataLoader<string, ArticleDoc | null>(async (keys) => {
      // key 格式: "volume:id"
      const filters = keys.map(k => {
        const [volume, id] = k.split(':');
        return { volume, id };
      });

      const articles = await col<ArticleDoc>('Articles')
        .find({ $or: filters })
        .toArray();

      // 按 key 顺序返回
      return keys.map(k => {
        const [volume, id] = k.split(':');
        return articles.find(a => a.volume === volume && a.id === id) ?? null;
      });
    }),

    // 按 volume 批量加载一期的所有文章
    articlesByVolume: new DataLoader<string, ArticleDoc[]>(async (volumes) => {
      const articles = await col<ArticleDoc>('Articles')
        .find({ volume: { $in: [...volumes] } })
        .toArray();

      return volumes.map(v => articles.filter(a => a.volume === v));
    }),

    // 按 volume 批量加载目录
    tocByVolume: new DataLoader<string, TocDoc | null>(async (volumes) => {
      const docs = await col<TocDoc>('TableOfContents')
        .find({ volume: { $in: [...volumes] }, character: 'simplified' })
        .toArray();

      return volumes.map(v => docs.find(d => d.volume === v) ?? null);
    }),
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
