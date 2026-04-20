# 溪水旁 2.0

基督教中文季刊「溪水旁」的全平台阅读应用。一套代码覆盖 iOS、Android、Web。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Expo SDK 52 · React Native 0.76.9 · TypeScript |
| 路由 | Expo Router v4（文件即路由） |
| 状态 | Zustand · Apollo Client 3.x（AsyncStorage 持久化） |
| 图片 | expo-image（三平台磁盘缓存）· jsDelivr CDN |
| 认证 | JWT · Google / Facebook OAuth（expo-auth-session） |
| 后端 | Fastify · Mercurius GraphQL · DataLoader |
| 数据库 | MongoDB Atlas（Xishuipang 库 · Articles / TableOfContents / Users / Favorites / Usage） |
| 缓存 | 内存缓存（Redis 接口预留）· Apollo cache-first |

## 项目结构

```
xishuipang-flat/
├── app/                    # 页面（Expo Router 文件路由）
│   ├── _layout.tsx         # 根布局（ApolloProvider + ThemeProvider + MiniPlayer + bootstrapAuth）
│   ├── index.tsx           # 首页（最新文章 + 为你推荐 + 收藏 stack + 往期 + 三段骨架屏）
│   ├── article/[id].tsx    # 文章阅读器（首屏 2 张高优图 + 延后挂载其余图）
│   ├── volume/[id].tsx     # 期刊详情（封面图 Hero + track list）
│   ├── volumes.tsx         # 全部期刊（排序筛选 + 封面图网格）
│   ├── favorites.tsx       # 收藏管理
│   ├── search.tsx          # 搜索（分页 infinite scroll）
│   ├── queue.tsx           # 播放队列（↑↓ 排序）
│   ├── login.tsx           # 登录（Google/FB OAuth + 邮箱降级）
│   ├── profile.tsx         # 用户中心（头像 + 登出 + 简繁设置 + 收藏）
│   ├── legal.tsx           # 法律声明（中英双语）
│   └── privacy.tsx         # Privacy Policy
├── lib/
│   ├── theme/              # 设计系统（7 主题 + tokens + themeList）
│   ├── store/              # Zustand（user + 文章收藏云同步 + 音频收藏本地）
│   ├── ui/                 # UI 组件（TopNav + ThemeMenu + Skeleton + cards）
│   ├── auth/               # OAuth hooks（Google / Facebook）
│   ├── recommend.ts        # 客户端推荐算法（加权打分 + 热门回落）
│   ├── mock/               # 公告轮播数据
│   └── graphql/            # Apollo Client（authLink + 持久化）+ gql 查询
├── assets/images/          # 教会照片（公告轮播用）
├── server/                 # 后端（独立 Node 项目）
│   ├── src/
│   │   ├── index.ts        # Fastify 入口 + CORS + rate limit + ensureIndexes
│   │   ├── schema.ts       # GraphQL SDL（含 Auth/Favorite/AudioEpisode）
│   │   ├── resolvers.ts    # Query / Mutation 实现
│   │   ├── auth.ts         # JWT + Google/FB token 验证
│   │   ├── loaders.ts      # DataLoader（批量查询）
│   │   ├── db.ts           # MongoDB 连接池
│   │   ├── cache.ts        # 缓存（Redis / 内存 fallback）
│   │   └── types.ts        # TypeScript 类型
│   ├── package.json
│   └── .env.example
├── DESIGN.md               # 设计系统文档（Pinterest 风格参考）
├── streaming.md            # 架构规划（音频流 + HLS）
└── 工作日志.md              # 开发日志
```

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
cp .env.example .env
# 编辑 .env 填入 MongoDB Atlas URI + JWT_SECRET（OAuth 变量可空）
npm run dev
# ✓ MongoDB connected
# ✓ Indexes ensured
# 🚀 GraphQL server ready at http://localhost:4000/graphiql
```

### 2. 启动前端

```bash
# 新开终端
cd xishuipang-flat
npm install
npx expo start --clear
# 按 w 打开 Web / 按 i 打开 iOS 模拟器
```

### 3. 验证

- GraphiQL: `http://localhost:4000/graphiql`
- Web: `http://localhost:8081`
- iOS: Metro 终端按 `i`

## 核心功能

