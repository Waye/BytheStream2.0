# 溪水旁 Flat 版

单项目结构，无 monorepo，最简配置。

## 启动

```bash
cd xishuipang-flat
npm install            # 2-3 分钟
npx expo start --web   # 按 w 看浏览器
```

## 结构

```
xishuipang-flat/
├── app/            Expo Router 页面(文件即路由)
│   ├── _layout.tsx
│   ├── index.tsx   首页
│   ├── article/[id].tsx
│   ├── volume/[id].tsx
│   ├── queue.tsx
│   ├── volumes.tsx
│   ├── favorites.tsx
│   ├── search.tsx
│   ├── login.tsx
│   └── profile.tsx
└── lib/
    ├── theme/      三主题 token
    ├── store/      Zustand 全局状态
    ├── ui/         组件库
    └── mock/       假数据
```

## 如果 npm install 报 ERESOLVE

```bash
echo "legacy-peer-deps=true" > .npmrc
npm install
```
