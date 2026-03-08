/**
 * Snapshot-based Undo/Redo system for Loopgate Studio
 */
import { useRef, useCallback, useState } from "react";

const MAX_HISTORY = 50;

export function useUndoRedo<T>() {
  const undoStack = useRef<string[]>([]);
  const redoStack = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushSnapshot = useCallback((state: T) => {
    const json = JSON.stringify(state);
    // Don't push if identical to last
    if (undoStack.current.length > 0 && undoStack.current[undoStack.current.length - 1] === json) return;
    undoStack.current.push(json);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = []; // Clear redo on new action
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback((currentState: T): T | null => {
    if (undoStack.current.length === 0) return null;
    const current = JSON.stringify(currentState);
    redoStack.current.push(current);
    const prev = undoStack.current.pop()!;
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
    return JSON.parse(prev) as T;
  }, []);

  const redo = useCallback((currentState: T): T | null => {
    if (redoStack.current.length === 0) return null;
    const current = JSON.stringify(currentState);
    undoStack.current.push(current);
    const next = redoStack.current.pop()!;
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
    return JSON.parse(next) as T;
  }, []);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
