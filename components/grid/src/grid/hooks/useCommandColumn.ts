import { RefObject, useMemo, useRef } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { EditState, InlineEditFormRef } from '../types/edit.interfaces';
import { IRow } from '../types/interfaces';
import { UseCommandColumnResult } from '../types/command.interfaces';
import { CommandColumnBase } from '../components/CommandColumn';
import { EditModule } from './useEdit';

/**
 * `useCommandColumn` is a custom hook that provides state management and refs for command column operations.
 * It manages edit state tracking, row references for edit/add operations, and inline edit form references.
 * This hook is essential for handling grid row editing and command item interactions.
 *
 * @private
 * @param {boolean} isCommandColumnEnabled - Detect command column enabing based on useColumn preparation itself.
 * @returns {UseCommandColumnResult} Object containing refs for managing command column state.
 *
 * @example
 * ```tsx
 * const { commandEdit, commandEditRef, commandAddRef, commandEditInlineFormRef, commandAddInlineFormRef } = useCommandColumn();
 * // Use these refs to manage editing state across command column operations
 * ```
 */
const useCommandColumn: <T>(isCommandColumnEnabled?: boolean) => UseCommandColumnResult<T> =
<T>(isCommandColumnEnabled?: boolean): UseCommandColumnResult<T> => {

    /**
     * Reference to track if any editable command column row
     *
     * @type {RefObject<boolean>}
     */
    const commandEdit: RefObject<boolean> = useRef(isCommandColumnEnabled || false);
    useMemo(() => {
        commandEdit.current = isCommandColumnEnabled;
    }, [isCommandColumnEnabled]);

    /**
     * Reference object mapping row UIDs to their individual edit state (true if row is being edited)
     * Allows tracking which specific rows are in edit mode
     *
     * @type {RefObject<{ [key: string]: boolean; }>}
     */
    const commandEditRef: RefObject<{ [key: string]: boolean; }> = useRef({});
    /**
     * Reference object mapping row UIDs to their individual edit state object
     * Allows tracking which specific rows with its updated data in edit mode
     */
    const commandEditStateRef: RefObject<{ [key: string]: EditState<T>; }> = useRef({}); // if we remove this ref variable, if any state change action performed in grid multiple row edit with same data

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
        commandEditStateRef,
        commandAddRef,
        commandEditInlineFormRef,
        commandAddInlineFormRef,
        CommandColumnBase,
        EditModule
    };
};
export { useCommandColumn as CommandColumnModule };
