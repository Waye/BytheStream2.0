"""
把 MongoDB Articles.content[] 转成 MeloTTS 可朗读的文本。

输入示例（和 server 端看到的一样）：
[
    "    在喧嚣的时代,安静成了一种稀缺的能力。",
    "",
    "    大卫在诗篇中说:「我的心哪...」",
    "<0_prayer_1.jpg>",
    "    ...",
]

规则：
1. 跳过图片标记 <xxx.jpg> / <xxx.png, author>
2. 段首全/半角空格去掉（是视觉缩进，不影响朗读）
3. 空字符串 "" = 段落分隔，加短暂停顿
4. 英文专名保持不动（MeloTTS 的 ZH-MIX-EN 模式能处理）
5. 长段落切分成 <= MAX_CHARS_PER_CHUNK 的小块，MeloTTS 长文本会 OOM
"""
import re
from dataclasses import dataclass

from config import IMG_PATTERN, MAX_CHARS_PER_CHUNK


IMG_RE = re.compile(IMG_PATTERN, re.IGNORECASE)

# 中文句末标点 — 切段时优先在这些位置断开
SENTENCE_END_CHARS = set("。！？!?…")
SOFT_BREAK_CHARS = set("，；：,;:")


@dataclass
class SpeechChunk:
    text: str
    is_paragraph_break: bool = False  # True 表示跟上一段之间加停顿


def is_image_line(line: str) -> bool:
    return bool(IMG_RE.match(line.strip()))


def clean_line(line: str) -> str:
    """去首部缩进（全角空格 / 多个半角空格）+ trim"""
    # 中文全角空格 \u3000
    return line.lstrip(" \t\u3000").rstrip()


def split_long_text(text: str, max_chars: int = MAX_CHARS_PER_CHUNK) -> list[str]:
    """
    长段切短 — 优先在句末切，其次在逗号分号，最后硬切。
    """
    if len(text) <= max_chars:
        return [text]

    chunks: list[str] = []
    buf = ""

    i = 0
    while i < len(text):
        ch = text[i]
        buf += ch

        # 已经到 max_chars — 找最近的句末/软切点
        if len(buf) >= max_chars:
            # 往前找句末
            cut = -1
            for j in range(len(buf) - 1, max(0, len(buf) - 80), -1):
                if buf[j] in SENTENCE_END_CHARS:
                    cut = j + 1
                    break
            if cut < 0:
                # 没句末？找软切
                for j in range(len(buf) - 1, max(0, len(buf) - 50), -1):
                    if buf[j] in SOFT_BREAK_CHARS:
                        cut = j + 1
                        break
            if cut < 0:
                cut = len(buf)  # 硬切

            chunks.append(buf[:cut].strip())
            buf = buf[cut:]

        i += 1

    if buf.strip():
        chunks.append(buf.strip())

    return [c for c in chunks if c]


def content_to_chunks(content: list[str]) -> list[SpeechChunk]:
    """
    核心转换。返回一个 chunks 列表，batch.py 会把它们逐段合成再拼起来。
    """
    chunks: list[SpeechChunk] = []
    pending_paragraph_break = False

    for raw in content:
        if raw is None:
            continue

        stripped = clean_line(raw)

        # 空行 = 段落分隔
        if not stripped:
            pending_paragraph_break = True
            continue

        # 图片行 = 跳过
        if is_image_line(stripped):
            continue

        # 可能还需要切
        for piece in split_long_text(stripped):
            chunks.append(
                SpeechChunk(text=piece, is_paragraph_break=pending_paragraph_break)
            )
            pending_paragraph_break = False  # 只给第一小段加停顿

    return chunks


def estimate_duration_seconds(content: list[str]) -> float:
    """粗略估算朗读时长（供进度显示用）"""
    text = "".join(clean_line(x) for x in content if x and not is_image_line(x))
    # 中文朗读速度约 4 字/秒
    return len(text) / 4.0


def detect_language(content: list[str]) -> str:
    """
    判断文章主要语言 → 'zh' 或 'en'
    逻辑：非图片行里，ASCII 英文字母 vs 中文字符的比例。
    超过 EN_THRESHOLD 阈值才判为 en，默认 zh（因为中文文章会混一些英文词）。
    """
    from config import EN_THRESHOLD

    en_chars = 0
    zh_chars = 0
    for raw in content:
        if not raw:
            continue
        line = clean_line(raw)
        if is_image_line(line):
            continue
        for ch in line:
            if 'a' <= ch.lower() <= 'z':
                en_chars += 1
            elif '\u4e00' <= ch <= '\u9fff':
                zh_chars += 1

    total = en_chars + zh_chars
    if total == 0:
        return "zh"
    en_ratio = en_chars / total
    return "en" if en_ratio > EN_THRESHOLD else "zh"


if __name__ == "__main__":
    # 测试
    sample = [
        "    在喧嚣的时代,安静成了一种稀缺的能力。",
        "",
        "    大卫在诗篇中说:「我的心哪,你当默默无声,专等候神。」",
        "<0_prayer_1.jpg>",
        "    安静不是逃避,而是面对。" * 20,  # 长段，会被切
    ]
    chunks = content_to_chunks(sample)
    for i, c in enumerate(chunks):
        prefix = "[段落] " if c.is_paragraph_break else "       "
        print(f"{i:02d} {prefix}{c.text[:40]}{'...' if len(c.text) > 40 else ''}")
    print(f"\n总块数: {len(chunks)}")
    print(f"估算时长: {estimate_duration_seconds(sample):.1f}s")
