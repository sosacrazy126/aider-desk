import { BrowserWindow } from 'electron';
import { parse } from '@dotenvx/dotenvx';
import { Project } from './project';
import { Store } from './store';

class ProjectManager {
  private static instance: ProjectManager;
  private projects: Project[] = [];
  private mainWindow: BrowserWindow | null = null;
  private store: Store | null = null;

  private constructor() {}

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public init(mainWindow: BrowserWindow, store: Store): void {
    this.mainWindow = mainWindow;
    this.store = store;
  }

  private runAiderForProject(project: Project): void {
    const settings = this.store!.getSettings();
    const environmentVariables = parse(settings.aider.environmentVariables);
    project.runAider(settings.aider.options, environmentVariables);
  }

  public getProject(baseDir: string): Project {
    let project = this.projects.find((project) => project.baseDir === baseDir);

    if (!project) {
      project = new Project(this.mainWindow!, baseDir);
      this.projects.push(project);
      this.runAiderForProject(project);
    }

    return project;
  }

  public startProject(baseDir: string): void {
    const project = this.getProject(baseDir);

    project.contextFiles.forEach((contextFile) => {
      this.mainWindow?.webContents.send('file-added', {
        baseDir,
        file: contextFile,
      });
    });

    this.runAiderForProject(project);
  }

  public stopProject(baseDir: string): void {
    const project = this.projects.find((project) => project.baseDir === baseDir);

    if (!project) {
      console.log(`No project found with base directory ${baseDir}`);
      return;
    }
    project.killAider();
  }

  public close(): void {
    console.log('Stopping all projects...');
    this.projects.forEach((project) => {
      project.killAider();
    });
    this.projects = [];
  }
}

export const projectManager = ProjectManager.getInstance();
