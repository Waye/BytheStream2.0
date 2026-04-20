"""
MeloTTS 包装 — 支持按语言加载不同模型(ZH / EN),单例缓存,批量合成。
"""
# 禁用 MPS —— MeloTTS 内部有 device 不一致问题,强制全部用 CPU
import os
os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '0'
import wave
from pathlib import Path
from typing import Optional

import numpy as np

from config import (
    SPEAKER_ID, SPEED, BITRATE, OUTPUT_SAMPLE_RATE, PARAGRAPH_PAUSE_MS,
)
from textproc import SpeechChunk


# 按语言缓存模型 — 第一次用才加载,避免占用不必要的内存
_models: dict[str, tuple] = {}   # lang -> (model, spk2id)


def _load_model(lang: str = "ZH"):
    """
    懒加载 — 首次调用才装模型,之后复用。
    lang: "ZH" (中文含中英混读) / "EN" (纯英文)
    """
    lang = lang.upper()
    if lang in _models:
        return _models[lang]

    from melo.api import TTS
    import torch

    device = "cpu"
    # M1 Pro 上 MPS 部分 op 会 fallback,实测 CPU 更稳。
    # 想试:if torch.backends.mps.is_available(): device = "mps"

    print(f"Loading MeloTTS language={lang} device={device}...")
    model = TTS(language=lang, device=device)
    spk2id = model.hps.data.spk2id
    print(f"✓ Loaded {lang}. Speakers: {list(spk2id.keys())}")
    _models[lang] = (model, spk2id)
    return model, spk2id


def _pick_speaker(spk2id, lang: str) -> int:
    """从 spk2id 里选一个合适的 speaker id。MeloTTS 的 spk2id 是 HParams,不是 dict。"""
    # HParams 可以用 dict(...) 转成普通字典
    d = dict(spk2id) if not isinstance(spk2id, dict) else spk2id
    if lang == "ZH":
        return d.get("ZH", next(iter(d.values())))
    for preferred in ["EN-US", "EN-Default", "EN-BR"]:
        if preferred in d:
            return d[preferred]
    return next(iter(d.values()))


def _synth_chunk(text: str, lang: str) -> np.ndarray:
    """单块文本 → 音频 numpy 数组 (float32)"""
    model, spk2id = _load_model(lang)
    spk_id = _pick_speaker(spk2id, lang.upper())

    audio = model.tts_to_file(
        text=text,
        speaker_id=spk_id,
        output_path=None,
        speed=SPEED,
        quiet=True,
    )
    if hasattr(audio, "cpu"):
        audio = audio.cpu().numpy()
    return np.asarray(audio, dtype=np.float32)


def _silence(duration_ms: int, sample_rate: int) -> np.ndarray:
    n = int(sample_rate * duration_ms / 1000)
    return np.zeros(n, dtype=np.float32)


def synth_article(
    chunks: list[SpeechChunk],
    out_path: Path,
    *,
    lang: str = "ZH",
    fmt: str = "mp3",
) -> dict:
    """
    合成整篇文章。拼接所有 chunks,段落间插停顿,写 mp3(默认)或 wav。
    lang: "ZH" 或 "EN" — 自动选对应的 MeloTTS 模型。
    返回: {duration_seconds, file_size, language}
    """
    model, _ = _load_model(lang)
    sr_model = model.hps.data.sampling_rate   # MeloTTS 原生采样率(通常 44.1k)

    pieces: list[np.ndarray] = []
    for i, c in enumerate(chunks):
        if i > 0 and c.is_paragraph_break:
            pieces.append(_silence(PARAGRAPH_PAUSE_MS, sr_model))
        elif i > 0:
            pieces.append(_silence(200, sr_model))

        audio = _synth_chunk(c.text, lang)
        pieces.append(audio)

    full = np.concatenate(pieces) if pieces else np.zeros(1, dtype=np.float32)

    # 归一化防削峰
    peak = float(np.abs(full).max()) or 1.0
    if peak > 1.0:
        full = full / peak

    out_path.parent.mkdir(parents=True, exist_ok=True)

    if fmt == "wav":
        _write_wav(full, sr_model, out_path)
    else:
        _write_mp3(full, sr_model, out_path)

    duration = len(full) / sr_model
    return {
        "duration_seconds": duration,
        "file_size": out_path.stat().st_size,
        "language": lang,
    }


def _write_wav(audio: np.ndarray, sr: int, path: Path):
    pcm = (audio * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def _write_mp3(audio: np.ndarray, sr_in: int, path: Path):
    """
    写 MP3 via ffmpeg:
    - 输入 : 原生采样率(MeloTTS 输出,通常 44.1k)的 s16 PCM
    - 输出 : 降采样到 OUTPUT_SAMPLE_RATE(默认 22.05k),单声道,CBR BITRATE(默认 32k)

    为什么降采样:32kbps MP3 在 44.1kHz 下每样本 bit 太少,高频失真明显;
                降到 22.05kHz 后每样本 bit 翻倍,语音清晰度反而更好。
    """
    import subprocess

    pcm = (audio * 32767).astype(np.int16).tobytes()

    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        # 输入
        "-f", "s16le", "-ar", str(sr_in), "-ac", "1", "-i", "-",
        # 输出 — 降采样 + 压 MP3
        "-ar", str(OUTPUT_SAMPLE_RATE),
        "-ac", "1",
        "-codec:a", "libmp3lame",
        "-b:a", BITRATE,
        str(path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    _, err = proc.communicate(pcm)
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {err.decode('utf-8', errors='ignore')}")


if __name__ == "__main__":
    # 冒烟
    from textproc import content_to_chunks
    sample = ["    你好,这是一个测试。", "", "    愿神祝福你。"]
    chunks = content_to_chunks(sample)
    out = Path(__file__).parent / "output" / "_smoke_test.mp3"
    info = synth_article(chunks, out, lang="ZH")
    print(f"✓ Wrote {out}")
    print(f"  duration: {info['duration_seconds']:.2f}s")
    print(f"  size:     {info['file_size']} bytes")
