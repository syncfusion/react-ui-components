
import { RefObject, useCallback, useRef, KeyboardEvent, MouseEvent } from 'react';
import { IRow } from '../types';
import { RowSelectEvent, RowSelectingEvent, SelectionModel } from '../types/selection.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { closest, isNullOrUndefined } from '@syncfusion/react-base';
import { CellFocusEvent } from '../types/focus.interfaces';
import { GridRef } from '../types/grid.interfaces';

/**
 * Custom hook to manage selection state and API
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component
 * @returns {SelectionModel} An object containing selection-related state and API
 */
export const useSelection: <T>(gridRef?: RefObject<GridRef<T>>) => SelectionModel<T> =
<T>(gridRef?: RefObject<GridRef<T>>): SelectionModel<T> => {
    const selectedRowIndexes: RefObject<number[]> = useRef<number[]>([]);
    const selectedRowsRef: RefObject<HTMLTableRowElement[]> = useRef<HTMLTableRowElement[]>([]);
    const prevRowIndex: RefObject<number | null> = useRef(null);
    const activeEvent: RefObject<MouseEvent | React.KeyboardEvent> = useRef(null);
    const isMultiShiftRequest: RefObject<boolean> = useRef(false);
    const isMultiCtrlRequest: RefObject<boolean> = useRef(false);
    const isRowSelected: RefObject<boolean> = useRef(false);

    /**
     * Adds or removes selection classes from row cells
     */
    const addRemoveSelectionClasses: (row: Element, isAdd: boolean) => void = useCallback((row: Element, isAdd: boolean): void => {
        const cells: Element[] = Array.from(row.getElementsByClassName('sf-cell'));
        for (let i: number = 0; i < cells.length; i++) {
            if (isAdd) {
                cells[parseInt(i.toString(), 10)].classList.add('sf-active');
                cells[parseInt(i.toString(), 10)].setAttribute('aria-selected', 'true');
            } else {
                cells[parseInt(i.toString(), 10)].classList.remove('sf-active');
                cells[parseInt(i.toString(), 10)].removeAttribute('aria-selected');
            }
        }
    }, []);

    const getRowObj: (row: Element | number) => IRow<ColumnProps<T>> = useCallback((row: Element | number): IRow<ColumnProps<T>> => {
        if (isNullOrUndefined(row)) { return {} as IRow<ColumnProps<T>>; }
        if (typeof row === 'number') {
            row = gridRef?.current?.getRowByIndex(row);
        }
        if (row) {
            return gridRef?.current.getRowObjectFromUID(row.getAttribute('data-uid')) || {} as IRow<ColumnProps<T>>;
        }
        return {} as IRow<ColumnProps<T>>;
    }, []);

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
            selectedRowIndexes?.current.push(rowIndex);
            selectedRowsRef?.current.push(selectedRow);
            const rowObj: IRow<ColumnProps<T>> = getRowObj(selectedRow);
            rowObj.isSelected = true;
            selectedRow.setAttribute('aria-selected', 'true');
            addRemoveSelectionClasses(selectedRow, true);

            // Dispatch custom event for toolbar refresh
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: selectedRowIndexes?.current }
            });
            gridElement?.dispatchEvent?.(selectionEvent);
        }, [gridRef, selectedRowIndexes?.current, addRemoveSelectionClasses]);

    /**
     * Deselects the currently selected rows.
     *
     * @returns {void}
     */
    const clearSelection: () => void = useCallback((): void => {
        if (isRowSelected?.current) {
            const rows: Element[] = Array.from(gridRef?.current.getRows() || []);
            const data: T[] = [];
            const row: Element[] = [];
            const rowIndexes: number[] = [];
            for (let i: number = 0, len: number = selectedRowIndexes?.current.length; i < len; i++) {
                const currentRow: Element = rows[selectedRowIndexes?.current[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = getRowObj(currentRow) as IRow<ColumnProps<T>>;
                if (rowObj) {
                    data.push(rowObj.data);
                    row.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(i.toString(), 10)]);
                    rowObj.isSelected = false;
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
            const element: HTMLElement[] = [].slice.call((rows as Element[]).filter((record: HTMLElement) => record.hasAttribute('aria-selected')));
            for (let j: number = 0; j < element.length; j++) {
                element[parseInt(j.toString(), 10)].removeAttribute('aria-selected');
                addRemoveSelectionClasses(element[parseInt(j.toString(), 10)], false);
            }
            selectedRowIndexes.current = [];
            selectedRowsRef.current = [];
            isRowSelected.current = false;
            triggerRowSelect(false, undefined, rowIndexes);

            // Dispatch custom event for toolbar refresh after deselection
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: [] }
            });
            gridElement?.dispatchEvent?.(selectionEvent);
        }
    }, [gridRef?.current, isRowSelected?.current, addRemoveSelectionClasses]);

    /**
     * Deselects specific rows by their indexes.
     *
     * @param {number[]} indexes - Array of row indexes to deselect
     *
     * @returns {void}
     */
    const clearRowSelection: (indexes?: number[]) => void = useCallback((indexes?: number[]): void => {
        if (isRowSelected?.current) {
            const data: T[] = [];
            const deSelectedRows: HTMLTableRowElement[] = [];
            const rowIndexes: number[] = [];
            const rows: HTMLTableRowElement[] = Array.from(gridRef?.current.getRows() || []);
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

                if (rowObj) {
                    data.push(rowObj.data);
                    deSelectedRows.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(selectedIndex.toString(), 10)]);
                    rowObj.isSelected = false;
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
                const tdElement: HTMLElement[] = [].slice.call((deSelectedRows as Element[]).filter((record: HTMLElement) => record.hasAttribute('aria-selected')));
                for (let j: number = 0; j < tdElement.length; j++) {
                    tdElement[parseInt(j.toString(), 10)].removeAttribute('aria-selected');
                    addRemoveSelectionClasses(tdElement[parseInt(j.toString(), 10)], false);
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
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement?.dispatchEvent?.(selectionEvent);
            }
        }
    }, [gridRef?.current, isRowSelected?.current, selectedRowIndexes?.current, selectedRowsRef?.current,
        addRemoveSelectionClasses, getRowObj]);

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
        let selectedData: T[] = [];
        if (selectedRowsRef?.current.length) {
            selectedData = (<IRow<ColumnProps<T>>[]>gridRef?.current.getRowsObject()).filter((row: IRow<ColumnProps<T>>) => row.isSelected)
                .map((m: IRow<ColumnProps<T>>) => m.data);
        }
        return selectedData;
    }, [selectedRowsRef?.current]);

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
            for (let i: number = 0, len: number = rowIndexes.length; i < len; i++) {
                const currentRow: HTMLTableRowElement = gridRef?.current.getRows()[rowIndexes[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = getRowObj(currentRow) as IRow<ColumnProps<T>>;
                if (rowObj && rowObj.isDataRow) {
                    selectedData.push(rowObj.data);
                    selectedRows.push(currentRow);
                }
            }
        }, []);

    const updateRowProps: (startIndex: number) => void = useCallback((startIndex: number): void => {
        prevRowIndex.current = startIndex;
        isRowSelected.current = selectedRowIndexes?.current.length && true;
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
        const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
            detail: { selectedRowIndexes: selectedRowIndexes?.current }
        });
        gridElement?.dispatchEvent?.(selectionEvent);
    }, [gridRef, selectedRowIndexes?.current, selectedRowsRef?.current]);


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
        const indexes: number[] = getSelectedRowIndexes().concat(rowIndexes);
        const selectedRow: HTMLTableRowElement = gridRef?.current.selectionSettings.mode !== 'Single' ? gridRef?.current.getRowByIndex(rowIndexes[0]) :
            gridRef?.current.getRowByIndex(rowIndexes[rowIndexes.length - 1]);
        const selectedRows: HTMLTableRowElement[] = [];
        const selectedData: T[] = [];
        if (isMultiCtrlRequest?.current) {
            selectedDataUpdate(selectedData, selectedRows, rowIndexes);
        }
        // Process each row index for multi-selection
        for (const rowIndex of rowIndexes) {
            const rowObj: IRow<ColumnProps<T>> = getRowObj(rowIndex) as IRow<ColumnProps<T>>;
            const isUnSelected: boolean = selectedRowIndexes?.current.indexOf(rowIndex) > -1;
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
                // Remove selection
                selectedRowIndexes?.current.splice(selectedRowIndexes?.current.indexOf(rowIndex), 1);
                selectedRowsRef?.current.splice(selectedRowsRef?.current.indexOf(selectedRow), 1);
                selectedRow.removeAttribute('aria-selected');
                addRemoveSelectionClasses(selectedRow, false);
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
    }, [gridRef?.current, selectedRowIndexes?.current, selectedRowsRef?.current, prevRowIndex?.current,
        updateRowSelection, addRemoveSelectionClasses]);

    /**
     * Selects a row by the given index.
     *
     * @param  {number} rowIndex - Defines the row index.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @returns {void}
     */
    const selectRow: (rowIndex: number, isToggle?: boolean) => void = useCallback((rowIndex: number, isToggle?: boolean): void => {
        if (!gridRef?.current || rowIndex < 0 || !gridRef?.current?.selectionSettings.enabled) { return; }
        const selectedRow: HTMLTableRowElement = gridRef?.current.getRowByIndex(rowIndex);
        const data: Object = gridRef?.current.currentViewData?.[parseInt(rowIndex.toString(), 10)];
        const selectData: T = (getRowObj(rowIndex) as IRow<ColumnProps<T>>).data;
        if (gridRef?.current.selectionSettings.type !== 'Row' || !selectedRow || !data) {
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
                if (selectedRowIndexes?.current.length && (gridRef?.current?.selectionSettings?.mode === 'Single' || !isMultiCtrlRequest.current)) {
                    clearSelection();
                }
                updateRowSelection(selectedRow, rowIndex);
                triggerRowSelect(true);

                // Dispatch custom event for toolbar refresh after single row selection
                const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement?.dispatchEvent?.(selectionEvent);
            } else {
                const clearSelectedRowIndexes: number[] = selectedRowIndexes.current
                    .filter((index: number) => rowIndex !== index);
                if (clearSelectedRowIndexes.length) {
                    clearRowSelection(clearSelectedRowIndexes);
                }
            }
        } else {
            const isRowSelected: boolean = selectedRow.hasAttribute('aria-selected');
            if (isRowSelected) {
                clearSelection();
            } else {
                updateRowSelection(selectedRow, rowIndex);
            }
        }
        updateRowProps(rowIndex);
    }, [gridRef, updateRowSelection, addRemoveSelectionClasses, updateRowProps, selectedRowIndexes?.current]);

    const rowCellSelectionHandler: (rowIndex: number) => void = useCallback((rowIndex: number): void => {
        if ((!isMultiCtrlRequest?.current && !isMultiShiftRequest?.current) || gridRef?.current.selectionSettings.mode === 'Single') {
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
        activeEvent.current = event;
        isMultiShiftRequest.current = event.shiftKey;
        isMultiCtrlRequest.current = event.ctrlKey;
        const target: Element = !(activeEvent.current?.target as Element)?.classList.contains('sf-cell') ?
            (activeEvent.current?.target as Element)?.closest('.sf-grid-content-row .sf-cell') : (activeEvent.current?.target as Element);
        if (gridRef?.current?.selectionSettings.enabled && target && target.parentElement.classList.contains('sf-grid-content-row')) {
            const rowIndex: number = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10) - 1;
            rowCellSelectionHandler(rowIndex);
        }
        isMultiCtrlRequest.current = false;
        isMultiShiftRequest.current = false;
        activeEvent.current = null;
    }, [gridRef]);

    const shiftDownUpKey: (rowIndex?: number) => void = (rowIndex?: number): void => {
        selectRowByRange(prevRowIndex.current, rowIndex);
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
        const headerAction: boolean = isHeader && e.byKey;
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
        addRemoveSelectionClasses,
        get selectedRowIndexes(): number[] { return selectedRowIndexes.current; },
        get selectedRows(): HTMLTableRowElement[] { return selectedRowsRef.current; },
        get activeTarget(): Element | null { return (activeEvent.current?.target as Element); }
    };
};
