import { WindowState } from '@common/types';

interface StoreSchema {
  windowState: WindowState;
  openProjects: string[];
}

interface CustomStore<T> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
}

export class Store {
  // @ts-expect-error expected to be initialized
  private store: CustomStore<StoreSchema>;

  async init(): Promise<void> {
    const ElectronStore = (await import('electron-store')).default;
    this.store = new ElectronStore<StoreSchema>() as unknown as CustomStore<StoreSchema>;
  }

  getOpenProjects(): string[] {
    return this.store.get('openProjects') || this.getDefaultOpenProjects();
  }

  private getDefaultOpenProjects(): string[] {
    return [];
  }

  setOpenProjects(projects: string[]): void {
    this.store.set('openProjects', projects);
  }

  getWindowState(): StoreSchema['windowState'] {
    return this.store.get('windowState') || this.getDefaultWindowState();
  }

  private getDefaultWindowState(): WindowState {
    return {
      width: 900,
      height: 670,
      x: undefined,
      y: undefined,
      isMaximized: false,
    };
  }

  setWindowState(windowState: WindowState): void {
    this.store.set('windowState', windowState);
  }
}

export const appStore = new Store();
