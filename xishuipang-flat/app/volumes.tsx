import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, useWindowDimensions,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { TopNav, IconButton } from '../lib/ui';
import { ALL_VOLUMES } from '../lib/mock';

const BATCH = 6;

export default function AllVolumes() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const [count, setCount] = useState(BATCH);
  const visible = ALL_VOLUMES.slice(0, count);
  const done = count >= ALL_VOLUMES.length;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (done) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    if (contentSize.height - (contentOffset.y + layoutMeasurement.height) < 200) {
      setCount(c => Math.min(c + BATCH, ALL_VOLUMES.length));
    }
  };

  const cols = isMobile ? 2 : isTablet ? 4 : 5;
  const gap = isMobile ? 12 : 24;
  const contentWidth = Math.min(width, 1320) - pad * 2;
  const itemWidth = (contentWidth - gap * (cols - 1)) / cols;

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
        }}>全部期刊</Text>
        <Text style={{
          fontSize: fontSize.body, color: theme.textSecondary,
          marginTop: 6, marginBottom: spacing.xl,
        }}>共 {ALL_VOLUMES.length} 期 · 从第 1 期至第 {ALL_VOLUMES[0].id} 期</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {visible.map(v => (
            <Pressable
              key={v.id}
              onPress={() => router.push(`/volume/${v.id}`)}
              style={{ width: itemWidth }}
            >
              <View style={{
                width: '100%', aspectRatio: 3 / 4,
                borderRadius: 14,
                backgroundColor: theme.gradA,
                padding: spacing.lg,
                justifyContent: 'space-between',
                overflow: 'hidden',
              }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', opacity: 0.92 }}>
                  溪水旁
                </Text>
                <View>
                  <Text style={{
                    color: '#fff', fontSize: isMobile ? 36 : 42,
                    fontWeight: '700', letterSpacing: -2,
                    lineHeight: isMobile ? 38 : 46,
                  }}>{v.id}</Text>
                  <Text style={{
                    color: '#fff', fontSize: isMobile ? 12 : 13,
                    fontWeight: '600', opacity: 0.95, marginTop: 6,
                  }}>{v.subtitle}</Text>
                </View>
              </View>
              <View style={{ marginTop: spacing.md, paddingHorizontal: 4 }}>
                <Text style={{
                  fontSize: fontSize.small, fontWeight: '700',
                  color: theme.textPrimary,
                }}>第 {v.id} 期</Text>
                <Text style={{
                  fontSize: 11, color: theme.textSecondary, marginTop: 2,
                }}>{v.count} 篇文章</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={{
          textAlign: 'center', color: theme.textMuted,
          fontSize: fontSize.small, marginVertical: spacing.xl,
        }}>
          {done ? '— 已到底 —' : `加载中 · 已显示 ${count}/${ALL_VOLUMES.length}`}
        </Text>
      </ScrollView>
    </View>
  );
}
