# 溪水旁 — 音频与流式架构

## 0. 现状（2026/4/20）

音频系统**端到端打通**，当前架构是**纯 MP3 + HTTP Range**，没有用 HLS。

```
┌──────────────────────────────────────────────────────┐
│  本地 Mac M1 Pro                                      │
│  tts/ 目录 (MeloTTS-Chinese, CPU)                     │
│    └─ output/                                         │
│        ├─ volume_85/11_li_s.mp3 (12:26 / 32kbps)     │
│        ├─ _welcome.mp3                                │
│        └─ state.json (索引：每个 mp3 的时长/大小)      │
└──────────────┬───────────────────────────────────────┘
               │ 本地批量生成（一篇一篇）
               ▼
┌──────────────────────────────────────────────────────┐
│  scripts/serve.py — Python HTTP :8090                │
│  (静态文件 + Range 请求支持)                          │
└──────────────┬───────────────────────────────────────┘
               │  http://localhost:8090/volume_85/*.mp3
               │
        ┌──────┴──────┐
        │             │
        ▼             ▼
┌────────────────┐  ┌──────────────────────────────────┐
│ Fastify :4000  │  │  Expo App (iOS / Android / Web)  │
│ GraphQL        │  │  expo-av Sound + Slider          │
│  - audio.ts    │  │   - MiniPlayer 播放器             │
│  - resolvers   │◀─┤   - GET_AUDIO_EPISODE 查 streamUrl│
│  - state.json  │  │   - HTTP Range 拖动               │
│    热重载       │  └──────────────────────────────────┘
└────────────────┘
```

**关键决策**：
- ❌ 不做 HLS / 切片 / m3u8（开销大、当前体量没必要）
- ✅ 纯 MP3 + HTTP Range（浏览器、expo-av 原生支持，拖进度、断点续传都自动）
- ✅ 简体生成、繁体复用同一个 mp3（resolver 里 `_t → _s` canonical 归并）

---

## 1. 数据流（一次播放生命周期）

用户在 App 里点「西班牙游记」的 ▶：

```
1. App 问 4000:
   query { audioEpisode(id: "85:11_li_s") { streamUrl durationSeconds title } }

2. 4000 (resolvers.ts):
   - getAudioEpisode(85, "11_li_s") 从 state.json 拿到时长 + 路径
   - 同时查 MongoDB Articles 拿 title / author
   - 拼出 streamUrl = http://localhost:8090/volume_85/11_li_s.mp3

3. App 拿到 URL:
   - expo-av Sound.createAsync({ uri: streamUrl }, { shouldPlay: true })
   - Slider 用 onSlidingComplete(v) → sound.setPositionAsync(v * 1000)

4. 8090 (serve.py):
   - 收到 GET (Range: bytes=0-)
   - 返回 206 Partial Content
   - 拖动进度 → 收到 (Range: bytes=N-)，从指定字节给

5. 完成播放 → status.didJustFinish → store.next()
```

**职责分离**：
- 4000 = "**告诉你音频在哪**"（API 层）
- 8090 = "**真把音频字节给你**"（CDN 层）

未来上线 R2 时，4000 不动，只把 8090 换成 `https://pub-xxxxx.r2.dev`。

---

## 2. TTS 管道

### 2.1 当前：MeloTTS-Chinese（Mac M1 Pro）

```
MongoDB Articles
       │
       │ db.iter_articles(volume, character='simplified')
       ▼
content[] (List[str])
       │
       │ textproc.content_to_chunks()
       │   - 段落用空字符串分隔
       │   - 长句按标点切到 ≤400 字符
       │   - <filename.jpg> 标记直接丢弃
       │   - detect_language() ZH/EN 自动判断（阈值 0.7）
       ▼
List[Chunk(text, lang, is_paragraph_break)]
       │
       │ synth.synth_article()
       │   - 懒加载 ZH/EN 模型
       │   - 每 chunk 用对应模型合成
       │   - 段落间插 600ms 静音
       │   - ffmpeg 拼接 → 22050Hz / 32kbps mono mp3
       ▼
output/volume_N/<slug>.mp3 + state.json 更新
```

**为什么这套配置**：
| 参数 | 值 | 理由 |
|---|---|---|
| 采样率 | 22050 Hz | 语音内容，44.1kHz 浪费空间 |
| 比特率 | 32 kbps | 单声道朗读，听感够，1352 篇 ≈ 2.5GB |
| 单声道 | mono | 朗读没立体声需求 |
| SPEED | 0.9 | 比默认略慢，更清楚 |
| MAX_CHARS_PER_CHUNK | 400 | 拼接点更少 → 电音机会少 |

**确定的痛点**（无法在 MeloTTS 内部修）：
- 口音偏南方 / 台式（训练语料问题）
- chunk 边界偶尔有电音 artifact（已加 fade-in/out 缓解）

### 2.2 计划：IndexTTS 1.5（Windows + RTX 5070）

理由：
- Bilibili 出品，普通话标准（CCTV 配音员级别）
- 字符 + 拼音混合建模，多音字能用拼音纠正
- 集成 BigVGAN2，音质明显高于 MeloTTS
- 零样本 voice clone（10s 参考音）
- 跑在 RTX 5070 上，1352 篇估计 4-8 小时（vs Mac CPU 30 小时）

