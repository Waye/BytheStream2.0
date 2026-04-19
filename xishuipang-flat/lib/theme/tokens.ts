// 7 主题 — 原 3 个 + 四季
// sepia 调得更护眼：更暖的米色、降低对比、品牌色改暖棕（减少蓝光刺眼）
export type ThemeName = 'light' | 'dark' | 'sepia' | 'spring' | 'summer' | 'autumn' | 'winter';

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
  bgCanvas: '#f6eed9',
  bgSurface: '#ede3c8',
  bgElevated: '#fbf4df',
  textPrimary: '#3e2f1d',
  textSecondary: '#6b5940',
  textMuted: '#9b8868',
  border: '#d4c7a3',
  borderSoft: '#e1d5b4',
  surfaceBtn: '#e5d9b8',
  surfaceCircle: '#d4c7a3',
  brand: '#8b5a2b',
  brandHover: '#70471f',
  brandSoft: '#e8d8b6',
  onBrand: '#fbf4df',
  gradA: '#8b5a2b',
  gradB: '#a86f3e',
  gradC: '#c08a59',
  danger: '#a23c1f',
  shadow: 'rgba(62,47,29,0.05)',
};

export const springTheme: Theme = {
  bgCanvas: '#f3f6ec',
  bgSurface: '#e8eedc',
  bgElevated: '#fafcf2',
  textPrimary: '#2a3e24',
  textSecondary: '#4f6447',
  textMuted: '#8c9e82',
  border: '#c8d4b5',
  borderSoft: '#d8e0c3',
  surfaceBtn: '#dbe4c6',
  surfaceCircle: '#c8d4b5',
  brand: '#5e8f4d',
  brandHover: '#4b7a3b',
  brandSoft: '#d8e4c5',
  onBrand: '#fafcf2',
  gradA: '#5e8f4d',
  gradB: '#7aa86a',
  gradC: '#a4c394',
  danger: '#9e2020',
  shadow: 'rgba(42,62,36,0.06)',
};

export const summerTheme: Theme = {
  bgCanvas: '#eaf3f5',
  bgSurface: '#dde9ec',
  bgElevated: '#f6fafc',
  textPrimary: '#1a3846',
  textSecondary: '#436170',
  textMuted: '#86a2ad',
  border: '#b8cfd6',
  borderSoft: '#cddde2',
  surfaceBtn: '#cfdfe4',
  surfaceCircle: '#b8cfd6',
  brand: '#2d7a94',
  brandHover: '#1f5f75',
  brandSoft: '#c7dde4',
  onBrand: '#f6fafc',
  gradA: '#2d7a94',
  gradB: '#4b95af',
  gradC: '#7ab3c7',
  danger: '#9e2020',
  shadow: 'rgba(26,56,70,0.06)',
};

export const autumnTheme: Theme = {
  bgCanvas: '#f5ede2',
  bgSurface: '#eadfcb',
  bgElevated: '#faf3e6',
  textPrimary: '#3d241a',
  textSecondary: '#6a4a38',
  textMuted: '#a08574',
  border: '#d7bfa3',
  borderSoft: '#e3d1b8',
  surfaceBtn: '#e3d1b8',
  surfaceCircle: '#d7bfa3',
  brand: '#b25a3a',
  brandHover: '#964528',
  brandSoft: '#ead1bd',
  onBrand: '#faf3e6',
  gradA: '#b25a3a',
  gradB: '#c4744e',
  gradC: '#d58f6b',
  danger: '#9e2020',
  shadow: 'rgba(61,36,26,0.06)',
};

export const winterTheme: Theme = {
  bgCanvas: '#edeff2',
  bgSurface: '#dde1e7',
  bgElevated: '#f7f8fa',
  textPrimary: '#1c2634',
  textSecondary: '#465166',
  textMuted: '#8892a3',
  border: '#c4cbd6',
  borderSoft: '#d2d8e2',
  surfaceBtn: '#d2d8e2',
  surfaceCircle: '#c4cbd6',
  brand: '#4a5770',
  brandHover: '#384258',
  brandSoft: '#cdd4e0',
  onBrand: '#f7f8fa',
  gradA: '#4a5770',
  gradB: '#62708a',
  gradC: '#8292ad',
  danger: '#9e2020',
  shadow: 'rgba(28,38,52,0.06)',
};

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
  sepia: sepiaTheme,
  spring: springTheme,
  summer: summerTheme,
  autumn: autumnTheme,
  winter: winterTheme,
};

export const themeList: Array<{
  key: ThemeName;
  label: string;
  swatch: string;
}> = [
  { key: 'light',  label: '暖白', swatch: '#1a2438' },
  { key: 'dark',   label: '深色', swatch: '#f5f3ec' },
  { key: 'sepia',  label: '护眼', swatch: '#8b5a2b' },
  { key: 'spring', label: '春',   swatch: '#5e8f4d' },
  { key: 'summer', label: '夏',   swatch: '#2d7a94' },
  { key: 'autumn', label: '秋',   swatch: '#b25a3a' },
  { key: 'winter', label: '冬',   swatch: '#4a5770' },
];

export const fontFamily = {
  body: 'PinSans, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", sans-serif',
  serif: 'STKaiti, "Kaiti SC", KaiTi, "楷体", serif',
};

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
