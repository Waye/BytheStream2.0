/**
 * TTS 音频桥接 — 读 tts/output/state.json,提供音频元数据和 URL 构造。
 *
 * 文件监听:state.json 变化时自动 reload,批量跑着也能实时看到新进度。
 *
 * 环境变量:
 *   AUDIO_BASE_URL    localhost 期用 http://localhost:8090
 *                     上 R2 后换 https://pub-XXX.r2.dev
 *   AUDIO_STATE_PATH  state.json 路径,默认 ../../tts/output/state.json
 */
import { readFileSync, watch } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM 里没有 __dirname — 从 import.meta.url 推出来
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface StateEntry {
  title: string;
  path: string;
  duration_seconds: number;
  file_size: number;
  language: string;
  completed_at: number;
}

interface TTSState {
  done: Record<string, StateEntry>;
  failed: Record<string, unknown>;
}

const AUDIO_BASE_URL = (
  process.env.AUDIO_BASE_URL || 'http://localhost:8090'
).replace(/\/$/, '');

const AUDIO_STATE_PATH = process.env.AUDIO_STATE_PATH
  || path.resolve(__dirname, '../../tts/output/state.json');

let cache: TTSState = { done: {}, failed: {} };
let reloadTimer: NodeJS.Timeout | null = null;

function loadState(): TTSState {
  try {
    const raw = readFileSync(AUDIO_STATE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { done: {}, failed: {} };
  }
}

export function initAudioState() {
  cache = loadState();
  console.log(
    `✓ Audio index loaded: ${Object.keys(cache.done).length} episodes from ${AUDIO_STATE_PATH}`
  );

  // 热重载(dev 友好) — 跑 batch 时新文章自动出现
  try {
    watch(AUDIO_STATE_PATH, () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        cache = loadState();
        console.log(`⟳ Audio index reloaded: ${Object.keys(cache.done).length} episodes`);
      }, 500);
    });
  } catch {
    // state.json 还不存在,跑 TTS 时会生成;忽略
  }
}

/** 繁体 slug → 简体 slug。简繁共用音频,canonical 是 _s。 */
function canonical(slug: string): string {
  return slug.replace(/_t$/, '_s');
}

export interface AudioMeta {
  id: string;              // 原始 id(保留 _t,给前端)
  streamUrl: string;       // 指向 _s 文件
  durationSeconds: number;
  language: string;
  canonicalSlug: string;   // _s 版(用来关联 Article)
  volume: number;
}

export function getAudioEpisode(volume: number, slug: string): AudioMeta | null {
  const canonicalSlug = canonical(slug);
  const key = `${volume}:${canonicalSlug}`;
  const entry = cache.done[key];
  if (!entry) return null;

  return {
    id: `${volume}:${slug}`,
    streamUrl: `${AUDIO_BASE_URL}/volume_${volume}/${canonicalSlug}.mp3`,
    durationSeconds: Math.round(entry.duration_seconds),
    language: entry.language,
    canonicalSlug,
    volume,
  };
}

/** 返回某一期所有已生成的音频(简体 canonical 版) */
export function listAudioEpisodesForVolume(volume: number): AudioMeta[] {
  const prefix = `${volume}:`;
  const result: AudioMeta[] = [];
  for (const [key, entry] of Object.entries(cache.done)) {
    if (!key.startsWith(prefix)) continue;
    const slug = key.slice(prefix.length);
    result.push({
      id: key,
      streamUrl: `${AUDIO_BASE_URL}/volume_${volume}/${slug}.mp3`,
      durationSeconds: Math.round(entry.duration_seconds),
      language: entry.language,
      canonicalSlug: slug,
      volume,
    });
  }
  return result;
}

export function audioStats() {
  const done = Object.values(cache.done);
  return {
    total: done.length,
    totalDurationSeconds: done.reduce((s, e) => s + e.duration_seconds, 0),
    totalBytes: done.reduce((s, e) => s + e.file_size, 0),
  };
}
