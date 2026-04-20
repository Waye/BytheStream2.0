"""
TTS 批处理统一配置。从 .env 加载。
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# 加载 .env（在 tts/ 目录下）
ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

# ─── MongoDB ───
MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB = os.getenv("MONGO_DB", "Xishuipang")

# ─── 输出 ───
OUTPUT_DIR = ROOT / os.getenv("OUTPUT_DIR", "output")
STATE_FILE = OUTPUT_DIR / "state.json"

# ─── MeloTTS ───
SPEAKER_ID = os.getenv("SPEAKER_ID", "ZH")
SPEED = float(os.getenv("SPEED", "0.9"))     # 朗读式文章,稍慢更沉静

# ─── 音频编码 ───
# 32 kbps MP3 对语音是低码率。为补偿音质,输出降到 22.05 kHz 单声道。
# (44.1 kHz + 32 kbps = 每采样 bit 太少,高频会"呼噜"。降采样后清晰度更好)
BITRATE = os.getenv("BITRATE", "32k")
OUTPUT_SAMPLE_RATE = int(os.getenv("OUTPUT_SAMPLE_RATE", "22050"))

# ─── 批量 ───
WORKERS = int(os.getenv("WORKERS", "1"))
# 简繁共用音频:只处理 _s 结尾的简体,后端解析 _t 时指向同一个文件
CHARACTER = os.getenv("CHARACTER", "simplified")

# 自动语言检测阈值:英文字符占比 > 此值 → 用 MeloTTS EN 模型
# 低于此值 → 用 ZH 模型 (ZH 模型自带 mix-en,中文夹英文词处理得好)
EN_THRESHOLD = float(os.getenv("EN_THRESHOLD", "0.7"))

# ─── 文本处理 ───
# content[] 里图片标记的正则，跟后端保持一致
IMG_PATTERN = r"^<[^>]+\.(jpg|jpeg|png|gif)(,.*)?>$"

# 段落间额外停顿（毫秒）— MeloTTS 自带的标点停顿可能不够
PARAGRAPH_PAUSE_MS = 600

# 一次朗读的最大字符数 — 太长 MeloTTS 会爆显存，切段处理再拼接
MAX_CHARS_PER_CHUNK = 300


def ensure_dirs():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


if __name__ == "__main__":
    # 验证配置
    print("=" * 50)
    print("TTS Config")
    print("=" * 50)
    print(f"MONGO_DB:   {MONGO_DB}")
    print(f"OUTPUT_DIR: {OUTPUT_DIR}")
    print(f"SPEAKER_ID: {SPEAKER_ID}")
    print(f"SPEED:      {SPEED}")
    print(f"BITRATE:    {BITRATE}")
    print(f"CHARACTER:  {CHARACTER}")
    print(f"WORKERS:    {WORKERS}")
    print(f"MONGO set:  {'yes' if MONGO_URI else 'NO — fill .env'}")
