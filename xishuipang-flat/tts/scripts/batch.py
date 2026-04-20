"""
批量处理主入口。特性：
- 断点续传（state.json）
- 逐篇处理，任何一篇失败不影响后续
- 实时显示进度条 + 预计剩余时间
- 输出结构：output/volume_85/0_prayer_s.mp3

用法：
    python -m scripts.batch --volume 85                 # 单期
    python -m scripts.batch --all                       # 全部
    python -m scripts.batch --all --character traditional
    python -m scripts.batch --volume 85 --limit 3       # 只跑前 3 篇（测试用）
"""
import argparse
import json
import sys
import time
import traceback
from pathlib import Path

from tqdm import tqdm

# 把 tts/ 加入 sys.path，允许 `python -m scripts.batch`
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR, STATE_FILE, CHARACTER, ensure_dirs
from db import iter_articles, count_articles
from textproc import content_to_chunks, detect_language
from synth import synth_article


def load_state() -> dict:
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {"done": {}, "failed": {}}


def save_state(state: dict):
    STATE_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2))


def key_for(article: dict) -> str:
    return f"{article['volume']}:{article['id']}"


def output_path_for(article: dict) -> Path:
    return OUTPUT_DIR / f"volume_{article['volume']}" / f"{article['id']}.mp3"


def process_article(article: dict, state: dict) -> bool:
    """处理单篇。返回是否成功。"""
    key = key_for(article)

    # 已完成 + 文件存在 → 跳过
    if key in state["done"]:
        out = output_path_for(article)
        if out.exists():
            return True
        # 记录在案但文件丢了，重跑
        del state["done"][key]

    try:
        content = article.get("content") or []
        if not content:
            raise ValueError("empty content")

        chunks = content_to_chunks(content)
        if not chunks:
            raise ValueError("no speakable chunks after textproc")

        # 自动挑模型:中文夹英文词用 ZH(自带 mix-en),纯英文文章用 EN
        lang = detect_language(content).upper()

        out = output_path_for(article)
        info = synth_article(chunks, out, lang=lang)

        state["done"][key] = {
            "title": article.get("title", ""),
            "path": str(out.relative_to(OUTPUT_DIR.parent)),
            "duration_seconds": round(info["duration_seconds"], 2),
            "file_size": info["file_size"],
            "language": info["language"],
            "completed_at": int(time.time()),
        }
        # 从失败表移除（如果之前失败过）
        state["failed"].pop(key, None)
        return True

    except Exception as e:
        state["failed"][key] = {
            "title": article.get("title", ""),
            "error": str(e),
            "traceback": traceback.format_exc(),
            "failed_at": int(time.time()),
        }
        return False


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--volume", type=int, default=None, help="只跑某一期")
    ap.add_argument("--all", action="store_true", help="跑所有期")
    ap.add_argument(
        "--character", choices=["simplified", "traditional", "both"],
        default=CHARACTER,
    )
    ap.add_argument("--limit", type=int, default=None, help="最多处理几篇（测试用）")
    ap.add_argument("--retry-failed", action="store_true", help="重试之前失败的")
    args = ap.parse_args()

    if not args.volume and not args.all and not args.retry_failed:
        ap.error("specify --volume N or --all or --retry-failed")

    ensure_dirs()
    state = load_state()

    # 统计总数
    total = count_articles(args.character) if args.all or args.volume else 0
    if args.volume:
        # 重新算（count_articles 不按 volume 过滤）
        total = sum(1 for _ in iter_articles(
            volume=args.volume, character=args.character
        ))
    if args.limit:
        total = min(total, args.limit)

    print(f"Character: {args.character}")
    print(f"Output:    {OUTPUT_DIR}")
    print(f"Already done: {len(state['done'])}")
    print(f"Planning to process: {total}")
    print()

    it = iter_articles(
        volume=args.volume,
        character=args.character,
        limit=args.limit,
    )

    succ = 0
    fail = 0
    skip = 0

    pbar = tqdm(it, total=total, unit="篇")
    for article in pbar:
        key = key_for(article)

        if key in state["done"] and output_path_for(article).exists():
            skip += 1
            pbar.set_postfix(ok=succ, fail=fail, skip=skip)
            continue

        ok = process_article(article, state)
        if ok:
            succ += 1
        else:
            fail += 1

        pbar.set_postfix(ok=succ, fail=fail, skip=skip)

        # 每 5 篇保存一次 state，掉电/Ctrl-C 损失不大
        if (succ + fail) % 5 == 0:
            save_state(state)

    save_state(state)
    print()
    print(f"✓ 成功: {succ}")
    print(f"✗ 失败: {fail}")
    print(f"⊘ 跳过: {skip}（之前已完成）")
    if fail:
        print(f"\n失败清单见 {STATE_FILE}（key: 'failed'）")
        print("可以跑 `python -m scripts.batch --retry-failed` 重试")


if __name__ == "__main__":
    main()
