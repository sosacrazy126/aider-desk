import { BrowserWindow } from 'electron';
import { Project } from './project';

class ProjectManager {
  private static instance: ProjectManager;
  private projects: Project[] = [];
  private mainWindow: BrowserWindow | null = null;

  private constructor() {}

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public init(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow;
  }

  public getProject(baseDir: string): Project {
    let project = this.projects.find((project) => project.baseDir === baseDir);

    if (!project) {
      project = new Project(this.mainWindow!, baseDir);
      this.projects.push(project);
    }

    return project;
  }

  public startProject(baseDir: string): void {
    const project = this.getProject(baseDir);

    project.contextFiles.forEach((contextFile) => {
      this.mainWindow?.webContents.send('file-added', {
        baseDir,
        path: contextFile.path,
        readOnly: contextFile.readOnly,
      });
    });

    project.runAider(baseDir);
  }

  public stopProject(baseDir: string): void {
    const project = this.projects.find((project) => project.baseDir === baseDir);

    if (!project) {
      console.log(`No project found with base directory ${baseDir}`);
      return;
    }
    project.killAider();
  }

  public stopProjects(): void {
    this.projects.forEach((project) => {
      project.killAider();
    });
    this.projects = [];
  }
}

export const projectManager = ProjectManager.getInstance();
