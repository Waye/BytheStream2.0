import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useTheme, spacing, fontSize, radius } from '../lib/theme';
import { TopNav, IconButton, VolumeCard } from '../lib/ui';
import { GET_VOLUMES } from '../lib/graphql';

type SortOrder = 'latest' | 'oldest';

export default function AllVolumes() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const pad = isMobile ? spacing.lg : spacing.xl;

  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const { data, loading } = useQuery(GET_VOLUMES, {
    variables: { offset: 0, limit: 200 },
    fetchPolicy: 'cache-first',
  });
  const allVolumes = data?.volumes ?? [];

  const sorted = useMemo(() => {
    const list = [...allVolumes];
    if (sortOrder === 'oldest') {
      list.sort((a: any, b: any) => a.id - b.id);
    } else {
      list.sort((a: any, b: any) => b.id - a.id);
    }
    return list;
  }, [allVolumes, sortOrder]);

  const cols = isMobile ? 2 : isTablet ? 4 : 5;
  const gap = isMobile ? 12 : 24;
  const contentWidth = Math.min(width, 1320) - pad * 2;
  const itemWidth = (contentWidth - gap * (cols - 1)) / cols;

  const goBack = () => { if (router.canGoBack?.()) router.back(); else router.replace('/'); };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bgCanvas }}>
      <TopNav onLogoPress={() => router.push('/')} onLoginPress={() => router.push('/login')}
        onSearchSubmit={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)} />
      <ScrollView style={{ flex: 1 }}
        contentContainerStyle={{
          maxWidth: 1320, width: '100%', alignSelf: 'center',
          paddingHorizontal: pad, paddingTop: pad,
          paddingBottom: isMobile ? 100 : spacing.xl * 3,
        }}>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
          <IconButton icon="←" onPress={goBack} />
          <Text style={{ fontSize: fontSize.small, color: theme.textSecondary, fontWeight: '600' }}>返回</Text>
        </View>

        <View style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? spacing.md : 0,
          marginBottom: spacing.xl,
        }}>
          <View>
            <Text style={{
              fontSize: isMobile ? 26 : 36, fontWeight: '700',
              letterSpacing: -1, color: theme.textPrimary,
            }}>全部期刊</Text>
            <Text style={{ fontSize: fontSize.body, color: theme.textSecondary, marginTop: 4 }}>
              共 {allVolumes.length} 期
            </Text>
          </View>
          <View style={{
            flexDirection: 'row', backgroundColor: theme.bgSurface,
            borderRadius: radius.btn, padding: 3,
            borderWidth: 1, borderColor: theme.borderSoft,
          }}>
            <SortTab label="最新优先" active={sortOrder === 'latest'}
              onPress={() => setSortOrder('latest')} />
            <SortTab label="最早优先" active={sortOrder === 'oldest'}
              onPress={() => setSortOrder('oldest')} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.brand} style={{ marginVertical: spacing.xxl }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {sorted.map((v: any) => (
              <VolumeCard
                key={v.id}
                vol={v}
                width={itemWidth}
                onPress={() => router.push(`/volume/${v.id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SortTab({ label, active, onPress }: {
  label: string; active: boolean; onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress}
      style={{
        paddingHorizontal: spacing.lg, paddingVertical: 8,
        borderRadius: radius.btn - 3,
        backgroundColor: active ? theme.bgElevated : 'transparent',
      }}>
      <Text style={{
        fontSize: fontSize.small, fontWeight: active ? '700' : '500',
        color: active ? theme.textPrimary : theme.textSecondary,
      }}>{label}</Text>
    </Pressable>
  );
}
