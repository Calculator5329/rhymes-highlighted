import { makeAutoObservable, runInAction } from 'mobx';
import type { Line, Word, RhymeGroup, Project } from '../core/types';
import { RHYME_COLORS } from '../core/types';

function parseLyrics(text: string): Line[] {
  return text.split('\n').map((rawText, lineIndex) => {
    const words: Word[] = rawText
      .split(/\s+/)
      .filter(Boolean)
      .map((text, wordIndex) => ({ text, lineIndex, wordIndex }));
    return { words, rawText };
  });
}

let groupCounter = 0;

export class ProjectStore {
  project: Project = {
    id: crypto.randomUUID(),
    title: 'Untitled',
    lines: [],
    rhymeGroups: [],
  };

  rawLyrics = '';

  private undoStack: string[] = [];
  private redoStack: string[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  setTitle(title: string) {
    this.project.title = title;
  }

  setRawLyrics(text: string) {
    this.rawLyrics = text;
  }

  parseLyrics() {
    this.pushUndo();
    this.project.lines = parseLyrics(this.rawLyrics);
    this.project.rhymeGroups = [];
  }

  assignWordToGroup(lineIndex: number, wordIndex: number, groupId: string) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    if (word) {
      word.rhymeGroupId = groupId;
    }
  }

  removeWordFromGroup(lineIndex: number, wordIndex: number) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    if (word) {
      word.rhymeGroupId = undefined;
      word.syllables = undefined;
    }
  }

  createRhymeGroup(label?: string): RhymeGroup {
    this.pushUndo();
    const group: RhymeGroup = {
      id: `group-${++groupCounter}`,
      color: RHYME_COLORS[this.project.rhymeGroups.length % RHYME_COLORS.length],
      label,
    };
    this.project.rhymeGroups.push(group);
    return group;
  }

  deleteRhymeGroup(groupId: string) {
    this.pushUndo();
    this.project.rhymeGroups = this.project.rhymeGroups.filter(g => g.id !== groupId);
    for (const line of this.project.lines) {
      for (const word of line.words) {
        if (word.rhymeGroupId === groupId) {
          word.rhymeGroupId = undefined;
        }
        if (word.syllables) {
          for (const seg of word.syllables) {
            if (seg.rhymeGroupId === groupId) {
              seg.rhymeGroupId = undefined;
            }
          }
          if (word.syllables.every(s => !s.rhymeGroupId)) {
            word.syllables = undefined;
          }
        }
      }
    }
  }

  mergeRhymeGroups(sourceId: string, targetId: string) {
    this.pushUndo();
    for (const line of this.project.lines) {
      for (const word of line.words) {
        if (word.rhymeGroupId === sourceId) {
          word.rhymeGroupId = targetId;
        }
        if (word.syllables) {
          for (const seg of word.syllables) {
            if (seg.rhymeGroupId === sourceId) {
              seg.rhymeGroupId = targetId;
            }
          }
        }
      }
    }
    this.project.rhymeGroups = this.project.rhymeGroups.filter(g => g.id !== sourceId);
  }

  updateGroupColor(groupId: string, color: string) {
    const group = this.project.rhymeGroups.find(g => g.id === groupId);
    if (group) group.color = color;
  }

  setGroupName(groupId: string, name: string) {
    const group = this.project.rhymeGroups.find(g => g.id === groupId);
    if (group) group.name = name || undefined;
  }

  // Syllable management
  splitWordIntoSyllables(lineIndex: number, wordIndex: number, segments: string[]) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    if (!word) return;
    word.syllables = segments.map(text => ({ text }));
    word.rhymeGroupId = undefined;
  }

  assignSyllableToGroup(lineIndex: number, wordIndex: number, syllableIndex: number, groupId: string) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    const seg = word?.syllables?.[syllableIndex];
    if (seg) {
      seg.rhymeGroupId = groupId;
    }
  }

  removeSyllableFromGroup(lineIndex: number, wordIndex: number, syllableIndex: number) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    const seg = word?.syllables?.[syllableIndex];
    if (seg) {
      seg.rhymeGroupId = undefined;
    }
  }

  clearSyllables(lineIndex: number, wordIndex: number) {
    this.pushUndo();
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    if (word) {
      word.syllables = undefined;
    }
  }

  setWordTimestamp(lineIndex: number, wordIndex: number, startMs: number, endMs?: number) {
    const word = this.project.lines[lineIndex]?.words[wordIndex];
    if (word) {
      word.startMs = startMs;
      if (endMs !== undefined) word.endMs = endMs;
    }
  }

  setAudioFile(url: string | undefined) {
    this.project.audioFile = url;
  }

  get allWords(): Word[] {
    return this.project.lines.flatMap(line => line.words);
  }

  /** Words that participate in any rhyme — either whole-word or via syllable segments. */
  get rhymingWords(): Word[] {
    return this.allWords.filter(w =>
      w.rhymeGroupId !== undefined ||
      (w.syllables?.some(s => s.rhymeGroupId !== undefined) ?? false)
    );
  }

  get groupMap(): Map<string, RhymeGroup> {
    return new Map(this.project.rhymeGroups.map(g => [g.id, g]));
  }

  get hasLyrics(): boolean {
    return this.project.lines.length > 0 && this.project.lines.some(l => l.words.length > 0);
  }

  get hasTimestamps(): boolean {
    return this.allWords.some(w => w.startMs !== undefined);
  }

  // Save/Load
  loadProject(data: Project) {
    this.pushUndo();
    this.project = data;
    this.rawLyrics = data.lines.map(l => l.rawText).join('\n');
  }

  // Undo/Redo
  private pushUndo() {
    this.undoStack.push(JSON.stringify(this.project));
    this.redoStack = [];
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  undo() {
    const prev = this.undoStack.pop();
    if (prev) {
      this.redoStack.push(JSON.stringify(this.project));
      runInAction(() => {
        this.project = JSON.parse(prev);
      });
    }
  }

  redo() {
    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(JSON.stringify(this.project));
      runInAction(() => {
        this.project = JSON.parse(next);
      });
    }
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}
