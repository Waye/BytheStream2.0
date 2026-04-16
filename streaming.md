## 一、整体架构（除 MongoDB 数据外全部重构）

```
┌─────────────────────────────────────────────────────┐
│  Expo App (iOS / Android / Web) — 一套代码          │
│  React Native + RN Web + Zustand + Apollo Client    │
└────────────────────┬────────────────────────────────┘
                     │ GraphQL over HTTPS + WS
                     │ (持久连接 / 订阅)
┌────────────────────▼────────────────────────────────┐
│  Edge / CDN 层                                       │
│  Cloudflare (静态资源 + 音频边缘缓存 + WAF)         │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│  API 网关 (Fastify + Mercurius GraphQL)              │
│  - 比 Express 快 2-3x,原生支持 HTTP/2                │
│  - DataLoader 批量查询 + 请求去重                    │
│  - Redis 查询缓存 (文章/目录,TTL 1h)                 │
│  - Rate limiting (IP + user)                         │
└───┬──────────────┬──────────────┬───────────────────┘
    │              │              │
    ▼              ▼              ▼
┌────────┐   ┌──────────┐   ┌────────────────────┐
│MongoDB │   │  Redis   │   │ 对象存储 (R2/S3)   │
│(保留)  │   │(缓存/队列)│  │ 音频文件 + HLS 切片│
└────────┘   └──────────┘   └──────────┬─────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ CDN 分发 (Cloudflare)│
                            │ HLS 流 + Range 请求   │
                            └──────────────────────┘
```

**高并发关键设计（尤其音频）：**

1. **音频走 HLS 流式分片，不走 API 服务器** — 音频文件切成 6-10 秒的 `.ts` 分片 + `.m3u8` 索引，上传到 R2/S3，Cloudflare CDN 边缘缓存。API 只返回 `m3u8` URL（带签名短时效 token），**播放流量完全不经过你的服务器**，天然支撑十万级并发
2. **签名 URL + 边缘鉴权** — Cloudflare Workers 做 token 校验，防盗链但不拖累源站
3. **Redis 多层缓存** — 文章/目录这类读多写少的数据缓存 1 小时，命中率能到 95%+
4. **DataLoader** — GraphQL N+1 问题的标配，一次请求合并批量查 Mongo
5. **MongoDB 只读副本** — 读写分离，查询走 secondary
6. **Fastify 替代 Express** — Express 单核 QPS 约 1.5 万，Fastify 约 4 万
7. **预留 BullMQ 队列** — 将来音频转码（上传 mp3 → 自动切 HLS）异步处理

## 二、预留的音频接口（GraphQL Schema）

```graphql
type AudioEpisode implements ContentItem {
  id: ID!
  title: String!
  # 播放清单 URL(HLS),由服务端生成带签名的短时效 URL
  streamUrl: String!           # https://cdn.xxx.com/ep/123/index.m3u8?token=...
  streamExpiresAt: DateTime!   # 客户端据此刷新
  durationSeconds: Int!
  coverImage: String
  chapters: [AudioChapter!]!
  transcript: Transcript       # 音频 + 文稿同步(预留)
}

type Query {
  audioEpisode(id: ID!): AudioEpisode
  audioEpisodes(volume: Int): [AudioEpisode!]!
}

type Mutation {
  # 客户端上报播放进度(批量,每 15s 一次)
  reportPlaybackProgress(episodeId: ID!, positionSec: Float!): Boolean!
  refreshStreamUrl(episodeId: ID!): AudioEpisode!
}
```

音频模块现在**只定义 schema 和前端播放器 UI**,resolver 里先 return mock 数据,等真实音频接入时只需实现 resolver,前端零改动。

---

