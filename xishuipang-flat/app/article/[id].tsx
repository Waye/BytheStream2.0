import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, radius, spacing, fontSize } from '../../lib/theme';
import { useAppStore } from '../../lib/store';
import { TopNav, IconButton } from '../../lib/ui';
import { LATEST, VOLUME_ARTICLES, SAMPLE_CONTENT } from '../../lib/mock';

const FONT_SIZES = [15, 17, 19, 21];

export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const artId = parseInt(id || '1', 10);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const [fontIdx, setFontIdx] = useState(1);
  const [trad, setTrad] = useState(false);

  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const enqueue = useAppStore(s => s.enqueue);
  const playNow = useAppStore(s => s.playNow);

  const article = [...LATEST, ...VOLUME_ARTICLES].find(a => a.id === artId) || LATEST[0];
  const isFav = favs.has(article.id);

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
          maxWidth: 720, width: '100%', alignSelf: 'center',
          paddingHorizontal: pad, paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        {/* 徽章 */}
        <View style={{
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.md, paddingVertical: 5,
          borderRadius: radius.md,
          backgroundColor: theme.brandSoft,
        }}>
          <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: theme.brand }}>
            第 {article.volume} 期 · 2025
          </Text>
        </View>

        <Text style={{
          fontSize: isMobile ? 28 : 40, fontWeight: '700',
          letterSpacing: -1, lineHeight: isMobile ? 34 : 46,
          color: theme.textPrimary, marginTop: spacing.lg,
        }}>{article.title}</Text>
        <Text style={{
          marginTop: spacing.md,
          fontSize: fontSize.body, color: theme.textSecondary,
        }}>作者 · {article.author} · 约 {article.mins} 分钟阅读</Text>

        {/* 工具栏 */}
        <View style={{
          flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'center',
          marginTop: spacing.xl,
          padding: spacing.md,
          backgroundColor: theme.bgSurface, borderRadius: radius.btn,
          flexWrap: 'wrap',
        }}>
          <IconButton icon="♥" active={isFav} onPress={() => toggleFav(article.id)} />
          <IconButton icon="＋" onPress={() => enqueue(article)} />
          <IconButton icon="▶" active onPress={() => playNow(article)} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setFontIdx(i => (i + 1) % FONT_SIZES.length)}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.md, paddingVertical: 8,
              backgroundColor: pressed ? theme.brandSoft : theme.bgElevated,
              borderRadius: radius.sm,
            })}
          >
            <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: theme.textPrimary }}>Aa</Text>
          </Pressable>
          <Pressable
            onPress={() => setTrad(t => !t)}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.md, paddingVertical: 8,
              backgroundColor: pressed ? theme.brandSoft : theme.bgElevated,
              borderRadius: radius.sm,
            })}
          >
            <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: theme.textPrimary }}>
              {trad ? '繁' : '简'}
            </Text>
          </Pressable>
        </View>

        {/* 正文 */}
        <View style={{ marginTop: spacing.xxl }}>
          {SAMPLE_CONTENT.map((p, i) => p === '' ? (
            <View key={i} style={{ height: spacing.md }} />
          ) : (
            <Text
              key={i}
              style={{
                fontSize: FONT_SIZES[fontIdx],
                lineHeight: FONT_SIZES[fontIdx] * 1.8,
                color: theme.textPrimary,
                marginBottom: spacing.lg,
              }}
            >{p}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
