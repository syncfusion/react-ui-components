import { RefObject } from 'react';
import { ValueType } from './interfaces';

/**
 * Represents one staged field change.
 * Stores the original value, staged value, dirty state, and validation state.
 *
 * @private
 */
export interface StagedFieldChange {
    /** Value captured when the field was first staged. */
    originalValue: ValueType;

    /** Value currently held in the batch staging store. */
    stagedValue: ValueType;

    /** Indicates whether the staged value differs from the original value. */
    isDirty: boolean;

    /** Validation message associated with the staged value. */
    validationError: string | null;

    /** Indicates whether validation completed for the staged value. */
    hasBeenValidated: boolean;
}

/**
 * Represents pending changes for one row.
 * Groups field-level changes under a stable primary-key value until commit or discard.
 *
 * @template T Row data type.
 * @private
 */
export interface StagedRowData<T = unknown> {
    /** Primary-key value identifying the staged row. */
    rowKey: string | number;

    /** Original values captured for fields changed during the edit session. */
    originalData: Partial<T>;

    /** Field-level changes pending persistence. */
    fieldChanges: Map<string, StagedFieldChange>;

    /** Indicates whether at least one field contains a pending change. */
    isDirty: boolean;

    /** Timestamp marking the beginning of row staging. */
    editStartTime: number;

    /** Optional rendered-row UID used for row identity during virtualization. */
    rowUid?: string;
}

/**
 * Represents the currently active cell editor.
 * Holds editor values before the active value is staged or discarded.
 *
 * @private
 */
export interface ActiveCellEditor {
    /** Primary-key value of the row containing the active cell. */
    rowKey: string | number;

    /** Field name of the active cell. */
    fieldName: string;

    /** Current value held by the editor. */
    currentValue: ValueType;

    /** Value present when the editor opened. */
    originalValue: ValueType;

    /** Validation message for the active editor value. */
    validationError: string | null;

    /** Timestamp marking the beginning of the editor session. */
    editStartTime: number;

    /** Optional rendered-row UID used for row identity during virtualization. */
    rowUid?: string;
}

/**
 * Configures batch staging and commit callbacks.
 *
 * @default { enabled: true, validateBeforeStaging: true }
 * @private
 */
export interface BatchEditSettings {
    /** Enables local staging before persistence. */
    enabled?: boolean;

    /** Stable grid-owned storage for staged rows across edit-module remounts. */
    stagedRowsRef?: RefObject<Map<string | number, StagedRowData>>;

    /** Requires field validation to pass before a value enters staging. */
    validateBeforeStaging?: boolean;

    /**
     * Fires before an active editor value enters staging.
     * Returning `false` cancels staging.
     *
     * @private
     * @event onBatchEditStart
     */
    onBatchEditStart?: (editor: ActiveCellEditor) => boolean;

    /**
     * Fires after a field value enters staging.
     *
     * @event onBatchEditRender
     */
    onBatchEditRender?: (stagedRow: StagedRowData, fieldName: string) => void;

    /**
     * Fires when a row changes between clean and dirty states.
     *
     * @event onBatchStateChange
     */
    onBatchStateChange?: (rowKey: string | number, isDirty: boolean) => void;

    /**
     * Fires before pending rows are committed.
     * Returning `false` cancels the commit.
     *
     * @event onBatchCommitStart
     */
    onBatchCommitStart?: (stagedRows: StagedRowData[]) => boolean;

    /**
     * Fires after pending rows are committed successfully.
     *
     * @event onBatchCommitSuccess
     */
    onBatchCommitSuccess?: (rowsCommitted: number) => void;

    /**
     * Fires when a batch commit fails. Pending rows remain available for retry.
     *
     * @event onBatchCommitError
     */
    onBatchCommitError?: (error: Error, stagedRows: StagedRowData[]) => void;
}

/**
 * API exposed by the batch staging hook.
 * Provides editor state, staging queries, discard operations, and commit operations.
 *
 * @template T Row data type.
 * @private
 */
export interface UseBatchEditResult<T = unknown> {
    /** Pending rows keyed by primary-key value. */
    stagedRows: Map<string | number, StagedRowData<T>>;

    /** Currently active editor, or `null` when no editor is open. */
    activeEditor: ActiveCellEditor | null;

    /** Indicates whether a batch commit is in progress. */
    isCommitting: boolean;

    /** Error from the most recent failed commit, or `null`. */
    lastCommitError: Error | null;

    /** Opens an editor for a row field or stages a bulk row update for Normal + Batch mode. */
    openEditor: {
        (rowKey: string | number, fieldName: string, currentValue: ValueType,
            originalValue: ValueType, rowUid?: string): Promise<boolean>;
        (rowKey: string | number, fieldChanges: Array<{
            fieldName: string;
            currentValue: ValueType;
            originalValue: ValueType;
        }>, rowUid?: string): Promise<boolean>;
    };

    /** Applies a value directly to staged batch state without opening an editor. */
    setStagedValue: (rowKey: string | number, fieldName: string, value: ValueType, isHistoryApplication?: boolean) => Promise<boolean>;

    /** Updates the value in the active editor without staging it. */
    updateEditorValue: (newValue: ValueType) => void;

    /** Validates and stages the active editor value while keeping the editor open. */
    stageEditorValue: (fieldValidationFn?: (fieldName: string) => Promise<boolean>) => Promise<boolean>;

    /** Validates, stages, and closes the active editor. */
    saveAndCloseEditor: (fieldValidationFn?: (fieldName: string) => Promise<boolean>) => Promise<boolean>;

    /** Checks whether a specific field has a dirty staged value. */
    isFieldDirty: (rowKey: string | number, fieldName: string) => boolean;

    /** Returns a row with staged values applied. */
    getBatchEditedRowData: (rowKey: string | number, row: T) => T;

    /** Returns all rows with pending staged changes. */
    getAllStagedRows: () => StagedRowData<T>[];

    /** Saves the active editor, then commits all staged rows. */
    batchSaveChanges: (
        saveActiveEditor: (() => Promise<boolean>) | undefined,
        persistFn: (stagedRows: StagedRowData<T>[]) => Promise<void>
    ) => Promise<boolean>;

    /** Cancels the active editor, restores rendered rows, and discards staged rows. */
    batchCancelChanges: (
        cancelActiveEditor: (() => Promise<void>) | undefined,
        restoreRows: (stagedRows: StagedRowData<T>[]) => void
    ) => Promise<void>;

    /** Indicates whether staged rows are waiting for commit. */
    hasBatchChanges: () => boolean;

    /** Indicates whether there are staged fields that currently hold validation errors. */
    hasPendingValidationErrors: () => boolean;
}
