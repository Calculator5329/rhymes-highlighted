import { useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, useUIStore } from '../../stores';

export const RhymeGroupPanel = observer(function RhymeGroupPanel() {
  const project = useProjectStore();
  const ui = useUIStore();
  const groups = project.project.rhymeGroups;

  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const wordCountByGroup = new Map<string, number>();
  for (const line of project.project.lines) {
    for (const word of line.words) {
      if (word.rhymeGroupId) {
        wordCountByGroup.set(
          word.rhymeGroupId,
          (wordCountByGroup.get(word.rhymeGroupId) ?? 0) + 1
        );
      }
      if (word.syllables) {
        for (const seg of word.syllables) {
          if (seg.rhymeGroupId) {
            wordCountByGroup.set(
              seg.rhymeGroupId,
              (wordCountByGroup.get(seg.rhymeGroupId) ?? 0) + 1
            );
          }
        }
      }
    }
  }

  let totalTaggedWords = 0;
  for (const count of wordCountByGroup.values()) totalTaggedWords += count;

  const handleAssignSelected = (groupId: string) => {
    for (const pos of ui.selectedWordPositions) {
      project.assignWordToGroup(pos.lineIndex, pos.wordIndex, groupId);
    }
    ui.clearSelection();
  };

  const startEditingName = (groupId: string, currentName: string) => {
    setEditingNameId(groupId);
    setEditingNameValue(currentName);
    // Focus the input on next tick after render
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const commitName = (groupId: string) => {
    project.setGroupName(groupId, editingNameValue.trim());
    setEditingNameId(null);
  };

  const getDisplayName = (group: { id: string; label?: string; name?: string }, index: number) => {
    return group.name || group.label || `Group ${index + 1}`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Rhyme Groups
        </h3>
        {ui.mode === 'tag' && (
          <button
            onClick={() => {
              const group = project.createRhymeGroup();
              ui.selectGroup(group.id);
              ui.clearWordSelection();
            }}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            + New
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="space-y-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 space-y-2">
            <p className="text-xs text-white/45 leading-relaxed">
              Rhyme groups are color labels you assign to words.
              Create your first group, then click words in the lyrics to tag them.
            </p>
          </div>
          {ui.mode === 'tag' && (
            <button
              onClick={() => {
                const group = project.createRhymeGroup();
                ui.selectGroup(group.id);
              }}
              className="w-full text-sm bg-rhyme-purple/10 hover:bg-rhyme-purple/20 border border-rhyme-purple/20 hover:border-rhyme-purple/35 text-rhyme-purple/80 py-2.5 rounded-lg transition-colors font-medium"
            >
              + Create first group
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {groups.map((group, index) => {
            const count = wordCountByGroup.get(group.id) ?? 0;
            const isActive = ui.selectedGroupId === group.id;
            const isEditing = editingNameId === group.id;
            const displayName = getDisplayName(group, index);
            const keyHint = index < 8 ? `${index + 1}` : null;

            return (
              <div key={group.id}>
                <div
                  onClick={() => {
                    if (isEditing) return;
                    if (mergeSource && mergeSource !== group.id) {
                      project.mergeRhymeGroups(mergeSource, group.id);
                      setMergeSource(null);
                      return;
                    }
                    const nowActive = !isActive;
                    ui.selectGroup(nowActive ? group.id : null);
                    // If words are selected, assign them
                    if (nowActive && ui.selectedWordPositions.length > 0) {
                      handleAssignSelected(group.id);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-colors group/row ${
                    isActive ? 'bg-white/10 ring-1 ring-white/15' : 'hover:bg-white/5'
                  } ${mergeSource && mergeSource !== group.id ? 'ring-1 ring-white/20' : ''}`}
                >
                  {/* Color swatch — clicking opens native color picker */}
                  <label
                    onClick={(e) => e.stopPropagation()}
                    className="relative shrink-0 cursor-pointer"
                    title="Change color"
                  >
                    <span
                      className="block w-3.5 h-3.5 rounded-full ring-1 ring-black/20 hover:ring-2 hover:ring-white/40 transition-all"
                      style={{ backgroundColor: group.color }}
                    />
                    <input
                      type="color"
                      value={group.color}
                      onChange={(e) => project.updateGroupColor(group.id, e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      tabIndex={-1}
                    />
                  </label>

                  {/* Name — click to edit inline */}
                  {isEditing ? (
                    <input
                      ref={nameInputRef}
                      value={editingNameValue}
                      onChange={(e) => setEditingNameValue(e.target.value)}
                      onBlur={() => commitName(group.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitName(group.id);
                        if (e.key === 'Escape') setEditingNameId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Group name…"
                      className="flex-1 bg-transparent border-b border-white/30 text-sm text-white outline-none py-0.5 min-w-0"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEditingName(group.id, group.name || group.label || '');
                      }}
                      title="Double-click to rename"
                      className="text-sm text-white/80 truncate flex-1 select-none"
                    >
                      {displayName}
                    </span>
                  )}

                  {/* Key hint badge */}
                  {keyHint && !isEditing && (
                    <span className="text-[10px] text-white/20 font-mono shrink-0 opacity-0 group-hover/row:opacity-100 transition-opacity">
                      {keyHint}
                    </span>
                  )}

                  {/* Word count */}
                  <span className="text-xs text-white/30 shrink-0">{count}</span>

                  {/* Tag mode actions */}
                  {ui.mode === 'tag' && !isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMergeSource(mergeSource === group.id ? null : group.id);
                        }}
                        title="Merge into another group"
                        className={`text-xs transition-colors ${
                          mergeSource === group.id
                            ? 'text-rhyme-cyan'
                            : 'text-white/20 hover:text-white/50'
                        }`}
                      >
                        ⇄
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ui.selectedGroupId === group.id) ui.selectGroup(null);
                          project.deleteRhymeGroup(group.id);
                        }}
                        title="Delete group"
                        className="text-white/20 hover:text-red-400 transition-colors text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mergeSource && (
        <p className="text-xs text-rhyme-cyan/70 italic">
          Click another group to merge into it
        </p>
      )}

      {/* Selection helper */}
      {ui.mode === 'tag' && ui.selectedWordPositions.length > 0 && groups.length > 0 && (
        <div className="pt-3 border-t border-white/5">
          <p className="text-xs text-white/40 mb-2">
            {ui.selectedWordPositions.length} word{ui.selectedWordPositions.length !== 1 ? 's' : ''} selected — click a group to assign
          </p>
        </div>
      )}

      {/* First-group hint: shown when there are groups but no words tagged yet */}
      {ui.mode === 'tag' && groups.length > 0 && totalTaggedWords === 0 && ui.selectedGroupId && (
        <div className="bg-rhyme-purple/5 border border-rhyme-purple/15 rounded-lg p-3">
          <p className="text-xs text-rhyme-purple/70 leading-relaxed">
            Now click words in the lyrics to tag them with this group's color.
          </p>
        </div>
      )}

      {/* Help text */}
      {ui.mode === 'tag' && groups.length > 0 && totalTaggedWords > 0 && (
        <p className="text-xs text-white/15 pt-1">
          Double-click a name to rename &nbsp;·&nbsp; Click swatch to change color
        </p>
      )}
    </div>
  );
});
