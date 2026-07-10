import { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { EditorView } from './features/editor/EditorView';
import { useProjectStore } from './stores';
import {
  saveProject,
  loadLastProject,
  listSavedProjects,
  loadProject,
  deleteProject,
  downloadProjectAsJson,
  importProjectFromFile,
} from './services/storageService';

const App = observer(function App() {
  const project = useProjectStore();
  const [showSaved, setShowSaved] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => {
    const last = loadLastProject();
    if (last) {
      project.loadProject(last);
    }
  }, [project]);

  const handleSave = useCallback(() => {
    saveProject(project.project);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }, [project]);

  const handleDownload = useCallback(() => {
    downloadProjectAsJson(project.project);
  }, [project]);

  const handleImport = useCallback(async () => {
    try {
      const data = await importProjectFromFile();
      project.loadProject(data);
      saveProject(data);
    } catch {
      // user cancelled or bad file
    }
  }, [project]);

  const handleLoadProject = useCallback((id: string) => {
    const data = loadProject(id);
    if (data) {
      project.loadProject(data);
      setShowSaved(false);
    }
  }, [project]);

  const handleDeleteProject = useCallback((id: string) => {
    deleteProject(id);
    setShowSaved(show => show);
  }, []);

  // Ctrl+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const savedProjects = showSaved ? listSavedProjects() : [];

  return (
    <div className="h-screen flex flex-col bg-surface-900 text-white/90">
      <header className="shrink-0 h-12 border-b border-white/5 flex items-center px-5 gap-4">
        <span className="text-sm font-semibold tracking-tight text-white/70">
          rhymes<span className="text-rhyme-purple">highlighted</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
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
            onClick={handleImport}
            className="text-xs px-3 py-1.5 rounded-md text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            Import
          </button>

          <div className="relative">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                showSaved ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              Open
            </button>

            {showSaved && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-surface-700 border border-white/10 rounded-lg shadow-xl z-50 py-1">
                {savedProjects.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-white/30 text-center italic">
                    No saved projects
                  </p>
                ) : (
                  savedProjects.map(entry => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors group"
                    >
                      <button
                        onClick={() => handleLoadProject(entry.id)}
                        className="flex-1 text-left text-sm text-white/70 truncate"
                      >
                        {entry.title}
                      </button>
                      <span className="text-xs text-white/20 shrink-0">
                        {new Date(entry.updatedAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteProject(entry.id)}
                        className="text-xs text-white/15 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <EditorView />
      </div>
    </div>
  );
});

export default App;
