import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, useWindowDimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { router } from 'expo-router';
import { useApolloClient } from '@apollo/client';

import { useAppStore } from '../store';
import { useTheme, radius, spacing, fontSize } from '../theme';
import { GET_AUDIO_EPISODE, GET_ARTICLE } from '../graphql/queries';

const AUDIO_BASE_URL = 'http://localhost:8090';

const WELCOME_TRACK = {
  id: 'welcome:_welcome',
  title: '溪水旁 · 欢迎',
  author: '编辑部',
  volume: 0,
  mins: 1,
  category: '',
};

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function MiniPlayer({ onOpenQueue, bottomInset = 0 }: { onOpenQueue?: () => void; bottomInset?: number }) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const queue = useAppStore(s => s.queue);
  const currentIdx = useAppStore(s => s.currentIdx);
  const playing = useAppStore(s => s.playing);
  const togglePlay = useAppStore(s => s.togglePlay);
  const next = useAppStore(s => s.next);
  const prev = useAppStore(s => s.prev);
  const user = useAppStore(s => s.user);

  const audioPosition = useAppStore(s => s.audioPosition);
  const audioDuration = useAppStore(s => s.audioDuration);
  const audioLoading = useAppStore(s => s.audioLoading);
  const audioError = useAppStore(s => s.audioError);
  const setAudioStatus = useAppStore(s => s.setAudioStatus);
  const setAudioLoading = useAppStore(s => s.setAudioLoading);
  const setAudioError = useAppStore(s => s.setAudioError);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentTrackIdRef = useRef<string | null>(null);
  const client = useApolloClient();

  // 拖动进度时用的本地状态（避免状态回弹）
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const queueTrack = currentIdx >= 0 ? queue[currentIdx] : undefined;
  const track = queueTrack || (!user ? WELCOME_TRACK : undefined);

  const onStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if ('error' in status && status.error) setAudioError(String(status.error));
      return;
    }
    if (!seeking) {
      setAudioStatus(
        (status.positionMillis ?? 0) / 1000,
        (status.durationMillis ?? 0) / 1000,
      );
    }
    if (status.didJustFinish && !status.isLooping) next();
  }, [next, setAudioStatus, setAudioError, seeking]);

  // 切换音轨
  useEffect(() => {
    if (!track) {
      currentTrackIdRef.current = null;
      return;
    }
    if (currentTrackIdRef.current === String(track.id)) return;
    currentTrackIdRef.current = String(track.id);

    let cancelled = false;
    setAudioError(null);
    setAudioLoading(true);

    (async () => {
      if (soundRef.current) {
        try { await soundRef.current.unloadAsync(); } catch {}
        soundRef.current = null;
      }

      try {
        let url: string | undefined;

        if (String(track.id).startsWith('welcome:')) {
          url = `${AUDIO_BASE_URL}/_welcome.mp3`;
        } else {
          const queryId = String(track.id).includes(':')
            ? String(track.id)
            : `${track.volume}:${track.id}`;
          const { data } = await client.query({
            query: GET_AUDIO_EPISODE,
            variables: { id: queryId },
            fetchPolicy: 'network-only',
          });
          url = data?.audioEpisode?.streamUrl;
        }

        if (!url) {
          if (!cancelled) {
            setAudioError('这篇文章还没有音频');
            setAudioLoading(false);
          }
          return;
        }
        if (cancelled) return;

        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: playing },
          onStatusUpdate,
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        setAudioLoading(false);

        // 预取文章详情到 Apollo cache,用户点标题时瞬间显示
        if (track && !String(track.id).startsWith('welcome:')) {
          const rawSlug = String(track.id).replace(/^\d+:/, '');
          const character = rawSlug.endsWith('_t') ? 'traditional' : 'simplified';
          client.query({
            query: GET_ARTICLE,
            variables: { volume: track.volume, slug: rawSlug, character },
            fetchPolicy: 'cache-first',
          }).catch(() => {});
        }
      } catch (e: any) {
        if (!cancelled) {
          setAudioError(e?.message || '音频加载失败');
          setAudioLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  useEffect(() => {
    const snd = soundRef.current;
    if (!snd) return;
    (async () => {
      try {
        if (playing) await snd.playAsync();
        else await snd.pauseAsync();
      } catch {}
    })();
  }, [playing]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    }).catch(() => {});

    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  if (!track) {
    // 已登录但队列为空 — 占位条(可以改成完全不显示)
    return (
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: theme.bgElevated,
        borderTopWidth: 1, borderTopColor: theme.borderSoft,
        paddingHorizontal: isMobile ? spacing.md : spacing.xl,
        paddingVertical: spacing.md,
        paddingBottom: (isMobile ? spacing.md : spacing.md) + bottomInset,
      }}>
        <Text style={{ color: theme.textSecondary, fontSize: fontSize.small }}>
          队列为空 · 从任一文章点 + 加入
        </Text>
      </View>
    );
  }

  const sliderValue = seeking ? seekValue : audioPosition;

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: theme.bgElevated,
      borderTopWidth: 1, borderTopColor: theme.borderSoft,
      paddingBottom: bottomInset,
    }}>
      {/* 进度条（可拖动） */}
      <View style={{ paddingHorizontal: isMobile ? spacing.sm : spacing.md, paddingTop: 2 }}>
        <Slider
          style={{ width: '100%', height: 24 }}
          minimumValue={0}
          maximumValue={Number.isFinite(audioDuration) && audioDuration > 0 ? audioDuration : 1}
          value={Number.isFinite(sliderValue) ? sliderValue : 0}
          minimumTrackTintColor={theme.brand}
          maximumTrackTintColor={theme.borderSoft}
          thumbTintColor={theme.brand}
          onSlidingStart={() => setSeeking(true)}
          onValueChange={(v) => setSeekValue(v)}
          onSlidingComplete={async (v) => {
            setSeeking(false);
            try {
              await soundRef.current?.setPositionAsync(v * 1000);
            } catch {}
          }}
          disabled={!audioDuration}
        />
      </View>

      {/* 主行 */}
      <View style={{
        paddingHorizontal: isMobile ? spacing.md : spacing.xl,
        paddingBottom: isMobile ? spacing.sm : spacing.md,
        flexDirection: 'row', alignItems: 'center',
      }}>
        {/* 标题信息 */}
        <Pressable
          onPress={() => {
            if (!track) return;
            if (String(track.id).startsWith('welcome:')) return;
            router.push(`/article/${encodeURIComponent(String(track.id))}`);
          }}
          style={{ flex: 1, minWidth: 0, marginRight: spacing.md }}
        >
          <Text
            numberOfLines={1}
            style={{ color: theme.textPrimary, fontSize: fontSize.body, fontWeight: '600' }}
          >
            {track.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: theme.textSecondary,
              fontSize: fontSize.small, marginTop: 2,
            }}
          >
            {audioError
              ? audioError
              : `${track.author}  ·  ${fmt(sliderValue)} / ${fmt(audioDuration)}`}
          </Text>
        </Pressable>

        {/* 控制按钮 */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconBtn onPress={prev} theme={theme}>
            <PrevIcon color={theme.textPrimary} />
          </IconBtn>

          <Pressable
            onPress={togglePlay}
            disabled={audioLoading}
            style={{
              width: 44, height: 44, borderRadius: 22,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: theme.brand,
              marginHorizontal: 4,
            }}
          >
            {audioLoading
              ? <ActivityIndicator size="small" color={theme.onBrand} />
              : playing
                ? <PauseIcon color={theme.onBrand} />
                : <PlayIcon color={theme.onBrand} />}
          </Pressable>

          <IconBtn onPress={next} theme={theme}>
            <NextIcon color={theme.textPrimary} />
          </IconBtn>

          {/* 队列按钮 + 数字徽章 */}
          <Pressable
            onPress={onOpenQueue || (() => router.push('/queue'))}
            style={{
              width: 36, height: 36,
              alignItems: 'center', justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            <HamburgerIcon color={theme.textPrimary} />
            {queue.length > 0 && (
              <View style={{
                position: 'absolute',
                top: 2, right: 2,
                minWidth: 16, height: 16, borderRadius: 8,
                backgroundColor: theme.danger,
                alignItems: 'center', justifyContent: 'center',
                paddingHorizontal: 4,
              }}>
                <Text style={{
                  color: theme.bgCanvas,
                  fontSize: 10, fontWeight: '700',
                }}>
                  {queue.length > 99 ? '99+' : queue.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── 小工具 ───
function IconBtn({ onPress, children, theme }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: 36, height: 36,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {children}
    </Pressable>
  );
}

// SVG-like 几何图形用 View 堆出来（保证跨平台字体不挂）
function PlayIcon({ color }: { color: string }) {
  return (
    <View style={{
      width: 0, height: 0,
      borderTopWidth: 7, borderBottomWidth: 7,
      borderLeftWidth: 12,
      borderTopColor: 'transparent',
      borderBottomColor: 'transparent',
      borderLeftColor: color,
      marginLeft: 3, // 视觉居中补偿
    }} />
  );
}

function PauseIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      <View style={{ width: 4, height: 14, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 4, height: 14, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function PrevIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 2, height: 12, backgroundColor: color, marginRight: 1 }} />
      <View style={{
        width: 0, height: 0,
        borderTopWidth: 6, borderBottomWidth: 6,
        borderRightWidth: 9,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: color,
      }} />
    </View>
  );
}

function NextIcon({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{
        width: 0, height: 0,
        borderTopWidth: 6, borderBottomWidth: 6,
        borderLeftWidth: 9,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: color,
      }} />
      <View style={{ width: 2, height: 12, backgroundColor: color, marginLeft: 1 }} />
    </View>
  );
}

function HamburgerIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 14, justifyContent: 'space-between' }}>
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}
