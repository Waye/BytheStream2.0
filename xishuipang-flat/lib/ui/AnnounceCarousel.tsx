import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Pressable, Linking, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, radius, spacing, fontSize } from '../theme';

export interface Slide {
  tag: string;
  title: string;
  desc: string;
  image?: any;  // require() 本地图片 或 { uri: string }
  link?: string; // 外部链接
}

export function AnnounceCarousel({ slides }: { slides: Slide[] }) {
  const { theme } = useTheme();
  const [idx, setIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    const t = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setIdx(i => (i + 1) % slides.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      }, 250);
    }, 6000);
    return () => clearInterval(t);
  }, [slides.length, fadeAnim]);

  const cur = slides[idx];

  const handlePress = () => {
    if (cur.link) {
      Linking.openURL(cur.link).catch(() => {});
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        borderRadius: isMobile ? 16 : 24, overflow: 'hidden',
        aspectRatio: isMobile ? 2.2 / 1 : 3.2 / 1,
        backgroundColor: theme.gradA, position: 'relative',
      }}
    >
      {/* 背景图 */}
      {cur.image && (
        <Image
          source={cur.image}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          contentFit="cover"
          cachePolicy="disk"
          transition={300}
        />
      )}

      {/* 暗色遮罩（有图时加重，无图时不加） */}
      {cur.image && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(26,36,56,0.55)',
        }} />
      )}

      {/* 内容 */}
      <Animated.View style={{
        opacity: fadeAnim, flex: 1,
        padding: isMobile ? 20 : 48, justifyContent: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <View style={{
          alignSelf: 'flex-start',
          paddingHorizontal: isMobile ? 8 : spacing.md, paddingVertical: isMobile ? 3 : 5,
          borderRadius: radius.md,
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}>
          <Text style={{ color: '#fff', fontSize: isMobile ? 10 : fontSize.caption, fontWeight: '600' }}>
            {cur.tag}
          </Text>
        </View>
        <Text style={{
          color: '#fff',
          fontSize: isMobile ? 20 : 38, fontWeight: '700',
          lineHeight: isMobile ? 26 : 44, letterSpacing: -1,
          marginTop: isMobile ? 8 : spacing.lg,
          textShadowColor: cur.image ? 'rgba(0,0,0,0.5)' : 'transparent',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: cur.image ? 4 : 0,
        }}>{cur.title}</Text>
        {!isMobile && (
          <Text style={{
            color: '#fff', fontSize: 15, marginTop: spacing.md,
            opacity: 0.92, lineHeight: 22, maxWidth: 520,
            textShadowColor: cur.image ? 'rgba(0,0,0,0.5)' : 'transparent',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: cur.image ? 3 : 0,
          }}>{cur.desc}</Text>
        )}

        {/* 链接提示 */}
        {cur.link && !isMobile && (
          <Text style={{
            color: '#fff', fontSize: fontSize.caption, fontWeight: '600',
            marginTop: spacing.md, opacity: 0.7,
          }}>点击了解更多 →</Text>
        )}
      </Animated.View>

      {/* 底部指示点 */}
      <View style={{
        position: 'absolute', bottom: isMobile ? 10 : 18, left: isMobile ? 20 : 48,
        flexDirection: 'row', gap: 6, zIndex: 2,
      }}>
        {slides.map((_, i) => (
          <Pressable key={i} onPress={() => setIdx(i)}>
            <View style={{
              width: isMobile ? 16 : 22, height: 4, borderRadius: 2,
              backgroundColor: i === idx ? '#fff' : 'rgba(255,255,255,0.4)',
            }}/>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}
