import { normalizeBaseDir } from '@common/utils';
import { BrowserWindow } from 'electron';
import { McpAgent } from 'src/main/mcp-agent';

import logger from './logger';
import { Project } from './project';
import { Store } from './store';

export class ProjectManager {
  private projects: Project[] = [];

  constructor(
    private readonly mainWindow: BrowserWindow,
    private readonly store: Store,
    private readonly mcpAgent: McpAgent,
  ) {
    this.mainWindow = mainWindow;
    this.store = store;
    this.mcpAgent = mcpAgent;
  }

  private findProject(baseDir: string): Project | undefined {
    baseDir = normalizeBaseDir(baseDir);
    return this.projects.find((project) => normalizeBaseDir(project.baseDir) === baseDir);
  }

  private createProject(baseDir: string) {
    logger.info('Creating new project', { baseDir });
    const project = new Project(this.mainWindow, baseDir, this.store, this.mcpAgent);
    this.projects.push(project);

    // Check if the project is marked as active in the store and initialize MCP agent if needed
    const openProjects = this.store.getOpenProjects();
    const projectData = openProjects.find((p) => normalizeBaseDir(p.baseDir) === normalizeBaseDir(baseDir));
    if (projectData?.active) {
      logger.info('Initializing MCP agent for active project in background', { baseDir });
      void this.mcpAgent.init(project);
    }

    return project;
  }

  public getProject(baseDir: string) {
    let project = this.findProject(baseDir);

    if (!project) {
      project = this.createProject(baseDir);
    }

    return project;
  }

  public async startProject(baseDir: string): Promise<void> {
    logger.info('Starting project', { baseDir });
    const project = this.getProject(baseDir);

    project.start();
  }

  public async stopProject(baseDir: string) {
    const project = this.findProject(baseDir);

    if (!project) {
      logger.warn('No project found to stop', { baseDir });
      return;
    }
    logger.info('Stopping project', { baseDir });
    await project.stop();
  }

  public async restartProject(baseDir: string): Promise<void> {
    await this.stopProject(baseDir);
    this.startProject(baseDir);
  }

  public async close(): Promise<void> {
    logger.info('Stopping all projects');
    await Promise.all(this.projects.map((project) => project.stop()));
    this.projects = [];
  }
}
