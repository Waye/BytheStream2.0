import React from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, radius, spacing, fontSize } from '../../lib/theme';
import { useAppStore, ContentItem } from '../../lib/store';
import { TopNav, Button, IconButton } from '../../lib/ui';
import { VOLS, ALL_VOLUMES, VOLUME_ARTICLES } from '../../lib/mock';

export default function VolumeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const volId = parseInt(id || '55', 10);
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const enqueue = useAppStore(s => s.enqueue);
  const playNow = useAppStore(s => s.playNow);

  const vol =
    [...VOLS, ...ALL_VOLUMES].find(v => v.id === volId) ||
    { id: volId, subtitle: '安静的力量', count: 12 };
  const arts = VOLUME_ARTICLES;
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

        {/* Hero 区 - Spotify 专辑式 */}
        <View style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? 20 : 32,
          paddingVertical: isMobile ? 0 : spacing.xxl,
          marginBottom: spacing.xl,
        }}>
          <View style={{
            width: isMobile ? 160 : 220,
            aspectRatio: 3 / 4,
            borderRadius: 16,
            backgroundColor: theme.gradA,
            padding: isMobile ? spacing.lg : spacing.xl,
            justifyContent: 'space-between',
            overflow: 'hidden',
          }}>
            <Text style={{ color: '#fff', fontSize: isMobile ? 13 : 14, fontWeight: '600', opacity: 0.92 }}>
              溪水旁
            </Text>
            <View>
              <Text style={{
                color: '#fff',
                fontSize: isMobile ? 56 : 72,
                fontWeight: '700',
                letterSpacing: -3,
                lineHeight: isMobile ? 60 : 76,
              }}>{volId}</Text>
              <Text style={{
                color: '#fff', fontSize: isMobile ? 13 : 14,
                fontWeight: '600', opacity: 0.95, marginTop: spacing.sm,
              }}>{vol.subtitle}</Text>
            </View>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontSize: fontSize.caption, fontWeight: '600',
              color: theme.textSecondary, letterSpacing: 1,
              textTransform: 'uppercase',
            }}>月刊 · 2025</Text>
            <Text style={{
              fontSize: isMobile ? 28 : 44, fontWeight: '700',
              letterSpacing: -1.2, lineHeight: isMobile ? 32 : 48,
              color: theme.textPrimary, marginTop: spacing.sm,
            }}>第 {volId} 期 · {vol.subtitle}</Text>
            <Text style={{
              marginTop: spacing.md,
              fontSize: fontSize.body, color: theme.textSecondary,
            }}>{arts.length} 篇文章 · 约 {totalMin} 分钟阅读</Text>
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, flexWrap: 'wrap' }}>
              <Button
                label="▶ 播放全部"
                onPress={() => {
                  arts.forEach(a => enqueue(a));
                  playNow(arts[0]);
                }}
              />
              <Button label="♡ 收藏期刊" variant="secondary" />
            </View>
          </View>
        </View>

        {/* 曲目列表 */}
        <View style={{ marginTop: spacing.sm }}>
          {arts.map((a, i) => (
            <TrackRow
              key={a.id}
              art={a}
              index={i}
              isFav={favs.has(a.id)}
              isMobile={isMobile}
              onOpen={() => router.push(`/article/${a.id}`)}
              onFav={() => toggleFav(a.id)}
              onAdd={() => enqueue(a)}
              onPlay={() => playNow(a)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TrackRow({
  art, index, isFav, isMobile, onOpen, onFav, onAdd, onPlay,
}: {
  art: ContentItem;
  index: number;
  isFav: boolean;
  isMobile: boolean;
  onOpen: () => void;
  onFav: () => void;
  onAdd: () => void;
  onPlay: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      gap: isMobile ? 10 : spacing.lg,
      paddingVertical: isMobile ? 10 : spacing.md + 2,
      paddingHorizontal: isMobile ? 10 : spacing.md + 2,
      borderRadius: 10,
    }}>
      <View style={{ width: isMobile ? 28 : 40, alignItems: 'center' }}>
        <Text style={{ fontSize: fontSize.body, color: theme.textMuted }}>{index + 1}</Text>
      </View>
      <Pressable onPress={onOpen} style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontSize: isMobile ? fontSize.body : 15, fontWeight: '600',
          color: theme.textPrimary,
        }}>{art.title}</Text>
        <Text numberOfLines={1} style={{
          fontSize: fontSize.caption, color: theme.textSecondary, marginTop: 3,
        }}>{art.author}</Text>
      </Pressable>
      {!isMobile && (
        <Text style={{ fontSize: fontSize.small, color: theme.textMuted, minWidth: 40 }}>
          {art.mins}:00
        </Text>
      )}
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 32, height: 32, borderRadius: 16,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? theme.brandSoft : pressed ? theme.brandSoft : 'transparent',
      })}
    >
      <Text style={{ fontSize: 13, color: active ? theme.brand : theme.textSecondary }}>{icon}</Text>
    </Pressable>
  );
}
