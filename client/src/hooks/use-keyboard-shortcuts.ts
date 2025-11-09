import * as React from "react";

export type ShortcutHandler = (event: KeyboardEvent) => void;

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;  // Command key on Mac
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description?: string;
}

/**
 * useKeyboardShortcuts - Hook for managing keyboard shortcuts
 *
 * Features:
 * - Cross-platform support (Ctrl on Windows/Linux, Cmd on Mac)
 * - Modifier keys support (Ctrl, Meta, Shift, Alt)
 * - Prevent default browser actions
 * - Easy shortcut registration
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 's', meta: true, handler: handleSave, description: 'Save' },
 *   { key: 'z', meta: true, handler: handleUndo, description: 'Undo' },
 *   { key: 'z', meta: true, shift: true, handler: handleRedo, description: 'Redo' },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : true;
        const metaMatches = shortcut.meta ? (event.metaKey || event.ctrlKey) : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        // If meta is specified, use it (Cmd on Mac, Ctrl on Windows)
        // Otherwise check ctrl
        const modifierMatches = shortcut.meta !== undefined
          ? (event.metaKey || event.ctrlKey) === shortcut.meta
          : shortcut.ctrl !== undefined
          ? event.ctrlKey === shortcut.ctrl
          : true;

        if (
          keyMatches &&
          modifierMatches &&
          shiftMatches &&
          altMatches
        ) {
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * useCommonShortcuts - Hook that provides common shortcuts for creative tools
 *
 * @param handlers - Object with common action handlers
 */
export function useCommonShortcuts({
  onSave,
  onNew,
  onOpen,
  onExport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onHelp,
}: {
  onSave?: () => void;
  onNew?: () => void;
  onOpen?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: Shortcut[] = React.useMemo(() => {
    const result: Shortcut[] = [];

    if (onSave) {
      result.push({ key: 's', meta: true, handler: onSave, description: 'Save' });
    }
    if (onNew) {
      result.push({ key: 'n', meta: true, handler: onNew, description: 'New' });
    }
    if (onOpen) {
      result.push({ key: 'o', meta: true, handler: onOpen, description: 'Open' });
    }
    if (onExport) {
      result.push({ key: 'e', meta: true, handler: onExport, description: 'Export' });
    }
    if (onUndo) {
      result.push({ key: 'z', meta: true, handler: onUndo, description: 'Undo' });
    }
    if (onRedo) {
      result.push({ key: 'z', meta: true, shift: true, handler: onRedo, description: 'Redo' });
    }
    if (onZoomIn) {
      result.push({ key: '=', meta: true, handler: onZoomIn, description: 'Zoom In' });
      result.push({ key: '+', meta: true, handler: onZoomIn, description: 'Zoom In' });
    }
    if (onZoomOut) {
      result.push({ key: '-', meta: true, handler: onZoomOut, description: 'Zoom Out' });
    }
    if (onFitToScreen) {
      result.push({ key: '0', meta: true, handler: onFitToScreen, description: 'Fit to Screen' });
    }
    if (onHelp) {
      result.push({ key: 'F1', handler: onHelp, description: 'Help' });
    }

    return result;
  }, [onSave, onNew, onOpen, onExport, onUndo, onRedo, onZoomIn, onZoomOut, onFitToScreen, onHelp]);

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
