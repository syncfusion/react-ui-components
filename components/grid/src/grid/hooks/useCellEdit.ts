import { useCallback, RefObject, Dispatch, SetStateAction, useState, useEffect } from 'react';
import { ActionType, ValueType, GroupedData, IRow, FocusedCellInfo, UseDataResult, ColumnProps, GridRef, EditSettings, EditState,
    CellEditEvent, HandleCellEditKeyDown, CellContext, CellEditModule, UseCellEditHook, FocusStrategyResult } from '../types';
import { isNullOrUndefined } from '@syncfusion/react-base';

/**
 * Cell Edit Mode hook - manages cell-level editing functionality
 *
 * @private
 * @param {RefObject<GridRef>} _gridRef - Reference to the grid instance
 * @param {Object[]} currentViewData - Current data source array
 * @param {UseDataResult} dataOperations - Data operations object
 * @param {EditSettings} editSettings - Edit configuration settings
 * @param {EditState} editState - Current edit state
 * @param {Function} setEditState - Function to update edit state
 * @param {Function} setGridAction - Function to set grid actions
 * @param {RefObject<Object>} editDataRef - Reference to current edit data
 * @param {Function} getPrimaryKeyField - Function to get primary key field name
 * @param {Function} updateEditData - Function to update edit data
 * @returns {CellEditModule<Object>} Cell edit methods and state
 */
