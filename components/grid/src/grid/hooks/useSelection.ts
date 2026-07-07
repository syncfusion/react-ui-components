
import { RefObject, useCallback, useRef, KeyboardEvent, MouseEvent, useMemo, useEffect } from 'react';
import { AutoSelectMode, IRow, ScrollMode, SelectionMode, UseDataResult, VirtualSettings, GroupedData, ShouldExpandGroupEvent } from '../types';
import { HeaderCheckboxState, IsRowSelectable, RowSelectableParams, RowSelectEvent, RowSelectingEvent, SelectionModel } from '../types/selection.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { closest, isNullOrUndefined } from '@syncfusion/react-base';
import { CellFocusEvent } from '../types/focus.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { CheckboxChangeEvent } from '@syncfusion/react-buttons';
import { buildDeletepayload, getGroupLayoutFlattedData, getRowObjFromElement } from '../utils';
import { payload } from '../types/edit.interfaces';
import { Query, QueryOptions } from '@syncfusion/react-data';
import { UseGroupResult } from './useGroup';

/**
 * Custom hook to manage selection state and API
 *
 * @template T T
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component
 * @param {T[]} [currentViewData] - Current view data for the active page/view
 * @param {number} [totalRecordsCount] - Total records count across all pages
 * @param {boolean} [isCheckBoxColumn] - Specifies if the column renders a checkbox for selection
 * @param {UseDataResult} [dataModule] - The data module for data operations
 * @param {VirtualSettings} [virtualSettings] - The virtual settings for virtual row checkbox selection handling purpose.
 * @param {ScrollMode} [scrollMode] - The scroll mode for virtual scroll row checkbox selection handling purpose.
 * @param {IsRowSelectable<T>} [isRowSelectableProp] - Optional callback for row selectability evaluation.
 * @param {boolean} [isInitialLoad] - Flag indicating if this is the initial load
 * @param {ColumnProps<T>[]} [visibleColumns] - List of visible columns for header checkbox state update
 * @param {UseGroupResult<T>} [groupModule] - The group module for group operations
 * @param {RefObject<number>} [expandedGroupCountRef] - Reference to expanded group count
 * @returns {SelectionModel} An object containing selection-related state and API
 */
export const useSelection: <T>(gridRef?: RefObject<GridRef<T>>, currentViewData?: T[], totalRecordsCount?: number,
    isCheckBoxColumn?: boolean, dataModule?: UseDataResult<T>, virtualSettings?: VirtualSettings, scrollMode?: ScrollMode,
    isRowSelectableProp?: IsRowSelectable<T>, isInitialLoad?: boolean, visibleColumns?: ColumnProps<T>[],
    groupModule?: UseGroupResult<T>, expandedGroupCountRef?: RefObject<number>) =>
SelectionModel<T> = <T>(gridRef?: RefObject<GridRef<T>>, currentViewData?: T[], totalRecordsCount?: number,
    isCheckBoxColumn?: boolean, dataModule?: UseDataResult<T>, virtualSettings?: VirtualSettings, scrollMode?: ScrollMode,
    isRowSelectableProp?: IsRowSelectable<T>, isInitialLoad?: boolean, visibleColumns?: ColumnProps<T>[],
    groupModule?: UseGroupResult<T>, expandedGroupCountRef?: RefObject<number>):
