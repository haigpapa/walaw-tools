import * as React from "react";
import { toast } from "./use-toast";

export interface Preset<T = any> {
  id: string;
  name: string;
  description?: string;
  data: T;
  createdAt: number;
  updatedAt: number;
}

interface UsePresetsOptions<T> {
  toolName: string;
  defaultPresets?: Preset<T>[];
}

/**
 * usePresets - Hook for managing presets with localStorage persistence
 *
 * Features:
 * - Save/load presets to localStorage
 * - Import/export presets as JSON
 * - Built-in presets that can't be deleted
 * - Auto-save current state
 */
export function usePresets<T = any>({ toolName, defaultPresets = [] }: UsePresetsOptions<T>) {
  const storageKey = `walaw-tools-presets-${toolName}`;

  // Load presets from localStorage
  const [presets, setPresets] = React.useState<Preset<T>[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return [...defaultPresets, ...parsed];
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    }
    return defaultPresets;
  });

  // Save presets to localStorage (excluding default presets)
  React.useEffect(() => {
    try {
      const userPresets = presets.filter(
        (preset) => !defaultPresets.find((dp) => dp.id === preset.id)
      );
      localStorage.setItem(storageKey, JSON.stringify(userPresets));
    } catch (error) {
      console.error("Failed to save presets:", error);
    }
  }, [presets, storageKey, defaultPresets]);

  // Save a new preset
  const savePreset = React.useCallback((name: string, description: string | undefined, data: T) => {
    const newPreset: Preset<T> = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setPresets((prev) => [...prev, newPreset]);
    toast({
      title: "Preset Saved",
      description: `"${name}" has been saved successfully.`,
    });

    return newPreset;
  }, []);

  // Update an existing preset
  const updatePreset = React.useCallback((id: string, data: Partial<Preset<T>>) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? { ...preset, ...data, updatedAt: Date.now() }
          : preset
      )
    );
    toast({
      title: "Preset Updated",
      description: "Preset has been updated successfully.",
    });
  }, []);

  // Delete a preset
  const deletePreset = React.useCallback((id: string) => {
    // Don't delete default presets
    if (defaultPresets.find((dp) => dp.id === id)) {
      toast({
        title: "Cannot Delete",
        description: "Default presets cannot be deleted.",
        variant: "destructive",
      });
      return;
    }

    setPresets((prev) => prev.filter((preset) => preset.id !== id));
    toast({
      title: "Preset Deleted",
      description: "Preset has been removed.",
    });
  }, [defaultPresets]);

  // Load a preset
  const loadPreset = React.useCallback((id: string): T | null => {
    const preset = presets.find((p) => p.id === id);
    if (preset) {
      return preset.data;
    }
    return null;
  }, [presets]);

  // Export presets as JSON
  const exportPresets = React.useCallback(() => {
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${toolName}-presets-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Presets Exported",
      description: "Your presets have been downloaded.",
    });
  }, [presets, toolName]);

  // Import presets from JSON
  const importPresets = React.useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as Preset<T>[];
        setPresets((prev) => [...prev, ...imported]);
        toast({
          title: "Presets Imported",
          description: `Successfully imported ${imported.length} preset(s).`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import presets. Invalid file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    presets,
    savePreset,
    updatePreset,
    deletePreset,
    loadPreset,
    exportPresets,
    importPresets,
  };
}
