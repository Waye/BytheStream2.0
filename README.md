# 溪水旁 2.0

基督教中文季刊「溪水旁」的全平台阅读应用。一套代码覆盖 iOS、Android、Web。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Expo SDK 52 · React Native 0.76.9 · TypeScript |
| 路由 | Expo Router v4（文件即路由） |
| 状态 | Zustand · Apollo Client 3.x（AsyncStorage 持久化） |
| 图片 | expo-image（三平台磁盘缓存）· jsDelivr CDN |
| 音频 | expo-av · @react-native-community/slider |
| 认证 | JWT · Google / Facebook OAuth（expo-auth-session） |
| 后端 | Fastify · Mercurius GraphQL · DataLoader |
| 数据库 | MongoDB Atlas（Xishuipang 库 · Articles / TableOfContents / Users / Favorites / Usage） |
| TTS | MeloTTS-Chinese（本地 Mac M1）/ IndexTTS 1.5（后续用 RTX 5070） |
| 缓存 | 内存缓存（Redis 接口预留）· Apollo cache-first |
| 存储 | 本地 localhost（开发期）/ Cloudflare R2（生产，计划中） |

## 项目结构

```
xishuipang-flat/
├── app/                    # 页面（Expo Router 文件路由）
│   ├── _layout.tsx         # 根布局（ApolloProvider + ThemeProvider + MiniPlayer + bootstrapAuth）
│   ├── index.tsx           # 首页（欢迎卡 + 最新文章 + 推荐 + 播放队列 stack + 收藏 stack + 往期）
│   ├── article/[id].tsx
│   ├── volume/[id].tsx
│   ├── volumes.tsx
│   ├── favorites.tsx
│   ├── search.tsx
│   ├── queue.tsx
│   ├── login.tsx
│   ├── profile.tsx
│   ├── legal.tsx
│   └── privacy.tsx
├── lib/
│   ├── theme/              # 设计系统（7 主题 · brand/onBrand/danger 等完整 token）
│   ├── store/              # Zustand（user + 收藏 + 队列 + 音频播放状态）
│   ├── ui/
│   │   ├── MiniPlayer.tsx  # 底部播放器（expo-av + Slider + 队列徽章 + 欢迎音频 fallback）
│   │   └── ...             # TopNav / ThemeMenu / Skeleton / cards
│   ├── auth/               # OAuth hooks（Google / Facebook）
│   ├── recommend.ts
│   ├── mock/
│   └── graphql/
├── server/                 # 后端（独立 Node 项目）
│   ├── src/
│   │   ├── index.ts        # Fastify 入口（启动时 initAudioState）
│   │   ├── schema.ts
│   │   ├── resolvers.ts    # audioEpisode / audioEpisodes 接 TTS 产物
│   │   ├── audio.ts        # 读 tts/output/state.json，简繁合并，生成 streamUrl
│   │   ├── auth.ts
│   │   ├── loaders.ts
│   │   ├── db.ts
│   │   ├── cache.ts
│   │   └── types.ts
│   ├── package.json
│   └── .env.example
├── tts/                    # 本地 TTS 批处理（Python）
│   ├── config.py           # 统一配置（SPEED=0.9, BITRATE=32k, OUTPUT_SAMPLE_RATE=22050）
│   ├── db.py               # MongoDB 读取
│   ├── textproc.py         # content[] → 可朗读文本 + 语言检测
│   ├── synth.py            # MeloTTS 包装（ZH/EN 双模型）
│   ├── scripts/
│   │   ├── smoke_test.py       # 冒烟测试
│   │   ├── generate_one.py     # 单篇测试
│   │   ├── generate_welcome.py # 生成欢迎音频
│   │   ├── batch.py            # 批量 + 断点续传
│   │   ├── check.py            # 进度查看
│   │   └── serve.py            # 本地静态 HTTP（Range 支持，给前端试听）
│   └── output/
│       ├── state.json      # 进度清单
│       ├── _welcome.mp3    # 未登录用户的欢迎音频
│       └── volume_XX/*.mp3
├── audio-integration/      # 参考代码（已并入主项目，保留做备份）
├── DESIGN.md
├── streaming.md
└── 工作日志.md
```

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
cp .env.example .env
# .env 填入 MongoDB Atlas URI + JWT_SECRET
# 新增一行：AUDIO_BASE_URL=http://localhost:8090
npm run dev
# ✓ MongoDB connected
# ✓ Audio index loaded: N episodes from .../tts/output/state.json
# 🚀 GraphQL server ready at http://localhost:4000/graphiql
```

### 2. 启动 TTS 静态服务（音频）

```bash
cd tts
# 激活 Python 环境（首次见 tts/README.md 安装依赖）
conda activate python-mac-gpu  # 或 source .venv/bin/activate
python -m scripts.serve
# Serving .../tts/output
#   http://localhost:8090/
```

### 3. 启动前端

```bash
cd xishuipang-flat
npm install
npx expo install @react-native-community/slider
npx expo start --clear
# 按 w 打开 Web / 按 i 打开 iOS 模拟器
```

### 4. 验证

- GraphiQL: `http://localhost:4000/graphiql`
- 静态音频: `http://localhost:8090/volume_85/11_li_s.mp3`
- 前端: `http://localhost:8081`

