import { useState, useCallback, useRef, useEffect, RefObject, SetStateAction, Dispatch } from 'react';
import { EditEndAction, IRow, ValueType } from '../types';
import { GridRef, RowInfo } from '../types/grid.interfaces';
import { EditSettings, EditState, UseEditResult, UseConfirmDialogResult, SaveEvent, DeleteEvent, CancelFormEvent, FormRenderEvent, RowAddEvent, RowEditEvent } from '../types/edit.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { UseDataResult } from '../types/interfaces';
import { useConfirmDialog } from './useEditDialog';
import { ServiceLocator } from '../types/interfaces';
import { IL10n, isNullOrUndefined, addClass } from '@syncfusion/react-base';
import { FocusedCellInfo, FocusStrategyResult } from '../types/focus.interfaces';
import { DataManager, DataResult, DataUtil, ReturnType } from '@syncfusion/react-data';
import { FormState, IFormValidator } from '@syncfusion/react-inputs';

/**
 * Edit hook for managing inline editing functionality in React Grid
 *
 * @private
 * @param {RefObject<GridRef>} _gridRef - Reference to the grid instance
 * @param {ServiceLocator} serviceLocator - Service locator for accessing grid services
 * @param {ColumnProps[]} columns - Column definitions for validation
 * @param {Object[]} currentViewData - Current data source array
 * @param {UseDataResult} dataOperations - Data operations object containing DataManager and related methods
 * @param {FocusStrategyResult} focusModule - Reference to the focus module
 * @param {EditSettings} editSettings - Edit configuration settings
 * @param {Dispatch<SetStateAction<Object>>} setGridAction - Function to set grid actions
 * @param {Dispatch<SetStateAction<number>>} setCurrentPage - Function to set grid currentpage
 * @param {Dispatch<SetStateAction<Object>>} setResponseData - Function to set aggregate updated data
 * @returns {Object} Edit state and methods
 */
