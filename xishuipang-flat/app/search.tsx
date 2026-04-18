import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { TopNav, IconButton, EmptyHint } from '../lib/ui';
import { SEARCH_ARTICLES } from '../lib/graphql';
import { apolloClient } from '../lib/graphql';

const PAGE_SIZE = 10;

export default function SearchResults() {
  const { q: qParam } = useLocalSearchParams<{ q: string }>();
  const [q, setQ] = useState(qParam || '');
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const character = useAppStore(s => s.character);
  const playNow = useAppStore(s => s.playNow);

  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // 搜索函数
  const doSearch = useCallback(async (query: string, pageNum: number, append: boolean) => {
    if (!query || loading) return;
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: SEARCH_ARTICLES,
        variables: {
          query,
          character,
          limit: PAGE_SIZE,
          offset: pageNum * PAGE_SIZE,
        },
        fetchPolicy: 'network-only',
      });
      const articles = data?.search?.articles ?? [];
      const t = data?.search?.total ?? 0;
      setTotal(t);
      if (append) {
        setResults(prev => [...prev, ...articles]);
      } else {
        setResults(articles);
      }
      if (articles.length < PAGE_SIZE) setDone(true);
    } finally {
      setLoading(false);
    }
  }, [character, loading]);

  // URL 变化时重新搜索
  useEffect(() => {
    if (qParam !== undefined) {
      setQ(qParam || '');
      setResults([]);
      setPage(0);
      setDone(false);
      if (qParam) {
        doSearch(qParam, 0, false);
      }
    }
  }, [qParam, character]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loading || done || !q) return;
    const nextPage = page + 1;
    setPage(nextPage);
    doSearch(q, nextPage, true);
  }, [loading, done, q, page, doSearch]);

  // 滚动检测
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    if (distanceFromBottom < 300) {
      loadMore();
    }
  }, [loadMore]);

  const goBack = () => { if (router.canGoBack?.()) router.back(); else router.replace('/'); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav
        onLogoPress={() => router.push('/')}
        onLoginPress={() => router.push('/login')}
        onSearchSubmit={(nq) => {
          setQ(nq);
          setResults([]);
          setPage(0);
          setDone(false);
          router.setParams({ q: nq });
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          maxWidth: 900, width: '100%', alignSelf: 'center',
          paddingHorizontal: pad, paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={200}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        <Text style={{
          fontSize: isMobile ? 26 : 36, fontWeight: '700',
          letterSpacing: -1, color: theme.textPrimary,
        }}>搜索结果</Text>
        <Text style={{
          fontSize: fontSize.body, color: theme.textSecondary,
          marginTop: 6, marginBottom: spacing.xl,
        }}>
          关键词「{q || '-'}」 · 已显示 {results.length}{total > results.length ? ` / ${total}` : ''} 篇
        </Text>

        {!q ? (
          <EmptyHint>输入关键词开始搜索</EmptyHint>
        ) : loading && results.length === 0 ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : results.length === 0 ? (
          <EmptyHint>没有匹配的内容,试试其他关键词</EmptyHint>
        ) : (
          <>
            <View style={{ gap: 14 }}>
              {results.map((a: any, idx: number) => (
                <View
                  key={`${a.id}-${idx}`}
                  style={{
                    backgroundColor: theme.bgElevated, borderWidth: 1, borderColor: theme.borderSoft,
                    borderRadius: 14, padding: spacing.md + 2,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2,
                  }}
                >
                  <View style={{
                    width: 52, height: 52, borderRadius: 10, backgroundColor: theme.gradA,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{a.title.slice(0, 1)}</Text>
                  </View>
                  <Pressable
                    onPress={() => router.push(`/article/${encodeURIComponent(a.id)}`)}
                    style={{ flex: 1, minWidth: 0 }}
                  >
                    <Text numberOfLines={1} style={{
                      fontSize: fontSize.body, fontWeight: '700', color: theme.textPrimary,
                    }}>{a.title}</Text>
                    <Text numberOfLines={1} style={{
                      fontSize: fontSize.caption, color: theme.textSecondary, marginTop: 3,
                    }}>{a.author} · 第 {a.volume} 期 · {a.mins} 分钟</Text>
                  </Pressable>
                  <IconButton icon="▶" onPress={() => playNow(a)} />
                </View>
              ))}
            </View>

            {loading && (
              <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xl }} />
            )}
            {done && results.length > PAGE_SIZE && (
              <Text style={{
                textAlign: 'center', color: theme.textMuted,
                fontSize: 12, marginVertical: spacing.xl,
              }}>— 已到底 —</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
