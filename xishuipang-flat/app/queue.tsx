import React from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useTheme, radius, spacing, fontSize } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { TopNav, IconButton, EmptyHint } from '../lib/ui';

export default function QueuePage() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const queue = useAppStore(s => s.queue);
  const currentIdx = useAppStore(s => s.currentIdx);
  const setCurrent = useAppStore(s => s.setCurrent);
  const removeFromQueue = useAppStore(s => s.removeFromQueue);
  const moveQueue = useAppStore(s => s.moveQueue);

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
          maxWidth: 820, width: '100%', alignSelf: 'center',
          paddingHorizontal: pad, paddingTop: pad,
          paddingBottom: isMobile ? 120 : spacing.xl * 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        <Text style={{
          fontSize: isMobile ? 26 : 36, fontWeight: '700',
          letterSpacing: -1, color: theme.textPrimary,
        }}>播放队列</Text>
        <Text style={{
          fontSize: fontSize.body, color: theme.textSecondary,
          marginTop: 8, marginBottom: spacing.xl,
        }}>{queue.length} 首 · 用 ↑↓ 调整顺序</Text>

        {queue.length === 0 ? (
          <EmptyHint>队列为空 · 在文章卡上点 ＋ 或 ▶ 添加内容</EmptyHint>
        ) : (
          queue.map((it, i) => (
            <View
              key={`${it.id}-${i}`}
              style={{
                flexDirection: 'row', alignItems: 'center',
                gap: isMobile ? 8 : spacing.md + 2,
                padding: isMobile ? 10 : spacing.md + 2,
                borderRadius: radius.md,
                backgroundColor: i === currentIdx ? theme.brandSoft : theme.bgElevated,
                borderWidth: 1,
                borderColor: i === currentIdx ? theme.brand : theme.borderSoft,
                marginBottom: spacing.sm,
              }}
            >
              <View style={{
                width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
                borderRadius: 8, backgroundColor: theme.gradA,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontSize: isMobile ? 14 : 16, fontWeight: '700' }}>
                  {it.title.slice(0, 1)}
                </Text>
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={{
                  fontSize: isMobile ? fontSize.small : fontSize.body,
                  fontWeight: '600', color: theme.textPrimary,
                }}>{it.title}</Text>
                <Text numberOfLines={1} style={{
                  fontSize: isMobile ? 11 : fontSize.caption,
                  color: theme.textSecondary, marginTop: 2,
                }}>
                  {it.author} · {it.mins} 分钟
                  {i === currentIdx ? ' · 正在播放' : ''}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 2 }}>
                <QueueBtn icon="↑" disabled={i === 0} onPress={() => moveQueue(i, i - 1)} />
                <QueueBtn icon="↓" disabled={i === queue.length - 1} onPress={() => moveQueue(i, i + 1)} />
                <QueueBtn icon="▶" onPress={() => setCurrent(i)} />
                <QueueBtn icon="✕" danger onPress={() => removeFromQueue(i)} />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function QueueBtn({
  icon, onPress, disabled, danger,
}: {
  icon: string; onPress: () => void; disabled?: boolean; danger?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => ({
        width: 30, height: 30, borderRadius: 15,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed && !disabled
          ? (danger ? theme.danger : theme.brandSoft)
          : 'transparent',
        opacity: disabled ? 0.3 : 1,
      })}
    >
      <Text style={{
        fontSize: 13,
        color: danger ? theme.danger : theme.textSecondary,
      }}>{icon}</Text>
    </Pressable>
  );
}
