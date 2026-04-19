import React, { useState } from 'react';
import {
  View, Text, Pressable, Modal, TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { useTheme, radius, spacing, fontSize, themeList, ThemeName } from '../theme';

/**
 * 汉堡按钮 + 下拉浮层主题选择器
 *
 * 点击汉堡 → 弹浮层（桌面/移动都用 Modal + 半透明背景 + 点击空白关闭）
 * 每项显示：色卡圆点 + 主题名 + (选中) 打勾
 */
export function ThemeMenu({
  currentTheme, onSelect,
}: {
  currentTheme: ThemeName;
  onSelect: (key: ThemeName) => void;
}) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleSelect = (key: ThemeName) => {
    onSelect(key);
    setOpen(false);
  };

  return (
    <>
      {/* 汉堡按钮 */}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel="选择主题"
        style={({ pressed }) => ({
          width: isMobile ? 34 : 38,
          height: isMobile ? 34 : 38,
          borderRadius: 999,
          backgroundColor: pressed ? theme.bgElevated : theme.bgSurface,
          borderWidth: 1,
          borderColor: theme.borderSoft,
          alignItems: 'center',
          justifyContent: 'center',
        })}
      >
        {/* 三条横杠，用 3 个小 View 堆叠 */}
        <View style={{ gap: 4 }}>
          <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: theme.textSecondary }} />
          <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: theme.textSecondary }} />
          <View style={{ width: 16, height: 2, borderRadius: 1, backgroundColor: theme.textSecondary }} />
        </View>
      </Pressable>

      {/* 下拉浮层（Modal） */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* 点击空白关闭 */}
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
          }}>
            {/* 浮层面板：绝对定位到右上，模拟"从汉堡按钮往下掉" */}
            <View style={{
              position: 'absolute',
              top: isMobile ? 56 : 68,
              right: isMobile ? spacing.lg : spacing.xl,
              minWidth: 180,
            }}>
              <TouchableWithoutFeedback>
                <View style={{
                  backgroundColor: theme.bgElevated,
                  borderRadius: radius.btn,
                  borderWidth: 1,
                  borderColor: theme.borderSoft,
                  paddingVertical: spacing.sm,
                  // 阴影
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.12,
                  shadowRadius: 20,
                  elevation: 12,
                }}>
                  <Text style={{
                    fontSize: fontSize.caption,
                    fontWeight: '600',
                    color: theme.textMuted,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.xs,
                    paddingBottom: spacing.sm,
                    letterSpacing: 0.5,
                  }}>主题</Text>
                  {themeList.map(t => {
                    const isActive = currentTheme === t.key;
                    return (
                      <Pressable
                        key={t.key}
                        onPress={() => handleSelect(t.key)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: 9,
                          backgroundColor: pressed ? theme.bgSurface : 'transparent',
                        })}
                      >
                        {/* 色卡 */}
                        <View style={{
                          width: 14,
                          height: 14,
                          borderRadius: 999,
                          backgroundColor: t.swatch,
                          borderWidth: 1,
                          borderColor: 'rgba(0,0,0,0.08)',
                        }} />
                        {/* 名字 */}
                        <Text style={{
                          flex: 1,
                          fontSize: fontSize.small,
                          fontWeight: isActive ? '700' : '500',
                          color: theme.textPrimary,
                        }}>{t.label}</Text>
                        {/* 勾 */}
                        {isActive && (
                          <Text style={{
                            fontSize: fontSize.body,
                            color: theme.brand,
                            fontWeight: '700',
                          }}>✓</Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
