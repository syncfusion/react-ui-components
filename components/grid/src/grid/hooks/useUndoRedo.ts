import { useState, useCallback, useRef, useEffect, RefObject, Dispatch, SetStateAction } from 'react';
import { GridRef } from '../types/grid.interfaces';
import { EditSettings } from '../types/edit.interfaces';
import { StagedRowData, UseBatchEditResult } from '../types/batch-edit.interfaces';
import {
    UndoRedoAction,
    UndoRedoSettings,
    UseUndoRedoResult,
    UndoStartEvent,
    UndoCompleteEvent,
    RedoStartEvent,
    RedoCompleteEvent,
    UndoRedoState
} from '../types/undoredo.interfaces';
import { getValue } from '@syncfusion/react-base/src/util';
import { DataUtil } from '@syncfusion/react-data';
import { ColumnProps } from '../types/column.interfaces';
import { IRow } from '../types/interfaces';

/** Flag to prevent recursive history recording during undo/redo application. */
let isApplyingHistory: boolean = false;

const requestToolbarRefresh: (gridRef: RefObject<GridRef>) => void = <T, >(gridRef: RefObject<GridRef<T>>): void => {
    setTimeout(() => {
        gridRef.current?.element?.dispatchEvent(new CustomEvent('toolbarRefresh'));
    }, 0);
};

/**
 * Hook for managing undo/redo history in the grid.
 * Maintains separate undo and redo stacks, respects configuration limits,
 * and coordinates state reversal/reapplication with the grid's data operations.
 *
 * @private
 * @template T
 * @param {RefObject<GridRef<T>>} gridRef - Reference to the grid instance.
 * @param {EditSettings<T>} editSettings - Edit and undo/redo configuration.
 * @param {Object} eventHandlers - Optional event callbacks for undo and redo lifecycle events.
 * @param {Function} eventHandlers.onUndoStart - Undo start event callback.
 * @param {Function} eventHandlers.onUndoComplete - Undo completion event callback.
 * @param {Function} eventHandlers.onRedoStart - Redo start event callback.
 * @param {Function} eventHandlers.onRedoComplete - Redo completion event callback.
 * @param {RefObject<UseBatchEditResult<T> | undefined>} batchEditModuleRef - Optional batch edit module reference.
 * @param {Dispatch<SetStateAction<T[]>>} setCurrentViewData - Optional current-view update callback.
 * @param {Function} restoreRowDataForUndo - Optional row restore callback.
 * @returns {UseUndoRedoResult} Undo/redo state and methods.
 */
