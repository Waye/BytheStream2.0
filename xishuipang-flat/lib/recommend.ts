/**
 * 客户端轻量推荐算法
 *
 * 输入：
 *   - 用户已收藏文章（favItems）
 *   - 候选文章池（从 Apollo cache + 必要时多拉一两期）
 *
 * 算法：基于已收藏文章提取偏好向量
 *   - 作者权重：3 分（最强信号）
 *   - 类别权重：2 分
 *   - 期号距离：1 分（越近的期数越相关）
 *
 * 已收藏的文章自动排除。
 * 未登录或收藏为空 → 直接返回"热门往期"（最近几期的非封面文章）
 */

import type { ContentItem } from './store';

export interface CandidateArticle {
  id: string;
  slug?: string;
  volume: number;
  title: string;
  author: string;
  category?: string;
  mins: number;
  firstImage?: string | null;
}

const W_AUTHOR = 3;
const W_CATEGORY = 2;
const W_VOLUME_DISTANCE_MAX = 1;

/**
 * 计算偏好向量：从收藏里提取作者/类别/期号的频次
 */
function buildPreferenceVector(favs: ContentItem[]): {
  authorFreq: Map<string, number>;
  categoryFreq: Map<string, number>;
  volumeCenter: number | null;
} {
  const authorFreq = new Map<string, number>();
  const categoryFreq = new Map<string, number>();
  const volumes: number[] = [];

  for (const f of favs) {
    if (f.author) {
      authorFreq.set(f.author, (authorFreq.get(f.author) || 0) + 1);
    }
    if (f.category) {
      categoryFreq.set(f.category, (categoryFreq.get(f.category) || 0) + 1);
    }
    if (typeof f.volume === 'number' && !Number.isNaN(f.volume)) {
      volumes.push(f.volume);
    }
  }

  // 用收藏期号的中位数做"用户兴趣中心"
  let volumeCenter: number | null = null;
  if (volumes.length > 0) {
    const sorted = [...volumes].sort((a, b) => a - b);
    volumeCenter = sorted[Math.floor(sorted.length / 2)];
  }

  return { authorFreq, categoryFreq, volumeCenter };
}

/**
 * 给候选文章打分
 */
function scoreCandidate(
  candidate: CandidateArticle,
  vec: ReturnType<typeof buildPreferenceVector>,
  maxAuthorFreq: number,
  maxCategoryFreq: number,
): number {
  let score = 0;

  // 作者匹配（按频次归一化，避免某作者收藏 5 次完全主导）
  if (candidate.author && vec.authorFreq.has(candidate.author)) {
    const freq = vec.authorFreq.get(candidate.author)!;
    score += W_AUTHOR * (freq / Math.max(1, maxAuthorFreq));
  }

  // 类别匹配
  if (candidate.category && vec.categoryFreq.has(candidate.category)) {
    const freq = vec.categoryFreq.get(candidate.category)!;
    score += W_CATEGORY * (freq / Math.max(1, maxCategoryFreq));
  }

  // 期号距离（越近越相关，最大 1 分）
  if (vec.volumeCenter !== null) {
    const distance = Math.abs(candidate.volume - vec.volumeCenter);
    // 距离 0 → 满分 1，距离 10 → 0
    const proximity = Math.max(0, 1 - distance / 10);
    score += W_VOLUME_DISTANCE_MAX * proximity;
  }

  return score;
}

/**
 * 排除规则：
 *   - 已收藏的不推荐
 *   - 封面/簡介类文章不推荐（不是真正"内容"）
 *   - 简体（_s）才推荐
 */
function isExcluded(c: CandidateArticle, favIds: Set<string>): boolean {
  if (favIds.has(c.id)) return true;
  if (c.category && (c.category.includes('封面') || c.category.includes('簡介'))) return true;
  if (!c.id.endsWith('_s')) return true;
  return false;
}

/**
 * 主入口：从候选池中挑出推荐
 *
 * @param candidates 候选文章（通常来自多个期号合并）
 * @param favItems   用户已收藏
 * @param limit      返回多少篇
 */
export function recommend(
  candidates: CandidateArticle[],
  favItems: ContentItem[],
  limit = 6,
): CandidateArticle[] {
  const favIds = new Set(favItems.map(f => f.id));
  const eligible = candidates.filter(c => !isExcluded(c, favIds));

  // 没收藏 → 走"热门往期"分支：按期号倒序 + 简单去重作者，多样化呈现
  if (favItems.length === 0) {
    return diversifyByAuthor(
      [...eligible].sort((a, b) => b.volume - a.volume),
      limit,
    );
  }

  const vec = buildPreferenceVector(favItems);
  const maxAuthorFreq = Math.max(1, ...vec.authorFreq.values());
  const maxCategoryFreq = Math.max(1, ...vec.categoryFreq.values());

  const scored = eligible.map(c => ({
    article: c,
    score: scoreCandidate(c, vec, maxAuthorFreq, maxCategoryFreq),
  }));

  // 按分数倒序，分数相同时新期号优先
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.article.volume - a.article.volume;
  });

  // 多样化：同作者最多 2 篇，避免推荐区被某个作者霸占
  const byAuthorCount = new Map<string, number>();
  const picks: CandidateArticle[] = [];
  for (const { article } of scored) {
    const a = article.author || '__unknown';
    const cnt = byAuthorCount.get(a) || 0;
    if (cnt >= 2) continue;
    byAuthorCount.set(a, cnt + 1);
    picks.push(article);
    if (picks.length >= limit) break;
  }

  // 如果分数模式没凑够（候选少 / 都同作者），用剩下的填
  if (picks.length < limit) {
    const pickedIds = new Set(picks.map(p => p.id));
    for (const { article } of scored) {
      if (pickedIds.has(article.id)) continue;
      picks.push(article);
      if (picks.length >= limit) break;
    }
  }

  return picks;
}

/**
 * 未登录回落：把按期号排序的候选按作者去重，每个作者最多 1 篇，凑 limit 篇
 */
function diversifyByAuthor(sorted: CandidateArticle[], limit: number): CandidateArticle[] {
  const seenAuthors = new Set<string>();
  const picks: CandidateArticle[] = [];

  // 第一轮：每个作者最多 1 篇
  for (const c of sorted) {
    if (seenAuthors.has(c.author)) continue;
    seenAuthors.add(c.author);
    picks.push(c);
    if (picks.length >= limit) return picks;
  }

  // 候选少时第二轮：放开限制填满
  const pickedIds = new Set(picks.map(p => p.id));
  for (const c of sorted) {
    if (pickedIds.has(c.id)) continue;
    picks.push(c);
    if (picks.length >= limit) break;
  }
  return picks;
}
