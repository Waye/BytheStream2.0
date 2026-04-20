"""
生成单篇文章的音频 — 用来第一次听感验证 / 调参。

用法：
    python -m scripts.generate_one --volume 85 --slug 0_prayer_s
    python -m scripts.generate_one --volume 85 --slug 0_prayer_s --speed 0.9
    python -m scripts.generate_one --volume 85 --slug 0_prayer_s --format wav
"""
import argparse
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR, ensure_dirs
from db import get_one
from textproc import content_to_chunks, estimate_duration_seconds, detect_language
from synth import synth_article


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--volume", type=int, required=True)
    ap.add_argument("--slug", required=True, help="文章 id，例如 0_prayer_s")
    ap.add_argument("--format", choices=["mp3", "wav"], default="mp3")
    ap.add_argument(
        "--speed", type=float, default=None,
        help="覆盖 .env 里的 SPEED（例如 0.9 慢一点 / 1.1 快一点）",
    )
    ap.add_argument(
        "--lang", choices=["auto", "zh", "en"], default="auto",
        help="语言：auto 自动检测 / zh 强制中文 / en 强制英文",
    )
    args = ap.parse_args()

    # 允许 CLI 覆盖 speed
    if args.speed is not None:
        import config
        config.SPEED = args.speed

    ensure_dirs()

    article = get_one(args.volume, args.slug)
    if not article:
        print(f"✗ 找不到文章: volume={args.volume}, slug={args.slug}")
        print("  提示：检查 slug 是否正确（简体用 _s 结尾，繁体 _t）")
        sys.exit(1)

    print(f"标题:   {article.get('title', '(无)')}")
    print(f"作者:   {article.get('author', '(无)')}")
    print(f"类别:   {article.get('category', '(无)')}")
    content = article.get("content") or []
    print(f"段落:   {len(content)} 行")

    # 语言检测
    if args.lang == "auto":
        lang = detect_language(content).upper()
    else:
        lang = args.lang.upper()
    print(f"语言:   {lang} ({'自动' if args.lang == 'auto' else '手动'})")

    chunks = content_to_chunks(content)
    print(f"Chunks: {len(chunks)}（切段后）")
    print(f"估算时长: {estimate_duration_seconds(content):.1f}s")
    print()

    out = OUTPUT_DIR / f"volume_{args.volume}" / f"{args.slug}.{args.format}"

    t0 = time.time()
    print(f"开始合成 → {out}")
    info = synth_article(chunks, out, lang=lang, fmt=args.format)
    elapsed = time.time() - t0

    duration = info["duration_seconds"]
    size_mb = info["file_size"] / 1024 / 1024
    rtf = elapsed / duration if duration > 0 else 0

    print()
    print(f"✓ 完成")
    print(f"  输出:   {out}")
    print(f"  时长:   {duration:.1f}s ({duration/60:.1f} 分钟)")
    print(f"  大小:   {size_mb:.2f} MB")
    print(f"  耗时:   {elapsed:.1f}s")
    print(f"  RTF:    {rtf:.2f}x（小于 1 = 快于实时）")
    print()
    print(f"试听：")
    print(f"  open {out}")
    print(f"  afplay {out}")


if __name__ == "__main__":
    main()
