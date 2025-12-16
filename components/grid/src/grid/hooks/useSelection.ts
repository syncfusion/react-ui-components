
import { RefObject, useCallback, useRef, KeyboardEvent, MouseEvent, useMemo } from 'react';
import { IRow, SelectionMode, UseDataResult } from '../types';
import { RowSelectEvent, RowSelectingEvent, SelectionModel } from '../types/selection.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { closest, isNullOrUndefined } from '@syncfusion/react-base';
import { CellFocusEvent } from '../types/focus.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { Query, QueryOptions } from '@syncfusion/react-data';

/**
 * Custom hook to manage selection state and API
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component
 * @param {T[]} [currentViewData] - Current view data for the active page/view
 * @param {number} [totalRecordsCount] - Total records count across all pages
 * @param {boolean} [isCheckBoxColumn] - Specifies if the column renders a checkbox for selection
 * @param {UseDataResult} [dataModule] - The data module for data operations
 * @returns {SelectionModel} An object containing selection-related state and API
 */
export const useSelection: <T>(gridRef?: RefObject<GridRef<T>>, currentViewData?: T[], totalRecordsCount?: number,
    isCheckBoxColumn?: boolean, dataModule?: UseDataResult<T>) => SelectionModel<T> =
<T>(gridRef?: RefObject<GridRef<T>>, currentViewData?: T[], totalRecordsCount?: number, isCheckBoxColumn?: boolean,
    dataModule?: UseDataResult<T>): SelectionModel<T> => {
    const selectedRowIndexes: RefObject<number[]> = useRef<number[]>([]);
    const selectedRowsRef: RefObject<HTMLTableRowElement[]> = useRef<HTMLTableRowElement[]>([]);
    const prevRowIndex: RefObject<number | null> = useRef(null);
    const activeEvent: RefObject<MouseEvent | React.KeyboardEvent> = useRef(null);
    const isMultiShiftRequest: RefObject<boolean> = useRef(false);
    const isMultiCtrlRequest: RefObject<boolean> = useRef(false);
    const isRowSelected: RefObject<boolean> = useRef(false);
    // Persistent selection state across paging
    const selectedRowState: RefObject<Set<string>> = useRef<Set<string>>(new Set());
    const persistSelectedData: RefObject<Map<string, T>> = useRef<Map<string, T>>(new Map());
    // Remote select-all tracking
    const isRemoteHeaderSelection: RefObject<boolean> = useRef<boolean>(false);
    const unselectedRowState: RefObject<Set<string>> = useRef<Set<string>>(new Set());

    // Resets the `selectedRowIndexes` when the current view data changes
    useMemo(() => selectedRowIndexes.current.length = 0, [currentViewData]);

    // Update persistent selection collection - Defined early to be used by other functions
    const updatePersistCollection: (rowData: T, isSelected: boolean) => void =
        useCallback((rowData: T, isSelected: boolean): void => {
            if (!gridRef?.current) { return; }
            const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
            if (!primaryKeys?.length) { return; }
            const key: string = rowData?.[primaryKeys[0]];
            if (!key) { return; }
            if (isSelected) {
                if (!selectedRowState.current.has(key)) {
                    selectedRowState.current.add(key);
                    persistSelectedData.current.set(key, rowData);
                }
                // If global remote header select-all is active, remove from unselected set
                if (isRemoteHeaderSelection.current && unselectedRowState.current.has(key)) {
                    unselectedRowState.current.delete(key);
                }
            } else {
                if (selectedRowState.current.has(key)) {
                    selectedRowState.current.delete(key);
                    persistSelectedData.current.delete(key);
                }
                // If global remote header select-all is active, track manual unselection
                if (isRemoteHeaderSelection.current) {
                    unselectedRowState.current.add(key);
                }
            }
        }, [gridRef]);

    const getRowObj: (row: Element | number) => IRow<ColumnProps<T>> = useCallback((row: Element | number): IRow<ColumnProps<T>> => {
        if (isNullOrUndefined(row)) { return {} as IRow<ColumnProps<T>>; }
        if (typeof row === 'number') {
            row = gridRef?.current?.getRowByIndex(row);
        }
        if (row) {
            return gridRef?.current?.getRowObjectFromUID?.(row.getAttribute('data-uid')) || {} as IRow<ColumnProps<T>>;
        }
        return {} as IRow<ColumnProps<T>>;
    }, [gridRef]);

    const updateHeaderSelectionState: () => void = useCallback((): void => {
        if (!isCheckBoxColumn || !gridRef?.current) { return; }
        const row: IRow<ColumnProps> = gridRef?.current?.getHeaderRowsObject?.()?.[0];
        if (!row) { return; }
        const setHeaderState: (isSelected: boolean, isIntermediateState: boolean) => void = (
            isSelected: boolean, isIntermediateState: boolean): void => {
            row?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({ ...prev, isSelected, isIntermediateState }));
        };
        const viewSelectedCount: number = selectedRowIndexes.current.length;
        let totalSelectedCount: number = getSelectedRecords().length;
        const totalCount: number = totalRecordsCount !== 0 ? totalRecordsCount : gridRef.current?.pageSettings?.totalRecordsCount;
        const query: Query = dataModule?.generateQuery?.();
        // Check if queries contain search or where
        const hasFiltering: boolean = query.queries.some((q: QueryOptions) => {
            const fnName: string = (q && (q.fn || q['fn'])) as string;
            return fnName === 'onSearch' || fnName === 'onWhere';
        });
        if (hasFiltering) {
            totalSelectedCount = (gridRef.current?.getData?.(true, false, getSelectedRecords()) as T[]).length;
        }
        let allSelected: boolean = false;
        let isIntermediateState: boolean = false;
        if (!gridRef.current?.selectionSettings.persistSelection) {
            allSelected = currentViewData?.length > 0 && viewSelectedCount === currentViewData?.length;
            if (!allSelected && viewSelectedCount > 0) {
                isIntermediateState = true;
            }
        }
        else {
            if (totalCount === 0) {
                allSelected = false;
            } else {
                allSelected = totalCount === totalSelectedCount;
            }
            if (!allSelected && !!totalCount) {
                isIntermediateState = totalSelectedCount > 0;
            }
        }
        setHeaderState(allSelected, isIntermediateState);
    }, [gridRef, currentViewData, totalRecordsCount, selectedRowIndexes]);

    const generateRowSelectArgs: (indexes?: number[], isDeselect?: boolean, shiftSelectableRowIndexes?: number[]) => RowSelectEvent<T> =
        useCallback((indexes?: number[], isDeselect?: boolean, shiftSelectableRowIndexes?: number[]): RowSelectEvent<T> => {
            const selectedData: T[] = [];
            const selectedRows: HTMLTableRowElement[] = [];
            selectedDataUpdate(selectedData, selectedRows, indexes);
            return {
                data: (gridRef?.current?.selectionSettings.mode === 'Single' ? selectedData[0] : selectedData),
                row: (gridRef?.current?.selectionSettings.mode === 'Single' ? selectedRows[0] : selectedRows),
                ...(gridRef?.current?.selectionSettings.mode === 'Single' ? (
                    isDeselect ? { deSelectedRowIndex: indexes[0] } : { selectedRowIndex: indexes[0] }
                ) : (isDeselect ? {
                    selectedRowIndexes: selectedRowIndexes.current,
                    deSelectedCurrentRowIndexes: indexes
                } : {
                    selectedRowIndexes: indexes,
                    ...(shiftSelectableRowIndexes ? {selectedCurrentRowIndexes: shiftSelectableRowIndexes} :
                        {selectedCurrentRowIndexes: [indexes[indexes.length - 1]]})
                })),
                event: activeEvent.current
            };
        }, []);

    const triggerRowSelect: (rowSelect: boolean, shiftSelectableRowIndexes?: number[], deselectedRowIndexes?: number[]) => void =
        useCallback((rowSelect: boolean, shiftSelectableRowIndexes?: number[], deselectedRowIndexes?: number[]): void => {
            if (rowSelect) {
                gridRef?.current?.onRowSelect?.(generateRowSelectArgs(selectedRowIndexes.current, !rowSelect, shiftSelectableRowIndexes));
            } else {
                gridRef?.current?.onRowDeselect?.(generateRowSelectArgs(deselectedRowIndexes, !rowSelect, shiftSelectableRowIndexes));
            }
        }, []);

    /**
     * Updates row selection state
     */
    const updateRowSelection: (selectedRow: HTMLTableRowElement, rowIndex: number) => void =
        useCallback((selectedRow: HTMLTableRowElement, rowIndex: number): void => {
            if (!selectedRow || !gridRef?.current) { return; }
            selectedRowIndexes?.current?.push(rowIndex);
            selectedRowsRef?.current?.push(selectedRow);
            const rowObj: IRow<ColumnProps<T>> = getRowObj(selectedRow);
            if (!rowObj || !Object.keys(rowObj).length) { return; }
            rowObj.isSelected = true;
            rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: true}));
            if (gridRef.current?.selectionSettings?.persistSelection) {
                updatePersistCollection(rowObj.data as T, true);
            }
            updateHeaderSelectionState();

            // Dispatch custom event for toolbar refresh
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            if (gridElement) {
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement.dispatchEvent(selectionEvent);
            }
        }, [gridRef, getRowObj, updatePersistCollection, updateHeaderSelectionState]);

    /**
     * Deselects the currently selected rows.
     *
     * @returns {void}
     */
    const clearSelection: () => void = useCallback((): void => {
        if (isRowSelected?.current && gridRef?.current) {
            const rows: Element[] = Array.from(gridRef?.current?.getRows?.() || []);
            const data: T[] = [];
            const row: Element[] = [];
            const rowIndexes: number[] = [];
            for (let i: number = 0, len: number = selectedRowIndexes?.current.length; i < len; i++) {
                const currentRow: Element = rows[selectedRowIndexes?.current[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = getRowObj(currentRow) as IRow<ColumnProps<T>>;
                if (Object.keys(rowObj).length) {
                    data.push(rowObj.data);
                    row.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(i.toString(), 10)]);
                    rowObj.isSelected = false;
                    rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: false}));
                    if (gridRef.current?.selectionSettings?.persistSelection) {
                        updatePersistCollection(rowObj.data as T, false);
                    }
                }
            }
            const args: RowSelectingEvent<T> = {
                data: data,
                selectedRowIndexes: rowIndexes,
                isCtrlPressed: isMultiCtrlRequest?.current,
                isShiftPressed: isMultiShiftRequest?.current,
                row: row,
                event: activeEvent?.current,
                cancel: false
            };
            // Trigger the onRowDeselecting event
            if (gridRef?.current?.onRowDeselecting) {
                gridRef?.current?.onRowDeselecting(args);
                if (args.cancel) { return; } // If canceled, don't proceed with deselection
            }
            selectedRowIndexes.current = [];
            selectedRowsRef.current = [];
            isRowSelected.current = false;

            // Clear all persistent selection states
            isRemoteHeaderSelection.current = false;
            unselectedRowState.current.clear();
            selectedRowState.current.clear();
            persistSelectedData.current.clear();

            triggerRowSelect(false, undefined, rowIndexes);

            // Dispatch custom event for toolbar refresh after deselection
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            if (gridElement) {
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: [] }
                });
                gridElement.dispatchEvent(selectionEvent);
            }
            updateHeaderSelectionState();
        }
    }, [gridRef, getRowObj, updatePersistCollection, triggerRowSelect, updateHeaderSelectionState]);

    /**
     * Deselects specific rows by their indexes.
     *
     * @param {number[]} indexes - Array of row indexes to deselect
     *
     * @returns {void}
     */
    const clearRowSelection: (indexes?: number[]) => void = useCallback((indexes?: number[]): void => {
        if (isRowSelected?.current && gridRef?.current) {
            const data: T[] = [];
            const deSelectedRows: HTMLTableRowElement[] = [];
            const rowIndexes: number[] = [];
            const rows: HTMLTableRowElement[] = Array.from(gridRef?.current?.getRows?.() || []);
            const deSelectIndex: number[] = indexes ? indexes : selectedRowIndexes?.current;
            for (const rowIndex of deSelectIndex) {
                if (rowIndex < 0) {
                    continue;
                }
                const selectedIndex: number = selectedRowIndexes?.current.indexOf(rowIndex);
                if (selectedIndex < 0) {
                    continue;
                }
                const currentRow: HTMLTableRowElement = rows[parseInt(rowIndex.toString(), 10)] as HTMLTableRowElement;
                const rowObj: IRow<ColumnProps<T>> = getRowObj(currentRow) as IRow<ColumnProps<T>>;

                if (Object.keys(rowObj).length) {
                    data.push(rowObj.data);
                    deSelectedRows.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(selectedIndex.toString(), 10)]);
                    rowObj.isSelected = false;
                    rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: false}));
                    if (gridRef.current?.selectionSettings?.persistSelection) {
                        updatePersistCollection(rowObj.data as T, false);
                    }
                    updateHeaderSelectionState();
                }
            }
            if (rowIndexes.length) {
                const args: RowSelectingEvent<T> = {
                    data: data,
                    selectedRowIndexes: rowIndexes,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    row: deSelectedRows,
                    event: activeEvent?.current,
                    cancel: false
                };
                if (gridRef?.current?.onRowDeselecting) {
                    gridRef?.current?.onRowDeselecting(args);
                    if (args.cancel) { return; }
                }
                const setIndexes: Set<number> = new Set(rowIndexes);
                const setRows: Set<HTMLTableRowElement> = new Set(deSelectedRows);
                selectedRowIndexes.current = indexes ? selectedRowIndexes.current.filter((rowIndex: number) =>
                    !setIndexes.has(rowIndex)) : [];
                selectedRowsRef.current = indexes ?
                    selectedRowsRef.current.filter((record: HTMLTableRowElement) => !setRows.has(record)) : [];
                isRowSelected.current = selectedRowIndexes.current.length > 0;
                triggerRowSelect(false, undefined, rowIndexes);
                const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
                if (gridElement) {
                    const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                        detail: { selectedRowIndexes: selectedRowIndexes?.current }
                    });
                    gridElement.dispatchEvent(selectionEvent);
                }
            }
        }
    }, [gridRef, getRowObj, triggerRowSelect, updateHeaderSelectionState]);

    /**
     * Gets the index of the selected row
     */
    const getSelectedRowIndexes: () => number[] = useCallback((): number[] => {
        return selectedRowIndexes?.current;
    }, [selectedRowIndexes?.current]);

    /**
     * Gets the selected row data
     */
    const getSelectedRecords: () => T[] | null = useCallback((): T[] | null => {
        if (gridRef?.current?.selectionSettings?.persistSelection) {
            return Array.from(persistSelectedData.current.values());
        }
        // Fallback to current page selected rows
        let selectedData: T[] = [];
        if (selectedRowsRef?.current?.length && gridRef?.current) {
            const rowsObj: IRow<ColumnProps<T>>[] = gridRef?.current?.getRowsObject?.();
            selectedData = rowsObj.filter((row: IRow<ColumnProps<T>>) => row?.isSelected)
                .map((m: IRow<ColumnProps<T>>) => m.data);
        }
        return selectedData;
    }, [gridRef]);

    /**
     * Gets a collection of indexes between start and end
     *
     * @param {number} startIndex - The starting index
     * @param {number} [endIndex] - The ending index (optional)
     * @returns {number[]} Array of indexes
     */
    const getCollectionFromIndexes: (startIndex: number, endIndex?: number) => number[] =
        useCallback((startIndex: number, endIndex?: number): number[] => {
            const indexes: number[] = [];
            // eslint-disable-next-line prefer-const
            let { i, max }: { i: number, max: number } = (startIndex <= endIndex) ?
                { i: startIndex, max: endIndex } : { i: endIndex, max: startIndex };
            for (; i <= max; i++) {
                indexes.push(i);
            }
            if (startIndex > endIndex) {
                indexes.reverse();
            }
            return indexes;
        }, []);

    const selectedDataUpdate: (selectedData?: Object[], selectedRows?: HTMLTableRowElement[], rowIndexes?: number[]) => void =
        useCallback((selectedData?: Object[], selectedRows?: HTMLTableRowElement[], rowIndexes?: number[]): void => {
            if (!gridRef?.current || !rowIndexes?.length) { return; }
            for (let i: number = 0, len: number = rowIndexes.length; i < len; i++) {
                const currentRow: HTMLTableRowElement = gridRef?.current.getRows()[rowIndexes[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = getRowObj(currentRow) as IRow<ColumnProps<T>>;
                if (rowObj && rowObj.isDataRow) {
                    selectedData.push(rowObj.data);
                    selectedRows.push(currentRow);
                }
            }
        }, [gridRef, getRowObj]);

    const updateRowProps: (startIndex: number) => void = useCallback((startIndex: number): void => {
        prevRowIndex.current = startIndex;
        isRowSelected.current = !!selectedRowIndexes?.current.length;
    }, [selectedRowIndexes?.current]);

    /**
     * Selects a collection of rows by index.
     *
     * @param  {number[]} rowIndexes - Specifies an array of row indexes.
     * @returns {void}
     */
    const selectRows: (rowIndexes: number[]) => void = useCallback((rowIndexes: number[]): void => {
        const selectableRowIndex: number[] = [...rowIndexes];
        const rowIndex: number = gridRef?.current.selectionSettings.mode !== 'Single' ? rowIndexes[0] : rowIndexes[rowIndexes.length - 1];
        if (selectedRowIndexes.current?.length === rowIndexes.length && selectedRowIndexes.current?.toString() === rowIndexes.toString()) {
            return;
        }
        const selectedRows: HTMLTableRowElement[] = [];
        const selectedData: T[] = [];
        selectedDataUpdate(selectedData, selectedRows, rowIndexes);
        const selectingArgs: RowSelectingEvent<T> = {
            cancel: false,
            selectedRowIndexes: selectableRowIndex, row: selectedRows, selectedRowIndex: rowIndex,
            event: activeEvent?.current,
            isCtrlPressed: isMultiCtrlRequest?.current,
            isShiftPressed: isMultiShiftRequest?.current, data: selectedData
        };
        if (gridRef?.current.onRowSelecting) {
            gridRef?.current.onRowSelecting(selectingArgs);
            if (selectingArgs.cancel) { return; } // If canceled, don't proceed with deselection
        }
        const clearSelectedRowIndexes: number[] = selectedRowIndexes.current
            .filter((index: number) => !rowIndexes.includes(index));
        if (clearSelectedRowIndexes.length) {
            clearRowSelection(clearSelectedRowIndexes);
        }
        const shiftSelectableRowIndex: number[] = [];
        if (gridRef?.current.selectionSettings.mode !== 'Single') {
            for (const rowIdx of selectableRowIndex) {
                if (!selectedRowIndexes.current.includes(rowIdx)) {
                    shiftSelectableRowIndex.push(rowIdx);
                    updateRowSelection(gridRef?.current.getRowByIndex(rowIdx), rowIdx);
                }
                updateRowProps(rowIndex);
            }
        }
        else {
            updateRowSelection(gridRef?.current.getRowByIndex(rowIndex), rowIndex);
            updateRowProps(rowIndex);
        }
        if (!shiftSelectableRowIndex.length) {
            return;
        }
        triggerRowSelect(true, shiftSelectableRowIndex);

        // Dispatch custom event for toolbar refresh after multiple row selection
        const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
        if (gridElement) {
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: selectedRowIndexes?.current }
            });
            gridElement.dispatchEvent(selectionEvent);
        }
    }, [gridRef, selectedDataUpdate, clearRowSelection, updateRowSelection, updateRowProps, triggerRowSelect]);


    /**
     * Selects a range of rows from start and end row indexes.
     *
     * @param  {number} startIndex - Specifies the start row index.
     * @param  {number} endIndex - Specifies the end row index.
     * @returns {void}
     */
    const selectRowByRange: (startIndex: number, endIndex?: number) => void = useCallback((startIndex: number, endIndex?: number): void => {
        const indexes: number[] = getCollectionFromIndexes(startIndex, endIndex);
        selectRows(indexes);
    }, [getCollectionFromIndexes, selectRows]);

    /**
     * Adds multiple rows to the current selection
     *
     * @param {number[]} rowIndexes - Array of row indexes to select
     * @returns {void}
     */
    const addRowsToSelection: (rowIndexes: number[]) => void = useCallback((rowIndexes: number[]): void => {
        if (!gridRef?.current || !rowIndexes?.length) { return; }
        const indexes: number[] = getSelectedRowIndexes().concat(rowIndexes);
        const selectedRow: HTMLTableRowElement = gridRef?.current?.selectionSettings?.mode !== 'Single' ?
            gridRef?.current?.getRowByIndex?.(rowIndexes[0]) :
            gridRef?.current?.getRowByIndex?.(rowIndexes[rowIndexes.length - 1]);
        if (!selectedRow) { return; }
        const selectedRows: HTMLTableRowElement[] = [];
        const selectedData: T[] = [];
        if (isMultiCtrlRequest?.current) {
            selectedDataUpdate(selectedData, selectedRows, rowIndexes);
        }
        // Process each row index for multi-selection
        for (const rowIndex of rowIndexes) {
            const rowObj: IRow<ColumnProps<T>> = getRowObj(rowIndex) as IRow<ColumnProps<T>>;
            let isUnSelected: boolean;
            if (gridRef.current?.selectionSettings?.persistSelection) {
                const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
                isUnSelected = selectedRowState.current.has(rowObj.data?.[primaryKeys[0]]);
            } else {
                isUnSelected = !!(getRowObj(rowIndex)?.isSelected);
            }
            if (isUnSelected && (gridRef.current?.selectionSettings?.enableToggle || isMultiCtrlRequest?.current)) {
                const rowDeselectingArgs: RowSelectingEvent<T> = {
                    data: rowObj.data,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    selectedRowIndex: rowIndex,
                    row: selectedRow,
                    event: activeEvent?.current,
                    cancel: false
                };
                // Trigger the onRowDeselecting event
                if (gridRef?.current.onRowDeselecting) {
                    gridRef?.current.onRowDeselecting(rowDeselectingArgs);
                    if (rowDeselectingArgs.cancel) { return; }
                }
                // Remove selection from current page refs
                const idxInPage: number = selectedRowIndexes?.current.indexOf(rowIndex);
                if (idxInPage > -1) { selectedRowIndexes?.current.splice(idxInPage, 1); }
                const idxRowEl: number = selectedRowsRef?.current.indexOf(selectedRow);
                if (idxRowEl > -1) { selectedRowsRef?.current.splice(idxRowEl, 1); }
                rowObj.isSelected = false;
                rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: false}));
                if (gridRef.current?.selectionSettings?.persistSelection) {
                    updatePersistCollection(rowObj.data as T, false);
                }
                updateHeaderSelectionState();
                // Trigger the onRowDeselect event
                triggerRowSelect(false, undefined, [rowIndex]);
            } else if (!isUnSelected) {
                // Create arguments for the selecting event
                const rowSelectArgs: RowSelectingEvent<T> = {
                    data: selectedData.length ? selectedData : rowObj.data,
                    selectedRowIndex: rowIndex,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    row: selectedRows.length ? selectedRows : selectedRow,
                    event: activeEvent?.current,
                    selectedRowIndexes: indexes,
                    cancel: false
                };
                // Trigger the onRowSelecting event
                if (gridRef?.current.onRowSelecting) {
                    gridRef?.current.onRowSelecting(rowSelectArgs);
                    if (rowSelectArgs.cancel) { return; }
                }
                if (gridRef?.current.selectionSettings.mode === 'Single') {
                    clearSelection();
                }
                updateRowSelection(selectedRow, rowIndex);
                // Trigger the onRowSelect event
                triggerRowSelect(true);
                updateRowProps(rowIndex);
            }
        }
    }, [gridRef, getSelectedRowIndexes, getRowObj, selectedDataUpdate, clearSelection,
        updateRowSelection, updatePersistCollection, triggerRowSelect, updateRowProps, updateHeaderSelectionState]);

    /**
     * Selects a row by the given index.
     *
     * @param  {number} rowIndex - Defines the row index.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @returns {void}
     */
    const selectRow: (rowIndex: number, isToggle?: boolean) => void = useCallback((rowIndex: number, isToggle?: boolean): void => {
        if (!gridRef?.current || rowIndex < 0 || !gridRef?.current?.selectionSettings?.enabled) { return; }
        const selectedRow: HTMLTableRowElement = gridRef?.current?.getRowByIndex?.(rowIndex);
        const data: Object = gridRef?.current?.currentViewData?.[parseInt(rowIndex.toString(), 10)];
        const selectData: T = (getRowObj(rowIndex) as IRow<ColumnProps<T>>)?.data;
        if (gridRef?.current?.selectionSettings?.type !== 'Row' || !selectedRow || !data) {
            return;
        }
        if ((!isToggle && gridRef?.current?.selectionSettings?.enableToggle) || !selectedRowIndexes?.current.length) {
            isToggle = false;
        }
        else {
            if (gridRef?.current?.selectionSettings?.mode === 'Single' || (selectedRowIndexes?.current.length === 1 && gridRef?.current?.selectionSettings?.mode === 'Multiple')) {
                selectedRowIndexes?.current.forEach((index: number) => {
                    isToggle = index === rowIndex ? true : false;
                });
                if (!gridRef?.current?.selectionSettings?.enableToggle && !isMultiCtrlRequest.current && isToggle) {
                    return;
                }
            } else {
                isToggle = false;
            }
        }
        if (!isToggle) {
            if (selectedRowIndexes.current.indexOf(rowIndex) === -1) {
                const args: RowSelectingEvent<T> = {
                    data: selectData,
                    selectedRowIndex: rowIndex,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    row: selectedRow,
                    event: activeEvent?.current,
                    cancel: false
                };
                if (gridRef?.current.onRowSelecting) {
                    gridRef?.current.onRowSelecting(args);
                    if (args.cancel) { return; }
                }
                if (selectedRowIndexes?.current.length  && !gridRef?.current?.selectionSettings?.checkboxOnly && (gridRef?.current?.selectionSettings?.mode === 'Single' || !isMultiCtrlRequest.current)) {
                    clearSelection();
                }
                updateRowSelection(selectedRow, rowIndex);
                triggerRowSelect(true);

                // Dispatch custom event for toolbar refresh after single row selection
                const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
                if (gridElement) {
                    const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                        detail: { selectedRowIndexes: selectedRowIndexes?.current }
                    });
                    gridElement.dispatchEvent(selectionEvent);
                }
            } else {
                const clearSelectedRowIndexes: number[] = selectedRowIndexes.current
                    .filter((index: number) => rowIndex !== index);
                if (clearSelectedRowIndexes.length) {
                    clearRowSelection(clearSelectedRowIndexes);
                }
            }
        } else {
            const isRowSelected: boolean = selectedRow.getAttribute('aria-selected') === 'true';
            if (isRowSelected) {
                clearSelection();
            } else {
                updateRowSelection(selectedRow, rowIndex);
            }
        }
        updateRowProps(rowIndex);
    }, [gridRef, getRowObj, clearSelection, clearRowSelection, updateRowSelection,
        triggerRowSelect, updateRowProps]);

    const rowCellSelectionHandler: (rowIndex: number) => void = useCallback((rowIndex: number): void => {
        if (!gridRef?.current) { return; }
        if ((!isMultiCtrlRequest?.current && !isMultiShiftRequest?.current && !isCheckBoxColumn) ||
            gridRef?.current?.selectionSettings?.mode === 'Single') {
            selectRow(rowIndex, gridRef?.current?.selectionSettings?.enableToggle || isMultiCtrlRequest.current);
        } else if (isMultiShiftRequest?.current) {
            if (!closest((activeEvent.current?.target as Element), '.sf-grid-content-row .sf-cell').classList.contains('sf-chkbox')) {
                selectRowByRange(isNullOrUndefined(prevRowIndex?.current) ? rowIndex : prevRowIndex?.current, rowIndex);
            } else {
                addRowsToSelection([rowIndex]);
            }
        } else {
            addRowsToSelection([rowIndex]);
        }
    }, [gridRef, selectRow, addRowsToSelection, selectRowByRange]);

    /**
     * Handle grid-level click event
     *
     * @returns {void}
     */
    const handleGridClick: (event: React.MouseEvent) => void = useCallback((event: React.MouseEvent): void => {
        if (!gridRef?.current) { return; }
        activeEvent.current = event;
        isMultiShiftRequest.current = event.shiftKey;
        isMultiCtrlRequest.current = event.ctrlKey;
        const target: Element = !(activeEvent.current?.target as Element)?.classList?.contains('sf-cell') ?
            (activeEvent.current?.target as Element)?.closest('.sf-grid-content-row .sf-cell') : (activeEvent.current?.target as Element);
        if (gridRef?.current?.selectionSettings?.enabled && target && target.parentElement?.classList?.contains('sf-grid-content-row')) {
            const rowIndex: number = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10) - 1;
            rowCellSelectionHandler(rowIndex);
        }
        isMultiCtrlRequest.current = false;
        isMultiShiftRequest.current = false;
        activeEvent.current = null;
    }, [gridRef, rowCellSelectionHandler]);

    const shiftDownUpKey: (rowIndex?: number) => void = (rowIndex?: number): void => {
        // Prevent unwanted multi-selection in Single mode
        if (gridRef?.current?.selectionSettings?.mode === SelectionMode.Single) {
            selectRow(rowIndex);
        } else {
            selectRowByRange(prevRowIndex.current, rowIndex);
        }
    };

    const ctrlPlusA: () => void = (): void => {
        if (gridRef?.current?.selectionSettings?.mode === 'Multiple' && gridRef?.current.selectionSettings.type === 'Row') {
            const rowObj: IRow<ColumnProps<T>>[] = gridRef?.current?.getRowsObject();
            selectRowByRange(rowObj[0].index, rowObj[rowObj.length - 1].index);
        }
    };

    const onCellFocus: (e: CellFocusEvent) => void = (e: CellFocusEvent): void => {
        activeEvent.current = e.event;
        const isHeader: boolean = (e.container as {isHeader?: boolean}).isHeader;
        const isHeaderCheckBox: boolean = e.element.querySelector('.sf-grid-checkselectall') !== null &&
            gridRef?.current?.selectionSettings.mode === SelectionMode.Multiple;
        const headerAction: boolean = isHeader && e.byKey && !isHeaderCheckBox;
        if (!e.byKey || !gridRef?.current?.selectionSettings.enabled) {
            return;
        }
        isMultiShiftRequest.current = e.byKey && e.event.shiftKey;
        isMultiCtrlRequest.current = e.byKey && e.event.ctrlKey;
        const action: string = gridRef.current.focusModule.getNavigationDirection(e.keyArgs as KeyboardEvent);
        if (headerAction || ((action === 'shiftEnter' || action === 'enter') && e.rowIndex === prevRowIndex.current)) {
            return;
        }
        switch (action) {
        case 'space':
            if (gridRef?.current?.selectionSettings.mode === 'Multiple' && isMultiShiftRequest.current) {
                selectRowByRange(isNullOrUndefined(prevRowIndex?.current) ? e.rowIndex : prevRowIndex?.current, e.rowIndex);
            } else if (gridRef?.current?.selectionSettings.mode === 'Multiple'
                && isMultiCtrlRequest?.current
                && selectedRowIndexes.current.indexOf(e.rowIndex) > -1) {
                clearRowSelection([e.rowIndex]);
            } else if (isHeaderCheckBox) {
                headerCheckBoxOnChange();
            } else if (gridRef?.current?.selectionSettings.persistSelection) {
                addRowsToSelection([e.rowIndex]);
            } else {
                selectRow(e.rowIndex, true);
            }
            break;
        case 'shiftDown':
        case 'shiftUp':
            shiftDownUpKey(e.rowIndex);
            break;
        case 'escape':
            clearSelection();
            break;
        case 'ctrlPlusA':
            ctrlPlusA();
            break;
        }
        isMultiCtrlRequest.current = false;
        isMultiShiftRequest.current = false;
        activeEvent.current = null;
    };

    // Extracted helper to decide header checkbox select-all action
    const shouldHeaderSelectAll: (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent, isRemoteData?: boolean) => boolean =
        useCallback((row?: IRow<ColumnProps>, event?: CheckboxChangeEvent, isRemoteData?: boolean): boolean => {
            const selectedRecordsCount: number = getSelectedRecords().length;
            const isPersistSelection: boolean = gridRef.current?.selectionSettings.persistSelection;
            const isLocalData: () => boolean = () => {
                if (event?.value) {
                    return event.value;
                } else {
                    return isPersistSelection ? !(selectedRecordsCount === totalRecordsCount) :
                        !(selectedRecordsCount === currentViewData.length);
                }
            };
            const isRemoteDataFn: () => boolean = () => {
                if (!!event && !event?.value) {
                    return event?.value;
                } else {
                    return !(selectedRowIndexes.current?.length === currentViewData.length);
                }
            };
            return (
                (!row?.isSelected && !row?.isIntermediateState && !!event) || (isRemoteData ? isRemoteDataFn() : isLocalData())
            );
        }, [gridRef?.current, totalRecordsCount, currentViewData, selectedRowIndexes]);

    const headerCheckBoxOnChange: (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent) => void =
        useCallback(async (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent) => {
            if (totalRecordsCount <= 0 && currentViewData?.length <= 0 && !gridRef.current) { return; }
            const isRemoteData: boolean = (gridRef?.current?.getDataModule() as UseDataResult)?.isRemote();

            const selectCurrentPage: () => void = () => {
                if (gridRef.current?.selectionSettings.mode === SelectionMode.Multiple) {
                    selectRowByRange?.(0, currentViewData?.length - 1);
                }
            };

            if (shouldHeaderSelectAll(row, event, isRemoteData)) {
                if (!isRemoteData) {
                    // Local data: persist selection for ALL local records using getData(skipPage=true)
                    const allLocal: T[] = (await (gridRef.current?.getData?.(true) as unknown as Promise<T[]>)) ?? [];
                    if (gridRef.current?.selectionSettings.persistSelection) {
                        for (const item of allLocal) {
                            updatePersistCollection(item as T, true);
                        }
                    }
                    // Visually select current page
                    selectCurrentPage();
                } else {
                    unselectedRowState.current.clear();
                    // Select current page visually; persistence will be ensured on page changes
                    selectCurrentPage();
                    // Remote data: activate global header select-all and clear manual unselections
                    if (gridRef.current?.selectionSettings.persistSelection) {
                        isRemoteHeaderSelection.current = true;
                    }
                }
            } else {
                isRemoteHeaderSelection.current = false;
                unselectedRowState.current.clear();
                selectedRowState.current.clear();
                persistSelectedData.current.clear();
                clearSelection?.();
            }
        }, [currentViewData, totalRecordsCount, gridRef.current]);

    return {
        clearSelection,
        clearRowSelection,
        selectRow,
        getSelectedRowIndexes,
        getSelectedRecords,
        handleGridClick,
        selectRows,
        selectRowByRange,
        addRowsToSelection,
        onCellFocus,
        updatePersistCollection,
        getRowObj,
        updateHeaderSelectionState,
        headerCheckBoxOnChange,
        get selectedRowIndexes(): number[] { return selectedRowIndexes.current; },
        get selectedRows(): HTMLTableRowElement[] { return selectedRowsRef.current; },
        get activeTarget(): Element | null { return (activeEvent.current?.target as Element); },
        // Expose persistent selection for external usage if needed
        get selectedRowState(): Set<string> { return selectedRowState.current; },
        get persistSelectedData(): Map<string, T> { return persistSelectedData.current; },
        // Remote select-all helpers
        get isRemoteHeaderSelection(): boolean { return isRemoteHeaderSelection.current; },
        clearAllPersistedSelection: () => { selectedRowState.current.clear(); persistSelectedData.current.clear(); },
        get unselectedRowState(): Set<string> { return unselectedRowState.current; }
    };
};
