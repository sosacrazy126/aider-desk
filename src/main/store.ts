import { WindowState, ProjectData, ProjectSettings, SettingsData } from '@common/types';

const DEFAULT_SETTINGS: SettingsData = {
  aider: {
    options: '',
    environmentVariables: '',
  },
  models: {
    preferred: ['claude-3-5-sonnet-20241022', 'deepseek/deepseek-coder', 'claude-3-5-haiku-20241022'],
  },
};

interface StoreSchema {
  windowState: WindowState;
  openProjects: ProjectData[];
  settings: SettingsData;
}

interface CustomStore<T> {
  get<K extends keyof T>(key: K): T[K] | undefined;
  set<K extends keyof T>(key: K, value: T[K]): void;
}

export class Store {
  // @ts-expect-error expected to be initialized
  private store: CustomStore<StoreSchema>;

  async init(): Promise<void> {
    const ElectronStore = (await import('electron-store')).default;
    this.store = new ElectronStore<StoreSchema>() as unknown as CustomStore<StoreSchema>;
  }

  getSettings(): SettingsData {
    const settings = this.store.get('settings');
    return settings || DEFAULT_SETTINGS;
  }

  saveSettings(settings: SettingsData): void {
    this.store.set('settings', settings);
  }

  getOpenProjects(): ProjectData[] {
    return this.store.get('openProjects') || [];
  }

  setOpenProjects(projects: ProjectData[]): void {
    this.store.set('openProjects', projects);
  }

  getProjectSettings(baseDir: string): ProjectSettings | undefined {
    const projects = this.getOpenProjects();
    const project = projects.find((p) => p.baseDir === baseDir);
    return project?.settings;
  }

  saveProjectSettings(baseDir: string, settings: ProjectSettings): void {
    const projects = this.getOpenProjects();
    const projectIndex = projects.findIndex((project) => project.baseDir === baseDir);
    if (projectIndex >= 0) {
      projects[projectIndex] = {
        ...projects[projectIndex],
        settings,
      };
      this.setOpenProjects(projects);
    }
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
