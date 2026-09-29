/**
 * TreeData Hook - Manages hierarchical tree data for Grid component
 * Handles two modes: nested children arrays and self-referential parent IDs
 * Manages expansion state and provides render-ready filtered data
 */

import { useState, useCallback, useEffect, useMemo, RefObject, Dispatch, SetStateAction, useRef } from 'react';
import {
    normalizeChildrenFieldData,
    normalizeParentIdData,
    flattenForRender,
    validateTreeDataModes,
    getAllTreeKeys,
    NormalizedTreeRow
} from '../utils/treeDataUtils';
import { ColumnProps, FilterSettings, GridRef, IRow, PageSettings, RowCollapseEvent, RowExpandEvent, SearchSettings, SortSettings } from '../types';
import { TreeGridRow } from '../types/treeData.interfaces';
import { DataManager, Query, QueryOptions } from '@syncfusion/react-data';


/**
 * Internal result shape returned by tree-data query processing.
 *
 * @private
 */
export type ReturnType = {
    result: Object[];
    count?: number;
    aggregates?: string;
    distinctCount?: number;
};

/**
 * Tree data configuration settings used by the internal tree-data hook.
 *
 * @private
 */
export interface TreeDataSettings {
    /** Enable tree data mode */
    enabled: boolean;
    /** Field name for nested children (Mode 1) */
    treeDataChildrenField?: string;
    /** Field name for unique ID (Mode 2) - used to identify nodes */
    treeDataIdMapping?: string;
    /** Field name for parent ID reference (Mode 2) */
    treeDataParentIdField?: string;
    /** Excludes child rows from filtered tree results */
    excludeChildrenWithFiltering?: boolean;
}

/**
 * Result object from the internal useTreeData hook.
 *
 * @private
 */
export interface UseTreeDataResult {
    /** Render-ready flat data (filtered by expansion state) */
    renderData: NormalizedTreeRow[];
    /** All normalized data (before expansion filtering) */
    normalizedData: NormalizedTreeRow[];
    /** Set of currently expanded node keys */
    expandedKeys: Set<string>;
    /** Toggle expansion state of a node */
    toggleNodeExpansion: (treeKey: string, rowData: TreeGridRow) => void;
    generateTreeData: (query: Query) => ReturnType;
}

/**
 * Hook for managing hierarchical tree data in Grid component.
 *
 * Supports two data modes:
 * - Mode 1 (Nested): Children nested in parent via field (e.g., 'children', 'teams')
 * - Mode 2 (Parent ID): Flat data with parent ID references
 *
 * Maintains expansion state as Set<string> of treeKeys, initially all expanded.
 * Provides render-ready filtered data that respects expansion state.
 *
 * @template T - Data row type
 * @param {RefObject<GridRef<T>>} [_gridRef] - Grid reference used for paging, sorting, and expansion events.
 * @param {Dispatch<SetStateAction<(TreeGridRow | T[])>>} [setCurrentViewData] - State setter for the visible data collection.
 * @param {Array<TreeGridRow | T>} [data] - Source data array in nested or parent-reference mode.
 * @param {TreeDataSettings} [settings] - Tree data configuration settings.
 * @param {PageSettings} [pageSettings] - Paging configuration for the grid.
 * @param {FilterSettings} [filterSettings] - Filter configuration for the grid.
 * @param {SortSettings} [sortSettings] - Sort configuration for the grid.
 * @param {SearchSettings} [searchSettings] - Search configuration for the grid.
 * @param {Dispatch<SetStateAction<number>>} [setTotalRecordsCount] - Total record count updater for paging.
 * @param {number} [currentPage] - Current page index used to compute visible tree pages.
 * @param {boolean} [isOffline] - Indicates whether tree data should skip normalization in offline mode.
 * @returns {UseTreeDataResult} Result object with render data, expansion methods, and utilities.
 * @private
 * @example
 * ```typescript
 * // Mode 1: Nested children
 * const data = [
 * {
 * id: 'dept-1',
 * name: 'Engineering',
 * teams: [
 * { id: 'team-1', name: 'Frontend', teams: [] }
 * ]
 * }
 * ];
 *
 * const result = useTreeData(data, {
 * enabled: true,
 * treeDataChildrenField: 'teams'
 * });
 *
 * // result.renderData contains all rows initially (all expanded)
 * // result.toggleNodeExpansion('0') collapses department, hides teams
 *
 * // Mode 2: Parent ID references
 * const flatData = [
 * { id: 1, name: 'Alice', parentId: null },
 * { id: 2, name: 'Bob', parentId: 1 }
 * ];
 *
 * const result = useTreeData(flatData, {
 * enabled: true,
 * treeDataIdMapping: 'id',
 * treeDataParentIdField: 'parentId'
 * });
 * ```
 */