export const useEdit: (
    _gridRef: RefObject<GridRef>,
    serviceLocator: ServiceLocator,
    columns: ColumnProps[],
    currentViewData: Object[],
    dataOperations: UseDataResult,
    focusModule: FocusStrategyResult,
    editSettings: EditSettings,
    setGridAction: Dispatch<SetStateAction<Object>>,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    setResponseData: Dispatch<SetStateAction<Object>>
) => UseEditResult = (
    _gridRef: RefObject<GridRef>,
    serviceLocator: ServiceLocator,
    columns: ColumnProps[],
    currentViewData: Object[],
    dataOperations: UseDataResult,
    focusModule: FocusStrategyResult,
    editSettings: EditSettings,
    setGridAction: Dispatch<SetStateAction<Object>>,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    setResponseData: Dispatch<SetStateAction<Object>>
) => {
    // Use currentViewData (processed array) for display
    const viewData: Object[] = currentViewData;

    const dialogHook: UseConfirmDialogResult = useConfirmDialog(serviceLocator);
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const { confirmOnDelete } = dialogHook;
    const prevFocusedCell: RefObject<FocusedCellInfo> = useRef({} as FocusedCellInfo);
    const nextPrevEditRowInfo: RefObject<KeyboardEvent> = useRef({} as KeyboardEvent);
    const focusLastField: RefObject<boolean> = useRef(false);
    const escEnterIndex: RefObject<number> = useRef(0);
    const notKeyBoardAllowedClickRowInfo: RefObject<RowInfo> = useRef<RowInfo>({});

    // Edit state management
    const [editState, setEditState] = useState<EditState>({
        isEdit: false,
        editRowIndex: -1,
        editCellField: null,
        editData: null,
        originalData: null,
        validationErrors: {},
        showAddNewRowData: null,
        isShowAddNewRowActive: false,
        isShowAddNewRowDisabled: false
    });

    /**
     * Default edit settings with fallbacks
     */
    const defaultEditSettings: EditSettings = {
        allowAdd: false,
        allowEdit: false,
        allowDelete: false,
        mode: 'Normal',
        editOnDoubleClick: true,
        confirmOnEdit: true,
        confirmOnDelete: false,
        showAddNewRow: false,
        newRowPosition: 'Top',
        ...editSettings
    };

    const validateEditForm: () => boolean = useCallback(() => {
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.validateForm?.() :
            _gridRef.current?.addInlineRowFormRef?.current?.validateForm?.()) ?? true;
    }, [
        editState.originalData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const validateField: (field: string) => boolean = useCallback((field: string): boolean => {
        const column: ColumnProps | undefined = columns.find((col: ColumnProps) => col.field === field);
        if (!column || !column.validationRules) {
            return true;
        }

        if (isNullOrUndefined(editState.originalData)) {
            return _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current?.validateField?.(field);
        } else {
            return _gridRef.current?.editInlineRowFormRef?.current?.formRef?.current?.validateField?.(field);
        }
    }, [columns]);

    /**
     * Gets the primary key field name from columns
     */
    const getPrimaryKeyField: () => string = useCallback((): string => {
        const primaryKeys: string[] = _gridRef.current?.getPrimaryKeyFieldNames?.();
        return primaryKeys[0];
    }, [_gridRef.current?.getPrimaryKeyFieldNames]);

    /**
     * Starts editing for the specified row or selected row
     */
    const editRow: (rowElement?: HTMLTableRowElement) => Promise<void> = useCallback(async (rowElement?: HTMLTableRowElement) => {
        const eventTarget: HTMLElement = event?.target as HTMLElement;
        if (!defaultEditSettings.allowEdit) {
            return;
        }
        if (editState.isEdit && !defaultEditSettings.showAddNewRow) {
            const isValid: boolean = validateEditForm();
            if (!isValid) {
                return;
            }
        }
        let rowIndex: number = -1;
        let hasValidSelection: boolean = false;

        if (rowElement) {
            const rowIndexAttr: string | null = rowElement.getAttribute('aria-rowindex');
            rowIndex = rowIndexAttr ? (parseInt(rowIndexAttr, 10) - 1) : -1;
            hasValidSelection = rowIndex >= 0;
        } else {
            const gridRef: GridRef | null = _gridRef?.current;
            let selectedIndexes: number[] = [];

            selectedIndexes = gridRef?.selectionModule?.getSelectedRowIndexes();

            if (selectedIndexes.length === 0 && typeof gridRef.getSelectedRowIndexes === 'function') {
                selectedIndexes = gridRef.getSelectedRowIndexes();
            }

            if (selectedIndexes.length > 0) {
                rowIndex = selectedIndexes[0];
                hasValidSelection = true;
            }
        }

        if (!hasValidSelection || rowIndex < 0) {
            const message: string = localization.getConstant('noRecordsEditMessage');
            await dialogHook.confirmOnEdit({
                title: '',
                message: message,
                confirmText: localization.getConstant('okButtonLabel'),
                cancelText: '',
                type: 'info'
            });
            eventTarget?.focus?.();
            return;
        }

        // Validate row index bounds
        if (rowIndex < 0 || rowIndex >= viewData.length) {
            return;
        }

        const rowData: Object = viewData[rowIndex as number];
        if (!rowData) {
            return;
        }

        const actionBeginArgs: Record<string, ValueType | null> = {
            cancel: false,
            requestType: 'beginEdit',
            type: 'actionBegin',
            rowIndex: rowIndex,
            action: 'beginEdit',
            rowData: { ...rowData }
        };

        // Get grid reference for actionBegin event
        const gridRef: GridRef | null = _gridRef?.current;
        const startArgs: RowEditEvent = {
            cancel: false,
            rowData: actionBeginArgs.rowData,
            rowIndex: actionBeginArgs.rowIndex as number
        };
        gridRef?.onRowEditStart?.(startArgs);

        // If the operation was cancelled, return early
        if (startArgs.cancel) {
            return;
        }

        editDataRef.current = { ...rowData };
        const updateState: Partial<EditState> = {
            isEdit: true,
            editRowIndex: rowIndex,
            editData: { ...rowData },
            originalData: { ...rowData },
            validationErrors: {}
        };

        if (defaultEditSettings.showAddNewRow) {
            updateState.isShowAddNewRowActive = true;
            updateState.isShowAddNewRowDisabled = true;
            updateState.showAddNewRowData = editState.showAddNewRowData;
        }

        // Set edit state
        setEditState((prev: EditState) => ({
            ...prev,
            ...updateState
        }));
        const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
        const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
            detail: { isEdit: true, editRowIndex: rowIndex }
        });
        editGridElement?.dispatchEvent(editStateEvent);
        requestAnimationFrame(() => {
            setTimeout(() => {
                const actionCompleteArgs: Record<string, ValueType | null> = {
                    requestType: 'beginEdit',
                    type: 'actionComplete',
                    rowData: { ...rowData },
                    rowIndex: rowIndex,
                    action: 'beginEdit',
                    formRef: gridRef?.editInlineRowFormRef.current?.formRef?.current
                };
                const eventArgs: FormRenderEvent = {
                    formRef: gridRef?.editInlineRowFormRef.current?.formRef as RefObject<IFormValidator>,
                    rowData: actionCompleteArgs.rowData,
                    rowIndex: actionCompleteArgs.rowIndex as number
                };
                gridRef?.onFormRender?.(eventArgs);
                prevFocusedCell.current = { ...focusModule.getFocusedCell() };
            }, 0);
        });
    }, [
        defaultEditSettings.allowEdit,
        defaultEditSettings.showAddNewRow,
        viewData,
        _gridRef,
        editState.isEdit,
        editState.editRowIndex,
        editState.editData,
        editState.originalData,
        editState.showAddNewRowData,
        focusModule
    ]);

    /**
     * Get current edit data from ref for save operations
     * This ensures we always get the latest typed values, not stale state values
     */
    const getCurrentEditData: () => Object = useCallback(() => {
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.formState?.values :
            _gridRef.current?.addInlineRowFormRef?.current?.formState?.values) || editDataRef.current;
    }, [
        editState.editData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const getCurrentFormRef: () => RefObject<IFormValidator> = useCallback(() => {
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.formRef :
            _gridRef.current?.addInlineRowFormRef?.current?.formRef);
    }, [
        editState.editData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const getCurrentFormState: () => FormState = useCallback(() => {
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.formState :
            _gridRef.current?.addInlineRowFormRef?.current?.formState);
    }, [
        editState.editData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    /**
     * Ends editing and saves changes using DataManager operations
     */
    const saveChanges: (isValidationRequired?: boolean, insertIndex?: number, endAction?: EditEndAction) => Promise<boolean> =
        useCallback(async (isValidationRequired: boolean = true, insertIndex: number, endAction?: EditEndAction): Promise<boolean> => {
            if (!editState.isEdit && isNullOrUndefined(insertIndex)) {
                return false;
            }

            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;
            const currentEditData: Object = getCurrentEditData();

            if (!currentEditData) {
                return false;
            }

            // Store the current edit row index for focus management
            const savedRowIndex: number = editState.editRowIndex;

            const isFormValid: boolean = isValidationRequired ? validateEditForm() : true;
            if (!isFormValid) {
                setEditState((prev: EditState) => ({
                    ...prev,
                    validationErrors: !prev.originalData ? _gridRef.current?.addInlineRowFormRef.current?.formState.errors :
                        _gridRef.current?.editInlineRowFormRef.current?.formState.errors
                }));
                // FormValidator found validation errors, don't proceed with save
                return false;
            }

            const isAddOperation: boolean = editState.editRowIndex === -1 || !editState.originalData ||
                                Object.keys(editState.originalData).length === 0;
            const customBindingEdit: boolean = customBinding && !isAddOperation;

            const actionBeginArgs: Record<string, ValueType | null> = {
                cancel: false,
                requestType: 'save',
                type: 'actionBegin',
                rowData: currentEditData,
                rowIndex: editState.editRowIndex,
                action: isAddOperation ? 'add' : 'edit',
                previousData: editState.originalData
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: SaveEvent = {
                action: actionBeginArgs.action as string,
                editedRowData: actionBeginArgs.rowData,
                rowData: actionBeginArgs.previousData,
                rowIndex: actionBeginArgs.rowIndex as number,
                cancel: false
            };
            gridRef?.onDataChangeStart?.(startArgs);

            // If the operation was cancelled, return early
            if (startArgs.cancel) {
                return false;
            }
            setGridAction({});

            try {
                if (isAddOperation) {
                    let insertIndex: number;

                    if (defaultEditSettings.showAddNewRow) {
                        // For showAddNewRow, respect the newRowPosition setting
                        if (defaultEditSettings.newRowPosition === 'Bottom') {
                            insertIndex = viewData.length; // Add at the end
                        } else {
                            insertIndex = 0; // Add at the beginning (Top - default)
                        }
                    } else if (editState.editRowIndex !== -1) {
                        // For programmatic addRecord(data, index), use the specified index
                        insertIndex = editState.editRowIndex;
                    } else {
                        // Fallback to newRowPosition setting for regular add operations
                        if (defaultEditSettings.newRowPosition === 'Top') {
                            insertIndex = 0;
                        } else {
                            insertIndex = viewData.length;
                        }
                    }

                    await dataOperations.getData(customBinding ? { ...actionBeginArgs, index: insertIndex } : {
                        requestType: 'save',
                        data: currentEditData,
                        index: insertIndex
                    });

                    if (!customBinding) {
                        _gridRef.current?.refresh(); // initiate getData with requestType as 'refresh'
                    }
                } else {
                    // For edit operations, use update operation
                    await dataOperations.getData(customBinding ? actionBeginArgs : {
                        requestType: 'update',
                        data: currentEditData
                    });
                    if (_gridRef.current?.aggregates?.length) {
                        let isFiltered: boolean = false;
                        if (!(dataOperations.isRemote() || (!isNullOrUndefined(dataOperations.dataManager)
                            && (dataOperations.dataManager as DataResult).result)) && ((_gridRef.current?.filterSettings?.enabled
                                && _gridRef.current?.filterSettings?.columns?.length)
                                || _gridRef.current?.searchSettings?.value?.length)) {
                            isFiltered = true;
                        }
                        let currentViewData: Object[];
                        if (!isNullOrUndefined(dataOperations.dataManager) && (dataOperations.dataManager as DataResult).result) {
                            currentViewData = _gridRef.current?.getCurrentViewRecords();
                        } else {
                            currentViewData = ((dataOperations.dataManager as DataManager).dataSource.json.length ?
                                (isFiltered ? (await (_gridRef.current?.getData(true, true) as Promise<ReturnType>)).result :
                                    (dataOperations.dataManager as DataManager).dataSource.json)
                                : _gridRef.current?.getCurrentViewRecords());
                        }
                        setResponseData((prevData: DataResult) => ({
                            ...prevData,
                            aggregates: customBinding ? prevData.aggregates : undefined,
                            result: [...currentViewData.map((item: Object) =>
                                item[getPrimaryKeyField()] === currentEditData[getPrimaryKeyField()] ?
                                    { ...item, ...currentEditData } : item
                            )]
                        }));
                    }
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError({
                    error: error as Error
                });
                return false;
            }

            const actionCompleteArgs: Record<string, ValueType | null> = {
                requestType: 'save',
                type: 'actionComplete',
                rowData: currentEditData,
                rowIndex: isNullOrUndefined(insertIndex) ? editState.editRowIndex : insertIndex,
                action: isAddOperation ? 'add' : 'edit',
                previousData: editState.originalData
            };

            const nextPrevEditRow: () => boolean = (): boolean => {
                const isNextPrevEditRow: boolean = !isAddOperation && Object.keys(nextPrevEditRowInfo.current).length
                    && nextPrevEditRowInfo.current.key === 'Tab'
                    && ((!nextPrevEditRowInfo.current.shiftKey && editState.editRowIndex < currentViewData.length - 1)
                        || (nextPrevEditRowInfo.current.shiftKey && editState.editRowIndex > 0))
                    ? true : false;
                if (isNextPrevEditRow) {
                    const shiftKey: boolean = nextPrevEditRowInfo.current.shiftKey;
                    focusLastField.current = shiftKey;
                    setTimeout(() => {
                        gridRef.selectionModule?.selectRow(shiftKey ? editState.editRowIndex - 1 : editState.editRowIndex + 1);
                        setTimeout(() => {
                            editRow();
                        }, 0);
                    }, 0);
                }
                nextPrevEditRowInfo.current = {} as KeyboardEvent;
                return isNextPrevEditRow;
            };

            const addDeleteActionComplete: () => void = () => {
                if (customBindingEdit && gridRef && gridRef.selectionModule) {
                    requestAnimationFrame(() => {
                        attemptFocusAfterSave();
                    });
                } else if (isAddOperation && gridRef && gridRef.selectionModule) {
                    // Calculate the correct row index to select based on newRowPosition
                    let rowIndexToSelect: number = editState.editRowIndex;

                    // For showAddNewRow with Bottom position, the newly added row will be at the end
                    if (defaultEditSettings.showAddNewRow) {
                        if (defaultEditSettings.newRowPosition === 'Bottom') {
                            // For bottom position, the new row is added at the end of the current data
                            rowIndexToSelect = viewData.length; // This will be the index after the data is updated
                        } else {
                            // For top position (default), the new row is added at index 0
                            rowIndexToSelect = 0;
                        }
                    }

                    setTimeout(() => {
                        if (gridRef.selectionModule && rowIndexToSelect >= 0) {
                            gridRef.selectionModule?.selectRow(rowIndexToSelect);

                            // Focus the corresponding cell after auto-selection
                            // This ensures that the focus moves to the selected row's first visible cell
                            gridRef?.focusModule?.setGridFocus(true);
                            requestAnimationFrame(() => {
                                // Navigate to the selected row's first visible cell
                                gridRef?.focusModule?.navigateToCell(rowIndexToSelect, focusModule.firstFocusableContentCellIndex[1]);
                            });
                        }
                    }, 0);
                }
                requestAnimationFrame(() => {
                    const tr: HTMLTableRowElement = gridRef.contentTableRef?.rows?.[gridRef.contentTableRef?.rows?.length - 1];
                    if (gridRef.height !== 'auto' && !isAddOperation && (editState.editRowIndex + 1).toString() === tr.getAttribute('aria-rowindex') &&
                        (gridRef.contentPanelRef?.firstElementChild as HTMLElement)?.offsetHeight > gridRef.contentTableRef?.scrollHeight) {
                        addClass([].slice.call(tr.getElementsByClassName('sf-rowcell')), 'sf-lastrowcell');
                    }
                });
                const eventArgs: SaveEvent = {
                    action: actionCompleteArgs.action as string,
                    editedRowData: actionCompleteArgs.rowData,
                    rowData: actionCompleteArgs.previousData,
                    rowIndex: actionCompleteArgs.rowIndex as number
                };
                gridRef?.onDataChangeComplete?.(eventArgs);
                _gridRef.current.element.removeEventListener('actionComplete', addDeleteActionComplete);
            };

            _gridRef.current.element.addEventListener('actionComplete', addDeleteActionComplete);
            if (!isAddOperation && !customBindingEdit) {
                _gridRef.current.element.dispatchEvent(new CustomEvent('actionComplete'));
            }

            editDataRef.current = null;

            // This ensures showAddNewRow inputs are properly re-enabled after saving edits
            const newEditState: Partial<EditState> = {
                editRowIndex: -1,
                editData: null,
                originalData: null,
                validationErrors: {}
            };

            if (defaultEditSettings.showAddNewRow) {
                newEditState.isEdit = true;
                newEditState.isShowAddNewRowActive = true;

                // Explicitly set isShowAddNewRowDisabled to false
                newEditState.isShowAddNewRowDisabled = false;

                // Restore the original add form data and set as current edit data
                newEditState.showAddNewRowData = editState.showAddNewRowData;
                newEditState.editData = editState.showAddNewRowData;
                newEditState.originalData = null; // null for showAddNewRow operations

                // Update edit data ref with the restored add row data
                // This ensures consistent data state across component
                editDataRef.current = editState.showAddNewRowData ? { ...editState.showAddNewRowData } : null;
            } else {
                // Normal behavior - exit edit state completely
                newEditState.isEdit = false;
                newEditState.isShowAddNewRowActive = false;
                newEditState.isShowAddNewRowDisabled = false;
                newEditState.showAddNewRowData = null;
            }

            // Always ensure isShowAddNewRowDisabled is explicitly set to false
            // This is essential for test case: "should re-enable showAddNewRow inputs after saving edited row"
            setEditState((prev: EditState) => ({
                ...prev,
                ...newEditState,
                // Always force isShowAddNewRowDisabled to false when showAddNewRow is enabled
                isShowAddNewRowDisabled: false
            }));

            // Dispatch custom event for toolbar refresh when exiting edit mode
            const exitEditGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: {
                    isEdit: newEditState.isEdit || false,
                    editRowIndex: newEditState.editRowIndex || -1
                }
            });
            exitEditGridElement?.dispatchEvent(editStateEvent);

            const attemptFocusAfterSave: () => void = () => {
                if (nextPrevEditRow()) {
                    return;
                }
                const lastFocusedCellinfo: FocusedCellInfo = !_gridRef.current?.allowKeyboard ?
                    {
                        rowIndex: notKeyBoardAllowedClickRowInfo.current.rowIndex,
                        colIndex: notKeyBoardAllowedClickRowInfo.current?.columnIndex,
                        isHeader: false
                    } : _gridRef.current.focusModule.getFocusedCell();
                // First ensure grid has focus
                gridRef?.focusModule?.setGridFocus(true);

                // Select the appropriate row
                gridRef?.selectionModule?.selectRow(lastFocusedCellinfo?.rowIndex > -1 && endAction === 'Click' ? lastFocusedCellinfo?.rowIndex : savedRowIndex);

                // Calculate the proper target row index based on configuration
                const targetRowIndex: number = lastFocusedCellinfo?.rowIndex > -1 ? lastFocusedCellinfo?.rowIndex :
                    (defaultEditSettings.showAddNewRow && defaultEditSettings.newRowPosition === 'Top' ?
                        savedRowIndex + 1 : savedRowIndex);
                requestAnimationFrame(() => {
                    gridRef?.focusModule?.navigateToCell(endAction === 'Click' ? targetRowIndex : savedRowIndex, lastFocusedCellinfo?.colIndex !== -1 && endAction === 'Click' ?
                        lastFocusedCellinfo?.colIndex : endAction === 'Key' ? escEnterIndex.current : 0);
                });
            };

            // Only perform special focus management for keyboard (Tab) navigation
            // maintain focus on the clicked cell while Tab navigation follows standard patterns
            requestAnimationFrame(() => {
                if (!isAddOperation && !customBindingEdit) {
                    attemptFocusAfterSave();
                }
            });

            return true;
        }, [
            editState,
            getCurrentEditData,
            dataOperations,
            _gridRef,
            focusModule
        ]);

    /**
     * Closes editing without saving changes
     * Enhanced to handle showAddNewRow behavior correctly
     * When showAddNewRow is enabled, canceling should re-enable the add new row and keep grid in edit state
     */
    const cancelChanges: (endAction?: EditEndAction) => Promise<void> = useCallback(async (endAction?: EditEndAction) => {
        // Handle showAddNewRow special case
        // If showAddNewRow is enabled and we only have the add new row active (no edited row),
        // then we should just re-enable the add new row and return
        if (defaultEditSettings.showAddNewRow && editState.isShowAddNewRowActive && editState.editRowIndex === -1 &&
            !editState.isShowAddNewRowDisabled && !editState.originalData &&
            Object.keys(_gridRef.current?.addInlineRowFormRef?.current?.formState?.modified).length) {
            const defaultRecord: Object = {};
            setDefaultValueRecords(defaultRecord);
            const editStateEvent: CustomEvent = new CustomEvent('resetShowAddNewRowForm', {
                detail: {
                    editData: defaultRecord
                }
            });
            _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current?.element?.dispatchEvent?.(editStateEvent);
            // Re-enable the add new row and clear any validation errors
            setEditState((prev: EditState) => ({
                ...prev,
                validationErrors: {},
                editData: prev.showAddNewRowData // Reset to original add new row data
            }));

            // Reset the edit data ref
            editDataRef.current = editState.showAddNewRowData ? { ...editState.showAddNewRowData } : null;
            return;
        }

        if (!editState.isEdit) {
            return;
        }

        // For inline/normal editing, do NOT show confirm dialog
        // Trigger cancel event
        const cancelArgs: Record<string, ValueType | null> = {
            requestType: 'cancel',
            rowIndex: editState.editRowIndex,
            rowData: getCurrentEditData(),
            formRef: getCurrentFormRef()
        };

        setTimeout(() => {
            _gridRef.current?.selectionModule?.selectRow(editState.editRowIndex);
            _gridRef.current?.focusModule?.setGridFocus(true);
            requestAnimationFrame(() => {
                _gridRef.current?.focusModule?.navigateToCell(editState.editRowIndex, endAction === 'Key' ? escEnterIndex.current : 0);
            });
        }, 0);
        const eventArgs: CancelFormEvent = {
            formRef: cancelArgs.formRef as RefObject<IFormValidator>,
            rowData: cancelArgs.rowData,
            rowIndex: cancelArgs.rowIndex as number
        };
        _gridRef.current?.onDataChangeCancel?.(eventArgs);

        // Enhanced reset edit state with improved showAddNewRow handling
        // This ensures showAddNewRow inputs are properly re-enabled after cancel
        const newEditState: Partial<EditState> = {
            editRowIndex: -1,
            editData: null,
            originalData: null,
            validationErrors: {}
        };

        if (defaultEditSettings.showAddNewRow) {
            newEditState.isEdit = true;
            newEditState.isShowAddNewRowActive = true;

            // Explicitly set isShowAddNewRowDisabled to false
            // This ensures inputs are always re-enabled after cancel
            newEditState.isShowAddNewRowDisabled = false;

            // Restore the original add form data and set as current edit data
            newEditState.showAddNewRowData = editState.showAddNewRowData;
            newEditState.editData = editState.showAddNewRowData;
            newEditState.originalData = null; // Empty for add operations

            // Update edit data ref with the restored add row data
            // This ensures consistent data state across component
            editDataRef.current = editState.showAddNewRowData ? { ...editState.showAddNewRowData } : null;
        } else {
            // Normal behavior - exit edit state completely
            newEditState.isEdit = false;
            newEditState.isShowAddNewRowActive = false;
            newEditState.isShowAddNewRowDisabled = false;
            newEditState.showAddNewRowData = null;
            editDataRef.current = null;
        }

        // Always ensure isShowAddNewRowDisabled is explicitly set to false
        // This is essential for test case: "should re-enable showAddNewRow inputs after canceling edited row"
        setEditState((prev: EditState) => ({
            ...prev,
            ...newEditState,
            // Always force isShowAddNewRowDisabled to false when showAddNewRow is enabled
            isShowAddNewRowDisabled: false
        }));

        // Dispatch custom event for toolbar refresh when canceling edit mode
        const cancelEditGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
        const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
            detail: {
                isEdit: newEditState.isEdit || false,
                editRowIndex: newEditState.editRowIndex || -1
            }
        });
        cancelEditGridElement?.dispatchEvent(editStateEvent);
    }, [editState, defaultEditSettings.showAddNewRow, _gridRef, _gridRef.current?.editInlineRowFormRef?.current?.formState,
        _gridRef.current?.addInlineRowFormRef?.current?.formState]);

    const setDefaultValueRecords: (data: Object) => void = (data: Object) => {
        columns.forEach((column: ColumnProps) => {
            // Only set value if column has explicit defaultValue
            // Otherwise leave undefined to render truly empty edit forms
            if (column.defaultValue !== undefined) {
                // Apply the explicit default value
                if (column.type === 'string') {
                    data[column.field] = typeof column.defaultValue === 'string'
                        ? column.defaultValue
                        : String(column.defaultValue);
                } else {
                    data[column.field] = column.defaultValue;
                }
            }
            // Don't set any value if no defaultValue is specified
        });
    };
    /**
     * Adds a new record to the grid
     */
    const addRecord: (data?: Object, index?: number) => void =
        useCallback(async (data?: Record<string, ValueType | null>, index?: number) => {
            if (!defaultEditSettings.allowAdd || _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current) {
                return;
            }

            // Create new record with proper default value handling
            // Only apply defaultValue when explicitly set, otherwise leave undefined
            const newRecord: Record<string, ValueType | null> = data || {};

            // If no data provided, only initialize fields that have explicit defaultValue
            if (!data) {
                setDefaultValueRecords(newRecord);
            }

            let insertIndex: number;
            if (index !== undefined) {
                // Only use provided index when explicitly passed programmatically
                // This is the ONLY case where addRecord should add at a specific position
                insertIndex = index;
            } else {
                // For normal addRecord operations (like button clicks),
                // NEVER use selected row index - only use newRowPosition setting
                if (defaultEditSettings.newRowPosition === 'Top') {
                    insertIndex = 0; // Always add at top
                } else {
                    insertIndex = viewData.length; // Always add at bottom
                }
                // Remove the selected row logic completely for normal add operations
                // This was causing the issue where add record was adding at selected row index
            }

            const actionBeginArgs: Record<string, ValueType | null> = {
                cancel: false,
                requestType: 'add',
                type: 'actionBegin',
                rowData: newRecord,
                index: insertIndex,
                action: 'add'
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            if (gridRef && (gridRef.onRowAddStart) && !data) {
                const startArgs: RowAddEvent = {
                    cancel: false,
                    rowData: actionBeginArgs.rowData,
                    rowIndex: actionBeginArgs.index as number
                };
                gridRef?.onRowAddStart?.(startArgs);

                // If the operation was cancelled, return early
                if (startArgs.cancel) {
                    return;
                }
            }

            // Set edit state for add operation without updating currentViewData
            // This creates a dummy edit row that doesn't affect the data source until save

            // Initialize the edit data ref to prevent re-renders during typing
            editDataRef.current = { ...newRecord };

            // When using toolbar add or programmatic addRecord(),
            // we need to ensure we're not triggering the isEditingExistingRow logic
            // Set originalData explicitly to null or empty object to signal this is an add operation
            setEditState((prev: EditState) => ({
                ...prev,
                isEdit: !data ? true : false,
                editRowIndex: insertIndex,
                editData: { ...newRecord }, // Use the newRecord (which may be empty) for add operations
                originalData: null, // For toolbar/programmatic add, explicitly set to null
                validationErrors: {}
            }));

            if (!data) {
                // Dispatch custom event for toolbar refresh when entering add mode
                const addRecordGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
                const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                    detail: {
                        isEdit: true,
                        editRowIndex: insertIndex,
                        isAdd: true // Explicitly mark this as an add operation
                    }
                });
                addRecordGridElement?.dispatchEvent(editStateEvent);

                // STEP 3: Trigger actionComplete event after the grid is actually in edit state
                // Use requestAnimationFrame to ensure DOM is updated and edit form is rendered
                requestAnimationFrame(() => {
                    // Additional timeout to ensure edit form is fully rendered
                    setTimeout(() => {
                        const actionCompleteArgs: Record<string, ValueType | null> = {
                            requestType: 'add',
                            type: 'actionComplete',
                            data: { ...newRecord },
                            rowIndex: insertIndex,
                            action: 'add',
                            rowData: { ...newRecord },
                            form: gridRef?.addInlineRowFormRef.current?.formRef.current?.element
                        };
                        const eventArgs: FormRenderEvent = {
                            formRef: gridRef?.addInlineRowFormRef.current?.formRef as RefObject<IFormValidator>,
                            rowData: actionCompleteArgs.rowData,
                            rowIndex: actionCompleteArgs.rowIndex as number
                        };
                        gridRef?.onFormRender?.(eventArgs);
                        gridRef?.focusModule?.removeFocusTabIndex();
                        prevFocusedCell.current = { rowIndex: -1, colIndex: -1, isHeader: false };
                    }, 0);
                });
            } else {
                saveChanges(false, insertIndex);
            }
        }, [
            defaultEditSettings.allowAdd,
            defaultEditSettings.newRowPosition,
            defaultEditSettings.mode,
            dataOperations,
            _gridRef,
            columns,
            viewData
        ]);

    /**
     * Deletes a record from the grid
     */
    const deleteRecord: (fieldName?: string, data?: Object | Object[]) => Promise<void> =
        useCallback(async (fieldName?: string, data?: Object | Object[]) => {
            const eventTarget: HTMLElement = event?.target as HTMLElement;
            if (!defaultEditSettings.allowDelete) {
                return;
            }

            let recordsToDelete: Object[] = [];
            let deleteIndexes: number[] = [];

            if (!data) {
                // Delete selected records using selection module (multiple row support)
                const gridRef: GridRef | null = _gridRef?.current;
                const selectedIndexes: number[] = gridRef.selectionModule.getSelectedRowIndexes();
                if (selectedIndexes && selectedIndexes.length > 0) {
                    // Handle multiple selected rows for deletion
                    deleteIndexes = [...selectedIndexes];
                    recordsToDelete = selectedIndexes.map((index: number) => viewData[index as number]);
                } else {
                    // Show validation message if no records are selected
                    const message: string = localization?.getConstant('noRecordsDeleteMessage');
                    await dialogHook?.confirmOnEdit({
                        title: '',
                        message: message,
                        confirmText:  localization?.getConstant('okButtonLabel'),
                        cancelText: '', // No cancel button for alert dialogs
                        type: 'info'
                    });
                    eventTarget?.focus?.();
                    return;
                }
            } else {
                // Handle single record deletion with provided data
                if (data instanceof Array) {
                    const dataLen: number = data.length;
                    const primaryKeyField: string = fieldName || getPrimaryKeyField();

                    for (let i: number = 0; i < dataLen; i++) {
                        let tmpRecord: Object;
                        const contained: boolean = viewData.some((record: Object) => {
                            tmpRecord = record;
                            return data[i as number] === (record as Record<string, unknown>)[primaryKeyField as string] ||
                                data[i as number] === record;
                        });

                        if (contained) {
                            recordsToDelete.push(tmpRecord);
                            const index: number = viewData.indexOf(tmpRecord);
                            if (index !== -1) {
                                deleteIndexes.push(index);
                            }
                        } else {
                            // Handle case where data[i] is a partial record with primary key
                            const recordData: Object = (data[i as number] as Record<string, unknown>)[primaryKeyField as string] ?
                                data[i as number] : { [primaryKeyField as string]: data[i as number] };
                            recordsToDelete.push(recordData);

                            // Find index by primary key
                            const index: number = viewData.findIndex((item: Object) =>
                                (item as Record<string, unknown>)[primaryKeyField as string] ===
                                (recordData as Record<string, unknown>)[primaryKeyField as string]
                            );
                            if (index !== -1) {
                                deleteIndexes.push(index);
                            }
                        }
                    }
                } else if (fieldName) {
                    // Find record by field value
                    const deleteIndex: number = viewData.findIndex((item: Object) =>
                        (item as Record<string, unknown>)[fieldName as string] === (data as Record<string, unknown>)[fieldName as string]
                    );
                    if (deleteIndex !== -1) {
                        recordsToDelete = [viewData[deleteIndex as number] as Object];
                        deleteIndexes = [deleteIndex as number];
                    }
                } else {
                    // Single record deletion
                    recordsToDelete = [data as Object];
                    const index: number = viewData.indexOf(data);
                    if (index !== -1) {
                        deleteIndexes = [index as number];
                    }
                }
            }

            if (recordsToDelete.length === 0) {
                return;
            }

            // Show delete confirmation if enabled
            if (defaultEditSettings.confirmOnDelete) {
                // Use React dialog component instead of window.confirm
                // This provides a consistent UI experience and follows React patterns
                const confirmResult: boolean = await confirmOnDelete();
                if (!confirmResult) {
                    eventTarget?.focus?.();
                    return;
                }
            }

            // This ensures consistent event handling pattern across all grid operations
            const actionBeginArgs: Record<string, ValueType | null> = {
                cancel: false,
                requestType: 'delete',
                type: 'actionBegin',
                data: recordsToDelete,
                rows: deleteIndexes.map((index: number) => _gridRef?.current?.getRowByIndex?.(index)).filter(Boolean),
                action: 'delete'
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: DeleteEvent = {
                action: actionBeginArgs.action as string,
                data: actionBeginArgs.data as Object[],
                cancel: false
            };
            gridRef?.onDataChangeStart?.(startArgs);

            // If the operation was cancelled, return early
            if (startArgs.cancel) {
                return;
            }
            setGridAction({});

            // Store the selected row index before deletion for auto-selection after deletion
            const lastFocusedCellinfo: FocusedCellInfo = _gridRef.current.focusModule.getFocusedCell();
            const selectedRowIndexBeforeDeletion: number = lastFocusedCellinfo.rowIndex;
            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;

            // Single deletion: use dataManager.remove()
            // Multiple deletion: use dataManager.saveChanges() with deletedRecords
            try {
                const len: number = recordsToDelete.length;

                if (len === 1) {
                    await dataOperations.getData(customBinding ? actionBeginArgs : {
                        requestType: 'delete',
                        data: recordsToDelete[0]
                    });
                    // Single record deletion
                } else {
                    await dataOperations.getData(customBinding ? actionBeginArgs : {
                        requestType: 'delete',
                        data: recordsToDelete
                    });
                }
                let isCurrentPageChanged: boolean = false;
                if (((len === 1 && (_gridRef.current?.currentViewData.length - len) <= 0) ||
                    ((_gridRef.current?.currentViewData.length - recordsToDelete.length) <= 0)) &&
                    (_gridRef.current?.pageSettings?.currentPage - 1) >= 1 && _gridRef.current?.pagerModule) {
                    setCurrentPage(_gridRef.current?.pageSettings?.currentPage - 1);
                    _gridRef.current?.pagerModule?.goToPage(_gridRef.current?.pageSettings?.currentPage - 1);
                    isCurrentPageChanged = true;
                } else if (!customBinding) {
                    _gridRef.current?.refresh(); // initiate getData with requestType as 'refresh'
                }

                // Trigger actionComplete event after successful operation
                const actionCompleteArgs: Record<string, ValueType | null> = {
                    requestType: 'delete',
                    type: 'actionComplete',
                    data: recordsToDelete,
                    rows: deleteIndexes.map((index: number) => _gridRef?.current?.getRowByIndex?.(index)).filter(Boolean),
                    action: 'delete'
                };

                const addDeleteActionComplete: () => void = () => {
                    // This ensures that after deletion, the grid automatically selects the corresponding row index
                    if (gridRef && gridRef.selectionModule && selectedRowIndexBeforeDeletion >= 0 && !eventTarget) {
                        // Calculate the new row index to select after deletion
                        let newRowIndexToSelect: number = selectedRowIndexBeforeDeletion;

                        // If the deleted row was the last row, select the previous row
                        if (selectedRowIndexBeforeDeletion >= _gridRef.current?.currentViewData?.length - recordsToDelete.length) {
                            newRowIndexToSelect = Math.max(0, _gridRef.current?.currentViewData?.length - recordsToDelete.length - 1);
                        }

                        // Auto-select the corresponding row after deletion
                        // the row at the same index (or previous if it was the last row) after deletion
                        if ((newRowIndexToSelect >= 0 && newRowIndexToSelect < viewData.length - recordsToDelete.length) ||
                            isCurrentPageChanged) {
                            // Use setTimeout to ensure the data source is updated before selection
                            setTimeout(() => {
                                gridRef?.selectionModule?.selectRow(newRowIndexToSelect);

                                // Focus the corresponding cell after auto-selection
                                // This ensures that the focus moves to the selected row's first visible cell
                                gridRef?.focusModule?.setGridFocus(true);
                                requestAnimationFrame(() => {
                                    // Navigate to the selected row's first visible cell
                                    gridRef.focusModule?.navigateToCell(newRowIndexToSelect, lastFocusedCellinfo.colIndex !== -1 ?
                                        lastFocusedCellinfo.colIndex : 0);
                                });
                            }, 0);
                        }
                    }
                    eventTarget?.focus?.();
                    const eventArgs: DeleteEvent = {
                        action: actionCompleteArgs.action as string,
                        data: actionCompleteArgs.data as Object[]
                    };
                    gridRef?.onDataChangeComplete?.(eventArgs);
                    _gridRef.current.element.removeEventListener('actionComplete', addDeleteActionComplete);
                };
                _gridRef.current.element.addEventListener('actionComplete', addDeleteActionComplete);
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError({
                    error: error as Error
                });
                return;
            }
        }, [
            defaultEditSettings.allowDelete,
            defaultEditSettings.confirmOnDelete,
            defaultEditSettings.mode,
            _gridRef,
            viewData,
            getPrimaryKeyField
        ]);

    /**
     * Updates a specific row with new data
     */
    const updateRow: (index: number, data: Object) => void =
        useCallback(async (index: number, data: Object) => {
            if (!defaultEditSettings.allowEdit || index < 0 || index >= viewData.length) {
                return;
            }

            const previousData: Object = viewData[index as number];

            const actionBeginArgs: Record<string, ValueType | null> = {
                cancel: false,
                requestType: 'save',
                type: 'actionBegin',
                rowData: data,
                index: index,
                action: 'edit',
                previousData: previousData
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: SaveEvent = {
                action: actionBeginArgs.action as string,
                editedRowData: actionBeginArgs.rowData,
                rowData: actionBeginArgs.previousData,
                rowIndex: actionBeginArgs.index as number,
                cancel: false
            };
            gridRef?.onDataChangeStart?.(startArgs);

            // If the operation was cancelled, return early
            if (startArgs.cancel) {
                return;
            }

            // Perform CRUD operation through DataManager
            try {
                await dataOperations.getData({
                    requestType: 'update',
                    data
                });

                // Update local data source for immediate UI feedback
                const selectedRow: IRow<ColumnProps> = _gridRef.current?.getRowsObject()[index as number];
                const rowObjectData: Object = { ...selectedRow.data, ...data };
                selectedRow.setRowObject({ ...selectedRow, data: rowObjectData });

                // Trigger actionComplete event AFTER successful operation
                const actionCompleteArgs: Record<string, ValueType | null> = {
                    requestType: 'save',
                    type: 'actionComplete',
                    rowData: data,
                    rowIndex: index,
                    action: 'edit',
                    previousData: previousData
                };
                const eventArgs: SaveEvent = {
                    action: actionCompleteArgs.action as string,
                    editedRowData: actionCompleteArgs.rowData,
                    rowData: actionCompleteArgs.previousData,
                    rowIndex: actionCompleteArgs.rowIndex as number
                };
                gridRef?.onDataChangeComplete?.(eventArgs);

            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError({
                    error: error as Error
                });
            }
        }, [defaultEditSettings.allowEdit, viewData, _gridRef]);

    /**
     * Use a stable ref-based approach for edit data management
     * This prevents re-renders during typing while maintaining data consistency
     */
    const editDataRef: React.RefObject<Object> =
        useRef<Record<string, ValueType | null>>(null);

    /**
     * Enhanced updateEditData function with proper data isolation and persistence
     */
    const updateEditData: (field: string, value: string | number | boolean | Record<string, unknown> | Date) => void =
        useCallback((field: string, value: string | number | boolean | Record<string, unknown> | Date) => {
            if (!editState.isEdit) {
                return;
            }

            // Initialize editDataRef if it's null
            if (!editDataRef.current) {
                editDataRef.current = { ...editState.editData };
            }

            // Update ref immediately for instant access without triggering re-renders
            // This is the key to preventing multiple EditForm re-renders during typing
            const topLevelKey: string = field.split('.')[0];
            const copiedComplexData: Object = field.includes('.') && typeof editDataRef.current[topLevelKey as string] === 'object'
                ? {
                    ...editDataRef.current,
                    [topLevelKey]: JSON.parse(JSON.stringify(editDataRef.current[topLevelKey as string]))
                }
                : { ...editDataRef.current };

            editDataRef.current = DataUtil.setValue(field, value, copiedComplexData);

            // Update the state editData to persist values
            // This ensures that typed values are maintained even when focus moves out of grid
            setEditState((prev: EditState) => ({
                ...prev,
                editData: {
                    ...editDataRef.current
                }
            }));

        }, [editState.isEdit, editState.editData, _gridRef.current]);

    /**
     * Handle click events for showAddNewRow functionality and validation workflow
     */
    const handleGridClick: (event: React.MouseEvent) => void = useCallback(async (event: React.MouseEvent) => {
        const target: Element = event.target as Element;

        // Check if the click is within grid content or header content (for frozen rows)
        const isWithinGridContent: boolean | Element = target.closest('.sf-gridcontent');

        // Only handle clicks within grid content and not on unbound cells
        if (isWithinGridContent && !target.closest('.sf-unboundcelldiv')) {

            // If grid is in edit mode with an actual edited row, end the current edit
            const hasEditedRow: boolean = editState.editRowIndex >= 0 && !isNullOrUndefined(editState.editData);

            if (editState.isEdit && hasEditedRow && !target.closest('.sf-form-validator')) {
                notKeyBoardAllowedClickRowInfo.current = !_gridRef.current?.allowKeyboard ? _gridRef.current?.getRowInfo?.(target) : {};
                saveChanges(undefined, undefined, 'Click');
                const isValid: boolean = validateEditForm();
                // If save failed (validation errors), prevent the click from proceeding
                if (!isValid) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                }
            }
        }
    }, [
        defaultEditSettings.showAddNewRow,
        editState.isShowAddNewRowActive,
        editState.editRowIndex,
        editState.editData,
        editState.originalData,
        editState.isEdit,
        saveChanges,
        _gridRef
    ]);

    /**
     * Enhanced double-click handler for showAddNewRow functionality
     * This ensures proper interaction between showAddNewRow and normal data row editing
     */
    const handleGridDoubleClick: (event: React.MouseEvent) => void =
        useCallback((event: React.MouseEvent) => {

            // Use editModule?.editSettings instead of rest.editSettings to get proper defaults
            // The editModule applies default values including editOnDoubleClick: true
            const editSettings: EditSettings = defaultEditSettings;

            // Only handle double-click for editing if editing is enabled
            // Check editOnDoubleClick with proper default value (true)
            const editOnDoubleClick: boolean = editSettings.editOnDoubleClick !== false; // Default to true
            if (!editSettings.allowEdit || !editOnDoubleClick) {
                return;
            }

            const target: Element = event.target as Element;

            const clickedCell: HTMLTableCellElement = target.closest('td[role="gridcell"], th[role="columnheader"]') as HTMLTableCellElement;

            // Only proceed if we clicked on a valid cell
            if (!clickedCell) {
                return;
            }

            const clickedRow: HTMLTableRowElement = clickedCell.closest('tr[role="row"]') as HTMLTableRowElement;
            const rowElement: HTMLTableRowElement = clickedRow;
            // Only proceed if we have a valid data row with proper attributes
            if (!clickedRow || (!clickedRow.hasAttribute('aria-rowindex') && !clickedRow.hasAttribute('aria-rowindex'))) {
                return;
            }

            // Handle showAddNewRow double-click behavior first - this is critical
            if (editSettings.showAddNewRow) {
                // Check if the double-click is on the add new row - if so, ignore it
                const isAddNewRowClick: boolean = target.closest('.sf-addedrow') !== null ||
                                        target.closest('tr[data-uid*="grid-add-row"]') !== null ||
                                        clickedRow.classList.contains('sf-addedrow') ||
                                        (clickedRow.getAttribute('data-uid') && clickedRow.getAttribute('data-uid').includes('grid-add-row'));
                if (isAddNewRowClick) {
                    return; // Don't allow editing the add new row via double-click
                }
            }

            // Basic preconditions check
            if (!defaultEditSettings.editOnDoubleClick || !defaultEditSettings.allowEdit) {
                return;
            }

            // Only allow double-click on row cells
            const isRowCellClick: boolean = target.closest('td[role="gridcell"]') !== null;
            if (!isRowCellClick) {
                return;
            }

            // Start editing the double-clicked row
            // This ensures double-clicking always starts edit mode on data rows
            // even when showAddNewRow is enabled
            event.preventDefault(); // Prevent text selection on double-click

            editRow(rowElement);
        }, [
            defaultEditSettings.editOnDoubleClick,
            defaultEditSettings.allowEdit,
            defaultEditSettings.showAddNewRow,
            editRow,
            editState.isEdit,
            editState.editRowIndex,
            editState.editData,
            editState.originalData
        ]);

    /**
     * Enhanced showAddNewRow initialization with proper toolbar integration
     * This effect manages the persistent add new row feature that allows users to add records
     * without clicking an "Add" button. The grid remains in edit state when this feature is enabled.
     */
    useEffect(() => {
        if (defaultEditSettings.showAddNewRow && defaultEditSettings.allowAdd) {
            // Initialize the add new row data with default values
            const newRowData: string | number | boolean | Record<string, unknown> | Date = {};

            // Only apply defaultValue when explicitly set, otherwise leave undefined
            columns.forEach((column: ColumnProps) => {
                if (column.field && column.defaultValue !== undefined) {
                    // Apply the explicit default value
                    if (column.type === 'string') {
                        newRowData[column.field] = typeof column.defaultValue === 'string'
                            ? column.defaultValue
                            : String(column.defaultValue);
                    } else {
                        newRowData[column.field] = column.defaultValue;
                    }
                }
                // Don't set any value if no defaultValue is specified
            });

            // Set the grid in edit state with the add new row
            setEditState((prev: EditState) => ({
                ...prev,
                isEdit: true, // Grid remains in edit state when showAddNewRow is enabled
                showAddNewRowData: newRowData,
                isShowAddNewRowActive: true,
                isShowAddNewRowDisabled: false, // Initially enabled
                editRowIndex: -1, // Special index for add new row
                editData: newRowData,
                originalData: null, // Empty for add operations
                validationErrors: {}
            }));

            // Initialize the edit data ref for the add new row
            editDataRef.current = { ...newRowData };

            // Dispatch custom event for toolbar refresh when entering showAddNewRow mode
            // This ensures toolbar buttons maintain proper state (Update/Cancel enabled)
            const gridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            // Synthetic event to update toolbar state for showAddNewRow mode
            const toolbarStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: {
                    isEdit: true,
                    editRowIndex: -1,
                    isShowAddNewRowActive: true
                }
            });
            gridElement?.dispatchEvent(toolbarStateEvent);
        } else {
            // Reset showAddNewRow state when disabled
            setEditState((prev: EditState) => ({
                ...prev,
                showAddNewRowData: null,
                isShowAddNewRowActive: false,
                isShowAddNewRowDisabled: false,
                isEdit: false // Reset edit state when showAddNewRow is disabled
            }));
            editDataRef.current = null;

            // Update toolbar state when showAddNewRow is disabled
            const gridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const toolbarStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: {
                    isEdit: false,
                    editRowIndex: -1,
                    isShowAddNewRowActive: false
                }
            });
            gridElement?.dispatchEvent(toolbarStateEvent);
        }
    }, [defaultEditSettings.showAddNewRow, defaultEditSettings.allowAdd, _gridRef]);

    /**
     * Checks if there are unsaved changes and shows confirmation dialog if needed
     *
     * @private
     * @returns { Promise<boolean> } - true if operation should proceed, false if cancelled
     */
    const checkUnsavedChanges: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        const hasUnsavedChanges: boolean | Object = _gridRef.current?.editInlineRowFormRef?.current?.formRef?.current ||
            _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current;

        if (hasUnsavedChanges && defaultEditSettings.confirmOnEdit) {
            // Show confirmation dialog for unsaved changes
            const message: string = localization.getConstant('unsavedChangesConfirmation');
            focusModule?.clearIndicator?.();
            const confirmResult: boolean = await dialogHook.confirmOnEdit({
                title: '',
                message: message,
                confirmText: localization.getConstant('okButtonLabel'),
                cancelText: localization.getConstant('cancelButtonLabel'),
                type: 'warning'
            });

            focusModule?.addFocus?.(focusModule?.getFocusedCell?.());
            if (!confirmResult) {
                // User cancelled, prevent the data operation
                return false;
            }
        }
        // User confirmed to proceed with losing changes
        // Force close edit state without saving
        setEditState((prev: EditState) => ({
            ...prev,
            originalData: null,
            editRowIndex: -1,
            editData: !defaultEditSettings.showAddNewRow ? null : prev.editData,
            isEdit: defaultEditSettings.showAddNewRow
        }));
        requestAnimationFrame(() => {
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: {
                    isEdit: defaultEditSettings.showAddNewRow,
                    editRowIndex: -1
                }
            });
            _gridRef.current?.element?.dispatchEvent(editStateEvent);
        });
        // No unsaved changes, operation can proceed
        return true;
    }, [_gridRef.current, editState.isEdit, editState.originalData, editState.editData, localization, dialogHook]);

    return {
        // Edit state
        isEdit: editState.isEdit,
        editSettings: defaultEditSettings,
        editRowIndex: editState.editRowIndex,
        editData: editState.editData, // Always return state data for proper form binding
        validationErrors: editState.validationErrors,
        originalData: editState.originalData,

        // showAddNewRow state
        showAddNewRowData: editState.showAddNewRowData,
        isShowAddNewRowActive: editState.isShowAddNewRowActive,
        isShowAddNewRowDisabled: editState.isShowAddNewRowDisabled,

        // Edit operations
        editRow,
        saveChanges,
        cancelChanges,

        // CRUD operations
        addRecord,
        deleteRecord,
        updateRow,

        // Validation
        validateEditForm,
        validateField,

        // Real-time edit data updates
        updateEditData,

        // Get current edit data
        getCurrentEditData,
        getCurrentFormRef,
        getCurrentFormState,

        // Event handlers for showAddNewRow functionality
        handleGridClick,
        handleGridDoubleClick,

        // Batch save lost changes confirmation
        checkUnsavedChanges,

        // Dialog state and methods for confirmation dialogs
        isDialogOpen: dialogHook.isDialogOpen,
        dialogConfig: dialogHook.dialogConfig,
        onDialogConfirm: dialogHook.onDialogConfirm,
        onDialogCancel: dialogHook.onDialogCancel,
        nextPrevEditRowInfo,
        focusLastField,
        escEnterIndex
    };
};