export function useUndoRedo<T = unknown>(
    gridRef: RefObject<GridRef<T>>,
    editSettings: (EditSettings<T> & UndoRedoSettings) | undefined,
    eventHandlers?: {
        onUndoStart?: (event: UndoStartEvent) => void;
        onUndoComplete?: (event: UndoCompleteEvent) => void;
        onRedoStart?: (event: RedoStartEvent) => void;
        onRedoComplete?: (event: RedoCompleteEvent) => void;
    },
    batchEditModuleRef?: RefObject<UseBatchEditResult<T> | undefined>,
    setCurrentViewData?: Dispatch<SetStateAction<T[]>>,
    restoreRowDataForUndo?: (key: string | number, data: T, rowIndex?: number) => Promise<void>
): UseUndoRedoResult {
    const [undoStack, setUndoStack] = useState<UndoRedoAction<T>[]>([]);
    const [redoStack, setRedoStack] = useState<UndoRedoAction<T>[]>([]);
    const undoStackRef: React.RefObject<UndoRedoAction<T>[]> = useRef<UndoRedoAction<T>[]>(undoStack);
    const redoStackRef: React.RefObject<UndoRedoAction<T>[]> = useRef<UndoRedoAction<T>[]>(redoStack);
    const restoreRowDataForUndoRef: React.RefObject<((key: string | number, data: T, rowIndex?:
    number) => Promise<void>) | undefined> = useRef(restoreRowDataForUndo);

    undoStackRef.current = undoStack;
    redoStackRef.current = redoStack;
    restoreRowDataForUndoRef.current = restoreRowDataForUndo;

    useEffect(() => {
        requestToolbarRefresh(gridRef);
    }, [gridRef, undoStack, redoStack]);

    const settingsRef: React.RefObject<{
        allowUndoRedo: boolean;
        allowBatchUndoRedo: boolean;
        undoRedoLimit: number;
        allowBatchSave: boolean;
    }> = useRef({
        allowUndoRedo: editSettings?.allowUndoRedo ?? false,
        allowBatchUndoRedo: editSettings?.allowBatchUndoRedo ?? false,
        undoRedoLimit: normalizeLimit(editSettings?.undoRedoLimit ?? 5),
        allowBatchSave: editSettings?.allowBatchSave ?? false
    });

    settingsRef.current = {
        allowUndoRedo: editSettings?.allowUndoRedo ?? false,
        allowBatchUndoRedo:
            (editSettings?.allowBatchUndoRedo ?? false) && (editSettings?.allowBatchSave ?? false),
        undoRedoLimit: normalizeLimit(editSettings?.undoRedoLimit ?? 5),
        allowBatchSave: editSettings?.allowBatchSave ?? false
    };

    /**
     * Normalize the undo/redo limit to ensure it is a valid positive integer.
     * Non-positive or non-finite values default to 5.
     *
     * @param {number | undefined} [limit] - The configured undo/redo limit.
     * @returns {number} The normalized undo/redo limit.
     */
    function normalizeLimit(limit: number | undefined): number {
        if (!limit || !Number.isFinite(limit) || limit <= 0) {
            return 5;
        }

        return Math.floor(limit);
    }

    /**
     * Record a new undo action.
     * Clears the redo stack and enforces the undo limit.
     * Ignores actions recorded during undo/redo application to prevent recursion.
     */
    const recordAction: (action: UndoRedoAction<T>) => void = useCallback((action: UndoRedoAction<T>): void => {
        if (!settingsRef.current.allowUndoRedo || isApplyingHistory) {
            return;
        }

        setUndoStack((prevStack: UndoRedoAction<T>[]) => {
            let newStack: UndoRedoAction<T>[] = [action, ...prevStack];

            if (newStack.length > settingsRef.current.undoRedoLimit) {
                newStack = newStack.slice(0, settingsRef.current.undoRedoLimit);
            }

            return newStack;
        });

        setRedoStack([]);
    }, []);

    /**
     * Remove the last action from the undo stack (e.g., if the operation failed).
     */
    const removeLastAction: () => void = useCallback((): void => {
        setUndoStack((prevStack: UndoRedoAction<T>[]) => {
            if (prevStack.length === 0) {
                return prevStack;
            }

            return prevStack.slice(1);
        });
    }, []);

    const clearStagedActions: () => void = useCallback((): void => {
        setUndoStack((prevStack: UndoRedoAction<T>[]) => prevStack.filter((action: UndoRedoAction<T>) => !action.isStaged));
        setRedoStack((prevStack: UndoRedoAction<T>[]) => prevStack.filter((action: UndoRedoAction<T>) => !action.isStaged));
    }, []);

    const updateRenderedStagedRow: (key: string | number, field: string, value: unknown) => void =
        useCallback((key: string | number, field: string, value: unknown): void => {
            const primaryKeyField: string | undefined = gridRef.current?.getPrimaryKeyFieldNames?.()?.[0];
            const rowObject: IRow<ColumnProps<T>> | undefined = primaryKeyField
                ? gridRef.current?.getRowsObject?.()?.find((row: IRow<ColumnProps<T>>) =>
                    String(getValue(primaryKeyField, row.data)) === String(key))
                : undefined;

            rowObject?.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                ...previousRowObject,
                data: DataUtil.setValue(field, value, { ...previousRowObject.data } as T) as T
            }));
        }, [gridRef]);

    /**
     * Revert the most recent action from the undo stack.
     * Restore previous state in the canonical data source.
     */
    const undo: () => Promise<void> = useCallback(async (): Promise<void> => {
        if (!settingsRef.current.allowUndoRedo || !gridRef.current) {
            return;
        }

        const actionToUndo: UndoRedoAction<T> | undefined = undoStack[0];

        if (gridRef.current.isEdit && !settingsRef.current.allowBatchSave && !actionToUndo?.isStaged) {
            return;
        }

        const undoStartEvent: UndoStartEvent = {
            action: actionToUndo,
            actionType: actionToUndo?.actionType,
            actionApplied: Boolean(actionToUndo),
            undoActionsCount: undoStack.length,
            redoActionsCount: redoStack.length
        };
        eventHandlers?.onUndoStart?.(undoStartEvent);

        if (!actionToUndo) {
            eventHandlers?.onUndoComplete?.({
                action: undefined,
                actionApplied: false,
                undoActionsCount: 0,
                redoActionsCount: 0,
                completedAt: Date.now()
            });
            return;
        }

        if (undoStartEvent.cancel) {
            return;
        }

        try {
            isApplyingHistory = true;

            if (actionToUndo.isStaged && settingsRef.current.allowBatchUndoRedo) {
                const stagedRow: StagedRowData<T> | undefined = batchEditModuleRef?.current?.getAllStagedRows().find(
                    (row: StagedRowData<T>) => String(row.rowKey) === String(actionToUndo.previousState.rowKeys[0])
                );

                if (stagedRow && actionToUndo.previousState.cellField) {
                    await batchEditModuleRef.current?.setStagedValue(
                        stagedRow.rowKey,
                        actionToUndo.previousState.cellField,
                        actionToUndo.previousState.cellPreviousValue,
                        true
                    );
                    updateRenderedStagedRow(
                        stagedRow.rowKey,
                        actionToUndo.previousState.cellField,
                        actionToUndo.previousState.cellPreviousValue
                    );
                }
            } else {
                await applyUndoStateToDataSource(actionToUndo, 'previousState', gridRef.current);
            }

            setUndoStack((prevStack: UndoRedoAction<T>[]) => prevStack.slice(1));
            setRedoStack((prevStack: UndoRedoAction<T>[]) => [actionToUndo, ...prevStack]);

            const undoCompleteEvent: UndoCompleteEvent = {
                action: actionToUndo,
                actionApplied: true,
                actionType: actionToUndo.actionType,
                undoActionsCount: undoStack.length - 1,
                redoActionsCount: redoStack.length + 1,
                completedAt: Date.now()
            };
            eventHandlers?.onUndoComplete?.(undoCompleteEvent);
        } catch (error) {
            console.error('Undo operation failed:', error);
            throw error;
        } finally {
            isApplyingHistory = false;
        }
    }, [undoStack, gridRef, eventHandlers]);

    /**
     * Reapply the most recently undone action from the redo stack.
     * Restore current state in the canonical data source.
     */
    const redo: () => Promise<void> = useCallback(async (): Promise<void> => {
        if (!settingsRef.current.allowUndoRedo || !gridRef.current) {
            return;
        }

        const actionToRedo: UndoRedoAction<T> | undefined = redoStack[0];

        if (gridRef.current.isEdit && !settingsRef.current.allowBatchSave && !actionToRedo?.isStaged) {
            return;
        }

        const redoStartEvent: RedoStartEvent = {
            action: actionToRedo,
            actionType: actionToRedo?.actionType,
            actionApplied: Boolean(actionToRedo),
            undoActionsCount: undoStack.length,
            redoActionsCount: redoStack.length
        };
        eventHandlers?.onRedoStart?.(redoStartEvent);

        if (!actionToRedo) {
            eventHandlers?.onRedoComplete?.({
                action: undefined,
                actionApplied: false,
                undoActionsCount: 0,
                redoActionsCount: 0,
                completedAt: Date.now()
            });
            return;
        }

        if (redoStartEvent.cancel) {
            return;
        }

        try {
            isApplyingHistory = true;

            if (actionToRedo.isStaged && settingsRef.current.allowBatchUndoRedo) {
                const stagedRow: StagedRowData<T> | undefined = batchEditModuleRef?.current?.getAllStagedRows().find(
                    (row: StagedRowData<T>) => String(row.rowKey) === String(actionToRedo.currentState.rowKeys[0])
                );

                if (stagedRow && actionToRedo.currentState.cellField) {
                    await batchEditModuleRef.current?.setStagedValue(
                        stagedRow.rowKey,
                        actionToRedo.currentState.cellField,
                        actionToRedo.currentState.cellCurrentValue,
                        true
                    );
                    updateRenderedStagedRow(
                        stagedRow.rowKey,
                        actionToRedo.currentState.cellField,
                        actionToRedo.currentState.cellCurrentValue
                    );
                }
            } else {
                await applyUndoStateToDataSource(actionToRedo, 'currentState', gridRef.current);
            }

            setRedoStack((prevStack: UndoRedoAction<T>[]) => prevStack.slice(1));
            setUndoStack((prevStack: UndoRedoAction<T>[]) => [actionToRedo, ...prevStack]);

            const redoCompleteEvent: RedoCompleteEvent = {
                action: actionToRedo,
                actionApplied: true,
                actionType: actionToRedo.actionType,
                undoActionsCount: undoStack.length + 1,
                redoActionsCount: redoStack.length - 1,
                completedAt: Date.now()
            };
            eventHandlers?.onRedoComplete?.(redoCompleteEvent);
        } catch (error) {
            console.error('Redo operation failed:', error);
            throw error;
        } finally {
            isApplyingHistory = false;
        }
    }, [redoStack, gridRef, eventHandlers]);

    // eslint-disable-next-line security/detect-object-injection
    const getRowAt: <TData>(rows: TData[], index: number) => TData = <TData>(rows: TData[], index: number): TData => rows[index];

    const applyUndoStateToDataSource: (
        action: UndoRedoAction<T>,
        stateKey: 'previousState' | 'currentState',
        grid: GridRef<T>
    ) => Promise<void> = async (
        action: UndoRedoAction<T>,
        stateKey: 'previousState' | 'currentState',
        grid: GridRef<T>
    ): Promise<void> => {
        const state: UndoRedoState<T> = stateKey === 'previousState' ? action.previousState : action.currentState;

        switch (action.actionType) {
        case 'edit': {
            for (let idx: number = 0; idx < state.rows.length; idx++) {
                const row: T = getRowAt(state.rows, idx);
                if (grid) {
                    if (restoreRowDataForUndoRef.current) {
                        await restoreRowDataForUndoRef.current(
                            getRowAt(state.rowKeys, idx),
                            row,
                            getRowAt(state.rowIndices, idx)
                        );
                    } else {
                        await grid.setRowDataAsync(getRowAt(state.rowKeys, idx), row, true);
                    }
                }
            }
            break;
        }

        case 'add': {
            if (stateKey === 'previousState') {
                for (let idx: number = 0; idx < action.currentState.rows.length; idx++) {
                    const row: T = getRowAt(action.currentState.rows, idx);
                    if (grid) {
                        await grid.deleteRecordAsync(undefined, row);
                    }
                }
            } else {
                for (let idx: number = 0; idx < state.rows.length; idx++) {
                    const row: T = getRowAt(state.rows, idx);
                    const rowIndex: number = getRowAt(state.rowIndices, idx);
                    if (grid) {
                        await grid.editModule?.addRecordAtIndexAsync?.(row, rowIndex);
                    }
                }
            }
            break;
        }

        case 'delete': {
            if (stateKey === 'previousState') {
                for (let idx: number = 0; idx < state.rows.length; idx++) {
                    const row: T = getRowAt(state.rows, idx);
                    const rowIndex: number = getRowAt(state.rowIndices, idx);
                    if (grid) {
                        await grid.editModule?.addRecordAtIndexAsync?.(row, rowIndex);
                    }
                }
            } else {
                for (let idx: number = 0; idx < action.previousState.rows.length; idx++) {
                    const row: T = getRowAt(action.previousState.rows, idx);
                    if (grid) {
                        await grid.deleteRecordAsync(undefined, row);
                    }
                }
            }
            break;
        }

        case 'paste':
        case 'cut':
        case 'autofill':
        case 'fill-handle': {
            for (let idx: number = 0; idx < state.rows.length; idx++) {
                const row: T = getRowAt(state.rows, idx);
                if (grid) {
                    if (restoreRowDataForUndoRef.current) {
                        await restoreRowDataForUndoRef.current(
                            getRowAt(state.rowKeys, idx),
                            row,
                            getRowAt(state.rowIndices, idx)
                        );
                    } else {
                        await grid.setRowDataAsync(getRowAt(state.rowKeys, idx), row, true);
                    }
                }
            }
            break;
        }

        case 'batch-save': {
            for (let idx: number = 0; idx < state.rows.length; idx++) {
                const row: T = getRowAt(state.rows, idx);
                if (grid) {
                    if (restoreRowDataForUndoRef.current) {
                        await restoreRowDataForUndoRef.current(
                            getRowAt(state.rowKeys, idx),
                            row,
                            getRowAt(state.rowIndices, idx)
                        );
                    } else {
                        await grid.setRowDataAsync(getRowAt(state.rowKeys, idx), row, true);
                    }
                }
            }
            break;
        }

        default: {
            console.warn(`Unknown action type: ${action.actionType}`);
            break;
        }
        }

        if (action.actionType === 'cut' && setCurrentViewData) {
            const primaryKeyField: string | undefined = grid.getPrimaryKeyFieldNames?.()[0];
            const rowByKey: Map<string, T> = new Map(
                state.rowKeys.map((rowKey: string | number, index: number) => [String(rowKey), getRowAt(state.rows, index)])
            );
            setCurrentViewData((previousData: T[]) => previousData.map((row: T) => {
                const rowKey: unknown = primaryKeyField ? getValue(primaryKeyField, row) : undefined;
                const restoredRow: T | undefined = rowByKey.get(String(rowKey));
                return restoredRow ? { ...row, ...restoredRow } : row;
            }));
        }
    };

    /**
     * Clear all undo and redo actions.
     */
    const clearHistory: () => void = useCallback((): void => {
        setUndoStack([]);
        setRedoStack([]);
    }, [gridRef]);

    /**
     * Get current undo actions count.
     */
    const getUndoActionsCount: () => number = useCallback((): number => {
        return undoStackRef.current.length;
    }, []);

    /**
     * Get current redo actions count.
     */
    const getRedoActionsCount: () => number = useCallback((): number => {
        return redoStackRef.current.length;
    }, []);

    return {
        undoActionsCount: undoStack.length,
        redoActionsCount: redoStack.length,
        canUndo: settingsRef.current.allowUndoRedo && undoStack.length > 0,
        canRedo: settingsRef.current.allowUndoRedo && redoStack.length > 0,
        undo,
        redo,
        getUndoActionsCount,
        getRedoActionsCount,
        clearHistory,
        recordAction,
        removeLastAction,
        clearStagedActions
    };
}
