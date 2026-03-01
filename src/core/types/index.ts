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

export const RHYME_COLORS = [
  '#ff6b6b', '#ffa06b', '#ffd93d', '#6bffb8',
  '#6bdfff', '#6b8bff', '#b06bff', '#ff6bb0',
  '#c4ff6b', '#6bffd9', '#8b6bff', '#ff8a6b',
] as const;

export type EditorMode = 'view' | 'tag' | 'sync';
