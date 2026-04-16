import React from 'react';
import { View, Text, Pressable, useWindowDimensions } from 'react-native';
import { useTheme, radius, spacing, fontSize } from '../theme';
import { useAppStore } from '../store';
import { IconButton } from './Button';

export function MiniPlayer({ onOpenQueue, bottomInset = 0 }: { onOpenQueue?: () => void; bottomInset?: number }) {
  const { theme } = useTheme();
  const queue = useAppStore(s => s.queue);
  const currentIdx = useAppStore(s => s.currentIdx);
  const playing = useAppStore(s => s.playing);
  const togglePlay = useAppStore(s => s.togglePlay);
  const next = useAppStore(s => s.next);
  const prev = useAppStore(s => s.prev);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const track = queue[currentIdx] || {
    title: '尚未播放', author: '从任意卡片选择音频', mins: 0,
  };

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: theme.bgElevated,
      borderTopWidth: 1, borderTopColor: theme.borderSoft,
      paddingHorizontal: isMobile ? spacing.md : spacing.xl,
      paddingVertical: isMobile ? 8 : spacing.md + 2,
      paddingBottom: isMobile ? 8 + bottomInset : spacing.md + 2,
      flexDirection: 'row', alignItems: 'center',
      gap: isMobile ? 8 : spacing.lg,
    }}>
      <View style={{
        width: isMobile ? 40 : 52, height: isMobile ? 40 : 52,
        borderRadius: isMobile ? 8 : 10,
        backgroundColor: theme.gradA,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: isMobile ? 14 : 18, fontWeight: '700' }}>
          {track.title.slice(0, 1)}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontSize: isMobile ? 12 : fontSize.body, fontWeight: '700',
          color: theme.textPrimary,
        }}>{track.title}</Text>
        <Text numberOfLines={1} style={{ fontSize: isMobile ? 10 : fontSize.caption, color: theme.textSecondary }}>
          {track.author}{queue.length > 0 ? ` · ${currentIdx + 1}/${queue.length}` : ''}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: isMobile ? 4 : 8 }}>
        {!isMobile && <IconButton icon="⏮" onPress={prev}/>}
        <Pressable
          onPress={togglePlay}
          style={{
            width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
            borderRadius: isMobile ? 18 : 22,
            backgroundColor: theme.brand,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.onBrand, fontSize: isMobile ? 12 : 15 }}>
            {playing ? '❚❚' : '▶'}
          </Text>
        </Pressable>
        {!isMobile && <IconButton icon="⏭" onPress={next}/>}
      </View>

      {!isMobile && (
        <>
          <View style={{
            flex: 1, height: 4, borderRadius: 2,
            backgroundColor: theme.border, maxWidth: 360,
            marginHorizontal: spacing.lg, position: 'relative',
          }}>
            <View style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '35%', backgroundColor: theme.brand, borderRadius: 2,
            }}/>
          </View>
          <Text style={{
            fontSize: fontSize.caption, color: theme.textSecondary,
            minWidth: 80, textAlign: 'right',
          }}>2:34 / 7:12</Text>
        </>
      )}

      <View>
        <IconButton icon="☰" onPress={onOpenQueue} size={isMobile ? 32 : 38}/>
        {queue.length > 0 && (
          <View style={{
            position: 'absolute', top: -2, right: -2,
            backgroundColor: theme.brand,
            paddingHorizontal: 4, paddingVertical: 1,
            borderRadius: 8, minWidth: 14,
          }}>
            <Text style={{
              color: theme.onBrand, fontSize: 8, fontWeight: '700',
              textAlign: 'center',
            }}>{queue.length}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
