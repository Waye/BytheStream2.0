import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTheme, radius, spacing, fontSize } from '../../lib/theme';
import { useAppStore } from '../../lib/store';
import { TopNav, IconButton } from '../../lib/ui';
import { GET_ARTICLE } from '../../lib/graphql';

const FONT_SIZES = [15, 17, 19, 21];
const IMG_BASE = 'https://raw.githubusercontent.com/CGCToronto/ByTheStreamWebsite/master/public/content';

function articleImageUrl(volume: number, filename: string): string {
  return `${IMG_BASE}/volume_${volume}/images/${filename}`;
}

/** 自适应宽高比图片 */
function AutoImage({ uri, maxWidth }: { uri: string; maxWidth: number }) {
  const { theme } = useTheme();
  const [ratio, setRatio] = useState<number | null>(null);

  return (
    <View style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
      <Image
        source={{ uri }}
        style={{
          width: maxWidth,
          height: ratio ? maxWidth / ratio : maxWidth * 0.65,
          borderRadius: radius.md,
          backgroundColor: theme.bgSurface,
        }}
        contentFit="contain"
        cachePolicy="disk"
        transition={200}
        onLoad={(e: any) => {
          const w = e?.source?.width;
          const h = e?.source?.height;
          if (w && h) setRatio(w / h);
        }}
      />
    </View>
  );
}

export default function Reader() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const decoded = decodeURIComponent(id || '');
  const [volStr, ...slugParts] = decoded.split(':');
  const baseSlug = slugParts.join(':');
  const volume = parseInt(volStr, 10) || 1;

  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;
  const [fontIdx, setFontIdx] = useState(1);

  const character = useAppStore(s => s.character);
  const toggleCharacter = useAppStore(s => s.toggleCharacter);
  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const enqueue = useAppStore(s => s.enqueue);
  const playNow = useAppStore(s => s.playNow);

  const slug = useMemo(() => {
    const suffix = character === 'traditional' ? '_t' : '_s';
    const withoutSuffix = baseSlug.replace(/_(s|t)$/, '');
    return withoutSuffix + suffix;
  }, [baseSlug, character]);

  const { data, loading } = useQuery(GET_ARTICLE, {
    variables: { volume, slug },
  });
  const article = data?.article;
  const isFav = article ? favs.has(article.id) : false;

  const imgMaxWidth = Math.min(width - pad * 2, 720 - pad * 2);

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

        {loading || !article ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : (
          <>
            <View style={{
              alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 5,
              borderRadius: radius.md, backgroundColor: theme.brandSoft,
            }}>
              <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: theme.brand }}>
                第 {article.volume} 期 · {article.category}
              </Text>
            </View>

            <Text style={{
              fontSize: isMobile ? 28 : 40, fontWeight: '700', letterSpacing: -1,
              lineHeight: isMobile ? 34 : 46, color: theme.textPrimary, marginTop: spacing.lg,
            }}>{article.title}</Text>
            <Text style={{ marginTop: spacing.md, fontSize: fontSize.body, color: theme.textSecondary }}>
              作者 · {article.author} · 约 {article.mins} 分钟阅读
            </Text>

            <View style={{
              flexDirection: 'row', gap: spacing.sm + 2, alignItems: 'center',
              marginTop: spacing.xl, padding: spacing.md,
              backgroundColor: theme.bgSurface, borderRadius: radius.btn, flexWrap: 'wrap',
            }}>
              <IconButton icon="♥" active={isFav} onPress={() => toggleFav(article)} />
              <IconButton icon="＋" onPress={() => enqueue(article)} />
              <IconButton icon="▶" active onPress={() => playNow(article)} />
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => setFontIdx(i => (i + 1) % FONT_SIZES.length)}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md, paddingVertical: 8,
                  backgroundColor: pressed ? theme.brandSoft : theme.bgElevated, borderRadius: radius.sm,
                })}>
                <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: theme.textPrimary }}>Aa</Text>
              </Pressable>
              <Pressable onPress={toggleCharacter}
                style={({ pressed }) => ({
                  paddingHorizontal: spacing.md, paddingVertical: 8,
                  backgroundColor: pressed ? theme.brandSoft : theme.bgElevated, borderRadius: radius.sm,
                })}>
                <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: theme.textPrimary }}>
                  {character === 'simplified' ? '繁' : '简'}
                </Text>
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.xxl }}>
              {(article.content || []).map((p: string, i: number) => {
                if (p === '') return <View key={i} style={{ height: spacing.md }} />;

                // 图片标记: <filename.jpg> 或 <filename.png, 说明>
                const imgMatch = p.match(/^<([^,>]+\.(jpg|jpeg|png|gif|webp))\s*(?:,.*)?>/i);
                if (imgMatch) {
                  const filename = imgMatch[1];
                  const uri = articleImageUrl(article.volume, filename);
                  return <AutoImage key={i} uri={uri} maxWidth={imgMaxWidth} />;
                }

                return (
                  <Text key={i} style={{
                    fontSize: FONT_SIZES[fontIdx],
                    lineHeight: FONT_SIZES[fontIdx] * 1.8,
                    color: theme.textPrimary,
                    marginBottom: spacing.lg,
                  }}>{p}</Text>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
