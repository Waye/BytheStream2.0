# 批次 3 — 后端启动指南

## 目录结构

```
xishuipang-flat/
├── server/                  ← 新增 (Fastify + Mercurius)
│   ├── src/
│   │   ├── index.ts         # 入口: Fastify + CORS + rate limit + GraphiQL
│   │   ├── schema.ts        # GraphQL SDL
│   │   ├── resolvers.ts     # Query/Mutation 实现
│   │   ├── loaders.ts       # DataLoader (N+1 防护)
│   │   ├── db.ts            # MongoDB 连接池
│   │   ├── cache.ts         # Redis 缓存 (无 Redis 自动退回内存)
│   │   └── types.ts         # MongoDB 文档 + GQL 返回类型
│   ├── package.json
│   ├── tsconfig.json
│   ├── Procfile             # Heroku
│   └── .env.example
├── lib/
│   └── graphql/             ← 新增 (Apollo Client)
│       ├── client.ts        # ApolloClient 实例
│       ├── queries.ts       # gql 查询/变更
│       └── index.ts
```

## 一、启动后端

```bash
cd server

# 1. 装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env,填入真实 MongoDB URI

# 3. 开发模式 (热重载)
npm run dev
```

启动后访问 http://localhost:4000/graphiql 可以玩交互式查询界面。

### 测试查询

```graphql
# 最新期刊编号
{ latestVolume }

# 第 55 期文章列表
{
  articlesByVolume(volume: 55) {
    id slug title author category mins
  }
}

# 单篇文章(含正文)
{
  article(volume: 55, slug: "article-1") {
    title author content
  }
}

# 期刊列表(前 6 期)
{
  volumes(offset: 0, limit: 6) {
    id subtitle count
  }
}

# 搜索
{
  search(query: "安静") {
    total
    articles { title author volume }
  }
}
```

## 二、前端接入 Apollo Client

```bash
# 回到项目根目录
cd ..

# 装 Apollo 依赖
npm install @apollo/client graphql
```

### 修改 app/_layout.tsx

在最外层包一个 `ApolloProvider`:

```tsx
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/graphql';

export default function Layout() {
  return (
    <ApolloProvider client={apolloClient}>
      {/* 现有内容不变 */}
    </ApolloProvider>
  );
}
```

### 页面里使用

```tsx
import { useQuery } from '@apollo/client';
import { GET_ARTICLES_BY_VOLUME } from '../lib/graphql';

// 替换 mock 数据
const { data, loading } = useQuery(GET_ARTICLES_BY_VOLUME, {
  variables: { volume: 55 },
});
const articles = data?.articlesByVolume ?? [];
```

## 三、部署 Heroku

```bash
cd server

# 1. 编译 TS
npm run build

# 2. 创建 Heroku 应用
heroku create xishuipang-api

# 3. 设置环境变量
heroku config:set MONGO_URI="mongodb+srv://..."
heroku config:set MONGO_DB=Xishuipang
heroku config:set NODE_ENV=production
heroku config:set CORS_ORIGINS="https://your-frontend.com"

# 4. 可选: 加 Redis
heroku addons:create heroku-redis:mini

# 5. 部署
#    如果 server/ 是子目录,用 subtree push:
git subtree push --prefix server heroku main
#    或者用 heroku-buildpack-monorepo
```

## 四、MongoDB 注意事项

### 现有集合与新 schema 的映射

| MongoDB 集合       | GraphQL 类型 | 说明                    |
|-------------------|-------------|------------------------|
| Articles          | Article     | volume/id 是字符串       |
| TableOfContents   | Volume      | 每期目录,含 subtitle     |
| Users             | User        | 自增 id + email         |
| Usage             | trackUsage  | 阅读行为上报             |

### 确保有 text index (搜索用)

```js
// 在 MongoDB Shell 或 Atlas 里运行一次
db.Articles.createIndex({ title: "text", content: "text" })
```

## 五、架构决策

| 决策                | 理由                                |
|--------------------|-------------------------------------|
| Fastify 替换 Express | 4x QPS, 原生 HTTP/2, schema 验证     |
| Mercurius 而非 Apollo Server | Fastify 原生插件, 更轻量            |
| DataLoader         | 防 N+1, 每请求独立实例               |
| Redis 可选          | 开发期用内存缓存, 生产加 Redis        |
| 前端 Apollo Client  | 声明式数据层, 自动缓存 + codegen      |
| volume/slug 是字符串 | 兼容现有 MongoDB 数据                 |
