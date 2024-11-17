import { useState } from 'react';
import { ProjectPanel } from 'components/ProjectPanel';
import { OpenProjectDialog } from 'components/OpenProjectDialog';
import { MdAdd } from 'react-icons/md';

type Project = {
  baseDir: string;
};

const App = () => {
  const [openProjects, setOpenProjects] = useState<Project[]>([{ baseDir: '/home/wladimiiir/Projects/aider-desktop' }]);
  const [activeTab, setActiveTab] = useState(openProjects[0].baseDir);
  const [isOpenProjectDialogVisible, setIsOpenProjectDialogVisible] = useState(false);

  const handleAddProject = (baseDir: string) => {
    const newProject: Project = { baseDir };
    setOpenProjects([...openProjects, newProject]);
    setActiveTab(baseDir);
    setIsOpenProjectDialogVisible(false);
  };

  const renderProjectPanels = () =>
    openProjects.map((project) => (
      <div key={project.baseDir} className="absolute top-0 left-0 w-full h-full" style={{ display: activeTab === project.baseDir ? 'block' : 'none' }}>
        <ProjectPanel key={project.baseDir} baseDir={project.baseDir} />
      </div>
    ));

  return (
    <div className="flex flex-col h-screen bg-neutral-900">
      <div className="flex border-b">
        {openProjects.map((project) => (
          <button
            key={project.baseDir}
            className={`text-sm px-4 py-2 border-l-2 border-neutral-700 first:border-l-0 transition-colors duration-200 ease-in-out ${activeTab === project.baseDir ? 'bg-neutral-700 text-neutral-100' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-600 hover:text-neutral-300'}`}
            onClick={() => setActiveTab(project.baseDir)}
          >
            {project.baseDir.split('/').pop()}
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
