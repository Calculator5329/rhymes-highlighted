import { makeAutoObservable } from 'mobx';
import type { EditorMode } from '../core/types';

const ONBOARDING_KEY = 'rhymes-hl-onboarding-complete';

export class UIStore {
  mode: EditorMode = 'tag';
  selectedGroupId: string | null = null;
  selectedWordPositions: Array<{ lineIndex: number; wordIndex: number }> = [];
  isSyncMode = false;
  syncWordIndex = 0;

  onboardingStep: number | null = null;
  showHelpModal = false;
  hasCompletedOnboarding: boolean;

  constructor() {
    this.hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY) === 'true';
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

  startOnboarding() {
    this.onboardingStep = 0;
  }

  nextOnboardingStep() {
    if (this.onboardingStep === null) return;
    if (this.onboardingStep >= 4) {
      this.completeOnboarding();
    } else {
      this.onboardingStep++;
    }
  }

  skipOnboarding() {
    this.completeOnboarding();
  }

  private completeOnboarding() {
    this.onboardingStep = null;
    this.hasCompletedOnboarding = true;
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  restartOnboarding() {
    this.hasCompletedOnboarding = false;
    localStorage.removeItem(ONBOARDING_KEY);
    this.onboardingStep = 0;
  }

  toggleHelpModal() {
    this.showHelpModal = !this.showHelpModal;
  }

  closeHelpModal() {
    this.showHelpModal = false;
  }
}
