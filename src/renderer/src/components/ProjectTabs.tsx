import { MdAdd, MdClose } from 'react-icons/md';
import { ProjectData } from '@common/types';

type Props = {
  openProjects: ProjectData[];
  activeProject: ProjectData | undefined;
  onAddProject: () => void;
  onSetActiveProject: (baseDir: string) => void;
  onCloseProject: (projectBaseDir: string, e: React.MouseEvent) => void;
};

export const ProjectTabs = ({ openProjects, activeProject, onAddProject, onSetActiveProject, onCloseProject }: Props) => {
  return (
    <div className="flex items-center">
      {openProjects.map((project) => (
        <button
          key={project.baseDir}
          className={`text-sm pl-3 py-2 pr-1 border-r border-neutral-800 transition-all duration-200 ease-in-out flex items-center gap-3 relative
            ${
              activeProject?.baseDir === project.baseDir
                ? 'bg-gradient-to-b from-neutral-800 to-neutral-800 text-neutral-100 font-medium'
                : 'bg-gradient-to-b from-neutral-950 to-neutral-900  text-neutral-600 hover:bg-neutral-800/50 hover:text-neutral-300'
            }
          `}
          onClick={() => onSetActiveProject(project.baseDir)}
        >
          {project.baseDir.split('/').pop()}
          <div
            className={`flex items-center justify-center rounded-full p-1 transition-colors duration-200
            ${activeProject?.baseDir === project.baseDir ? 'hover:bg-neutral-500/30' : 'hover:bg-neutral-600/30'}
          `}
            onClick={(e) => onCloseProject(project.baseDir, e)}
          >
            <MdClose className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </button>
      ))}
      <button
        className="px-4 py-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30 transition-colors duration-200 flex items-center justify-center"
        onClick={onAddProject}
      >
        <MdAdd className="h-5 w-5" />
      </button>
    </div>
  );
};
