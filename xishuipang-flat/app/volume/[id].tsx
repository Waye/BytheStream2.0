import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTheme, radius, spacing, fontSize } from '../../lib/theme';
import { useAppStore, ContentItem } from '../../lib/store';
import { TopNav, Button, IconButton } from '../../lib/ui';
import { GET_ARTICLES_BY_VOLUME, GET_VOLUME } from '../../lib/graphql';

const IMG_BASE = 'https://raw.githubusercontent.com/CGCToronto/ByTheStreamWebsite/master/public/content';

export default function VolumeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const volId = parseInt(id || '1', 10);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const character = useAppStore(s => s.character);
  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const enqueue = useAppStore(s => s.enqueue);
  const playNow = useAppStore(s => s.playNow);

  const { data: volData } = useQuery(GET_VOLUME, { variables: { id: volId } });
  const { data: artData, loading } = useQuery(GET_ARTICLES_BY_VOLUME, {
    variables: { volume: volId, character },
  });

  const vol = volData?.volume || { id: volId, subtitle: '', count: 0, coverSlug: null, coverImage: null };
  const arts: ContentItem[] = artData?.articlesByVolume ?? [];
  const totalMin = arts.reduce((s, a) => s + a.mins, 0);

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
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        <View style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? 20 : 32,
          paddingVertical: isMobile ? 0 : spacing.xxl,
          marginBottom: spacing.xl,
        }}>
          <CoverHero volId={volId} coverImage={vol.coverImage} coverSlug={vol.coverSlug} isMobile={isMobile} />

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: fontSize.caption, fontWeight: '600', color: theme.textSecondary, letterSpacing: 1 }}>月刊</Text>
            <Text style={{
              fontSize: isMobile ? 28 : 44, fontWeight: '700', letterSpacing: -1.2,
              lineHeight: isMobile ? 32 : 48, color: theme.textPrimary, marginTop: spacing.sm,
            }}>第 {volId} 期{vol.subtitle ? ` · ${vol.subtitle}` : ''}</Text>
            <Text style={{ marginTop: spacing.md, fontSize: fontSize.body, color: theme.textSecondary }}>
              {arts.length} 篇文章 · 约 {totalMin} 分钟阅读
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap' }}>
              <Button label="▶ 播放全部" onPress={() => { arts.forEach(a => enqueue(a)); if (arts[0]) playNow(arts[0]); }} />
              <Button label={character === 'simplified' ? '繁體版' : '简体版'} variant="secondary"
                onPress={() => useAppStore.getState().toggleCharacter()} />
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : (
          <View style={{ marginTop: spacing.sm }}>
            {arts.map((a, i) => (
              <TrackRow key={a.id} art={a} index={i} isFav={favs.has(a.id)} isMobile={isMobile}
                onOpen={() => router.push(`/article/${encodeURIComponent(a.id)}`)}
                onFav={() => toggleFav(a)} onAdd={() => enqueue(a)} onPlay={() => playNow(a)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CoverHero({ volId, coverImage, coverSlug, isMobile }: {
  volId: number; coverImage?: string | null; coverSlug?: string | null; isMobile: boolean;
}) {
  const { theme } = useTheme();
  const character = useAppStore(s => s.character);
  const charSuffix = character === 'traditional' ? '_t' : '_s';
  const heroW = isMobile ? 160 : 220;

  const coverUrls = useMemo(() => {
    const base = `${IMG_BASE}/volume_${volId}/images`;
    const urls: string[] = [];
    if (coverImage) urls.push(`${base}/${coverImage}`);
    urls.push(`${base}/cover${charSuffix}.png`);
    urls.push(`${base}/cover${charSuffix}.jpg`);
    if (coverSlug) {
      urls.push(`${base}/${coverSlug}.png`);
      urls.push(`${base}/${coverSlug}.jpg`);
      const numPrefix = coverSlug.match(/^(\d+)_/)?.[1];
      if (numPrefix) {
        urls.push(`${base}/${numPrefix}_cover${charSuffix}.png`);
        urls.push(`${base}/${numPrefix}_cover${charSuffix}.jpg`);
      }
    }
    return [...new Set(urls)];
  }, [volId, coverImage, coverSlug, charSuffix]);

  const [urlIdx, setUrlIdx] = useState(0);
  React.useEffect(() => { setUrlIdx(0); }, [coverUrls.length]);

  const allFailed = urlIdx >= coverUrls.length;
  const currentUri = allFailed ? null : coverUrls[urlIdx];

  return (
    <View style={{
      width: heroW, aspectRatio: 3 / 4, borderRadius: 16,
      backgroundColor: theme.gradA, overflow: 'hidden',
    }}>
      {currentUri && !allFailed ? (
        <>
          <Image
            source={{ uri: currentUri }}
            style={{ position: 'absolute', top: 0, right: 0, width: '200%', height: '100%' }}
            contentFit="cover"
            cachePolicy="disk"
            transition={300}
            onError={() => setUrlIdx(i => i + 1)}
          />
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            padding: isMobile ? spacing.lg : spacing.xl,
            backgroundColor: 'rgba(26,36,56,0.3)',
          }}>
            <Text style={{
              color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: '600',
              textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
            }}>溪水旁</Text>
          </View>
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? spacing.lg : spacing.xl,
            backgroundColor: 'rgba(26,36,56,0.5)',
          }}>
            <Text style={{
              color: '#fff', fontSize: isMobile ? 56 : 72, fontWeight: '700',
              letterSpacing: -3, lineHeight: isMobile ? 60 : 76,
              textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
            }}>{volId}</Text>
          </View>
        </>
      ) : (
        <View style={{ flex: 1, padding: isMobile ? spacing.lg : spacing.xl, justifyContent: 'space-between' }}>
          <Text style={{ color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: '600', opacity: 0.92 }}>溪水旁</Text>
          <View>
            <Text style={{
              color: '#fff', fontSize: isMobile ? 56 : 72, fontWeight: '700',
              letterSpacing: -3, lineHeight: isMobile ? 60 : 76,
            }}>{volId}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function TrackRow({ art, index, isFav, isMobile, onOpen, onFav, onAdd, onPlay }: {
  art: ContentItem; index: number; isFav: boolean; isMobile: boolean;
  onOpen: () => void; onFav: () => void; onAdd: () => void; onPlay: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      gap: isMobile ? 10 : spacing.lg,
      paddingVertical: isMobile ? 10 : spacing.md + 2,
      paddingHorizontal: isMobile ? 10 : spacing.md + 2, borderRadius: 10,
    }}>
      <View style={{ width: isMobile ? 28 : 40, alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.body, color: theme.textMuted }}>{index + 1}</Text>
      </View>
      <Pressable onPress={onOpen} style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ fontSize: isMobile ? fontSize.body : 15, fontWeight: '600', color: theme.textPrimary }}>{art.title}</Text>
        <Text numberOfLines={1} style={{ fontSize: fontSize.caption, color: theme.textSecondary, marginTop: 3 }}>{art.author} · {art.category}</Text>
      </Pressable>
      {!isMobile && <Text style={{ fontSize: fontSize.small, color: theme.textMuted, minWidth: 40 }}>{art.mins} 分钟</Text>}
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <MiniBtn icon="♥" active={isFav} onPress={onFav} />
        {!isMobile && <MiniBtn icon="＋" onPress={onAdd} />}
        <MiniBtn icon="▶" onPress={onPlay} />
      </View>
    </View>
  );
}

function MiniBtn({ icon, active, onPress }: { icon: string; active?: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: active ? theme.brandSoft : pressed ? theme.brandSoft : 'transparent',
    })}>
      <Text style={{ fontSize: 13, color: active ? theme.brand : theme.textSecondary }}>{icon}</Text>
    </Pressable>
  );
}
