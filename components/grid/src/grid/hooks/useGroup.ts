import { useCallback, useState, RefObject, Dispatch, SetStateAction, useRef, useMemo } from 'react';
import { GridRef, IGridBase, RowInfo } from '../types/grid.interfaces';
import { ActionType, GroupType, ScrollMode } from '../types/enum';
import { getExpandedCountBeforePage, getGroupLayoutFlattedData, updatePageWiseStartEndIndexes } from '../utils';
import { ColumnProps, IRow, VirtualizationSettings, GroupSettings, IGroupModule, GroupedData, ShouldExpandGroupEvent, OnGroupArgs,
    ChildInfoResult } from '../types';
import { isNullOrUndefined } from '@syncfusion/react-base';

/**
 * Action type constants for group operations
 */
const GROUP_ACTION_EXPAND: 'expand' = 'expand' as const;
const GROUP_ACTION_COLLAPSE: 'collapse' = 'collapse' as const;
const GROUP_ACTION_EXPAND_ALL: 'expandall' = 'expandall' as const;
const GROUP_ACTION_COLLAPSE_ALL: 'collapseall' = 'collapseall' as const;
const GROUP_ACTION_ADD: 'add' = 'add' as const;
const GROUP_ACTION_REMOVE: 'remove' = 'remove' as const;
const GROUP_ACTION_REMOVE_ALL: 'removeall' = 'removeall' as const;
const GROUP_ACTION_REFRESH: 'refresh' = 'refresh' as const;

/**
 * Return type for useGroup hook
 *
 * @template T - Data type of grid rows
 * @private
 */
export interface UseGroupResult<T = unknown> extends IGroupModule {
    /** Set of currently expanded group keys */
    expandedGroups: Set<string>;
    /** Set of currently collapsed group keys */
    collapsedGroups: Set<string>;
    /** All currently grouped column field names (ordered) */
    groupedColumns: string[];
    fieldBasedExpandedGroupKeysRef: RefObject<Map<string, Set<string>>>;
    fieldBasedCollapsedGroupKeysRef: RefObject<Map<string, Set<string>>>;
    /** Toggle a single group row expanded/collapsed. Updates expandedGroupCountRef based on rowObject.items.length */
    toggleGroup: (rowObject: RowInfo<T>) => void;
    /** Determine if a group key is expanded */
    isGroupExpanded: (key: string, field?: string) => boolean;
    /** Current groupSettings snapshot */
    groupSettings: GroupSettings;
    /** Internal: update grouped columns list */
    setGroupedColumns: (columns: string[]) => void;
    /** Internal: update expanded groups Set */
    setExpandedGroups: Dispatch<SetStateAction<Set<string>>>;
    /** Internal: update collapsed groups Set */
    setCollapsedGroups: Dispatch<SetStateAction<Set<string>>>;
    /** Ref for the group drop area element, used for height calculations in Render */
    groupDropAreaRef: RefObject<HTMLDivElement>;
}

/**
 * Custom hook to manage grouping state, expansion/collapse, and GroupModule API methods.
 *
 * CRITICAL: No DataManager instantiation. Delegates to useData.generateQuery() only.
 * Methods exposed directly from gridRef (not nested). defaultExpanded applies on mount only.
 * Triggers setGridAction to notify useRender for onGroup event emission (like sort/filter pattern).
 *
 * @private
 * @param {RefObject<GridRef>} _gridRef - Reference to the grid component
 * @param {GroupSettings} groupSettingsProp - Current groupSettings prop from Grid
 * @param {Function} setGridAction - Function to trigger grid action for event emission
 * @param {Dispatch<SetStateAction<GroupedData[]>>} setCurrentViewData - Setter for current view data
 * @param {(GroupedData | Object)[]} currentViewData - Current view data array
 * @param {Dispatch<SetStateAction<Map<number, (Object | GroupedData)>>>} setVirtualCachedViewData -
 * Setter for virtual cached view data
 * @param {VirtualizationSettings} virtualizationSettings - Virtualization configuration settings
 * @param {RefObject<Map<number, number>>} loadedPageWiseGroupExpandedCountRef - Page-wise expanded count ref
 * @param {RefObject<Map<number, {startIndex: number, endIndex: number}>>} loadedPageWiseVirtualGroupStartEndRowIndexes - Page-wise start and end row index ref
 * @param {Map<number, GroupedData<Object>[]>} pageWiseGroupResponseViewData - Current grouped response data for server operations
 * @param {number} totalRecordCount - Total record count for server operations
 * @param {Partial<IGridBase>} gridProps - Current grid props for context
 * @param {Function} setCurrentPage - State Dispatch Function to update grid currentPage
 * @param {RefObject<ColumnProps[]>} uiColumns - Ref to current UI columns for access in callbacks
 * @param {Dispatch<SetStateAction<object>>} setColumnChooserState - change column visibility for multiplecolumns type state change
 * @returns {UseGroupResult} UseGroupResult containing state and API methods
 */
