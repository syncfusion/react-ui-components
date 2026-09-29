import { useState, useCallback, useRef, useEffect, useMemo, RefObject, SetStateAction, Dispatch } from 'react';
import { ActionType, AutoSelectMode, EditEndAction, ScrollMode } from '../types/enum';
import { IRow, ValueType, ServiceLocator } from '../types/interfaces';
import { VirtualSettings } from '../types/virtualization.interface';
import { GroupedData } from '../types/grouping.interfaces';
import { GridRef, RowInfo } from '../types/grid.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { UseDataResult } from '../types/interfaces';
import { FocusedCellInfo, FocusStrategyResult } from '../types/focus.interfaces';
import { EditSettings, EditState, UseEditResult, UseConfirmDialogResult,
    SaveEvent, DeleteEvent, FormCancelEvent, FormRenderEvent, RowAddEvent, RowEditEvent, InlineEditFormRef, payload, CellEditModule, BatchState } from '../types/edit.interfaces';
import { UseCommandColumnResult } from '../types/command.interfaces';
import { selectionModule } from '../types/selection.interfaces';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { isNullOrUndefined } from '@syncfusion/react-base/src/util';
import { addClass } from '@syncfusion/react-base/src/dom';
import { FormState } from '@syncfusion/react-inputs/src/form-validator/index';
import { IFormValidator } from '@syncfusion/react-inputs/src/form-validator/form-validator';
import { buildDeletepayload, getCurrentPageSelectedItems, getRowObjFromElement, executeGridAsyncAction } from '../utils/utils';
import { InlineEditForm } from '../views/editing/InlineEditForm';
import { PopupEditForm } from '../views/editing/PopupEditForm';
import { CellEditForm } from '../views/editing/CellEditForm';
import { PinningModuleResult } from '../types/pinning.interfaces';
import { useConfirmDialog } from './useEditDialog';
import { useCellEdit } from './useCellEdit';
import { ToolbarModule } from './useToolbar';
import { ConfirmDialog } from '../views/editing/ConfirmDialog';
import { DeleteDialog } from '../views/DeleteDialog';
import { DataManager, DataResult, ReturnType, DataUtil } from '@syncfusion/react-data';
import { useBatchEdit } from './useBatchEdit';
import { StagedFieldChange, StagedRowData, UseBatchEditResult } from '../types/batch-edit.interfaces';
import { UseUndoRedoResult, UndoRedoAction, UndoRedoState } from '../types/undoredo.interfaces';


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
 * @param {selectionModule} selectionModule - Reference to the selection module
 * @param {EditSettings} editSettings - Edit configuration settings
 * @param {Dispatch<SetStateAction<Object>>} setGridAction - Function to set grid actions
 * @param {Dispatch<SetStateAction<number>>} setCurrentPage - Function to set grid currentpage
 * @param {Dispatch<SetStateAction<Object>>} setResponseData - Function to set aggregate updated data
 * @param {UseCommandColumnResult} commandColumnModule - Reference to the command column module
 * @param {VirtualSettings} virtualSettings - virtual settings
 * @param {PinningModuleResult} pinningModule - Reference to the row pinning module
 * @param {RefObject<Map<string | number, StagedRowData<T>>>} batchEditStagedRowsRef - Reference to the batch edit staged rows map
 * @param {UseUndoRedoResult} undoRedoModule - Reference to the undo/redo module for action history tracking
 * @returns {Object} Edit state and methods
 */
