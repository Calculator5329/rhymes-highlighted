import { useCallback, useEffect, useState } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { EditorView } from './features/editor/EditorView';
import { OnboardingOverlay } from './features/onboarding/OnboardingOverlay';
import { HelpModal } from './features/onboarding/HelpModal';
import { useProjectStore, useUIStore } from './stores';
import { RHYME_PALETTES, type RhymePaletteId } from './core/types';
import {
  deleteProject,
  downloadProjectAsJson,
  importProjectFromFile,
  listSavedProjects,
  loadLastProject,
  loadProject,
  saveProject,
} from './services/storageService';
import {
  decodeSharedProjectFromHash,
  encodeProjectToHash,
  getHashByteLength,
  isShareHashOversized,
} from './services/shareService';

const AUTOSAVE_DELAY_MS = 700;

const App = observer(function App() {
  const project = useProjectStore();
  const ui = useUIStore();
  const [showSaved, setShowSaved] = useState(false);
  const [saveName, setSaveName] = useState(project.project.title);
  const [saveFlash, setSaveFlash] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copying' | 'copied' | 'failed'>('idle');
  const [, setProjectsRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadInitialProject = async () => {
      const shared = await decodeSharedProjectFromHash(window.location.hash);
      const initial = shared?.project ?? loadLastProject();
      const palette = shared?.palette ?? ui.palette;
      ui.setPalette(palette);
      project.setPalette(palette);
      if (!cancelled && initial) {
        project.loadProject(initial);
        project.setPalette(palette);
        setSaveName(initial.title);
      }
    };

    void loadInitialProject();
    return () => {
      cancelled = true;
    };
  }, [project, ui]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const dispose = reaction(
      () => JSON.stringify(project.project),
      () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (saveProject(project.project)) {
            setProjectsRevision(value => value + 1);
          }
        }, AUTOSAVE_DELAY_MS);
      },
    );

    return () => {
      dispose();
      clearTimeout(timer);
    };
  }, [project]);

  const flashSaved = useCallback(() => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }, []);

  const handleSave = useCallback(() => {
    if (saveProject(project.project)) {
      setProjectsRevision(value => value + 1);
      flashSaved();
    }
  }, [flashSaved, project]);

  const handleSaveAs = useCallback(() => {
    const title = saveName.trim();
    if (!title) return;

    const copy = {
      ...project.project,
      id: crypto.randomUUID(),
      title,
    };
    project.loadProject(copy);
    if (saveProject(copy)) {
      setProjectsRevision(value => value + 1);
      flashSaved();
    }
  }, [flashSaved, project, saveName]);

  const handleDownload = useCallback(() => {
    downloadProjectAsJson(project.project);
  }, [project]);

  const handleShare = useCallback(async () => {
    setShareStatus('copying');

    try {
      const hash = await encodeProjectToHash(project.project, ui.palette);
      if (isShareHashOversized(hash)) {
        const size = (getHashByteLength(hash) / 1024).toFixed(1);
        const confirmed = window.confirm(
          `This share link is ${size} KiB and may be too large for some browsers or messaging apps. Copy it anyway?`,
        );
        if (!confirmed) {
          setShareStatus('idle');
          return;
        }
      }

      const url = new URL(window.location.href);
      url.hash = hash.slice(1);
      await navigator.clipboard.writeText(url.toString());
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 1600);
    } catch {
      setShareStatus('failed');
      setTimeout(() => setShareStatus('idle'), 2400);
    }
  }, [project, ui]);

  const handleImport = useCallback(async () => {
    try {
      const data = await importProjectFromFile();
      project.loadProject(data);
      setSaveName(data.title);
      saveProject(data);
      setProjectsRevision(value => value + 1);
    } catch {
      // Cancellation and malformed files leave the current project untouched.
    }
  }, [project]);

  const handleLoadProject = useCallback((id: string) => {
    const data = loadProject(id);
    if (data) {
      project.loadProject(data);
      setSaveName(data.title);
      setShowSaved(false);
    }
  }, [project]);

  const handleDeleteProject = useCallback((id: string) => {
    deleteProject(id);
    setProjectsRevision(value => value + 1);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const savedProjects = showSaved ? listSavedProjects() : [];

  return (
    <div className="h-screen flex flex-col bg-surface-900 text-white/90">
      <header className="shrink-0 min-h-12 sm:h-12 border-b border-white/5 flex flex-wrap items-center px-3 sm:px-5 gap-x-4 gap-y-2 py-2 sm:py-0">
        <span className="text-sm font-semibold tracking-tight text-white/70">
          rhymes<span className="text-rhyme-purple">highlighted</span>
        </span>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-1.5 text-xs text-white/35" title="Rhyme highlight palette">
            <span className="sr-only">Color palette</span>
            <span className="flex -space-x-1" aria-hidden="true">
              {RHYME_PALETTES[ui.palette].colors.slice(0, 3).map(color => (
                <span key={color} className="w-2.5 h-2.5 rounded-full ring-1 ring-surface-900" style={{ backgroundColor: color }} />
              ))}
            </span>
            <select
              aria-label="Color palette"
              value={ui.palette}
              onChange={event => {
                const palette = event.target.value as RhymePaletteId;
                ui.setPalette(palette);
                project.setPalette(palette);
              }}
              className="bg-surface-800 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white/60 outline-none hover:border-white/25 focus:border-rhyme-purple/60"
            >
              {Object.entries(RHYME_PALETTES).map(([id, palette]) => (
                <option key={id} value={id}>{palette.name}</option>
              ))}
            </select>
          </label>

          <button
            onClick={() => ui.toggleHelpModal()}
            title="Help & shortcuts"
            className="text-xs w-7 h-7 rounded-full border border-white/10 text-white/35 hover:text-white/70 hover:border-white/25 hover:bg-white/5 transition-colors flex items-center justify-center font-semibold"
          >
            ?
          </button>

          <span className="w-px h-4 bg-white/8" />

          <button
            onClick={handleSave}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              saveFlash
                ? 'bg-green-500/20 text-green-400'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {saveFlash ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleDownload}
            className="text-xs px-3 py-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Download
          </button>

          <button
            onClick={handleShare}
            disabled={shareStatus === 'copying'}
            title={shareStatus === 'failed' ? 'Could not copy the share link' : 'Copy a shareable project link'}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 ${
              shareStatus === 'copied'
                ? 'bg-green-500/20 text-green-400'
                : shareStatus === 'failed'
                  ? 'bg-red-500/15 text-red-400'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {shareStatus === 'copying'
              ? 'Sharing…'
              : shareStatus === 'copied'
                ? 'Link copied'
                : shareStatus === 'failed'
                  ? 'Copy failed'
                  : 'Share'}
          </button>

          <button
            onClick={handleImport}
            className="text-xs px-3 py-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Import
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setSaveName(project.project.title);
                setShowSaved(value => !value);
              }}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                showSaved ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              Projects
            </button>

            {showSaved && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-surface-700 border border-white/10 rounded-lg shadow-xl z-50 py-2">
                <form
                  className="flex gap-2 px-3 pb-2 border-b border-white/8"
                  onSubmit={event => {
                    event.preventDefault();
                    handleSaveAs();
                  }}
                >
                  <input
                    value={saveName}
                    onChange={event => setSaveName(event.target.value)}
                    aria-label="Project name"
                    placeholder="Project name"
                    className="min-w-0 flex-1 rounded-md bg-surface-900 border border-white/10 px-2 py-1.5 text-xs text-white/80 outline-none focus:border-rhyme-purple/60"
                  />
                  <button
                    type="submit"
                    disabled={!saveName.trim()}
                    className="text-xs px-2.5 py-1.5 rounded-md bg-rhyme-purple/20 text-rhyme-purple hover:bg-rhyme-purple/30 disabled:opacity-30 transition-colors"
                  >
                    Save as
                  </button>
                </form>

                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/25">
                  Saved projects
                </p>
                {savedProjects.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-white/30 text-center italic">
                    No saved projects
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto">
                    {savedProjects.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors group"
                      >
                        <button
                          onClick={() => handleLoadProject(entry.id)}
                          className="flex-1 text-left text-sm text-white/70 truncate"
                          title={`Load ${entry.title}`}
                        >
                          {entry.title}
                        </button>
                        <span className="text-[10px] text-white/20 shrink-0">
                          {new Date(entry.updatedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteProject(entry.id)}
                          aria-label={`Delete ${entry.title}`}
                          className="text-sm text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <EditorView />
      </div>

      <OnboardingOverlay />
      <HelpModal />
    </div>
  );
});

export default App;
