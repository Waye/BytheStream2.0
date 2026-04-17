import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, useWindowDimensions,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { TopNav, IconButton, EmptyHint } from '../lib/ui';
import { LATEST, VOLUME_ARTICLES } from '../lib/mock';

const BATCH = 6;

export default function FavoritesPage() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const favList = [...LATEST, ...VOLUME_ARTICLES].filter(a => favs.has(a.id));

  const [count, setCount] = useState(BATCH);
  const visible = favList.slice(0, count);
  const done = count >= favList.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (done) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentSize.height - (contentOffset.y + layoutMeasurement.height) < 200) {
      setCount(c => Math.min(c + BATCH, favList.length));
    }
  };

  const cols = isMobile ? 1 : width < 1024 ? 2 : 3;
  const gap = 14;
  const contentWidth = Math.min(width, 1320) - pad * 2;
  const itemWidth = cols === 1 ? contentWidth : (contentWidth - gap * (cols - 1)) / cols;

  const goBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav
        onLogoPress={() => router.push('/')}
        onLoginPress={() => router.push('/login')}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          maxWidth: 1320, width: '100%', alignSelf: 'center',
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
        }}>我喜欢的</Text>
        <Text style={{
          fontSize: fontSize.body, color: theme.textSecondary,
          marginTop: 6, marginBottom: spacing.xl,
        }}>{favList.length} 篇 · 点 ✕ 移除收藏</Text>

        {favList.length === 0 ? (
          <EmptyHint>还没有收藏 · 去首页或期刊页点 ♥ 添加内容</EmptyHint>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
              {visible.map(a => (
                <View
                  key={a.id}
                  style={{
                    width: itemWidth,
                    backgroundColor: theme.bgElevated,
                    borderWidth: 1, borderColor: theme.borderSoft,
                    borderRadius: 14, padding: spacing.md + 2,
                    flexDirection: 'row', alignItems: 'center',
                    gap: spacing.md + 2,
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
                  <Pressable
                    onPress={() => toggleFav(a.id)}
                    style={({ pressed }) => ({
                      width: 34, height: 34, borderRadius: 17,
                      backgroundColor: pressed ? theme.danger : theme.bgSurface,
                      alignItems: 'center', justifyContent: 'center',
                    })}
                  >
                    <Text style={{ color: theme.textMuted, fontSize: 14 }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </View>
            <Text style={{
              textAlign: 'center', color: theme.textMuted,
              fontSize: fontSize.small, marginVertical: spacing.xl,
            }}>
              {done
                ? (favList.length > BATCH ? '— 已到底 —' : '')
                : `加载中 · 已显示 ${count}/${favList.length}`}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
