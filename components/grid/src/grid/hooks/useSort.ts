import { useCallback, RefObject, useEffect, useMemo, useState } from 'react';
import { ActionType, SortDirection } from '../types';
import { SortSettings, SortDescriptor, SortEvent, SortAPI } from '../types/sort.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { closest, isNullOrUndefined} from '@syncfusion/react-base';
import { getActualPropFromColl } from '../utils';
import { GridRef } from '../types/grid.interfaces';
import { SortProperties } from '../types/interfaces';
import { UseGroupResult } from './useGroup';

/**
 * Custom hook to manage sort state and configuration
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Reference to the grid component
 * @param {SortSettings} sortSetting - Reference to the sort settings
 * @param {Function} setGridAction - Function to update grid actions
 * @param {UseGroupResult} groupModule - The group module for group operations
 * @param {boolean} isInitialLoad - Indicates the initial loading of grid.
 * @returns {SortProperties} An object containing various sort-related state and API
 */
export const useSort: (gridRef?: RefObject<GridRef>, sortSetting?: SortSettings,
    setGridAction?: (action: SortEvent) => void, groupModule?: UseGroupResult, isInitialLoad?: boolean) => SortAPI = (
    gridRef?: RefObject<GridRef>, sortSetting?: SortSettings,
    setGridAction?: (action: SortEvent) => void, groupModule?: UseGroupResult, isInitialLoad?: boolean) => {
    const [sortSettings, setSortSettings] = useState<SortSettings>(sortSetting);
    const getSortProperties: SortProperties = useMemo(() => ({
        currentEvent: null,
        isMultiSort: false,
        sortSettings: { columns: [] },
        contentRefresh: true,
        sortedColumns: []
    }), []);

    useMemo(() => {
        const { groupSettings } = groupModule;
        if (groupSettings?.autoSort && !isInitialLoad) {
            const removalRequiredFields: string [] = groupSettings?.enabled ?
                gridRef.current?.groupSettings?.columns?.filter((field: string) => !groupSettings?.columns?.includes(field)) ?? [] :
                groupSettings?.columns;
            const combinedSortColumn: SortDescriptor[] = [];
            if (groupSettings?.enabled && groupSettings?.columns?.length) {
                for (let groupFieldIndex: number = 0; groupFieldIndex < groupSettings.columns?.length; groupFieldIndex++) {
                    const field: string = groupSettings.columns[parseInt(groupFieldIndex.toString(), 10)];
                    combinedSortColumn.push({
                        field,
                        direction: sortSettings?.columns?.find((column: SortDescriptor) => column.field === field)?.direction ??
                            SortDirection.Ascending
                    });
                }
            }
            if (sortSettings?.columns) {
                if (sortSettings?.enabled) {
                    for (let i: number = 0; i < sortSettings?.columns?.length; i++) {
                        if (!removalRequiredFields.includes(sortSettings?.columns[parseInt(i.toString(), 10)].field) &&
                            (!groupSettings?.enabled ||
                            !groupSettings.columns.includes(sortSettings?.columns[parseInt(i.toString(), 10)].field))) {
                            combinedSortColumn.push(sortSettings?.columns[parseInt(i.toString(), 10)]);
                        }
                    }
                }
            }
            setSortSettings((prev: SortSettings) => ({...prev, columns: combinedSortColumn}));
        }
    }, [groupModule?.groupSettings?.enabled, groupModule?.groupedColumns]);

    /**
     * update sortSettings properties sortModule
     */
    useEffect(() => {
        setSortSettings(sortSetting);
    }, [sortSetting]);

    const updateSortedCols: (columnName: string, isMultiSort: boolean) => void =
    useCallback((columnName: string, isMultiSort: boolean): void => {
        if (!isMultiSort) {
            getSortProperties.sortedColumns.splice(0, getSortProperties.sortedColumns.length);
        }
        if (getSortProperties.sortedColumns.indexOf(columnName) < 0) {
            getSortProperties.sortedColumns.push(columnName);
        }
    }, [getSortProperties]);

    const getSortedColsIndexByField: (field: string, sortedColumns?: SortDescriptor[]) => number = useCallback(
        (field: string, sortedColumns?: SortDescriptor[]): number => {
            const cols: SortDescriptor[] = sortedColumns ? sortedColumns : gridRef.current.sortSettings?.columns;
            for (let i: number = 0, len: number = cols.length; i < len; i++) {
                if (cols[parseInt(i.toString(), 10)].field === field) {
                    return i;
                }
            }
            return -1;
        }, [gridRef]);

    /**
     * Sorts a column with the given options.
     *
     * @param {string} field - Defines the column name to be sorted.
     * @param {SortDirection | string} direction - Defines the direction of sorting field.
     * @param {boolean} isMultiSort - Specifies whether the previous sorted columns are to be maintained.
     *
     * @returns {void}
     */
    const sortByColumn: (field: string, direction: SortDirection | string, isMultiSort: boolean) => void = useCallback(async(
        field: string, direction: SortDirection | string, isMultiSort: boolean): Promise<void> => {
        const column: ColumnProps = gridRef.current.columns.find((col: ColumnProps) => col.field === field );
        if (column.allowSort === false || gridRef.current?.sortSettings?.enabled === false) { return; }
        const sortedColumn: SortDescriptor = { field: field, direction: direction };
        let index: number;
        if (gridRef.current.sortSettings?.columns?.length) {
            getSortProperties.sortSettings.columns = gridRef.current.sortSettings?.columns;
        }
        const args: SortEvent = {
            cancel: false, field: field, direction: direction, requestType: ActionType.Sorting, action: ActionType.Sorting,
            event: getSortProperties.currentEvent, columns: getSortProperties.sortSettings.columns };
        if (getSortProperties.contentRefresh) {
            args.type = ActionType.Sorting;
            const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
            if (!isNullOrUndefined(confirmResult) && !confirmResult) {
                return;
            }
            gridRef.current.onSortStart?.(args);
            if (args.cancel) {
                return;
            }
        }
        updateSortedCols(field, isMultiSort);
        if (!isMultiSort) {
            getSortProperties.sortSettings.columns = [sortedColumn];
            column.sortDirection = direction;
            if (getSortProperties.contentRefresh) {
                setSortSettings((prev: SortSettings) =>
                    ({ ...prev,
                        columns: getSortProperties.sortSettings?.columns,
                        allowUnsort: gridRef.current.sortSettings?.allowUnsort
                    }));
                args.type = 'actionComplete';
                setGridAction(args);
            }
        } else {
            index = getSortedColsIndexByField(field);
            if (index > -1) {
                getSortProperties.sortSettings?.columns?.splice(index, 1);
            }
            column.sortDirection = direction;
            getSortProperties.sortSettings?.columns.push(sortedColumn);
            if (getSortProperties.contentRefresh) {
                setSortSettings((prev: SortSettings) =>
                    ({ ...prev,
                        columns: getSortProperties.sortSettings?.columns,
                        allowUnsort: gridRef.current.sortSettings?.allowUnsort
                    }));
                args.type = 'actionComplete';
                setGridAction(args);
            }
        }
    }, [gridRef, getSortProperties, setGridAction, updateSortedCols, getSortedColsIndexByField]);

    /**
     * Initialize sort Column when row or column count changes
     */
    useEffect(() => {
        if (gridRef.current.getColumns() && sortSettings?.columns?.length) {
            getSortProperties.contentRefresh = false;
            getSortProperties.isMultiSort = gridRef.current.sortSettings?.columns.length > 1;
            for (const col of gridRef.current.sortSettings?.columns.slice()) {
                sortByColumn(col.field, col.direction, getSortProperties.isMultiSort);
            }
            getSortProperties.isMultiSort = false;
            getSortProperties.contentRefresh = true;
        }
    }, []);

    /**
     * Sorts a column with the given options.
     *
     * @param {string} field - Defines the column field to be sorted.
     *
     * @private
     * @returns {void}
     */
    const removeSortColumn: (field: string) => void = useCallback(async(field: string): Promise<void> => {
        const cols: SortDescriptor[] = getSortProperties.sortSettings?.columns?.length ? getSortProperties.sortSettings?.columns :
            gridRef.current?.sortSettings?.columns;
        if (cols.length === 0 && getSortProperties.sortedColumns.indexOf(field) < 0) {
            return; }
        const args: SortEvent = { cancel: false, requestType: ActionType.ClearSorting, event: getSortProperties.currentEvent,
            columns: getSortProperties.sortSettings.columns, field: field, action: ActionType.ClearSorting };
        args.type = ActionType.Sorting;
        const confirmResult: boolean = await gridRef.current?.editModule?.checkUnsavedChanges?.();
        if (!isNullOrUndefined(confirmResult) && !confirmResult) {
            return;
        }
        gridRef.current.onSortStart?.(args);
        if (args.cancel) {
            return;
        }
        for (let i: number = 0, len: number = cols.length; i < len; i++) {
            if (cols[parseInt(i.toString(), 10)].field === field) {
                cols.splice(i, 1);
                getSortProperties.sortSettings.columns = cols;
                setSortSettings((prev: SortSettings) =>
                    ({ ...prev, columns: cols, allowUnsort: gridRef.current.sortSettings?.allowUnsort }));
                args.type = 'actionComplete';
                setGridAction(args);
                break;
            }
        }
    }, [gridRef, getSortProperties, setGridAction]);

    const initiateSort: (target: Element, e:  React.MouseEvent | React.KeyboardEvent, column: ColumnProps) => void = useCallback(
        (target: Element, e:  React.MouseEvent | React.KeyboardEvent, column: ColumnProps): void => {
            if (column.allowSort === false) { return; }
            const field: string = column.field;
            getSortProperties.currentEvent = e;
            const direction: SortDirection | string = !target.getElementsByClassName('sf-ascending').length ? SortDirection.Ascending :
                SortDirection.Descending;
            const { groupSettings } = groupModule;
            const isColumnGrouped: boolean = !!(groupSettings?.enabled && groupSettings?.columns?.length);
            const notGroupedSortedColumns: SortDescriptor[] = gridRef.current?.sortSettings?.columns?.filter(
                (col: SortDescriptor) => groupSettings?.columns?.indexOf(col.field) === -1);
            const notGroupedSortedColumnCount: number = notGroupedSortedColumns?.length;
            getSortProperties.isMultiSort = e.ctrlKey || isColumnGrouped;
            if (!(gridRef.current?.sortSettings?.mode === 'Multiple')) {
                getSortProperties.isMultiSort = false;
            }
            if (isColumnGrouped && !e.ctrlKey) {
                let isRemoved: boolean = false;
                for (const nonGroupedSortedCol of notGroupedSortedColumns) {
                    if ((!e.shiftKey && nonGroupedSortedCol.field !== field) || (e.shiftKey && nonGroupedSortedCol.field === field)) {
                        removeSortColumn(nonGroupedSortedCol.field);
                        isRemoved = true;
                    }
                }
                if (e.shiftKey && isRemoved) {
                    return;
                }
            }
            if ((!isColumnGrouped && e.shiftKey) || (gridRef.current.sortSettings?.allowUnsort && target.getElementsByClassName('sf-descending').length &&
               (!isColumnGrouped || (notGroupedSortedColumnCount && notGroupedSortedColumns?.find((sortColumn: SortDescriptor) =>
                   sortColumn.field === field) && direction === SortDirection.Ascending)))) {
                removeSortColumn(field);
            } else {
                sortByColumn(field, direction, getSortProperties.isMultiSort as boolean);
            }
        }, [gridRef, groupModule, getSortProperties, removeSortColumn]);

    /**
     * Handle grid-level click event
     */
    const handleGridClick: (event: React.MouseEvent) => void  = useCallback((event: React.MouseEvent): void => {
        if (!gridRef.current?.sortSettings?.enabled) { return; }
        if ((event.target as Element).closest('.sf-excel-filter')) {
            if (closest(event.target as Element, '.sf-excel-ascending') || closest(event.target as Element, '.sf-excel-descending')) {
                const colUid: string = (closest(event.target as Element, '.sf-filter-popup')).getAttribute('data-uid');
                const direction: string = isNullOrUndefined(closest(event.target as Element, '.sf-excel-descending')) ?
                    SortDirection.Ascending : SortDirection.Descending;
                const column: ColumnProps = gridRef.current.columns.find((col: ColumnProps) => col.uid === colUid );
                sortByColumn(column.field, direction, false);
            }
        } else {
            const target: Element = closest(event.target as Element, '.sf-grid-header-row .sf-cell') ??
                (event.target as Element).closest('.sf-group-chip-template');
            if (target && !(event.target as Element).classList.contains('sf-group-togglebtn')) {
                const colObj: ColumnProps = gridRef.current.columns.find((col: ColumnProps) => col.uid ===
                    (target.querySelector('.sf-grid-header-cell') || target).getAttribute('data-mappinguid'));
                if (colObj && colObj?.type !== 'checkbox') {
                    initiateSort(target, event, colObj);
                }
            }
        }
    }, [gridRef, groupModule, initiateSort, sortByColumn]);

    /**
     * Handle grid-level key-press event
     */
    const keyUpHandler: (e: React.KeyboardEvent) => void = useCallback((e: React.KeyboardEvent): void => {
        const ele: Element = e.target as Element;
        const groupChipElement: Element = (e.target as Element).closest('.sf-group-chip-template') ||
            ((e.code === 'Space' || e.code === 'Enter') ? (e.target as Element)?.querySelector('.sf-group-chip-template') : undefined);
        if ((((e.keyCode === 13 && e.ctrlKey) || (e.keyCode === 13 && e.shiftKey) || e.keyCode === 13)
            && closest(ele as Element, '.sf-grid-header-row .sf-cell')) || groupChipElement) {
            const target: Element = ele;
            if (isNullOrUndefined(target) || ((!target.classList.contains('sf-cell')
                || !target.querySelector('.sf-grid-header-cell')) && !groupChipElement)) { return; }
            const colObj: ColumnProps = gridRef.current.columns.find((col: ColumnProps) => col.uid ===
                (groupChipElement?.getAttribute?.('data-mappinguid') ||
                target.querySelector('.sf-grid-header-cell')?.getAttribute?.('data-mappinguid')));
            initiateSort(target, e, colObj);
        }
    }, [gridRef, groupModule, initiateSort]);

    /**
     * Clears all the sorted columns of the Grid.
     *
     * @returns {void}
     */
    const clearSort: (fields?: string[]) => void = useCallback((fields?: string[]): void => {
        const cols: SortDescriptor[] = getActualPropFromColl(
            gridRef.current.sortSettings?.columns as unknown as Record<string, unknown>[]
        );
        for (let i: number = 0, len: number = cols.length; i < len; i++) {
            if (isNullOrUndefined(fields) || !fields.length) {
                removeSortColumn(cols[parseInt(i.toString(), 10)].field);
            } else {
                fields.forEach((field: string) => {
                    if (cols[parseInt(i.toString(), 10)].field === field) {
                        removeSortColumn(field);
                    }
                });
            }
        }
    }, []);

    return { removeSortColumn, sortByColumn, clearSort, handleGridClick, keyUpHandler, sortSettings, setSortSettings };
};
