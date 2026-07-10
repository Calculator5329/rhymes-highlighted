import type { Line, Project, RhymeGroup, SyllableSegment, Word } from '../core/types';

export const PROJECT_SERIALIZATION_VERSION = 1;

const INDEX_KEY = 'rhymes-highlighted-projects';
const LAST_PROJECT_KEY = 'rhymes-highlighted-last-project';
const PROJECT_KEY_PREFIX = 'rhymes-highlighted-project-';
const LEGACY_PROJECT_KEY_PREFIX = 'project-';

export interface ProjectEntry {
  id: string;
  title: string;
  updatedAt: string;
}

interface SerializedProject {
  version: typeof PROJECT_SERIALIZATION_VERSION;
  project: Project;
}

interface ProjectIndex {
  version: typeof PROJECT_SERIALIZATION_VERSION;
  projects: ProjectEntry[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOptionalString(value: Record<string, unknown>, key: string): boolean {
  return value[key] === undefined || typeof value[key] === 'string';
}

function hasOptionalNumber(value: Record<string, unknown>, key: string): boolean {
  return value[key] === undefined || (typeof value[key] === 'number' && Number.isFinite(value[key]));
}

function isSyllableSegment(value: unknown): value is SyllableSegment {
  return isRecord(value)
    && typeof value.text === 'string'
    && hasOptionalString(value, 'rhymeGroupId');
}

function isWord(value: unknown): value is Word {
  return isRecord(value)
    && typeof value.text === 'string'
    && Number.isInteger(value.lineIndex)
    && Number.isInteger(value.wordIndex)
    && hasOptionalString(value, 'rhymeGroupId')
    && hasOptionalNumber(value, 'startMs')
    && hasOptionalNumber(value, 'endMs')
    && (value.syllables === undefined
      || (Array.isArray(value.syllables) && value.syllables.every(isSyllableSegment)));
}

function isLine(value: unknown): value is Line {
  return isRecord(value)
    && typeof value.rawText === 'string'
    && Array.isArray(value.words)
    && value.words.every(isWord);
}

function isRhymeGroup(value: unknown): value is RhymeGroup {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.color === 'string'
    && hasOptionalString(value, 'label')
    && hasOptionalString(value, 'name');
}

function isProject(value: unknown): value is Project {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.title === 'string'
    && Array.isArray(value.lines)
    && value.lines.every(isLine)
    && Array.isArray(value.rhymeGroups)
    && value.rhymeGroups.every(isRhymeGroup)
    && hasOptionalString(value, 'audioFile');
}

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function projectKey(id: string): string {
  return `${PROJECT_KEY_PREFIX}${id}`;
}

export function serializeProject(project: Project): string {
  const value: SerializedProject = {
    version: PROJECT_SERIALIZATION_VERSION,
    project,
  };
  return JSON.stringify(value);
}

export function parseSerializedProject(serialized: string): Project | null {
  try {
    const value: unknown = JSON.parse(serialized);

    if (isRecord(value) && value.version === PROJECT_SERIALIZATION_VERSION && isProject(value.project)) {
      return value.project;
    }

    // Projects created before versioned serialization were stored directly.
    return isProject(value) ? value : null;
  } catch {
    return null;
  }
}

function isProjectEntry(value: unknown): value is ProjectEntry {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.title === 'string'
    && typeof value.updatedAt === 'string'
    && !Number.isNaN(Date.parse(value.updatedAt));
}

function readIndex(storage: Storage): ProjectEntry[] {
  try {
    const raw = storage.getItem(INDEX_KEY);
    if (!raw) return [];

    const value: unknown = JSON.parse(raw);
    const entries = Array.isArray(value)
      ? value
      : isRecord(value) && value.version === PROJECT_SERIALIZATION_VERSION && Array.isArray(value.projects)
        ? value.projects
        : [];

    return entries.filter(isProjectEntry);
  } catch {
    return [];
  }
}

function writeIndex(storage: Storage, projects: ProjectEntry[]): boolean {
  try {
    const value: ProjectIndex = { version: PROJECT_SERIALIZATION_VERSION, projects };
    storage.setItem(INDEX_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function listSavedProjects(): ProjectEntry[] {
  const storage = getStorage();
  if (!storage) return [];

  return readIndex(storage)
    .filter(entry => loadProject(entry.id) !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveProject(project: Project): boolean {
  const storage = getStorage();
  if (!storage || !isProject(project)) return false;

  try {
    storage.setItem(projectKey(project.id), serializeProject(project));
  } catch {
    return false;
  }

  try {
    storage.setItem(LAST_PROJECT_KEY, project.id);
  } catch {
    // The project itself was saved; a blocked convenience pointer is harmless.
  }

  const projects = readIndex(storage).filter(entry => entry.id !== project.id);
  projects.push({
    id: project.id,
    title: project.title,
    updatedAt: new Date().toISOString(),
  });
  writeIndex(storage, projects);
  return true;
}

export function loadProject(id: string): Project | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(projectKey(id)) ?? storage.getItem(`${LEGACY_PROJECT_KEY_PREFIX}${id}`);
    return raw ? parseSerializedProject(raw) : null;
  } catch {
    return null;
  }
}

export function loadLastProject(): Project | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const id = storage.getItem(LAST_PROJECT_KEY);
    return id ? loadProject(id) : null;
  } catch {
    return null;
  }
}

export function deleteProject(id: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(projectKey(id));
    storage.removeItem(`${LEGACY_PROJECT_KEY_PREFIX}${id}`);
  } catch {
    // Continue attempting to clean up the index.
  }

  writeIndex(storage, readIndex(storage).filter(entry => entry.id !== id));

  try {
    if (storage.getItem(LAST_PROJECT_KEY) === id) {
      storage.removeItem(LAST_PROJECT_KEY);
    }
  } catch {
    // Storage may be unavailable in privacy mode.
  }
}

export function downloadProjectAsJson(project: Project): void {
  const blob = new Blob([serializeProject(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${project.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'Untitled'}.rhymes.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.rhymes.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const project = typeof reader.result === 'string'
          ? parseSerializedProject(reader.result)
          : null;
        if (project) resolve(project);
        else reject(new Error('Invalid project file'));
      };
      reader.onerror = () => reject(new Error('Could not read project file'));
      reader.readAsText(file);
    };
    input.click();
  });
}
