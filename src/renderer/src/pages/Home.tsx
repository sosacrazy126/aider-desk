import { useCallback, useEffect, useState } from 'react';
import { MdSettings } from 'react-icons/md';
import { NoProjectsOpen } from 'components/NoProjectsOpen';
import { ProjectTabs } from 'components/ProjectTabs';
import { ProjectData } from '@common/types';
import { ProjectView } from 'components/ProjectView';
import { OpenProjectDialog } from 'components/OpenProjectDialog';
import { SettingsDialog } from 'components/SettingsDialog';

export const Home = () => {
  const [openProjects, setOpenProjects] = useState<ProjectData[]>([]);
  const [previousProjectBaseDir, setPreviousProjectBaseDir] = useState<string | null>(null);
  const [isOpenProjectDialogVisible, setIsOpenProjectDialogVisible] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isTabbing, setIsTabbing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const activeProject = openProjects.find((project) => project.active) || openProjects[0];

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const openProjects = await window.api.getOpenProjects();
        setOpenProjects(openProjects);
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };

    void loadProjects();
  }, []);

  const setActiveProject = async (baseDir: string) => {
    const projects = await window.api.setActiveProject(baseDir);
    setOpenProjects(projects);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        setIsCtrlPressed(true);
      }

      if (e.key === 'Tab' && isCtrlPressed && openProjects.length > 1) {
        e.preventDefault();
        setIsTabbing(true);
        if (!isTabbing && previousProjectBaseDir && openProjects.some((project) => project.baseDir === previousProjectBaseDir)) {
          // First TAB press - switch to previous tab
          setPreviousProjectBaseDir(activeProject?.baseDir);
          setActiveProject(previousProjectBaseDir);
        } else {
          // Subsequent TAB presses - cycle through tabs
          const currentIndex = openProjects.findIndex((project) => project.baseDir === activeProject?.baseDir);
          const nextIndex = (currentIndex + 1) % openProjects.length;
          setActiveProject(openProjects[nextIndex].baseDir);
          setPreviousProjectBaseDir(activeProject?.baseDir);
        }
      }
    },
    [isCtrlPressed, activeProject?.baseDir, openProjects, previousProjectBaseDir, isTabbing],
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

  const handleAddProject = async (baseDir: string) => {
    const projects = await window.api.addOpenProject(baseDir);
    setOpenProjects(projects);
  };

  const handleCloseProject = async (projectBaseDir: string) => {
    const updatedProjects = await window.api.removeOpenProject(projectBaseDir);
    setOpenProjects(updatedProjects);
  };

  const renderProjectPanels = () =>
    openProjects.map((project) => (
      <div
        key={project.baseDir}
        className="absolute top-0 left-0 w-full h-full"
        style={{
          display: activeProject?.baseDir === project.baseDir ? 'block' : 'none',
        }}
      >
        <ProjectView key={project.baseDir} project={project} isActive={activeProject?.baseDir === project.baseDir} />
      </div>
    ));

  return (
    <div className="flex flex-col h-screen p-[4px] bg-gradient-to-b from-neutral-950 to-neutral-900">
      <div className="flex flex-col h-screen border-2 border-neutral-600">
        <div className="flex border-b-2 border-neutral-600 justify-between bg-gradient-to-b from-neutral-950 to-neutral-900">
          <ProjectTabs
            openProjects={openProjects}
            activeProject={activeProject}
            onAddProject={() => setIsOpenProjectDialogVisible(true)}
            onSetActiveProject={setActiveProject}
            onCloseProject={handleCloseProject}
          />
          <button
            className="px-4 py-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/30 transition-colors duration-200 flex items-center justify-center"
            onClick={() => setShowSettings(true)}
          >
            <MdSettings className="h-5 w-5" />
          </button>
        </div>
        {isOpenProjectDialogVisible && <OpenProjectDialog onClose={() => setIsOpenProjectDialogVisible(false)} onAddProject={handleAddProject} />}
        {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
        <div className="flex-grow overflow-hidden relative">
          {openProjects.length > 0 ? renderProjectPanels() : <NoProjectsOpen onOpenProject={() => setIsOpenProjectDialogVisible(true)} />}
        </div>
      </div>
    </div>
  );
};