const useEdit: <T>(
    _gridRef: RefObject<GridRef<T>>,
    serviceLocator: ServiceLocator,
    columns: ColumnProps<T>[],
    currentViewData: (GroupedData<T> | T)[],
    dataOperations: UseDataResult<T>,
    focusModule: FocusStrategyResult,
    selectionModule: selectionModule<T>,
    editSettings: EditSettings<T>,
    setGridAction: Dispatch<SetStateAction<Object>>,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    setResponseData: Dispatch<SetStateAction<Object>>,
    commandColumnModule: UseCommandColumnResult<T>,
    virtualSettings: VirtualSettings,
    pinningModule?: PinningModuleResult<T>,
    batchEditStagedRowsRef?: RefObject<Map<string | number, StagedRowData<T>>>,
    undoRedoModule?: UseUndoRedoResult
) => UseEditResult<T> = <T>(
    _gridRef: RefObject<GridRef<T>>,
    serviceLocator: ServiceLocator,
    columns: ColumnProps<T>[],
    currentViewData: (GroupedData<T> | T)[],
    dataOperations: UseDataResult<T>,
    focusModule: FocusStrategyResult,
    selectionModule: selectionModule<T>,
    editSettings: EditSettings<T>,
    setGridAction: Dispatch<SetStateAction<Object>>,
    setCurrentPage: Dispatch<SetStateAction<number>>,
    setResponseData: Dispatch<SetStateAction<Object>>,
    commandColumnModule: UseCommandColumnResult<T>,
    virtualSettings: VirtualSettings,
    pinningModule?: PinningModuleResult<T>,
    batchEditStagedRowsRef?: RefObject<Map<string | number, StagedRowData<T>>>,
    undoRedoModule?: UseUndoRedoResult
) => {
    // Use currentViewData (processed array) for display
    const viewData: (GroupedData<T> | T)[] = currentViewData;

    const dialogHook: UseConfirmDialogResult = useConfirmDialog(serviceLocator);
    const localization: IL10n = serviceLocator?.getService<IL10n>('localization');
    const { confirmOnDelete } = dialogHook;
    const prevFocusedCell: RefObject<FocusedCellInfo> = useRef({} as FocusedCellInfo);
    const nextPrevEditRowInfo: RefObject<KeyboardEvent> = useRef({} as KeyboardEvent);
    const focusLastField: RefObject<boolean> = useRef(false);
    const escEnterIndex: RefObject<number> = useRef(0);
    const notKeyBoardAllowedClickRowInfo: RefObject<RowInfo> = useRef<RowInfo>({});
    const popupEditFormRef: RefObject<InlineEditFormRef<T>> = useRef<InlineEditFormRef<T>>(null);

    // Edit state management
    const [editState, setEditState] = useState<EditState<T>>({
        isEdit: false,
        editRowIndex: -1,
        editCellField: null,
        editData: null,
        originalData: null,
        validationErrors: {},
        showAddNewRowData: null,
        isShowAddNewRowActive: false,
        isShowAddNewRowDisabled: false,
        rowObject: {}
    });

    // Selection delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [pendingDeleteData, setPendingDeleteData] = useState<{
        recordsToDelete: T[];
        deleteIndexes: number[];
        fieldName?: string;
        data?: T | T[];
        currentPageSelectedRecords?: T[]; // Cache current page records to avoid re-iteration
    } | null>(null);

    /**
     * Default edit settings with fallbacks
     * When spanning feature is enabled with allowEdit, force edit mode to 'Popup' only
     * User cannot override this - it's a system requirement for spanning cells
     */
    const baseEditSettings: EditSettings<T> = {
        allowAdd: false,
        allowEdit: false,
        allowDelete: false,
        // mode: 'Normal',
        editOnDoubleClick: true,
        confirmOnEdit: true,
        confirmOnDelete: false,
        showAddNewRow: false,
        newRowPosition: 'Top',
        allowBatchSave: false,
        batchSaveMode: 'buffered',
        batchSaveLabel: 'Save',
        ...editSettings,
        // Preserve the pre-Cell-mode batch editing behavior when no mode was supplied.
        // Explicit Normal mode remains row-scoped and stages the complete row.
        mode: editSettings?.mode ?? (editSettings?.allowBatchSave ? 'Cell' : 'Normal')
    };

    // Apply spanning constraint: if spanning is active and edit is allowed, mode MUST be Popup
    const defaultEditSettings: EditSettings<T> = {
        ...baseEditSettings,
        // Force popup mode when spanning is enabled with edit allowed - user cannot override
        mode: (_gridRef?.current?.isSpannedColumns && baseEditSettings.allowEdit) ? 'Popup' : baseEditSettings.mode,
        allowBatchSave: baseEditSettings.allowBatchSave
    };
    const stagedHistoryValuesRef: RefObject<Map<string, ValueType>> = useRef(new Map());
    const handleValueStaged: (stagedRow: StagedRowData<T>, fieldName: string) => void = useCallback((
        stagedRow: StagedRowData<T>, fieldName: string
    ): void => {
        const fieldChange: StagedFieldChange | undefined = stagedRow.fieldChanges.get(fieldName);
        const currentValue: ValueType | undefined = fieldChange?.stagedValue;
        const valueKey: string = `${String(stagedRow.rowKey)}::${fieldName}`;
        const previousValue: ValueType | undefined = stagedHistoryValuesRef.current.has(valueKey)
            ? stagedHistoryValuesRef.current.get(valueKey)
            //eslint-disable-next-line security/detect-object-injection
            : stagedRow.originalData[fieldName];

        if (defaultEditSettings.allowUndoRedo && defaultEditSettings.allowBatchSave &&
            defaultEditSettings.allowBatchUndoRedo && previousValue !== currentValue) {
            const state: UndoRedoState<T> = {
                rows: [],
                rowIndices: [-1],
                rowKeys: [stagedRow.rowKey],
                cellField: fieldName,
                cellPreviousValue: previousValue,
                cellCurrentValue: currentValue
            };
            undoRedoModule?.recordAction({
                id: `${Date.now()}-${Math.random()}`,
                actionType: 'edit',
                previousState: state,
                currentState: { ...state },
                timestamp: Date.now(),
                isStaged: true
            });
        }

        if (currentValue !== undefined) {
            stagedHistoryValuesRef.current.set(valueKey, currentValue);
        }
        defaultEditSettings.onBatchEditRender?.(stagedRow, fieldName);
    }, [defaultEditSettings, undoRedoModule]);
    const batchEditModule: UseBatchEditResult<T> = useBatchEdit<T>({
        enabled: defaultEditSettings.allowBatchSave,
        stagedRowsRef: batchEditStagedRowsRef,
        onBatchEditStart: defaultEditSettings.onBatchEditStart,
        onBatchEditRender: handleValueStaged,
        onBatchStateChange: defaultEditSettings.onBatchStateChange,
        onBatchCommitStart: defaultEditSettings.onBatchCommitStart,
        onBatchCommitSuccess: defaultEditSettings.onBatchCommitSuccess,
        onBatchCommitError: defaultEditSettings.onBatchCommitError
    }, setResponseData);

    const validateEditForm: (commandID?: string) => boolean = useCallback((commandID?: string) => {
        if (commandColumnModule?.commandEdit.current && commandID) {
            return commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`] ? commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`].current?.validateForm?.()
                : commandColumnModule?.commandAddInlineFormRef.current[`${commandID}`].current?.validateForm?.();
        }
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.validateForm?.() :
            _gridRef.current?.addInlineRowFormRef?.current?.validateForm?.()) ?? true;
    }, [
        editState.originalData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);
    const isRowBatchEdit: boolean = defaultEditSettings.allowBatchSave && defaultEditSettings.mode === 'Normal';

    const validateField: (field: string) => boolean = useCallback((field: string): boolean => {
        const column: ColumnProps<T> | undefined = columns.find((col: ColumnProps<T>) => col.field === field);
        if (!column || !column.validationRules) {
            return true;
        }

        if (isNullOrUndefined(editState.originalData)) {
            return _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current?.validateField?.(field) ?? true;
        } else {
            return _gridRef.current?.editInlineRowFormRef?.current?.formRef?.current?.validateField?.(field) ?? true;
        }
    }, [columns]);

    // Memoize initial add-new-row data derived from `columns` to avoid recreating
    // the object on every render and to satisfy hook dependency rules.
    const initialAddRowData: T = useMemo(() => {
        const newRowData: T = {} as T;
        columns.forEach((column: ColumnProps<T>) => {
            if (!column.field) { return; }
            if (column.defaultValue !== undefined) {
                if (column.type === 'string') {
                    newRowData[column.field] = typeof column.defaultValue === 'string'
                        ? column.defaultValue
                        : String(column.defaultValue);
                } else {
                    newRowData[column.field] = column.defaultValue;
                }
            } else {
                // Initialize to an empty controlled value: empty string for text, null otherwise
                newRowData[column.field] = (column.type === 'string') ? '' : null ;
            }
        });
        return newRowData;
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
    const editRecord: (rowElement?: HTMLTableRowElement, initialField?: string, initialValue?: ValueType) => Promise<void> =
        useCallback(async (rowElement?: HTMLTableRowElement, initialField?: string, initialValue?: ValueType) => {
            if (!defaultEditSettings.allowEdit) {
                return;
            }
            if (editState.isEdit && !(defaultEditSettings.showAddNewRow || commandColumnModule?.commandEdit.current)) {
                const isValid: boolean = validateEditForm();
                if (!isValid) {
                    return;
                }
            }
            let rowIndex: number = -1;
            let hasValidSelection: boolean = false;

            if (rowElement) {
                const rowIndexAttr: string | null = rowElement.getAttribute('data-uid');
                rowIndex = rowIndexAttr ? _gridRef?.current.getRowObjectFromUID(rowIndexAttr).rowIndex : -1;
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
                if (defaultEditSettings.confirmOnEdit) {
                    const message: string = localization.getConstant('noRecordsEditMessage');
                    await dialogHook.confirmOnEdit({
                        title: '',
                        message: message,
                        confirmText: localization.getConstant('okButtonLabel'),
                        cancelText: '',
                        type: 'Info'
                    });
                }
                _gridRef.current?.focusModule?.setGridFocus(true);
                return;
            }

            const pinnedRowObjects: IRow<ColumnProps<T>>[] = [
                ...(_gridRef.current?.getPinnedTopTableRowsObject?.() ?? []),
                ...(_gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [])
            ];
            const selectedPinnedRowObject: IRow<ColumnProps<T>> | undefined = rowElement
                ? pinnedRowObjects.find((rowObject: IRow<ColumnProps<T>>) =>
                    rowObject.uid === rowElement.getAttribute('data-uid') || rowObject.element === rowElement)
                : pinnedRowObjects.find((rowObject: IRow<ColumnProps<T>>) => rowObject.rowIndex === rowIndex);
            const isPinnedRowEdit: boolean = !!selectedPinnedRowObject || !!rowElement?.closest?.('.sf-pinned-rows-top-container') ||
                    !!rowElement?.closest?.('.sf-pinned-rows-bottom-container');
            const topPinnedRowCount: number = _gridRef.current?.getPinnedTopTableRowsObject?.()?.length ?? 0;
            const bottomPinnedRowCount: number = _gridRef.current?.getPinnedBottomTableRowsObject?.()?.length ?? 0;
            let data: GroupedData<T> | T;
            if (selectedPinnedRowObject) {
                data = selectedPinnedRowObject.data as GroupedData<T> | T;
            } else if (isPinnedRowEdit) {
                data = (getRowObjFromElement(rowIndex, _gridRef, virtualSettings) as IRow<ColumnProps<T>>)?.data as GroupedData<T> | T;
            } else {
                data = viewData[rowIndex - topPinnedRowCount];
            }
            if (defaultEditSettings.allowBatchSave && defaultEditSettings.mode === 'Normal') {
                const primaryKeyField: string = getPrimaryKeyField();
                //eslint-disable-next-line security/detect-object-injection
                const primaryKeyValue: unknown = (data as Record<string, unknown>)?.[primaryKeyField];
                const stagedRowKey: string | number =
                    typeof primaryKeyValue === 'string' || typeof primaryKeyValue === 'number'
                        ? primaryKeyValue
                        : rowIndex;
                data = batchEditModule.getBatchEditedRowData(stagedRowKey, data as T);
            }
            const isRemoteData: boolean = (_gridRef?.current?.getDataModule() as UseDataResult)?.isRemote() ||
                'result' in _gridRef.current?.dataSource;
            if (isRemoteData) {
                data = _gridRef.current?.cachedRowObjects.current.get(rowIndex).data;
            }

            if (isRowBatchEdit && data && !(data as GroupedData<T>)?.flattedKey) {
                const rowKey: string | number = (data as T)[getPrimaryKeyField()];
                if (!isNullOrUndefined(rowKey)) {
                    data = batchEditModule.getBatchEditedRowData(rowKey, data as T);
                }
            }

            // Validate row index bounds
            if (rowIndex < 0 || ((rowIndex >= viewData.length + topPinnedRowCount + bottomPinnedRowCount) &&
                !(isRemoteData && data)) || !data || (data as GroupedData<T>)?.flattedKey) {
                return;
            }

            const actionBeginArgs: Record<string, ValueType | Object | null> = {
                cancel: false,
                requestType: 'BeginEdit',
                type: 'actionBegin',
                rowIndex: rowIndex,
                action: 'BeginEdit',
                data: { ...data }
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: RowEditEvent<T> = {
                cancel: false,
                data: actionBeginArgs.data as T,
                rowIndex: actionBeginArgs.rowIndex as number
            };
            if (!isRowBatchEdit) {
                gridRef?.onRowEditStart?.(startArgs);

                // If the operation was cancelled, return early
                if (startArgs.cancel) {
                    return;
                }
            }


            const initialData: T = initialField ? DataUtil.setValue(initialField, initialValue,
                                                                    { ...startArgs.data })as T : { ...startArgs.data };
            editDataRef.current = initialData;
            const editedRowObject: IRow<ColumnProps<T>> = selectedPinnedRowObject ?? ((defaultEditSettings.mode === 'Popup' || defaultEditSettings.mode === 'PopupTemplate')
                ? gridRef.getRowObjectFromUID(gridRef.getRowByIndex(rowIndex).getAttribute('data-uid')) as IRow<ColumnProps<T>>
                : !virtualSettings?.enableRow ? gridRef.getRowsObject?.()?.[rowIndex as number] as IRow<ColumnProps<T>>
                    : gridRef.cachedRowObjects.current?.get(rowIndex) as IRow<ColumnProps<T>>);
            const updateState: Partial<EditState<T>> = {
                isEdit: true,
                editRowIndex: startArgs.rowIndex,
                editData: initialData,
                originalData: { ...startArgs.data },
                validationErrors: {},
                rowObject: editedRowObject
            };

            if (defaultEditSettings.showAddNewRow) {
                updateState.isShowAddNewRowActive = true;
                updateState.isShowAddNewRowDisabled = true;
                updateState.showAddNewRowData = editState.showAddNewRowData;
            }

            // Set edit state
            setEditState((prev: EditState<T>) => ({
                ...prev,
                ...updateState
            }));
            const editedRowUid: string = selectedPinnedRowObject?.uid || gridRef.getRowByIndex(rowIndex)?.getAttribute('data-uid') || '';
            if (commandColumnModule?.commandEdit.current) {
                const rowUid: string = getPrimaryKeyField() ?
                    ('grid-row-' + startArgs.data[getPrimaryKeyField()]) : editedRowUid;
                commandColumnModule.commandEditRef.current[`${rowUid}`] = true;
                commandColumnModule.commandEditStateRef.current[`${rowUid}`] = { ...editState, ...updateState };
            }
            const editGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: { isEdit: true, editRowIndex: startArgs.rowIndex }
            });
            editGridElement?.dispatchEvent(editStateEvent);
            requestAnimationFrame(() => {
                setTimeout(() => {
                    const actionCompleteArgs: Record<string, ValueType | Object | null> = {
                        requestType: 'BeginEdit',
                        type: 'actionComplete',
                        data: { ...initialData },
                        rowIndex: startArgs.rowIndex,
                        action: 'BeginEdit',
                        formRef: gridRef?.editInlineRowFormRef.current?.formRef?.current
                    };
                    const eventArgs: FormRenderEvent = {
                        ...(defaultEditSettings.mode === 'PopupTemplate' ? {} as FormRenderEvent
                            : {
                                formRef: defaultEditSettings.mode === 'Popup' ? popupEditFormRef.current?.formRef : commandColumnModule?.commandEdit.current
                                    ? commandColumnModule?.commandEditInlineFormRef.current?.[`${editedRowUid}`]?.current?.formRef
                                    : gridRef?.editInlineRowFormRef.current?.formRef as RefObject<IFormValidator>
                            }),
                        data: actionCompleteArgs?.data,
                        rowIndex: actionCompleteArgs?.rowIndex as number
                    };
                    gridRef?.onFormRender?.(eventArgs);
                    prevFocusedCell.current = { ...focusModule.getFocusedCell() };
                    focusModule.removeFocus();
                }, 0);
            });
        }, [defaultEditSettings.allowEdit, defaultEditSettings.confirmOnEdit, defaultEditSettings.showAddNewRow, viewData, _gridRef,
            editState.isEdit, editState.editRowIndex, editState.editData, editState.originalData, editState.showAddNewRowData,
            focusModule, getPrimaryKeyField]);

    /**
     * Get current edit data from ref for save operations
     * This ensures we always get the latest typed values, not stale state values
     */
    const getCurrentEditData: (commandID?: string) => T = useCallback((commandID?: string) => {
        if (commandColumnModule?.commandEdit.current && commandID) {
            return commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`] ? commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`].current?.getCurrentData?.() as T
                : commandColumnModule?.commandAddInlineFormRef.current[`${commandID}`].current?.getCurrentData?.() as T;
        }

        // Row-batch editing updates the live ref immediately while typing, but the form-ref snapshot can
        // lag one render behind. Prefer the live ref to ensure save/cancel flows stage the newest value.
        if (editDataRef.current && editState.originalData) {
            return editDataRef.current;
        }

        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.getCurrentData?.() as T :
            _gridRef.current?.addInlineRowFormRef?.current?.getCurrentData?.() as T) || editDataRef.current;
    }, [
        editState.editData,
        editState.originalData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const getCurrentFormRef: (commandID?: string) => RefObject<IFormValidator> = useCallback((commandID?: string) => {
        if (commandColumnModule?.commandEdit.current && commandID) {
            return commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`] ? commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`].current?.formRef
                : commandColumnModule?.commandAddInlineFormRef.current[`${commandID}`].current?.formRef;
        }
        return (editState.originalData ? _gridRef.current?.editInlineRowFormRef?.current?.formRef :
            _gridRef.current?.addInlineRowFormRef?.current?.formRef);
    }, [
        editState.editData,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const getCurrentFormState: () => FormState = useCallback(() => {
        return (editState.originalData ? { ..._gridRef.current?.editInlineRowFormRef?.current?.formState,
            errors: editState?.validationErrors } : {..._gridRef.current?.addInlineRowFormRef?.current?.formState,
            errors: editState?.validationErrors });
    }, [
        editState.editData,
        editState?.validationErrors && Object.keys(editState?.validationErrors)?.length,
        _gridRef.current?.editInlineRowFormRef?.current,
        _gridRef.current?.addInlineRowFormRef?.current
    ]);

    const resetSelection: (index: number) => void = useCallback((index: number): void => {
        const selectedRow: Element = _gridRef?.current?.getRowByIndex(index);
        const rowObj: IRow<ColumnProps<T>> = getRowObjFromElement(selectedRow, _gridRef) as IRow<ColumnProps<T>>;
        rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({ ...prev, isSelected: rowObj.isSelected }));
    }, [
        _gridRef,
        selectionModule
    ]);

    /**
     * Ends editing and saves changes using DataManager operations
     */
    const saveDataChanges: (isValidationRequired?: boolean, insertIndex?: number, endAction?: EditEndAction,
        commandID?: string, preserveInsertIndex?: boolean)
    => Promise<boolean> =
        useCallback(async (isValidationRequired: boolean = true, insertIndex: number, endAction?: EditEndAction,
                           commandID?: string, preserveInsertIndex: boolean = false)
        : Promise<boolean> => {
            const isCommandEdit: boolean = commandColumnModule?.commandEdit.current && commandID ? true : false;
            const isCommandAdd: boolean = isCommandEdit && isNullOrUndefined(commandColumnModule?.commandEditRef.current[`${commandID}`]) ? true : false;
            const rowObj: IRow<ColumnProps<T>> = isCommandEdit && !isCommandAdd ? _gridRef?.current.getRowObjectFromUID(commandID) : {};
            if (!editState.isEdit && isNullOrUndefined(insertIndex) && !isCommandEdit) {
                return false;
            }

            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;
            const currentEditData: T = getCurrentEditData(commandID);

            if (!currentEditData) {
                return false;
            }

            // Store the current edit row index for focus management
            const savedRowIndex: number = editState.editRowIndex;

            const isFormValid: boolean = isValidationRequired ? validateEditForm(commandID) : true;
            if (!isFormValid) {
                setEditState((prev: EditState<T>) => ({
                    ...prev,
                    validationErrors: !prev.originalData ? _gridRef.current?.addInlineRowFormRef.current?.formState.errors :
                        _gridRef.current?.editInlineRowFormRef.current?.formState.errors
                }));
                // FormValidator found validation errors, don't proceed with save
                return false;
            }
            if (isRowBatchEdit) {
                const stagedRowSave: boolean = await stageActiveRowBatchEdit();
                if (!stagedRowSave) {
                    return false;
                }

                editDataRef.current = null;

                setEditState((prev: EditState<T>) => ({
                    ...prev,
                    isEdit: false,
                    editRowIndex: -1,
                    editData: null,
                    originalData: null,
                    validationErrors: {},
                    rowObject: {},
                    editCellIndex: undefined
                }));

                return true;
            }


            const isAddOperation: boolean = (editState.editRowIndex === -1 || !editState.originalData ||
                                Object.keys(editState.originalData).length === 0 || isCommandAdd) && !(isCommandEdit && !isCommandAdd);
            const customBindingEdit: boolean = customBinding && !isAddOperation;

            const actionBeginArgs: Record<string, ValueType | Object | null> = {
                cancel: false,
                requestType: 'save',
                type: 'actionBegin',
                data: currentEditData,
                rowIndex: isCommandEdit ? isCommandAdd ? defaultEditSettings.newRowPosition === 'Top' ? 0 : viewData.length : rowObj.rowIndex :
                    (preserveInsertIndex && !isNullOrUndefined(insertIndex) ? insertIndex : editState.editRowIndex),
                action: isAddOperation ? ActionType.Add : ActionType.Edit,
                previousData: isCommandEdit ? rowObj.data : editState.originalData
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: SaveEvent<T> = {
                action: actionBeginArgs.action as string,
                data: actionBeginArgs.data as T,
                previousData: actionBeginArgs.previousData as T,
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
                    } else if (startArgs.rowIndex !== -1) {
                        // For programmatic addRecord(data, index), use the specified index
                        insertIndex = startArgs.rowIndex;
                    } else {
                        // Fallback to newRowPosition setting for regular add operations
                        if (defaultEditSettings.newRowPosition === 'Top') {
                            insertIndex = 0;
                        } else {
                            insertIndex = viewData.length;
                        }
                    }

                    await dataOperations.getData(customBinding ? { ...actionBeginArgs, ...startArgs, index: insertIndex } : {
                        requestType: 'save',
                        data: startArgs.data,
                        index: insertIndex
                    });

                    const  { scrollMode } = _gridRef.current?.virtualizationSettings;
                    if (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) {
                        _gridRef.current.scrollModule.isDataOperationPreventVirtualCache.current = true;
                    }
                    if (!customBinding) {
                        _gridRef.current?.refresh(); // initiate getData with requestType as 'Refresh'
                    }
                } else {
                    // For edit operations, use update operation
                    await dataOperations.getData(customBinding ? { ...actionBeginArgs, ...startArgs } : {
                        requestType: 'update',
                        data: startArgs.data
                    });
                    const savedRowObject: IRow<ColumnProps<T>> = editState.rowObject as IRow<ColumnProps<T>>;
                    if (savedRowObject?.isPinned) {
                        pinningModule?.updatePinnedRowObjectsData(savedRowObject, startArgs);
                    } else {
                        if (!virtualSettings?.enableRow) {
                            _gridRef.current?.getRowsObject?.()?.[startArgs.rowIndex]?.setRowObject?.(
                                (previousRowObject: IRow<ColumnProps<T>>) => ({
                                    ...previousRowObject,
                                    data: startArgs.data
                                }));
                        }
                        _gridRef.current?.cachedRowObjects.current?.get(startArgs.rowIndex)?.setRowObject?.(
                            (previousRowObject: IRow<ColumnProps<T>>) => ({
                                ...previousRowObject,
                                data: startArgs.data
                            }));
                    }
                    const { groupSettings } = _gridRef.current;
                    if (groupSettings?.enabled && groupSettings?.columns?.length && groupSettings?.autoRefreshOnEdit) {
                        const isGroupedFieldValuesChanged: boolean = !!groupSettings?.columns?.find((field: string) =>
                            startArgs?.previousData?.[field as string] !== startArgs?.data?.[field as string]);
                        if (isGroupedFieldValuesChanged && !customBinding && !dataOperations.isRemote()) {
                            _gridRef.current?.refresh();
                        }
                    }
                    if (_gridRef.current?.aggregates?.length) {
                        let isFiltered: boolean = false;
                        if (!(dataOperations.isRemote() || (!isNullOrUndefined(dataOperations.dataManager)
                            && (dataOperations.dataManager as DataResult).result)) && ((_gridRef.current?.filterSettings?.enabled
                                && _gridRef.current?.filterSettings?.columns?.length)
                                || _gridRef.current?.searchSettings?.value?.length)) {
                            isFiltered = true;
                        }
                        let currentViewData: T[];
                        if (!isNullOrUndefined(dataOperations.dataManager) && (dataOperations.dataManager as DataResult).result) {
                            currentViewData = _gridRef.current?.getCurrentViewRecords();
                        } else {
                            currentViewData = ((dataOperations.dataManager as DataManager).dataSource.json.length ?
                                (isFiltered ? (await (_gridRef.current?.getData(true, true) as Promise<ReturnType>)).result as T[] :
                                    (dataOperations.dataManager as DataManager).dataSource.json as T[])
                                : _gridRef.current?.getCurrentViewRecords());
                        }
                        setResponseData((prevData: DataResult) => ({
                            ...prevData,
                            aggregates: customBinding ? prevData.aggregates : undefined,
                            result: [...currentViewData.map((item: T) =>
                                item[getPrimaryKeyField()] === startArgs.data[getPrimaryKeyField()] ?
                                    { ...item, ...startArgs.data } : item
                            )]
                        }));
                    }
                }
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError?.(error as Error);
                return false;
            }

            const actionCompleteArgs: Record<string, ValueType | Object | null> = {
                requestType: 'save',
                type: 'actionComplete',
                data: startArgs.data,
                rowIndex: isNullOrUndefined(insertIndex) ? startArgs.rowIndex : insertIndex,
                action: isAddOperation ? ActionType.Add : ActionType.Edit,
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
                            editRecord();
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
                    let rowIndexToSelect: number = !isNullOrUndefined(insertIndex) ? insertIndex : editState.editRowIndex;

                    // For showAddNewRow with Bottom position, the newly added row will be at the end
                    if (defaultEditSettings.showAddNewRow || isCommandAdd) {
                        if (defaultEditSettings.newRowPosition === 'Bottom') {
                            // For bottom position, the new row is added at the end of the current data
                            rowIndexToSelect = viewData.length; // This will be the index after the data is updated
                        } else {
                            // For top position (default), the new row is added at index 0
                            rowIndexToSelect = 0;
                        }
                    }

                    setTimeout(() => {
                        if (gridRef.selectionModule && rowIndexToSelect >= 0 && !selectionModule.isHeaderSelectAllMode) {
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
                    if (gridRef.height !== 'auto' && !isAddOperation && (editState.editRowIndex + 1).toString() === tr.getAttribute('data-rowindex') &&
                        (gridRef.contentPanelRef?.firstElementChild as HTMLElement)?.offsetHeight > gridRef.contentTableRef?.scrollHeight) {
                        addClass([].slice.call(tr.getElementsByClassName('sf-cell')), 'sf-last-cell');
                    }
                });
                const eventArgs: SaveEvent = {
                    action: actionCompleteArgs.action as string,
                    data: actionCompleteArgs.data,
                    previousData: actionCompleteArgs.previousData,
                    rowIndex: actionCompleteArgs.rowIndex as number
                };
                gridRef?.onDataChangeComplete?.(eventArgs);
                _gridRef.current.element.removeEventListener('actionComplete', addDeleteActionComplete);
            };

            _gridRef.current.element?.addEventListener('actionComplete', addDeleteActionComplete);
            if ((!isAddOperation && !customBindingEdit) || (customBindingEdit && (defaultEditSettings.mode === 'Popup' || defaultEditSettings.mode === 'PopupTemplate'))
                || (isAddOperation && customBinding)) {
                _gridRef.current.element?.dispatchEvent(new CustomEvent('actionComplete'));
            }

            editDataRef.current = null;

            // This ensures showAddNewRow inputs are properly re-enabled after saving edits
            const newEditState: Partial<EditState<T>> = {
                editRowIndex: -1,
                editData: null,
                originalData: null,
                validationErrors: {},
                rowObject: {}
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

            if ((defaultEditSettings.mode === 'Popup' || defaultEditSettings.mode === 'PopupTemplate') && editState.originalData) {
                editState.rowObject.setRowObject?.((prev: IRow<ColumnProps<T>>) => {
                    const { editInlineRowFormRef, ...rest } = prev;
                    void editInlineRowFormRef;
                    return rest;
                });
            }
            // Always ensure isShowAddNewRowDisabled is explicitly set to false
            // This is essential for test case: "should re-enable showAddNewRow inputs after saving edited row"
            setEditState((prev: EditState<T>) => ({
                ...prev,
                ...newEditState
            }));

            // Record action to undo/redo history if enabled
            if (undoRedoModule && editSettings?.allowUndoRedo) {
                const rowIndices: number[] = isAddOperation
                    ? [insertIndex !== undefined ? insertIndex : editState.editRowIndex]
                    : [editState.editRowIndex];
                const rowKeys: (string | number)[] = [startArgs.data[getPrimaryKeyField()] as string | number];

                const previousState: UndoRedoState<T> = isAddOperation ? {
                    rows: [],
                    rowIndices: [],
                    rowKeys: []
                } : {
                    rows: [startArgs.previousData as T],
                    rowIndices,
                    rowKeys
                };

                const currentState: UndoRedoState<T> = {
                    rows: [startArgs.data as T],
                    rowIndices,
                    rowKeys
                };

                const undoAction: UndoRedoAction<T> = {
                    id: `${Date.now()}-${Math.random()}`,
                    actionType: isAddOperation ? 'add' : 'edit',
                    previousState,
                    currentState,
                    timestamp: Date.now()
                };
                undoRedoModule.recordAction(undoAction);
            }

            if (isCommandEdit) {
                if (isCommandAdd) {
                    commandColumnModule?.commandAddRef.current.splice(commandColumnModule?.commandAddRef.current.
                        findIndex((row: IRow<ColumnProps>) => row.uid === commandID), 1);
                    delete commandColumnModule?.commandAddInlineFormRef.current[`${commandID}`];
                } else {
                    delete commandColumnModule?.commandEditRef.current[`${commandID}`];
                    delete commandColumnModule?.commandEditStateRef.current[`${commandID}`];
                    delete commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`];
                }
            }

            // Dispatch custom event for toolbar refresh when exiting edit mode
            const exitEditGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
            const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                detail: {
                    isEdit: newEditState.isEdit || false,
                    editRowIndex: newEditState.editRowIndex
                }
            });

            const attemptFocusAfterSave: () => void = () => {
                if (nextPrevEditRow()) {
                    return;
                }
                const lastFocusedCellinfo: FocusedCellInfo = !_gridRef.current?.allowKeyboard ?
                    {
                        rowIndex: notKeyBoardAllowedClickRowInfo.current.rowIndex,
                        colIndex: notKeyBoardAllowedClickRowInfo.current?.columnIndex,
                        isHeader: false,
                        virtualAriaColIndex: notKeyBoardAllowedClickRowInfo.current.ariaColIndex,
                        virtualAriaRowIndex: notKeyBoardAllowedClickRowInfo.current.ariaRowIndex
                    } : _gridRef.current.focusModule.getFocusedCell();
                // First ensure grid has focus
                gridRef?.focusModule?.setGridFocus(true);

                // Select the appropriate row
                const rowIndexToSelect: number = isCommandEdit ? rowObj.rowIndex
                    : lastFocusedCellinfo?.rowIndex > -1 && endAction === 'Click' ? lastFocusedCellinfo?.rowIndex : savedRowIndex;
                const rowData: T = (_gridRef?.current?.currentViewData?.[parseInt(savedRowIndex.toString(), 10)]
                    ?? currentViewData?.[parseInt(savedRowIndex.toString(), 10)]) as T;
                const rowKey: string = rowData?.[getPrimaryKeyField()];
                const isRowSelectable: boolean = selectionModule.isRowSelectableProp ? !selectionModule.nonSelectableRows.has(rowKey)
                    : true;
                // Skip selection reset during command column editing
                // to prevent unintended clearing of other rows
                if (!isCommandEdit) {
                    if (selectionModule?.selectedRowIndexes.indexOf(rowIndexToSelect) === -1 && isRowSelectable || customBindingEdit) {
                        selectionModule?.selectRow(rowIndexToSelect);
                    } else {
                        resetSelection(rowIndexToSelect);
                    }
                }

                // Calculate the proper target row index based on configuration
                const targetRowIndex: number = lastFocusedCellinfo?.rowIndex > -1 ? lastFocusedCellinfo?.rowIndex :
                    (defaultEditSettings.showAddNewRow && defaultEditSettings.newRowPosition === 'Top' ?
                        savedRowIndex + 1 : savedRowIndex);
                requestAnimationFrame(() => {
                    gridRef?.focusModule?.navigateToCell(isCommandEdit ? rowObj.rowIndex : endAction === 'Click' ? targetRowIndex : savedRowIndex, lastFocusedCellinfo?.colIndex !== -1 && endAction === 'Click' ?
                        lastFocusedCellinfo?.colIndex : endAction === 'Key' ? escEnterIndex.current : 0);
                });
            };

            // Only perform special focus management for keyboard (Tab) navigation
            // maintain focus on the clicked cell while Tab navigation follows standard patterns
            requestAnimationFrame(() => {
                if (!isAddOperation && !customBindingEdit) {
                    attemptFocusAfterSave();
                }
                exitEditGridElement?.dispatchEvent(editStateEvent);
            });

            return true;
        }, [
            editState,
            getCurrentEditData,
            dataOperations,
            _gridRef,
            selectionModule,
            selectionModule?.selectedRowIndexes,
            resetSelection,
            focusModule,
            pinningModule,
            virtualSettings,
            undoRedoModule,
            getPrimaryKeyField,
            editSettings
        ]);

    /**
     * Closes editing without saving changes
     * Enhanced to handle showAddNewRow behavior correctly
     * When showAddNewRow is enabled, canceling should re-enable the add new row and keep grid in edit state
     */
    const cancelDataChanges: (endAction?: EditEndAction, commandID?: string) => Promise<void> =
    useCallback(async (endAction?: EditEndAction, commandID?: string) => {
        if (isRowBatchEdit) {
            editDataRef.current = null;
            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: false,
                editRowIndex: -1,
                editData: null,
                originalData: null,
                validationErrors: {},
                rowObject: {},
                editCellIndex: undefined
            }));


            return;
        }
        const isCommandEdit: boolean = commandColumnModule?.commandEdit.current && commandID ? true : false;
        const isCommandAdd: boolean = isCommandEdit && isNullOrUndefined(commandColumnModule?.commandEditRef.current[`${commandID}`]) ? true : false;
        const rowObj: IRow<ColumnProps<T>> = isCommandEdit && !isCommandAdd ? _gridRef?.current.getRowObjectFromUID(commandID) : {};
        // Handle showAddNewRow special case
        // If showAddNewRow is enabled and we only have the add new row active (no edited row),
        // then we should just re-enable the add new row and return
        if (defaultEditSettings.showAddNewRow && editState.isShowAddNewRowActive && editState.editRowIndex === -1 &&
            !editState.isShowAddNewRowDisabled && !editState.originalData &&
            _gridRef.current?.addInlineRowFormRef?.current?.formState?.modified &&
            Object.keys(_gridRef.current?.addInlineRowFormRef?.current?.formState?.modified)?.length) {
            const defaultRecord: T = {} as T;
            setDefaultValueRecords(defaultRecord);
            const editStateEvent: CustomEvent = new CustomEvent('resetShowAddNewRowForm', {
                detail: {
                    editData: defaultRecord
                }
            });
            _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current?.element?.dispatchEvent?.(editStateEvent);
            // Re-enable the add new row and clear any validation errors
            setEditState((prev: EditState<T>) => ({
                ...prev,
                validationErrors: {},
                editData: prev.showAddNewRowData // Reset to original add new row data
            }));

            // Reset the edit data ref
            editDataRef.current = editState.showAddNewRowData ? { ...editState.showAddNewRowData } : null;
            return;
        }

        if (!editState.isEdit && !isCommandEdit) {
            return;
        }

        // For inline/normal editing, do NOT show confirm dialog
        // Trigger cancel event
        const cancelArgs: Record<string, ValueType | Object | null> = {
            requestType: 'cancel',
            rowIndex: editState.editRowIndex,
            data: getCurrentEditData(commandID),
            formRef: getCurrentFormRef(commandID)
        };

        setTimeout(() => {
            if (isCommandAdd) { return; }
            const rowIndexToSelect: number = isCommandEdit ? rowObj.rowIndex : editState.editRowIndex;
            // Skip selection reset during command column editing with persistSelection enabled
            // to prevent unintended clearing of other rows
            if (!isCommandEdit) {
                if (selectionModule?.selectedRowIndexes.indexOf(rowIndexToSelect) === -1) {
                    selectionModule?.selectRow(rowIndexToSelect);
                } else {
                    resetSelection(rowIndexToSelect);
                }
            }
            _gridRef.current?.focusModule?.setGridFocus(true);
            requestAnimationFrame(() => {
                _gridRef.current?.focusModule?.navigateToCell(rowIndexToSelect, endAction === 'Key' ? escEnterIndex.current : 0);
            });
        }, 0);
        const eventArgs: FormCancelEvent<T> = {
            ...(defaultEditSettings.mode === 'PopupTemplate' ? {} as FormRenderEvent
                : { formRef: cancelArgs.formRef as RefObject<IFormValidator> }),
            data: cancelArgs.data as T,
            rowIndex: cancelArgs.rowIndex as number
        };
        _gridRef.current?.onDataChangeCancel?.(eventArgs);

        // Enhanced reset edit state with improved showAddNewRow handling
        // This ensures showAddNewRow inputs are properly re-enabled after cancel
        const newEditState: Partial<EditState<T>> = {
            editRowIndex: -1,
            editData: null,
            originalData: null,
            validationErrors: {},
            rowObject: {}
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

        if ((defaultEditSettings.mode === 'Popup' || defaultEditSettings.mode === 'PopupTemplate') && editState.originalData) {
            editState.rowObject.setRowObject?.((prev: IRow<ColumnProps<T>>) => {
                const { editInlineRowFormRef, ...rest } = prev;
                void editInlineRowFormRef;
                return rest;
            });
        }
        // Always ensure isShowAddNewRowDisabled is explicitly set to false
        // This is essential for test case: "should re-enable showAddNewRow inputs after canceling edited row"
        setEditState((prev: EditState<T>) => ({
            ...prev,
            ...newEditState
        }));
        if (isCommandEdit) {
            if (isCommandAdd) {
                commandColumnModule?.commandAddRef.current.splice(commandColumnModule?.commandAddRef.current.
                    findIndex((row: IRow<ColumnProps>) => row.uid === commandID), 1);
                delete commandColumnModule?.commandAddInlineFormRef.current[`${commandID}`];
            } else {
                delete commandColumnModule?.commandEditRef.current[`${commandID}`];
                delete commandColumnModule?.commandEditStateRef.current[`${commandID}`];
                delete commandColumnModule?.commandEditInlineFormRef.current[`${commandID}`];
            }
        }

        // Dispatch custom event for toolbar refresh when canceling edit mode
        const cancelEditGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
        const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
            detail: {
                isEdit: newEditState.isEdit || false,
                editRowIndex: newEditState.editRowIndex
            }
        });
        cancelEditGridElement?.dispatchEvent(editStateEvent);
    }, [editState, defaultEditSettings.showAddNewRow, _gridRef, _gridRef.current?.editInlineRowFormRef?.current?.formState,
        _gridRef.current?.addInlineRowFormRef?.current?.formState, selectionModule, selectionModule?.selectedRowIndexes, resetSelection]);

    const setDefaultValueRecords: (data: T) => void = (data: T) => {
        // Initialize all fields based on columns. Use memoized defaults when present,
        // otherwise initialize to empty values so inputs stay controlled.
        columns.forEach((column: ColumnProps<T>) => {
            if (!column.field) { return; }
            const value: unknown = (initialAddRowData as Record<string, unknown>)[column.field];
            (data as Record<string, unknown>)[column.field] = value;
        });
    };
    /**
     * Adds a new record to the grid
     */
    const addRecordInternal: (data?: T, index?: number, preserveInsertIndex?: boolean) => Promise<void> =
        useCallback(async (data?: T, index?: number, preserveInsertIndex: boolean = false) => {
            if (!defaultEditSettings.allowAdd || _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current) {
                return;
            }

            // Create new record with proper default value handling
            // Only apply defaultValue when explicitly set, otherwise leave undefined
            const newRecord: T = data || {} as T;

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

            const actionBeginArgs: Record<string, ValueType | Object | null> = {
                cancel: false,
                requestType: ActionType.Add,
                type: 'actionBegin',
                data: newRecord,
                index: insertIndex,
                action: ActionType.Add
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: RowAddEvent = {
                cancel: false,
                data: actionBeginArgs.data,
                rowIndex: actionBeginArgs.index as number
            };
            if (gridRef && (gridRef.onRowAddStart) && !data) {
                gridRef?.onRowAddStart?.(startArgs);

                // If the operation was cancelled, return early
                if (startArgs.cancel) {
                    return;
                }
            }

            // Set edit state for add operation without updating currentViewData
            // This creates a dummy edit row that doesn't affect the data source until save

            // Initialize the edit data ref to prevent re-renders during typing
            editDataRef.current = { ...startArgs.data as T };

            // When using toolbar add or programmatic addRecord(),
            // we need to ensure we're not triggering the isEditingExistingRow logic
            // Set originalData explicitly to null or empty object to signal this is an add operation
            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: !data ? true : false,
                editRowIndex: startArgs.rowIndex,
                editData: { ...startArgs.data as T }, // Use the startArgs.data (which may be empty) for add operations
                originalData: null, // For toolbar/programmatic add, explicitly set to null
                validationErrors: {}
            }));
            let commandAddUID: string;
            if (commandColumnModule?.commandEdit.current) {
                const index: number = (commandColumnModule?.commandAddRef.current.length ?
                    commandColumnModule?.commandAddRef.current.reduce((max: IRow<ColumnProps>, obj: IRow<ColumnProps>) => {
                        return obj.rowIndex > max.rowIndex ? obj : max;
                    }, commandColumnModule?.commandAddRef.current[0]).rowIndex : -1) + 1;
                commandAddUID = 'grid-add-row-command-' + index;
                commandColumnModule?.commandAddRef.current.push({
                    data: {},
                    uid: commandAddUID,
                    rowIndex: index,
                    cells: [{}]
                });
            }

            if (!data) {
                // Dispatch custom event for toolbar refresh when entering add mode
                const addRecordGridElement: HTMLDivElement | null | undefined = _gridRef?.current?.element;
                const editStateEvent: CustomEvent = new CustomEvent('editStateChanged', {
                    detail: {
                        isEdit: true,
                        editRowIndex: startArgs.rowIndex,
                        isAdd: true // Explicitly mark this as an add operation
                    }
                });
                addRecordGridElement?.dispatchEvent(editStateEvent);

                // STEP 3: Trigger actionComplete event after the grid is actually in edit state
                // Use requestAnimationFrame to ensure DOM is updated and edit form is rendered
                requestAnimationFrame(() => {
                    // Additional timeout to ensure edit form is fully rendered
                    setTimeout(() => {
                        const actionCompleteArgs: Record<string, ValueType | Object | null> = {
                            requestType: ActionType.Add,
                            type: 'actionComplete',
                            data: { ...startArgs.data as T },
                            rowIndex: startArgs.rowIndex,
                            action: ActionType.Add,
                            rowData: { ...startArgs.data as T },
                            form: gridRef?.addInlineRowFormRef.current?.formRef.current?.element
                        };
                        const eventArgs: FormRenderEvent = {
                            ...(defaultEditSettings.mode === 'PopupTemplate' ? {} as FormRenderEvent
                                : {
                                    formRef: defaultEditSettings.mode === 'Popup' ? popupEditFormRef.current?.formRef : commandColumnModule?.commandEdit.current
                                        ? commandColumnModule?.commandAddInlineFormRef.current[`${commandAddUID}`]?.current?.formRef
                                        : gridRef?.addInlineRowFormRef.current?.formRef as RefObject<IFormValidator>
                                }),
                            data: actionCompleteArgs.rowData,
                            rowIndex: actionCompleteArgs.rowIndex as number
                        };
                        gridRef?.onFormRender?.(eventArgs);
                        gridRef?.focusModule?.removeFocusTabIndex();
                        prevFocusedCell.current = { rowIndex: -1, colIndex: -1, virtualAriaColIndex: -1, virtualAriaRowIndex: -1,
                            isHeader: false };
                    }, 0);
                });
            } else {
                saveDataChanges(false, insertIndex, undefined, undefined, preserveInsertIndex);
            }
        }, [
            defaultEditSettings.allowAdd,
            defaultEditSettings.newRowPosition,
            defaultEditSettings.mode,
            dataOperations,
            _gridRef,
            columns,
            viewData,
            saveDataChanges
        ]);

    const addRecord: (data?: T, index?: number) => void =
        useCallback((data?: T, index?: number): Promise<void> => addRecordInternal(data, index), [addRecordInternal]);

    /**
     * Deletes a record from the grid
     */
    const deleteRecord: (fieldName?: string, data?: T | T[]) => Promise<void> =
        useCallback(async (fieldName?: string, data?: T | T[]) => {
            if (!defaultEditSettings.allowDelete) {
                return;
            }

            let recordsToDelete: T[] = [];
            let deleteIndexes: number[] = [];

            if (!data) {
                // Delete selected records using selection module (multiple row support)
                const gridRef: GridRef | null = _gridRef?.current;
                const selectedRecords: unknown[] = gridRef?.selectionSettings.persistSelection ?
                    Array.from(gridRef.getPersistSelectedData()) : gridRef.selectionModule?.getSelectedRecords() as T[];
                if (selectedRecords?.length > 0 || gridRef.selectionModule?.isHeaderSelectAllMode) {
                    // Collect records to delete from all pages
                    recordsToDelete = [...(selectedRecords as T[])];
                    deleteIndexes = [...gridRef.selectionModule?.getSelectedRowIndexes()];
                } else {
                    // Show validation message if no records are selected
                    const message: string = localization?.getConstant('noRecordsDeleteMessage');
                    await dialogHook?.confirmOnEdit({
                        title: '',
                        message: message,
                        confirmText:  localization?.getConstant('okButtonLabel'),
                        cancelText: '', // No cancel button for alert dialogs
                        type: 'Info'
                    });
                    _gridRef.current?.focusModule?.setGridFocus(true);
                    return;
                }
            } else {
                // Handle single record deletion with provided data
                if (data instanceof Array) {
                    const dataLen: number = data.length;
                    const primaryKeyField: string = fieldName || getPrimaryKeyField();

                    for (let i: number = 0; i < dataLen; i++) {
                        let tmpRecord: T;
                        const contained: boolean = viewData.some((record: T) => {
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
                            const recordData: T = (data[i as number])[primaryKeyField as string] ?
                                data[i as number] : { [primaryKeyField as string]: data[i as number] } as T;
                            recordsToDelete.push(recordData);

                            // Find index by primary key
                            const index: number = viewData.findIndex((item: T) =>
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
                    const deleteIndex: number = viewData.findIndex((item: T) =>
                        (item)[fieldName as string] === (data)[fieldName as string]
                    );
                    if (deleteIndex !== -1) {
                        recordsToDelete = [viewData[deleteIndex as number] as T];
                        deleteIndexes = [deleteIndex as number];
                    }
                } else {
                    // Single record deletion
                    recordsToDelete = [data];
                    const index: number = viewData.indexOf(data);
                    if (index !== -1) {
                        deleteIndexes = [index as number];
                    }
                }
            }

            if (!_gridRef?.current?.selectionModule?.isHeaderSelectAllMode && recordsToDelete.length === 0) {
                return;
            }

            // Determine if there are selections across multiple pages
            const hasPersistSelection: boolean = _gridRef?.current?.selectionSettings?.persistSelection;
            const autoSelectMode: string = _gridRef?.current?.selectionSettings?.autoSelectMode ?? AutoSelectMode.Default;
            const isRemote: boolean = dataOperations?.isRemote?.();

            // Check if selections exist beyond the current page
            let hasCrossPageSelection: boolean = false;
            let currentPageSelectedRecords: T[] = [];

            if (hasPersistSelection && recordsToDelete.length > 0) {
                // Get both count and records in a single call to avoid duplicate iterations
                const result: { records: T[]; count: number; } = getCurrentPageSelectedItems<T>(
                    currentViewData,
                    selectionModule?.selectedRowState,
                    _gridRef?.current,
                    true // Get records as well since we might need them for the dialog
                );

                currentPageSelectedRecords = result.records;
                const currentPageSelectedCount: number = result.count;

                // Cross-page detection logic based on AutoSelectMode
                switch (autoSelectMode) {
                case AutoSelectMode.Default:
                    // Default mode: cross-page if header select-all was activated or if selections exceed current page
                    hasCrossPageSelection = (_gridRef?.current?.selectionModule?.isHeaderSelectAllMode &&
                        (_gridRef?.current?.getDataModule() as UseDataResult)?.isRemote()) ||
                        (recordsToDelete.length > currentPageSelectedCount) && isNullOrUndefined(data);
                    break;

                case AutoSelectMode.Intermediate:
                    // Intermediate mode: only shows cross-page dialog if explicitly flagged
                    hasCrossPageSelection = recordsToDelete.length > currentPageSelectedCount;
                    break;
                }
            }

            // Determine which dialog to show
            const shouldShowSelectionDialog: boolean = hasPersistSelection && hasCrossPageSelection;

            // Show delete confirmation dialog (ConfirmDialog) if enabled and NOT showing DeleteDialog
            if (defaultEditSettings.confirmOnDelete && !shouldShowSelectionDialog) {
                // Use React dialog component instead of window.confirm
                // This provides a consistent UI experience and follows React patterns
                const confirmResult: boolean = await confirmOnDelete();
                if (!confirmResult) {
                    _gridRef.current?.focusModule?.setGridFocus(true);
                    return;
                }
            }

            // Show DeleteDialog only when there are cross-page selections
            if (shouldShowSelectionDialog) {
                // Store pending delete data with cached current page records to avoid re-iteration
                setPendingDeleteData({
                    recordsToDelete,
                    deleteIndexes,
                    fieldName,
                    data,
                    currentPageSelectedRecords // Cache the records to avoid recalculating
                });
                setIsDeleteDialogOpen(true);
                return; // Don't proceed with delete until dialog is confirmed
            }

            // Execute the actual delete operation (for non-dialog scenarios)
            await executeDelete(recordsToDelete, deleteIndexes, isRemote, 'page');
        }, [
            _gridRef,
            dataOperations,
            getPrimaryKeyField,
            setIsDeleteDialogOpen,
            setPendingDeleteData,
            defaultEditSettings.allowDelete,
            defaultEditSettings.confirmOnDelete,
            defaultEditSettings.mode,
            viewData
        ]);

    /**
     * Internal function to execute delete operation
     *
     * @param {T[]} recordsToDelete - Records to delete
     * @param {number[]} deleteIndexes - Indexes of records to delete
     * @param {boolean} useRemoteHeaderPayload - Whether to use remote header selection payload
     * @param {string} deleteOption - The delete option ('page' or 'all')
     */
    const executeDelete: (recordsToDelete: T[], deleteIndexes: number[], isRemote: boolean, deleteOption?: 'page' | 'all') => Promise<void> =
        useCallback(async ( recordsToDelete: T[], deleteIndexes: number[], isRemote: boolean, deleteOption?: 'page' | 'all'
        ): Promise<void> => {
            // This ensures consistent event handling pattern across all grid operations
            const actionBeginArgs: Record<string, ValueType | Object | null> = {
                cancel: false,
                requestType: ActionType.Delete,
                type: 'actionBegin',
                data: recordsToDelete,
                rows: deleteIndexes.map((index: number) => _gridRef?.current?.getRowByIndex?.(index)).filter(Boolean),
                action: ActionType.Delete
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: DeleteEvent<T> = {
                action: actionBeginArgs.action as string,
                data: actionBeginArgs.data as T[],
                cancel: false
            };
            gridRef?.onDataChangeStart?.(startArgs);

            // If the operation was cancelled, return early
            if (startArgs.cancel) {
                return;
            }
            setGridAction({});

            let historyDeleteIndexes: number[] = deleteIndexes;
            if (undoRedoModule && editSettings?.allowUndoRedo) {
                const primaryKeyField: string = getPrimaryKeyField();
                const rowIndexByKey: Map<string, number> = new Map();
                (viewData).forEach((rowData: T, rowIndex: number) => {
                    const rowKey: unknown = primaryKeyField ? DataUtil.getObject(primaryKeyField, rowData) : undefined;
                    if (rowKey !== undefined && rowKey !== null) {
                        rowIndexByKey.set(String(rowKey), rowIndex);
                    }
                });
                historyDeleteIndexes = recordsToDelete.map((record: T, index: number) => {
                    const rowKey: unknown = primaryKeyField ? DataUtil.getObject(primaryKeyField, record) : undefined;
                    return rowKey !== undefined && rowIndexByKey.has(String(rowKey)) ? rowIndexByKey.get(String(rowKey)) as number
                        //eslint-disable-next-line security/detect-object-injection
                        : deleteIndexes[index];
                });
            }

            // Store the selected row index before deletion for auto-selection after deletion
            const lastDeletedIndex: number = deleteIndexes[deleteIndexes.length - 1];
            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;

            // Build remote delete payload for server-side processing (only when useRemoteHeaderPayload is true)
            let payload: payload;
            if (isRemote) {
                payload = buildDeletepayload<T>(gridRef as GridRef<T>, deleteOption);
            }

            // Single deletion: use dataManager.remove()
            // Multiple deletion: use dataManager.saveDataChanges() with deletedRecords
            try {
                const len: number = startArgs.data.length;

                if (len === 1) {
                    await dataOperations.getData(customBinding ? actionBeginArgs : {
                        requestType: ActionType.Delete,
                        data: startArgs.data[0]
                    });
                    // Single record deletion
                } else {
                    await dataOperations.getData(customBinding ? actionBeginArgs : {
                        requestType: ActionType.Delete,
                        data: startArgs.data,
                        ...(isRemote ? { payload } : {})
                    });
                }
                if (undoRedoModule && editSettings?.allowUndoRedo) {
                    const rowKeys: (string | number)[] = startArgs.data.map((record: T) => record[getPrimaryKeyField()] as string | number);
                    undoRedoModule.recordAction({
                        id: `${Date.now()}-${Math.random()}`,
                        actionType: 'delete',
                        previousState: { rows: startArgs.data as T[], rowIndices: historyDeleteIndexes, rowKeys },
                        currentState: { rows: [], rowIndices: [], rowKeys: [] },
                        timestamp: Date.now()
                    });
                }
                pinningModule?.updatePinnedRowsState?.(startArgs.data as T[], false);
                const  { scrollMode } = _gridRef.current?.virtualizationSettings;
                if (scrollMode === ScrollMode.Virtual || scrollMode === ScrollMode.Infinite) {
                    _gridRef.current.scrollModule.isDataOperationPreventVirtualCache.current = true;
                }
                if (((len === 1 && (_gridRef.current?.currentViewData.length - len) <= 0) ||
                    ((_gridRef.current?.currentViewData.length - startArgs.data.length) <= 0)) &&
                    (_gridRef.current?.pageSettings?.currentPage - 1) >= 1 && _gridRef.current?.pagerRef) {
                    setCurrentPage(_gridRef.current?.pageSettings?.currentPage - 1);
                    _gridRef.current?.pagerRef?.goToPage(_gridRef.current?.pageSettings?.currentPage - 1);
                } else if (!customBinding) {
                    _gridRef.current?.refresh(); // initiate getData with requestType as 'Refresh'
                }

                // Trigger actionComplete event after successful operation
                const actionCompleteArgs: Record<string, ValueType | Object | null> = {
                    requestType: ActionType.Delete,
                    type: 'actionComplete',
                    data: startArgs.data,
                    rows: deleteIndexes.map((index: number) => _gridRef?.current?.getRowByIndex?.(index)).filter(Boolean),
                    action: ActionType.Delete
                };

                // Clear selections based on what was actually deleted
                if (Array.isArray(startArgs.data) && startArgs.data.length > 0) {
                    if (gridRef?.selectionSettings?.persistSelection) {
                        if (gridRef?.selectionModule?.isHeaderSelectAllMode && isRemote) {
                            // Header select-all delete: clear all selections since all were deleted
                            gridRef?.selectionModule?.clearAllPersistedSelection();
                            if (Array.isArray(gridRef?.selectionModule?.selectedRowIndexes)) {
                                gridRef.selectionModule.selectedRowIndexes.length = 0;
                            }
                        } else {
                            // Specific records deleted: remove only those from selection
                            gridRef?.selectionModule?.clearDeletedSelections(startArgs.data as T[]);
                        }
                    } else {
                        // Non-persistent selection: clear all selections (legacy behavior)
                        gridRef?.selectionModule?.clearAllPersistedSelection();
                        if (Array.isArray(gridRef?.selectionModule?.selectedRowIndexes)) {
                            gridRef.selectionModule.selectedRowIndexes.length = 0;
                        }
                    }
                }

                const addDeleteActionComplete: () => void = () => {
                    requestAnimationFrame(() => {
                        gridRef?.focusModule?.setGridFocus(true);
                        setTimeout(() => {
                            const current: number[] = [lastDeletedIndex, viewData.length ? -1 : 0];
                            gridRef.focusModule.setActiveMatrix('Content');
                            gridRef.focusModule.getActiveMatrix().current = current;
                            gridRef.focusModule.focusedCell.current.rowIndex = current[0];
                            gridRef.focusModule.focusedCell.current.colIndex = current[1];
                            gridRef.element.focus({ preventScroll: true });
                        }, 0);
                    });

                    _gridRef.current?.focusModule?.setGridFocus(true);
                    const eventArgs: DeleteEvent = {
                        action: actionCompleteArgs.action as string,
                        data: actionCompleteArgs.data as Object[]
                    };
                    gridRef?.onDataChangeComplete?.(eventArgs);
                    _gridRef.current.element.removeEventListener('actionComplete', addDeleteActionComplete);
                };
                _gridRef.current.element?.addEventListener('actionComplete', addDeleteActionComplete);
            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError?.(error as Error);
                return;
            }
        }, [_gridRef, dataOperations, viewData, setGridAction, setCurrentPage, pinningModule, undoRedoModule,
            editSettings, getPrimaryKeyField]);

    /**
     * Updates a specific row with new data
     */
    const updateRecord: (index: number, data: T) => void =
        useCallback(async (index: number, data: T) => {
            if (!defaultEditSettings.allowEdit || index < 0 || index >= viewData.length) {
                return;
            }

            const previousData: GroupedData<T> | T = viewData[index as number];

            const actionBeginArgs: Record<string, ValueType | Object | null> = {
                cancel: false,
                requestType: 'save',
                type: 'actionBegin',
                data: data,
                index: index,
                action: ActionType.Edit,
                previousData: previousData
            };

            // Get grid reference for actionBegin event
            const gridRef: GridRef | null = _gridRef?.current;
            const startArgs: SaveEvent<T> = {
                action: actionBeginArgs.action as string,
                data: actionBeginArgs.data as T,
                previousData: actionBeginArgs.previousData as T,
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
                    data: startArgs.data
                });

                // Update local data source for immediate UI feedback
                const selectedRow: IRow<ColumnProps<T>> = _gridRef.current?.getRowsObject()[startArgs.rowIndex];
                const rowObjectData: T = { ...selectedRow.data, ...startArgs.data };
                selectedRow.setRowObject({ ...selectedRow, data: rowObjectData });

                // Trigger actionComplete event AFTER successful operation
                const actionCompleteArgs: Record<string, ValueType | Object | null> = {
                    requestType: 'save',
                    type: 'actionComplete',
                    data: startArgs.data,
                    rowIndex: startArgs.rowIndex,
                    action: ActionType.Edit,
                    previousData: previousData
                };
                const eventArgs: SaveEvent = {
                    action: actionCompleteArgs.action as string,
                    data: actionCompleteArgs.data,
                    previousData: actionCompleteArgs.previousData,
                    rowIndex: actionCompleteArgs.rowIndex as number
                };
                gridRef?.onDataChangeComplete?.(eventArgs);

            } catch (error) {
                // Trigger actionFailure event on error
                // This provides consistent error handling similar to other grid operations
                gridRef?.onError?.(error as Error);
            }
        }, [defaultEditSettings.allowEdit, viewData, _gridRef]);

    /**
     * Use a stable ref-based approach for edit data management
     * This prevents re-renders during typing while maintaining data consistency
     */
    const editDataRef: React.RefObject<T> =
        useRef<T>(null);

    /**
     * Enhanced updateEditData function with proper data isolation and persistence
     */
    const updateEditData: (field: string, value: ValueType, rowObject?: IRow<ColumnProps<T>>) => void =
        useCallback((field: string, value: ValueType, rowObject?: IRow<ColumnProps<T>>) => {
            if (!editState.isEdit) {
                return;
            }

            const primaryKeyField: string = getPrimaryKeyField?.();
            let isCommandEdit: boolean = false;
            // Initialize editDataRef if it's null
            if (!editDataRef.current) {
                editDataRef.current = { ...editState.editData };
            }
            else if (!isNullOrUndefined(rowObject?.rowIndex) && rowObject.data?.[primaryKeyField as string] !==
                editDataRef.current?.[primaryKeyField as string] &&
                commandColumnModule?.commandEditStateRef?.current?.[rowObject.uid as string]) {
                editDataRef.current = commandColumnModule?.commandEditStateRef?.current?.[rowObject.uid]?.editData;
                isCommandEdit = true;
            }

            // Update ref immediately for instant access without triggering re-renders
            // This is the key to preventing multiple EditForm re-renders during typing
            const topLevelKey: string = field.split('.')[0];
            const copiedComplexData: T = field.includes('.') && typeof editDataRef.current[topLevelKey as string] === 'object'
                ? {
                    ...editDataRef.current,
                    [topLevelKey]: JSON.parse(JSON.stringify(editDataRef.current[topLevelKey as string]))
                }
                : { ...editDataRef.current };

            editDataRef.current = DataUtil.setValue(field, value, copiedComplexData) as T;

            // Route batch staging based on edit mode
            if (defaultEditSettings.allowBatchSave) {
                if (editState.editCellIndex?.field === field) {
                    // Cell-level batch: update single cell editor value
                    batchEditModule.updateEditorValue(value);
                }
                if (defaultEditSettings.mode === 'Normal' && !editState.editCellIndex) {
                    const primaryKeyField: string = getPrimaryKeyField();
                    //eslint-disable-next-line security/detect-object-injection
                    const rowKey: string | number = editDataRef.current?.[primaryKeyField] ??
                    //eslint-disable-next-line security/detect-object-injection
                        editState.originalData?.[primaryKeyField];
                    const pinnedState: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T; } | undefined =
                        pinningModule?.pinnedRowsState?.get(String(rowKey));
                    if (pinnedState?.isPinned && pinnedState.pinBucket) {
                        pinningModule?.updatePinnedRowsState?.([editDataRef.current], true, pinnedState.pinBucket);
                    }
                }
            }

            requestAnimationFrame(() => { // onchange form validation time taken purpose small delay required
                const errorsObj: Record<string, string> = !editState.originalData ?
                    _gridRef.current?.addInlineRowFormRef.current?.formState.errors :
                    _gridRef.current?.editInlineRowFormRef.current?.formState.errors;
                // Persist the changed value immediately so row-scoped batch staging observes it
                // when saveDataChanges runs in the same interaction cycle.
                setEditState((prev: EditState<T>) => ({
                    ...prev,
                    ...(isCommandEdit ? {...commandColumnModule?.commandEditStateRef?.current?.[rowObject?.uid as string]} : {}),
                    editData: { ...editDataRef.current },
                    ...(errorsObj && Object.keys(errorsObj).length && virtualSettings.enableRow ? {validationErrors: !prev.originalData ?
                        _gridRef.current?.addInlineRowFormRef.current?.formState.errors :
                        _gridRef.current?.editInlineRowFormRef.current?.formState.errors} : {})
                }));
                if ((isCommandEdit || commandColumnModule?.commandEdit.current) &&
                    commandColumnModule?.commandEditStateRef.current?.[rowObject?.uid as string]) {
                    if (virtualSettings.enableRow) {
                        commandColumnModule.commandEditStateRef.current[rowObject?.uid as string].validationErrors =
                            (editState.originalData ? commandColumnModule?.commandEditInlineFormRef :
                                commandColumnModule?.commandAddInlineFormRef).current?.[`${rowObject?.uid}`]?.current?.formState?.errors;
                    }
                    commandColumnModule.commandEditStateRef.current[rowObject?.uid as string].editData = { ...editDataRef.current };
                }
            });
        }, [editState.isEdit, editState.editData, editState.originalData, editState.editCellIndex,
            _gridRef, defaultEditSettings.allowBatchSave, defaultEditSettings.mode, getPrimaryKeyField, pinningModule]);

    // Initialize Cell Edit hook - handles all cell-level editing functionality
    // Must be placed after updateEditData since it's a dependency
    const cellEditModule: CellEditModule = useCellEdit<T>(
        _gridRef,
        currentViewData as T[],
        dataOperations,
        defaultEditSettings,
        editState,
        setEditState,
        setGridAction,
        editDataRef,
        getPrimaryKeyField,
        updateEditData,
        setResponseData,
        pinningModule,
        batchEditModule,
        undoRedoModule
    );

    // Extract cell edit methods from the module
    const {
        editCell,
        saveCellChanges,
        cancelCellChanges,
        updateValidationErrors,
        handleCellEditKeyDown: cellEditKeyDownHandler,
        handleDeleteCell,
        editFocusedCell
    } = cellEditModule;

    const persistBatchRows: (stagedRows: StagedRowData<T>[]) => Promise<void> = useCallback(async(stagedRows:
    StagedRowData<T>[]): Promise<void> => {
        const primaryKeyField: string = getPrimaryKeyField();
        const dataManager: DataManager | undefined = dataOperations.dataManager instanceof DataManager
            ? dataOperations.dataManager
            : undefined;
        const sourceRows: T[] = (dataManager?.dataSource?.json as T[] | undefined);
        const previousRows: T[] = [];
        const currentRows: T[] = [];
        const rowIndices: number[] = [];
        const rowKeys: (string | number)[] = [];
        const records: T[] = stagedRows.map((stagedRow: StagedRowData<T>) => {
            const sourceIndex: number = sourceRows.findIndex((sourceRow: T) =>
                //eslint-disable-next-line security/detect-object-injection
                String(sourceRow?.[primaryKeyField]) === String(stagedRow.rowKey));
            //eslint-disable-next-line security/detect-object-injection
            const viewIndex: number = currentViewData.findIndex((viewRow: GroupedData<T> | T) =>
                //eslint-disable-next-line security/detect-object-injection
                String((viewRow as T)?.[primaryKeyField]) === String(stagedRow.rowKey));
            //eslint-disable-next-line security/detect-object-injection
            const sourceRow: T = sourceIndex >= 0 ? sourceRows[sourceIndex] :
                //eslint-disable-next-line security/detect-object-injection
                (viewIndex >= 0 ? currentViewData[viewIndex] as T : { [primaryKeyField]: stagedRow.rowKey } as T);
            let record: T = { ...sourceRow } as T;
            stagedRow.fieldChanges.forEach((change: StagedFieldChange, fieldName: string) => {
                record = DataUtil.setValue(fieldName, change.stagedValue, record as Record<string, unknown>) as T;
            });
            previousRows.push({ ...sourceRow } as T);
            currentRows.push(record);
            rowIndices.push(sourceIndex >= 0 ? sourceIndex : viewIndex);
            rowKeys.push(stagedRow.rowKey);
            return record;
        });
        if (records.length) {
            const customBinding: boolean = dataOperations.dataManager && 'result' in dataOperations.dataManager;
            await dataOperations.getData({ requestType: 'save', data: records });

            if (undoRedoModule && defaultEditSettings.allowUndoRedo) {
                undoRedoModule.clearStagedActions();
                undoRedoModule.recordAction({
                    id: `${Date.now()}-${Math.random()}`,
                    actionType: 'batch-save',
                    previousState: { rows: previousRows, rowIndices, rowKeys },
                    currentState: { rows: currentRows, rowIndices, rowKeys },
                    batchRows: stagedRows,
                    timestamp: Date.now()
                });
            }
            stagedHistoryValuesRef.current.clear();

            stagedRows.forEach((stagedRow: StagedRowData<T>, index: number) => {
                const rowIndex: number = currentViewData.findIndex((viewRow: GroupedData<T> | T) =>
                    String((viewRow as T)?.[primaryKeyField as string]) === String(stagedRow.rowKey));
                if (defaultEditSettings.mode === 'Cell' && defaultEditSettings.allowBatchSave) {
                    const pinnedState: { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T; } | undefined =
                        pinningModule?.pinnedRowsState?.get(String(stagedRow.rowKey));
                    if (pinnedState?.isPinned && pinnedState.pinBucket) {
                        pinningModule?.updatePinnedRowsState?.([records[index as number]], true, pinnedState.pinBucket);
                    }
                }
                _gridRef.current?.onDataChangeComplete?.({
                    action: ActionType.Edit,
                    data: records[index as number],
                    previousData: stagedRow.originalData as T,
                    rowIndex
                });
            });

            if (customBinding) {
                const committedRows: Map<string, StagedRowData<T>> = new Map<string, StagedRowData<T>>(
                    stagedRows.map((stagedRow: StagedRowData<T>) => [String(stagedRow.rowKey), stagedRow])
                );
                currentViewData.forEach((viewRow: GroupedData<T> | T) => {
                    const rowKey: string = String((viewRow as T)?.[primaryKeyField as string]);
                    const stagedRow: StagedRowData<T> = committedRows.get(rowKey);
                    if (!stagedRow || (viewRow as GroupedData<T>)?.flattedKey) {
                        return;
                    }
                    stagedRow.fieldChanges.forEach((change: StagedFieldChange, fieldName: string) => {
                        DataUtil.setValue(fieldName, change.stagedValue, viewRow as Record<string, unknown>);
                    });
                });
            }
        }
    }, [getPrimaryKeyField, dataOperations, currentViewData, defaultEditSettings.mode,
        defaultEditSettings.allowBatchSave, pinningModule]);

    const restoreBatchRows: (stagedRows: StagedRowData<T>[]) => void = useCallback((stagedRows: StagedRowData<T>[]): void => {
        stagedRows.forEach((stagedRow: StagedRowData<T>) => {
            const rowObject: IRow<ColumnProps<T>> | undefined = _gridRef.current?.getRowsObject?.()
                ?.find((row: IRow<ColumnProps<T>>) => String(row.data?.[getPrimaryKeyField()]) === String(stagedRow.rowKey));
            if (rowObject) {
                let restoredData: T = { ...rowObject.data } as T;
                Object.entries(stagedRow.originalData).forEach(([fieldName, value]: [string, unknown]) => {
                    restoredData = DataUtil.setValue(fieldName, value, restoredData as Record<string, unknown>) as T;
                });
                rowObject.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                    ...previousRowObject,
                    data: restoredData
                }));
            }
        });
    }, [_gridRef, getPrimaryKeyField]);

    const commitBatchChanges: () => Promise<boolean> = useCallback((): Promise<boolean> =>
        batchEditModule.batchSaveChanges(
            defaultEditSettings.allowBatchSave && editState.isEdit && editState.editCellIndex ? saveCellChanges : undefined,
            persistBatchRows
        ), [batchEditModule, defaultEditSettings.allowBatchSave, editState.isEdit, editState.editCellIndex,
        saveCellChanges, persistBatchRows]);

    const stageActiveRowBatchEdit: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        if (!(defaultEditSettings.allowBatchSave && defaultEditSettings.mode === 'Normal' && editState.isEdit &&
            !editState.editCellIndex && editState.originalData)) {
            return true;
        }

        const primaryKeyField: string = getPrimaryKeyField();
        const liveEditData: T = getCurrentEditData() ?? editDataRef.current ?? editState.editData;
        if (!liveEditData) {
            return true;
        }

        // eslint-disable-next-line security/detect-object-injection
        const rowKey: string | number = liveEditData[primaryKeyField] ?? editState.originalData[primaryKeyField];
        const visibleColumns: ColumnProps<T>[] = _gridRef.current?.getVisibleColumns?.();
        const rowColumns: ColumnProps<T>[] = visibleColumns.length ? visibleColumns : columns;
        let hasRowBatchChanges: boolean = false;

        const pendingRowChanges: Array<{ fieldName: string; currentValue: ValueType; originalValue: ValueType }> = [];

        for (const column of rowColumns) {
            if (!column.field || column.isPrimaryKey || column.allowEdit === false) {
                continue;
            }

            const originalValue: ValueType = editState.originalData?.[column.field];
            const currentValue: ValueType = liveEditData?.[column.field];
            if (originalValue !== currentValue) {
                pendingRowChanges.push({
                    fieldName: column.field,
                    currentValue,
                    originalValue
                });
            }
        }

        if (pendingRowChanges.length) {
            hasRowBatchChanges = true;
            await batchEditModule.openEditor(rowKey, pendingRowChanges, editState.rowObject?.uid);
        }

        if (hasRowBatchChanges) {
            const mergedRowData: T = { ...liveEditData } as T;
            const saveArgs: { cancel: boolean; data: T; rowIndex: number; previousData: T; action: string } = {
                cancel: false,
                data: mergedRowData,
                rowIndex: editState.editRowIndex,
                previousData: editState.originalData as T,
                action: ActionType.Edit
            };

            if (editState.rowObject && typeof editState.rowObject.setRowObject === 'function') {
                editState.rowObject.setRowObject((previousRowObject: IRow<ColumnProps<T>>) => ({
                    ...previousRowObject,
                    data: mergedRowData
                }));
            }

            if (editState.rowObject?.isPinned) {
                pinningModule?.updatePinnedRowObjectsData(editState.rowObject, saveArgs);
            }

            setResponseData((previousData: Object) => {
                const previousResult: T[] | GroupedData<T>[] = Array.isArray((previousData as { result?: T[] | GroupedData<T>[] }).result)
                    ? (previousData as { result?: T[] | GroupedData<T>[] }).result as T[] | GroupedData<T>[]
                    : [...currentViewData] as T[] | GroupedData<T>[];
                const customBinding: boolean = !!dataOperations.dataManager && 'result' in dataOperations.dataManager;
                const nextResult: (T | GroupedData<T>)[] = previousResult.map((viewRow: T | GroupedData<T>) => {
                    if ((viewRow as GroupedData<T>)?.flattedKey) {
                        return viewRow;
                    }
                    const rowKeyValue: string | number | undefined = (viewRow as T)?.[primaryKeyField as string];
                    if (String(rowKeyValue) !== String(rowKey)) {
                        return viewRow;
                    }
                    return mergedRowData;
                });
                return {
                    ...(previousData as Record<string, unknown>),
                    aggregates: customBinding ? (previousData as { aggregates?: Object }).aggregates : undefined,
                    result: nextResult
                };
            });
        }
        editDataRef.current = null;
        setEditState((prev: EditState<T>) => ({
            ...prev,
            isEdit: false,
            editRowIndex: -1,
            editData: null,
            originalData: null,
            validationErrors: {},
            rowObject: {},
            editCellIndex: undefined
        }));

        return true;
    }, [defaultEditSettings.allowBatchSave, defaultEditSettings.mode, editState.isEdit, editState.originalData,
        editState.editData, editState.editCellIndex, editState.rowObject, getPrimaryKeyField, batchEditModule, currentViewData,
        setResponseData, _gridRef, getCurrentEditData, pinningModule]);

    const saveBatchChanges: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        const stagedCurrentRow: boolean = await stageActiveRowBatchEdit();
        if (!stagedCurrentRow) {
            return false;
        }

        if (!batchEditModule.hasBatchChanges()) {
            return true;
        }

        if (batchEditModule.hasPendingValidationErrors()) {
            return false;
        }

        if (defaultEditSettings.confirmOnEdit) {
            const confirmResult: boolean = await dialogHook.confirmOnEdit({
                title: '',
                message: localization.getConstant('batchSaveConfirmation'),
                confirmText: localization.getConstant('okButtonLabel'),
                cancelText: localization.getConstant('cancelButtonLabel'),
                type: 'Warning'
            });
            if (!confirmResult) {
                return false;
            }
        }
        return commitBatchChanges();
    }, [batchEditModule, commitBatchChanges, defaultEditSettings.confirmOnEdit, dialogHook, localization, stageActiveRowBatchEdit]);

    const cancelBatchChanges: () => Promise<void> = useCallback(async (): Promise<void> => {
        if (!defaultEditSettings.allowBatchSave) {
            return;
        }

        const hasBatchEdits: boolean = batchEditModule.hasBatchChanges();
        const hasActiveCellEditor: boolean = defaultEditSettings.allowBatchSave && editState.isEdit && !!editState.editCellIndex;

        if (defaultEditSettings.mode === 'Normal' && editState.isEdit && !editState.editCellIndex && editState.originalData && editState.editData) {
            editDataRef.current = null;
            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: false,
                editRowIndex: -1,
                editData: null,
                originalData: null,
                validationErrors: {},
                rowObject: {},
                editCellIndex: undefined
            }));
            if (hasBatchEdits) {
                await batchEditModule.batchCancelChanges(undefined, restoreBatchRows);
                undoRedoModule?.clearStagedActions();
                stagedHistoryValuesRef.current.clear();
                setResponseData((previousData: Object) => ({
                    ...previousData,
                    result: currentViewData
                }));
            }
            return;
        }

        if (!hasBatchEdits && !hasActiveCellEditor) {
            return;
        }

        if (defaultEditSettings.confirmOnEdit && hasBatchEdits) {
            const confirmResult: boolean = await dialogHook.confirmOnEdit({
                title: '',
                message: localization.getConstant('batchCancelConfirmation'),
                confirmText: localization.getConstant('okButtonLabel'),
                cancelText: localization.getConstant('cancelButtonLabel'),
                type: 'Warning'
            });

            if (!confirmResult) {
                return;
            }
        }

        await batchEditModule.batchCancelChanges(
            hasActiveCellEditor ? cancelCellChanges : undefined,
            restoreBatchRows
        );
        undoRedoModule?.clearStagedActions();
        stagedHistoryValuesRef.current.clear();
        setResponseData((previousData: Object) => ({
            ...previousData,
            result: currentViewData
        }));
    }, [batchEditModule, defaultEditSettings.allowBatchSave, defaultEditSettings.mode, editState.isEdit, editState.originalData,
        editState.editData, editState.editCellIndex, cancelCellChanges, restoreBatchRows, setResponseData, currentViewData,
        dialogHook, localization, defaultEditSettings.confirmOnEdit]);

    const getBatchQueue: () => StagedRowData<T>[] = useCallback((): StagedRowData<T>[] =>
        batchEditModule.getAllStagedRows(), [batchEditModule]);

    const getConfirmBatch: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        if (batchEditModule.hasPendingValidationErrors()) {
            return false;
        }

        if (!batchEditModule.hasBatchChanges()) {
            return true;
        }

        const confirmResult: boolean = await dialogHook.confirmOnEdit({
            title: '',
            message: localization.getConstant('unsavedChangesConfirmation'),
            confirmText: localization.getConstant('okButtonLabel'),
            cancelText: localization.getConstant('cancelButtonLabel'),
            type: 'Warning'
        });
        return confirmResult;
    }, [batchEditModule, dialogHook, localization]);

    const hasBatchChanges: () => boolean = useCallback(
        (): boolean => defaultEditSettings.allowBatchSave && batchEditModule.hasBatchChanges(),
        [defaultEditSettings.allowBatchSave, batchEditModule]
    );

    const batchState: BatchState<T> = useMemo<BatchState<T>>(() => {
        const pendingChanges: StagedRowData<T>[] = batchEditModule.getAllStagedRows();
        const validationErrors: Record<string, string> = pendingChanges.reduce((accumulator: Record<string, string>,
                                                                                stagedRow: StagedRowData<T>) => {
            Array.from(stagedRow.fieldChanges.entries()).forEach(([fieldName, fieldChange]: [string, StagedFieldChange]) => {
                if (fieldChange.validationError) {
                    accumulator[`${stagedRow.rowKey}.${fieldName}`] = fieldChange.validationError;
                }
            });
            return accumulator;
        }, {});

        return {
            isBatchEditing: defaultEditSettings.allowBatchSave,
            pendingChanges,
            hasPendingChanges: pendingChanges.length > 0,
            dirtyFieldCount: pendingChanges.reduce(
                (count: number, stagedRow: StagedRowData<T>) =>
                    count + Array.from(stagedRow.fieldChanges.values()).filter(
                        (change: StagedFieldChange) => change.isDirty
                    ).length,
                0
            ),
            validationErrors
        };
    }, [batchEditModule, defaultEditSettings.allowBatchSave]);

    const isBatchCellDirty: (rowKey: string | number, fieldName: string) => boolean = useCallback(
        (rowKey: string | number, fieldName: string): boolean =>
            defaultEditSettings.allowBatchSave && batchEditModule.isFieldDirty(rowKey, fieldName),
        [defaultEditSettings.allowBatchSave, batchEditModule]
    );

    /**
     * Check if a row has any batch edits (dirty state)
     * Returns true if the row has any staged field changes
     */
    const isBatchRowDirty: (rowKey: string | number) => boolean = useCallback(
        (rowKey: string | number): boolean => {
            if (!defaultEditSettings.allowBatchSave) {
                return false;
            }
            return batchEditModule.getAllStagedRows().some((stagedRow: StagedRowData<T>) => stagedRow.rowKey === rowKey);
        },
        [defaultEditSettings.allowBatchSave, batchEditModule]
    );

    /**
     * Handle click events for showAddNewRow functionality and validation workflow
     */
    const handleGridClick: (event: React.MouseEvent) => void = useCallback(async (event: React.MouseEvent) => {
        const target: Element = event.target as Element;

        // Check if the click is within grid content or header content (for frozen rows)
        const isWithinGridContent: boolean | Element = target.closest('.sf-grid-content-container');

        // Only handle clicks within grid content and not on unbound cells
        if (isWithinGridContent && !(target.closest('.sf-unbound-cell') || commandColumnModule?.commandEdit.current)) {

            // If grid is in edit mode with an actual edited row/cell, end the current edit
            const hasEditedRow: boolean = editState.editRowIndex >= 0 && !isNullOrUndefined(editState.editData);
            const hasEditedCell: boolean = editState.editCellIndex !== undefined;
            const isFormulaCellEditing: boolean = defaultEditSettings.mode === 'Cell' && hasEditedCell &&
                columns.some((column: ColumnProps<T>) => column.field === editState.editCellIndex?.field && column.allowFormula);

            if (editState.isEdit && (hasEditedRow || hasEditedCell) && !isFormulaCellEditing && !target.closest('.sf-form-validator')) {
                // Branch by edit mode
                if ((defaultEditSettings.mode === 'Cell' || defaultEditSettings.allowBatchSave) && hasEditedCell) {
                    // Cell edit mode: save current cell
                    const isValid: boolean = await saveCellChanges();
                    // If save failed (validation errors), prevent the click from proceeding
                    if (!isValid) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                } else if (hasEditedRow) {
                    // Row edit mode: stage the current row for batch editing, or save it directly.
                    notKeyBoardAllowedClickRowInfo.current = !_gridRef.current?.allowKeyboard ? _gridRef.current?.getRowInfo?.(target) : {};
                    if (isRowBatchEdit) {
                        const isValid: boolean = validateEditForm();
                        const isStaged: boolean = isValid && await stageActiveRowBatchEdit();
                        if (!isStaged) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        return;
                    }
                    saveDataChanges(undefined, undefined, 'Click');
                    const isValid: boolean = validateEditForm();
                    // If save failed (validation errors), prevent the click from proceeding
                    if (!isValid) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
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
        editState.editCellIndex,
        columns,
        saveDataChanges,
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
            if (!editSettings.allowEdit || !editOnDoubleClick || (event.target as Element).closest('.sf-grid-command-cell') ||
                (event.target as Element).closest('.sf-grid-groupcaptionrow')) {
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
            if (!clickedRow || (!clickedRow.hasAttribute('data-rowindex') && !clickedRow.hasAttribute('data-rowindex'))) {
                return;
            }

            // Handle showAddNewRow double-click behavior first - this is critical
            if (editSettings.showAddNewRow) {
                // Check if the double-click is on the add new row - if so, ignore it
                const isAddNewRowClick: boolean = target.closest('.sf-grid-add-row') !== null ||
                                        target.closest('tr[data-uid*="grid-add-row"]') !== null ||
                                        clickedRow.classList.contains('sf-grid-add-row') ||
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

            // Start editing the double-clicked row or cell
            // This ensures double-clicking always starts edit mode on data rows
            // even when showAddNewRow is enabled
            event.preventDefault(); // Prevent text selection on double-click
            if (defaultEditSettings.mode === 'Cell') {
                // Cell mode + Batch: Single cell batch editing
                const cellElement: HTMLTableCellElement = clickedCell;
                const rowElement: HTMLTableRowElement = clickedRow;

                const rowIndexAttr: string | null = rowElement.getAttribute('data-uid');
                const rowObject: IRow<ColumnProps<T>> = _gridRef?.current?.getRowObjectFromUID(rowIndexAttr);
                if (!rowObject || !rowObject.data) {
                    return;
                }

                const primaryKeyValue: string | number = rowObject.data[getPrimaryKeyField() as string];

                // Get field from cell
                const cellColumnIndex: string | null = cellElement.getAttribute('aria-colindex') ?? cellElement.getAttribute('data-colindex');
                let cellIndex: number = cellColumnIndex ? parseInt(cellColumnIndex, 10) - 1 : -1;
                if (cellIndex < 0) {
                    cellIndex = Array.from(rowElement.children).indexOf(cellElement);
                }
                const visibleColumns: ColumnProps<T>[] = _gridRef.current?.getVisibleColumns();
                if (cellIndex < 0 || cellIndex >= visibleColumns.length) {
                    return;
                }

                const column: ColumnProps<T> = visibleColumns[cellIndex as number];

                if (!column.field || !primaryKeyValue) {
                    return;
                }

                // Call editCell with extracted coordinates
                editCell(primaryKeyValue, column.field, rowElement?.getAttribute('data-uid'));
            } else {
                editRecord(rowElement); // Row-level batch editing (entire row)
            }
        }, [
            defaultEditSettings.editOnDoubleClick,
            defaultEditSettings.allowEdit,
            defaultEditSettings.showAddNewRow,
            defaultEditSettings.mode,
            editRecord,
            editCell,
            getPrimaryKeyField,
            columns,
            _gridRef,
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
            // Use memoized new row data derived from columns
            const newRowData: T = initialAddRowData;

            // Set the grid in edit state with the add new row
            setEditState((prev: EditState<T>) => ({
                ...prev,
                isEdit: true, // Grid remains in edit state when showAddNewRow is enabled
                showAddNewRowData: newRowData as T,
                isShowAddNewRowActive: true,
                isShowAddNewRowDisabled: false, // Initially enabled
                editRowIndex: -1, // Special index for add new row
                editData: newRowData as T,
                originalData: null, // Empty for add operations
                validationErrors: {}
            }));

            // Initialize the edit data ref for the add new row
            editDataRef.current = { ...newRowData as T };
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
            setEditState((prev: EditState<T>) => ({
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
    }, [defaultEditSettings.showAddNewRow, defaultEditSettings.allowAdd, _gridRef, initialAddRowData]);

    /**
     * Checks if there are unsaved changes and shows confirmation dialog if needed
     *
     * @private
     * @returns { Promise<boolean> } - true if operation should proceed, false if cancelled
     */
    const checkUnsavedChanges: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        if (defaultEditSettings.allowBatchSave && batchEditModule.hasPendingValidationErrors()) {
            return false;
        }

        const commandEditChanges: boolean = commandColumnModule?.commandEdit.current &&
            (Object.keys(commandColumnModule?.commandEditRef.current).length
            || commandColumnModule?.commandAddRef.current.length) ? true : false;
        const hasUnsavedChanges: boolean | Object = batchEditModule.hasBatchChanges() ||
            _gridRef.current?.editInlineRowFormRef?.current?.formRef?.current ||
            _gridRef.current?.addInlineRowFormRef?.current?.formRef?.current || commandEditChanges;

        if (hasUnsavedChanges && defaultEditSettings.confirmOnEdit) {
            // Show confirmation dialog for unsaved changes
            const message: string = localization.getConstant('unsavedChangesConfirmation');
            focusModule?.clearIndicator?.();
            const confirmResult: boolean = await dialogHook.confirmOnEdit({
                title: '',
                message: message,
                confirmText: localization.getConstant('okButtonLabel'),
                cancelText: localization.getConstant('cancelButtonLabel'),
                type: 'Warning'
            });

            focusModule?.addFocus?.(focusModule?.getFocusedCell?.());
            if (!confirmResult) {
                // User cancelled, prevent the data operation
                return false;
            }
        }
        // User confirmed to proceed with losing changes
        // Force close edit state without saving
        setEditState((prev: EditState<T>) => ({
            ...prev,
            originalData: null,
            editRowIndex: -1,
            editData: !defaultEditSettings.showAddNewRow ? null : prev.editData,
            isEdit: defaultEditSettings.showAddNewRow
        }));
        if (batchEditModule.hasBatchChanges()) {
            batchEditModule.batchCancelChanges?.(undefined, () => undefined);
        }
        if (commandEditChanges) {
            commandColumnModule.commandEditRef.current = {};
            commandColumnModule.commandEditStateRef.current = {};
            commandColumnModule.commandAddRef.current = [];
            commandColumnModule.commandEditInlineFormRef.current = {};
            commandColumnModule.commandAddInlineFormRef.current = {};
        }
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
    }, [_gridRef.current, editState.isEdit, editState.originalData, editState.editData, localization, dialogHook, batchEditModule]);

    const confirmUndoRedoClear: () => Promise<boolean> = useCallback(async (): Promise<boolean> => {
        if (!undoRedoModule?.getUndoActionsCount?.() && !undoRedoModule?.getRedoActionsCount?.()) {
            return true;
        }

        const confirmed: boolean = await dialogHook.confirmOnEdit({
            title: '',
            message: 'This operation will clear the undo and redo history. Do you want to continue?',
            confirmText: localization.getConstant('okButtonLabel'),
            cancelText: localization.getConstant('cancelButtonLabel'),
            type: 'Warning'
        });
        if (confirmed) {
            undoRedoModule.clearHistory();
        }
        return confirmed;
    }, [dialogHook, localization, undoRedoModule]);

    const onSelectionDeleteConfirm: (deleteOption: 'page' | 'all') => Promise<void> = async ( deleteOption: 'page' | 'all' ): Promise<void> => {
        try {
            const isRemoteData: boolean = dataOperations?.isRemote?.();
            if (deleteOption === 'page') {
                // Use cached current page selected records to avoid re-iteration
                const currentPageSelectedRecords: T[] = pendingDeleteData?.currentPageSelectedRecords;
                await executeDelete(currentPageSelectedRecords, pendingDeleteData?.deleteIndexes, isRemoteData, deleteOption);
            } else {
                // Delete all selected records
                await executeDelete( pendingDeleteData?.recordsToDelete, pendingDeleteData?.deleteIndexes, isRemoteData, deleteOption);
            }
        } finally {
            setPendingDeleteData(null);
            setIsDeleteDialogOpen(false);
        }
    };

    /**
     * Adds a new record and resolves once the grid's UI has committed the new row.
     * Resolves without rejecting when the add is vetoed by `onRowAddStart`/validation or is a no-op.
     *
     * @param {T} [data] - Optional. The record to add. If omitted, an empty/default record is added.
     * @param {number} [index] - Optional. The index at which to insert the new record.
     * @returns {Promise<void>} Resolves after the add operation completes.
     */
    const addRecordAsync: (data?: T, index?: number) => Promise<void> =
        useCallback((data?: T, index?: number): Promise<void> =>
            executeGridAsyncAction(_gridRef, ActionType.Add, () => addRecord(data, index)),
                    [_gridRef, addRecord]);

    const addRecordAtIndexAsync: (data?: T, index?: number) => Promise<void> =
        useCallback((data?: T, index?: number): Promise<void> =>
            executeGridAsyncAction(_gridRef, ActionType.Add, () => addRecordInternal(data, index, true)),
                    [_gridRef, addRecordInternal]);

    /**
     * Deletes one or more records and resolves once the grid's UI has committed the removal.
     * Resolves without rejecting when the delete is vetoed by `onRowDeleteStart` or is a no-op.
     *
     * @param {string} [fieldName] - Optional. The primary key field name identifying the record(s) to delete.
     * @param {T | T[]} [data] - Optional. The record or records to delete.
     * @returns {Promise<void>} Resolves after the delete operation completes.
     */
    const deleteRecordAsync: (fieldName?: string, data?: T | T[]) => Promise<void> =
        useCallback((fieldName?: string, data?: T | T[]): Promise<void> =>
            executeGridAsyncAction(_gridRef, ActionType.Delete, () => deleteRecord(fieldName, data)),
                    [_gridRef, deleteRecord]);

    /**
     * Updates an existing record at the given index and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the update is vetoed or is a no-op.
     *
     * @param {number} index - The index of the record to update.
     * @param {T} data - The new data for the record.
     * @returns {Promise<void>} Resolves after the update operation completes.
     */
    const updateRecordAsync: (index: number, data: T) => Promise<void> =
        useCallback((index: number, data: T): Promise<void> =>
            executeGridAsyncAction(_gridRef, 'save', () => updateRecord(index, data)),
                    [_gridRef, updateRecord]);

    return {
        // Edit state
        isEdit: editState.isEdit,
        editSettings: defaultEditSettings,
        editRowIndex: editState.editRowIndex,
        editData: editState.editData, // Always return state data for proper form binding
        validationErrors: editState.validationErrors,
        originalData: editState.originalData,
        rowObject: editState.rowObject,
        popupEditFormRef,
        // showAddNewRow state
        showAddNewRowData: editState.showAddNewRowData,
        isShowAddNewRowActive: editState.isShowAddNewRowActive,
        isShowAddNewRowDisabled: editState.isShowAddNewRowDisabled,

        // Cell edit index (for Cell edit mode)
        editCellIndex: editState.editCellIndex,

        // Edit operations
        editRecord,
        saveDataChanges,
        cancelDataChanges,

        // Cell edit operations (delegated to useCellEdit)
        editCell,
        saveCellChanges,
        cancelCellChanges,
        updateValidationErrors,
        editFocusedCell,
        deleteCell: handleDeleteCell,

        // Cell edit keyboard navigation (consolidated) - delegated to useCellEdit
        handleCellEditKeyDown: cellEditKeyDownHandler,

        // CRUD operations
        addRecord,
        deleteRecord,
        updateRecord,
        addRecordAsync,
        addRecordAtIndexAsync,
        deleteRecordAsync,
        updateRecordAsync,

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
        confirmUndoRedoClear,
        saveBatchChanges,
        cancelBatchChanges,
        getBatchQueue,
        getConfirmBatch,
        hasBatchChanges,
        isBatchCellDirty,
        isBatchRowDirty,
        batchEditModule,
        batchState,

        // Dialog state and methods for confirmation dialogs
        isDialogOpen: dialogHook.isDialogOpen,
        dialogConfig: dialogHook.dialogConfig,
        onDialogConfirm: dialogHook.onDialogConfirm,
        onDialogCancel: dialogHook.onDialogCancel,

        // Selection delete dialog state and handlers
        isDeleteDialogOpen,
        onSelectionDeleteConfirm,
        onSelectionDeleteCancel: () => {
            // User canceled - abort operation without deleting
            setPendingDeleteData(null);
            setIsDeleteDialogOpen(false);
        },
        nextPrevEditRowInfo,
        focusLastField,
        escEnterIndex,
        InlineEditForm,
        PopupEditForm,
        CellEditForm,
        DeleteDialog,
        ConfirmDialog,
        ToolbarModule
    };
};
export { useEdit as EditModule };
