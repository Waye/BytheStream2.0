import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { TopNav, IconButton, EmptyHint } from '../lib/ui';
import { LATEST, VOLUME_ARTICLES } from '../lib/mock';

export default function SearchResults() {
  const { q: qParam } = useLocalSearchParams<{ q: string }>();
  const [q, setQ] = useState(qParam || '');
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  // URL 变化时同步内部状态
  useEffect(() => { if (qParam !== undefined) setQ(qParam || ''); }, [qParam]);

  const playNow = useAppStore(s => s.playNow);

  const all = [...LATEST, ...VOLUME_ARTICLES];
  const results = q
    ? all.filter(a => a.title.includes(q) || a.author.includes(q))
    : [];

  const goBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav
        onLogoPress={() => router.push('/')}
        onLoginPress={() => router.push('/login')}
        onSearchSubmit={(nq) => {
          setQ(nq);
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
        }}>关键词「{q || '-'}」 · 找到 {results.length} 篇内容</Text>

        {results.length === 0 ? (
          <EmptyHint>
            {q ? '没有匹配的内容,试试其他关键词' : '输入关键词开始搜索'}
          </EmptyHint>
        ) : (
          <View style={{ gap: 14 }}>
            {results.map(a => (
              <View
                key={a.id}
                style={{
                  backgroundColor: theme.bgElevated,
                  borderWidth: 1, borderColor: theme.borderSoft,
                  borderRadius: 14, padding: spacing.md + 2,
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2,
                }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 10,
                  backgroundColor: theme.gradA,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>
                    {a.title.slice(0, 1)}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push(`/article/${a.id}`)}
                  style={{ flex: 1, minWidth: 0 }}
                >
                  <Text numberOfLines={1} style={{
                    fontSize: fontSize.body, fontWeight: '700',
                    color: theme.textPrimary,
                  }}>{a.title}</Text>
                  <Text numberOfLines={1} style={{
                    fontSize: fontSize.caption, color: theme.textSecondary,
                    marginTop: 3,
                  }}>{a.author} · 第 {a.volume} 期 · {a.mins} 分钟</Text>
                </Pressable>
                <IconButton icon="▶" onPress={() => playNow(a)} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