## 核心功能

### 已完成
- **首页**：欢迎卡（未登录）+ 公告轮播 + 期号选择器 + 最新文章滑窗 + 为你推荐 + **播放队列 stack**（带数量） + 收藏 stack + 往期期刊
- **推荐算法**：加权打分 + 同作者多样化 + 未登录热门回落
- **骨架屏**：三段占位，加载不抽搐
- **文章阅读**：首屏 2 张图 high priority + 其余延后挂载 + 字号四档 + 简繁切换
- **期刊详情**：封面图 Hero + Spotify 式 track list
- **全部期刊**：封面网格 + 最新/最早排序
- **全文搜索**：MongoDB `$text` + infinite scroll
- **用户系统**：JWT 登录 · Google/FB OAuth schema（待后台配置）· 邮箱降级 · 登出
- **文章收藏云同步**：MongoDB `Favorites` 集合
- **音频收藏本地**：AsyncStorage
- **播放队列**：+ 加入 / ▶ 播放 / ↑↓ 排序 / ✕ 删除 / 徽章显示数量
- **音频播放**：
  - 本地 TTS 批处理（MeloTTS-Chinese，M1 Pro CPU 5x 实时）
  - 后端 `audio.ts` 读 `tts/output/state.json` + 简繁 slug 归并（_t → _s）
  - `scripts/serve.py` HTTP Range 服务（拖动进度条可从中间加载）
  - 前端 MiniPlayer：expo-av 实际播放 + Slider 拖动进度 + 队列徽章 + 欢迎音频 fallback
- **7 主题**：暖白 / 深色 / 护眼 / 春 / 夏 / 秋 / 冬
- **Mini Player**：底部固定，theme 统一配色（brand/onBrand/danger 全用上）
- **欢迎音频**：未登录用户进首页自动在 MiniPlayer 加载"溪水旁·欢迎"（含两段诗篇引用 + 编辑部致谢）

### 待做
- **OAuth 后台配置**：Google Cloud Console + Facebook Developers 注册 Client ID
- **TTS 升级**：换到 Windows RTX 5070 笔记本 + **IndexTTS 1.5**（Bilibili 开源，标准普通话，可克隆音色，零样本 voice clone）
- **音频部署**：跑完 1352 篇全量 → 传 **Cloudflare R2**（10GB 免费 + 零出站费）→ `AUDIO_BASE_URL` 一行改完
- **服务器部署**：Heroku / Railway / Fly（待定）
- **播放队列拖拽排序**（Reanimated + Gesture Handler）
- Redis 缓存接入（配 REDIS_URL 即切换）
- GraphQL codegen

## 音频系统

### 整体架构

```
┌─────────────────────────────────────────────┐
│ Expo App                                    │
└────────┬──────────────────────┬─────────────┘
         │ GraphQL :4000        │ HTTP Range :8090
         ▼                      ▼
┌──────────────────┐    ┌────────────────────┐
│ Fastify          │    │ scripts/serve.py   │
│ audioEpisode(id) │    │ (开发期)           │
│ → streamUrl      │    │                    │
│                  │    │ or Cloudflare R2   │
│ state.json 读取  │    │ (生产期)           │
│ _t → _s 归并     │    └────────────────────┘
└──────────────────┘              ▲
                                  │
                  ┌───────────────┴───────────────┐
                  │ tts/output/volume_XX/*.mp3    │
                  │ (本地生成,简繁共用)            │
                  └───────────────────────────────┘
```

**数据流**：App 向 :4000 查 `audioEpisode(id)` 拿到 streamUrl，然后直接向 :8090 或 R2 请求 mp3 字节流（expo-av 播放 + Slider 拖动控制）。

### TTS 配置

- **模型**：MeloTTS-Chinese（VITS 架构，Mac M1 Pro CPU 可跑）
- **码率**：32 kbps MP3 + 22.05 kHz 采样率（1352 篇总计预估 ~2.5GB）
- **语速**：0.9（朗读式文章沉静）
- **简繁共用**：只生成简体 `_s`，后端 resolver 里 `_t → _s` 自动映射到同一文件
- **英文检测**：整篇英文占比 > 70% 自动切 EN 模型（中英混读走 ZH mix-en 模式）
- **断点续传**：`output/state.json` 记录已完成，Ctrl-C 重跑不会丢进度

