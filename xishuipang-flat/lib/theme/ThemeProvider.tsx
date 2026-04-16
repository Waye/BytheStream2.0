import React, { createContext, useContext, ReactNode } from 'react';
import { Theme, themes, ThemeName } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  themeName: ThemeName;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.light,
  themeName: 'light',
});

export function ThemeProvider({
  themeName,
  children,
}: {
  themeName: ThemeName;
  children: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], themeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
