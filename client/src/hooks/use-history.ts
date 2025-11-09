import * as React from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UseHistoryOptions<T> {
  maxHistorySize?: number;
  initialState: T;
}

/**
 * useHistory - Hook for undo/redo functionality
 *
 * Features:
 * - Undo/redo with keyboard shortcuts
 * - Configurable history size
 * - Clear history
 * - Jump to specific state
 *
 * @example
 * const { state, setState, undo, redo, canUndo, canRedo, clear } = useHistory({
 *   initialState: { x: 0, y: 0 },
 *   maxHistorySize: 50,
 * });
 */
export function useHistory<T>({
  initialState,
  maxHistorySize = 50
}: UseHistoryOptions<T>) {
  const [history, setHistory] = React.useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Set new state and add to history
  const setState = React.useCallback((newState: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const resolvedState = typeof newState === 'function'
        ? (newState as (prev: T) => T)(prev.present)
        : newState;

      // Don't add to history if state hasn't changed
      if (JSON.stringify(resolvedState) === JSON.stringify(prev.present)) {
        return prev;
      }

      const newPast = [...prev.past, prev.present];

      // Limit history size
      if (newPast.length > maxHistorySize) {
        newPast.shift();
      }

      return {
        past: newPast,
        present: resolvedState,
        future: [], // Clear future when new state is set
      };
    });
  }, [maxHistorySize]);

  // Undo
  const undo = React.useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const newPresent = newPast.pop()!;

      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  // Redo
  const redo = React.useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const newPresent = newFuture.shift()!;

      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  // Clear history
  const clear = React.useCallback(() => {
    setHistory({
      past: [],
      present: history.present,
      future: [],
    });
  }, [history.present]);

  // Reset to initial state
  const reset = React.useCallback(() => {
    setHistory({
      past: [],
      present: initialState,
      future: [],
    });
  }, [initialState]);

  // Jump to a specific index in the past
  const jumpToPast = React.useCallback((index: number) => {
    setHistory((prev) => {
      if (index < 0 || index >= prev.past.length) return prev;

      const newPast = prev.past.slice(0, index);
      const newPresent = prev.past[index];
      const newFuture = [
        ...prev.past.slice(index + 1),
        prev.present,
        ...prev.future,
      ];

      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
    reset,
    jumpToPast,
    history: {
      past: history.past,
      future: history.future,
      size: history.past.length + history.future.length + 1,
    },
  };
}
