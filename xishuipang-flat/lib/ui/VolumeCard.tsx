import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, spacing, fontSize } from '../theme';

const IMG_BASE = 'https://cdn.jsdelivr.net/gh/CGCToronto/ByTheStreamWebsite@master/public/content';

export interface VolumeMeta {
  id: number;
  subtitle: string;
  count: number;
  coverSlug?: string | null;
  coverImage?: string | null;
}

export function VolumeCard({
  vol, onPress, width: customWidth,
}: {
  vol: VolumeMeta;
  onPress: () => void;
  width?: number;
}) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const cardWidth = customWidth || (isMobile ? 130 : 153); // 桌面 180 → 153 (-15%)

  const coverUri = useMemo(() => {
    if (!vol.coverImage) return null;
    return `${IMG_BASE}/volume_${vol.id}/images/${vol.coverImage}`;
  }, [vol.id, vol.coverImage]);

  const [imgError, setImgError] = useState(false);
  const showImage = coverUri && !imgError;

  return (
    <Pressable onPress={onPress} style={{ width: cardWidth }}>
      <View style={{
        width: '100%', aspectRatio: 3 / 4,
        borderRadius: isMobile ? 12 : 14,
        backgroundColor: theme.gradB,
        overflow: 'hidden',
      }}>
        {showImage ? (
          <>
            <Image
              source={{ uri: coverUri! }}
              style={{ position: 'absolute', top: 0, right: 0, width: '200%', height: '100%' }}
              contentFit="cover"
              cachePolicy="disk"
              transition={300}
              onError={() => setImgError(true)}
            />
            <View style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              paddingHorizontal: isMobile ? 10 : 12, paddingBottom: isMobile ? 10 : 12,
              paddingTop: isMobile ? 40 : 48, backgroundColor: 'rgba(26,36,56,0.5)',
            }}>
              <Text style={{
                color: '#fff', fontSize: isMobile ? 28 : 32, fontWeight: '700', letterSpacing: -2,
                textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
              }}>{vol.id}</Text>
            </View>
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              paddingHorizontal: isMobile ? 10 : 12, paddingTop: isMobile ? 10 : 12, paddingBottom: 20,
              backgroundColor: 'rgba(26,36,56,0.3)',
            }}>
              <Text style={{
                color: '#fff', fontSize: isMobile ? 11 : fontSize.small, fontWeight: '600',
                textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
              }}>溪水旁</Text>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, padding: isMobile ? 12 : spacing.md + 2, justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontSize: isMobile ? 11 : fontSize.small, fontWeight: '600', opacity: 0.92 }}>溪水旁</Text>
            <View>
              <Text style={{ color: '#fff', fontSize: isMobile ? 32 : 38, fontWeight: '700', letterSpacing: -2, lineHeight: isMobile ? 34 : 40 }}>{vol.id}</Text>
              <Text style={{ color: '#fff', fontSize: isMobile ? 11 : fontSize.small, fontWeight: '600', opacity: 0.92, marginTop: 4 }}>{vol.subtitle}</Text>
            </View>
          </View>
        )}
      </View>
      <View style={{ marginTop: isMobile ? 8 : spacing.md, paddingHorizontal: 4 }}>
        <Text style={{ fontSize: isMobile ? 12 : fontSize.small, fontWeight: '700', color: theme.textPrimary }}>第 {vol.id} 期</Text>
        <Text style={{ fontSize: isMobile ? 10 : fontSize.caption - 1, color: theme.textSecondary, marginTop: 2 }}>{vol.count} 篇文章</Text>
      </View>
    </Pressable>
  );
}