export function useTreeData<T = unknown>(
    _gridRef?: RefObject<GridRef<T>>,
    setCurrentViewData?: Dispatch<SetStateAction<(TreeGridRow | T[])>>,
    data?: TreeGridRow[] | T[],
    settings?: TreeDataSettings,
    pageSettings?: PageSettings,
    filterSettings?: FilterSettings,
    sortSettings?: SortSettings,
    searchSettings?: SearchSettings,
    setTotalRecordsCount?: Dispatch<SetStateAction<number>>,
    currentPage?: number,
    isOffline?: boolean
): UseTreeDataResult {

    if (settings.enabled) {
        validateTreeDataModes(
            settings.treeDataChildrenField,
            settings.treeDataIdMapping,
            settings.treeDataParentIdField
        );
    }

    const treeKeyCollpaseCollection: RefObject<{ [key: string]: TreeGridRow[] }> = useRef<{ [key: string]: TreeGridRow[] }>({});
    const treeKeyFilterCollection: RefObject<{ [key: string]: TreeGridRow }> = useRef<{ [key: string]: TreeGridRow }>({});
    const treeKeyCollection: RefObject<{ [key: string]: TreeGridRow }> = useRef<{ [key: string]: TreeGridRow }>({});
    const parentTreeData: RefObject<TreeGridRow[]> = useRef<TreeGridRow[]>([]);
    const flatTreeData: RefObject<NormalizedTreeRow[]> = useRef<NormalizedTreeRow[]>([]);
    // Normalize data based on mode
    const normalizedData: NormalizedTreeRow[] = useMemo((): NormalizedTreeRow[] => {
        if (isOffline || !settings.enabled || !data || data.length === 0) {
            return [];
        }
        if (settings.treeDataChildrenField) {
            normalizeChildrenFieldData(
                data as TreeGridRow[],
                parentTreeData.current,
                flatTreeData.current,
                treeKeyCollection.current,
                settings.treeDataChildrenField
            );
        } else if (settings.treeDataIdMapping && settings.treeDataParentIdField) {
            normalizeParentIdData(
                data as TreeGridRow[],
                settings.treeDataParentIdField,
                settings.treeDataIdMapping,
                parentTreeData.current,
                flatTreeData.current,
                treeKeyCollection.current
            );
        }
        return flatTreeData.current.slice();
    }, [data, settings]);

    // Initialize expansion state: all nodes expanded initially
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
        return getAllTreeKeys(normalizedData);
    });

    // Update expanded keys when normalized data changes
    useEffect(() => {
        setExpandedKeys(getAllTreeKeys(normalizedData));
    }, [normalizedData]);

    // Compute render data based on expansion state
    const renderData: NormalizedTreeRow[] = useMemo((): NormalizedTreeRow[] => {
        return flattenForRender(normalizedData, expandedKeys);
    }, [normalizedData, expandedKeys]);

    const calculateChildCount: (startIndex: number, treeLevel: number, records: TreeGridRow[]) => number = useCallback(
        (startIndex: number, treeLevel: number, records: TreeGridRow[]): number => {
            let count: number = 0;
            for (let i: number = startIndex; i < records.length; i++) {
                if (
                    records[i + 1]
                    && (treeLevel === records[i + 1].treeLevel || treeLevel === (records[i + 1].treeLevel + 1))
                ) {
                    break;
                }
                count++;
            }
            return count;
        },
        []
    );

    const pageRootData: (treeDataResult: TreeGridRow[], pageData: TreeGridRow[], filterQuery?: QueryOptions[]) => void = useCallback(
        (treeDataResult: TreeGridRow[], pageData: TreeGridRow[], filterQuery?: QueryOptions[]): void => {
            for (let d: number = 0; d < pageData.length; d++) {
                const dataRow: TreeGridRow = pageData[parseInt(d.toString(), 10)];
                if ((filterQuery?.length > 0 || filterSettings?.columns.length > 0 || (searchSettings?.value && searchSettings?.value !== '')) &&
                    !treeKeyFilterCollection.current[dataRow.treeKey]) {
                    continue;
                }
                treeDataResult.push(dataRow);
                if (dataRow?.childRecords?.length && dataRow.isTreeExpanded) {
                    pageRootData(treeDataResult, dataRow.childRecords, filterQuery);
                }
            }
        }, [filterSettings, searchSettings]);

    const isChildExit: (children: TreeGridRow[]) => TreeGridRow[] = useCallback((children: TreeGridRow[]): TreeGridRow[] => {
        const childRows: TreeGridRow[] = [];
        if (_gridRef.current.excludeChildrenWithFiltering && filterSettings?.columns.length > 0) {
            for (let i: number = 0; i < children.length; i++) {
                if (children[parseInt(i.toString(), 10)].isTreeParent) {
                    childRows.push(children[parseInt(i.toString(), 10)]);
                }
            }
            return childRows;
        } else {
            return children;
        }
    }, [filterSettings]);

    /**
     * Toggle expansion state of a node
     * Does not affect children's expansion state (children maintain their own state)
     */
    const toggleNodeExpansion: (treeKey: string, rowData: TreeGridRow) => void = useCallback(
        (treeKey: string, rowData: TreeGridRow): void => {
            const pageSize: number = pageSettings?.pageSize;
            const virtualIndex: number = _gridRef.current.scrollModule.virtualRowInfo.startIndex;
            const startIndex: number = (pageSettings?.enabled ? (currentPage - 1) * pageSize : 0) + virtualIndex;
            const expandCollapseArgs: RowExpandEvent<T> | RowCollapseEvent<T> = { rowIndex: virtualIndex, data: rowData };
            (rowData.isTreeExpanded ? _gridRef.current.onRowCollapse : _gridRef.current.onRowExpand)?.(expandCollapseArgs);
            if (expandCollapseArgs.cancel) {
                return;
            }
            for (let i: number = startIndex; i < flatTreeData.current.length; i++) {
                const treeRowData: TreeGridRow = flatTreeData.current[parseInt(i.toString(), 10)];
                if (treeKey === treeRowData.treeKey) {
                    expandCollapseArgs.data = rowData;
                    if (treeRowData.isTreeExpanded) {
                        treeRowData.isTreeExpanded = false;
                        rowData.isTreeExpanded = false;
                        const level: number = treeRowData.treeLevel as number;
                        const count: number = calculateChildCount(i, level, flatTreeData.current);
                        treeKeyCollpaseCollection.current[`${treeKey}`] = flatTreeData.current.splice(i + 1, count);
                    } else {
                        treeRowData.isTreeExpanded = true;
                        rowData.isTreeExpanded = true;
                        if ( treeKeyCollpaseCollection.current[`${treeKey}`]
                            && treeKeyCollpaseCollection.current[`${treeKey}`].length) {
                            flatTreeData.current.splice(
                                i + 1,
                                0,
                                ...(treeKeyCollpaseCollection.current[`${treeKey}`] as NormalizedTreeRow[])
                            );
                        } else {
                            // eslint-disable-next-line security/detect-object-injection
                            const childRows: NormalizedTreeRow[] = isChildExit(
                                treeRowData[settings.treeDataChildrenField]) as NormalizedTreeRow[];
                            treeKeyCollpaseCollection.current[`${treeKey}`] = childRows;
                            flatTreeData.current.splice(
                                i + 1,
                                0,
                                ...(treeKeyCollpaseCollection.current[`${treeKey}`] as NormalizedTreeRow[])
                            );
                        }
                    }
                    _gridRef.current.cachedRowObjects.current = new Map<number, IRow<ColumnProps<T>>>();
                    break;
                }
            }
            if (_gridRef.current.pageSettings.enabled) {
                const skip: number = currentPage <= 1 ? 0 : (currentPage - 1) * pageSize;
                if (_gridRef.current.pageSettings.pageSizeMode === 'Root') {
                    const parentQuery: Query = new Query().where('treeLevel', 'equal', 0);
                    const parentPage: TreeGridRow[] = new DataManager(flatTreeData.current).executeLocal(parentQuery);
                    const tempPage: TreeGridRow[] = parentPage.slice(skip, skip + pageSize);
                    const treeDataResult: TreeGridRow[] = [];
                    pageRootData(treeDataResult, tempPage);
                    setCurrentViewData(treeDataResult);
                    setTotalRecordsCount(parentPage.length);
                } else {
                    setCurrentViewData(flatTreeData.current.slice(skip, skip + pageSize));
                    setTotalRecordsCount(flatTreeData.current.length);
                }
            } else {
                setCurrentViewData([...flatTreeData.current]);
            }
            setExpandedKeys((prev: Set<string>): Set<string> => {
                const newSet: Set<string> = new Set(prev);
                if (newSet.has(treeKey)) {
                    newSet.delete(treeKey);
                } else {
                    newSet.add(treeKey);
                }
                return newSet;
            });
        }, [flatTreeData, pageSettings, currentPage, filterSettings, searchSettings]);

    const iterateChildSort: (treeDataResult: TreeGridRow[], children: TreeGridRow[], query: Query, filterQuery: QueryOptions[]) => void =
        useCallback((treeDataResult: TreeGridRow[], children: TreeGridRow[], query: Query, filterQuery: QueryOptions[]): void => {
            for (let d: number = 0; d < children.length; d++) {
                if ((filterQuery.length > 0 || filterSettings?.columns.length > 0 || (searchSettings?.value && searchSettings?.value !== '')) &&
                    !treeKeyFilterCollection.current[children[parseInt(d.toString(), 10)].treeKey]) {
                    continue;
                }
                treeDataResult.push(children[parseInt(d.toString(), 10)]);
                if ((children[parseInt(d.toString(), 10)] as TreeGridRow).childRecords?.length) {
                    const childSort: TreeGridRow[] = new DataManager(
                        (children[parseInt(d.toString(), 10)] as TreeGridRow).childRecords).executeLocal(query);
                    iterateChildSort(treeDataResult, childSort, query, filterQuery);
                }
            }
        }, [filterSettings, searchSettings]);

    const addChildRecords: (filteredRowData: TreeGridRow, treeDataResult: TreeGridRow[]) => void = useCallback(
        (filteredRowData: TreeGridRow, treeDataResult: TreeGridRow[]): void => {
            for (let c: number = 0; c < filteredRowData.childRecords?.length; c++) {
                const childRowData: TreeGridRow = filteredRowData.childRecords[parseInt(c.toString(), 10)];
                if (treeDataResult.indexOf(childRowData) === -1) {
                    if (childRowData.isTreeParent || (!childRowData.isTreeParent && !_gridRef.current.excludeChildrenWithFiltering)) {
                        treeDataResult.push(childRowData);
                        treeKeyFilterCollection.current[childRowData.treeKey] = childRowData;
                    }
                    if (childRowData.isTreeParent) {
                        addChildRecords(childRowData, treeDataResult);
                    }
                }
            }
        }, []);

    const addParentRecord: (filteredRowData: TreeGridRow, treeDataResult: TreeGridRow[]) => void = useCallback(
        (filteredRowData: TreeGridRow, treeDataResult: TreeGridRow[]): void => {
            if (filteredRowData.treeParentKey) {
                const rowData: TreeGridRow = treeKeyCollection.current[filteredRowData.treeParentKey];
                addParentRecord(rowData, treeDataResult);
            }
            if (treeDataResult.indexOf(filteredRowData) === -1) {
                treeDataResult.push(filteredRowData);
                treeKeyFilterCollection.current[filteredRowData.treeKey] = filteredRowData;
            }
        }, []);

    const generateTreeData: (query: Query) => ReturnType = useCallback((query: Query): ReturnType => {
        let treeDataResult: Object[] = normalizedData.slice();
        let parentData: TreeGridRow[] = parentTreeData.current;
        let count: number = 0;
        const sortQuery: QueryOptions[] = query.queries.filter((q: QueryOptions) => q.fn === 'onSortBy');
        const filterQuery: QueryOptions[] = query.queries.filter((q: QueryOptions) => q.fn === 'onWhere');
        const searchQuery: QueryOptions[] = query.queries.filter((q: QueryOptions) => q.fn === 'onSearch');

        if ((filterSettings?.enabled && filterSettings?.columns.length) ||
            (searchSettings?.enabled && searchSettings?.value.length > 0)
            || ((filterQuery && filterQuery.length > 0) || (searchQuery && searchQuery.length > 0))) {
            treeKeyCollpaseCollection.current = {};
            treeKeyFilterCollection.current = {};
            const queryTemp: Query = new Query();
            queryTemp.queries = filterQuery.concat(searchQuery);
            const filteredData: Object[] = new DataManager(treeDataResult).executeLocal(queryTemp);
            treeDataResult = [];
            for (let f: number = 0; f < filteredData.length; f++) {
                const filteredRowData: TreeGridRow = filteredData[parseInt(f.toString(), 10)];
                addParentRecord(filteredRowData, treeDataResult);
                if (filteredRowData.isTreeParent && !settings.excludeChildrenWithFiltering) {
                    addChildRecords(filteredRowData, treeDataResult);
                }
            }
        }
        if (sortSettings?.columns.length > 0 || sortQuery.length) {
            treeKeyCollpaseCollection.current = {};
            const queryTemp: Query = new Query();
            queryTemp.queries = sortQuery;
            treeDataResult = [];
            parentData = new DataManager(parentTreeData.current).executeLocal(queryTemp);
            iterateChildSort(treeDataResult, parentData, queryTemp, filterQuery);
        }

        let visualData: TreeGridRow[] = [];
        if (expandedKeys.size !== treeDataResult.length) {
            for (let i: number = 0; i < treeDataResult.length; i++) {
                visualData.push(treeDataResult[parseInt(i.toString(), 10)]);
                if (!(treeDataResult[parseInt(i.toString(), 10)] as TreeGridRow).isTreeExpanded) {
                    const isExpandRow: TreeGridRow = treeDataResult[parseInt(i.toString(), 10)];
                    const level: number = (isExpandRow as TreeGridRow).treeLevel as number;
                    const count: number = calculateChildCount(i, level, treeDataResult);
                    treeKeyCollpaseCollection.current[isExpandRow.treeKey] = treeDataResult.splice(i + 1, count);
                }
            }
        } else {
            visualData = treeDataResult;
        }
        treeDataResult = visualData;
        count = visualData.length;
        const pageQuery: QueryOptions[] = query.queries.filter((q: QueryOptions) => q.fn === 'onPage');
        if (pageSettings.enabled && pageQuery.length) {
            const queryTemp: Query = new Query();
            queryTemp.queries = pageQuery;
            let pageData: Object[] = [];
            if (pageSettings.pageSizeMode === 'Root') {
                const parentQuery: Query = new Query().where('treeLevel', 'equal', 0);
                const tempPage: TreeGridRow[] =  new DataManager(visualData).executeLocal(parentQuery);
                count = tempPage.length;
                pageData = new DataManager(tempPage).executeLocal(queryTemp);
                treeDataResult = [];
                pageRootData(treeDataResult, pageData, filterQuery);
            } else {
                treeDataResult = new DataManager(visualData).executeLocal(queryTemp);
            }
        }
        flatTreeData.current = visualData as NormalizedTreeRow[];
        return { result: treeDataResult, count: count } as ReturnType;

    }, [_gridRef, expandedKeys, flatTreeData, normalizedData, parentTreeData, filterSettings, sortSettings, pageSettings]);

    return {
        renderData,
        normalizedData,
        expandedKeys,
        toggleNodeExpansion,
        generateTreeData
    };
}

export { useTreeData as TreeDataModule };
