import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, useUIStore } from '../../stores';
import type { Word } from '../../core/types';

interface ContextMenuProps {
  word: Word;
  x: number;
  y: number;
  onClose: () => void;
}

export const ContextMenu = observer(function ContextMenu({
  word,
  x,
  y,
  onClose,
}: ContextMenuProps) {
  const project = useProjectStore();
  const ui = useUIStore();
  const ref = useRef<HTMLDivElement>(null);
  const [splitMode, setSplitMode] = useState(false);
  const [splitText, setSplitText] = useState(word.text);
  const [assigningSyllable, setAssigningSyllable] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const groups = project.project.rhymeGroups;
  const currentGroup = word.rhymeGroupId;
  const hasSyllables = word.syllables && word.syllables.length > 0;

  const handleAssignToGroup = (groupId: string) => {
    project.assignWordToGroup(word.lineIndex, word.wordIndex, groupId);
    onClose();
  };

  const handleRemoveFromGroup = () => {
    project.removeWordFromGroup(word.lineIndex, word.wordIndex);
    onClose();
  };

  const handleNewGroup = () => {
    const group = project.createRhymeGroup();
    project.assignWordToGroup(word.lineIndex, word.wordIndex, group.id);
    ui.selectGroup(group.id);
    onClose();
  };

  const handleSplitConfirm = () => {
    const segments = splitText.split('|').map(s => s.trim()).filter(Boolean);
    if (segments.length < 2) return;
    project.splitWordIntoSyllables(word.lineIndex, word.wordIndex, segments);
    setSplitMode(false);
  };

  const handleClearSyllables = () => {
    project.clearSyllables(word.lineIndex, word.wordIndex);
    onClose();
  };

  const handleAssignSyllable = (syllableIndex: number, groupId: string) => {
    project.assignSyllableToGroup(word.lineIndex, word.wordIndex, syllableIndex, groupId);
    setAssigningSyllable(null);
  };

  const handleNewGroupForSyllable = (syllableIndex: number) => {
    const group = project.createRhymeGroup();
    project.assignSyllableToGroup(word.lineIndex, word.wordIndex, syllableIndex, group.id);
    setAssigningSyllable(null);
  };

  // Syllable assignment sub-view
  if (assigningSyllable !== null && hasSyllables) {
    const seg = word.syllables![assigningSyllable];
    return (
      <div
        ref={ref}
        className="fixed z-50 bg-surface-700 border border-white/10 rounded-lg shadow-xl py-1.5 min-w-48"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-1.5 text-xs text-white/30 border-b border-white/5 mb-1">
          Assign "{seg.text}" to group
        </div>
        <button
          onClick={() => handleNewGroupForSyllable(assigningSyllable)}
          className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
        >
          New group
        </button>
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => handleAssignSyllable(assigningSyllable, group.id)}
            className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
            <span className="truncate">{group.label || group.id}</span>
          </button>
        ))}
        <div className="border-t border-white/5 my-1" />
        <button
          onClick={() => setAssigningSyllable(null)}
          className="w-full text-left px-3 py-1.5 text-xs text-white/40 hover:bg-white/10 transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  // Syllable split input
  if (splitMode) {
    const preview = splitText.split('|').map(s => s.trim()).filter(Boolean);
    return (
      <div
        ref={ref}
        className="fixed z-50 bg-surface-700 border border-white/10 rounded-lg shadow-xl p-3 min-w-56 space-y-3"
        style={{ left: x, top: y }}
      >
        <div className="text-xs text-white/40">
          Use <span className="text-white/60 bg-white/10 px-1 rounded">|</span> to split syllables
        </div>
        <input
          autoFocus
          value={splitText}
          onChange={(e) => setSplitText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSplitConfirm(); }}
          className="w-full bg-surface-900 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-white/20"
          placeholder="whirl|winds"
        />
        {preview.length >= 2 && (
          <div className="flex gap-1.5 flex-wrap">
            {preview.map((seg, i) => (
              <span key={i} className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/70 font-mono">
                {seg}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={handleSplitConfirm}
            disabled={preview.length < 2}
            className="flex-1 text-xs bg-rhyme-purple/20 hover:bg-rhyme-purple/30 text-rhyme-purple py-1.5 rounded transition-colors disabled:opacity-30"
          >
            Split
          </button>
          <button
            onClick={() => setSplitMode(false)}
            className="text-xs text-white/40 hover:text-white/60 px-3 py-1.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Main context menu
  return (
    <div
      ref={ref}
      className="fixed z-50 bg-surface-700 border border-white/10 rounded-lg shadow-xl py-1.5 min-w-48"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-xs text-white/30 border-b border-white/5 mb-1">
        "{word.text}"
      </div>

      {/* Syllable management for words that already have syllables */}
      {hasSyllables && (
        <>
          <div className="px-3 py-1 text-xs text-white/30">Syllables</div>
          {word.syllables!.map((seg, i) => {
            const segGroup = seg.rhymeGroupId ? project.groupMap.get(seg.rhymeGroupId) : undefined;
            return (
              <button
                key={i}
                onClick={() => setAssigningSyllable(i)}
                className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                {segGroup && (
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: segGroup.color }} />
                )}
                <span className="font-mono">{seg.text}</span>
                <span className="ml-auto text-xs text-white/25">
                  {segGroup ? segGroup.label || segGroup.id : 'unassigned'}
                </span>
              </button>
            );
          })}
          <div className="border-t border-white/5 my-1" />
          <button
            onClick={handleClearSyllables}
            className="w-full text-left px-3 py-1.5 text-sm text-white/50 hover:bg-white/10 transition-colors"
          >
            Remove syllable split
          </button>
        </>
      )}

      {/* Standard word-level actions */}
      {!hasSyllables && (
        <>
          {currentGroup && (
            <button
              onClick={handleRemoveFromGroup}
              className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
            >
              Remove from group
            </button>
          )}

          <button
            onClick={handleNewGroup}
            className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            New group from this word
          </button>

          <button
            onClick={() => setSplitMode(true)}
            className="w-full text-left px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 transition-colors"
          >
            Split into syllables
          </button>

          {groups.length > 0 && (
            <>
              <div className="border-t border-white/5 my-1" />
              <div className="px-3 py-1 text-xs text-white/30">Assign to group</div>
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleAssignToGroup(group.id)}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 transition-colors flex items-center gap-2 ${
                    currentGroup === group.id ? 'text-white' : 'text-white/70'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                  <span className="truncate">{group.label || group.id}</span>
                  {currentGroup === group.id && (
                    <span className="ml-auto text-xs text-white/30">current</span>
                  )}
                </button>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
});
