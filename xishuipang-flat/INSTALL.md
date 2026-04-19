# 批次 6 — 推荐区 + 骨架屏 + 主题 menu + 桌面缩放

## 安装方法

```bash
cd ~/Downloads
unzip xsp-batch6.zip          # 解压得到 files/ 文件夹
cp -r files/* /Users/weiyihu/Downloads/BytheStream2.0/xishuipang-flat/
```

然后**重启 expo**（因为改了导入结构）：

```bash
cd /Users/weiyihu/Downloads/BytheStream2.0/xishuipang-flat
rm -rf .expo node_modules/.cache
npx expo start --clear
```

## 本批次改动清单

| 路径 | 类型 | 说明 |
|---|---|---|
| `lib/recommend.ts` | **新增** | 客户端推荐算法（加权打分 + 热门回落） |
| `lib/ui/Skeleton.tsx` | **新增** | 骨架屏组件（脉动动画） |
| `lib/ui/ThemeMenu.tsx` | **新增** | 下拉主题选择器（汉堡 ☰） |
| `lib/ui/TopNav.tsx` | 覆盖 | 引入 ThemeMenu，替换原横向主题滚动 |
| `lib/ui/ArticleCard.tsx` | 覆盖 | 桌面 220→188px (-15%) |
| `lib/ui/FavCard.tsx` | 覆盖 | 桌面 280→238px (-15%) |
| `lib/ui/VolumeCard.tsx` | 覆盖 | 桌面 180→153px (-15%) |
| `app/index.tsx` | 覆盖 | 加推荐区块 + 三处骨架屏 + maxWidth 1320→1120 |

## 推荐算法说明

- **有收藏**：用加权打分（作者 3 分 / 类别 2 分 / 期号距离 1 分）从最近 3 期候选中挑 6 篇；同作者最多 2 篇多样化
- **无收藏 / 未登录**：按期号倒序 + 每个作者一篇，显示"热门往期"
- **候选池**：Apollo cache 里已拉过的最近 3 期（latestVol / -1 / -2），完全不打额外网络请求（命中缓存）
- **排除**：已收藏的、封面/簡介类、非简体版

## 骨架屏说明

三种形状：
- `ArticleCardSkeleton` — 最新文章 + 推荐区
- `VolumeCardSkeleton` — 往期期刊
- `FavCardSkeleton` — 收藏区（目前没用到，已备好）

脉动动画用 Animated.loop + opacity 0.55 ↔ 1，三端兼容。

## 主题菜单说明

- 右上角三条横杠 ☰ 按钮
- 点开 Modal 浮层：列 7 个主题 + 色卡圆点 + 选中打勾
- 点空白或点主题项自动关闭
- 桌面/移动一套 UI

## 桌面缩放说明

- `maxWidth`: 1320 → 1120（整体 -15%）
- 卡片宽度：三张卡桌面端都 -15%（字体大小不动）
- 移动端（width < 768）完全不变

## 如果出问题

- 推荐区没显示 → 可能 latestVol 还在加载，刷新一下看；或者 cache 里没数据（切过期号才有）
- 主题菜单打不开 → 查 Console 有没有 Modal 相关错误
- 字体看起来变小 → 应该**只缩了卡片**，如果整体缩了检查 CSS 是否被全局 transform 污染
