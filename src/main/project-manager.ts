import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { AIDER_COMMAND } from './constants';

interface Project {
  baseDir: string;
  process?: ChildProcessWithoutNullStreams;
}

class ProjectManager {
  private static instance: ProjectManager;
  private projects: Project[] = [];

  private constructor() {}

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  private runAider(baseDir: string): ChildProcessWithoutNullStreams {
    const process = spawn(AIDER_COMMAND, [baseDir], {
      cwd: baseDir,
      shell: true,
    });

    process.stdout.on('data', (data) => {
      console.log(`Aider stdout (${baseDir}): ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`Aider stderr (${baseDir}): ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Aider process exited with code ${code} (${baseDir})`);
    });

    return process;
  }

  public startProject(baseDir: string): void {
    if (this.projects.some((project) => project.baseDir === baseDir)) {
      console.log(`Project with base directory ${baseDir} is already running`);
      return;
    }

    const newProject: Project = {
      baseDir,
      process: this.runAider(baseDir),
    };
    this.projects.push(newProject);
  }

  public stopProject(baseDir: string): void {
    const projectIndex = this.projects.findIndex((project) => project.baseDir === baseDir);

    if (projectIndex === -1) {
      console.log(`No project found with base directory ${baseDir}`);
      return;
    }

    const project = this.projects[projectIndex];

    if (project.process) {
      project.process.kill();
    }

    this.projects.splice(projectIndex, 1);
  }

  public stopProjects(): void {
    this.projects.forEach((project) => {
      if (project.process) {
        project.process.kill();
      }
    });
    this.projects = [];
  }
}

export const projectManager = ProjectManager.getInstance();
