export const typeDefs = /* GraphQL */ `
  # ─────────────────────────── 文章 / 期刊 ───────────────────────────
  type Article {
    id: String!
    slug: String!
    volume: Int!
    title: String!
    author: String!
    category: String!
    mins: Int!
    content: [String!]!
    firstImage: String
  }

  type Volume {
    id: Int!
    subtitle: String!
    count: Int!
    coverSlug: String
    "封面图片文件名（从封面文章 content 提取）"
    coverImage: String
    articles: [Article!]!
  }

  type SearchResult {
    articles: [Article!]!
    total: Int!
  }

  # ─────────────────────────── 用户 / 认证 ───────────────────────────
  enum AuthProvider {
    EMAIL
    GOOGLE
    FACEBOOK
  }

  type User {
    id: Int!
    email: String
    name: String
    avatar: String
    provider: AuthProvider!
    createdAt: String
  }

  "登录 / 注册返回：JWT 给前端 AsyncStorage 存着，之后走 Authorization: Bearer"
  type AuthPayload {
    token: String!
    user: User!
  }

  # ─────────────────────────── 文章收藏（云端） ───────────────────────────
  """
  文章收藏 — 只存文章，音频收藏在客户端本地持久化，不走后端。
  articleId 格式: "volume:slug"，对应 Article.id
  """
  type Favorite {
    id: String!              # userId:articleId
    articleId: String!
    volume: Int!
    slug: String!
    title: String!
    author: String
    category: String
    createdAt: String!
    article: Article         # 按需 resolve
  }

  # ─────────────────────────── 音频（接口先行，暂不实现） ───────────────────────────
  """
  音频节目 — schema 先定好，resolver 返 mock/空数据。
  将来接入：上传 mp3 → 后台切 HLS 分片 → 存 R2/S3 → streamUrl 返回带签名的 m3u8。
  注意：音频"喜欢"在客户端本地存储，不走这个 schema。
  """
  type AudioEpisode {
    id: ID!
    title: String!
    author: String
    volume: Int
    durationSeconds: Int!
    coverImage: String
    """HLS 播放清单 URL（带短时效签名 token）。现在返回 null。"""
    streamUrl: String
    streamExpiresAt: String
  }

  # ─────────────────────────── Query / Mutation ───────────────────────────
  type Query {
    article(volume: Int!, slug: String!): Article
    articlesByVolume(volume: Int!, character: String = "simplified"): [Article!]!
    volume(id: Int!): Volume
    volumes(offset: Int = 0, limit: Int = 6): [Volume!]!
    latestVolume: Int!
    search(query: String!, character: String = "simplified", limit: Int = 10, offset: Int = 0): SearchResult!

    "当前登录用户（未登录返回 null）"
    me: User

    "我的文章收藏（按加入时间倒序）。未登录返回空数组。"
    myFavorites: [Favorite!]!

    # 音频 — 接口占位
    audioEpisode(id: ID!): AudioEpisode
    audioEpisodes(volume: Int): [AudioEpisode!]!
  }

  type Mutation {
    "Google 登录 — 前端拿到 idToken（expo-auth-session / Google Sign-In）传上来"
    loginWithGoogle(idToken: String!): AuthPayload!

    "Facebook 登录 — 前端拿到 accessToken 传上来，后端调 Graph API 验证"
    loginWithFacebook(accessToken: String!): AuthPayload!

    "邮箱快速登录 — 开发期 / 降级方案，无密码（生产建议换 magic link）"
    loginOrRegister(email: String!, name: String): AuthPayload!

    "登出（前端丢 token 即可；此接口用于未来 token 黑名单）"
    logout: Boolean!

    "添加文章收藏（登录后）。articleId 是 'volume:slug'，后端自动拆解。"
    addFavorite(
      articleId: String!
      title: String!
      author: String
      category: String
    ): Favorite!

    "移除文章收藏"
    removeFavorite(articleId: String!): Boolean!

    trackUsage(
      volumeId: Int!
      articleId: String!
      articleTitle: String
      category: String
    ): Boolean!
  }
`;
