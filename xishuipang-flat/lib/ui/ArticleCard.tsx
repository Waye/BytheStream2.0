import React, { useState } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, radius, spacing, fontSize } from '../theme';
import { useAppStore, ContentItem } from '../store';

const IMG_BASE = 'https://cdn.jsdelivr.net/gh/CGCToronto/ByTheStreamWebsite@master/public/content';

export function ArticleCard({
  article, onOpen,
}: {
  article: ContentItem;
  onOpen: () => void;
}) {
  const { theme } = useTheme();
  const isFav = useAppStore(s => s.favs.has(article.id));
  const toggleFav = useAppStore(s => s.toggleFav);
  const enqueue = useAppStore(s => s.enqueue);
  const playNow = useAppStore(s => s.playNow);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardWidth = isMobile ? 155 : 188; // 桌面 220 → 188 (-15%)

  const [imgError, setImgError] = useState(false);
  const firstImage = (article as any).firstImage;
  const hasImage = !!firstImage && !imgError;
  const imageUri = firstImage
    ? `${IMG_BASE}/volume_${article.volume}/images/${firstImage}`
    : null;

  const handleToggleFav = () => toggleFav(article);

  return (
    <View style={{
      width: cardWidth, padding: isMobile ? 10 : 14,
      backgroundColor: theme.bgElevated,
      borderRadius: isMobile ? 14 : radius.btn,
      borderWidth: 1, borderColor: theme.borderSoft,
    }}>
      <Pressable onPress={onOpen}>
        <View style={{
          width: '100%', aspectRatio: 1,
          borderRadius: isMobile ? 10 : radius.md,
          backgroundColor: theme.gradA,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: isMobile ? 8 : spacing.md,
          overflow: 'hidden',
        }}>
          {hasImage && imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={200}
              onError={() => setImgError(true)}
            />
          ) : (
            <Text style={{ color: '#fff', fontSize: isMobile ? 28 : 32, fontWeight: '700' }}>
              {article.title.slice(0, 1)}
            </Text>
          )}
        </View>
        <Text
          numberOfLines={2}
          style={{
            fontSize: isMobile ? fontSize.small : fontSize.body, fontWeight: '700',
            color: theme.textPrimary, lineHeight: isMobile ? 17 : 19,
            minHeight: isMobile ? 34 : 38,
          }}
        >{article.title}</Text>
        <Text style={{
          marginTop: 3, fontSize: isMobile ? 11 : fontSize.caption,
          color: theme.textSecondary,
        }}>
          {article.author} · {article.mins} 分钟
        </Text>
      </Pressable>

      <View style={{
        flexDirection: 'row', gap: isMobile ? 4 : 6,
        marginTop: isMobile ? 8 : spacing.md,
        paddingTop: isMobile ? 8 : spacing.md,
        borderTopWidth: 1, borderTopColor: theme.borderSoft,
      }}>
        <ActionBtn icon="♥" active={isFav} onPress={handleToggleFav} isMobile={isMobile} />
        <ActionBtn icon="＋" onPress={() => enqueue(article)} isMobile={isMobile} />
        <ActionBtn icon="▶" primary onPress={() => playNow(article)} isMobile={isMobile} />
      </View>
    </View>
  );
}

function ActionBtn({
  icon, active, primary, onPress, isMobile,
}: {
  icon: string; active?: boolean; primary?: boolean; onPress: () => void; isMobile?: boolean;
}) {
  const { theme } = useTheme();
  const bg = primary || active ? theme.brand : theme.bgSurface;
  const fg = primary || active ? theme.onBrand : theme.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, height: isMobile ? 30 : 34,
        borderRadius: isMobile ? 8 : radius.sm,
        backgroundColor: pressed && !primary && !active ? theme.brandSoft : bg,
        alignItems: 'center', justifyContent: 'center',
      })}
    >
      <Text style={{ color: fg, fontSize: isMobile ? 12 : fontSize.body }}>{icon}</Text>
    </Pressable>
  );
}
