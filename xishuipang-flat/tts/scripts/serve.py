"""
简单本地 HTTP 服务 — localhost 阶段用来让前端能播放生成的 MP3。

用法：
    python -m scripts.serve
    python -m scripts.serve --port 8090

服务起来后访问：
    http://localhost:8090/volume_85/0_prayer_s.mp3

前端 GraphQL 的 AudioEpisode.streamUrl 可以暂时返回：
    http://localhost:8090/volume_{N}/{slug}.mp3

以后换 Cloudflare R2 时，只改 streamUrl 生成逻辑，前端零改动。

特性：
- 开启了 CORS（允许 Expo Web / iOS 模拟器访问）
- 支持 HTTP Range 请求（拖动进度条、从中间加载都能用）
- 自动设置 Content-Type: audio/mpeg
"""
import argparse
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from config import OUTPUT_DIR


class AudioHandler(SimpleHTTPRequestHandler):
    # 让 SimpleHTTPRequestHandler 从 OUTPUT_DIR 取文件
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUTPUT_DIR), **kwargs)

    def end_headers(self):
        # CORS — 允许前端跨域请求音频
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Range")
        self.send_header("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        # Range 请求处理 — HTML5 <audio> 拖动进度条需要
        range_header = self.headers.get("Range")
        if range_header:
            self._serve_range(range_header)
        else:
            super().do_GET()

    def _serve_range(self, range_header: str):
        """解析 Range: bytes=START-END 并返回 206 Partial Content"""
        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            self.send_error(404)
            return

        size = os.path.getsize(path)

        # bytes=START-END
        try:
            units, ranges = range_header.split("=", 1)
            start_s, end_s = ranges.split("-", 1)
            start = int(start_s) if start_s else 0
            end = int(end_s) if end_s else size - 1
        except Exception:
            self.send_error(400, "Bad Range")
            return

        if start >= size or end >= size or start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return

        length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.end_headers()

        with open(path, "rb") as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (BrokenPipeError, ConnectionResetError):
                    return
                remaining -= len(chunk)

    def log_message(self, fmt, *args):
        # 安静点
        sys.stderr.write(f"[serve] {self.address_string()} - {fmt % args}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8090)
    ap.add_argument("--host", default="0.0.0.0")
    args = ap.parse_args()

    if not OUTPUT_DIR.exists():
        print(f"⚠ 输出目录不存在：{OUTPUT_DIR}")
        print(f"  先跑 `python -m scripts.generate_one` 生成点东西")
        sys.exit(1)

    print(f"Serving {OUTPUT_DIR}")
    print(f"  http://localhost:{args.port}/")
    print(f"例如：http://localhost:{args.port}/volume_85/0_prayer_s.mp3")
    print(f"\nCtrl-C 停止")

    srv = ThreadingHTTPServer((args.host, args.port), AudioHandler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nbye")


if __name__ == "__main__":
    main()
