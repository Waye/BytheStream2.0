import React, { useState, useEffect } from 'react';
import {
  ScrollView, View, Text, Pressable, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTheme, spacing, radius, fontSize } from '../lib/theme';
import { useAppStore } from '../lib/store';
import {
  TopNav, AnnounceCarousel, ArticleCard, VolumeCard,
  FavCard, SectionHead, EmptyHint,
} from '../lib/ui';
import { ANNOUNCES } from '../lib/mock';
import { GET_LATEST_VOLUME, GET_ARTICLES_BY_VOLUME, GET_VOLUMES } from '../lib/graphql';

export default function Home() {
  const { theme } = useTheme();
  const character = useAppStore(s => s.character);
  const favItems = useAppStore(s => s.favItems);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const { data: latestData } = useQuery(GET_LATEST_VOLUME);
  const latestVol = latestData?.latestVolume;

  const [selectedVol, setSelectedVol] = useState<number | null>(null);
  useEffect(() => {
    if (latestVol && selectedVol === null) setSelectedVol(latestVol);
  }, [latestVol]);

  const activeVol = selectedVol || latestVol;
  const volOptions = latestVol
    ? Array.from({ length: Math.min(10, latestVol) }, (_, i) => latestVol - i)
    : [];

  const { data: artData, loading: artLoading } = useQuery(GET_ARTICLES_BY_VOLUME, {
    variables: { volume: activeVol, character },
    skip: !activeVol,
  });
  const articles = artData?.articlesByVolume ?? [];

  const { data: volData } = useQuery(GET_VOLUMES, {
    variables: { offset: 1, limit: 6 },
  });
  const pastVolumes = volData?.volumes ?? [];

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
          paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}
      >
        <View style={{ paddingHorizontal: pad }}>
          <AnnounceCarousel slides={ANNOUNCES} />
        </View>

        {/* 期号选择 + 文章 */}
        <View style={{ paddingHorizontal: pad }}>
          <SectionHead
            title={activeVol ? `第 ${activeVol} 期 · ${activeVol === latestVol ? '最新文章' : '文章'}` : '最新文章'}
            linkLabel="查看本期 →"
            onLinkPress={() => activeVol && router.push(`/volume/${activeVol}`)}
          />
        </View>

        {volOptions.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: pad, gap: isMobile ? 6 : 8, marginBottom: isMobile ? spacing.md : spacing.lg }}>
            {volOptions.map(v => {
              const isActive = v === activeVol;
              return (
                <Pressable key={v} onPress={() => setSelectedVol(v)}
                  style={{
                    paddingHorizontal: isMobile ? 12 : 16, paddingVertical: isMobile ? 6 : 8,
                    borderRadius: radius.full,
                    backgroundColor: isActive ? theme.brand : theme.bgSurface,
                    borderWidth: 1, borderColor: isActive ? theme.brand : theme.borderSoft,
                  }}>
                  <Text style={{
                    fontSize: isMobile ? 12 : fontSize.small,
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? theme.onBrand : theme.textSecondary,
                  }}>{v === latestVol ? `${v} 最新` : String(v)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {artLoading ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : articles.length === 0 ? (
          <View style={{ paddingHorizontal: pad }}><EmptyHint>暂无文章</EmptyHint></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: pad, gap: isMobile ? 12 : 20 }}
            style={{ marginBottom: spacing.xl }}>
            {articles.map((a: any) => (
              <ArticleCard key={a.id} article={a}
                onOpen={() => router.push(`/article/${encodeURIComponent(a.id)}`)} />
            ))}
          </ScrollView>
        )}

        {/* 我的收藏 — 横向滚动，最新在前 */}
        <View style={{ paddingHorizontal: pad }}>
          <SectionHead title="我的收藏"
            linkLabel={favItems.length > 0 ? '管理 →' : undefined}
            onLinkPress={() => router.push('/favorites')} />
        </View>
        {favItems.length > 0 ? (
          <View style={{ position: 'relative', marginBottom: spacing.xl }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={true}
              contentContainerStyle={{ paddingHorizontal: pad, gap: isMobile ? 12 : 16 }}>
              {favItems.map((a) => (
                <FavCard key={a.id} item={a}
                  onPress={() => router.push(`/article/${encodeURIComponent(a.id)}`)} />
              ))}
            </ScrollView>
            {favItems.length > (isMobile ? 2 : 4) && (
              <View pointerEvents="none" style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: 40,
                backgroundColor: 'transparent',
                alignItems: 'flex-end', justifyContent: 'center',
                paddingRight: 4,
              }}>
                <View style={{
                  backgroundColor: theme.bgElevated,
                  borderWidth: 1, borderColor: theme.borderSoft,
                  borderRadius: 999, width: 28, height: 28,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '600' }}>›</Text>
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: pad }}>
            <EmptyHint>还没有收藏 · 点文章卡上的 ♥ 图标收藏你喜欢的内容</EmptyHint>
          </View>
        )}

        {/* 往期期刊 */}
        <View style={{ paddingHorizontal: pad, marginTop: spacing.xl }}>
          <SectionHead title="往期期刊" linkLabel="全部期刊 →"
            onLinkPress={() => router.push('/volumes')} />
        </View>
        {pastVolumes.length === 0 ? (
          <View style={{ paddingHorizontal: pad }}><EmptyHint>暂无往期</EmptyHint></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: pad, gap: isMobile ? 12 : 20, paddingBottom: spacing.lg }}>
            {pastVolumes.map((v: any) => (
              <VolumeCard key={v.id} vol={v} onPress={() => router.push(`/volume/${v.id}`)} />
            ))}
          </ScrollView>
        )}

        {/* Footer */}
        <View style={{
          marginTop: isMobile ? 40 : 64,
          paddingTop: isMobile ? 28 : 40,
          paddingBottom: isMobile ? 20 : 32,
          paddingHorizontal: pad,
          borderTopWidth: 1,
          borderTopColor: theme.borderSoft,
        }}>
          <Text style={{
            fontSize: isMobile ? 18 : 22, fontWeight: '700',
            color: theme.textPrimary, marginBottom: spacing.md,
          }}>溪水旁</Text>
          <Text style={{ fontSize: fontSize.caption, color: theme.textSecondary, lineHeight: 20 }}>
            多伦多华人福音堂
          </Text>
          <Text style={{ fontSize: fontSize.caption, color: theme.textMuted, marginTop: 2 }}>
            © 2005–2026 Chinese Gospel Church of Toronto
          </Text>

          <View style={{ flexDirection: 'row', gap: isMobile ? 16 : 24, marginTop: spacing.lg }}>
            <Pressable onPress={() => router.push('/legal')}>
              <Text style={{ fontSize: fontSize.caption, color: theme.textSecondary, fontWeight: '600' }}>
                法律声明
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={{ fontSize: fontSize.caption, color: theme.textSecondary, fontWeight: '600' }}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: spacing.lg }}>
            电子版网址：www.xishuipang.com · 投稿与咨询：cgc_pen@yahoo.com
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
