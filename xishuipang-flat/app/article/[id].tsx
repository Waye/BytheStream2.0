import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTheme, radius, spacing, fontSize } from '../../lib/theme';
import { useAppStore } from '../../lib/store';
import { TopNav, IconButton } from '../../lib/ui';
import { GET_ARTICLE } from '../../lib/graphql';

const FONT_SIZES = [15, 17, 19, 21];
const IMG_BASE = 'https://cdn.jsdelivr.net/gh/CGCToronto/ByTheStreamWebsite@master/public/content';

// 首屏立刻渲染的图片数（其余延后 200ms 挂载）
const EAGER_IMAGE_COUNT = 2;

function articleImageUrl(volume: number, filename: string): string {
  return `${IMG_BASE}/volume_${volume}/images/${filename}`;
}

/**
 * 自适应图片：
 * - eager 模式：高优先级，立刻拉
 * - lazy 模式：低优先级 + 占位高度，让浏览器先把文字/前几张图渲完
 * - 给定预估宽高比避免布局跳动（onLoad 后再校准）
 */
function AutoImage({
  uri, maxWidth, eager, indexInArticle,
}: {
  uri: string;
  maxWidth: number;
  eager: boolean;
  indexInArticle: number;
}) {
  const { theme } = useTheme();
  // 给一个保守预估高度（4:3 横图最常见），避免完全没占位文字一直跳
  const [ratio, setRatio] = useState<number | null>(null);
  const estimatedHeight = ratio ? maxWidth / ratio : maxWidth * 0.66;

  return (
    <View style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
      <Image
        source={{ uri }}
        style={{
          width: maxWidth,
          height: estimatedHeight,
          borderRadius: radius.md,
          backgroundColor: theme.bgSurface,
        }}
        contentFit="contain"
        cachePolicy="disk"
        transition={150}
        priority={eager ? 'high' : 'low'}
        onLoad={(e: any) => {
          const w = e?.source?.width;
          const h = e?.source?.height;
          if (w && h && !ratio) setRatio(w / h);
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
    fetchPolicy: 'cache-first',
  });
  const article = data?.article;
  const isFav = article ? favs.has(article.id) : false;

  const imgMaxWidth = Math.min(width - pad * 2, 720 - pad * 2);

  // 延后挂载策略：开始时只渲染前 EAGER_IMAGE_COUNT 张，其余 200ms 后再挂
  const [showAllImages, setShowAllImages] = useState(false);
  useEffect(() => {
    setShowAllImages(false);
    if (!article) return;
    const t = setTimeout(() => setShowAllImages(true), 200);
    return () => clearTimeout(t);
  }, [article?.id]);

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

        {loading ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : !article ? (
          <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.body, color: theme.textSecondary }}>
              找不到这篇文章（volume {volume} · {slug}）
            </Text>
            <Pressable onPress={goBack} style={{ marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: theme.brand, borderRadius: radius.btn }}>
              <Text style={{ color: theme.onBrand, fontWeight: '600' }}>返回</Text>
            </Pressable>
          </View>
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
              {(() => {
                let imageIdx = 0;
                return (article.content || []).map((p: string, i: number) => {
                  if (p === '') return <View key={i} style={{ height: spacing.md }} />;

                  const imgMatch = p.match(/^<([^,>]+\.(jpg|jpeg|png|gif|webp))\s*(?:,.*)?>/i);
                  if (imgMatch) {
                    const filename = imgMatch[1];
                    const uri = articleImageUrl(article.volume, filename);
                    const myIdx = imageIdx++;
                    const isEager = myIdx < EAGER_IMAGE_COUNT;
                    // lazy 图片只在 showAllImages 后挂载，之前用占位
                    if (!isEager && !showAllImages) {
                      return (
                        <View key={i} style={{
                          width: imgMaxWidth,
                          height: imgMaxWidth * 0.66,
                          alignSelf: 'center',
                          backgroundColor: theme.bgSurface,
                          borderRadius: radius.md,
                          marginBottom: spacing.lg,
                        }} />
                      );
                    }
                    return (
                      <AutoImage
                        key={i}
                        uri={uri}
                        maxWidth={imgMaxWidth}
                        eager={isEager}
                        indexInArticle={myIdx}
                      />
                    );
                  }

                  return (
                    <Text key={i} style={{
                      fontSize: FONT_SIZES[fontIdx],
                      lineHeight: FONT_SIZES[fontIdx] * 1.8,
                      color: theme.textPrimary,
                      marginBottom: spacing.lg,
                    }}>{p}</Text>
                  );
                });
              })()}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
