import { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdClose, MdSettings } from 'react-icons/md';
import { ProjectData, ProjectSettings } from '@common/types';
import { ProjectView } from 'components/ProjectView';
import { OpenProjectDialog } from 'components/OpenProjectDialog';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from 'utils/routes';

const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  codeBlockExpanded: false,
};

export const Home = () => {
  const [openProjects, setOpenProjects] = useState<ProjectData[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [isOpenProjectDialogVisible, setIsOpenProjectDialogVisible] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isTabbing, setIsTabbing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await window.api.loadProjects();
        setOpenProjects(loadedProjects);
        setActiveTab(loadedProjects.length > 0 ? loadedProjects[0].baseDir : null);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    void loadProjects();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }

      if (e.key === 'Tab' && isCtrlPressed && openProjects.length > 1) {
        e.preventDefault();
        setIsTabbing(true);
        if (!isTabbing && previousTab && openProjects.some((project) => project.baseDir === previousTab)) {
          // First TAB press - switch to previous tab
          setActiveTab(previousTab);
          setPreviousTab(activeTab);
        } else {
          // Subsequent TAB presses - cycle through tabs
          const currentIndex = openProjects.findIndex((project) => project.baseDir === activeTab);
          const nextIndex = (currentIndex + 1) % openProjects.length;
          setActiveTab(openProjects[nextIndex].baseDir);
          setPreviousTab(activeTab);
        }
      }
    },
    [isCtrlPressed, activeTab, openProjects, previousTab, isTabbing],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Control') {
      setIsCtrlPressed(false);
      setIsTabbing(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const saveProjects = async (projects: ProjectData[]) => {
    try {
      await window.api.saveProjects(projects);
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  const handleAddProject = (baseDir: string) => {
    const newProject: ProjectData = {
      baseDir,
      settings: {
        ...DEFAULT_PROJECT_SETTINGS,
      },
    };
    const projects = [...openProjects, newProject];
    setOpenProjects(projects);
    setActiveTab(baseDir);
    setIsOpenProjectDialogVisible(false);
    void saveProjects(projects);
  };

  const handleCloseProject = (project: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const projects = openProjects.filter((p) => p.baseDir !== project);
    setOpenProjects(projects);
    if (activeTab === project) {
      setActiveTab(projects.length > 0 ? projects[projects.length - 1].baseDir : null);
    }
    void saveProjects(projects);
  };

  const renderProjectPanels = () =>
    openProjects.map((project) => (
      <div key={project.baseDir} className="absolute top-0 left-0 w-full h-full" style={{ display: activeTab === project.baseDir ? 'block' : 'none' }}>
        <ProjectView key={project.baseDir} project={project} isActive={activeTab === project.baseDir} />
      </div>
    ));

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <div className="flex border-b border-neutral-700 justify-between bg-neutral-900">
        <div className="flex items-center">
          {openProjects.map((project) => (
            <button
              key={project.baseDir}
              className={`text-sm px-6 py-3 transition-all duration-200 ease-in-out flex items-center gap-3 relative group
                ${
                  activeTab === project.baseDir
                    ? 'bg-neutral-800 text-neutral-100 font-medium'
                    : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-300'
                }
                ${activeTab === project.baseDir ? 'after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-neutral-700' : ''}
              `}
              onClick={() => setActiveTab(project.baseDir)}
            >
              {project.baseDir.split('/').pop()}
              <div
                className={`flex items-center justify-center rounded-full p-1 transition-colors duration-200
                  ${activeTab === project.baseDir ? 'hover:bg-neutral-500/30' : 'hover:bg-neutral-600/30'}
                `}
                onClick={(e) => handleCloseProject(project.baseDir, e)}
              >
                <MdClose className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
            </button>
          ))}
          <button
            className="px-4 py-3 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30 transition-colors duration-200 flex items-center justify-center"
            onClick={() => setIsOpenProjectDialogVisible(true)}
          >
            <MdAdd className="h-5 w-5" />
          </button>
        </div>
        <button
          className="px-4 py-3 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30 transition-colors duration-200 flex items-center justify-center"
          onClick={() => navigate(ROUTES.Settings)}
        >
          <MdSettings className="h-5 w-5" />
        </button>
      </div>
      {isOpenProjectDialogVisible && <OpenProjectDialog onClose={() => setIsOpenProjectDialogVisible(false)} onAddProject={handleAddProject} />}
      <div className="flex-grow overflow-hidden relative">{renderProjectPanels()}</div>
    </div>
  );
};
