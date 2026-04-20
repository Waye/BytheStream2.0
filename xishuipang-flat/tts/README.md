# 溪水旁 TTS 批处理

本地 Mac M1 Pro 用 **MeloTTS** 给 MongoDB 里的文章批量生成 MP3。
先 localhost 跑通 → 以后上传 **Cloudflare R2**（免费 10GB + 零出站费）。

## 关键决策

| 决策 | 选择 | 理由 |
|---|---|---|
| 模型 | MeloTTS-Chinese | 确定性输出(VITS),批量稳定,CPU 5x 实时 |
| 码率 | 32 kbps MP3 | 语音够用,1000 篇 ≈ 2-3 GB,10GB R2 免费档够 |
| 采样率 | 22.05 kHz | 32k 配高采样率高频失真,降采样后清晰度更好 |
| 语速 | 0.9 | 朗读式文章稍慢更沉静 |
| 简繁 | 只生成简体,共用音频 | 发音相同,后端 `_t` 请求映射到 `_s` 文件 |
| 流 | 纯 MP3 HTTP | 不做 HLS,简单直接;`<audio>` 原生 Range 支持拖动 |
| 英文 | 自动检测切模型 | 中夹英用 ZH 模型(自带 mix-en);纯英文切 EN 模型 |
| 存储 | Cloudflare R2 | $0 至 10GB + 零出站,比 DO Spaces 省 $60/年 |

## 关于音质和"情感表达"

**诚实告知**:MeloTTS 是 VITS 架构,输出平和、清晰、朗读式。
**不会**根据内容调整语气:讲见证和解释神学听起来一样温和平稳。

**这是坏事吗?** 对基督教季刊文章未必:

- 多数文章(默想、教义、诗歌)偏冥想式,过度戏剧化反而出戏
- 听众关心的是清晰温和可理解的声音,不是表演

**如果之后想要有情感的朗读:** 可选升级路径(听完 MeloTTS 批次觉得不够再说):

| 模型 | 情感 | M1 速度 | 稳定 |
|---|---|---|---|
| **CosyVoice 2** | 支持 `[happy]` `[sad]` 标签 | 0.5-1x | ✅ |
| **Qwen3-TTS (MLX)** | 最自然,无标签需求 | 0.3x | ✅ |
| **ChatTTS** | 自然停顿/语气 | 2x | ❌ 随机 |

只要换 `synth.py` 里 `_synth_chunk()` 的实现,前端完全不用改。

## 目录结构

```
tts/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── config.py            # 所有参数(从 .env 读)
├── db.py                # MongoDB 读取
├── textproc.py          # content[] → 可朗读文本 + 语言检测
├── synth.py             # MeloTTS 包装(ZH / EN 双模型)
├── scripts/
│   ├── smoke_test.py    # 不连 Mongo 的冒烟测试
│   ├── generate_one.py  # 生成单篇(听感验证用)
│   ├── batch.py         # 批量 + 断点续传
│   ├── check.py         # 进度查看
│   └── serve.py         # 本地静态 HTTP(前端接入用)
└── output/
    ├── state.json       # 进度清单
    └── volume_XX/
        └── {slug}_s.mp3 # 按简体 slug 命名,繁体请求共享此文件
```

## 使用步骤

### 1. 安装(一次性)

```bash
# ffmpeg 是写 MP3 必需的
brew install ffmpeg

cd tts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# MeloTTS 单独从 GitHub 装
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download

cp .env.example .env
# 编辑 .env 填入 MONGO_URI (和 server/.env 一样)
```

### 2. 冒烟测试(不连 Mongo)

```bash
python -m scripts.smoke_test
# 首次会下载 MeloTTS ZH 模型(~500MB)
afplay output/_smoke_test.mp3
```

**听这个决定你是否接受 MeloTTS 的音质。** 不接受再换。

### 3. 跑一篇真实文章

