import React, { useEffect, useRef } from 'react';
import { Animated, View, ScrollView, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing } from '../theme';

/**
 * 基础脉动骨架块
 * 用 Animated.loop + opacity 0.5↔1 做灰底闪烁，三端都能跑
 */
function PulseBlock({
  width, height, borderRadius = radius.sm, style,
}: {
  width: number | string;
  height: number | string;
  borderRadius?: number;
  style?: any;
}) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{
        width, height,
        borderRadius,
        backgroundColor: theme.bgSurface,
        opacity,
      }, style]}
    />
  );
}

/**
 * 文章卡骨架（模拟 ArticleCard 轮廓：方图 + 两行标题 + 三按钮）
 */
export function ArticleCardSkeleton() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardWidth = isMobile ? 155 : 188; // 桌面 -15%

  return (
    <View style={{
      width: cardWidth,
      padding: isMobile ? 10 : 14,
      backgroundColor: theme.bgElevated,
      borderRadius: isMobile ? 14 : radius.btn,
      borderWidth: 1,
      borderColor: theme.borderSoft,
    }}>
      <PulseBlock width="100%" height={cardWidth - (isMobile ? 20 : 28)} borderRadius={isMobile ? 10 : radius.md} />
      <View style={{ height: spacing.md }} />
      <PulseBlock width="90%" height={14} />
      <View style={{ height: 6 }} />
      <PulseBlock width="60%" height={11} />
      <View style={{ height: spacing.md }} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <PulseBlock width={0 as any} height={isMobile ? 30 : 34} style={{ flex: 1 }} borderRadius={isMobile ? 8 : radius.sm} />
        <PulseBlock width={0 as any} height={isMobile ? 30 : 34} style={{ flex: 1 }} borderRadius={isMobile ? 8 : radius.sm} />
        <PulseBlock width={0 as any} height={isMobile ? 30 : 34} style={{ flex: 1 }} borderRadius={isMobile ? 8 : radius.sm} />
      </View>
    </View>
  );
}

/**
 * 收藏条骨架（模拟 FavCard：左侧方块 + 两行文字）
 */
export function FavCardSkeleton() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <View style={{
      width: isMobile ? 220 : 238, // 桌面 -15%
      backgroundColor: theme.bgElevated,
      borderRadius: isMobile ? 14 : radius.btn,
      padding: isMobile ? 10 : spacing.md + 2,
      flexDirection: 'row', alignItems: 'center',
      gap: isMobile ? 10 : spacing.md + 2,
      borderWidth: 1, borderColor: theme.borderSoft,
    }}>
      <PulseBlock
        width={isMobile ? 44 : 56}
        height={isMobile ? 44 : 56}
        borderRadius={isMobile ? 8 : 10}
      />
      <View style={{ flex: 1 }}>
        <PulseBlock width="85%" height={13} />
        <View style={{ height: 6 }} />
        <PulseBlock width="55%" height={10} />
      </View>
    </View>
  );
}

/**
 * 封面卡骨架（模拟 VolumeCard：3:4 竖条 + 两行文字）
 */
export function VolumeCardSkeleton() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const cardWidth = isMobile ? 130 : 153; // 桌面 -15%

  return (
    <View style={{ width: cardWidth }}>
      <PulseBlock
        width="100%"
        height={cardWidth * 4 / 3}
        borderRadius={isMobile ? 12 : 14}
      />
      <View style={{ height: spacing.md }} />
      <PulseBlock width="50%" height={12} />
      <View style={{ height: 6 }} />
      <PulseBlock width="70%" height={10} />
    </View>
  );
}

/**
 * 骨架行：横向滚动骨架（用在最新文章 / 推荐 / 往期期刊区块）
 *
 * @param kind 'article' | 'fav' | 'volume'
 * @param count 骨架数量
 */
export function SkeletonRow({
  kind, count = 4,
}: {
  kind: 'article' | 'fav' | 'volume';
  count?: number;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const Comp =
    kind === 'article' ? ArticleCardSkeleton
    : kind === 'fav' ? FavCardSkeleton
    : VolumeCardSkeleton;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: pad,
        gap: isMobile ? 12 : 16,
      }}
      scrollEnabled={false}
    >
      {Array.from({ length: count }, (_, i) => <Comp key={i} />)}
    </ScrollView>
  );
}
