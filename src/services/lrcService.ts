import type { Line, Word } from '../core/types';

export interface LrcMetadata {
  title?: string;
  artist?: string;
}

export interface LrcParseResult {
  lines: Line[];
  metadata: LrcMetadata;
}

interface TimestampedLyric {
  text: string;
  startMs: number;
  order: number;
}

const METADATA_PATTERN = /^\[(ti|ar):([^\]]*)\]\s*$/i;
const TIMESTAMP_PATTERN = /\[(\d{1,}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

function fractionToMs(fraction = ''): number {
  if (!fraction) return 0;
  return Number(fraction.padEnd(3, '0'));
}

/** Parse standard line-synchronised LRC text into the application's line model. */
export function parseLrc(source: string): LrcParseResult {
  const metadata: LrcMetadata = {};
  const lyrics: TimestampedLyric[] = [];

  source.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((sourceLine, order) => {
    const line = sourceLine.trim();
    const metadataMatch = line.match(METADATA_PATTERN);
    if (metadataMatch) {
      const value = metadataMatch[2].trim();
      if (value) {
        if (metadataMatch[1].toLowerCase() === 'ti') metadata.title = value;
        if (metadataMatch[1].toLowerCase() === 'ar') metadata.artist = value;
      }
      return;
    }

    const timestamps: number[] = [];
    TIMESTAMP_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = TIMESTAMP_PATTERN.exec(line)) !== null) {
      const seconds = Number(match[2]);
      if (seconds >= 60) return;
      timestamps.push(Number(match[1]) * 60_000 + seconds * 1_000 + fractionToMs(match[3]));
    }

    if (timestamps.length === 0) return;
    const text = line.replace(TIMESTAMP_PATTERN, '').trim();
    if (!text || text.startsWith('[')) return;

    timestamps.forEach(startMs => lyrics.push({ text, startMs, order }));
  });

  lyrics.sort((a, b) => a.startMs - b.startMs || a.order - b.order);

  const lines = lyrics.map((lyric, lineIndex): Line => {
    const nextStartMs = lyrics[lineIndex + 1]?.startMs ?? lyric.startMs + 500;
    const words: Word[] = lyric.text.split(/\s+/).map((text, wordIndex) => ({
      text,
      lineIndex,
      wordIndex,
      startMs: lyric.startMs,
      endMs: nextStartMs,
    }));
    return { rawText: lyric.text, words };
  });

  return { lines, metadata };
}
