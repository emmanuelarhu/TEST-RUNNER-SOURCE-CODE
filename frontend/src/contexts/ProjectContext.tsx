import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api.service';
import type { Project } from '../types';

interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  setCurrentProject: (project: Project) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.projects.getAll();
      // Backend returns ApiResponse<Project[]>: { success: true, data: [...], count: n }
      const fetchedProjects = response.data.data;
      setProjects(fetchedProjects);

      // Set first project as current if none selected
      if (fetchedProjects.length > 0 && !currentProject) {
        const savedProjectId = localStorage.getItem('selectedProjectId');
        const projectToSelect = savedProjectId
          ? fetchedProjects.find(p => p.id === savedProjectId) || fetchedProjects[0]
          : fetchedProjects[0];
        setCurrentProjectState(projectToSelect);
      }
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
    localStorage.setItem('selectedProjectId', project.id);
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        loading,
        error,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
