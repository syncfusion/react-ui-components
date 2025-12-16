import { RefObject, useRef } from 'react';
import { ColumnProps, InlineEditFormRef, IRow, UseCommandColumnResult } from '../types';

/**
 * `useCommandColumn` is a custom hook that provides state management and refs for command column operations.
 * It manages edit state tracking, row references for edit/add operations, and inline edit form references.
 * This hook is essential for handling grid row editing and command item interactions.
 *
 * @private
 * @returns {UseCommandColumnResult} Object containing refs for managing command column state.
 *
 * @example
 * ```tsx
 * const { commandEdit, commandEditRef, commandAddRef, commandEditInlineFormRef, commandAddInlineFormRef } = useCommandColumn();
 * // Use these refs to manage editing state across command column operations
 * ```
 */
export const useCommandColumn: () => UseCommandColumnResult = (): UseCommandColumnResult => {

    /**
     * Reference to track if any editable command column row
     *
     * @type {RefObject<boolean>}
     */
    const commandEdit: RefObject<boolean> = useRef(false);

    /**
     * Reference object mapping row UIDs to their individual edit state (true if row is being edited)
     * Allows tracking which specific rows are in edit mode
     *
     * @type {RefObject<{ [key: string]: boolean; }>}
     */
    const commandEditRef: RefObject<{ [key: string]: boolean; }> = useRef({});

    /**
     * Reference array containing newly added rows that are in edit mode
     * Tracks rows that have been created but not yet saved to the grid
     *
     * @type {RefObject<IRow<ColumnProps>[]>}
     */
    const commandAddRef: RefObject<IRow<ColumnProps>[]> = useRef([]);

    /**
     * Reference object mapping row UIDs to their inline edit form refs for existing rows
     * Allows direct access to edit form components for data validation and submission
     *
     * @type {RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>}
     */
    const commandEditInlineFormRef: RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }> = useRef({});

    /**
     * Reference object mapping row UIDs to their inline add form refs for newly created rows
     * Provides access to add form components for data validation and submission
     *
     * @type {RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }>}
     */
    const commandAddInlineFormRef: RefObject<{ [key: string]: RefObject<InlineEditFormRef>; }> = useRef({});

    return {
        commandEdit,
        commandEditRef,
        commandAddRef,
        commandEditInlineFormRef,
        commandAddInlineFormRef
    };
};
