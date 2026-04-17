import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing, fontSize } from '../lib/theme';
import { useAppStore, ContentItem } from '../lib/store';
import { TopNav, IconButton, Button, EmptyHint } from '../lib/ui';
import { LATEST, VOLUME_ARTICLES } from '../lib/mock';

interface ReadItem extends ContentItem {
  readAt: string;
}

export default function Profile() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const favs = useAppStore(s => s.favs);
  const toggleFav = useAppStore(s => s.toggleFav);
  const all = [...LATEST, ...VOLUME_ARTICLES];
  const favList = all.filter(a => favs.has(a.id));

  const [readList, setReadList] = useState<ReadItem[]>(
    all.slice(0, 6).map((a, i) => ({ ...a, readAt: `${i + 1} 天前` })),
  );
  const removeRead = (id: number) => setReadList(l => l.filter(a => a.id !== id));

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
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        {/* 资料头部 */}
        <View style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', gap: spacing.lg + 4,
          paddingVertical: spacing.xl,
          borderBottomWidth: 1, borderBottomColor: theme.borderSoft,
          marginBottom: spacing.lg,
        }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: theme.gradA,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>李</Text>
          </View>
          <View style={{
            flex: isMobile ? undefined : 1,
            alignItems: isMobile ? 'center' : 'flex-start',
          }}>
            <Text style={{
              fontSize: 26, fontWeight: '700',
              letterSpacing: -0.5, color: theme.textPrimary,
            }}>李弟兄</Text>
            <Text style={{
              fontSize: fontSize.body, color: theme.textSecondary, marginTop: 4,
              textAlign: isMobile ? 'center' : 'left',
            }}>lichen@example.com · 已阅读 {readList.length} 篇 · 收藏 {favList.length} 篇</Text>
          </View>
          <Button label="编辑资料" variant="secondary" />
        </View>

        {/* 阅读记录 */}
        <Text style={{
          fontSize: 20, fontWeight: '700',
          color: theme.textPrimary,
          marginTop: spacing.xl, marginBottom: spacing.md + 2,
        }}>近一个月阅读记录</Text>

        {readList.length === 0 ? (
          <EmptyHint>暂无阅读记录</EmptyHint>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {readList.map(a => (
              <InfoRow
                key={a.id}
                item={a}
                meta={`${a.author} · 阅读于 ${a.readAt}`}
                itemWidth={itemWidth}
                onOpen={() => router.push(`/article/${a.id}`)}
                onRemove={() => removeRead(a.id)}
              />
            ))}
          </View>
        )}

        {/* 收藏摘要 */}
        <View style={{
          flexDirection: 'row', alignItems: 'baseline',
          marginTop: spacing.xxl, marginBottom: spacing.md + 2,
        }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: theme.textPrimary }}>
            我喜欢的内容
          </Text>
          <Pressable onPress={() => router.push('/favorites')}>
            <Text style={{
              fontSize: fontSize.small, fontWeight: '600',
              color: theme.textSecondary, marginLeft: spacing.md,
            }}>管理 →</Text>
          </Pressable>
        </View>

        {favList.length === 0 ? (
          <EmptyHint>还没有收藏</EmptyHint>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {favList.slice(0, 6).map(a => (
              <InfoRow
                key={a.id}
                item={a}
                meta={`${a.author} · 第 ${a.volume} 期`}
                itemWidth={itemWidth}
                onOpen={() => router.push(`/article/${a.id}`)}
                onRemove={() => toggleFav(a.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({
  item, meta, itemWidth, onOpen, onRemove,
}: {
  item: ContentItem;
  meta: string;
  itemWidth: number;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        width: itemWidth,
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
          {item.title.slice(0, 1)}
        </Text>
      </View>
      <Pressable onPress={onOpen} style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontSize: fontSize.body, fontWeight: '700',
          color: theme.textPrimary,
        }}>{item.title}</Text>
        <Text numberOfLines={1} style={{
          fontSize: fontSize.caption, color: theme.textSecondary,
          marginTop: 3,
        }}>{meta}</Text>
      </Pressable>
      <Pressable
        onPress={onRemove}
        style={({ pressed }) => ({
          width: 34, height: 34, borderRadius: 17,
          backgroundColor: pressed ? theme.danger : theme.bgSurface,
          alignItems: 'center', justifyContent: 'center',
        })}
      >
        <Text style={{ color: theme.textMuted, fontSize: 14 }}>✕</Text>
      </Pressable>
    </View>
  );
}
