import { useEffect, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, usePlaybackStore, useUIStore } from '../../stores';
import { getAudioElement } from '../../services/audioService';
import { computeEndTimestamps, clearTimestamps } from '../../services/timestampService';

export const SyncEditor = observer(function SyncEditor() {
  const project = useProjectStore();
  const playback = usePlaybackStore();
  const ui = useUIStore();
  const syncWords = project.rhymingWords;
  const currentSyncIndex = ui.syncWordIndex;

  const startSync = useCallback(() => {
    clearTimestamps(syncWords);
    ui.enterSyncMode();
    const audio = getAudioElement();
    playback.attachAudio(audio);
    playback.seek(0);
    playback.play();
  }, [syncWords, ui, playback]);

  const stopSync = useCallback(() => {
    playback.pause();
    computeEndTimestamps(syncWords);
    ui.exitSyncMode();
  }, [syncWords, playback, ui]);

  const undoLastTap = useCallback(() => {
    if (currentSyncIndex <= 0) return;
    const prevWord = syncWords[currentSyncIndex - 1];
    if (prevWord) {
      prevWord.startMs = undefined;
      prevWord.endMs = undefined;
    }
    ui.setSyncWordIndex(currentSyncIndex - 1);
  }, [syncWords, currentSyncIndex, ui]);

  useEffect(() => {
    if (!ui.isSyncMode) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentSyncIndex >= syncWords.length) {
          stopSync();
          return;
        }
        const word = syncWords[currentSyncIndex];
        if (word) {
          word.startMs = playback.getCurrentTimeMs();
          ui.advanceSyncWord();
        }
      }

      if (e.key === 'Backspace') {
        e.preventDefault();
        undoLastTap();
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        stopSync();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ui.isSyncMode, currentSyncIndex, syncWords, playback, stopSync, undoLastTap, ui]);

  const progress = syncWords.length > 0
    ? Math.round((currentSyncIndex / syncWords.length) * 100)
    : 0;

  if (!project.project.audioFile) return null;

  const hasRhymes = syncWords.length > 0;

  return (
    <div className="space-y-3">
      {!ui.isSyncMode ? (
        <div className="space-y-2">
          <button
            onClick={startSync}
            disabled={!hasRhymes}
            className="w-full py-2.5 bg-rhyme-cyan/15 hover:bg-rhyme-cyan/25 border border-rhyme-cyan/20 text-rhyme-cyan text-sm rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {project.hasTimestamps ? 'Re-sync lyrics' : 'Start tap-to-sync'}
          </button>
          {!hasRhymes && (
            <p className="text-xs text-white/30 text-center">
              Analyze or tag rhymes first — sync only applies to rhyming words.
            </p>
          )}
          {project.hasTimestamps && (
            <p className="text-xs text-white/30 text-center">
              Lyrics are synced. Play audio to preview.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 p-3 bg-rhyme-cyan/5 border border-rhyme-cyan/15 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rhyme-cyan uppercase tracking-wider">
              Syncing
            </span>
            <span className="text-xs text-white/40">
              {currentSyncIndex}/{syncWords.length}
            </span>
          </div>

          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-rhyme-cyan/60 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {currentSyncIndex < syncWords.length ? (
            <p className="text-sm text-center">
              <span className="text-white/40">Next: </span>
              <span className="text-white font-mono font-semibold">
                {syncWords[currentSyncIndex]?.text}
              </span>
            </p>
          ) : (
            <p className="text-sm text-center text-rhyme-cyan">
              All rhyming words synced!
            </p>
          )}

          <div className="flex gap-2 text-xs text-white/40">
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white/60">Space</span>
            <span>tap word</span>
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 ml-2">Backspace</span>
            <span>undo</span>
            <span className="px-1.5 py-0.5 bg-white/10 rounded text-white/60 ml-2">Esc</span>
            <span>stop</span>
          </div>

          <button
            onClick={stopSync}
            className="w-full py-2 bg-white/10 hover:bg-white/15 text-white/70 text-xs rounded transition-colors"
          >
            Done syncing
          </button>
        </div>
      )}
    </div>
  );
});