export const useGroup: <T = unknown>(
    _gridRef?: RefObject<GridRef<T>>,
    groupSettingsProp?: GroupSettings,
    setGridAction?: (action: OnGroupArgs & { requestType: ActionType }) => void,
    setCurrentViewData?: Dispatch<SetStateAction<GroupedData<T>[]>>,
    currentViewData?: (GroupedData<T> | T)[],
    setVirtualCachedViewData?: Dispatch<SetStateAction<Map<number, (T | GroupedData<T>)>>>,
    virtualizationSettings?: VirtualizationSettings,
    loadedPageWiseGroupExpandedCountRef?: RefObject<Map<number, number>>,
    loadedPageWiseVirtualGroupStartEndRowIndexes?: RefObject<Map<number, {
        startIndex: number;
        endIndex: number;
    }>>,
    pageWiseGroupResponseViewData?: Map<number, GroupedData<T>[]>,
    totalRecordCount?: number,
    gridProps?: Partial<IGridBase<T>>,
    setCurrentPage?: Dispatch<SetStateAction<number>>,
    uiColumns?: RefObject<ColumnProps<T>[]>,
    setColumnChooserState?: Dispatch<SetStateAction<object>>
) => UseGroupResult<T> = <T = unknown>(
    _gridRef?: RefObject<GridRef<T>>,
    groupSettingsProp?: GroupSettings,
    setGridAction?: (action: OnGroupArgs & { requestType: ActionType, name?: string }) => void,
    setCurrentViewData?: Dispatch<SetStateAction<GroupedData<T>[]>>,
    currentViewData?: (GroupedData<T> | T)[],
    setVirtualCachedViewData?: Dispatch<SetStateAction<Map<number, (T | GroupedData<T>)>>>,
    virtualizationSettings?: VirtualizationSettings,
    loadedPageWiseGroupExpandedCountRef?: RefObject<Map<number, number>>,
    loadedPageWiseVirtualGroupStartEndRowIndexes?: RefObject<Map<number, {
        startIndex: number;
        endIndex: number;
    }>>,
    pageWiseGroupResponseViewData?: Map<number, GroupedData<T>[]>,
    totalRecordCount?: number,
    gridProps?: Partial<IGridBase<T>>,
    setCurrentPage?: Dispatch<SetStateAction<number>>,
    uiColumns?: RefObject<ColumnProps<T>[]>,
    setColumnChooserState?: Dispatch<SetStateAction<object>>
): UseGroupResult<T> => {
    const [groupSettings, setGroupSettings] = useState<GroupSettings>(groupSettingsProp);
    const [groupedColumns, setGroupedColumns] = useState<string[]>(groupSettingsProp?.columns);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set<string>());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set<string>());
    const fieldBasedExpandedGroupKeysRef: RefObject<Map<string, Set<string>>> =
        useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());
    const fieldBasedCollapsedGroupKeysRef: RefObject<Map<string, Set<string>>> =
        useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());
    const groupDropAreaRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);

    /**
     * Sync groupSettings when prop changes (controlled mode).
     */
    useMemo(() => {
        setGroupSettings(groupSettingsProp);
        if (_gridRef.current?.groupSettings?.type !== groupSettingsProp?.type && uiColumns?.current && groupSettingsProp?.enabled &&
            groupSettingsProp?.columns?.length && groupSettingsProp?.type === GroupType.MultipleColumns) {
            uiColumns.current.forEach((uiColumn: ColumnProps<T>) => {
                if (groupSettingsProp?.columns?.includes(uiColumn.field)) {
                    uiColumn.visible = true;
                }
            });
            setColumnChooserState({});
        }
        if (groupSettingsProp?.enabled !== groupSettings?.enabled) {
            setGridAction?.({ requestType: ActionType.Refresh, action: GROUP_ACTION_REFRESH, name: 'onActionComplete' });
        }
    }, [groupSettingsProp]);

    /**
     * Sync groupedColumns when prop changes (initial prop or controlled update).
     */
    useMemo(() => {
        if (groupSettingsProp?.enabled && (groupSettingsProp?.columns?.length !== groupedColumns?.length ||
            groupSettingsProp.columns.find((field: string) => !groupedColumns?.includes(field)))) {
            setGroupedColumns(groupSettingsProp.columns);
            setGridAction?.({ requestType: ActionType.Refresh, action: GROUP_ACTION_REFRESH, name: 'onActionComplete' });
        }
    }, [groupSettingsProp?.columns]);

    const triggerStartEvent: (args: OnGroupArgs & { requestType: ActionType, cancel: boolean }) => Promise<boolean> =
        useCallback(async (args: OnGroupArgs & { requestType: ActionType, cancel: boolean }): Promise<boolean> => {
            const confirmResult: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
                virtualizationSettings?.scrollMode === ScrollMode.Infinite ? true :
                await _gridRef.current?.editModule?.checkUnsavedChanges?.();
            gridProps?.onGroupStart?.(args);
            if (args.cancel || !confirmResult) { return false; }
            delete args.cancel;
            return true;
        }, [gridProps?.onGroupStart]);

    /**
     * Determines if a group at a given key is currently expanded.
     * Priority:
     * 1. If collapsedGroups has key → collapsed
     * 2. If expandedGroups has key → expanded
     * 3. Fall back to groupSettings.defaultExpanded initial state
     *
     * @param key - Unique group identifier (e.g., "level0-USA", "level1-USA-ALFKI")
     */
    const isGroupExpanded: (key: string, field?: string) => boolean = useCallback((key: string, _field?: string): boolean => {
        if (expandedGroups.has('ALL')) { return true; }
        if (collapsedGroups.has('ALL')) { return false; }
        if (collapsedGroups.has(key)) { return false; }
        if (expandedGroups.has(key)) { return true; }

        // if (field && fieldBasedExpandedGroupKeysRef.current?.get(field)?.has('ALL')) { return true; }
        // if (field && fieldBasedCollapsedGroupKeysRef.current?.get(field)?.has('ALL')) { return false; }
        // if (field && fieldBasedCollapsedGroupKeysRef.current?.get(field)?.has(key)) { return false; }
        // if (field && fieldBasedExpandedGroupKeysRef.current?.get(field)?.has(key)) { return true; }
        return false;
    }, [expandedGroups, collapsedGroups, groupSettings?.defaultExpanded, currentViewData]);

    /**
     * Toggle expansion state for a single group.
     * Used by user interactions (click, keyboard) – does NOT affect defaultExpanded logic.
     * Updates expandedGroupCountRef on toggle action based on rowObject.items.length.
     *
     * @param rowObject - Group row object (GroupedData<T>) containing key and items array
     */
    const toggleGroup: (rowObject: RowInfo<T>) => void = useCallback(async (rowObject: RowInfo<T>): Promise<void> => {
        const row: RowInfo<T> = rowObject;
        const rowData: GroupedData<T> = rowObject.data as GroupedData<T>;
        const key: string = String(rowData.flattedKey);
        const currentlyExpanded: boolean = isGroupExpanded(key, rowData.field);
        const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
            requestType: ActionType.Grouping,
            action: currentlyExpanded ? GROUP_ACTION_COLLAPSE : GROUP_ACTION_EXPAND,
            rowData,
            cancel: false
        };
        if (!await triggerStartEvent(args) || !groupedColumns?.length) { return; }
        const collapsedGroupArray: string[] = !currentlyExpanded ?
            Array.from(collapsedGroups) : [];
        if (!currentlyExpanded) {
            collapsedGroupArray.splice(collapsedGroupArray.indexOf(key), 1);
        }
        const childInfo: ChildInfoResult<T> =
            getGroupLayoutFlattedData(
                rowData.items as GroupedData<T>[],
                (event: ShouldExpandGroupEvent): boolean => {
                    return expandedGroups.has('ALL') ? event.groupKey !== key : (collapsedGroups.has('ALL') ? event.groupKey === key :
                        (expandedGroups.has(event.groupKey as string) && !collapsedGroups.has(event.groupKey as string)));
                },
                groupSettings,
                !currentlyExpanded ? new Set(collapsedGroupArray) : collapsedGroups,
                // false,
                key
            );
        const itemCount: number = childInfo?.currentViewData?.length;
        const nextRowObjects: Map<string | number, IRow<ColumnProps<T>>> =
            new Map(_gridRef.current?.cachedRowObjects?.current);

        const getExpandCollapseRowPage: () => number = (): number => {
            let currentPage: number | undefined;
            const activePages: number[] = _gridRef.current?.scrollModule?.virtualRowInfo?.currentPages;
            for (let page: number = 0; page < activePages.length; page++) {
                currentPage = activePages[page as number];
                const pageExpandCountMap: Map<number, number> = loadedPageWiseGroupExpandedCountRef.current as Map<number, number>;
                const loadedPageExpandedCount: number = (pageExpandCountMap?.get(currentPage) as number) ?? 0;
                const expandedRowCount: number =
                    getExpandedCountBeforePage(currentPage, groupSettings, loadedPageWiseGroupExpandedCountRef) + loadedPageExpandedCount;
                const endIndex: number = (currentPage * _gridRef.current?.pageSettings?.pageSize) + expandedRowCount;
                if (!isNaN(expandedRowCount) && row.ariaRowIndex < endIndex) {
                    return currentPage;
                }
            }
            return currentPage && currentPage > 0 ? currentPage : _gridRef.current?.pageSettings?.currentPage;
        };
        if (currentlyExpanded) {
            const collapsedRowPage: number = getExpandCollapseRowPage();
            const prevExpandedCount: number = loadedPageWiseGroupExpandedCountRef.current?.get(collapsedRowPage);
            if (!isNullOrUndefined(prevExpandedCount) && prevExpandedCount && prevExpandedCount >= itemCount && collapsedRowPage > 0) {
                loadedPageWiseGroupExpandedCountRef.current?.set(collapsedRowPage, prevExpandedCount - itemCount);
            }
        } else {
            const expandRowPage: number = getExpandCollapseRowPage();
            const prevExpandedCount: number = loadedPageWiseGroupExpandedCountRef.current?.get(expandRowPage);
            if (!isNullOrUndefined(prevExpandedCount) && expandRowPage > 0) {
                loadedPageWiseGroupExpandedCountRef.current?.set(expandRowPage, prevExpandedCount + itemCount);
            }
        }
        const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite;
        if (isVirtualOrInfinite) {
            loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
        }
        if (currentlyExpanded) {
            // Collapsing: remove child items from currentViewData
            currentViewData.splice(row.ariaRowIndex + 1, itemCount);
            setCurrentViewData?.([...currentViewData] as GroupedData<T>[]);
            if (isVirtualOrInfinite) {
                setVirtualCachedViewData?.((prev: Map<number, T | GroupedData<T>>) => {
                    const next: Map<number, (T | GroupedData<T>)> = new Map(prev);
                    for (let i: number = row.ariaRowIndex + 1; i <= row.ariaRowIndex + itemCount; i++) {
                        next.delete(i);
                    }
                    const keys: number[] = Array.from(prev.keys());
                    for (let i: number = row.ariaRowIndex + itemCount + 1; i <= keys?.[keys.length - 1]; i++) {
                        const shiftedData: T | GroupedData<T> = next.get(i);
                        if (shiftedData) {
                            next.set(i - itemCount, shiftedData);
                            next.delete(i);
                        }
                    }
                    return next;
                });
                nextRowObjects?.get(row.ariaRowIndex)?.setRowObject((prev: IRow<ColumnProps<T>>) => ({...prev, isExpand: false}));
                for (let i: number = row.ariaRowIndex + 1; i <= row.ariaRowIndex + itemCount; i++) {
                    _gridRef.current.totalRenderedRowHeight.current -= (nextRowObjects?.get(i)?.height ?? 0);
                    nextRowObjects.delete(i);
                }
                const oldRowObjectKeys: number[] = (Array.from(
                    _gridRef?.current?.cachedRowObjects?.current?.keys()
                ) as number[]).sort((a: number, b: number): number => a - b);
                for (let i: number = row.ariaRowIndex + itemCount + 1; i <= oldRowObjectKeys?.[oldRowObjectKeys?.length - 1]; i++) {
                    const shiftedData: IRow<ColumnProps<T>> = nextRowObjects.get(i);
                    if (shiftedData) {
                        nextRowObjects.set(i - itemCount, shiftedData);
                        nextRowObjects.delete(i);
                    }
                }
                _gridRef.current.cachedRowObjects.current = nextRowObjects;
                // _gridRef.current.scrollModule.isDataOperationPreventVirtualCache.current = true;
            }
        } else {
            // Insert children immediately after the toggled group
            const before: (GroupedData<T> | T)[] = currentViewData.slice(0, row.ariaRowIndex + 1);
            const after: (GroupedData<T> | T)[] = currentViewData.slice(row.ariaRowIndex + 1);
            setCurrentViewData?.([...before, ...childInfo.currentViewData as GroupedData<T>[], ...after] as GroupedData<T>[]);
            if (isVirtualOrInfinite) {
                setVirtualCachedViewData?.((prev: Map<number, T | GroupedData<T>>) => {
                    const next: Map<number, (T | GroupedData<T>)> = new Map(prev);
                    for (let i: number = row.ariaRowIndex + 1; i <= row.ariaRowIndex + itemCount; i++) { //, indexExpandCount: number = 0
                        const data: T | GroupedData<T> = childInfo.currentViewData[i - row.ariaRowIndex - 1];
                        if (data) {
                            next.set(i, data);
                        }
                    }
                    const keys: number[] = Array.from(prev.keys());
                    for (let i: number = row.ariaRowIndex + 1; i <= keys?.[keys.length - 1]; i++) {
                        const shiftedData: T | GroupedData<T> = prev.get(i);
                        if (shiftedData) {
                            next.set(i + itemCount, shiftedData);
                        }
                    }
                    return next;
                });
                for (let i: number = row.ariaRowIndex + 1; i < _gridRef.current?.cachedRowObjects?.current?.size; i++) {
                    const shiftedData: IRow<ColumnProps<T>> = _gridRef.current?.cachedRowObjects?.current?.get(i);
                    if (shiftedData) {
                        nextRowObjects.set(i + itemCount, shiftedData);
                    }
                }
                nextRowObjects?.get(row.ariaRowIndex)?.setRowObject((prev: IRow<ColumnProps<T>>) => ({...prev, isExpand: true}));
                for (let i: number = row.ariaRowIndex + 1; i <= row.ariaRowIndex + itemCount; i++) {
                    const shiftedData: IRow<ColumnProps<T>> = nextRowObjects?.get(i);
                    if (shiftedData) {
                        if (_gridRef.current.cachedRowObjects.current?.size >= nextRowObjects.size) {
                            _gridRef.current.totalRenderedRowHeight.current -= (shiftedData.height ?? 0);
                        }
                        nextRowObjects?.delete(i);
                    }
                }
                _gridRef.current.cachedRowObjects.current = nextRowObjects;
            }
        }
        if (currentlyExpanded) {
            // Collapsing: subtract count from expandedGroupCountRef
            if (_gridRef?.current?.expandedGroupCountRef && itemCount > 0) {
                _gridRef.current.expandedGroupCountRef.current -= itemCount;
            }
            if (rowData?.field) {
                const existingCollapsedFieldKeys: Set<string> = fieldBasedCollapsedGroupKeysRef.current?.get(rowData?.field) ||
                    new Set<string>();
                const existingExpandedFieldKeys: Set<string> = fieldBasedExpandedGroupKeysRef.current?.get(rowData?.field) ||
                    new Set<string>();
                existingCollapsedFieldKeys.delete('ALL');
                fieldBasedCollapsedGroupKeysRef.current?.set(rowData?.field, new Set<string>([...existingCollapsedFieldKeys, key]));
                existingExpandedFieldKeys.delete(key);
                existingExpandedFieldKeys.delete('ALL');
                fieldBasedExpandedGroupKeysRef.current?.set(rowData?.field, existingExpandedFieldKeys);
            }
            setCollapsedGroups((prev: Set<string>) => {
                const next: Set<string> = new Set(prev).add(key);
                next.delete('ALL'); return next;
            });
            setExpandedGroups((prev: Set<string>) => {
                const next: Set<string> = new Set(prev); next.delete(key); next.delete('ALL'); return next;
            });
        } else {
            // Expanding: add count to expandedGroupCountRef
            if (_gridRef?.current?.expandedGroupCountRef && itemCount > 0) {
                _gridRef.current.expandedGroupCountRef.current += itemCount;
            }
            if (rowData?.field) {
                const existingExpandedFieldKeys: Set<string> = fieldBasedExpandedGroupKeysRef.current?.get(rowData?.field) ||
                    new Set<string>();
                const existingCollapsedFieldKeys: Set<string> = fieldBasedCollapsedGroupKeysRef.current?.get(rowData?.field) ||
                    new Set<string>();
                existingExpandedFieldKeys.delete('ALL');
                fieldBasedExpandedGroupKeysRef.current?.set(rowData?.field, new Set<string>([...existingExpandedFieldKeys, key]));
                existingCollapsedFieldKeys.delete(key);
                existingCollapsedFieldKeys.delete('ALL');
                fieldBasedExpandedGroupKeysRef.current?.set(rowData?.field, existingCollapsedFieldKeys);
            }
            setExpandedGroups((prev: Set<string>) => {
                const next: Set<string> = new Set(prev).add(key);
                next.delete('ALL'); return next;
            });
            setCollapsedGroups((prev: Set<string>) => {
                const next: Set<string> = new Set(prev); next.delete(key); next.delete('ALL'); return next;
            });
        }
        setGridAction?.(args);
    }, [isGroupExpanded, _gridRef, groupedColumns, setCurrentViewData, currentViewData, setVirtualCachedViewData, virtualizationSettings,
        loadedPageWiseGroupExpandedCountRef, pageWiseGroupResponseViewData, totalRecordCount, setGridAction]);

    /**
     * Expand all groups (clears collapsed Set, marks expanded Set as "all").
     * Triggers setGridAction to notify useRender for onGroup event emission.
     */
    const expandAll: () => void = useCallback(async(): Promise<void> => {
        const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
            requestType: ActionType.Grouping,
            action: GROUP_ACTION_EXPAND_ALL,
            cancel: false
        };
        if (!await triggerStartEvent(args) || !groupedColumns?.length || expandedGroups.has('ALL')) { return; }
        const childInfo: ChildInfoResult<T> =
            getGroupLayoutFlattedData(
                pageWiseGroupResponseViewData.get(_gridRef.current?.pageSettings?.currentPage),
                (): boolean => {
                    return true;
                },
                groupSettings
            );
        groupedColumns.forEach((field: string) => {
            const collapsedKeys: Set<string> = childInfo.fieldBasedCollapsedGroupKeys.get(field);
            if (collapsedKeys?.size) {
                fieldBasedCollapsedGroupKeysRef?.current?.set(field, collapsedKeys);
            }
            const expandedKeys: Set<string> = childInfo.fieldBasedExpandedGroupKeys.get(field);
            if (expandedKeys?.size) {
                fieldBasedExpandedGroupKeysRef?.current?.set(field, new Set(['ALL', ...expandedKeys]));
            }
        });
        setCollapsedGroups(new Set<string>(childInfo.collapsedGroups));
        setExpandedGroups(new Set<string>(['ALL', ...childInfo.expandedGroups]));
        setCurrentViewData?.(childInfo.currentViewData as GroupedData<T>[]);
        const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite;
        const { pageSettings } = _gridRef.current;
        const newMap: Map<number, T> = new Map<number, T>();
        let totalVirtualCount: number = 0;
        for (let currentPage: number = 1; currentPage <= loadedPageWiseVirtualGroupStartEndRowIndexes.current?.size; currentPage++) {
            const groupedPageData: GroupedData<T>[] = pageWiseGroupResponseViewData.get(currentPage);
            if (groupedPageData) {
                const childInfo: ChildInfoResult<T> =
                getGroupLayoutFlattedData(
                    groupedPageData,
                    (): boolean => {
                        return true;
                    },
                    groupSettings
                );
                loadedPageWiseGroupExpandedCountRef.current?.set(currentPage, childInfo.count);
                const startKey: number = loadedPageWiseGroupExpandedCountRef.current?.get(currentPage - 1) ?? 0 +
                    (currentPage - 1) * pageSettings.pageSize;
                for (let i: number = 0; i < childInfo.currentViewData.length; i++) {
                    const item: T | GroupedData<T> = childInfo.currentViewData[i as number] as T;
                    newMap.set(startKey + i, item);
                }
                totalVirtualCount += childInfo.currentViewData?.length;
            } else {
                loadedPageWiseGroupExpandedCountRef.current?.delete(currentPage);
                totalVirtualCount += pageSettings.pageSize;
            }
        }
        _gridRef.current.expandedGroupCountRef.current = isVirtualOrInfinite ? totalVirtualCount :
            childInfo.currentViewData.length;
        if (isVirtualOrInfinite) {
            loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
            setVirtualCachedViewData(newMap);
        }
        const prevCacheRowObjectKeys: (string | number)[] = [..._gridRef.current?.cachedRowObjects?.current?.keys()];
        for (let index: number = 0; index < prevCacheRowObjectKeys?.length; index++) {
            const rowObject: IRow<ColumnProps<T>> =
                _gridRef.current?.cachedRowObjects?.current?.get(prevCacheRowObjectKeys?.[index as number]);
            if ((rowObject?.data as GroupedData<T>)?.flattedLevel > 1 || !(rowObject?.data as GroupedData<T>)?.flattedKey) {
                _gridRef.current.totalRenderedRowHeight.current -= rowObject.height;
                _gridRef.current?.cachedRowObjects?.current?.delete(prevCacheRowObjectKeys?.[index as number]); // rowIndex will change
            } else if ((rowObject?.data as GroupedData<T>)?.flattedKey) {
                rowObject.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isExpand: true}));
            }
        }
        setGridAction?.(args);
    }, [setGridAction, _gridRef, pageWiseGroupResponseViewData, totalRecordCount, virtualizationSettings, groupSettings, groupedColumns,
        currentViewData]);

    /**
     * Collapse all groups (clears expanded Set, marks collapsed Set as "all").
     * Triggers setGridAction to notify useRender for onGroup event emission.
     */
    const collapseAll: () => void = useCallback(async(): Promise<void> => {
        const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
            requestType: ActionType.Grouping,
            action: GROUP_ACTION_COLLAPSE_ALL,
            cancel: false
        };
        if (!await triggerStartEvent(args) || !groupedColumns?.length || collapsedGroups.has('ALL')) { return; }
        const childInfo: ChildInfoResult<T> =
            getGroupLayoutFlattedData(
                pageWiseGroupResponseViewData.get(_gridRef.current?.pageSettings?.currentPage),
                (): boolean => {
                    return false;
                },
                groupSettings
            );
        groupedColumns.forEach((field: string) => {
            const expandedKeys: Set<string> = childInfo.fieldBasedExpandedGroupKeys.get(field);
            if (expandedKeys?.size) {
                fieldBasedExpandedGroupKeysRef?.current?.set(field, expandedKeys);
            }
            const collapsedKeys: Set<string> = childInfo.fieldBasedCollapsedGroupKeys.get(field);
            if (collapsedKeys?.size) {
                fieldBasedCollapsedGroupKeysRef?.current?.set(field, new Set(['ALL', ...collapsedKeys]));
            }
        });
        setExpandedGroups(new Set<string>(childInfo.expandedGroups));
        setCollapsedGroups(new Set<string>(['ALL', ...childInfo.collapsedGroups]));
        setCurrentViewData?.(childInfo.currentViewData as GroupedData<T>[]);
        const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite;
        _gridRef.current.expandedGroupCountRef.current = isVirtualOrInfinite ? totalRecordCount + childInfo.count :
            childInfo.currentViewData.length;
        const newMap: Map<number, GroupedData<T>> = new Map();
        for (let currentPage: number = 1; currentPage <= loadedPageWiseVirtualGroupStartEndRowIndexes.current?.size; currentPage++) {
            const groupedPageData: GroupedData<T>[] = pageWiseGroupResponseViewData.get(currentPage);
            if (groupedPageData) {
                const childInfo: ChildInfoResult<T> =
                getGroupLayoutFlattedData(
                    groupedPageData,
                    (): boolean => {
                        return false;
                    },
                    groupSettings
                );
                loadedPageWiseGroupExpandedCountRef.current?.set(currentPage, childInfo.count);
                const startIndex: number = (currentPage - 1) * _gridRef.current?.pageSettings?.pageSize;
                const endIndex: number = currentPage * _gridRef.current?.pageSettings?.pageSize;
                for (let rowIndex: number = startIndex, index: number = 0; rowIndex < endIndex; rowIndex++, index++) {
                    newMap.set(rowIndex, groupedPageData?.[index as number]);
                }
            } else {
                loadedPageWiseGroupExpandedCountRef.current.delete(currentPage);
            }
        }
        if (isVirtualOrInfinite) {
            loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
            setVirtualCachedViewData?.(newMap);
        }
        const prevCacheRowObjectKeys: (string | number)[] = [..._gridRef.current?.cachedRowObjects?.current?.keys()];
        for (let index: number = 0; index < prevCacheRowObjectKeys?.length; index++) {
            const rowObject: IRow<ColumnProps<T>> =
                _gridRef.current?.cachedRowObjects?.current?.get(prevCacheRowObjectKeys?.[index as number]);
            if ((rowObject?.data as GroupedData<T>)?.flattedLevel > 1 || !(rowObject?.data as GroupedData<T>)?.flattedKey) {
                _gridRef.current.totalRenderedRowHeight.current -= rowObject.height;
                _gridRef.current?.cachedRowObjects?.current?.delete(prevCacheRowObjectKeys?.[index as number]);
            } else if ((rowObject?.data as GroupedData<T>)?.flattedKey) {
                rowObject.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({...prev, isExpand: false}));
            }
        }
        setGridAction?.(args);
    }, [setGridAction, pageWiseGroupResponseViewData, totalRecordCount, virtualizationSettings, groupSettings, groupedColumns,
        currentViewData]);

    /**
     * `groupColumn` – IGroupModule API method.
     * Adds a field to the grouped columns list and triggers data re-grouping via state update.
     * DOES NOT instantiate DataManager – delegates to useData via grid state change.
     *
     * @param field - Column field name to add to grouping
     */
    const groupColumn: (fields: string[], isResetRequired?: boolean) => void =
        useCallback(async (fields: string[], isResetRequired?: boolean): Promise<void> => {
            const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
                requestType: ActionType.Grouping,
                action: GROUP_ACTION_ADD,
                columns: fields,
                cancel: false
            };
            if (!await triggerStartEvent(args)) { return; }
            if (!fields?.length || !fields.filter((field: string) => !groupedColumns.includes(field))?.length) { return; }
            const updatedColumns: string[] = isResetRequired ? fields : [...new Set([...groupedColumns, ...fields])];
            setGroupedColumns(updatedColumns);
            loadedPageWiseGroupExpandedCountRef.current = new Map<number, number>();
            const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
                virtualizationSettings?.scrollMode === ScrollMode.Infinite;
            if (isVirtualOrInfinite) {
                loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                    totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
                setVirtualCachedViewData?.(new Map<number, (T | GroupedData<T>)>());
                _gridRef.current.cachedRowObjects.current = new Map<number, IRow<ColumnProps<T>>>();
                _gridRef.current.expandedGroupCountRef.current = 0;
            }
            setGroupSettings((prev: GroupSettings) => ({ ...prev, columns: updatedColumns}));
            setGridAction?.(args);
        }, [groupedColumns, setGridAction, currentViewData]);

    /**
     * `ungroupColumn` – IGroupModule API method.
     * Removes a field from the grouped columns list.
     * DOES NOT instantiate DataManager – delegates to useData via grid state change.
     *
     * @param field - Column field name to remove from grouping
     */
    const ungroupColumn: (fields: string[]) => void = useCallback(async(fields: string[]): Promise<void> => {
        const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
            requestType: ActionType.Grouping,
            action: GROUP_ACTION_REMOVE,
            columns: fields,
            cancel: false
        };
        if (!await triggerStartEvent(args) || !groupedColumns?.length) { return; }
        const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite;
        const updatedColumns: string[] = groupedColumns.filter((col: string) => !fields.includes(col));
        setGroupedColumns(updatedColumns);
        let isExpandedFieldUnGrouped: boolean = false;
        // Clean up expansion state for removed group
        const existingExpandedGroups: Set<string> = expandedGroups;
        fieldBasedExpandedGroupKeysRef.current?.forEach((keys: Set<string>, field: string) => {
            if (fields.includes(field)) {
                keys.forEach((key: string) => existingExpandedGroups.delete(key));
                fieldBasedExpandedGroupKeysRef.current?.delete(field);
                isExpandedFieldUnGrouped = true;
            }
        });
        const existingCollapsedGrouped: Set<string> = collapsedGroups;
        fieldBasedCollapsedGroupKeysRef.current?.forEach((keys: Set<string>, field: string) => {
            if (fields.includes(field)) {
                keys.forEach((key: string) => existingCollapsedGrouped.delete(key));
                fieldBasedCollapsedGroupKeysRef.current?.delete(field);
                // isExpandedFieldUnGrouped = true;
            }
        });
        setCollapsedGroups(existingCollapsedGrouped);
        setExpandedGroups(existingExpandedGroups);
        if (isExpandedFieldUnGrouped) {
            loadedPageWiseGroupExpandedCountRef.current = new Map<number, number>();
            setCurrentPage(1);
            if (isVirtualOrInfinite) {
                loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                    totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
            }
        }
        if (isVirtualOrInfinite) {
            setVirtualCachedViewData?.(new Map<number, (T | GroupedData<T>)>());
            _gridRef.current.cachedRowObjects.current = new Map<number, IRow<ColumnProps<T>>>();
            _gridRef.current.expandedGroupCountRef.current = 0;
        }
        setGroupSettings((prev: GroupSettings) => ({
            ...prev,
            columns: groupSettings?.columns?.filter((groupField: string) => !fields.includes(groupField))
        }));
        setGridAction?.(args);
    }, [groupedColumns, setGridAction, currentViewData, expandedGroups, collapsedGroups]);

    /**
     * `clearGrouping` – IGroupModule API method.
     * Removes all grouping, resets expansion state.
     * Triggers setGridAction to notify useRender for onGroup event emission.
     */
    const clearGrouping: () => void = useCallback(async(): Promise<void> => {
        const args: OnGroupArgs & { requestType: ActionType, cancel: boolean } = {
            requestType: ActionType.Grouping,
            action: GROUP_ACTION_REMOVE_ALL,
            columns: groupedColumns,
            cancel: false
        };
        if (!await triggerStartEvent(args) || !groupedColumns?.length) { return; }
        setGroupedColumns([]);
        if (fieldBasedExpandedGroupKeysRef.current?.size) {
            setCurrentPage(1);
        }
        setExpandedGroups(new Set<string>());
        setCollapsedGroups(new Set<string>());
        loadedPageWiseGroupExpandedCountRef.current = new Map<number, number>();
        const isVirtualOrInfinite: boolean = virtualizationSettings?.scrollMode === ScrollMode.Virtual ||
            virtualizationSettings?.scrollMode === ScrollMode.Infinite;
        if (isVirtualOrInfinite) {
            loadedPageWiseVirtualGroupStartEndRowIndexes.current = updatePageWiseStartEndIndexes(
                totalRecordCount, _gridRef.current?.pageSettings?.pageSize, groupSettings, loadedPageWiseGroupExpandedCountRef);
        }
        setGroupSettings((prev: GroupSettings) => ({ ...prev, columns: []}));
        setGridAction?.(args);
    }, [setGridAction, groupedColumns, currentViewData]);

    return {
        expandedGroups,
        collapsedGroups,
        groupedColumns,
        fieldBasedExpandedGroupKeysRef,
        fieldBasedCollapsedGroupKeysRef,
        groupSettings,
        toggleGroup,
        expandAll,
        collapseAll,
        isGroupExpanded,
        setGroupedColumns,
        setExpandedGroups,
        setCollapsedGroups,
        // IGroupModule API (called directly via gridRef.current)
        groupColumn,
        ungroupColumn,
        clearGrouping,
        groupDropAreaRef
    };
};
