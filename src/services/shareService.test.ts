import { describe, expect, it } from 'vitest';
import type { Project } from '../core/types';
import {
  decodeProjectFromHash,
  encodeProjectToHash,
  getHashByteLength,
  isShareHashOversized,
  SHARE_HASH_PREFIX,
  SHARE_HASH_WARNING_BYTES,
} from './shareService';

const project: Project = {
  id: 'shared-project',
  title: 'A shared verse 🎵',
  rhymeGroups: [
    { id: 'group-a', color: '#ff6b6b', label: 'A', name: 'fire' },
    { id: 'group-b', color: '#6bdfff', label: 'B' },
  ],
  lines: [
    {
      rawText: 'Fire climbs higher',
      words: [
        { text: 'Fire', lineIndex: 0, wordIndex: 0, rhymeGroupId: 'group-a', startMs: 100 },
        { text: 'climbs', lineIndex: 0, wordIndex: 1 },
        {
          text: 'higher',
          lineIndex: 0,
          wordIndex: 2,
          syllables: [
            { text: 'high', rhymeGroupId: 'group-b' },
            { text: 'er', rhymeGroupId: 'group-a' },
          ],
          startMs: 850,
          endMs: 1300,
        },
      ],
    },
  ],
};

describe('project URL sharing', () => {
  it('round-trips a project through compressed base64url', async () => {
    const hash = await encodeProjectToHash(project);

    expect(hash.startsWith(SHARE_HASH_PREFIX)).toBe(true);
    expect(hash.slice(SHARE_HASH_PREFIX.length)).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeProjectFromHash(hash)).toEqual(project);
  });

  it.each([
    '',
    '#something-else',
    SHARE_HASH_PREFIX,
    `${SHARE_HASH_PREFIX}not_valid!`,
    `${SHARE_HASH_PREFIX}bm90IGd6aXA`,
  ])('rejects an absent or malformed project hash', async hash => {
    expect(await decodeProjectFromHash(hash)).toBeNull();
  });

  it('warns only when a hash exceeds 8 KiB', () => {
    const atLimit = `#${'a'.repeat(SHARE_HASH_WARNING_BYTES - 1)}`;
    const overLimit = `${atLimit}a`;

    expect(getHashByteLength(atLimit)).toBe(SHARE_HASH_WARNING_BYTES);
    expect(isShareHashOversized(atLimit)).toBe(false);
    expect(isShareHashOversized(overLimit)).toBe(true);
  });
});

