import type { Word } from '../core/types';

/**
 * Given a flat list of all words and recorded start timestamps,
 * fills in endMs for each word based on the next word's startMs.
 */
export function computeEndTimestamps(allWords: Word[]): void {
  const timestamped = allWords.filter(w => w.startMs !== undefined);
  timestamped.sort((a, b) => a.startMs! - b.startMs!);

  for (let i = 0; i < timestamped.length - 1; i++) {
    timestamped[i].endMs = timestamped[i + 1].startMs;
  }

  if (timestamped.length > 0) {
    const last = timestamped[timestamped.length - 1];
    last.endMs = last.startMs! + 500;
  }
}

/**
 * Clear all timestamps from words
 */
export function clearTimestamps(allWords: Word[]): void {
  for (const word of allWords) {
    word.startMs = undefined;
    word.endMs = undefined;
  }
}
