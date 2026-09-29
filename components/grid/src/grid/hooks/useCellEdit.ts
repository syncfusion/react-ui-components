import { useCallback, RefObject, Dispatch, SetStateAction, useState, useEffect } from 'react';
import { ActionType } from '../types/enum';
import { ValueType, IRow, UseDataResult } from '../types/interfaces';
import { GroupedData } from '../types/grouping.interfaces';
import { FocusedCellInfo, FocusStrategyResult, IFocusMatrix } from '../types/focus.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { EditSettings, EditState, CellEditEvent, HandleCellEditKeyDown, CellContext, CellEditModule, UseCellEditHook } from '../types/edit.interfaces';
import { UndoRedoAction, UndoRedoState, UseUndoRedoResult } from '../types/undoredo.interfaces';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { PinningModuleResult, PinningSettings } from '../types/pinning.interfaces';
import { DataManager } from '@syncfusion/react-data';
import { isRowPinningEnabled } from '../utils/utils';

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
 * @param {Function} setResponseData - Optional function to update response data
 * @param {PinningModuleResult} pinningModule - Optional row pinning module for pinned row support
 * @param {UseBatchEditResult} batchEditModule - Optional batch edit module for batch editing support
 * @param {UseUndoRedoResult} undoRedoModule - Optional undo/redo module for undo/redo support
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
    updateEditData: (field: string, value: ValueType, rowObject?: IRow<ColumnProps<T>>) => void,
    setResponseData?: Dispatch<SetStateAction<Object>>,
    pinningModule?: PinningModuleResult<T>,
    batchEditModule?: import('../types/batch-edit.interfaces').UseBatchEditResult<T>,
    undoRedoModule?: UseUndoRedoResult
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
    const editCell: (primaryKeyValue: string | number, field: string, rowUid?: string, initialValue?: ValueType) => Promise<void> =
        useCallback(async (primaryKeyValue: string | number, field: string, rowUid?: string, initialValue?: ValueType) => {
            // Cell mode and allowBatchSave use the cell editor surface.
            if (editSettings.mode !== 'Cell' && !editSettings.allowBatchSave) {
                return;
            }

            // Check if editing is allowed
            if (!editSettings.allowEdit) {
                return;
            }

            // If already editing a cell, save it first before editing the new cell
            if (editState.isEdit && editState.editCellIndex) {
                // Check if it's the same cell - if so, do nothing
                const isSameCell: boolean = editState.editCellIndex.primaryKeyValue === primaryKeyValue &&
                    editState.editCellIndex.field === field &&
                    (rowUid === undefined || editState.editCellIndex.rowUid === rowUid ||
                        (editState.editCellIndex.rowUid === undefined && rowUid === undefined));
                if (isSameCell) {
                    return;
                }
            }

            let rowIndex: number = -1;
            let rowElement: HTMLElement | null = null;
            let rowobject: IRow<ColumnProps<T>> | null = null;
            const pinningSettings: PinningSettings = _gridRef?.current?.pinningSettings;
            if (isRowPinningEnabled(pinningSettings) && rowUid) {
                rowobject =  _gridRef?.current.getRowObjectFromUID(rowUid);
                rowIndex = rowobject.rowIndex;
                rowElement = rowobject.element;
            } else {
                const primaryKeyColumn: string = getPrimaryKeyField();
                rowIndex = viewData.findIndex((row: T) => row[primaryKeyColumn as string] === primaryKeyValue);
            }

            if (rowIndex === -1 || isNullOrUndefined(rowIndex)) {
                return;
            }

            const isPinnedRowEdit: boolean = !!rowElement?.closest?.('.sf-pinned-rows-top-container') ||
                !!rowElement?.closest?.('.sf-pinned-rows-bottom-container');
            const topPinnedRowCount: number = _gridRef.current?.getPinnedTopTableRowsObject?.()?.length ?? 0;

            let row: T = null;
            if (isPinnedRowEdit) {
                row = rowobject?.data as T;
            } else {
                row = viewData[rowIndex - topPinnedRowCount];
            }

            if (editSettings.allowBatchSave && batchEditModule) {
                row = batchEditModule.getBatchEditedRowData(primaryKeyValue, row);
            }

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
            const originalCellValue: ValueType = row[field as string];
            const currentCellValue: ValueType = isNullOrUndefined(initialValue) ? originalCellValue : initialValue;

            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: true,
                editRowIndex: rowIndex,
                editData: { [field]: currentCellValue } as T,
                originalData: { [field]: originalCellValue } as T,
                validationErrors: {},
                editCellIndex: { primaryKeyValue, field, rowUid }
            }));

            editDataRef.current = { [field]: currentCellValue } as T;

            if (editSettings.allowBatchSave) {
                await batchEditModule?.openEditor(primaryKeyValue, field, currentCellValue, originalCellValue, rowUid);
            }

            // Dispatch editStateChanged event
            const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: { isEdit: true, editRowIndex: rowIndex }
            });
            editGridElement?.dispatchEvent(editStateEvent);
        }, [editSettings.mode, editSettings.allowEdit, getPrimaryKeyField, viewData, _gridRef, editState, batchEditModule]);

    /**
     * Saves changes made in Cell edit mode and exits edit state.
     * Follows the same validation and error handling pattern as saveDataChanges.
     */
    const saveCellChanges: () => Promise<boolean> = useCallback(async () => {
        // Cell mode and allowBatchSave use the cell editor surface.
        if ((editSettings.mode !== 'Cell' && !editSettings.allowBatchSave) || !editState.isEdit || !editState.editCellIndex) {
            return false;
        }

        const isValid: boolean = _gridRef.current.editCellFormRef?.current?.formRef?.current?.validate();
        // Check validation errors before saving
        // If there are validation errors, prevent save and return false
        if ((editState.validationErrors && Object.keys(editState.validationErrors).length > 0)
            || (isValid === false)) {
            return false;
        }

        let rowIndex: number = -1;
        let rowobject: IRow<ColumnProps<T>> | null = null;
        const { primaryKeyValue, field, rowUid } = editState.editCellIndex;
        const pinningSettings: PinningSettings = _gridRef?.current?.pinningSettings;
        if (isRowPinningEnabled(pinningSettings) && !isNullOrUndefined(editState.editRowIndex) &&
            editState.editRowIndex >= 0) {
            const resolvedRowUid: string | null = rowUid ??
                _gridRef?.current.getRowByIndex(editState.editRowIndex)?.getAttribute('data-uid') ?? null;
            rowobject = resolvedRowUid ? _gridRef?.current.getRowObjectFromUID(resolvedRowUid) : null;
            rowIndex = editState.editRowIndex;
        }

        if (rowIndex === -1 || isNullOrUndefined(rowIndex)) {
            const primaryKeyColumn: string = getPrimaryKeyField();
            rowIndex = viewData.findIndex((row: T) => row[primaryKeyColumn as string] === primaryKeyValue);
        }

        if (rowIndex === -1 || isNullOrUndefined(rowIndex)) {
            return false;
        }

        const topPinnedRowCount: number = _gridRef.current?.getPinnedTopTableRowsObject?.()?.length ?? 0;
        const rowData: T | GroupedData<T> = rowobject?.data ?? viewData[(rowIndex - topPinnedRowCount)] ?? viewData[rowIndex as number];
        const row: T = editSettings.allowBatchSave && batchEditModule
            ? batchEditModule.getBatchEditedRowData(primaryKeyValue, rowData as T)
            : rowData as T;
        const previousCellValue: ValueType = Object.prototype.hasOwnProperty.call(editState.originalData ?? {}, field)
            ? editState.originalData[field as string]
            : row[field as string];
        const previousRowData: T = { ...row, [field]: previousCellValue } as T;
        const updatedRowData: T = { ...row, [field]: editState.editData[field as string] } as T;

        // Fire onDataChangeStart callback
        const saveArgs: { cancel: boolean; data: T; rowIndex: number; previousData: T; action: string } = {
            cancel: false,
            data: updatedRowData,
            rowIndex: rowIndex,
            previousData: previousRowData,
            action: ActionType.Edit
        };
        _gridRef?.current?.onDataChangeStart?.(saveArgs);

        // If cancelled, return early
        if (saveArgs.cancel) {
            return false;
        }

        setGridAction({});

        if (editSettings.allowBatchSave) {
            await batchEditModule?.saveAndCloseEditor();
        } else {
            // Check if custom binding is enabled
            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;

            // Update data with custom binding support
            await dataOperations.getData(customBinding ? { requestType: 'save', ...saveArgs } : {
                requestType: 'update',
                data: saveArgs.data
            });
        }

        // Sync updates to the exact combined-row object so pinned/content clones remain aligned.
        const resolvedRowObject: IRow<ColumnProps<T>> | null | undefined = rowobject ??
            (rowUid ? _gridRef.current?.getRowObjectFromUID(rowUid) : undefined) ??
            _gridRef.current?.getRowsObject?.()?.[rowIndex as number] ?? null;

        if ((editSettings.mode === 'Cell' || editSettings.allowBatchSave) && resolvedRowObject) {
            if (editSettings.allowBatchSave && resolvedRowObject.isPinned) {
                pinningModule?.updatePinnedRowObjectsData(resolvedRowObject, saveArgs);
            } else if (typeof resolvedRowObject.setRowObject === 'function') {
                resolvedRowObject.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                    ...previousRowObject,
                    data: saveArgs.data
                }));
            }
            if (editSettings.allowBatchSave &&
                (_gridRef.current?.scrollMode === 'Virtual' || _gridRef.current?.scrollMode === 'Infinite')) {
                _gridRef.current?.setVirtualCachedViewData?.((previousData: Map<number, T>) => {
                    const updatedData: Map<number, T> = new Map(previousData);
                    updatedData.set(rowIndex, saveArgs.data);
                    return updatedData;
                });
            }
        } else if (resolvedRowObject?.isPinned) {
            pinningModule?.updatePinnedRowObjectsData(resolvedRowObject, saveArgs, true);
        }
        if (editSettings.allowBatchSave && setResponseData) {
            const primaryKeyField: string = getPrimaryKeyField();
            const customBinding: boolean = !!dataOperations.dataManager && 'result' in dataOperations.dataManager;
            const sourceData: T[] = customBinding ? currentViewData : dataOperations.dataManager instanceof DataManager
                ? dataOperations.dataManager.dataSource.json as T[] : currentViewData;
            /* eslint-disable security/detect-object-injection */
            setResponseData((previousData: Object) => ({
                ...previousData,
                aggregates: customBinding ? (previousData as { aggregates?: Object }).aggregates : undefined,
                result: sourceData.map((viewRow: T) =>
                    // eslint-disable-next-line security/detect-object-injection
                    viewRow[primaryKeyField] === saveArgs.data[primaryKeyField] ? saveArgs.data :
                        (editSettings.allowBatchSave
                            ? batchEditModule?.getBatchEditedRowData(viewRow[primaryKeyField], viewRow) ?? viewRow
                            : viewRow))
            }));
            /* eslint-enable security/detect-object-injection */
        }

        // Fire onDataChangeComplete callback
        _gridRef?.current?.onDataChangeComplete?.({
            data: saveArgs.data,
            rowIndex: rowIndex,
            previousData: previousRowData,
            action: ActionType.Edit
        });

        if (undoRedoModule && editSettings.allowUndoRedo && !editSettings.allowBatchSave &&
            previousCellValue !== saveArgs.data[field as string]) {
            const previousState: UndoRedoState<T> = {
                rows: [saveArgs.previousData],
                rowIndices: [rowIndex],
                rowKeys: [primaryKeyValue],
                cellField: field,
                cellPreviousValue: previousCellValue,
                cellCurrentValue: saveArgs.data[field as string]
            };
            const currentState: UndoRedoState<T> = {
                rows: [saveArgs.data],
                rowIndices: [rowIndex],
                rowKeys: [primaryKeyValue],
                cellField: field,
                cellPreviousValue: previousCellValue,
                cellCurrentValue: saveArgs.data[field as string]
            };
            const action: UndoRedoAction<T> = {
                id: `${Date.now()}-${Math.random()}`,
                actionType: 'edit',
                previousState,
                currentState,
                timestamp: Date.now()
            };
            undoRedoModule.recordAction(action);
        }

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
    }, [editSettings.mode, editSettings.allowUndoRedo, editSettings.allowBatchSave, editState, getPrimaryKeyField,
        viewData, dataOperations, _gridRef, pinningModule, batchEditModule, undoRedoModule, setResponseData, currentViewData]);

    /**
     * Cancels Cell edit mode and discards changes.
     */
    const cancelCellChanges: () => Promise<void> = useCallback(async () => {
        // Cell mode and allowBatchSave use the cell editor surface.
        if ((editSettings.mode !== 'Cell' && !editSettings.allowBatchSave) || !editState.isEdit || !editState.editCellIndex) {
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
            editCell(cellContext.primaryKeyValue, cellContext.column.field, cellContext.row?.uid);
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
                editCell(cellContext.primaryKeyValue, cellContext.column.field, cellContext.row?.uid);
            }
            setTimeout(() => {
                _gridRef.current?.editCellFormRef.current?.editCellRef.current?.setValue(null);
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

        // Cell mode and legacy batch editing both use the cell editor keyboard flow.
        // Normal row editing without batch save remains on the row editor path.
        if ((editSettings.mode !== 'Cell' && !editSettings.allowBatchSave) || !editSettings.allowEdit) {
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
                editCell(cellContext.primaryKeyValue, cellContext.column.field, cellContext.row?.uid);
            }
        };

        // TAB / SHIFT + TAB
        if (e.key === 'Tab' && editState.editCellIndex && navigateToNextCell) {
            preventGridEvent();

            const isSaved: boolean = await saveCellChanges();

            if (isSaved !== false) {
                const focusModule: FocusStrategyResult | undefined = _gridRef.current?.focusModule;
                const lastFocusedCell: FocusedCellInfo | undefined = focusModule?.getLastFocusedCell?.();
                if (focusModule && lastFocusedCell && !lastFocusedCell.isHeader && !lastFocusedCell.isAggregate) {
                    const contentMatrix: IFocusMatrix = focusModule.getContentMatrix();
                    focusModule.setActiveMatrix('Content');
                    contentMatrix.select(lastFocusedCell.rowIndex, lastFocusedCell.colIndex);
                    contentMatrix.current = [lastFocusedCell.rowIndex, lastFocusedCell.colIndex];
                }
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
