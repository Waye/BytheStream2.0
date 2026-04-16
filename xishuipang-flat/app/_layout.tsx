import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Slot, router } from 'expo-router';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from '../lib/theme';
import { useAppStore } from '../lib/store';
import { MiniPlayer } from '../lib/ui';

function AppShell() {
  const { theme, themeName } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const insets = useSafeAreaInsets();

  // 顶部: 刘海/状态栏高度 (iPhone 约 59px)
  // 底部: Home Indicator 高度 (iPhone 约 34px) + Mini Player
  const miniPlayerHeight = isMobile ? 60 + insets.bottom : 86;

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.bgCanvas,
      paddingTop: insets.top,
    }}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1, paddingBottom: miniPlayerHeight }}>
        <Slot />
      </View>
      <MiniPlayer onOpenQueue={() => router.push('/queue')} bottomInset={insets.bottom} />
    </View>
  );
}

export default function RootLayout() {
  const themeName = useAppStore(s => s.theme);
  return (
    <SafeAreaProvider>
      <ThemeProvider themeName={themeName}>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
