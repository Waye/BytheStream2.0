"""生成欢迎语音频 → output/_welcome.mp3"""
import sys, time
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR, ensure_dirs
from textproc import content_to_chunks
from synth import synth_article

WELCOME_CONTENT = [
    "他要像一棵树栽在溪水旁,按时候结果子,叶子也不枯干,凡他所做的尽都顺利。",
    "",
    "——诗篇一篇三节",
    "",
    "他使我躺卧在青草地上,领我到幽静的溪水旁。",
    "",
    "——诗篇二十三篇二节",
    "",
    "你好,欢迎来到溪水旁。",
    "",
    "三十二年来,这本基督教中文季刊每一季度,把信徒的见证、默想和教义分享,带到读者的案头。现在,它也会朗读给你听。",
    "",
    "在通勤路上,厨房里,睡前的床头,祷告之后——一千多篇文章、八十余期精选,都能被聆听。",
    "",
    "我的心哪,你当默默无声,专等候神。",
    "",
    "感谢大家一直以来的支持。愿神祝福你。",
    "",
    "——溪水旁编辑部",
]

def main():
    ensure_dirs()
    chunks = content_to_chunks(WELCOME_CONTENT)
    print(f"Chunks: {len(chunks)}")
    for i, c in enumerate(chunks):
        tag = "[段]" if c.is_paragraph_break else "   "
        print(f"  {i:02d} {tag} {c.text}")

    out = OUTPUT_DIR / "_welcome.mp3"
    print(f"\nWriting {out}")
    t0 = time.time()
    info = synth_article(chunks, out, lang="ZH")
    elapsed = time.time() - t0
    print(f"\n✓ duration: {info['duration_seconds']:.1f}s")
    print(f"  size: {info['file_size']} bytes")
    print(f"  elapsed: {elapsed:.1f}s")
    print(f"\nafplay {out}")

if __name__ == "__main__":
    main()
