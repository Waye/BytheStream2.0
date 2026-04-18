export const typeDefs = /* GraphQL */ `
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

  type User {
    id: Int!
    email: String
    name: String
  }

  type Query {
    article(volume: Int!, slug: String!): Article
    articlesByVolume(volume: Int!, character: String = "simplified"): [Article!]!
    volume(id: Int!): Volume
    volumes(offset: Int = 0, limit: Int = 6): [Volume!]!
    latestVolume: Int!
    search(query: String!, character: String = "simplified", limit: Int = 10, offset: Int = 0): SearchResult!
    me: User
  }

  type Mutation {
    loginOrRegister(email: String!, name: String): User!
    trackUsage(
      volumeId: Int!
      articleId: String!
      articleTitle: String
      category: String
    ): Boolean!
  }
`;
