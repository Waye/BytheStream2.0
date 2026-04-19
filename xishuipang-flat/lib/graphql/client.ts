import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  type NormalizedCacheObject,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/graphql'
    : 'http://localhost:4000/graphql';

const PROD_URL = 'https://your-app.herokuapp.com/graphql';
const API_URL = __DEV__ ? DEV_URL : PROD_URL;

export const TOKEN_KEY = 'xsp_auth_token';
const CACHE_KEY = 'xsp_apollo_cache';

let cachedToken: string | null = null;

export async function loadStoredToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
    return cachedToken;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null) {
  cachedToken = token;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
}

const httpLink = new HttpLink({ uri: API_URL });

const authLink = setContext(async (_operation, { headers }) => {
  const token = await loadStoredToken();
  return {
    headers: {
      ...(headers || {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

const cache = new InMemoryCache();

// 持久化 Apollo 缓存到 AsyncStorage（fire-and-forget 启动即 restore）
// 首次启动这几百毫秒内 cache 是空的，之后的 query 都从本地秒出
persistCache({
  cache,
  storage: new AsyncStorageWrapper(AsyncStorage),
  key: CACHE_KEY,
  maxSize: 5 * 1024 * 1024, // 5MB
  debug: false,
}).catch((e) => console.warn('Apollo cache restore failed:', e));

export const apolloClient: ApolloClient<NormalizedCacheObject> = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache,
  defaultOptions: {
    // 缓存命中就直接用，不打网络 — 文章/期刊这些内容变化极少
    // 想强制刷新的 query 在 useQuery 里显式传 fetchPolicy: 'network-only'
    watchQuery: { fetchPolicy: 'cache-first' },
    query: { fetchPolicy: 'cache-first' },
  },
});

export async function clearAuthAndCache() {
  await setAuthToken(null);
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
  await apolloClient.clearStore();
}
