import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeName } from '../theme';
import {
  apolloClient, setAuthToken, clearAuthAndCache,
  ME, MY_FAVORITES, ADD_FAVORITE, REMOVE_FAVORITE,
} from '../graphql';

// ─────────────────────────── 类型 ───────────────────────────
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

export interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar: string | null;
  provider: 'EMAIL' | 'GOOGLE' | 'FACEBOOK';
}

interface AppState {
  // ───── theme / character ─────
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;

  character: CharacterMode;
  setCharacter: (c: CharacterMode) => void;
  toggleCharacter: () => void;

  // ───── 认证 ─────
  user: User | null;
  authReady: boolean;
  setUser: (u: User | null) => void;
  loginSuccess: (u: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrapAuth: () => Promise<void>;

  // ───── 文章收藏（云端同步） ─────
  favs: Set<string>;
  favItems: ContentItem[];
  toggleFav: (idOrItem: string | ContentItem) => Promise<void>;
  syncFavoritesFromServer: () => Promise<void>;

  // ───── 音频收藏（本地持久化，不上传） ─────
  favAudioIds: Set<string>;
  favAudioItems: ContentItem[];
  toggleFavAudio: (idOrItem: string | ContentItem) => Promise<void>;
  loadAudioFavs: () => Promise<void>;

  // ───── 播放队列 ─────
  queue: ContentItem[];
  currentIdx: number;
  playing: boolean;

  // 音频实际播放状态 (MiniPlayer 写,其他组件只读)
  audioPosition: number;      // 秒
  audioDuration: number;      // 秒
  audioLoading: boolean;
  audioError: string | null;
  setAudioStatus: (position: number, duration: number) => void;
  setAudioLoading: (loading: boolean) => void;
  setAudioError: (err: string | null) => void;
  enqueue: (item: ContentItem) => void;
  playNow: (item: ContentItem) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  removeFromQueue: (idx: number) => void;
  moveQueue: (from: number, to: number) => void;
  setCurrent: (idx: number) => void;
}

// ─────────────────────────── helpers ───────────────────────────
const AUDIO_FAVS_KEY = 'xsp_audio_favs_v1';

function favDocToContentItem(fav: any): ContentItem {
  return {
    id: fav.articleId,
    slug: fav.slug,
    title: fav.title,
    author: fav.author || '佚名',
    mins: 0,
    volume: fav.volume,
    category: fav.category,
  };
}

async function persistAudioFavs(ids: Set<string>, items: ContentItem[]) {
  try {
    await AsyncStorage.setItem(
      AUDIO_FAVS_KEY,
      JSON.stringify({ ids: Array.from(ids), items }),
    );
  } catch (e) {
    console.warn('Persist audio favs failed:', e);
  }
}

// ─────────────────────────── store ───────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  character: 'simplified',
  setCharacter: (character) => set({ character }),
  toggleCharacter: () =>
    set((s) => ({
      character: s.character === 'simplified' ? 'traditional' : 'simplified',
    })),

  // ───── 认证 ─────
  user: null,
  authReady: false,

  setUser: (user) => set({ user }),

  loginSuccess: async (user, token) => {
    await setAuthToken(token);
    set({ user });
    await get().syncFavoritesFromServer();
  },

  logout: async () => {
    await clearAuthAndCache();
    // 只清文章收藏（云端的），音频收藏保留（本地的，属于设备）
    set({ user: null, favs: new Set(), favItems: [] });
  },

  bootstrapAuth: async () => {
    // 并行：加载本地音频收藏 + 尝试恢复登录
    try {
      await Promise.all([
        get().loadAudioFavs(),
        (async () => {
          try {
            const { data } = await apolloClient.query({
              query: ME,
              fetchPolicy: 'network-only',
            });
            if (data?.me) {
              set({ user: data.me });
              await get().syncFavoritesFromServer();
            }
          } catch {
            // token 失效/未登录 — 静默
          }
        })(),
      ]);
    } finally {
      set({ authReady: true });
    }
  },

  // ───── 文章收藏（云端） ─────
  favs: new Set(),
  favItems: [],

  toggleFav: async (idOrItem) => {
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const isItem = typeof idOrItem !== 'string';
    const user = get().user;

    // 乐观更新
    set((s) => {
      const favs = new Set(s.favs);
      let favItems = [...s.favItems];
      if (favs.has(id)) {
        favs.delete(id);
        favItems = favItems.filter((f) => f.id !== id);
      } else {
        favs.add(id);
        if (isItem) favItems.unshift(idOrItem);
      }
      return { favs, favItems };
    });

    // 未登录：留在本地（重新打开 app 会丢，但现在没持久化要求）
    if (!user) return;

    const nowFavorited = get().favs.has(id);
    try {
      if (nowFavorited && isItem) {
        await apolloClient.mutate({
          mutation: ADD_FAVORITE,
          variables: {
            articleId: id,
            title: idOrItem.title,
            author: idOrItem.author,
            category: idOrItem.category,
          },
        });
      } else if (!nowFavorited) {
        await apolloClient.mutate({
          mutation: REMOVE_FAVORITE,
          variables: { articleId: id },
        });
      }
    } catch (e) {
      console.warn('Favorite sync failed, resyncing:', e);
      await get().syncFavoritesFromServer();
    }
  },

  syncFavoritesFromServer: async () => {
    try {
      const { data } = await apolloClient.query({
        query: MY_FAVORITES,
        fetchPolicy: 'network-only',
      });
      const favs = new Set<string>();
      const favItems: ContentItem[] = [];
      for (const f of data?.myFavorites ?? []) {
        favs.add(f.articleId);
        favItems.push(favDocToContentItem(f));
      }
      set({ favs, favItems });
    } catch (e) {
      console.warn('Failed to sync favorites:', e);
    }
  },

  // ───── 音频收藏（本地） ─────
  favAudioIds: new Set(),
  favAudioItems: [],

  loadAudioFavs: async () => {
    try {
      const raw = await AsyncStorage.getItem(AUDIO_FAVS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const ids = new Set<string>(parsed?.ids ?? []);
      const items: ContentItem[] = parsed?.items ?? [];
      set({ favAudioIds: ids, favAudioItems: items });
    } catch (e) {
      console.warn('Load audio favs failed:', e);
    }
  },

  toggleFavAudio: async (idOrItem) => {
    const id = typeof idOrItem === 'string' ? idOrItem : idOrItem.id;
    const isItem = typeof idOrItem !== 'string';

    let nextIds!: Set<string>;
    let nextItems!: ContentItem[];

    set((s) => {
      nextIds = new Set(s.favAudioIds);
      nextItems = [...s.favAudioItems];
      if (nextIds.has(id)) {
        nextIds.delete(id);
        nextItems = nextItems.filter((f) => f.id !== id);
      } else {
        nextIds.add(id);
        if (isItem) nextItems.push(idOrItem);
      }
      return { favAudioIds: nextIds, favAudioItems: nextItems };
    });

    await persistAudioFavs(nextIds, nextItems);
  },

  // ───── 播放队列 ─────
  queue: [],
  currentIdx: 0,
  playing: false,
  audioPosition: 0,
  audioDuration: 0,
  audioLoading: false,
  audioError: null,
  setAudioStatus: (position, duration) => set({ audioPosition: position, audioDuration: duration }),
  setAudioLoading: (audioLoading) => set({ audioLoading }),
  setAudioError: (audioError) => set({ audioError }),

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
