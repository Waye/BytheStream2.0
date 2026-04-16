import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';

export interface Slide {
  tag: string;
  title: string;
  desc: string;
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
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length, fadeAnim]);

  const cur = slides[idx];
  return (
    <View style={{
      borderRadius: isMobile ? 16 : 24, overflow: 'hidden',
      aspectRatio: isMobile ? 2.2 / 1 : 3.2 / 1,
      backgroundColor: theme.gradA, position: 'relative',
    }}>
      <Animated.View style={{
        opacity: fadeAnim, flex: 1,
        padding: isMobile ? 20 : 48, justifyContent: 'center',
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
        }}>{cur.title}</Text>
        {!isMobile && (
          <Text style={{
            color: '#fff', fontSize: 15, marginTop: spacing.md,
            opacity: 0.9, lineHeight: 22, maxWidth: 520,
          }}>{cur.desc}</Text>
        )}
      </Animated.View>

      <View style={{
        position: 'absolute', bottom: isMobile ? 10 : 18, left: isMobile ? 20 : 48,
        flexDirection: 'row', gap: 6,
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
    </View>
  );
}