```bash
python db.py     # 先确认 Mongo 连得上

# 某篇文章
python -m scripts.generate_one --volume 85 --slug 0_prayer_s
afplay output/volume_85/0_prayer_s.mp3

# 试不同语速
python -m scripts.generate_one --volume 85 --slug 0_prayer_s --speed 0.85
python -m scripts.generate_one --volume 85 --slug 0_prayer_s --speed 1.0

# 强制语言(默认 auto)
python -m scripts.generate_one --volume 85 --slug 0_prayer_s --lang zh
```

### 4. 批量

```bash
# 先单期试水(一期 10 来篇,半小时)
python -m scripts.batch --volume 85

# 全量(简体):跑一晚上 + 半天
python -m scripts.batch --all

# 查进度(另一个终端)
python -m scripts.check

# 失败重试
python -m scripts.check --failed
python -m scripts.batch --retry-failed
```

### 5. 本地服务(前端接入)

```bash
python -m scripts.serve      # 默认 :8090
# http://localhost:8090/volume_85/0_prayer_s.mp3
```

后端 `server/src/resolvers.ts` 里 `audioEpisodes` resolver 改成:

```ts
audioEpisodes: async (_, { volume }) => {
  const articles = await col<ArticleDoc>('Articles')
    .find({ volume: String(volume), id: { $regex: /_s$/ } })
    .toArray();

  return articles.map(a => ({
    id: `${a.volume}:${a.id}`,
    title: a.title || '',
    author: a.author || null,
    volume: Number(a.volume),
    durationSeconds: 0,
    coverImage: null,
    streamUrl: `http://localhost:8090/volume_${a.volume}/${a.id}.mp3`,
    streamExpiresAt: null,
  }));
}
```

**简繁共享** — 当前端用 `_t` 查单篇音频时(比如 `audioEpisode(id: "85:0_prayer_t")`),
后端把 `_t` → `_s` 再返 URL,就用同一个文件:

```ts
audioEpisode: async (_, { id }) => {
  const [vol, slug] = id.split(':');
  const canonicalSlug = slug.replace(/_t$/, '_s');   // 繁体也指向简体音频
  const article = await col<ArticleDoc>('Articles').findOne({
    volume: vol, id: canonicalSlug,
  });
  if (!article) return null;
  return {
    id, title: article.title, author: article.author,
    volume: Number(vol), durationSeconds: 0, coverImage: null,
    streamUrl: `http://localhost:8090/volume_${vol}/${canonicalSlug}.mp3`,
    streamExpiresAt: null,
  };
}
```

## 以后(上云)

验证音质满意后:

```bash
# 方案 1 — rclone 同步到 R2
rclone sync output/ r2:xishuipang-audio/ --progress

# 方案 2 — AWS CLI (R2 兼容 S3)
aws s3 sync output/ s3://xishuipang-audio/ \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# 然后 streamUrl 改成:
# https://pub-XXX.r2.dev/volume_85/0_prayer_s.mp3
```

R2 免费档:10GB 存储 + 零出站费。你的 ~2-3GB 音频跑在免费档里。

## 硬件/耗时估算

M1 Pro 16GB:
- 内存占用:~2-3 GB(ZH 模型)/ 加载 EN 再多 2 GB
- CPU:单核满载
- 速度:~5x 实时(10 分钟文章 2 分钟合成)
- 1000 篇(每篇平均 10 分钟) ≈ **30-40 小时** → 两晚跑完

想加速:改 `WORKERS=2`(16GB 会吃紧,32GB 最佳)。

## 参数调优(.env)

```ini
SPEAKER_ID=ZH            # 当前 MeloTTS ZH 模型只有 ZH 一个说话人
SPEED=0.9                # 0.8 很慢 / 1.0 标准 / 1.1 偏快
BITRATE=32k              # 32k/48k/64k/96k
OUTPUT_SAMPLE_RATE=22050 # 配 32k 用 22050,64k+ 改 44100
EN_THRESHOLD=0.7         # 英文字符占比 > 此值就用 EN 模型
PARAGRAPH_PAUSE_MS=600   # 段落间停顿(毫秒)
MAX_CHARS_PER_CHUNK=300  # 长段切小块合成再拼接
```
