import { observer } from 'mobx-react-lite';
import { useProjectStore, useUIStore } from '../../stores';

export const ManualTagToolbar = observer(function ManualTagToolbar() {
  const project = useProjectStore();
  const ui = useUIStore();

  if (ui.mode !== 'tag') return null;

  const activeGroup = ui.selectedGroupId
    ? project.project.rhymeGroups.find(g => g.id === ui.selectedGroupId)
    : null;

  const selectionCount = ui.selectedWordPositions.length;

  const handleNewGroup = () => {
    const group = project.createRhymeGroup();
    // If words are selected, assign them immediately
    if (selectionCount > 0) {
      for (const pos of ui.selectedWordPositions) {
        project.assignWordToGroup(pos.lineIndex, pos.wordIndex, group.id);
      }
      ui.clearWordSelection();
    }
    ui.selectGroup(group.id);
  };

  const handleAssignSelectionToGroup = (groupId: string) => {
    for (const pos of ui.selectedWordPositions) {
      project.assignWordToGroup(pos.lineIndex, pos.wordIndex, groupId);
    }
    ui.clearSelection();
    ui.selectGroup(groupId);
  };

  const handleRemoveSelection = () => {
    for (const pos of ui.selectedWordPositions) {
      project.removeWordFromGroup(pos.lineIndex, pos.wordIndex);
    }
    ui.clearWordSelection();
  };

  return (
    <div className="shrink-0 border-t border-white/5 bg-surface-800 px-5 py-3">
      <div className="flex items-center gap-3 min-w-0">

        {/* Mode label */}
        <span className="text-xs font-semibold uppercase tracking-widest text-white/30 shrink-0">
          Tag
        </span>
        <span className="text-white/10 shrink-0">|</span>

        {/* Active group indicator OR hint */}
        {activeGroup ? (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: activeGroup.color }}
            />
            <span className="text-sm text-white/80 font-medium max-w-[120px] truncate">
              {activeGroup.name || activeGroup.label || `Group ${project.project.rhymeGroups.indexOf(activeGroup) + 1}`}
            </span>
            <span className="text-xs text-white/30">active</span>
            <button
              onClick={() => ui.selectGroup(null)}
              title="Deactivate group (Esc)"
              className="text-white/25 hover:text-white/60 transition-colors text-sm leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <span className="text-xs text-white/30 shrink-0">
            {selectionCount > 0
              ? `${selectionCount} word${selectionCount !== 1 ? 's' : ''} selected`
              : 'Select a group or click New Group to start tagging'}
          </span>
        )}

        {/* Selection actions (only when words are selected and no active group) */}
        {selectionCount > 0 && !activeGroup && (
          <>
            <span className="text-white/10">|</span>
            <button
              onClick={handleNewGroup}
              className="text-xs bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 px-2.5 py-1 rounded transition-colors shrink-0"
            >
              + New Group
            </button>

            {project.project.rhymeGroups.length > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-white/25">or add to:</span>
                {project.project.rhymeGroups.slice(0, 8).map((group, i) => (
                  <button
                    key={group.id}
                    onClick={() => handleAssignSelectionToGroup(group.id)}
                    title={`${group.name || group.label || `Group ${i + 1}`} (key: ${i + 1})`}
                    className="w-5 h-5 rounded-full border border-white/10 hover:border-white/40 hover:scale-125 transition-all shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleRemoveSelection}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors shrink-0"
            >
              Remove rhyme
            </button>
          </>
        )}

        {/* New Group button when no selection and no active group */}
        {selectionCount === 0 && !activeGroup && (
          <button
            onClick={handleNewGroup}
            className="text-xs bg-white/8 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white/80 px-2.5 py-1 rounded transition-colors shrink-0"
          >
            + New Group
          </button>
        )}

        {/* Keyboard hints */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/20 hidden lg:block">
            1–8 select group &nbsp;·&nbsp; Esc deselect
          </span>
          <span className="text-white/10">|</span>
          <button
            onClick={() => project.undo()}
            disabled={!project.canUndo}
            className="text-xs text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            onClick={() => project.redo()}
            disabled={!project.canRedo}
            className="text-xs text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
});
