import { createContext, useContext } from 'react';
import { ProjectStore } from './projectStore';
import { PlaybackStore } from './playbackStore';
import { UIStore } from './uiStore';

export class RootStore {
  project = new ProjectStore();
  playback = new PlaybackStore();
  ui = new UIStore();
}

const rootStore = new RootStore();
const StoreContext = createContext<RootStore>(rootStore);

export const StoreProvider = StoreContext.Provider;
export const rootStoreInstance = rootStore;

export function useStore(): RootStore {
  return useContext(StoreContext);
}

export function useProjectStore(): ProjectStore {
  return useContext(StoreContext).project;
}

export function usePlaybackStore(): PlaybackStore {
  return useContext(StoreContext).playback;
}

export function useUIStore(): UIStore {
  return useContext(StoreContext).ui;
}
