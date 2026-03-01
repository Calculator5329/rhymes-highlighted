import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { useProjectStore, useUIStore } from '../../stores';
import { LyricsInput } from './LyricsInput';
import { LyricsDisplay } from './LyricsDisplay';
import { RhymeGroupPanel } from './RhymeGroupPanel';
import { ManualTagToolbar } from './ManualTagToolbar';
import { PlaybackControls } from '../playback/PlaybackControls';

const MODE_LABELS: Record<string, string> = {
  view: 'Read',
  tag: 'Tag Rhymes',
};

export const EditorView = observer(function EditorView() {
  const project = useProjectStore();
  const ui = useUIStore();
  const prevHasLyrics = useRef(project.hasLyrics);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in an input / contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (ui.isSyncMode) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        project.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' && e.shiftKey || e.key === 'y')) {
        e.preventDefault();
        project.redo();
      }
      if (e.key === 'Escape') {
        ui.clearSelection();
      }

      // 1–8: quick-select rhyme group by position
      if (ui.mode === 'tag' && !e.ctrlKey && !e.metaKey && !e.altKey && e.key >= '1' && e.key <= '8') {
        const idx = parseInt(e.key) - 1;
        const group = project.project.rhymeGroups[idx];
        if (group) {
          ui.selectGroup(ui.selectedGroupId === group.id ? null : group.id);
          ui.clearWordSelection();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project, ui, ui.isSyncMode, ui.mode, ui.selectedGroupId]);

  useEffect(() => {
    if (project.hasLyrics && !prevHasLyrics.current && !ui.hasCompletedOnboarding) {
      ui.startOnboarding();
    }
    prevHasLyrics.current = project.hasLyrics;
  }, [project.hasLyrics, ui]);

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!project.hasLyrics ? (
          <LyricsInput />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-lg font-semibold text-white/90 tracking-tight">
                  {project.project.title}
                </h2>
                <div className="flex gap-1 ml-auto">
                  {(['view', 'tag'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => ui.setMode(mode)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium tracking-wide transition-colors ${
                        ui.mode === mode
                          ? 'bg-white/15 text-white'
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {MODE_LABELS[mode] ?? mode}
                    </button>
                  ))}
                </div>
              </div>

              <LyricsDisplay />

              <button
                onClick={() => {
                  project.parseLyrics();
                  ui.setMode('tag');
                }}
                className="mt-6 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                Re-enter lyrics
              </button>
            </div>

            <ManualTagToolbar />
          </>
        )}
      </div>

      {project.hasLyrics && (
        <aside className="w-72 border-l border-white/5 bg-surface-800 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <RhymeGroupPanel />
          </div>
          <PlaybackControls />
        </aside>
      )}
    </div>
  );
});