### 生产升级路径

未来换到 Windows RTX 5070 笔记本 + **IndexTTS 1.5**：
- Bilibili 开源，为中文优化
- 标准普通话（解决 MeloTTS 的南方口音问题）
- 零样本音色克隆（10 秒参考音频）
- Apache 2.0 可商用
- RTX 5070 需 PyTorch 2.9.1+cu128 (Blackwell sm_120 支持)
- 预估跑完 1352 篇仅需 2-5 小时（M1 Pro 要 30-40 小时）

### 存储成本

| 服务 | 起步价 | 出站流量 | 10GB 月成本 |
|---|---|---|---|
| **Cloudflare R2** ⭐ | $0 | 全免费 | $0（免费档） |
| DigitalOcean Spaces | $5/月 flat | 1TB 免费 | $5 |
| AWS S3 | $0.023/GB | $0.09/GB 之后 | $0.23 + egress |

选 R2。1352 篇 × ~2MB ≈ 2.5GB，完全在 10GB 免费档内。

## 欢迎音频

未登录用户打开首页，底部 MiniPlayer 自动加载 `_welcome.mp3`：

> 他要像一棵树栽在溪水旁，按时候结果子... ——诗篇 1:3
>
> 他使我躺卧在青草地上，领我到幽静的溪水旁。——诗篇 23:2
>
> 你好，欢迎来到溪水旁。
>
> 三十二年来，这本基督教中文季刊每一季度，把信徒的见证、默想和教义分享，带到读者的案头。现在，它也会朗读给你听。
>
> 在通勤路上，厨房里，睡前的床头，祷告之后——一千多篇文章、八十余期精选，都能被聆听。
>
> 我的心哪，你当默默无声，专等候神。
>
> 感谢大家一直以来的支持。愿神祝福你。——溪水旁编辑部

首页同时显示欢迎卡（"溪水旁 / 三十二年来..." + "登录同步收藏"按钮）。

## GraphQL API

```graphql
# 文章
{ latestVolume }
{ articlesByVolume(volume: 85, character: "simplified") { title author firstImage } }
{ article(volume: 85, slug: "0_prayer_s") { title content firstImage } }
{ volumes(offset: 0, limit: 6) { id subtitle count coverImage } }
{ search(query: "祷告", character: "simplified", limit: 10, offset: 0) { total articles { title } } }

# 认证
mutation { loginOrRegister(email: "x@y.com") { token user { id email } } }
{ me { id email name provider } }

# 文章收藏
mutation { addFavorite(articleId: "85:0_prayer_s", title: "...", author: "...") { id } }
{ myFavorites { id articleId volume title author createdAt } }

# 音频 ← 已打通
{ audioEpisode(id: "85:11_li_s") { streamUrl durationSeconds title author } }
{ audioEpisodes(volume: 85) { id title streamUrl durationSeconds } }
# 简繁自动归并:audioEpisode(id: "85:11_li_t") 返回的 streamUrl 指向同一个 _s.mp3
```

## MongoDB 集合

| 集合 | 用途 | 关键索引 |
|---|---|---|
| `Articles` | 文章正文 | `{ title: "text", content: "text" }` |
| `TableOfContents` | 期刊目录 | `{ volume, character }` |
| `Users` | 用户 | `{ provider, providerId }` unique · `{ email }` sparse |
| `Favorites` | 文章收藏 | `{ userId, articleId }` unique · `{ userId, createdAt: -1 }` |
| `Usage` | 阅读行为 | — |

`Users` 和 `Favorites` 的索引在后端启动时由 `ensureIndexes()` 自动创建。


## 路径映射表

| 路由 | 页面 | 数据源 |
|---|---|---|
| `/` | 首页 | GraphQL + 欢迎卡 + 推荐 + 队列/收藏 stack |
| `/volume/:id` | 期刊详情 | GraphQL: volume + articlesByVolume |
| `/article/:id` | 文章阅读器 | GraphQL: article |
| `/queue` | 播放队列 | Zustand store |
| `/volumes` | 全部期刊 | GraphQL: volumes |
| `/favorites` | 管理收藏 | Zustand favItems（云同步） |
| `/search?q=` | 搜索结果 | GraphQL: search（分页） |
| `/login` | 登录 | GraphQL: loginOrRegister / loginWithGoogle / loginWithFacebook |
| `/profile` | 用户中心 | Zustand user + favItems |
| `/legal` | 法律声明 | 静态 |
| `/privacy` | Privacy Policy | 静态 |

## 版权

多伦多华人福音堂
© 2005–2026 Chinese Gospel Church of Toronto
www.xishuipang.com · cgc_pen@yahoo.com
