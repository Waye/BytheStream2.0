"""
离线冒烟测试：不依赖 MongoDB，直接用内置示例文本验证 MeloTTS 装好了。

装完依赖后第一件事就跑这个，确认能出声：
    python -m scripts.smoke_test

输出到 output/_smoke_test.mp3，试听：
    afplay output/_smoke_test.mp3
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR, ensure_dirs
from textproc import content_to_chunks
from synth import synth_article


SAMPLE = [
    "    在喧嚣的时代,安静成了一种稀缺的能力。我们习惯了被信息填满每一刻空隙,却在最需要聆听内心声音的时候,发现自己早已失去了那种能力。",
    "",
    "    大卫在诗篇中说:「我的心哪,你当默默无声,专等候神,因为我的盼望是从祂而来。」默默无声,不是消极的沉默,而是一种主动的等候。",
    "",
    "    愿神祝福你。Amen.",
]


def main():
    ensure_dirs()
    out = OUTPUT_DIR / "_smoke_test.mp3"

    chunks = content_to_chunks(SAMPLE)
    print(f"Chunks: {len(chunks)}")
    for i, c in enumerate(chunks):
        tag = "[段]" if c.is_paragraph_break else "   "
        print(f"  {i:02d} {tag} {c.text[:50]}")

    print(f"\n开始合成 → {out}")
    t0 = time.time()
    info = synth_article(chunks, out)
    elapsed = time.time() - t0

    print(f"\n✓ 完成")
    print(f"  时长:  {info['duration_seconds']:.1f}s")
    print(f"  大小:  {info['file_size'] / 1024:.1f} KB")
    print(f"  耗时:  {elapsed:.1f}s (RTF {elapsed/info['duration_seconds']:.2f}x)")
    print(f"\n试听：afplay {out}")


if __name__ == "__main__":
    main()
