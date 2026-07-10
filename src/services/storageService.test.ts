import { describe, expect, it } from 'vitest';
import type { Project } from '../core/types';
import {
  loadPalette,
  parseSerializedProject,
  PROJECT_SERIALIZATION_VERSION,
  savePalette,
  serializeProject,
} from './storageService';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const project: Project = {
  id: 'project-1',
  title: 'Internal rhymes',
  audioFile: 'blob:audio-reference',
  rhymeGroups: [
    { id: 'group-a', color: '#ff6b6b', label: 'A', name: 'day' },
    { id: 'group-b', color: '#6bdfff', label: 'B' },
  ],
  lines: [
    {
      rawText: 'Bright light',
      words: [
        {
          text: 'Bright',
          lineIndex: 0,
          wordIndex: 0,
          rhymeGroupId: 'group-a',
          startMs: 125,
          endMs: 480,
        },
        {
          text: 'light',
          lineIndex: 0,
          wordIndex: 1,
          syllables: [
            { text: 'li', rhymeGroupId: 'group-b' },
            { text: 'ght' },
          ],
          startMs: 480,
          endMs: 900,
        },
      ],
    },
  ],
};

describe('project serialization', () => {
  it('round-trips lyrics, timing, rhyme assignments, and colors', () => {
    const serialized = serializeProject(project);

    expect(JSON.parse(serialized)).toMatchObject({
      version: PROJECT_SERIALIZATION_VERSION,
      project: { id: project.id },
    });
    expect(parseSerializedProject(serialized)).toEqual(project);
  });

  it('accepts a valid legacy unversioned project', () => {
    expect(parseSerializedProject(JSON.stringify(project))).toEqual(project);
  });

  it.each([
    'not json',
    '{}',
    JSON.stringify({ version: 99, project }),
    JSON.stringify({ version: PROJECT_SERIALIZATION_VERSION, project: { id: 'missing-fields' } }),
    JSON.stringify({ ...project, lines: [{ rawText: 'bad', words: [{ text: 'bad' }] }] }),
  ])('returns null for malformed or unsupported data', serialized => {
    expect(parseSerializedProject(serialized)).toBeNull();
  });
});

describe('palette persistence', () => {
  it('saves and restores a selected palette', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    });

    expect(loadPalette()).toBe('neon');
    expect(savePalette('ocean')).toBe(true);
    expect(loadPalette()).toBe('ocean');
  });

  it('falls back to the default for an unknown stored palette', () => {
    const storage = new MemoryStorage();
    storage.setItem('rhymes-highlighted-palette', 'unknown');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    });

    expect(loadPalette()).toBe('neon');
  });
});