### 已完成
- **首页**：4 页公告轮播（教会照片+外链）+ 期号选择器 + 文章水平滑窗 + **为你推荐**（基于收藏）+ 横向收藏 stack（新在前）+ 往期期刊
- **推荐算法**：客户端加权打分（作者 3 分 / 类别 2 分 / 期号距离 1 分），同作者最多 2 篇多样化；未登录 / 无收藏时显示热门往期
- **骨架屏**：三段区域（最新文章 / 推荐 / 往期期刊）加载时用脉动灰卡占位，内容就位后不上下抽搐
- **文章阅读**：首屏 2 张图 `priority=high` + 其余 `priority=low` 延后挂载 + 稳定高度占位避免跳动；字号四档；简繁切换
- **期刊详情**：封面图 Hero（右半裁切）+ Spotify 专辑式 track list + 播放全部
- **全部期刊**：封面图网格 + 最新/最早排序 + 一次加载
- **全文搜索**：MongoDB `$text` 索引 + 分页 infinite scroll
- **用户系统**：JWT 登录 · Google/FB OAuth（schema 就绪）· 邮箱降级登录 · 头像 UI · 登出
- **文章收藏云同步**：登录后本地 ↔ MongoDB Favorites 集合（userId + articleId 唯一索引）
- **音频收藏本地**：AsyncStorage 持久化（接口就绪，音频功能待真实接入）
- **播放队列**：＋ 加入 / ▶ 播放 / ↑↓ 排序 / ✕ 删除
- **7 主题**：暖白 / 深色 / 护眼 / 春 / 夏 / 秋 / 冬 · ☰ 下拉菜单单选（点勾）
- **Mini Player**：全局固定底部
- **桌面端紧凑布局**：maxWidth 1120 + 卡片 -15%（移动端不变）
- **图片加速**：jsDelivr CDN（替代 GitHub raw，解决 CORB 阻塞）+ expo-image 磁盘缓存
- **Apollo 持久化**：`cache-first` + AsyncStorage（秒开所有已访问页面）
- **版权页面**：法律声明（中英双语）+ Privacy Policy

### 待做
- OAuth 后台注册（Google Cloud Console / Facebook Developers）
- 服务器部署（待决定服务商）
- 音频实际播放（HLS + 对象存储 + expo-av / react-native-track-player）
- 播放队列拖拽排序（Reanimated + Gesture Handler）

## 图片系统

图片通过 jsDelivr CDN 从 GitHub 仓库加载：

```
https://cdn.jsdelivr.net/gh/CGCToronto/ByTheStreamWebsite@master/public/content/volume_{N}/images/{filename}
```

| 类型 | 来源 | 缓存 |
|---|---|---|
| 文章内嵌图 | content 数组中 `<filename.jpg>` 标记 | expo-image 磁盘缓存（首 2 张 high priority） |
| 文章卡片缩略图 | GraphQL `firstImage` 字段 | expo-image 磁盘缓存 |
| 期刊封面 | GraphQL `coverImage` 字段（信任后端，不再猜格式） | expo-image 磁盘缓存 |
| 公告轮播背景 | 本地 `assets/images/` | bundled |

## GraphQL API

```graphql
# 最新期号
{ latestVolume }

# 某期文章（简体，含 firstImage）
{ articlesByVolume(volume: 85, character: "simplified") {
    title author firstImage
  }
}

# 单篇文章含正文
{ article(volume: 85, slug: "0_prayer_s") { title content firstImage } }

# 期刊列表（含封面信息）
{ volumes(offset: 0, limit: 6) { id subtitle count coverSlug coverImage } }

# 搜索（分页）
{ search(query: "祷告", character: "simplified", limit: 10, offset: 0) {
    total articles { title author volume }
  }
}

# 认证
mutation { loginOrRegister(email: "x@y.com") { token user { id email } } }
mutation { loginWithGoogle(idToken: "...") { token user { ...UserFields } } }
mutation { loginWithFacebook(accessToken: "...") { token user { ...UserFields } } }
{ me { id email name provider } }

# 文章收藏
mutation { addFavorite(articleId: "85:0_prayer_s", title: "...", author: "...") { id } }
mutation { removeFavorite(articleId: "85:0_prayer_s") }
{ myFavorites { id articleId volume title author createdAt } }

# 音频（接口就绪，暂返回空数组）
{ audioEpisodes(volume: 85) { id title streamUrl durationSeconds } }
```

## MongoDB 集合

| 集合 | 用途 | 关键索引 |
|---|---|---|
| `Articles` | 文章正文 | `{ title: "text", content: "text" }` |
| `TableOfContents` | 期刊目录 | `{ volume, character }` |
| `Users` | 用户（扩展 OAuth 字段） | `{ provider, providerId }` unique · `{ email }` sparse |
| `Favorites` | 文章收藏 | `{ userId, articleId }` unique · `{ userId, createdAt: -1 }` |
| `Usage` | 阅读行为上报 | — |

