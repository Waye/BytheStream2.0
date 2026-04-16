// 三主题色值 — 致敬 logo 的墨蓝/米白配色
// 与原型的 CSS 变量一一对应

export type ThemeName = 'light' | 'dark' | 'sepia';

export interface Theme {
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderSoft: string;
  surfaceBtn: string;
  surfaceCircle: string;
  brand: string;
  brandHover: string;
  brandSoft: string;
  onBrand: string;
  gradA: string;
  gradB: string;
  gradC: string;
  danger: string;
  shadow: string;
}

export const lightTheme: Theme = {
  bgCanvas: '#f5f3ec',
  bgSurface: '#ebe8dd',
  bgElevated: '#fffdf6',
  textPrimary: '#1a2438',
  textSecondary: '#4a5369',
  textMuted: '#8a91a4',
  border: '#d8d4c3',
  borderSoft: '#e2ded0',
  surfaceBtn: '#e2ded0',
  surfaceCircle: '#d8d4c3',
  brand: '#1a2438',
  brandHover: '#0f1829',
  brandSoft: '#dcd9c9',
  onBrand: '#f5f3ec',
  gradA: '#1a2438',
  gradB: '#2a3652',
  gradC: '#4a5574',
  danger: '#9e2020',
  shadow: 'rgba(26,36,56,0.06)',
};

export const darkTheme: Theme = {
  bgCanvas: '#1a2438',
  bgSurface: '#222e47',
  bgElevated: '#2a3652',
  textPrimary: '#f5f3ec',
  textSecondary: '#b8bdcc',
  textMuted: '#7a8299',
  border: '#354263',
  borderSoft: '#2a3652',
  surfaceBtn: '#2a3652',
  surfaceCircle: '#354263',
  brand: '#f5f3ec',
  brandHover: '#ffffff',
  brandSoft: '#354263',
  onBrand: '#1a2438',
  gradA: '#2a3652',
  gradB: '#3a4870',
  gradC: '#5a6b94',
  danger: '#e87575',
  shadow: 'rgba(0,0,0,0.4)',
};

export const sepiaTheme: Theme = {
  bgCanvas: '#f4ecd8',
  bgSurface: '#ebe3c9',
  bgElevated: '#f8f1de',
  textPrimary: '#2a1f14',
  textSecondary: '#5c4a33',
  textMuted: '#8a7559',
  border: '#d6c9a5',
  borderSoft: '#e0d5b8',
  surfaceBtn: '#e0d5b8',
  surfaceCircle: '#d6c9a5',
  brand: '#1a2438',
  brandHover: '#0f1829',
  brandSoft: '#e0dccc',
  onBrand: '#f5f3ec',
  gradA: '#1a2438',
  gradB: '#2a3652',
  gradC: '#4a5574',
  danger: '#b91c1c',
  shadow: 'rgba(42,31,20,0.06)',
};

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  sepia: sepiaTheme,
};

// 字体栈 — 严格遵循 DESIGN.md,含 CJK fallback
export const fontFamily = {
  body: 'PinSans, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", sans-serif',
  // logo 用楷体,致敬 logo 手写感
  serif: 'STKaiti, "Kaiti SC", KaiTi, "楷体", serif',
};

// 间距、圆角、字号 token — 与 DESIGN.md 对齐
export const radius = {
  sm: 10,
  md: 12,
  btn: 16,
  card: 20,
  lg: 24,
  xl: 32,
  full: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const fontSize = {
  caption: 12,
  small: 13,
  body: 14,
  bodyLg: 16,
  h3: 18,
  h2: 22,
  h1: 28,
  display: 42,
  hero: 64,
};