**部署关键**：
- PyTorch 2.9.1+cu128（Blackwell sm_120 支持）
- 模型从 huggingface IndexTeam/IndexTTS-1.5 下
- 接口和 MeloTTS 保持一致：`synth_article(chunks, out, lang)`，整套 tts/ 目录代码可平移

---

## 3. 上线 Cloudflare R2（计划中）

### 3.1 为什么 R2

| 选项 | 月费 | 出站费 | 适合度 |
|---|---|---|---|
| **Cloudflare R2** | **10GB 免费** | **$0**（任意流量） | ⭐⭐⭐⭐⭐ |
| AWS S3 + CloudFront | $0.023/GB | $0.085/GB（贵！） | ⭐ |
| DigitalOcean Spaces | $5/月起 | $0.01/GB（25TB 免费） | ⭐⭐⭐ |
| Backblaze B2 + bunny.net | $6/TB | $0.005/GB | ⭐⭐⭐⭐ |

我们 1352 篇 × 平均 2.5MB = **3.4GB**，永远在 R2 免费档内。
零出站费意味着用户听多少都不花钱。预算 $15 完全用不掉。

### 3.2 部署步骤（待做）

```bash
# 1. 创建 R2 bucket（Cloudflare dashboard）
#    名字: xishuipang-audio
#    Public access: 开（或加 Worker 鉴权）

# 2. 配 rclone（一次性）
brew install rclone
rclone config  # 选 r2 后填 access key / secret

# 3. 同步 output/ → R2
rclone sync tts/output/ r2:xishuipang-audio/ \
  --exclude "state.json" --exclude "*.bak" \
  --transfers 8 --progress

# 4. 改后端环境变量
# server/.env:
#   AUDIO_BASE_URL=https://pub-xxxxxxxxxx.r2.dev

# 5. 重启 server，前端零改动
```

**state.json 不上传** —— 它只是本地索引，URL 拼装由 audio.ts 处理。

### 3.3 可选：Cloudflare Worker 加防盗链

```javascript
// 简单的 token 校验（防直接拿 URL 在别处嵌）
addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  const token = url.searchParams.get('t')
  if (!verifyToken(token)) return new Response('Forbidden', { status: 403 })
  event.respondWith(fetch(event.request))
})
```

后端 `audioEpisode` resolver 给每个 streamUrl 拼接 5min 有效期的 token，前端到期前自动刷新。

---

## 4. 简繁归并策略

只生成简体 mp3，繁体共用同一个文件：

```typescript
// server/src/audio.ts
function canonicalSlug(slug: string): string {
  return slug.endsWith('_t') ? slug.slice(0, -2) + '_s' : slug;
}

export function getAudioEpisode(volume: number, slug: string) {
  const canonical = canonicalSlug(slug);
  const entry = stateIndex.get(`${volume}:${canonical}`);
  if (!entry) return null;
  return {
    id: `${volume}:${slug}`,        // 保留请求时的 slug
    canonicalSlug: canonical,        // 真实文件指向简体
    streamUrl: `${AUDIO_BASE_URL}/volume_${volume}/${canonical}.mp3`,
    durationSeconds: entry.duration,
  };
}
```

省一半生成时间和 50% 存储。前端不感知。

---

## 5. 未来 GraphQL 扩展（已预留 schema）

当前真正实现的字段：

```graphql
type AudioEpisode {
  id: ID!
  title: String!
  author: String
  volume: Int!
  durationSeconds: Float!
  streamUrl: String!
  streamExpiresAt: DateTime    # 现为 null,R2 + 签名后启用
  coverImage: String           # 现为 null,后续接入
}
```

**后续要加的**（占位 schema 已存在，resolver 暂留 mock / null）：

```graphql
type AudioEpisode {
  ...
  chapters: [AudioChapter!]!   # 章节标记（用 textproc 段落边界生成）
  transcript: Transcript        # 文稿同步（朗读时高亮当前句）
}

type Mutation {
  reportPlaybackProgress(episodeId: ID!, positionSec: Float!): Boolean!
  refreshStreamUrl(episodeId: ID!): AudioEpisode!
}
```

这些都不影响 MVP 的"播得动 + 拖进度"基本功能。

---

## 6. 已完成 vs 未来路线

### ✅ 已完成（2026/4/20）
- MeloTTS 本地批处理管道（tts/ 完整目录）
- 后端 audio.ts + state.json 热重载
- resolvers 接 audioEpisode / audioEpisodes
- 前端 MiniPlayer expo-av 真实播放 + Slider 拖动
- 简繁 canonical 归并
- 欢迎音频（_welcome.mp3）+ 未登录默认播放
- 队列徽章红点 + theme.brand 配色统一

### 🔄 进行中
- 全量 1352 篇音频生成（首篇耗时 12 分钟，预计 30+ 小时）

### 🔮 未来
- IndexTTS 1.5 部署（RTX 5070 + PyTorch 2.9.1+cu128）
- Cloudflare R2 上线（rclone sync + 改 AUDIO_BASE_URL）
- Cloudflare Worker 鉴权（streamExpiresAt 启用）
- 章节标记（textproc 已有段落边界，加 chapter offsets 即可）
- 文稿同步（朗读时高亮当前段，需要每段时间戳）
- 后台批处理监控页（基于 state.json 的可视化）