`Users` 和 `Favorites` 的索引在后端启动时由 `ensureIndexes()` 自动创建。

## Update Logs

### 0419 晚 — 批次 6：推荐专栏 + 骨架屏 + 汉堡主题菜单 + 桌面缩放 + 文章图片优化
- **为你推荐区块**（首页最新文章与收藏之间）：客户端加权打分算法（作者 3 分 + 类别 2 分 + 期号距离 1 分），同作者最多 2 篇多样化；未登录/无收藏显示"热门往期"；候选池从 Apollo cache 里最近 3 期取，零额外请求
- **骨架屏**：`lib/ui/Skeleton.tsx`（脉动灰卡），三区共用；避免加载时内容跳动
- **主题选择器重构**：TopNav 的 7 主题横向滚动 → 右上角 ☰ 下拉 Modal，单选打勾
- **桌面端紧凑布局**：maxWidth 1320 → 1120；ArticleCard 220→188 / FavCard 280→238 / VolumeCard 180→153（-15%）；字体与移动端不变
- **文章页图片优化**：首 2 张 `priority="high"` 立刻拉；其余 `priority="low"` 延后 200ms 挂载；给稳定预估高度避免文字抽搐

### 0419 — 批次 5：用户系统 + 云端收藏 + 7 主题 + 性能优化
- **用户认证**：JWT + Google/Facebook OAuth schema（待后台注册 Client ID）+ 邮箱降级登录
- **文章收藏云同步**：登录后本地 ↔ MongoDB Favorites 集合；未登录本地内存
- **音频收藏本地**：AsyncStorage 持久化（key: `xsp_audio_favs_v1`）
- **7 主题**：原 3 个 + 春/夏/秋/冬；护眼主题重新调色（暖焦糖棕代替冷蓝）
- **TopNav 主题选择器**：横向滚动色卡（批次 6 已改成汉堡下拉）
- **首页收藏 stack**：横向滚动 + 新在前（unshift）+ 右侧箭头暗示可滑
- **图片加速**：jsDelivr CDN 替代 GitHub raw（解决 CORB 阻塞）
- **封面简化**：信任后端 `coverImage`，不再猜 7 种 URL（每卡请求数 7 → 1）
- **Apollo 持久化**：`cache-first` + `apollo3-cache-persist` AsyncStorage（整页刷新秒开）

### 0418 — 图片系统 + UI 优化
- expo-image 三平台磁盘缓存
- 文章/期刊/封面真实图片（GitHub raw 加载）
- 自适应图片宽高比（AutoImage 组件）
- 首页期号选择器 + 公告轮播教会照片
- 全部期刊排序筛选器
- 法律声明 + Privacy Policy 页
- Footer 版权信息

### 0417 — 后端 + 真实数据 + 简繁切换
- Fastify + Mercurius GraphQL 后端
- 全页面 mock → MongoDB 真实数据
- 简繁切换（全局 `_s` / `_t` slug 过滤）
- 搜索分页 infinite scroll

### 0416 — 8 个页面实现
- 8 个占位页替换为真实实现
- IconButton 通用组件

### 0411 — UI 原型
- `xishuipang-prototype.html` 单文件原型

## 路径映射表

| 路由 | 页面 | 数据源 |
|---|---|---|
| `/` | 首页 | GraphQL + 本地公告 + 客户端推荐算法 |
| `/volume/:id` | 期刊详情 | GraphQL: volume + articlesByVolume |
| `/article/:id` | 文章阅读器 | GraphQL: article（含 content + firstImage） |
| `/queue` | 播放队列 | Zustand store |
| `/volumes` | 全部期刊 | GraphQL: volumes（含 coverImage） |
| `/favorites` | 管理收藏 | Zustand favItems（云同步） |
| `/search?q=` | 搜索结果 | GraphQL: search（分页） |
| `/login` | 登录 | GraphQL: loginOrRegister / loginWithGoogle / loginWithFacebook |
| `/profile` | 用户中心 | Zustand user + favItems |
| `/legal` | 法律声明 | 静态内容（中英双语） |
| `/privacy` | Privacy Policy | 静态内容 |

## 版权

多伦多华人福音堂
© 2005–2026 Chinese Gospel Church of Toronto
www.xishuipang.com · cgc_pen@yahoo.com
