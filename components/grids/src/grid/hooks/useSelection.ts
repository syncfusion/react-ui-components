
import { RefObject, useCallback, useRef, KeyboardEvent } from 'react';
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
export const useSelection: (gridRef?: RefObject<GridRef>) => SelectionModel = (gridRef?: RefObject<GridRef>): SelectionModel => {

    const selectedRowIndexes: RefObject<number[]> = useRef<number[]>([]);
    const selectedRecords: RefObject<Object[]> = useRef<Object[]>([]);
    const prevRowIndex: RefObject<number | null> = useRef(null);
    const activeTarget: RefObject<Element | null> = useRef(null);
    const isMultiShiftRequest: RefObject<boolean> = useRef(false);
    const isMultiCtrlRequest: RefObject<boolean> = useRef(false);
    const isRowSelected: RefObject<boolean> = useRef(false);

    /**
     * Adds or removes selection classes from row cells
     */
    const addRemoveSelectionClasses: (row: Element, isAdd: boolean) => void = useCallback((row: Element, isAdd: boolean): void => {
        const cells: Element[] = Array.from(row.getElementsByClassName('sf-rowcell'));
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

    const getRowObj: (row: Element | number) => IRow<ColumnProps> = useCallback((row: Element | number): IRow<ColumnProps> => {
        if (isNullOrUndefined(row)) { return {} as IRow<ColumnProps>; }
        if (typeof row === 'number') {
            row = gridRef?.current?.getRowByIndex(row);
        }
        if (row) {
            return gridRef?.current.getRowObjectFromUID(row.getAttribute('data-uid')) || {} as IRow<ColumnProps>;
        }
        return {} as IRow<ColumnProps>;
    }, []);

    /**
     * Updates row selection state
     */
    const updateRowSelection: (selectedRow: Element, rowIndex: number) => void =
        useCallback((selectedRow: Element, rowIndex: number): void => {
            selectedRowIndexes?.current.push(rowIndex);
            selectedRecords?.current.push(selectedRow);
            const rowObj: IRow<ColumnProps> = getRowObj(selectedRow);
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
            const data: Object[] = [];
            const row: Element[] = [];
            const rowIndexes: number[] = [];
            for (let i: number = 0, len: number = selectedRowIndexes?.current.length; i < len; i++) {
                const currentRow: Element = rows[selectedRowIndexes?.current[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps> = getRowObj(currentRow) as IRow<ColumnProps>;
                if (rowObj) {
                    data.push(rowObj.data);
                    row.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(i.toString(), 10)]);
                    rowObj.isSelected = false;
                }
            }
            const args: RowSelectingEvent = {
                data: data,
                rowIndexes: rowIndexes,
                isCtrlPressed: isMultiCtrlRequest?.current,
                isShiftPressed: isMultiShiftRequest?.current,
                row: row,
                target: activeTarget?.current,
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
            selectedRecords.current = [];
            isRowSelected.current = false;
            if (gridRef?.current?.onRowDeselect) {
                const deselectedArgs: RowSelectEvent = {
                    data: data,
                    rowIndexes: rowIndexes,
                    row: row,
                    target: activeTarget?.current
                };
                gridRef?.current?.onRowDeselect(deselectedArgs);
            }

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
            const data: Object[] = [];
            const deSelectedRows: Element[] = [];
            const rowIndexes: number[] = [];
            const rows: Element[] = Array.from(gridRef?.current.getRows() || []);
            const deSelectIndex: number[] = indexes ? indexes : selectedRowIndexes?.current;
            for (const rowIndex of deSelectIndex) {
                if (rowIndex < 0) {
                    continue;
                }
                const selectedIndex: number = selectedRowIndexes?.current.indexOf(rowIndex);
                if (selectedIndex < 0) {
                    continue;
                }
                const currentRow: Element = rows[parseInt(rowIndex.toString(), 10)] as Element;
                const rowObj: IRow<ColumnProps> = getRowObj(currentRow) as IRow<ColumnProps>;

                if (rowObj) {
                    data.push(rowObj.data);
                    deSelectedRows.push(currentRow);
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(selectedIndex.toString(), 10)]);
                    rowObj.isSelected = false;
                }
            }
            if (rowIndexes.length) {
                const args: RowSelectingEvent = {
                    data: data,
                    rowIndexes: rowIndexes,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    row: deSelectedRows,
                    target: activeTarget?.current,
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
                const setRows: Set<Element> = new Set(deSelectedRows);
                selectedRowIndexes.current = indexes ? selectedRowIndexes.current.filter((rowIndex: number) =>
                    !setIndexes.has(rowIndex)) : [];
                selectedRecords.current = indexes ? selectedRecords.current.filter((record: Element) => !setRows.has(record)) : [];
                isRowSelected.current = selectedRowIndexes.current.length > 0;
                if (gridRef?.current?.onRowDeselect) {
                    const deselectedArgs: RowSelectEvent = {
                        data: data,
                        rowIndexes: rowIndexes,
                        row: deSelectedRows,
                        target: activeTarget?.current
                    };
                    gridRef?.current?.onRowDeselect(deselectedArgs);
                }
                const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement?.dispatchEvent?.(selectionEvent);
            }
        }
    }, [gridRef?.current, isRowSelected?.current, selectedRowIndexes?.current, selectedRecords?.current,
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
    const getSelectedRecords: () => object[] | null = useCallback((): object[] | null => {
        let selectedData: Object[] = [];
        if (selectedRecords?.current.length) {
            selectedData = (<IRow<ColumnProps>[]>gridRef?.current.getRowsObject()).filter((row: IRow<ColumnProps>) => row.isSelected)
                .map((m: IRow<ColumnProps>) => m.data);
        }
        return selectedData;
    }, [selectedRecords?.current]);

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

    const selectedDataUpdate: (selectedData?: Object[], selectedRows?: Element[], rowIndexes?: number[]) => void =
        useCallback((selectedData?: Object[], selectedRows?: Element[], rowIndexes?: number[]): void => {
            for (let i: number = 0, len: number = rowIndexes.length; i < len; i++) {
                const currentRow: Element = gridRef?.current.getRows()[rowIndexes[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps> = getRowObj(currentRow) as IRow<ColumnProps>;
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
        const selectedRows: Element[] = [];
        const selectedData: Object[] = [];
        selectedDataUpdate(selectedData, selectedRows, rowIndexes);
        const selectingArgs: RowSelectingEvent = {
            cancel: false,
            rowIndexes: selectableRowIndex, row: selectedRows, rowIndex: rowIndex, target: activeTarget.current,
            previousRow: gridRef?.current.getRows()[parseInt(prevRowIndex?.current?.toString(), 10)],
            previousRowIndex: prevRowIndex?.current, isCtrlPressed: isMultiCtrlRequest?.current,
            isShiftPressed: isMultiShiftRequest?.current, data: selectedData
        };
        if (gridRef?.current.onRowSelecting) {
            gridRef?.current.onRowSelecting(selectingArgs);
            if (selectingArgs.cancel) { return; } // If canceled, don't proceed with deselection
        }
        clearSelection();
        if (gridRef?.current.selectionSettings.mode !== 'Single') {
            for (const rowIdx of selectableRowIndex) {
                updateRowSelection(gridRef?.current.getRowByIndex(rowIdx), rowIdx);
                updateRowProps(rowIndex);
            }
        }
        else {
            updateRowSelection(gridRef?.current.getRowByIndex(rowIndex), rowIndex);
            updateRowProps(rowIndex);
        }
        const selectedArgs: RowSelectEvent = {
            rowIndexes: selectableRowIndex, row: selectedRows, rowIndex: rowIndex, target: activeTarget.current,
            previousRow: gridRef?.current.getRows()[parseInt(prevRowIndex?.current?.toString(), 10)],
            previousRowIndex: prevRowIndex?.current, data: getSelectedRecords()
        };
        if (isRowSelected?.current && gridRef?.current.onRowSelect) {
            gridRef?.current.onRowSelect(selectedArgs);
        }

        // Dispatch custom event for toolbar refresh after multiple row selection
        const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
        const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
            detail: { selectedRowIndexes: selectedRowIndexes?.current }
        });
        gridElement?.dispatchEvent?.(selectionEvent);
    }, [gridRef, selectedRowIndexes?.current, selectedRecords?.current]);


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
        const selectedRow: Element = gridRef?.current.selectionSettings.mode !== 'Single' ? gridRef?.current.getRowByIndex(rowIndexes[0]) :
            gridRef?.current.getRowByIndex(rowIndexes[rowIndexes.length - 1]);
        const selectedRows: Element[] = [];
        const selectedData: Object[] = [];
        if (isMultiCtrlRequest?.current) {
            selectedDataUpdate(selectedData, selectedRows, rowIndexes);
        }
        // Process each row index for multi-selection
        for (const rowIndex of rowIndexes) {
            const rowObj: IRow<ColumnProps> = getRowObj(rowIndex) as IRow<ColumnProps>;
            const isUnSelected: boolean = selectedRowIndexes?.current.indexOf(rowIndex) > -1;
            if (isUnSelected && (gridRef.current?.selectionSettings?.enableToggle || isMultiCtrlRequest?.current)) {
                const rowDeselectingArgs: RowSelectingEvent = {
                    data: rowObj.data,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    rowIndex: rowIndex,
                    row: selectedRow,
                    target: activeTarget.current,
                    cancel: false
                };
                // Trigger the onRowDeselecting event
                if (gridRef?.current.onRowDeselecting) {
                    gridRef?.current.onRowDeselecting(rowDeselectingArgs);
                    if (rowDeselectingArgs.cancel) { return; }
                }
                // Remove selection
                selectedRowIndexes?.current.splice(selectedRowIndexes?.current.indexOf(rowIndex), 1);
                selectedRecords?.current.splice(selectedRecords?.current.indexOf(selectedRow), 1);
                selectedRow.removeAttribute('aria-selected');
                addRemoveSelectionClasses(selectedRow, false);
                // Trigger the onRowDeselect event
                if (gridRef?.current.onRowDeselect) {
                    const rowDeselectedArgs: RowSelectEvent = {
                        data: rowObj.data,
                        rowIndex: rowIndex,
                        row: selectedRow,
                        target: activeTarget.current
                    };
                    gridRef?.current.onRowDeselect(rowDeselectedArgs);
                }
            } else if (!isUnSelected) {
                // Create arguments for the selecting event
                const rowSelectArgs: RowSelectingEvent = {
                    data: selectedData.length ? selectedData : rowObj.data,
                    rowIndex: rowIndex,
                    isCtrlPressed: isMultiCtrlRequest?.current,
                    isShiftPressed: isMultiShiftRequest?.current,
                    row: selectedRows.length ? selectedRows : selectedRow,
                    target: activeTarget.current,
                    previousRow: gridRef?.current.getRows()[parseInt(prevRowIndex?.current?.toString(), 10)],
                    previousRowIndex: prevRowIndex?.current,
                    rowIndexes: indexes,
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
                if (gridRef?.current.onRowSelect) {
                    const selectedArgs: RowSelectEvent = {
                        data: rowSelectArgs.data,
                        previousRow: rowSelectArgs.previousRow,
                        previousRowIndex: rowSelectArgs.previousRowIndex,
                        row: rowSelectArgs.row,
                        rowIndex: rowSelectArgs.rowIndex,
                        rowIndexes: rowSelectArgs.rowIndexes,
                        target: rowSelectArgs.target
                    };
                    gridRef?.current.onRowSelect(selectedArgs);
                }
                updateRowProps(rowIndex);
            }
        }
    }, [gridRef?.current, selectedRowIndexes?.current, selectedRecords?.current, prevRowIndex?.current,
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
        const selectedRow: Element = gridRef?.current.getRowByIndex(rowIndex);
        const rowData: Object = gridRef?.current.currentViewData?.[parseInt(rowIndex.toString(), 10)];
        const selectData: Object = (getRowObj(rowIndex) as IRow<ColumnProps>).data;
        if (gridRef?.current.selectionSettings.type !== 'Row' || !selectedRow || !rowData) {
            return;
        }
        if (!isToggle || !selectedRowIndexes?.current.length) {
            isToggle = false;
        }
        else {
            if (gridRef?.current?.selectionSettings?.mode === 'Single' || (selectedRowIndexes?.current.length === 1 && gridRef?.current?.selectionSettings?.mode === 'Multiple')) {
                selectedRowIndexes?.current.forEach((index: number) => {
                    isToggle = index === rowIndex ? true : false;
                });
            } else {
                isToggle = false;
            }
        }
        if (!isToggle) {
            const args: RowSelectingEvent = {
                data: selectData,
                rowIndex: rowIndex,
                isCtrlPressed: isMultiCtrlRequest?.current,
                isShiftPressed: isMultiShiftRequest?.current,
                row: selectedRow,
                previousRow: gridRef?.current.getRowByIndex(prevRowIndex?.current),
                previousRowIndex: prevRowIndex?.current,
                target: activeTarget.current,
                cancel: false
            };
            if (gridRef?.current.onRowSelecting) {
                gridRef?.current.onRowSelecting(args);
                if (args.cancel) { return; }
            }
            if (selectedRowIndexes?.current.length) {
                clearSelection();
            }
            updateRowSelection(selectedRow, rowIndex);
            if (gridRef?.current.onRowSelect) {
                const args: RowSelectEvent = { data: selectData, rowIndex: rowIndex, row: selectedRow };
                gridRef?.current.onRowSelect(args);
            }

            // Dispatch custom event for toolbar refresh after single row selection
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: selectedRowIndexes?.current }
            });
            gridElement?.dispatchEvent?.(selectionEvent);
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
            selectRow(rowIndex, gridRef?.current?.selectionSettings?.enableToggle);
        } else if (isMultiShiftRequest?.current) {
            if (!closest(activeTarget.current, '.sf-rowcell').classList.contains('sf-chkbox')) {
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
        activeTarget.current = event.target as Element;
        isMultiShiftRequest.current = event.shiftKey;
        isMultiCtrlRequest.current = event.ctrlKey;
        const target: Element = !activeTarget.current?.classList.contains('sf-rowcell') ?
            activeTarget.current?.closest('.sf-rowcell') : activeTarget.current;
        if (gridRef?.current?.selectionSettings.enabled && target && target.parentElement.classList.contains('sf-row')) {
            const rowIndex: number = parseInt(target.parentElement.getAttribute('aria-rowindex'), 10) - 1;
            rowCellSelectionHandler(rowIndex);
        }
        isMultiCtrlRequest.current = false;
        isMultiShiftRequest.current = false;
    }, [gridRef]);

    const shiftDownUpKey: (rowIndex?: number) => void = (rowIndex?: number): void => {
        selectRowByRange(prevRowIndex.current, rowIndex);
    };

    const ctrlPlusA: () => void = (): void => {
        if (gridRef?.current?.selectionSettings?.mode === 'Multiple' && gridRef?.current.selectionSettings.type === 'Row') {
            const rowObj: IRow<ColumnProps>[] = gridRef?.current?.getRowsObject();
            selectRowByRange(rowObj[0].index, rowObj[rowObj.length - 1].index);
        }
    };

    const onCellFocus: (e: CellFocusEvent) => void = (e: CellFocusEvent): void => {
        const isHeader: boolean = (e.container as {isHeader?: boolean}).isHeader;
        const clear: boolean = isHeader && e.isJump;
        const headerAction: boolean = isHeader && e.byKey;
        if (!e.byKey || clear || !gridRef?.current?.selectionSettings.enabled) {
            if (clear) {
                clearSelection();
            }
            return;
        }
        const action: string = gridRef.current.focusModule.getNavigationDirection(e.keyArgs as KeyboardEvent);
        if (headerAction || ((action === 'shiftEnter' || action === 'enter') && e.rowIndex === prevRowIndex.current)) {
            return;
        }
        switch (action) {
        case 'space':
            selectRow(e.rowIndex, true);
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
        get selectedRowIndexes(): number[] { return selectedRowIndexes.current; },
        get selectedRecords(): Object[] { return selectedRecords.current; },
        get activeTarget(): Element | null { return activeTarget.current; }
    };
};
