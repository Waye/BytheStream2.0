"""
查看批量处理进度 + 磁盘占用 + 失败清单。

用法：
    python -m scripts.check                 # 总览
    python -m scripts.check --failed        # 只看失败
    python -m scripts.check --volume 85     # 某期进度
"""
import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR, STATE_FILE
from db import count_articles, iter_articles


def human_size(n: int) -> str:
    for u in ["B", "KB", "MB", "GB"]:
        if n < 1024:
            return f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} TB"


def human_duration(sec: float) -> str:
    h = int(sec // 3600)
    m = int((sec % 3600) // 60)
    s = int(sec % 60)
    if h:
        return f"{h}h {m}m"
    if m:
        return f"{m}m {s}s"
    return f"{s}s"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--failed", action="store_true", help="只列失败")
    ap.add_argument("--volume", type=int, default=None, help="某期进度")
    args = ap.parse_args()

    if not STATE_FILE.exists():
        print("还没开始跑批量（state.json 不存在）")
        print(f"  运行: python -m scripts.batch --volume 85")
        return

    state = json.loads(STATE_FILE.read_text())
    done = state.get("done", {})
    failed = state.get("failed", {})

    if args.failed:
        if not failed:
            print("✓ 没有失败记录")
            return
        print(f"失败 {len(failed)} 篇:\n")
        for key, info in failed.items():
            print(f"  {key}")
            print(f"    标题: {info.get('title', '')}")
            print(f"    错误: {info.get('error', '')}")
            print()
        return

    # 总览
    by_volume: dict[int, list[dict]] = defaultdict(list)
    total_duration = 0.0
    total_size = 0
    for key, info in done.items():
        vol_str, _ = key.split(":", 1)
        vol = int(vol_str)
        if args.volume and vol != args.volume:
            continue
        by_volume[vol].append(info)
        total_duration += info.get("duration_seconds", 0)
        total_size += info.get("file_size", 0)

    if args.volume:
        # 对比 DB 里该期应有数量
        expected = sum(1 for _ in iter_articles(volume=args.volume))
        got = len(by_volume.get(args.volume, []))
        pct = 100 * got / expected if expected else 0
        print(f"第 {args.volume} 期：{got} / {expected} ({pct:.0f}%)")
        print(f"  时长: {human_duration(total_duration)}")
        print(f"  大小: {human_size(total_size)}")
        print()
        for info in by_volume.get(args.volume, []):
            title = info.get("title", "")[:30]
            dur = human_duration(info.get("duration_seconds", 0))
            sz = human_size(info.get("file_size", 0))
            print(f"  ✓ {title:<32} {dur:<10} {sz}")
        return

    # 全局总览
    total_articles = count_articles()  # 只算当前 CHARACTER 设置的
    pct = 100 * len(done) / total_articles if total_articles else 0

    print("=" * 50)
    print("批量处理进度")
    print("=" * 50)
    print(f"已完成：   {len(done)} / {total_articles} ({pct:.1f}%)")
    print(f"失败：     {len(failed)}")
    print(f"总时长：   {human_duration(total_duration)} 的音频")
    print(f"磁盘占用： {human_size(total_size)}")
    print()

    if by_volume:
        print("按期统计（top 10 近期）:")
        # 按期号倒序
        for vol in sorted(by_volume.keys(), reverse=True)[:10]:
            items = by_volume[vol]
            d = sum(x.get("duration_seconds", 0) for x in items)
            s = sum(x.get("file_size", 0) for x in items)
            print(f"  第 {vol} 期: {len(items):3d} 篇  {human_duration(d):>10}  {human_size(s):>10}")
        print()

    # 估算剩余时间 — 按已完成音频的 RTF 估（如果 completed_at 都有）
    completed_times = [v.get("completed_at", 0) for v in done.values() if v.get("completed_at")]
    if len(completed_times) >= 10:
        first = min(completed_times)
        last = max(completed_times)
        span = max(last - first, 1)
        rate = len(completed_times) / span  # 篇/秒
        remain = total_articles - len(done)
        eta_sec = remain / rate if rate > 0 else 0
        print(f"平均速度： {rate * 3600:.1f} 篇/小时")
        if remain > 0:
            print(f"预计剩余： {human_duration(eta_sec)} （还需 {remain} 篇）")

    if failed:
        print(f"\n⚠ 有 {len(failed)} 篇失败 — 用 `python -m scripts.check --failed` 查看")
        print(f"  用 `python -m scripts.batch --retry-failed` 重试")


if __name__ == "__main__":
    main()
