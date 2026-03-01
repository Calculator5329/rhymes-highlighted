import { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, useUIStore, usePlaybackStore } from '../../stores';
import { WordSpan } from './WordSpan';
import { ContextMenu } from './ContextMenu';
import type { Word } from '../../core/types';

interface ContextMenuState {
  word: Word;
  x: number;
  y: number;
}

export const LyricsDisplay = observer(function LyricsDisplay() {
  const project = useProjectStore();
  const ui = useUIStore();
  const playback = usePlaybackStore();
  const groupMap = project.groupMap;

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleWordClick = (lineIndex: number, wordIndex: number) => {
    if (ui.mode !== 'tag') return;

    if (ui.selectedGroupId) {
      // Active-group mode: single click toggles assignment
      const word = project.project.lines[lineIndex]?.words[wordIndex];
      if (word?.rhymeGroupId === ui.selectedGroupId) {
        project.removeWordFromGroup(lineIndex, wordIndex);
      } else {
        project.assignWordToGroup(lineIndex, wordIndex, ui.selectedGroupId);
      }
    } else {
      // Selection mode: clicking a tagged word activates its group; otherwise multi-select
      const word = project.project.lines[lineIndex]?.words[wordIndex];
      if (word?.rhymeGroupId && ui.selectedWordPositions.length === 0) {
        ui.selectGroup(word.rhymeGroupId);
      } else {
        ui.toggleWordSelection(lineIndex, wordIndex);
      }
    }
  };

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, word: Word) => {
      if (ui.mode !== 'tag') return;
      e.preventDefault();
      setContextMenu({ word, x: e.clientX, y: e.clientY });
    },
    [ui.mode]
  );

  // Sync index over rhyming words only
  let rhymeIdx = 0;
  const syncIndexMap = new Map<string, number>();
  for (const line of project.project.lines) {
    for (const word of line.words) {
      const isRhyming = word.rhymeGroupId !== undefined ||
        (word.syllables?.some(s => s.rhymeGroupId !== undefined) ?? false);
      if (isRhyming) {
        syncIndexMap.set(`${word.lineIndex}-${word.wordIndex}`, rhymeIdx++);
      }
    }
  }

  return (
    <>
      <div className="space-y-3 font-mono text-base leading-relaxed select-none">
        {project.project.lines.map((line, lineIndex) => (
          <div key={lineIndex} className={line.words.length === 0 ? 'h-4' : ''}>
            {line.words.map((word) => {
              const group = word.rhymeGroupId ? groupMap.get(word.rhymeGroupId) : undefined;
              const isSelected = ui.selectedWordPositions.some(
                p => p.lineIndex === word.lineIndex && p.wordIndex === word.wordIndex
              );
              const isInActiveGroup = !!ui.selectedGroupId && word.rhymeGroupId === ui.selectedGroupId;

              const currentTime = playback.currentTimeMs;
              const isActive =
                playback.isPlaying &&
                word.startMs !== undefined &&
                word.endMs !== undefined &&
                currentTime >= word.startMs &&
                currentTime < word.endMs;

              const wordSyncIndex = syncIndexMap.get(`${lineIndex}-${word.wordIndex}`) ?? -1;
              const isSyncTarget = ui.isSyncMode && wordSyncIndex === ui.syncWordIndex;
              const isSynced = ui.isSyncMode && wordSyncIndex >= 0 && wordSyncIndex < ui.syncWordIndex;

              return (
                <WordSpan
                  key={`${lineIndex}-${word.wordIndex}`}
                  word={word}
                  group={group}
                  groupMap={groupMap}
                  mode={ui.mode}
                  isSelected={isSelected}
                  isInActiveGroup={isInActiveGroup}
                  isActive={isActive}
                  isSyncTarget={isSyncTarget}
                  isSynced={isSynced}
                  onClick={() => handleWordClick(lineIndex, word.wordIndex)}
                  onContextMenu={(e) => handleContextMenu(e, word)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {contextMenu && (
        <ContextMenu
          word={contextMenu.word}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
});
