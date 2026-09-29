import { useState, useCallback, useRef, Dispatch, SetStateAction } from 'react';
import { ValueType } from '../types/interfaces';
import { DataUtil } from '@syncfusion/react-data';
import {
    StagedFieldChange, StagedRowData, ActiveCellEditor, BatchEditSettings, UseBatchEditResult
} from '../types/batch-edit.interfaces';

/**
 * Hook that manages batch editing staging state for grid rows.
 *
 * Implements three-layer architecture:
 * 1. **Editor State**: Tracks currently active cell editor
 * 2. **Staging State**: Stores pending edits separately from original data
 * 3. **Persistence State**: Manages commit operations to data source
 *
 * All modifications are staged before persistence. Original row data remains unchanged.
 * Staging state survives sorting, filtering, paging, grouping, virtualization, and refreshes.
 *
 * @template T - The row data type
 * @param {BatchEditSettings} [settings] - Configuration for batch editing behavior
 * @param {Dispatch<SetStateAction<Object>>} [setResponseData] - Optional callback to trigger aggregate refresh
 * @returns {UseBatchEditResult<T>} - Staging store API and methods
 *
 * @private
 */
const useBatchEdit: <T>(settings?: BatchEditSettings, setResponseData?: Dispatch<SetStateAction<Object>>
) => UseBatchEditResult<T> = <T>(settings?: BatchEditSettings, setResponseData?: Dispatch<SetStateAction<Object>>) => {
    const batchEditSettings: BatchEditSettings = {
        enabled: true,
        validateBeforeStaging: true,
        ...settings
    };

    const [stagedRows, setStagedRows] = useState<Map<string | number, StagedRowData<T>>>(
        () => settings?.stagedRowsRef?.current as Map<string | number, StagedRowData<T>> ??
            new Map<string | number, StagedRowData<T>>()
    );
    const stagedRowsRef: React.RefObject<Map<string | number, StagedRowData<T>>> = useRef<Map<string | number, StagedRowData<T>>>(
        settings?.stagedRowsRef?.current as Map<string | number, StagedRowData<T>> ??
        new Map<string | number, StagedRowData<T>>()
    );

    // Active editor state.
    const [activeEditor, setActiveEditor] = useState<ActiveCellEditor | null>(null);
    const activeEditorRef: React.RefObject<ActiveCellEditor | null> = useRef<ActiveCellEditor | null>(null);

    // Commit state.
    const [isCommitting, setIsCommitting] = useState<boolean>(false);
    const [lastCommitError, setLastCommitError] = useState<Error | null>(null);

    // Temporary validation refs.
    const editorValidationErrors: React.RefObject<Map<string, string>> = useRef(
        new Map<string, string>()
    );

    // Utility to build staged field changes.
    const createFieldChange: (originalVal: ValueType, stagedVal: ValueType) => StagedFieldChange = useCallback(
        (originalVal: ValueType, stagedVal: ValueType): StagedFieldChange => ({
            originalValue: originalVal,
            stagedValue: stagedVal,
            isDirty: originalVal !== stagedVal,
            validationError: null,
            hasBeenValidated: false
        }), []);

    const stageValueForRow: (rowKey: string | number, fieldName: string, currentValue: ValueType,
        originalValue: ValueType, rowUid?: string, fieldValidationFn?: (fieldName: string) => Promise<boolean>
    ) => Promise<boolean> = useCallback(async (
        rowKey: string | number,
        fieldName: string,
        currentValue: ValueType,
        originalValue: ValueType,
        rowUid?: string,
        fieldValidationFn?: (fieldName: string) => Promise<boolean>
    ): Promise<boolean> => {
        if (!batchEditSettings.enabled) {
            return false;
        }

        if (fieldValidationFn && batchEditSettings.validateBeforeStaging) {
            try {
                const isValid: boolean = await fieldValidationFn(fieldName);
                if (!isValid) {
                    const currentEditor: ActiveCellEditor | null = activeEditorRef.current ?? activeEditor;
                    if (currentEditor) {
                        const updatedEditor: ActiveCellEditor = { ...currentEditor, validationError: 'Validation failed' };
                        activeEditorRef.current = updatedEditor;
                        setActiveEditor(updatedEditor);
                    }
                    return false;
                }
            } catch (error) {
                const currentEditor: ActiveCellEditor | null = activeEditorRef.current ?? activeEditor;
                if (currentEditor) {
                    const updatedEditor: ActiveCellEditor = {
                        ...currentEditor,
                        validationError: error instanceof Error ? error.message : 'Validation failed'
                    };
                    activeEditorRef.current = updatedEditor;
                    setActiveEditor(updatedEditor);
                }
                return false;
            }
        }

        const currentStagedRows: Map<string | number, StagedRowData<T>> = stagedRowsRef.current ??
            new Map<string | number, StagedRowData<T>>();
        const updatedStagedRows: Map<string | number, StagedRowData<T>> = new Map(currentStagedRows);
        const previousStagedRow: StagedRowData<T> | undefined = updatedStagedRows.get(rowKey);
        const stagedRow: StagedRowData<T> = previousStagedRow ? {
            ...previousStagedRow,
            originalData: { ...previousStagedRow.originalData },
            fieldChanges: new Map(previousStagedRow.fieldChanges)
        } : {
            rowKey,
            originalData: {},
            fieldChanges: new Map<string, StagedFieldChange>(),
            isDirty: false,
            editStartTime: Date.now(),
            rowUid
        };

        if (!stagedRow.fieldChanges.has(fieldName)) {
            stagedRow.originalData = {
                ...stagedRow.originalData,
                [fieldName]: originalValue
            };
        }

        const existingFieldChange: StagedFieldChange | undefined = stagedRow.fieldChanges.get(fieldName);
        const comparisonOriginalValue: ValueType = existingFieldChange?.originalValue ?? originalValue;
        const fieldChange: StagedFieldChange = createFieldChange(comparisonOriginalValue, currentValue);
        if (!fieldChange.isDirty) {
            const existingRow: StagedRowData<T> | undefined = updatedStagedRows.get(rowKey);

            if (existingRow) {
                existingRow.fieldChanges.delete(fieldName);
                existingRow.isDirty = Array.from(existingRow.fieldChanges.values()).some((change: StagedFieldChange) => change.isDirty);

                if (!existingRow.isDirty && existingRow.fieldChanges.size === 0) {
                    updatedStagedRows.delete(rowKey);
                }
            }

            stagedRowsRef.current = updatedStagedRows;
            if (settings?.stagedRowsRef) {
                settings.stagedRowsRef.current = updatedStagedRows;
            }
            setStagedRows(updatedStagedRows);
            return true;
        }
        fieldChange.validationError = null;
        fieldChange.hasBeenValidated = true;
        stagedRow.fieldChanges.set(fieldName, fieldChange);

        stagedRow.isDirty = Array.from(stagedRow.fieldChanges.values()).some(
            (change: StagedFieldChange) => change.isDirty
        );

        updatedStagedRows.set(rowKey, stagedRow);
        stagedRowsRef.current = updatedStagedRows;
        if (settings?.stagedRowsRef) {
            settings.stagedRowsRef.current = updatedStagedRows;
        }
        setStagedRows(updatedStagedRows);

        if (batchEditSettings.onBatchEditRender) {
            batchEditSettings.onBatchEditRender(stagedRow, fieldName);
        }

        if (batchEditSettings.onBatchStateChange) {
            batchEditSettings.onBatchStateChange(rowKey, stagedRow.isDirty);
        }

        return true;
    }, [batchEditSettings, createFieldChange, settings?.stagedRowsRef]);

    // Editor state management.
    // Opens an editor for a cell or stages a whole row payload in one pass for Normal + Batch mode.
    const openEditor: {
        (rowKey: string | number, fieldName: string, currentValue: ValueType,
            originalValue: ValueType, rowUid?: string): Promise<boolean>;
        (rowKey: string | number, fieldChanges: Array<{
            fieldName: string;
            currentValue: ValueType;
            originalValue: ValueType;
        }>, rowUid?: string): Promise<boolean>;
    } = useCallback(async (
        rowKey: string | number,
        fieldNameOrChanges: string | Array<{ fieldName: string; currentValue: ValueType; originalValue: ValueType }>,
        currentValue?: ValueType,
        originalValue?: ValueType,
        rowUid?: string
    ): Promise<boolean> => {
        if (Array.isArray(fieldNameOrChanges)) {
            for (const fieldChange of fieldNameOrChanges) {
                const staged: boolean = await stageValueForRow(
                    rowKey,
                    fieldChange.fieldName,
                    fieldChange.currentValue,
                    fieldChange.originalValue,
                    rowUid
                );
                if (!staged) {
                    return false;
                }
            }
            return true;
        }

        if (activeEditorRef.current) {
            activeEditorRef.current = null;
            setActiveEditor(null);
        }

        const newEditor: ActiveCellEditor = {
            rowKey,
            fieldName: fieldNameOrChanges,
            currentValue: currentValue as ValueType,
            originalValue: originalValue as ValueType,
            validationError: null,
            editStartTime: Date.now(),
            rowUid
        };

        activeEditorRef.current = newEditor;
        setActiveEditor(newEditor);
        editorValidationErrors.current.clear();

        return true;
    }, [stageValueForRow]);

    // Updates the active editor value without staging it.
    const updateEditorValue: (newValue: ValueType) => void = useCallback((newValue: ValueType): void => {
        const currentEditor: ActiveCellEditor | null = activeEditorRef.current ?? activeEditor;
        if (!currentEditor) {
            return;
        }

        const updatedEditor: ActiveCellEditor = { ...currentEditor, currentValue: newValue, validationError: null };
        activeEditorRef.current = updatedEditor;
        setActiveEditor(updatedEditor);
    }, [activeEditor]);

    // Validates and stages the active editor value.
    const stageEditorValue: (fieldValidationFn?: (fieldName: string) => Promise<boolean>
    ) => Promise<boolean> = useCallback(async (fieldValidationFn?: (fieldName: string) => Promise<boolean>): Promise<boolean> => {
        const currentEditor: ActiveCellEditor | null = activeEditorRef.current ?? activeEditor;
        if (!batchEditSettings.enabled || !currentEditor) {
            return false;
        }

        if (batchEditSettings.onBatchEditStart) {
            const canProceed: boolean = batchEditSettings.onBatchEditStart(currentEditor);
            if (!canProceed) {
                return false;
            }
        }

        const staged: boolean = await stageValueForRow(
            currentEditor.rowKey,
            currentEditor.fieldName,
            currentEditor.currentValue,
            currentEditor.originalValue,
            currentEditor.rowUid,
            fieldValidationFn
        );

        if (staged) {
            activeEditorRef.current = null;
            setActiveEditor(null);
        }

        return staged;
    }, [activeEditor, batchEditSettings, stageValueForRow]);

    const setStagedValue: (rowKey: string | number, fieldName: string, value: ValueType,
        isHistoryApplication?: boolean) => Promise<boolean> = useCallback(
        (rowKey: string | number, fieldName: string, value: ValueType,
         isHistoryApplication: boolean = false): Promise<boolean> => {
            const stagedRow: StagedRowData<T> | undefined = stagedRowsRef.current?.get(rowKey);
            if (!stagedRow) {
                return Promise.resolve(false);
            }
            const fieldChange: StagedFieldChange | undefined = stagedRow.fieldChanges.get(fieldName);
            //eslint-disable-next-line security/detect-object-injection
            const originalValue: ValueType = fieldChange?.originalValue ?? stagedRow.originalData[fieldName];
            if (isHistoryApplication && fieldChange) {
                fieldChange.stagedValue = value;
                fieldChange.isDirty = fieldChange.originalValue !== value;
                fieldChange.validationError = null;
                fieldChange.hasBeenValidated = true;
                stagedRow.isDirty = Array.from(stagedRow.fieldChanges.values()).some((change: StagedFieldChange) => change.isDirty);
                return Promise.resolve(true);
            }
            return stageValueForRow(rowKey, fieldName, value, originalValue, stagedRow.rowUid);
        }, [stageValueForRow]);

    // Saves and closes the active editor in one step.
    const saveAndCloseEditor: (fieldValidationFn?: (fieldName: string) => Promise<boolean>
    ) => Promise<boolean> = useCallback(async (fieldValidationFn?: (fieldName: string) => Promise<boolean>): Promise<boolean> => {
        const result: boolean = await stageEditorValue(fieldValidationFn);
        if (result) {
            activeEditorRef.current = null;
            setActiveEditor(null);
        }
        return result;
    }, [stageEditorValue]);

    // Staged value retrieval.
    // Checks whether a field has a staged dirty value.
    const isFieldDirty: (rowKey: string | number, fieldName: string) => boolean = useCallback(
        (rowKey: string | number, fieldName: string): boolean => {
            const stagedRow: StagedRowData<T> | undefined = stagedRows.get(rowKey);
            if (!stagedRow) {
                return false;
            }

            const fieldChange: StagedFieldChange | undefined = stagedRow.fieldChanges.get(fieldName);
            return fieldChange ? fieldChange.isDirty : false;
        }, [stagedRows]);

    // Merges staged changes into the original row data.
    const getMergedRowData: (rowKey: string | number) => Partial<T> = useCallback(
        (rowKey: string | number): Partial<T> => {
            const stagedRow: StagedRowData<T> | undefined = stagedRows.get(rowKey);
            if (!stagedRow) {
                return {};
            }

            const merged: Partial<T> = { ...stagedRow.originalData };
            stagedRow.fieldChanges.forEach((change: StagedFieldChange, fieldName: string) => {
                merged[fieldName as keyof T] = change.stagedValue as never;
            });

            return merged;
        }, [stagedRows]);

    const getBatchEditedRowData: (rowKey: string | number, row: T) => T = useCallback((rowKey: string | number, row: T): T => {
        if (!row) {
            return row;
        }

        const mergedData: Partial<T> = getMergedRowData(rowKey);
        let effectiveRow: T = { ...row } as T;
        Object.entries(mergedData).forEach(([fieldName, value]: [string, ValueType]) => {
            effectiveRow = DataUtil.setValue(fieldName, value, effectiveRow as Record<string, unknown>) as T;
        });
        return effectiveRow;
    }, [getMergedRowData]);

    // Staged state helpers.
    const getAllStagedRows: () => StagedRowData<T>[] = useCallback((): StagedRowData<T>[] => {
        const activeStagedRows: Map<string | number, StagedRowData<T>> = stagedRowsRef.current ??
            new Map<string | number, StagedRowData<T>>();
        return Array.from(activeStagedRows.values());
    }, []);

    const clearAllStaging: () => void = useCallback((): void => {
        const emptyStaging: Map<string | number, StagedRowData<T>> = new Map<string | number, StagedRowData<T>>();
        stagedRowsRef.current = emptyStaging;
        if (settings?.stagedRowsRef) {
            settings.stagedRowsRef.current = emptyStaging;
        }
        activeEditorRef.current = null;
        setActiveEditor(null);
        setStagedRows(emptyStaging);
    }, [settings?.stagedRowsRef]);

    // Batch persistence helpers.
    const commitBatchEdits: (persistFn: (stagedRows: StagedRowData<T>[]) => Promise<void>
    ) => Promise<boolean> = useCallback(async (persistFn: (stagedRows: StagedRowData<T>[]) => Promise<void>):
    Promise<boolean> => {
        const rowsToCommit: StagedRowData<T>[] = getAllStagedRows();
        if (rowsToCommit.length === 0) {
            return true;
        }

        if (batchEditSettings.onBatchCommitStart) {
            const canProceed: boolean = batchEditSettings.onBatchCommitStart(rowsToCommit);
            if (!canProceed) {
                return false;
            }
        }

        setIsCommitting(true);
        setLastCommitError(null);

        try {
            await persistFn(rowsToCommit);

            const emptyStaging: Map<string | number, StagedRowData<T>> = new Map<string | number, StagedRowData<T>>();
            stagedRowsRef.current = emptyStaging;
            if (settings?.stagedRowsRef) {
                settings.stagedRowsRef.current = emptyStaging;
            }
            setStagedRows(emptyStaging);
            activeEditorRef.current = null;
            setActiveEditor(null);
            setIsCommitting(false);

            if (batchEditSettings.onBatchCommitSuccess) {
                batchEditSettings.onBatchCommitSuccess(rowsToCommit.length);
            }

            if (setResponseData) {
                setResponseData((previousData: Object) =>
                    Object.keys(previousData).length ? previousData : {}
                );
            }

            return true;
        } catch (error) {
            const commitError: Error = error instanceof Error ? error : new Error(String(error));
            setLastCommitError(commitError);
            setIsCommitting(false);

            if (batchEditSettings.onBatchCommitError) {
                batchEditSettings.onBatchCommitError(commitError, rowsToCommit);
            }

            return false;
        }
    }, [getAllStagedRows, batchEditSettings, settings?.stagedRowsRef, setResponseData]);

    const batchSaveChanges: (saveActiveEditor: (() => Promise<boolean>) | undefined, persistFn:
    (stagedRows: StagedRowData<T>[]) => Promise<void>
    ) => Promise<boolean> = useCallback(async (
        saveActiveEditor: (() => Promise<boolean>) | undefined,
        persistFn: (stagedRows: StagedRowData<T>[]) => Promise<void>): Promise<boolean> => {
        if (saveActiveEditor && !await saveActiveEditor()) {
            return false;
        }
        return commitBatchEdits(persistFn);
    }, [commitBatchEdits]);

    const batchCancelChanges: (cancelActiveEditor: (() => Promise<void>) | undefined,
        restoreRows: (stagedRows: StagedRowData<T>[]) => void) => Promise<void> = useCallback(async (
        cancelActiveEditor: (() => Promise<void>) | undefined, restoreRows: (stagedRows: StagedRowData<T>[]) => void
    ): Promise<void> => {
        const rowsToRestore: StagedRowData<T>[] = getAllStagedRows();
        await cancelActiveEditor?.();
        restoreRows(rowsToRestore);
        activeEditorRef.current = null;
        setActiveEditor(null);
        clearAllStaging();
    }, [getAllStagedRows, clearAllStaging]);

    const hasBatchChanges: () => boolean = useCallback((): boolean => getAllStagedRows().length > 0, [getAllStagedRows]);

    const hasPendingValidationErrors: () => boolean = useCallback((): boolean =>
        getAllStagedRows().some((row: StagedRowData<T>) =>
            Array.from(row.fieldChanges.values()).some((change: StagedFieldChange) => !!change.validationError)
        ), [getAllStagedRows]);

    // Return API.
    return {
        // State
        stagedRows,
        activeEditor,
        isCommitting,
        lastCommitError,

        // Editor methods
        openEditor,
        setStagedValue,
        updateEditorValue,
        stageEditorValue,
        saveAndCloseEditor,

        // Query methods
        isFieldDirty,
        getBatchEditedRowData,
        getAllStagedRows,

        // Persistence
        batchSaveChanges,
        batchCancelChanges,
        hasBatchChanges,
        hasPendingValidationErrors
    };
};

export { useBatchEdit };
