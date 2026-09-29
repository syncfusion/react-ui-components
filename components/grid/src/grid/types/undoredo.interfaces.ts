import { ValueType } from './interfaces';
import { StagedRowData } from './batch-edit.interfaces';


/**
 * Represents a single undoable action in the grid's undo/redo history.
 * Stores the action type, affected data, and state information for reversal or reapplication.
 *
 * @private
 */
export interface UndoRedoAction<T = unknown> {
    /** Unique identifier for this action. */
    id: string;

    /** Type of action (edit, add, delete, paste, cut, autofill, batch-save). */
    actionType: 'edit' | 'add' | 'delete' | 'paste' | 'cut' | 'autofill' | 'fill-handle' | 'batch-save';

    /** Timestamp when the action was recorded. */
    timestamp: number;

    /** Previous state before the action was committed. */
    previousState: UndoRedoState<T>;

    /** New state after the action was committed. */
    currentState: UndoRedoState<T>;

    /** For batch operations, contains all rows affected in the batch. */
    batchRows?: StagedRowData<T>[];

    /** Indicates whether this action is a staged batch edit that has not yet been committed. */
    isStaged?: boolean;
}

/**
 * Represents the grid state at a point in history.
 * Captures affected rows and their data before/after an action.
 *
 * @private
 */
export interface UndoRedoState<T = unknown> {
    /** Affected row data for the action. */
    rows: T[];

    /** Row indices affected by the action in the canonical data source. */
    rowIndices: number[];

    /** Primary keys of affected rows for identity preservation. */
    rowKeys: (string | number)[];

    /** For cell edits, identifies the specific cell field that changed. */
    cellField?: string;

    /** For cell edits, the previous cell value. */
    cellPreviousValue?: ValueType;

    /** For cell edits, the new cell value. */
    cellCurrentValue?: ValueType;

    /** For row edits, identifies which fields were changed in the row. */
    changedFields?: string[];
}

/**
 * Configuration settings for undo/redo behavior in the grid.
 * Extends EditSettings to add undo/redo-specific options.
 *
 * @private
 */
export interface UndoRedoSettings {
    /**
     * Enables undo/redo history tracking for grid operations.
     * When false, no history is recorded and undo/redo methods have no effect.
     *
     * @default false
     */
    allowUndoRedo?: boolean;

    /**
     * Enables undo/redo of unsaved staged cell changes during batch editing.
     * Only effective when `allowBatchSave=true` and `allowUndoRedo=true`.
     * When false, batch cell edits are recorded only when the batch is committed.
     *
     * @default false
     */
    allowBatchUndoRedo?: boolean;

    /**
     * Maximum number of undo actions to maintain in the history stack.
     * When exceeded, the oldest action is removed.
     * Non-positive or non-finite values normalize to the default.
     *
     * @default 5
     */
    undoRedoLimit?: number;
}

/**
 * Result type for the useUndoRedo hook.
 * Provides undo/redo state, methods, and event handlers.
 *
 * @private
 */
export interface UseUndoRedoResult {
    /** Current number of undoable actions in the stack. */
    undoActionsCount: number;

    /** Current number of redoable actions in the stack. */
    redoActionsCount: number;

    /** Indicates whether undo is currently available. */
    canUndo: boolean;

    /** Indicates whether redo is currently available. */
    canRedo: boolean;

    /** Reverts the most recent action and moves it to the redo stack. */
    undo: () => Promise<void>;

    /** Reapplies the most recently undone action and moves it back to the undo stack. */
    redo: () => Promise<void>;

    /** Returns the current number of undo actions available. */
    getUndoActionsCount: () => number;

    /** Returns the current number of redo actions available. */
    getRedoActionsCount: () => number;

    /** Clears all undo and redo actions from history. */
    clearHistory: () => void;

    /** Adds an action to the undo stack; removes oldest if limit exceeded. */
    recordAction: (action: UndoRedoAction) => void;

    /** Removes the most recent action from the undo stack (e.g., on operation failure). */
    removeLastAction: () => void;

    /** Removes temporary staged batch actions after a batch is committed or cancelled. */
    clearStagedActions: () => void;
}

/**
 * Event fired when an undo operation begins.
 * Supports cancellation before reverting the action.
 *
 * @private
 */
export interface UndoStartEvent {
    /** The action being undone, or undefined when the undo stack is empty. */
    action?: UndoRedoAction;

    /** The operation type being undone. */
    actionType?: UndoRedoAction['actionType'];

    /** Indicates whether an undo action was applied. */
    actionApplied: boolean;

    /** Number of undo actions available at event dispatch. */
    undoActionsCount: number;

    /** Number of redo actions available at event dispatch. */
    redoActionsCount: number;

    /** Set to true to cancel the undo operation. */
    cancel?: boolean;
}

/**
 * Event fired when an undo operation completes successfully.
 *
 * @private
 */
export interface UndoCompleteEvent {
    /** The action that was undone, or undefined when no action was available. */
    action?: UndoRedoAction;

    /** The operation type that was undone. */
    actionType?: UndoRedoAction['actionType'];

    /** Indicates whether an undo action was applied. */
    actionApplied: boolean;

    /** Number of undo actions available after completion. */
    undoActionsCount: number;

    /** Number of redo actions available after completion. */
    redoActionsCount: number;

    /** Timestamp when the undo completed. */
    completedAt: number;
}

/**
 * Event fired when a redo operation begins.
 * Supports cancellation before reapplying the action.
 *
 * @private
 */
export interface RedoStartEvent {
    /** The action being redone, or undefined when the redo stack is empty. */
    action?: UndoRedoAction;

    /** The operation type being redone. */
    actionType?: UndoRedoAction['actionType'];

    /** Indicates whether a redo action was applied. */
    actionApplied: boolean;

    /** Number of undo actions available at event dispatch. */
    undoActionsCount: number;

    /** Number of redo actions available at event dispatch. */
    redoActionsCount: number;

    /** Set to true to cancel the redo operation. */
    cancel?: boolean;
}

/**
 * Event fired when a redo operation completes successfully.
 *
 * @private
 */
export interface RedoCompleteEvent {
    /** The action that was redone, or undefined when no action was available. */
    action?: UndoRedoAction;

    /** The operation type that was redone. */
    actionType?: UndoRedoAction['actionType'];

    /** Indicates whether a redo action was applied. */
    actionApplied: boolean;

    /** Number of undo actions available after completion. */
    undoActionsCount: number;

    /** Number of redo actions available after completion. */
    redoActionsCount: number;

    /** Timestamp when the redo completed. */
    completedAt: number;
}

/**
 * Union type for all undo/redo related events.
 *
 * @private
 */
export type UndoRedoEvent =
  | UndoStartEvent
  | UndoCompleteEvent
  | RedoStartEvent
  | RedoCompleteEvent;
