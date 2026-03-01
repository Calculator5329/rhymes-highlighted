import type { Project } from '../core/types';

const STORAGE_KEY = 'rhymes-highlighted-projects';
const LAST_PROJECT_KEY = 'rhymes-highlighted-last-project';

interface ProjectEntry {
  id: string;
  title: string;
  updatedAt: string;
}

function getIndex(): ProjectEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setIndex(entries: ProjectEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function listSavedProjects(): ProjectEntry[] {
  return getIndex().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveProject(project: Project): void {
  const data = JSON.stringify(project);
  localStorage.setItem(`project-${project.id}`, data);
  localStorage.setItem(LAST_PROJECT_KEY, project.id);

  const entries = getIndex();
  const existing = entries.findIndex(e => e.id === project.id);
  const entry: ProjectEntry = {
    id: project.id,
    title: project.title,
    updatedAt: new Date().toISOString(),
  };

  if (existing >= 0) {
    entries[existing] = entry;
  } else {
    entries.push(entry);
  }
  setIndex(entries);
}

export function loadProject(id: string): Project | null {
  try {
    const raw = localStorage.getItem(`project-${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function loadLastProject(): Project | null {
  const lastId = localStorage.getItem(LAST_PROJECT_KEY);
  return lastId ? loadProject(lastId) : null;
}

export function deleteProject(id: string): void {
  localStorage.removeItem(`project-${id}`);
  const entries = getIndex().filter(e => e.id !== id);
  setIndex(entries);

  const lastId = localStorage.getItem(LAST_PROJECT_KEY);
  if (lastId === id) {
    localStorage.removeItem(LAST_PROJECT_KEY);
  }
}

export function downloadProjectAsJson(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[^a-zA-Z0-9-_ ]/g, '')}.rhymes.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as Project;
          if (!data.id || !data.lines) throw new Error('Invalid project file');
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