export const useCellEdit: UseCellEditHook = <T>(
    _gridRef: RefObject<GridRef<T>>,
    currentViewData: T[],
    dataOperations: UseDataResult<T>,
    editSettings: EditSettings<T>,
    editState: EditState<T>,
    setEditState: Dispatch<SetStateAction<EditState<T>>>,
    setGridAction: Dispatch<SetStateAction<Object>>,
    editDataRef: RefObject<T>,
    getPrimaryKeyField: () => string,
    updateEditData: (field: string, value: ValueType, rowObject?: IRow<ColumnProps<T>>) => void
): CellEditModule => {
    const viewData: T[] = currentViewData;
    const [focusCell, setFocusCell] = useState<boolean>(false);
    const [saveCell, setSaveCell] = useState<boolean>(false);

    useEffect(() => {
        if (focusCell) {
            setFocusCell(false);
            const focusModule: FocusStrategyResult = _gridRef.current.focusModule;
            const focusInfo: FocusedCellInfo = focusModule?.getLastFocusedCell();
            if (focusInfo) {
                requestAnimationFrame(() => {
                    focusModule.setGridFocus(true);
                    focusModule.navigateToCell(focusInfo.rowIndex, focusInfo.colIndex);
                });
            }
        }
    }, [focusCell]);

    // Triggers focus restoration to the previously focused cell.
    const restoreCellFocus: () => void = useCallback((): void => {
        setTimeout(() => {
            setFocusCell(true);
        });
    }, []);

    /**
     * Builds current cell context for keyboard navigation.
     * Returns row, column, primaryKeyValue, and focusInfo for the currently focused cell.
     */
    const getCellContext: () => {
        row: IRow<ColumnProps<T>>;
        column: ColumnProps<T>;
        primaryKeyValue: string;
        focusInfo: FocusedCellInfo;
    } | null = useCallback((): {
        row: IRow<ColumnProps<T>>;
        column: ColumnProps<T>;
        primaryKeyValue: string;
        focusInfo: FocusedCellInfo;
    } | null => {
        const rowObjects: IRow<ColumnProps<T>>[] = _gridRef?.current?.getRowsObject();
        const columns: ColumnProps<T>[] = _gridRef?.current?.getVisibleColumns();
        if (!rowObjects || !columns) { return null; }

        const focusInfo: FocusedCellInfo = _gridRef?.current?.focusModule?.getLastFocusedCell();
        if (!focusInfo || focusInfo.isHeader || focusInfo.isAggregate) { return null; }

        if (!rowObjects?.[focusInfo.rowIndex] || !columns?.[focusInfo.colIndex]) { return null; }

        const row: IRow<ColumnProps<T>> = rowObjects[focusInfo.rowIndex];
        const column: ColumnProps<T> = columns[focusInfo.colIndex];
        const primaryKeyValue: string = row?.data?.[getPrimaryKeyField()];

        if (primaryKeyValue === undefined || !column.field) { return null; }

        return {
            row,
            column,
            primaryKeyValue,
            focusInfo
        };
    }, [_gridRef, getPrimaryKeyField]);

    /**
     * Initiates Cell edit mode for a specific cell identified by primary key and field name.
     * Uses field-based tracking for stability across column operations.
     */
    const editCell: (primaryKeyValue: string | number, field: string) => Promise<void> =
        useCallback(async (primaryKeyValue: string | number, field: string) => {
            // Only allowed in Cell mode
            if (editSettings.mode !== 'Cell') {
                return;
            }

            // Check if editing is allowed
            if (!editSettings.allowEdit) {
                return;
            }

            // If already editing a cell, save it first before editing the new cell
            if (editState.isEdit && editState.editCellIndex) {
                // Check if it's the same cell - if so, do nothing
                if (editState.editCellIndex.primaryKeyValue === primaryKeyValue &&
                    editState.editCellIndex.field === field) {
                    return;
                }
            }

            // Find row by primary key
            const primaryKeyColumn: string = getPrimaryKeyField();
            const rowIndex: number = viewData.findIndex((row: T) => row[primaryKeyColumn as string] === primaryKeyValue);
            if (rowIndex === -1 || isNullOrUndefined(rowIndex)) {
                return;
            }

            const row: T = viewData[rowIndex as number];

            // Get visible columns for optimization
            const visibleColumns: ColumnProps<T>[] = _gridRef.current?.getVisibleColumns();
            const column: ColumnProps<T> | undefined = visibleColumns.find((c: ColumnProps<T>) => c.field === field);

            if (!column || column.isPrimaryKey || column.allowEdit === false || (row as GroupedData<T>)?.flattedKey) {
                return;
            }

            // Fire onCellEditStart callback
            const startArgs: CellEditEvent<T> = {
                cancel: false,
                data: row,
                rowIndex: rowIndex,
                field: field
            };
            _gridRef?.current?.onCellEditStart?.(startArgs);

            // If the operation was cancelled, return early
            if (startArgs.cancel) {
                return;
            }

            // Set Cell edit state with field-based tracking
            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: true,
                editRowIndex: rowIndex,
                editData: { [field]: row[field as string] } as T,
                originalData: { [field]: row[field as string] } as T,
                validationErrors: {},
                editCellIndex: { primaryKeyValue, field }
            }));

            editDataRef.current = { [field]: row?.[field as string] } as T;

            // Dispatch editStateChanged event
            const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: { isEdit: true, editRowIndex: rowIndex }
            });
            editGridElement?.dispatchEvent(editStateEvent);
        }, [editSettings.mode, editSettings.allowEdit, getPrimaryKeyField, viewData, _gridRef, editState]);

    /**
     * Saves changes made in Cell edit mode and exits edit state.
     * Follows the same validation and error handling pattern as saveDataChanges.
     */
    const saveCellChanges: () => Promise<boolean> = useCallback(async () => {
        // Only applicable in Cell mode
        if (editSettings.mode !== 'Cell' || !editState.isEdit || !editState.editCellIndex) {
            return false;
        }

        const isValid: boolean = _gridRef.current.editCellFormRef?.current.formRef?.current.validate();
        // Check validation errors before saving
        // If there are validation errors, prevent save and return false
        if ((editState.validationErrors && Object.keys(editState.validationErrors).length > 0)
            || (isValid === false)) {
            return false;
        }

        const { primaryKeyValue, field } = editState.editCellIndex;
        const primaryKeyColumn: string = getPrimaryKeyField();

        // Get full row data
        const rowIndex: number = viewData.findIndex((row: T) => row[primaryKeyColumn as string] === primaryKeyValue);
        if (rowIndex === -1 || isNullOrUndefined(rowIndex)) {
            return false;
        }

        const row: T = viewData[rowIndex as number];
        const updatedRowData: T = { ...row, [field]: editState.editData[field as string] };

        // Fire onDataChangeStart callback
        const saveArgs: { cancel: boolean; data: T; rowIndex: number; previousData: T; action: string } = {
            cancel: false,
            data: updatedRowData,
            rowIndex: rowIndex,
            previousData: row,
            action: ActionType.Edit
        };
        _gridRef?.current?.onDataChangeStart?.(saveArgs);

        // If cancelled, return early
        if (saveArgs.cancel) {
            return false;
        }

        setGridAction({});

        // Update data
        await dataOperations.getData({
            requestType: 'update',
            data: saveArgs.data
        });

        // Fire onDataChangeComplete callback
        _gridRef?.current?.onDataChangeComplete?.({
            data: saveArgs.data,
            rowIndex: rowIndex,
            previousData: row,
            action: ActionType.Edit
        });

        // Reset edit state
        setEditState((prev: EditState<T>) => ({
            ...prev,
            isEdit: false,
            editRowIndex: -1,
            editData: null,
            originalData: null,
            validationErrors: {},
            editCellIndex: undefined
        }));

        editDataRef.current = null;

        // Dispatch editStateChanged event
        const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
        const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
            detail: { isEdit: false, editRowIndex: -1 }
        });
        editGridElement?.dispatchEvent(editStateEvent);
        restoreCellFocus();
        return true;
    }, [editSettings.mode, editState, getPrimaryKeyField, viewData, dataOperations, _gridRef]);

    /**
     * Cancels Cell edit mode and discards changes.
     */
    const cancelCellChanges: () => Promise<void> = useCallback(async () => {
        // Only applicable in Cell mode
        if (editSettings.mode !== 'Cell' || !editState.isEdit || !editState.editCellIndex) {
            return;
        }

        // Fire onDataChangeCancel callback
        _gridRef?.current?.onDataChangeCancel?.({
            data: editState.editData,
            rowIndex: editState.editRowIndex,
            formRef: null
        });

        // Reset edit state
        setEditState((prev: EditState<T>) => ({
            ...prev,
            isEdit: false,
            editRowIndex: -1,
            editData: null,
            originalData: null,
            validationErrors: {},
            editCellIndex: undefined
        }));

        editDataRef.current = null;

        // Dispatch editStateChanged event
        const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
        const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
            detail: { isEdit: false, editRowIndex: -1 }
        });
        editGridElement?.dispatchEvent(editStateEvent);
        restoreCellFocus();
    }, [editSettings.mode, editState, _gridRef]);

    /**
     * Updates validation errors in editState.
     * Used by CellEditForm to sync FormValidator errors back to editState.
     */
    const updateValidationErrors: (errors: Record<string, string>) => void = useCallback((errors: Record<string, string>) => {
        setEditState((prev: EditState<T>) => ({
            ...prev,
            validationErrors: errors
        }));
    }, []);

    useEffect(() => {
        if (saveCell) {
            setSaveCell(false);
            saveCellChanges();
        }
    }, [saveCell]);

    const editFocusedCell: () => void = useCallback(() => {
        const cellContext: CellContext<T> = getCellContext();
        if (cellContext && !cellContext.column.isPrimaryKey && cellContext?.column?.field) {
            editCell(cellContext.primaryKeyValue, cellContext.column.field);
        }
    }, [_gridRef, getCellContext, editCell]);

    /**
     * Handles Delete key action - clears cell value and triggers save.
     * Called when Delete key is pressed on a cell in edit mode.
     */
    const handleDeleteCell: () => void = useCallback(() => {
        const cellContext: CellContext<T> = getCellContext();
        if (cellContext && !cellContext.column.isPrimaryKey) {
            if (cellContext?.column?.field) {
                editCell(cellContext.primaryKeyValue, cellContext.column.field);
            }
            setTimeout(() => {
                _gridRef.current.editCellFormRef.current.editCellRef.current.setValue(null);
                requestAnimationFrame(() => {
                    setSaveCell(true);
                });
            }, 0);
        }
    }, [_gridRef, getCellContext, editCell]);

    /**
     * Consolidated keyboard handler for Cell Edit Mode.
     * Handles Tab, Shift+Tab, F2, Enter, Delete, and Escape keys.
     */
    const handleCellEditKeyDown: HandleCellEditKeyDown = useCallback(async (
        e: React.KeyboardEvent,
        navigateToNextCell?: (direction: 'nextCell' | 'prevCell') => void
    ): Promise<void> => {

        // Guard: Only allow Cell edit mode
        if (editSettings.mode !== 'Cell' || !editSettings.allowEdit) {
            return;
        }

        // Helper: Prevent default browser behavior + stop propagation
        const preventGridEvent: () => void = () => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Helper: Start editing a cell
        const startEditCell: (cellContext: {
            row: IRow<ColumnProps<T>>;
            column: ColumnProps<T>;
            primaryKeyValue: string;
            focusInfo: FocusedCellInfo;
        }) => void = (cellContext: {
            row: IRow<ColumnProps<T>>;
            column: ColumnProps<T>;
            primaryKeyValue: string;
            focusInfo: FocusedCellInfo;
        }): void => {
            if (cellContext?.column?.field) {
                editCell(cellContext.primaryKeyValue, cellContext.column.field);
            }
        };

        // TAB / SHIFT + TAB
        if (e.key === 'Tab' && editState.editCellIndex && navigateToNextCell) {
            preventGridEvent();

            const isSaved: boolean = await saveCellChanges();

            if (isSaved !== false) {
                const direction: 'prevCell' | 'nextCell' = e.shiftKey ? 'prevCell' : 'nextCell';
                navigateToNextCell(direction);

                requestAnimationFrame(() => {
                    const cellContext: CellContext<T> = getCellContext();
                    if (!cellContext) { return; }

                    if (!cellContext.column.isPrimaryKey && cellContext.column.allowEdit !== false) {
                        startEditCell(cellContext);
                    }
                });
            }
            return;
        }

        // F2 → Enter edit mode (only if not already editing)
        if (e.key === 'F2' && !editState.isEdit) {
            preventGridEvent();

            const cellContext: CellContext<T> = getCellContext();
            if (cellContext) {
                startEditCell(cellContext);
            }
            return;
        }

        // ENTER → Toggle edit mode
        if (e.key === 'Enter') {
            preventGridEvent();

            if (editState.isEdit && editState.editCellIndex) {
                await saveCellChanges();
            } else {
                const cellContext: CellContext<T> = getCellContext();
                if (cellContext) {
                    startEditCell(cellContext);
                }
            }
            return;
        }

        // DELETE → Clear value + save
        if (e.key === 'Delete') {
            preventGridEvent();
            handleDeleteCell();
            return;
        }

        // ESCAPE → Cancel editing
        if (e.key === 'Escape' && editState.isEdit && editState.editCellIndex) {
            preventGridEvent();
            await cancelCellChanges();
            return;
        }

    }, [
        editSettings.mode,
        editSettings.allowEdit,
        editState.isEdit,
        editState.editCellIndex,
        saveCellChanges,
        editCell,
        cancelCellChanges,
        updateEditData,
        getPrimaryKeyField,
        getCellContext,
        handleDeleteCell
    ]);

    return {
        // Cell edit operations
        editCell,
        saveCellChanges,
        cancelCellChanges,
        updateValidationErrors,
        handleCellEditKeyDown,
        handleDeleteCell,
        editFocusedCell
    };
};
