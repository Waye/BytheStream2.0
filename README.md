# 溪水旁 2.0

基督教中文月刊「溪水旁」的全平台阅读应用。一套代码覆盖 iOS、Android、Web。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Expo SDK 52 · React Native 0.76.9 · TypeScript |
| 路由 | Expo Router v4（文件即路由） |
| 状态 | Zustand · Apollo Client 3.x |
| 图片 | expo-image（三平台磁盘缓存） |
| 后端 | Fastify · Mercurius GraphQL · DataLoader |
| 数据库 | MongoDB Atlas（复用现有 Xishuipang 数据库） |
| 缓存 | 内存缓存（Redis 接口预留） |

## 项目结构

```
xishuipang-flat/
├── app/                    # 页面（Expo Router 文件路由）
│   ├── _layout.tsx         # 根布局（ApolloProvider + ThemeProvider + MiniPlayer）
│   ├── index.tsx           # 首页（期号选择 + 文章滑窗 + 往期 + Footer）
│   ├── article/[id].tsx    # 文章阅读器（简繁切换 + 字号 + 内嵌图片）
│   ├── volume/[id].tsx     # 期刊详情（封面图 Hero + track list）
│   ├── volumes.tsx         # 全部期刊（排序筛选 + 封面图网格）
│   ├── favorites.tsx       # 收藏管理
│   ├── search.tsx          # 搜索（分页 infinite scroll）
│   ├── queue.tsx           # 播放队列（↑↓ 排序）
│   ├── login.tsx           # 登录（邮箱 + OAuth UI）
│   ├── profile.tsx         # 用户中心（简繁设置 + 收藏）
│   ├── legal.tsx           # 法律声明（中英双语）
│   └── privacy.tsx         # Privacy Policy
├── lib/
│   ├── theme/              # 设计系统（三主题 + tokens）
│   ├── store/              # Zustand（收藏 + 队列 + 简繁状态）
│   ├── ui/                 # UI 组件（ArticleCard, VolumeCard, TopNav 等）
│   ├── mock/               # 公告轮播数据 + 开发 fallback
│   └── graphql/            # Apollo Client + gql 查询
├── assets/images/          # 教会照片（公告轮播用）
├── server/                 # 后端（独立 Node 项目）
│   ├── src/
│   │   ├── index.ts        # Fastify 入口 + CORS + rate limit
│   │   ├── schema.ts       # GraphQL SDL
│   │   ├── resolvers.ts    # Query / Mutation 实现
│   │   ├── loaders.ts      # DataLoader（批量查询）
│   │   ├── db.ts           # MongoDB 连接池
│   │   ├── cache.ts        # 缓存（Redis / 内存 fallback）
│   │   └── types.ts        # TypeScript 类型
│   ├── package.json
│   ├── Procfile            # Heroku 部署
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
# 编辑 .env 填入 MongoDB Atlas URI
npm run dev
# ✓ MongoDB connected
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
- **首页**：4 页公告轮播（教会照片+外链）+ 期号选择器 + 文章水平滑窗 + 往期期刊
- **文章阅读**：真实正文 + 内嵌图片（自适应宽高比）+ 字号四档 + **简繁切换**
- **期刊详情**：封面图 Hero + Spotify 专辑式 track list + 播放全部
- **全部期刊**：封面图网格 + 最新/最早排序 + 一次加载
- **全文搜索**：MongoDB `$text` 索引 + 分页 infinite scroll
- **收藏系统**：♥ 收藏 / 管理 / 删除
- **播放队列**：＋ 加入 / ▶ 播放 / ↑↓ 排序 / ✕ 删除
- **三主题**：暖白 / 深色 / 护眼 sepia
- **Mini Player**：全局固定底部
- **图片缓存**：expo-image 磁盘缓存（iOS/Android/Web 统一）
- **版权页面**：法律声明（中英双语）+ Privacy Policy

### 待做
- Heroku 部署
- 音频实际播放（expo-av + HLS 流）
- 用户认证（JWT / OAuth）
- 播放队列拖拽排序
- 社区功能

## 图片系统

图片从 GitHub 仓库直接加载，URL 格式：

```
https://raw.githubusercontent.com/CGCToronto/ByTheStreamWebsite/master/public/content/volume_{N}/images/{filename}
```

| 类型 | 来源 | 缓存 |
|---|---|---|
| 文章内嵌图 | content 数组中 `<filename.jpg>` 标记 | expo-image 磁盘缓存 |
| 文章卡片缩略图 | GraphQL `firstImage` 字段 | expo-image 磁盘缓存 |
| 期刊封面 | GraphQL `coverImage` + 多 URL fallback | expo-image 磁盘缓存 |
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
```

## Update Logs

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
| `/` | 首页 | GraphQL + 本地公告数据 |
| `/volume/:id` | 期刊详情 | GraphQL: volume + articlesByVolume |
| `/article/:id` | 文章阅读器 | GraphQL: article（含 content + firstImage） |
| `/queue` | 播放队列 | Zustand store |
| `/volumes` | 全部期刊 | GraphQL: volumes（含 coverImage） |
| `/favorites` | 管理收藏 | Zustand store.favItems |
| `/search?q=` | 搜索结果 | GraphQL: search（分页） |
| `/login` | 登录 | UI only |
| `/profile` | 用户中心 | Zustand store + 简繁设置 |
| `/legal` | 法律声明 | 静态内容（中英双语） |
| `/privacy` | Privacy Policy | 静态内容 |

## 版权

多伦多华人福音堂
© 2005–2026 Chinese Gospel Church of Toronto
www.xishuipang.com · cgc_pen@yahoo.com
