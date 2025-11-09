import * as React from "react";
import { toast } from "./use-toast";

export interface Project<T = any> {
  id: string;
  name: string;
  toolName: string;
  data: T;
  createdAt: number;
  updatedAt: number;
  version: string;
}

interface UseProjectOptions<T> {
  toolName: string;
  version?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

/**
 * useProject - Hook for managing project save/load with localStorage
 *
 * Features:
 * - Save/load projects to localStorage
 * - Auto-save functionality
 * - Export/import projects as JSON files
 * - Recent projects list
 * - Project metadata (name, created date, etc.)
 */
export function useProject<T = any>({
  toolName,
  version = "1.0.0",
  autoSave = false,
  autoSaveInterval = 30000, // 30 seconds
}: UseProjectOptions<T>) {
  const [currentProject, setCurrentProject] = React.useState<Project<T> | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout>();

  // Create a new project
  const createNew = React.useCallback((initialData: T, name?: string) => {
    const newProject: Project<T> = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || `Untitled ${toolName} Project`,
      toolName,
      data: initialData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version,
    };

    setCurrentProject(newProject);
    setHasUnsavedChanges(false);

    toast({
      title: "New Project Created",
      description: `"${newProject.name}" is ready.`,
    });

    return newProject;
  }, [toolName, version]);

  // Update current project data
  const updateData = React.useCallback((data: T | ((prev: T) => T)) => {
    setCurrentProject((prev) => {
      if (!prev) return null;

      const newData = typeof data === 'function'
        ? (data as (prev: T) => T)(prev.data)
        : data;

      return {
        ...prev,
        data: newData,
        updatedAt: Date.now(),
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Save to localStorage
  const save = React.useCallback(() => {
    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Create a project first before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const storageKey = `walaw-tools-project-${currentProject.id}`;
      localStorage.setItem(storageKey, JSON.stringify(currentProject));

      // Update recent projects list
      const recentKey = `walaw-tools-recent-${toolName}`;
      const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
      const updated = [
        { id: currentProject.id, name: currentProject.name, updatedAt: currentProject.updatedAt },
        ...recent.filter((p: any) => p.id !== currentProject.id),
      ].slice(0, 10); // Keep only last 10
      localStorage.setItem(recentKey, JSON.stringify(updated));

      setHasUnsavedChanges(false);

      toast({
        title: "Project Saved",
        description: `"${currentProject.name}" has been saved.`,
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save project. Storage might be full.",
        variant: "destructive",
      });
    }
  }, [currentProject, toolName]);

  // Load from localStorage
  const load = React.useCallback((projectId: string) => {
    try {
      const storageKey = `walaw-tools-project-${projectId}`;
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        toast({
          title: "Project Not Found",
          description: "Could not find the project.",
          variant: "destructive",
        });
        return null;
      }

      const project = JSON.parse(stored) as Project<T>;
      setCurrentProject(project);
      setHasUnsavedChanges(false);

      toast({
        title: "Project Loaded",
        description: `"${project.name}" has been loaded.`,
      });

      return project;
    } catch (error) {
      toast({
        title: "Load Failed",
        description: "Failed to load project.",
        variant: "destructive",
      });
      return null;
    }
  }, []);

  // Get recent projects
  const getRecentProjects = React.useCallback(() => {
    try {
      const recentKey = `walaw-tools-recent-${toolName}`;
      const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
      return recent;
    } catch {
      return [];
    }
  }, [toolName]);

  // Export to file
  const exportToFile = React.useCallback(() => {
    if (!currentProject) {
      toast({
        title: "No Project",
        description: "Create a project first before exporting.",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(currentProject, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentProject.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Project Exported",
      description: "Your project has been downloaded.",
    });
  }, [currentProject]);

  // Import from file
  const importFromFile = React.useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Project<T>;

        // Validate
        if (!imported.toolName || imported.toolName !== toolName) {
          toast({
            title: "Import Failed",
            description: "This project is for a different tool.",
            variant: "destructive",
          });
          return;
        }

        // Generate new ID to avoid conflicts
        imported.id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        imported.updatedAt = Date.now();

        setCurrentProject(imported);
        setHasUnsavedChanges(true);

        toast({
          title: "Project Imported",
          description: `"${imported.name}" has been imported.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import project. Invalid file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toolName]);

  // Rename project
  const rename = React.useCallback((newName: string) => {
    setCurrentProject((prev) => {
      if (!prev) return null;
      return { ...prev, name: newName, updatedAt: Date.now() };
    });
    setHasUnsavedChanges(true);
  }, []);

  // Auto-save
  React.useEffect(() => {
    if (!autoSave || !hasUnsavedChanges || !currentProject) return;

    autoSaveTimerRef.current = setTimeout(() => {
      save();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSave, hasUnsavedChanges, currentProject, save, autoSaveInterval]);

  // Warn before leaving with unsaved changes
  React.useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    project: currentProject,
    hasUnsavedChanges,
    createNew,
    updateData,
    save,
    load,
    getRecentProjects,
    exportToFile,
    importFromFile,
    rename,
  };
}
