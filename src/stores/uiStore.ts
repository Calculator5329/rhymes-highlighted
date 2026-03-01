import { makeAutoObservable } from 'mobx';
import type { EditorMode } from '../core/types';

export class UIStore {
  mode: EditorMode = 'tag';
  selectedGroupId: string | null = null;
  selectedWordPositions: Array<{ lineIndex: number; wordIndex: number }> = [];
  isSyncMode = false;
  syncWordIndex = 0;

  constructor() {
    makeAutoObservable(this);
  }

  setMode(mode: EditorMode) {
    this.mode = mode;
    this.clearSelection();
  }

  selectGroup(groupId: string | null) {
    this.selectedGroupId = groupId;
  }

  toggleWordSelection(lineIndex: number, wordIndex: number) {
    const idx = this.selectedWordPositions.findIndex(
      p => p.lineIndex === lineIndex && p.wordIndex === wordIndex
    );
    if (idx >= 0) {
      this.selectedWordPositions.splice(idx, 1);
    } else {
      this.selectedWordPositions.push({ lineIndex, wordIndex });
    }
  }

  clearSelection() {
    this.selectedWordPositions = [];
    this.selectedGroupId = null;
  }

  /** Clears only the multi-word selection, leaving the active group intact. */
  clearWordSelection() {
    this.selectedWordPositions = [];
  }

  enterSyncMode() {
    this.isSyncMode = true;
    this.syncWordIndex = 0;
  }

  advanceSyncWord() {
    this.syncWordIndex++;
  }

  setSyncWordIndex(index: number) {
    this.syncWordIndex = index;
  }

  exitSyncMode() {
    this.isSyncMode = false;
    this.syncWordIndex = 0;
  }
}
