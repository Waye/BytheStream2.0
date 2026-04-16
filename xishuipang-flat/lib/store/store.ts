import { create } from 'zustand';
import type { ThemeName } from '../theme';

// 内容项的统一接口 — 文章和音频共用
export interface ContentItem {
  id: number;
  title: string;
  author: string;
  mins: number;
  volume: number;
  category?: string;
}

interface AppState {
  // 主题
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  // 收藏(用 Set 高性能查询)
  favs: Set<number>;
  toggleFav: (id: number) => void;

  // 播放队列
  queue: ContentItem[];
  currentIdx: number;
  playing: boolean;
  enqueue: (item: ContentItem) => void;
  playNow: (item: ContentItem) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  removeFromQueue: (idx: number) => void;
  moveQueue: (from: number, to: number) => void;
  setCurrent: (idx: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  favs: new Set(),
  toggleFav: (id) =>
    set((s) => {
      const favs = new Set(s.favs);
      if (favs.has(id)) favs.delete(id);
      else favs.add(id);
      return { favs };
    }),

  queue: [],
  currentIdx: 0,
  playing: false,

  enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),

  playNow: (item) =>
    set((s) => {
      const exists = s.queue.findIndex((q) => q.id === item.id);
      if (exists >= 0) return { currentIdx: exists, playing: true };
      return {
        queue: [...s.queue, item],
        currentIdx: s.queue.length,
        playing: true,
      };
    }),

  togglePlay: () => set((s) => ({ playing: !s.playing })),

  next: () =>
    set((s) => ({
      currentIdx: Math.min(s.currentIdx + 1, s.queue.length - 1),
      playing: true,
    })),

  prev: () =>
    set((s) => ({
      currentIdx: Math.max(s.currentIdx - 1, 0),
      playing: true,
    })),

  removeFromQueue: (idx) =>
    set((s) => {
      const q = s.queue.filter((_, i) => i !== idx);
      let ci = s.currentIdx;
      if (idx < ci) ci--;
      else if (idx === ci) ci = Math.min(ci, q.length - 1);
      return { queue: q, currentIdx: Math.max(0, ci) };
    }),

  moveQueue: (from, to) =>
    set((s) => {
      const q = [...s.queue];
      const [it] = q.splice(from, 1);
      q.splice(to, 0, it);
      let ci = s.currentIdx;
      if (from === ci) ci = to;
      else if (from < ci && to >= ci) ci--;
      else if (from > ci && to <= ci) ci++;
      return { queue: q, currentIdx: ci };
    }),

  setCurrent: (idx) => set({ currentIdx: idx, playing: true }),
}));
