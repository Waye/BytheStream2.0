import { create } from 'zustand';
import type { ThemeName } from '../theme';

export interface ContentItem {
  id: string;
  slug?: string;
  title: string;
  author: string;
  mins: number;
  volume: number;
  category?: string;
  content?: string[];
  firstImage?: string | null;
}

export type CharacterMode = 'simplified' | 'traditional';

interface AppState {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  character: CharacterMode;
  setCharacter: (c: CharacterMode) => void;
  toggleCharacter: () => void;

  favs: Set<string>;
  favItems: ContentItem[];
  toggleFav: (idOrItem: string | ContentItem) => void;

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

  character: 'simplified',
  setCharacter: (character) => set({ character }),
  toggleCharacter: () =>
    set((s) => ({
      character: s.character === 'simplified' ? 'traditional' : 'simplified',
    })),

  favs: new Set(),
  favItems: [],
  toggleFav: (idOrItem) =>
    set((s) => {
      const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
      const favs = new Set(s.favs);
      let favItems = [...s.favItems];
      if (favs.has(id)) {
        favs.delete(id);
        favItems = favItems.filter((f) => f.id !== id);
      } else {
        favs.add(id);
        if (typeof idOrItem !== 'string') {
          favItems.push(idOrItem);
        }
      }
      return { favs, favItems };
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
