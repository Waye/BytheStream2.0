import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, spacing } from '../lib/theme';
import { useAppStore } from '../lib/store';
import {
  TopNav, AnnounceCarousel, ArticleCard, VolumeCard,
  FavCard, SectionHead, EmptyHint,
} from '../lib/ui';
import { LATEST, VOLS, ANNOUNCES, VOLUME_ARTICLES } from '../lib/mock';

export default function Home() {
  const { theme } = useTheme();
  const favs = useAppStore(s => s.favs);
  const allArticles = [...LATEST, ...VOLUME_ARTICLES];
  const favArticles = allArticles.filter(a => favs.has(a.id));
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

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
          maxWidth: 1320,
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: pad,
          paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}
      >
        {/* 公告栏 */}
        <AnnounceCarousel slides={ANNOUNCES} />

        {/* 最新一期 */}
        <SectionHead
          title="最新一期 · 第 55 期"
          linkLabel="查看全部 →"
          onLinkPress={() => router.push('/volume/55')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 18, paddingVertical: 4, paddingBottom: 16 }}
        >
          {LATEST.map(a => (
            <ArticleCard
              key={a.id}
              article={a}
              onOpen={() => router.push(`/article/${a.id}`)}
            />
          ))}
        </ScrollView>

        {/* 我喜欢的 */}
        <SectionHead
          title="我喜欢的"
          linkLabel="管理收藏 →"
          onLinkPress={() => router.push('/favorites')}
        />
        {favArticles.length === 0 ? (
          <EmptyHint>还没有收藏 · 点文章卡上的 ♥ 图标收藏你喜欢的内容</EmptyHint>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14, paddingVertical: 4, paddingBottom: 16 }}
          >
            {favArticles.map(a => (
              <FavCard key={a.id} item={a} onPress={() => router.push(`/article/${a.id}`)} />
            ))}
          </ScrollView>
        )}

        {/* 往期期刊 */}
        <SectionHead
          title="往期期刊"
          linkLabel="全部期刊 →"
          onLinkPress={() => router.push('/volumes')}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 18, paddingVertical: 4, paddingBottom: 16 }}
        >
          {VOLS.map(v => (
            <VolumeCard
              key={v.id} vol={v}
              onPress={() => router.push(`/volume/${v.id}`)}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
}
