import { BrowserWindow } from 'electron';
import { parse } from '@dotenvx/dotenvx';
import { normalizeBaseDir } from '@common/utils';
import { Project } from './project';
import { Store } from './store';
import logger from './logger';

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
    const mainModel = this.store!.getProjectSettings(project.baseDir)?.mainModel;
    const weakModel = this.store!.getProjectSettings(project.baseDir)?.weakModel;
    const environmentVariables = parse(settings.aider.environmentVariables);

    logger.info('Running Aider for project', {
      baseDir: project.baseDir,
      mainModel,
      weakModel,
    });
    project.runAider(settings.aider.options, environmentVariables, mainModel, weakModel);
  }

  private findProject(baseDir: string): Project | undefined {
    baseDir = normalizeBaseDir(baseDir);
    return this.projects.find((project) => normalizeBaseDir(project.baseDir) === baseDir);
  }

  public getProject(baseDir: string): Project {
    let project = this.findProject(baseDir);

    if (!project) {
      logger.info('Creating new project', { baseDir });
      project = new Project(this.mainWindow!, baseDir);
      this.projects.push(project);
    }

    return project;
  }

  public startProject(baseDir: string): void {
    logger.info('Starting project', { baseDir });
    const project = this.getProject(baseDir);

    project.contextFiles.forEach((contextFile) => {
      this.mainWindow?.webContents.send('file-added', {
        baseDir,
        file: contextFile,
      });
    });

    this.runAiderForProject(project);
  }

  public async stopProject(baseDir: string) {
    const project = this.findProject(baseDir);

    if (!project) {
      logger.warn('No project found to stop', { baseDir });
      return;
    }
    logger.info('Stopping project', { baseDir });
    await project.killAider();
  }

  public async restartProject(baseDir: string): Promise<void> {
    await this.stopProject(baseDir);
    this.startProject(baseDir);
  }

  public async close(): Promise<void> {
    logger.info('Stopping all projects');
    await Promise.all(this.projects.map((project) => project.killAider()));
    this.projects = [];
  }
}

export const projectManager = ProjectManager.getInstance();
