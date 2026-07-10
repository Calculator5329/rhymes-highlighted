export interface SyllableSegment {
  text: string;
  rhymeGroupId?: string;
}

export interface Word {
  text: string;
  lineIndex: number;
  wordIndex: number;
  rhymeGroupId?: string;
  /** When set, the word renders as multiple colored segments instead of one block. */
  syllables?: SyllableSegment[];
  startMs?: number;
  endMs?: number;
}

export interface Line {
  words: Word[];
  rawText: string;
}

export interface RhymeGroup {
  id: string;
  color: string;
  /** Short label shown in the sidebar (e.g. "A", "hook", "-ight") */
  label?: string;
  /** User-editable display name; falls back to label then id */
  name?: string;
}

export interface Project {
  id: string;
  title: string;
  lines: Line[];
  rhymeGroups: RhymeGroup[];
  audioFile?: string;
}

export const RHYME_PALETTES = {
  neon: {
    name: 'Neon',
    colors: [
      '#ff6b6b', '#ffa06b', '#ffd93d', '#6bffb8',
      '#6bdfff', '#6b8bff', '#b06bff', '#ff6bb0',
      '#c4ff6b', '#6bffd9', '#8b6bff', '#ff8a6b',
    ],
  },
  sunset: {
    name: 'Sunset',
    colors: [
      '#ff595e', '#ff924c', '#ffca3a', '#c77dff',
      '#f15bb5', '#fee440', '#fb5607', '#ff006e',
      '#e76f51', '#f4a261', '#e9c46a', '#9d4edd',
    ],
  },
  ocean: {
    name: 'Ocean',
    colors: [
      '#48cae4', '#00b4d8', '#0096c7', '#90e0ef',
      '#52b788', '#74c69d', '#2ec4b6', '#5e60ce',
      '#64dfdf', '#5390d9', '#56cfe1', '#80ffdb',
    ],
  },
  pastel: {
    name: 'Pastel',
    colors: [
      '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf',
      '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff',
      '#f1c0e8', '#cfbaf0', '#a3c4f3', '#98f5e1',
    ],
  },
} as const;

export type RhymePaletteId = keyof typeof RHYME_PALETTES;
export const DEFAULT_RHYME_PALETTE: RhymePaletteId = 'neon';
/** Kept as the default palette for callers that do not select a theme. */
export const RHYME_COLORS = RHYME_PALETTES[DEFAULT_RHYME_PALETTE].colors;

export function isRhymePaletteId(value: unknown): value is RhymePaletteId {
  return typeof value === 'string' && value in RHYME_PALETTES;
}

export type EditorMode = 'view' | 'tag' | 'sync';