SelectionModel<T> => {
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
    const isHeaderSelectAllMode: RefObject<boolean> = useRef<boolean>(false);
    const unselectedRowState: RefObject<Set<string>> = useRef<Set<string>>(new Set());
    const headerUpdateTimeoutHandle: RefObject<number> = useRef<number>(null);
    const headerUpdateRafHandle: RefObject<number> = useRef<number>(null);
    const isheaderClicked: RefObject<boolean> = useRef<boolean>(false);
    const isRemoteDataGrid : boolean = dataModule.isRemote() || dataModule.dataManager && 'result' in dataModule.dataManager;
    // Resets the `selectedRowIndexes` when the current view data changes
    useMemo(() => selectedRowIndexes.current.length = 0, [currentViewData]);
    // Array to store non-selectable row keys from the current view data
    const currentViewNonSelectableRowKeys: RefObject<string[]> = useRef<string[]>([]);
    // Persistent cache for selectability results across page loads
    // Maps maintain selectability information for all rows keyed by primary key, not by object reference
    // This handles remote data where object references change on each fetch
    const cachedSelectableRows: RefObject<Map<string, RowSelectableParams>> = useRef<Map<string, RowSelectableParams>>(new Map());
    const cachedNonSelectableRows: RefObject<Map<string, RowSelectableParams>> = useRef<Map<string, RowSelectableParams>>(new Map());

    //Pre-computed selectability results for every row in `currentViewData`.
    // Separate maps for selectable and non-selectable records - maintained across page loads
    const { selectableRows, nonSelectableRows, currentViewSelectableRows, currentViewNonSelectableRows } = useMemo((): {
        selectableRows: Map<string, RowSelectableParams>;
        nonSelectableRows: Map<string, RowSelectableParams>;
        currentViewSelectableRows: Map<string, RowSelectableParams>;
        currentViewNonSelectableRows: Map<string, RowSelectableParams>;
    } => {
        const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
        // Process only rows in current view that haven't been cached yet - only on initial render
        if (isRowSelectableProp && currentViewData?.length && (isRemoteDataGrid || isInitialLoad)) {
            const gridData: T[] =  isRemoteDataGrid ? currentViewData : gridRef.current.getData?.(true) as T[] ?? [];
            for (const rowData of gridData) {
                const rowKey: string = rowData?.[primaryKeys[0]];
                // Skip if already cached in either map - .has() returns false for empty maps automatically
                if (rowKey && (cachedSelectableRows.current.has(rowKey) || cachedNonSelectableRows.current.has(rowKey))) {
                    continue;
                }
                const result: boolean | RowSelectableParams = isRowSelectableProp(rowData);
                const normalized: RowSelectableParams = typeof result === 'boolean'
                    ? { selectable: result, showDisabledCheckboxes: true }
                    : { showDisabledCheckboxes: true, ...result };
                if (rowKey) {
                    if (normalized.selectable) {
                        cachedSelectableRows.current.set(rowKey, normalized);
                    } else {
                        cachedNonSelectableRows.current.set(rowKey, normalized);
                    }
                }
            }
        }

        // Compute current view selectability rows
        const selectableRowsData: Map<string, RowSelectableParams> = new Map();
        const nonSelectableRowsData: Map<string, RowSelectableParams> = new Map();
        if (isRowSelectableProp && currentViewData?.length && (gridRef?.current?.pageSettings?.enabled
            || !virtualSettings?.enableRow)) {
            for (const rowData of currentViewData) {
                const rowKey: string = rowData?.[primaryKeys[0]];
                // Check cache first using primary key
                const cachedSelectable: RowSelectableParams = rowKey ? cachedSelectableRows.current.get(rowKey) : undefined;
                const cachedNonSelectable: RowSelectableParams = rowKey ? cachedNonSelectableRows.current.get(rowKey) : undefined;

                let isSelectable: boolean;
                let params: RowSelectableParams;

                if (cachedSelectable) {
                    isSelectable = true;
                    params = cachedSelectable;
                } else if (cachedNonSelectable) {
                    isSelectable = false;
                    params = cachedNonSelectable;
                }
                if (isSelectable) {
                    selectableRowsData.set(rowKey, params);
                } else {
                    nonSelectableRowsData.set(rowKey, params);
                }
            }
        } else if (currentViewData?.length && !isRowSelectableProp) {
            // No row selectability check - all are selectable
            for (const rowData of currentViewData) {
                const rowKey: string = rowData?.[primaryKeys[0]];
                selectableRowsData.set(rowKey, { selectable: true, showDisabledCheckboxes: true });
            }
        }

        // Return the persistent cached maps and current view rows
        return {
            selectableRows: cachedSelectableRows.current,
            nonSelectableRows: cachedNonSelectableRows.current,
            currentViewSelectableRows: selectableRowsData,
            currentViewNonSelectableRows: nonSelectableRowsData
        };
    }, [currentViewData, isRowSelectableProp]);

    // Function to calculate filtering state
    const getFilteringState: () => boolean = (): boolean => {
        const query: Query = dataModule?.generateQuery?.();
        return query?.queries?.some((q: QueryOptions) => {
            const fnName: string = (q && (q.fn || q['fn'])) as string;
            return fnName === 'onSearch' || fnName === 'onWhere';
        }) ?? false;
    };

    // Update persistent selection collection - Defined early to be used by other functions
    const updatePersistCollection: (rowData: T, isSelected: boolean) => void =
        useCallback((rowData: T, isSelected: boolean): void => {
            const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
            const key: string = rowData?.[primaryKeys[0]] || (rowData as GroupedData<T>)?.flattedKey;
            if (!key) { return; }
            if (isSelected) {
                if (!selectedRowState.current.has(key)) {
                    selectedRowState.current.add(key);
                    persistSelectedData.current.set(key, rowData);
                }
                // If header select-all is active, remove from unselected set
                if (isHeaderSelectAllMode.current && unselectedRowState.current.has(key)) {
                    unselectedRowState.current.delete(key);
                }
            } else {
                if (selectedRowState.current.has(key)) {
                    selectedRowState.current.delete(key);
                    persistSelectedData.current.delete(key);
                }
                // If header select-all is active, track manual unselection
                if (isHeaderSelectAllMode.current) {
                    unselectedRowState.current.add(key);
                }
            }
        }, [gridRef, currentViewData]);

    // Evaluates row selectability for a given row data object.
    const isRowSelectableEval: (rowData: T) => RowSelectableParams = useCallback((rowData: T): RowSelectableParams => {
        if (!isRowSelectableProp) {
            return { selectable: true, showDisabledCheckboxes: true };
        }
        const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
        const rowKey: string = rowData?.[primaryKeys[0]];

        // Check selectable records map first using primary key
        const cachedSelectable: RowSelectableParams | undefined = selectableRows.get(rowKey);
        if (cachedSelectable !== undefined && !gridRef?.current?.editData) {
            return cachedSelectable;
        }
        // Check non-selectable records map using primary key
        const cachedNonSelectable: RowSelectableParams | undefined = nonSelectableRows.get(rowKey);
        if (cachedNonSelectable !== undefined && !gridRef?.current?.editData) {
            return cachedNonSelectable;
        }
        // Row is outside currentViewData (e.g. full data-source evaluation) — compute and cache.
        const result: boolean | RowSelectableParams = isRowSelectableProp(rowData);
        const normalized: RowSelectableParams = typeof result === 'boolean'
            ? { selectable: result, showDisabledCheckboxes: true }
            : { showDisabledCheckboxes: true, ...result };
        // Cache in appropriate map using primary key
        if (rowKey) {
            if (normalized.selectable) {
                selectableRows.set(rowKey, normalized);
                nonSelectableRows.delete(rowKey); // Ensure it's not in the non-selectable map
            } else {
                nonSelectableRows.set(rowKey, normalized);
                selectableRows.delete(rowKey); // Ensure it's not in the selectable map
            }
        }
        return normalized;
    }, [isRowSelectableProp, selectableRows, nonSelectableRows]);

    // Partitions an array of row indexes into selectable and non-selectable buckets.
    const filterSelectableIndices: (indexes: number[]) => { selectable: number[]; nonSelectable: number[] } =
        useCallback((indexes: number[]): { selectable: number[]; nonSelectable: number[] } => {
            if (!isRowSelectableProp || !gridRef.current?.currentViewData) {
                return { selectable: indexes, nonSelectable: [] };
            }
            const selectable: number[] = [];
            const nonSelectable: number[] = [];
            for (const idx of indexes) {
                let rowData: T;
                // For remote data grids, retrieve rowData from row objects by matching rowIndex
                if (isRemoteDataGrid) {
                    const rowsObject: IRow<ColumnProps<T>>[] = gridRef.current.getRowsObject?.();
                    if (rowsObject && rowsObject.length > 0) {
                        const matchedRow: IRow<ColumnProps<T>> | undefined = rowsObject.find((row: IRow<ColumnProps<T>>) =>
                            row.rowIndex === idx);
                        if (matchedRow && matchedRow.data) {
                            rowData = matchedRow.data as T;
                        }
                    }
                }
                else {
                    rowData = gridRef.current.currentViewData[idx as number] as T;
                }
                if (isNullOrUndefined(rowData)) { continue; }
                if (isRowSelectableEval(rowData).selectable) {
                    selectable.push(idx);
                } else {
                    nonSelectable.push(idx);
                }
            }
            return { selectable, nonSelectable };
        }, [isRowSelectableProp, currentViewData, isRowSelectableEval]);

    // Computes the header checkbox tri-state
    const getHeaderCheckboxState: () => HeaderCheckboxState = useCallback((): HeaderCheckboxState => {
        let isChecked: boolean = false;
        let isIndeterminate: boolean = false;
        let isDisabled: boolean = false;
        const currentData: T[] = currentViewData.length ? currentViewData : gridRef?.current?.currentViewData as T[];
        const isPaging: boolean = gridRef?.current?.pageSettings?.enabled;
        const isVirtualization: boolean = virtualSettings?.enableRow;
        const totalCount: number = groupModule?.groupSettings?.enabled && groupModule?.groupSettings?.columns?.length ?
            expandedGroupCountRef?.current ?? 0 :
            totalRecordsCount !== 0 ? totalRecordsCount : (gridRef?.current?.pageSettings?.totalRecordsCount ?? 0);
        const isInterMediateMode: boolean = gridRef.current?.selectionSettings.autoSelectMode === AutoSelectMode.Intermediate;
        const currentViewSelectableCount: number = isRowSelectableProp
            ? currentViewSelectableRows.size : currentViewData?.length ?? 0;
        const selectedRecords: T[] = gridRef.current?.selectionSettings.persistSelection
            ? getPersistSelectedData() : getSelectedRecords() as T[];
        let totalSelectedCount: number = selectedRecords.length;
        let currentViewSelectedCount: number = gridRef?.current?.pageSettings?.enabled
            ? getSelectedRowIndexes().length : totalSelectedCount;
        let totalNonSelectableCount: number = isRowSelectableProp ? nonSelectableRows.size : 0;
        if (getFilteringState()) {
            let filteredRecords: (T | GroupedData<T>)[] = (gridRef?.current?.getData?.(true, false, selectedRecords) as T[]);
            type ChildInfoType = {
                count: number;
                currentViewData: (GroupedData<T> | T)[];
                expandedGroups: string[];
                collapsedGroups: string[];
            };
            const childInfo: ChildInfoType = getGroupLayoutFlattedData(
                filteredRecords as GroupedData<T>[],
                (event: ShouldExpandGroupEvent) => {
                    const isExpanded: boolean = groupModule?.expandedGroups.has(event.groupKey as string) ?? false;
                    const isNotCollapsed: boolean = !groupModule?.collapsedGroups.has(event.groupKey as string);
                    return isExpanded && isNotCollapsed;
                },
                gridRef.current?.groupSettings,
                groupModule.collapsedGroups
            );
            filteredRecords = childInfo.currentViewData;
            totalSelectedCount = filteredRecords ? filteredRecords.length : 0;
            totalNonSelectableCount = isRowSelectableProp
                ? ((isInterMediateMode && isPaging) || isVirtualization
                    ? currentViewNonSelectableRowKeys.current.length
                    : totalCount - totalSelectedCount)
                : 0;
            if (!isPaging && !isVirtualization) {
                currentViewSelectedCount = filteredRecords.length;
            }
        }
        if (!gridRef.current?.selectionSettings.persistSelection) {
            // Local data with Default mode: select all local rows
            isChecked = currentData?.length > 0 && currentViewSelectedCount + currentViewNonSelectableRows.size === currentData?.length;
            // Tri-state visual based on any row selection
            if (!isChecked && currentViewSelectedCount > 0) {
                isIndeterminate = true;
            }
        } else {
            if (isPaging || !isVirtualization) {
                if ((isRowSelectableProp || currentData.length === 0) && ((currentViewSelectableCount === 0 &&
                    isHeaderSelectAllMode.current && currentViewSelectedCount === 0) || (!currentData?.length &&
                    totalSelectedCount && isHeaderSelectAllMode.current))) {
                    isDisabled = true;
                }
                if (isInterMediateMode) {
                    isChecked = !isDisabled && totalSelectedCount > 0 && totalSelectedCount === totalCount - totalNonSelectableCount;
                    isIndeterminate = !isDisabled &&  totalSelectedCount > 0 && (currentViewSelectedCount > 0 || totalSelectedCount > 0) &&
                        !isChecked;
                } else {
                    const matchedKeys: string[] = unselectedRowState.current.size > 0
                        ? [...unselectedRowState.current].filter((key: string) => currentViewSelectableRows.has(key)) : [];
                    isChecked = !isDisabled && currentViewSelectedCount > 0 && (currentViewSelectedCount === currentViewSelectableCount
                        || (isRemoteDataGrid && isHeaderSelectAllMode.current
                            && (unselectedRowState.current.size === 0 || matchedKeys.length === 0)));
                    isIndeterminate = !isDisabled && !isChecked && (currentViewSelectedCount > 0 || totalSelectedCount > 0)
                        && (currentViewSelectedCount < currentViewSelectableCount
                        || currentData?.length > currentViewSelectedCount || (currentData?.length === 0 && currentViewSelectedCount
                        < gridRef?.current?.getRowsObject?.()?.length));
                }
            } else if (isVirtualization) {
                if ((isRowSelectableProp || currentData.length === 0) && ((totalNonSelectableCount === 0 && isHeaderSelectAllMode.current)
                    || !currentData && totalSelectedCount && isHeaderSelectAllMode.current)) {
                    isDisabled = true;
                }
                isChecked = selectedRecords.length > 0 && !isDisabled && ((isHeaderSelectAllMode.current &&
                    unselectedRowState.current.size === 0) || ((isHeaderSelectAllMode.current || currentData.length ===
                    selectedRecords.length + totalNonSelectableCount) && (isRemoteDataGrid ? unselectedRowState.current.size === 0
                    : totalSelectedCount + totalNonSelectableCount === totalCount)));
                isIndeterminate = selectedRecords.length > 0 && !isDisabled && !isChecked && totalSelectedCount > 0
                    && (totalSelectedCount < totalCount && !isDisabled || isInterMediateMode);
            }
        }
        return {
            checked: isChecked,
            indeterminate: isIndeterminate,
            disabled: isDisabled
        };
    }, [isRowSelectableProp, currentViewData, selectedRowIndexes, isRowSelectableEval]);

    const updateHeaderSelectionState: () => void = useCallback((): void => {
        if (headerUpdateTimeoutHandle.current) {
            window.clearTimeout(headerUpdateTimeoutHandle.current);
            headerUpdateTimeoutHandle.current = null;
        }
        if (headerUpdateRafHandle.current) {
            cancelAnimationFrame(headerUpdateRafHandle.current);
            headerUpdateRafHandle.current = null;
        }
        if (!isCheckBoxColumn || !gridRef?.current) { return; }
        const row: IRow<ColumnProps> = gridRef?.current?.getHeaderRowsObject?.()?.[0];
        if (!row) { return; }
        // debounce: prevent redundant updates on rapid row selection changes
        headerUpdateTimeoutHandle.current = window.setTimeout(() => {
            // batch DOM updates in a single paint frame
            headerUpdateRafHandle.current = requestAnimationFrame(() => {
                const { checked, indeterminate, disabled } = getHeaderCheckboxState();
                row?.setRowObject?.((prev: IRow<ColumnProps<T>>) =>
                    ({ ...prev, isSelected: checked, isIntermediateState: indeterminate, isDisabled: disabled }));
                window.clearTimeout(headerUpdateTimeoutHandle.current);
                headerUpdateTimeoutHandle.current = null;
                cancelAnimationFrame(headerUpdateRafHandle.current);
                headerUpdateRafHandle.current = null;
                isheaderClicked.current = false;
            });
        }, 10);
    }, [gridRef, currentViewData, totalRecordsCount, selectedRowIndexes, isRowSelectableProp, getHeaderCheckboxState]);

    // Clear selectability cache when the selectability function changes
    useEffect(() => {
        cachedSelectableRows.current.clear();
        cachedNonSelectableRows.current.clear();
    }, [isRowSelectableProp]);

    // Component-level cleanup on unmount
    useEffect(() => {
        return () => {
            if (headerUpdateTimeoutHandle.current) {
                window.clearTimeout(headerUpdateTimeoutHandle.current);
                headerUpdateTimeoutHandle.current = null;
            }
            if (headerUpdateRafHandle.current) {
                cancelAnimationFrame(headerUpdateRafHandle.current);
                headerUpdateRafHandle.current = null;
            }
            // Clean up selectability caches on unmount
            cachedSelectableRows.current.clear();
            cachedNonSelectableRows.current.clear();
            // Clear non-selectable row keys array on unmount
            currentViewNonSelectableRowKeys.current = [];
        };
    }, []);

    /**
     * Recalculate header checkbox state when visible columns change
     * This ensures the header checkbox state is updated after column chooser applies changes
     * Triggered when column visibility changes (e.g., from column chooser dialog)
     */
    useEffect(() => {
        if (isCheckBoxColumn && visibleColumns && !isInitialLoad) {
            // Debounce the header state update to avoid redundant calculations
            updateHeaderSelectionState();
        }
    }, [visibleColumns?.length, isCheckBoxColumn]);

    // Updates the array of non-selectable row keys from current view data
    useMemo(() => {
        const isInterMediateMode: boolean = gridRef.current?.selectionSettings.autoSelectMode === AutoSelectMode.Intermediate;
        const isFilterIntermediate: boolean = getFilteringState() && (isInterMediateMode || virtualSettings?.enableRow);

        if (isRowSelectableProp && currentViewData?.length && isFilterIntermediate) {
            const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
            // Loop through current view data and update the array with non-selectable row keys
            for (const rowData of currentViewData) {
                const rowKey: string = rowData?.[primaryKeys?.[0]];
                if (!rowKey) { continue; }

                const isSelectableParams: RowSelectableParams = isRowSelectableEval(rowData);
                if (!isSelectableParams.selectable) {
                    if (!currentViewNonSelectableRowKeys.current.includes(rowKey)) {
                        currentViewNonSelectableRowKeys.current.push(rowKey);
                    }
                } else {
                    const index: number = currentViewNonSelectableRowKeys.current.indexOf(rowKey);
                    if (index > -1) {
                        currentViewNonSelectableRowKeys.current.splice(index, 1);
                    }
                }
            }
        }
    }, [gridRef.current?.pageSettings?.pageSize, currentViewData, isRowSelectableProp]);

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
        }, [currentViewData]);

    const triggerRowSelect: (rowSelect: boolean, shiftSelectableRowIndexes?: number[], deselectedRowIndexes?: number[]) => void =
        useCallback((rowSelect: boolean, shiftSelectableRowIndexes?: number[], deselectedRowIndexes?: number[]): void => {
            if (rowSelect) {
                gridRef?.current?.onRowSelect?.(generateRowSelectArgs(selectedRowIndexes.current, !rowSelect, shiftSelectableRowIndexes));
            } else {
                gridRef?.current?.onRowDeselect?.(generateRowSelectArgs(deselectedRowIndexes, !rowSelect, shiftSelectableRowIndexes));
            }
        }, [currentViewData]);

    /**
     * Updates row selection state
     */
    const updateRowSelection: (selectedRow: HTMLTableRowElement, rowIndex: number) => void =
        useCallback((selectedRow: HTMLTableRowElement, rowIndex: number): void => {
            let rowData: T;
            // For remote data grids, retrieve rowData from row objects by matching rowIndex
            if (isRemoteDataGrid && isRowSelectableProp) {
                const rowsObject: IRow<ColumnProps<T>>[] = gridRef.current.getRowsObject?.();
                if (rowsObject && rowsObject.length > 0) {
                    const matchedRow: IRow<ColumnProps<T>> | undefined = rowsObject.find((row: IRow<ColumnProps<T>>) =>
                        row.rowIndex === rowIndex);
                    if (matchedRow && matchedRow.data) {
                        rowData = matchedRow.data as T;
                    }
                }
            }
            else {
                rowData = gridRef.current.currentViewData?.[rowIndex as number];
            }
            const rowSelectability: boolean = isRowSelectableProp ? isRowSelectableEval(rowData).selectable : true;
            if ((!selectedRow || !gridRef?.current) && (!virtualSettings.enableRow || scrollMode !== ScrollMode.Auto ||
                !currentViewData?.[rowIndex as number])) { return; }
            // Defensive guard: skip non-selectable rows
            if (isRowSelectableProp) {
                if (rowData && !rowSelectability) { return; }
            }
            if (!selectedRowIndexes.current?.includes(rowIndex)) {
                selectedRowIndexes?.current?.push(rowIndex);
            }
            if (selectedRow) {
                selectedRowsRef?.current?.push(selectedRow);
            }
            const rowObj: IRow<ColumnProps<T>> = getRowObjFromElement(selectedRow, gridRef, virtualSettings);
            if ((!rowObj || !Object.keys(rowObj).length) && (!virtualSettings.enableRow || scrollMode !== ScrollMode.Auto ||
                !currentViewData?.[rowIndex as number])) { return; }
            if (rowObj && Object.keys(rowObj).length) {
                rowObj.isSelected = true;
                rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({ ...prev, isSelected: true }));
            }
            if (gridRef.current?.selectionSettings?.persistSelection) {
                updatePersistCollection(rowObj?.data as T ?? currentViewData?.[rowIndex as number], rowSelectability);
            }
            updateHeaderSelectionState();

            // Dispatch custom event for toolbar refresh
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: selectedRowIndexes?.current }
            });
            gridElement?.dispatchEvent?.(selectionEvent);
        }, [gridRef, currentViewData, updatePersistCollection, updateHeaderSelectionState, virtualSettings, scrollMode,
            isRowSelectableProp, isRowSelectableEval]);

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
                const currentRow: Element = virtualSettings.enableRow ?
                    gridRef.current?.cachedRowObjects.current?.get(selectedRowIndexes?.current[i as number])?.element :
                    rows[selectedRowIndexes?.current[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = getRowObjFromElement(currentRow, gridRef, virtualSettings) as IRow<ColumnProps<T>>;
                if (Object.keys(rowObj).length || (virtualSettings.enableRow && scrollMode === ScrollMode.Auto
                    && currentViewData?.[selectedRowIndexes?.current[i as number] as number])) {
                    data.push((rowObj?.data ?? currentViewData?.[selectedRowIndexes?.current[i as number] as number]) as T);
                    if (currentRow) {
                        row.push(currentRow);
                    }
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(i.toString(), 10)]);
                    if (rowObj && Object.keys(rowObj).length) {
                        rowObj.isSelected = false;
                        rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) =>
                            ({ ...prev, isSelected: false }));
                    }
                    if (gridRef.current?.selectionSettings?.persistSelection) {
                        updatePersistCollection(
                            rowObj?.data as T ?? currentViewData?.[selectedRowIndexes?.current[i as number] as number],
                            false);
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
            isHeaderSelectAllMode.current = false;
            unselectedRowState.current.clear();
            selectedRowState.current.clear();
            persistSelectedData.current.clear();

            triggerRowSelect(false, undefined, rowIndexes);

            // Dispatch custom event for toolbar refresh after deselection
            const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
            const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                detail: { selectedRowIndexes: [] }
            });
            gridElement?.dispatchEvent?.(selectionEvent);
            updateHeaderSelectionState();
        }
    }, [gridRef, virtualSettings, updatePersistCollection, triggerRowSelect, updateHeaderSelectionState, scrollMode]);

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
                const rowObj: IRow<ColumnProps<T>> =
                    getRowObjFromElement(currentRow ?? rowIndex, gridRef, virtualSettings) as IRow<ColumnProps<T>>;

                if (Object.keys(rowObj).length || (virtualSettings.enableRow && scrollMode === ScrollMode.Auto &&
                    currentViewData?.[rowIndex as number])) {
                    data.push((rowObj?.data ?? currentViewData?.[rowIndex as number]) as T);
                    if (currentRow) {
                        deSelectedRows.push(currentRow);
                    }
                    rowIndexes.push(selectedRowIndexes?.current[parseInt(selectedIndex.toString(), 10)]);
                    if (rowObj && Object.keys(rowObj).length) {
                        rowObj.isSelected = false;
                        rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: false}));
                    }
                    if (gridRef.current?.selectionSettings?.persistSelection) {
                        updatePersistCollection(rowObj.data as T ?? currentViewData?.[rowIndex as number], false);
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
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement?.dispatchEvent?.(selectionEvent);
            }
        }
    }, [gridRef, triggerRowSelect, updateHeaderSelectionState, virtualSettings, scrollMode]);

    /**
     * Gets the index of the selected row
     */
    const getSelectedRowIndexes: () => number[] = useCallback((): number[] => {
        return selectedRowIndexes?.current;
    }, [selectedRowIndexes?.current]);

    /**
     * Gets the selected row data
     */
    const getSelectedRecords: () => T[] | { isSelectAll: boolean; primaryKeys: string[] } | null =
        useCallback((): T[] | { isSelectAll: boolean; primaryKeys: string[] } | null => {
            if (isRemoteDataGrid) {
                const payload: payload = buildDeletepayload<T>(gridRef.current as GridRef<T>, 'all');
                return { isSelectAll: payload.isHeaderSelectAllMode, primaryKeys: payload.toggleKeys };
            }
            if (gridRef?.current?.selectionSettings?.persistSelection) {
                return getPersistSelectedData();
            }
            // Fallback to current page selected rows
            let selectedData: T[] = [];
            if (selectedRowsRef?.current?.length && gridRef?.current) {
                const rowsObj: IRow<ColumnProps<T>>[] = gridRef?.current?.getRowsObject?.();
                selectedData = (virtualSettings.enableRow ? selectedRowIndexes.current?.map((selectedIndex: number) => {
                    return gridRef?.current?.cachedRowObjects.current?.get(selectedIndex)?.data ??
                    currentViewData?.[selectedIndex as number];
                }) : rowsObj.filter((row: IRow<ColumnProps<T>>) => row?.isSelected)
                    .map((m: IRow<ColumnProps<T>>) => m.data)) as T[];
            }
            return selectedData;
        }, [gridRef, dataModule]);

    /**
     * Gets the persistent selected data as an array of record objects
     */
    const getPersistSelectedData: () => T[] = useCallback((): T[] => {
        return Array.from(persistSelectedData.current.values());
    }, []);

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
        }, [gridRef, currentViewData]);

    const selectedDataUpdate: (selectedData?: Object[], selectedRows?: HTMLTableRowElement[], rowIndexes?: number[]) => void =
        useCallback((selectedData?: Object[], selectedRows?: HTMLTableRowElement[], rowIndexes?: number[]): void => {
            if (!gridRef?.current || !rowIndexes?.length) { return; }
            for (let i: number = 0, len: number = rowIndexes.length; i < len; i++) {
                const currentRow: HTMLTableRowElement = virtualSettings.enableRow ?
                    gridRef?.current?.cachedRowObjects.current?.get(rowIndexes[i as number])?.element :
                    gridRef?.current.getRows()[rowIndexes[parseInt(i.toString(), 10)]];
                const rowObj: IRow<ColumnProps<T>> = virtualSettings.enableRow ?
                    gridRef?.current?.cachedRowObjects.current?.get(rowIndexes[i as number]) :
                    getRowObjFromElement(currentRow, gridRef, virtualSettings) as IRow<ColumnProps<T>>;
                if (rowObj && rowObj.isDataRow) {
                    selectedData.push(rowObj.data);
                    selectedRows.push(currentRow);
                } else if ((!rowObj || !Object.keys(rowObj).length) && virtualSettings.enableRow && scrollMode === ScrollMode.Auto &&
                    currentViewData?.[rowIndexes[i as number] as number]) {
                    selectedData.push(currentViewData?.[rowIndexes[i as number] as number]);
                }
            }
        }, [gridRef, currentViewData, virtualSettings]);

    const updateRowProps: (startIndex: number) => void = useCallback((startIndex: number): void => {
        prevRowIndex.current = startIndex;
        isRowSelected.current = !!selectedRowIndexes?.current.length;
    }, [selectedRowIndexes?.current]);

    /**
     * Selects a collection of rows by index.
     * Non-selectable rows in `rowIndexes` are silently filtered out before selection.
     * Selection events fire only for rows that are actually selected.
     *
     * @param  {number[]} rowIndexes - Specifies an array of row indexes.
     * @returns {void}
     */
    const selectRows: (rowIndexes: number[]) => void = useCallback((rowIndexes: number[]): void => {
        const { selectable: selectableRowIndex } = filterSelectableIndices([...rowIndexes]);
        const rowIndex: number = gridRef?.current.selectionSettings.mode !== 'Single' ? rowIndexes[0] : rowIndexes[rowIndexes.length - 1];
        if (selectedRowIndexes.current?.length === rowIndexes.length && selectedRowIndexes.current?.toString() === rowIndexes.toString()) {
            return;
        }
        const selectedRows: HTMLTableRowElement[] = [];
        const selectedData: T[] = [];
        selectedDataUpdate(selectedData, selectedRows, selectableRowIndex); // Use selectableRowIndex instead of rowIndexes
        const selectingArgs: RowSelectingEvent<T> = {
            cancel: false,
            selectedRowIndexes: selectableRowIndex, row: selectedRows, selectedRowIndex: rowIndex,
            event: activeEvent?.current,
            isCtrlPressed: isMultiCtrlRequest?.current,
            isShiftPressed: isMultiShiftRequest?.current, data: selectedData
        };
        if (gridRef?.current.onRowSelecting) {
            gridRef?.current.onRowSelecting(selectingArgs);
            if (selectingArgs.cancel) {
                return;
            } // If canceled, don't proceed with deselection
        }
        const clearSelectedRowIndexes: number[] = selectedRowIndexes.current.filter((index: number) => !selectableRowIndex.includes(index));
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
        if (shiftSelectableRowIndex.length) {
            triggerRowSelect(true, shiftSelectableRowIndex);
        }

        // Update header state after programmatic selection
        updateHeaderSelectionState();

        // Dispatch custom event for toolbar refresh after multiple row selection
        const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
        const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
            detail: { selectedRowIndexes: selectedRowIndexes?.current }
        });
        gridElement?.dispatchEvent?.(selectionEvent);
    }, [gridRef, selectedDataUpdate, clearRowSelection, updateRowSelection, updateRowProps, triggerRowSelect, currentViewData,
        filterSelectableIndices, updateHeaderSelectionState]);


    /**
     * Selects a range of rows from start and end row indexes.
     * Non-selectable rows within the range are silently skipped.
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
     * @param {boolean} isVirtualHeaderSelectAll - DOM virtualization enabled Grid header select all action purpose
     * @returns {void}
     */
    const addRowsToSelection: (rowIndexes: number[], isVirtualHeaderSelectAll?: boolean) => void =
    useCallback((rowIndexes: number[], isVirtualHeaderSelectAll?: boolean): void => {
        if (!gridRef?.current || !rowIndexes?.length) { return; }
        // Guard: filter non-selectable rows before any selection processing
        const { selectable: selectableRowIndexes } = filterSelectableIndices(rowIndexes);
        if (!selectableRowIndexes?.length) { return; }
        const indexes: number[] = getSelectedRowIndexes().concat(selectableRowIndexes);
        const selectedRow: HTMLTableRowElement = gridRef?.current?.selectionSettings?.mode !== 'Single' ?
            gridRef?.current?.getRowByIndex?.(selectableRowIndexes[0]) :
            gridRef?.current?.getRowByIndex?.(selectableRowIndexes[selectableRowIndexes.length - 1]);
        if (!selectedRow && (!virtualSettings.enableRow || scrollMode !== ScrollMode.Auto ||
            !currentViewData?.[selectableRowIndexes[0] as number])) { return; }
        const selectedRows: HTMLTableRowElement[] = [];
        const selectedData: T[] = [];
        if (isMultiCtrlRequest?.current) {
            selectedDataUpdate(selectedData, selectedRows, selectableRowIndexes);
        }
        // Process each row index for multi-selection
        for (const rowIndex of selectableRowIndexes) {
            const rowObj: IRow<ColumnProps<T>> = getRowObjFromElement(rowIndex, gridRef, virtualSettings) as IRow<ColumnProps<T>>;
            let isUnSelected: boolean;
            if (gridRef.current?.selectionSettings?.persistSelection) {
                const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
                isUnSelected = selectedRowState.current.has(rowObj.data?.[primaryKeys[0]] ??
                    rowObj.data?.['flattedKey'] ??
                    currentViewData?.[rowIndexes[rowIndex as number] as number]?.[primaryKeys[0]] ??
                    currentViewData?.[rowIndexes[rowIndex as number] as number]?.['flattedKey']);
            } else {
                isUnSelected = !!(getRowObjFromElement(rowIndex, gridRef, virtualSettings)?.isSelected);
            }
            if (isUnSelected && (gridRef.current?.selectionSettings?.enableToggle || isMultiCtrlRequest?.current)) {
                const rowDeselectingArgs: RowSelectingEvent<T> = {
                    data: rowObj.data as T,
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
                if (rowObj && Object.keys(rowObj).length) {
                    rowObj.isSelected = false;
                    rowObj?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isSelected: false}));
                }
                if (gridRef.current?.selectionSettings?.persistSelection) {
                    updatePersistCollection(rowObj.data as T ?? currentViewData?.[rowIndexes[rowIndex as number] as number], false);
                }
                updateHeaderSelectionState();
                // Trigger the onRowDeselect event
                triggerRowSelect(false, undefined, [rowIndex]);

                // Dispatch custom event for toolbar refresh after row deselection
                const gridElement: HTMLDivElement | null | undefined = gridRef?.current?.element;
                const selectionEvent: CustomEvent = new CustomEvent('selectionChanged', {
                    detail: { selectedRowIndexes: selectedRowIndexes?.current }
                });
                gridElement?.dispatchEvent?.(selectionEvent);
            } else if (!isUnSelected) {
                // Create arguments for the selecting event
                const rowSelectArgs: RowSelectingEvent<T> = {
                    data: selectedData.length ? selectedData : rowObj.data as T,
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
                updateRowSelection(isVirtualHeaderSelectAll ? rowObj?.element : selectedRow, rowIndex);
                // Trigger the onRowSelect event
                triggerRowSelect(true);
                updateRowProps(rowIndex);
            }
        }
    }, [gridRef, getSelectedRowIndexes, selectedDataUpdate, clearSelection, currentViewData, virtualSettings,
        updateRowSelection, updatePersistCollection, triggerRowSelect, updateRowProps, updateHeaderSelectionState,
        filterSelectableIndices]);

    /**
     * Selects a row by the given index.
     * Non-selectable rows are silently ignored; no error is thrown and no events fire.
     *
     * @param  {number} rowIndex - Defines the row index.
     * @param  {boolean} isToggle - If set to true, then it toggles the selection.
     * @returns {void}
     */
    const selectRow: (rowIndex: number, isToggle?: boolean) => void = useCallback((rowIndex: number, isToggle?: boolean): void => {
        if (!gridRef?.current || rowIndex < 0 || !gridRef?.current?.selectionSettings?.enabled) { return; }
        const selectedRow: HTMLTableRowElement = gridRef?.current?.getRowByIndex?.(rowIndex);
        let data: Object = gridRef?.current?.currentViewData?.[parseInt(rowIndex.toString(), 10)];
        const isRemoteData: boolean = (gridRef?.current?.getDataModule() as UseDataResult)?.isRemote() ||
            'result' in gridRef.current?.dataSource;
        if (isRemoteData && virtualSettings.enableRow) {
            data = gridRef.current?.cachedRowObjects.current.get(rowIndex)?.data;
        }
        const selectData: T = (getRowObjFromElement(rowIndex, gridRef, virtualSettings) as IRow<ColumnProps<T>>)?.data as T;
        if (gridRef?.current?.selectionSettings?.type !== 'Row' || !selectedRow || !data) {
            return;
        }
        // Guard: skip non-selectable rows silently
        if (isRowSelectableProp) {
            const idx: number = parseInt(rowIndex.toString(), 10);
            // eslint-disable-next-line security/detect-object-injection
            const rowData: T = (gridRef?.current?.currentViewData?.[idx] ?? currentViewData?.[idx]) as T;
            if (rowData && !isRowSelectableEval(rowData).selectable) { return; }
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
                if ((selectedRowIndexes?.current.length || (gridRef?.current?.selectionSettings?.persistSelection &&
                    getPersistSelectedData?.()?.length)) && !gridRef?.current?.selectionSettings?.checkboxOnly &&
                    (gridRef?.current?.selectionSettings?.mode === 'Single' || !isMultiCtrlRequest.current)) {
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
            const isRowSelected: boolean = selectedRow.getAttribute('aria-selected') === 'true';
            if (isRowSelected) {
                clearSelection();
            } else {
                updateRowSelection(selectedRow, rowIndex);
            }
        }
        updateRowProps(rowIndex);
        // Ensure header state is updated after programmatic selection
        updateHeaderSelectionState();
    }, [gridRef, clearSelection, clearRowSelection, updateRowSelection, virtualSettings,
        triggerRowSelect, updateRowProps, isRowSelectableProp, currentViewData, isRowSelectableEval, updateHeaderSelectionState]);

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
            selectRowByRange(virtualSettings.enableRow ? gridRef.current?.cachedRowObjects.current?.get(0)?.rowIndex : rowObj[0].rowIndex,
                             virtualSettings.enableRow ? (currentViewData.length - 1) : rowObj[rowObj.length - 1].rowIndex);
        }
    };

    const onCellFocus: (e: CellFocusEvent) => void = (e: CellFocusEvent): void => {
        activeEvent.current = e.event;
        const isHeader: boolean = (e.container as {isHeader?: boolean}).isHeader;
        const isHeaderCheckBox: boolean = e.element?.querySelector('.sf-grid-checkselectall') !== null;
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
    const shouldHeaderSelectAll: (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent,
        isRemoteData?: boolean) => boolean =
        useCallback((row?: IRow<ColumnProps>, event?: CheckboxChangeEvent,
                     isRemoteData?: boolean): boolean => {
            const isPersistSelection: boolean = gridRef.current?.selectionSettings.persistSelection;
            const selectedRecords: T[] = isPersistSelection ? getPersistSelectedData()
                : getSelectedRecords() as T[];
            let selectedRecordsCount: number = getSelectedRowIndexes().length;
            const autoSelectMode: boolean = gridRef.current?.selectionSettings.autoSelectMode
                === AutoSelectMode.Default;
            const currentViewNonSelectableCount: number = isRowSelectableProp
                ? currentViewNonSelectableRows.size : 0;
            const totalCount: number = groupModule?.groupSettings?.enabled && groupModule?.groupSettings?.columns?.length ?
                expandedGroupCountRef?.current ?? 0 :
                totalRecordsCount !== 0 ? totalRecordsCount : (gridRef?.current?.pageSettings?.totalRecordsCount ?? 0);
            let totalNonSelectableCount: number = isRowSelectableProp ? nonSelectableRows.size : 0;
            const isSpaceKeyWithAllSelected: boolean = activeEvent?.current && (activeEvent.current as KeyboardEvent)?.code === 'Space'
                && unselectedRowState.current?.size === 0 && selectedRowIndexes.current?.length > 0;
            const areAllSelectedByIndexes: boolean = gridRef.current?.pageSettings?.enabled
                ? selectedRowIndexes.current?.length + currentViewNonSelectableCount === currentViewData.length
                : selectedRowIndexes.current?.length + totalNonSelectableCount === currentViewData.length || isSpaceKeyWithAllSelected;
            if (getFilteringState()) {
                const filteredRecords: T[] = (gridRef.current?.getData?.(true, false, selectedRecords) as T[]);
                selectedRecordsCount = filteredRecords.length;
                totalNonSelectableCount = isRowSelectableProp
                    ? ((!autoSelectMode && gridRef.current?.pageSettings?.enabled) || virtualSettings?.enableRow
                        ? currentViewNonSelectableRowKeys.current.length
                        : totalCount - selectedRecordsCount)
                    : 0;
            }
            const isLocalData: () => boolean = () => {
                if (autoSelectMode) {
                    // Local data: always two-state (checked/unchecked)
                    if (event?.value) {
                        return event.value;
                    } else {
                        if (getFilteringState() && !gridRef.current?.pageSettings?.enabled) {
                            const recordsCountSum: number = selectedRecordsCount + totalNonSelectableCount;
                            const allGroupRecordsSelected: boolean = recordsCountSum === totalRecordsCount;
                            const allGroupExpandedSelected: boolean = recordsCountSum === expandedGroupCountRef.current;
                            return !(allGroupRecordsSelected || allGroupExpandedSelected);
                        } else if (gridRef.current?.pageSettings?.enabled) {
                            return !(selectedRowIndexes.current.length + currentViewNonSelectableCount === currentViewData.length);
                        }
                        const isPersistCondition: boolean = selectedRecordsCount + totalNonSelectableCount === totalRecordsCount ||
                            selectedRecordsCount + totalNonSelectableCount === expandedGroupCountRef.current;
                        return isPersistSelection ? !isPersistCondition :
                            !(selectedRecordsCount === currentViewData.length);
                    }
                } else {
                    // Local data with tri-state: legacy three-state behavior
                    if (!!event && !event?.value) {
                        return event?.value;
                    } else {
                        return !areAllSelectedByIndexes;
                    }
                }
            };

            const isRemoteDataFn: () => boolean = () => {
                if (autoSelectMode) {
                    // Remote data with dual-state: two-state behavior (checked/unchecked)
                    if (event?.value !== undefined) {
                        return event.value;
                    } else {
                        return !areAllSelectedByIndexes;
                    }
                } else {
                    // Remote data with tri-state: legacy three-state behavior
                    if (!!event && !event?.value) {
                        return event?.value;
                    } else {
                        return !areAllSelectedByIndexes;
                    }
                }
            };

            return (
                (!row?.isSelected && !row?.isIntermediateState && !!event) || (isRemoteData ? isRemoteDataFn() : isLocalData())
            );
        }, [gridRef?.current, totalRecordsCount, currentViewData, selectedRowIndexes]);

    useMemo(() => {
        if (isHeaderSelectAllMode.current && gridRef.current?.selectionSettings.persistSelection
            && !isRemoteDataGrid) {
            const allLocal: T[] = currentViewData;
            for (let index: number = 0; index < allLocal.length; index++) {
                // Filter: only select selectable rows
                const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
                const rowKey: string = allLocal[parseInt(index.toString(), 10)]?.[primaryKeys[0]] ??
                    allLocal[parseInt(index.toString(), 10)]?.['flattedKey'];
                const isSelectable: boolean = isRowSelectableProp
                    ? selectableRows.get(rowKey)?.selectable ?? false : true;
                if (virtualSettings?.enableRow && index < currentViewData.length
                    && currentViewData.length > gridRef.current?.getRowsObject?.()?.length
                    && !unselectedRowState.current.has(rowKey)) {
                    if (isSelectable) { selectedRowIndexes.current.push(index); }
                    if (gridRef.current?.selectionSettings.persistSelection) {
                        updatePersistCollection(allLocal[index as number] as T, isSelectable);
                    }
                }
            }
        }
    }, [currentViewData]);

    const headerCheckBoxOnChange: (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent) => void =
        useCallback(async (row?: IRow<ColumnProps>, event?: CheckboxChangeEvent) => {
            if (totalRecordsCount <= 0 && currentViewData?.length <= 0 && !gridRef.current) { return; }
            const autoSelectMode: string = gridRef.current?.selectionSettings.autoSelectMode ?? AutoSelectMode.Default;
            const isRemoteData: boolean = (gridRef?.current?.getDataModule() as UseDataResult)?.isRemote() ||
                'result' in gridRef.current?.dataSource;
            // Compute row indexes only once
            const gridRowObjects: IRow<ColumnProps<T>>[] = gridRef.current?.getRowsObject?.() ?? [];
            const currentViewRowIndexes: number[] =
                gridRowObjects.reduce<number[]>((acc: number[], rowObject: IRow<ColumnProps<T>>) => {
                    if (!rowObject.isSelected) { acc.push(rowObject.rowIndex); }
                    return acc;
                }, []) ?? [];
            let notSelectedRowIndexes: number[] = [];
            let nonSelectableRowIndexes: number[] = [];
            isheaderClicked.current = event?.value;
            if (isRowSelectableProp) {
                // To check the selectability of the rows when partial selection is enabled.
                const result: { selectable: number[]; nonSelectable: number[]; } = filterSelectableIndices(currentViewRowIndexes);
                notSelectedRowIndexes = result.selectable;
                nonSelectableRowIndexes = result.nonSelectable;
            } else {
                notSelectedRowIndexes = nonSelectableRowIndexes = currentViewRowIndexes;
            }
            const selectCurrentPage: () => void = () => {
                if (isRemoteDataGrid) {
                    selectRowByRange?.(gridRowObjects[0]?.rowIndex, gridRowObjects?.[gridRowObjects.length - 1]?.rowIndex);
                }
                else {
                    selectRowByRange?.(0, currentViewData?.length - 1);
                }
            };
            if (shouldHeaderSelectAll(row, event, isRemoteData)) {
                // SELECT ALL action based on AutoSelectMode
                if (gridRef.current?.selectionSettings.persistSelection) {
                    isHeaderSelectAllMode.current = true;
                }
                switch (autoSelectMode) {
                case AutoSelectMode.Default:
                    if (!isRemoteData) {
                        // Local data Default mode: select all local records
                        let allLocal: (T | GroupedData<T>)[] = (await (
                            gridRef.current?.getData?.(true) as unknown as Promise<T[]>
                        ));
                        type LocalDataChildInfo = {
                            count: number;
                            currentViewData: (GroupedData<T> | T)[];
                            expandedGroups: string[];
                            collapsedGroups: string[];
                        };
                        const childInfo: LocalDataChildInfo = getGroupLayoutFlattedData(
                            allLocal as GroupedData<T>[],
                            (event: ShouldExpandGroupEvent) => {
                                return groupModule?.expandedGroups.has(event.groupKey as string)
                                    && !groupModule?.collapsedGroups.has(event.groupKey as string);
                            },
                            gridRef.current?.groupSettings,
                            groupModule.collapsedGroups
                        );
                        // const before: (GroupedData<T> | T)[] = currentViewData.slice(0, row.ariaRowIndex + 1);
                        // const after: (GroupedData<T> | T)[] = currentViewData.slice(row.ariaRowIndex + 1);
                        // setCurrentViewData?.([...before, ...childInfo.currentViewData as GroupedData<T>[], ...after] as GroupedData<T>[]);
                        allLocal = childInfo.currentViewData;
                        if (gridRef.current?.selectionSettings.persistSelection || virtualSettings?.enableRow) {
                            if (virtualSettings?.enableRow) {
                                selectedRowIndexes.current.length = 0;
                            }
                            for (let index: number = 0; index < allLocal.length; index++) {
                                // Filter: only select selectable rows
                                const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
                                const rowKey: string = allLocal[parseInt(index.toString(), 10)]?.[primaryKeys[0]];
                                const isSelectable: boolean = isRowSelectableProp
                                    ? selectableRows.get(rowKey)?.selectable ?? false : true;
                                const isDisableRowPresent: boolean = isRowSelectableProp
                                    ? !nonSelectableRowIndexes.includes(index) : true;
                                if (virtualSettings?.enableRow && !notSelectedRowIndexes.includes(index)
                                    && isDisableRowPresent && index < currentViewData.length
                                    && currentViewData.length > gridRef.current?.getRowsObject?.()?.length) {
                                    if (isSelectable) { selectedRowIndexes.current.push(index); }
                                    if (gridRef.current?.selectionSettings.persistSelection) {
                                        updatePersistCollection(allLocal[index as number] as T, isSelectable);
                                    }
                                } else if (virtualSettings.enableRow && currentViewData.length
                                    <= gridRef.current?.getRowsObject?.()?.length
                                    && gridRef.current?.selectionSettings.persistSelection) {
                                    updatePersistCollection(allLocal[index as number] as T, isSelectable);
                                } else if (!virtualSettings?.enableRow) {
                                    updatePersistCollection(allLocal[index as number] as T, isSelectable);
                                }
                            }
                        }
                        const isAllVirtualRowSelected: boolean = virtualSettings?.enableRow
                            && !notSelectedRowIndexes.length;
                        if (isAllVirtualRowSelected) {
                            updateHeaderSelectionState();
                        } else if (virtualSettings?.enableRow
                            && currentViewData.length > gridRef.current?.getRowsObject?.()?.length) {
                            addRowsToSelection(notSelectedRowIndexes, true);
                        } else {
                            selectCurrentPage();
                        }
                    } else {
                        // Remote data Default mode: activate select-all meta
                        unselectedRowState.current.clear();
                        selectCurrentPage();
                    }
                    break;
                case AutoSelectMode.Intermediate:
                    // Intermediate mode: select current page only
                    unselectedRowState.current.clear();
                    selectCurrentPage();
                    break;
                }
            } else {
                isHeaderSelectAllMode.current = false;
                unselectedRowState.current.clear();
                selectedRowState.current.clear();
                persistSelectedData.current.clear();
                clearSelection?.();
            }
        }, [currentViewData, totalRecordsCount, gridRef.current, shouldHeaderSelectAll, filterSelectableIndices]);

    return {
        clearSelection,
        clearRowSelection,
        selectRow,
        getSelectedRowIndexes,
        getSelectedRecords,
        getPersistSelectedData,
        handleGridClick,
        selectRows,
        selectRowByRange,
        addRowsToSelection,
        onCellFocus,
        updatePersistCollection,
        isRowSelectableProp,
        updateHeaderSelectionState,
        headerCheckBoxOnChange,
        isRowSelectableEval,
        getHeaderCheckboxState,
        nonSelectableRows,
        selectableRows,
        currentViewSelectableRows,
        currentViewNonSelectableRows,
        get selectedRowIndexes(): number[] { return selectedRowIndexes.current; },
        get selectedRows(): HTMLTableRowElement[] { return selectedRowsRef.current; },
        get activeTarget(): Element | null { return (activeEvent.current?.target as Element); },
        // Expose persistent selection for external usage if needed
        get selectedRowState(): Set<string> { return selectedRowState.current; },
        get persistSelectedData(): Map<string, T> { return persistSelectedData.current; },
        // Header select-all mode helpers
        get isHeaderSelectAllMode(): boolean { return isHeaderSelectAllMode.current; },
        clearAllPersistedSelection: () => { selectedRowState.current.clear(); persistSelectedData.current.clear(); },
        clearDeletedSelections: (deletedRecords: T[]) => {
            // Only remove selections for the deleted records
            for (const record of deletedRecords) {
                const primaryKeys: string[] = gridRef?.current?.getPrimaryKeyFieldNames?.();
                const key: string = record?.[primaryKeys[0]] ?? record?.['flattedKey'];
                selectedRowState.current.delete(key);
                persistSelectedData.current.delete(key);
                unselectedRowState.current.delete(key);
            }
        },
        get unselectedRowState(): Set<string> { return unselectedRowState.current; }
    };
};
