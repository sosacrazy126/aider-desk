import { useState, useEffect, useCallback } from 'react';
import { ProjectPanel } from 'components/ProjectPanel';
import { OpenProjectDialog } from 'components/OpenProjectDialog';
import { MdAdd, MdClose } from 'react-icons/md';

const App = () => {
  const [openProjects, setOpenProjects] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [isOpenProjectDialogVisible, setIsOpenProjectDialogVisible] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const [isTabbing, setIsTabbing] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const loadedProjects = await window.api.loadProjects();
        setOpenProjects(loadedProjects);
        setActiveTab(loadedProjects.length > 0 ? loadedProjects[0] : null);
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
        if (!isTabbing && previousTab && openProjects.includes(previousTab)) {
          // First TAB press - switch to previous tab
          setActiveTab(previousTab);
          setPreviousTab(activeTab);
        } else {
          // Subsequent TAB presses - cycle through tabs
          const currentIndex = openProjects.indexOf(activeTab!);
          const nextIndex = (currentIndex + 1) % openProjects.length;
          setActiveTab(openProjects[nextIndex]);
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

  const saveProjects = async (projects: string[]) => {
    try {
      await window.api.saveProjects(projects);
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  };

  const handleAddProject = (baseDir: string) => {
    const projects = [...openProjects, baseDir];
    setOpenProjects(projects);
    setActiveTab(baseDir);
    setIsOpenProjectDialogVisible(false);
    void saveProjects(projects);
  };

  const handleCloseProject = (project: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const projects = openProjects.filter((p) => p !== project);
    setOpenProjects(projects);
    if (activeTab === project) {
      setActiveTab(projects.length > 0 ? projects[projects.length - 1] : null);
    }
    void saveProjects(projects);
  };

  const renderProjectPanels = () =>
    openProjects.map((project) => (
      <div key={project} className="absolute top-0 left-0 w-full h-full" style={{ display: activeTab === project ? 'block' : 'none' }}>
        <ProjectPanel key={project} baseDir={project} />
      </div>
    ));

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <div className="flex border-b">
        {openProjects.map((project) => (
          <button
            key={project}
            className={`text-sm px-4 py-2 border-l-2 border-neutral-700 first:border-l-0 transition-colors duration-200 ease-in-out flex items-center gap-2 ${activeTab === project ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-300'}`}
            onClick={() => setActiveTab(project)}
          >
            {project.split('/').pop()}
            <MdClose className="h-4 w-4 opacity-60 hover:opacity-100" onClick={(e) => handleCloseProject(project, e)} />
          </button>
        ))}
        <button
          className="px-3 py-2 text-neutral-400 hover:text-neutral-200 flex items-center justify-center"
          onClick={() => setIsOpenProjectDialogVisible(true)}
        >
          <MdAdd className="h-5 w-5" />
        </button>
      </div>
      {isOpenProjectDialogVisible && <OpenProjectDialog onClose={() => setIsOpenProjectDialogVisible(false)} onAddProject={handleAddProject} />}
      <div className="flex-grow overflow-hidden relative">{renderProjectPanels()}</div>
    </div>
  );
};

export default App;
