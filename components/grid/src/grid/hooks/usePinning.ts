import { useCallback, useEffect, useRef, useState, RefObject } from 'react';
import { IRow, ColumnProps, GridRef, SaveEvent } from '../types';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { ColumnPinDirection } from '../types/enum';
import { resolvePinDirection } from '../utils/utils';
import type { PinningActionInfo, PinningModuleOptions, PinningModuleResult, RowPinningEvent } from '../types/pinning.interfaces';

/**
 * Hook to manage row pinning state and operations.
 * Provides utilities to pin/unpin rows while maintaining row object state consistency.
 *
 * @template T - Data row type
 * @param {RefObject} gridRef - Reference to the grid instance
 * @param {Function} setColumnChooserState - Function to update column chooser state for re-rendering
 * @param {RefObject} uiColumns - Ref to current UI columns for access in callbacks
 * @param {boolean} isInitialLoad - Indicates whether the grid is rendering initially
 * @returns {Object} Object containing pinning operations and state
 *
 * @example
 * ```tsx
 * const { updatePinnedRowsState, pinnedRowsState } = usePinning(gridRef);
 * updatePinnedRowsState([row1, row2], true, 'top');
 * ```
 */
export const usePinning: <T>(
    gridRef: RefObject<GridRef<T>>,
    setColumnChooserState: ((value: object) => void) | undefined,
    uiColumns: RefObject<ColumnProps<T>[]> | undefined,
    isInitialLoad: boolean
) => PinningModuleResult<T> =
    <T, >(
        gridRef: RefObject<GridRef<T>>,
        setColumnChooserState: ((value: object) => void) | undefined,
        uiColumns: RefObject<ColumnProps<T>[]> | undefined,
        isInitialLoad: boolean
    ): PinningModuleResult<T> => {
        const [pinnedRowsState, setPinnedRowsState] = useState<Map<string, {
            isPinned: boolean;
            pinBucket?: 'top' | 'bottom';
            rowData?: T;
        }>>(new Map());
        const hasInitializedPinnedRows: RefObject<boolean> = useRef<boolean>(false);
        const dynamicallyChangedPinnedRows: RefObject<boolean> = useRef<boolean>(false);
        const dynamicallyChangedPinnedRowsCount: RefObject<number> = useRef<number>(0);
        const pendingPinnedRowsChange: RefObject<RowPinningEvent<T>[]> = useRef<RowPinningEvent<T>[]>([]);
        const [pinnedColumnCounts, setPinnedColumnCounts] = useState<{ left: number; right: number; }>({ left: 0, right: 0 });
        const isInitialColumnCount: RefObject<boolean> = useRef<boolean>(true);
        const pinningActionInfo: RefObject<PinningActionInfo> = useRef<PinningActionInfo>({
            topDiffer: 0,
            isUnpinned: false,
            isBottomPinned: false
        });

        useEffect(() => {
            const pendingEvents: RowPinningEvent<T>[] = pendingPinnedRowsChange.current.splice(0);
            for (const event of pendingEvents) {
                gridRef.current?.onPinnedRowsChanged?.(event);
            }
        }, [pinnedRowsState, gridRef]);

        // Mirror the row-side pinning counters: walk the post-`prepareColumns`
        // uiColumns and tally the resolved `pinDirection` for each leaf.
        useEffect(() => {
            const liveColumns: ColumnProps<T>[] | undefined = uiColumns?.current;
            if (!liveColumns || !liveColumns.length) {
                if (isInitialColumnCount.current) {
                    return;
                }
                return;
            }
            isInitialColumnCount.current = false;
            let left: number = 0;
            let right: number = 0;
            for (const candidate of liveColumns) {
                const candidateSide: ColumnPinDirection =
                    resolvePinDirection<unknown>(
                        candidate.pinDirection as ColumnPinDirection,
                        candidate as ColumnProps<unknown>
                    );
                if (candidateSide === ColumnPinDirection.Left) { left++; }
                else if (candidateSide === ColumnPinDirection.Right) { right++; }
            }
            if (left !== pinnedColumnCounts.left || right !== pinnedColumnCounts.right) {
                setPinnedColumnCounts({ left, right });
            }
        }, [uiColumns?.current, pinnedColumnCounts.left, pinnedColumnCounts.right]);

        /**
         * Gets row identity by checking primary key or uid.
         * Used for matching rows across different data representations.
         */
        const getRowIdentity: (rowData: T | IRow<ColumnProps<T>> | undefined) => string | undefined = useCallback(
            (rowData: T | IRow<ColumnProps<T>> | undefined): string | undefined => {
                const primaryKeyField: string | undefined = gridRef.current?.getPrimaryKeyFieldNames?.()?.[0];
                const source: Record<string, unknown> = rowData as Record<string, unknown>;
                if (isNullOrUndefined(source)) {
                    return undefined;
                }
                if (primaryKeyField && !isNullOrUndefined(source[primaryKeyField as string])) {
                    return String(source[primaryKeyField as string]);
                }
                return undefined;
            },
            [gridRef]
        );

        /**
         * Updates pinning state for one or more rows.
         * Uses setRowObject for state updates (which automatically triggers re-render).
         * Updates internal pinning state map for tracking.
         */
        const canPinRow: (row: T, position?: 'top' | 'bottom') => boolean = useCallback(
            (row: T, position?: 'top' | 'bottom'): boolean => {
                const pinningSettings: { enabled?: boolean; allowTopPin?: boolean; allowBottomPin?: boolean; } | undefined =
                    gridRef.current?.pinningSettings;
                if (!pinningSettings?.enabled) {
                    return false;
                }
                if (position === 'top' && pinningSettings.allowTopPin === false) {
                    return false;
                }
                if (position === 'bottom' && pinningSettings.allowBottomPin === false) {
                    return false;
                }
                if (typeof gridRef.current?.isRowPinnable === 'function' && !gridRef.current.isRowPinnable(row)) {
                    return false;
                }
                return true;
            },
            [gridRef]
        );

        const updatePinnedRowsState: (rows: T[], isPinned: boolean, position?: 'top' | 'bottom') => void = useCallback(
            (rows: T[], isPinned: boolean, position?: 'top' | 'bottom') => {
                if (!Array.isArray(rows) || !rows.length) {
                    return;
                }
                const rowsToPin: T[] = isPinned ? rows.filter((row: T) => canPinRow(row, position)) : rows;
                if (!rowsToPin.length) {
                    return;
                }

            type PinBucket = 'top' | 'bottom';
            const getRowsObject: (pinBucket?: PinBucket) => IRow<ColumnProps<T>>[] =
                (pinBucket?: PinBucket): IRow<ColumnProps<T>>[] => {
                    if (pinBucket === 'top') {
                        return gridRef.current?.getPinnedTopTableRowsObject?.() ?? [];
                    }
                    if (pinBucket === 'bottom') {
                        return gridRef.current?.getPinnedBottomTableRowsObject?.() ?? [];
                    }
                    return gridRef.current?.getContentTableRowsObject?.() ?? [];
                };
            const getTotalRenderedRowHeight: (pinBucket?: PinBucket) => RefObject<number> | undefined =
                (pinBucket?: PinBucket): RefObject<number> | undefined => {
                    if (pinBucket === 'top') {
                        return gridRef.current?.pinnedTopTableRef?.totalRenderedRowHeight;
                    }
                    if (pinBucket === 'bottom') {
                        return gridRef.current?.pinnedBottomTableRef?.totalRenderedRowHeight;
                    }
                    return undefined;
                };
            const findRowObject: (rowObjects: IRow<ColumnProps<T>>[] | undefined, row: T) => IRow<ColumnProps<T>> | undefined =
                (rowObjects: IRow<ColumnProps<T>>[] | undefined, row: T): IRow<ColumnProps<T>> | undefined => {
                    return (rowObjects ?? []).find((item: IRow<ColumnProps<T>>) => {
                        if (item?.data === row || (item?.editInlineRowFormRef?.current
                            && JSON.stringify(item?.editInlineRowFormRef?.current?.getCurrentData?.()) === JSON.stringify(row))) {
                            return true;
                        }
                        const itemKey: string | undefined = getRowIdentity(item);
                        const rowKey: string | undefined = getRowIdentity(row);
                        return !!itemKey && !!rowKey && itemKey === rowKey;
                    });
                };
            const deleteCachedRowObject: (pinBucket: PinBucket, row: T, sourceRow?: IRow<ColumnProps<T>>) => void =
                (pinBucket: PinBucket, row: T, sourceRow?: IRow<ColumnProps<T>>): void => {
                    const cachedRowObjects: Map<number | string, IRow<ColumnProps<T>>> | undefined = pinBucket === 'top' ?
                        gridRef.current?.getPinnedTopTableCachedRowObjects?.() :
                        gridRef.current?.getPinnedBottomTableCachedRowObjects?.();
                    if (!cachedRowObjects) {
                        return;
                    }
                    const rowKey: string | undefined = getRowIdentity(row) ?? getRowIdentity(sourceRow);
                    cachedRowObjects.forEach((cachedRowObject: IRow<ColumnProps<T>>, cacheKey: number | string) => {
                        const cachedRowKey: string | undefined = getRowIdentity(cachedRowObject?.data as T) ??
                            getRowIdentity(cachedRowObject);
                        if (cachedRowObject === sourceRow || cachedRowObject?.data === row || (rowKey && cachedRowKey === rowKey)) {
                            cachedRowObjects.delete(cacheKey);
                        }
                    });
                };
            const adjustSourceHeight: (rowObject: IRow<ColumnProps<T>> | undefined, pinBucket?: PinBucket) => void =
                (rowObject: IRow<ColumnProps<T>> | undefined, pinBucket?: PinBucket): void => {
                    if (!pinBucket) {
                        return;
                    }
                    const totalRenderedRowHeight: RefObject<number> | undefined = getTotalRenderedRowHeight(pinBucket);
                    if (rowObject && totalRenderedRowHeight?.current !== undefined) {
                        totalRenderedRowHeight.current -= rowObject.height;
                    }
                };
            const rowsToUpdate: Array<{
                row: T;
                rowKey: string;
                previousState?: { isPinned: boolean; pinBucket?: PinBucket; rowData?: T };
                sourceRow?: IRow<ColumnProps<T>>;
                contentRow?: IRow<ColumnProps<T>>;
                sourceBucket?: PinBucket;
                targetBucket?: PinBucket;
                targetRow?: IRow<ColumnProps<T>>;
            }> = [];

            let isBottomUnpinned: boolean = false;
            rowsToPin.forEach((row: T) => {
                const rowKey: string | undefined = getRowIdentity(row);
                const previousState: { isPinned: boolean; pinBucket?: PinBucket; rowData?: T } | undefined =
                    rowKey ? pinnedRowsState.get(rowKey) : undefined;
                const contentRow: IRow<ColumnProps<T>> | undefined = findRowObject(getRowsObject(), row);
                const topRow: IRow<ColumnProps<T>> | undefined = findRowObject(getRowsObject('top'), row);
                const bottomRow: IRow<ColumnProps<T>> | undefined = findRowObject(getRowsObject('bottom'), row);
                const sourceBucket: PinBucket | undefined = topRow ? 'top' : bottomRow ? 'bottom' :
                    (previousState?.isPinned ? previousState?.pinBucket : undefined);
                const targetBucket: PinBucket | undefined = isPinned ? (position ?? previousState?.pinBucket ?? sourceBucket ?? 'top') : undefined;
                const sourceRow: IRow<ColumnProps<T>> | undefined = sourceBucket === 'top' ? topRow :
                    sourceBucket === 'bottom' ? bottomRow : contentRow;
                const targetRowObjects: IRow<ColumnProps<T>>[] = getRowsObject(targetBucket);
                const targetRow: IRow<ColumnProps<T>> | undefined = findRowObject(targetRowObjects, row);
                const resolvedRowKey: string | undefined = rowKey ?? getRowIdentity(sourceRow) ?? getRowIdentity(contentRow);
                if (resolvedRowKey) {
                    rowsToUpdate.push({ row, rowKey: resolvedRowKey, previousState, sourceRow, contentRow, sourceBucket, targetBucket,
                        targetRow });
                    if (sourceBucket !== targetBucket) {
                        if (sourceBucket) {
                            deleteCachedRowObject(sourceBucket, row, sourceRow);
                        }
                        if (sourceBucket) {
                            adjustSourceHeight(sourceRow, sourceBucket);
                        }
                        dynamicallyChangedPinnedRowsCount.current = rows.length;
                        dynamicallyChangedPinnedRows.current = true;
                        isBottomUnpinned = sourceBucket === 'bottom' && !isPinned;
                    }
                }
            });

            rowsToUpdate.forEach(({ row, sourceBucket, targetBucket }: {
                row: T;
                sourceBucket?: PinBucket;
                targetBucket?: PinBucket;
            }) => {
                if (sourceBucket !== targetBucket) {
                    pendingPinnedRowsChange.current.push({
                        rowData: row,
                        previousPinBucket: sourceBucket,
                        currentPinBucket: targetBucket,
                        action: isPinned ? 'pin' : 'unpin'
                    });
                }
            });

            let prevTopPinnedRowCount: number = 0;
            let prevBottomPinnedRowCount: number = 0;
            let topPinnedRowCount: number = 0;
            let bottomPinnedRowCount: number = 0;

            setPinnedRowsState((previousPinnedRowsState: Map<string, {
                isPinned: boolean;
                pinBucket?: 'top' | 'bottom';
                rowData?: T;
            }>) => {
                for (const state of previousPinnedRowsState.values()) {
                    if (state.isPinned && state.pinBucket === 'top') { prevTopPinnedRowCount++; }
                    else if (state.isPinned && state.pinBucket === 'bottom') { prevBottomPinnedRowCount++; }
                }
                const updatedStateMap: Map<string, {
                    isPinned: boolean;
                    pinBucket?: 'top' | 'bottom';
                    rowData?: T;
                }> = new Map(previousPinnedRowsState);

                rowsToUpdate.forEach(({ row, rowKey, sourceRow, contentRow, targetBucket, targetRow }: {
                    row: T;
                    rowKey: string;
                    sourceRow?: IRow<ColumnProps<T>>;
                    contentRow?: IRow<ColumnProps<T>>;
                    targetBucket?: 'top' | 'bottom';
                    targetRow?: IRow<ColumnProps<T>>;
                }) => {
                    const nextPinBucket: 'top' | 'bottom' | undefined = targetBucket;
                    updatedStateMap.set(rowKey, {
                        isPinned,
                        pinBucket: nextPinBucket,
                        rowData: row
                    });

                    const updateRowObject: (rowObject: IRow<ColumnProps<T>>) => void =
                        (rowObject: IRow<ColumnProps<T>> | undefined): void => rowObject?.setRowObject?.((prev: IRow<ColumnProps<T>>) => ({
                            ...prev,
                            isPinned,
                            pinBucket: nextPinBucket
                        }));

                    updateRowObject(sourceRow);
                    if (contentRow !== sourceRow) {
                        updateRowObject(contentRow);
                    }
                    if (targetRow !== sourceRow && targetRow !== contentRow) {
                        updateRowObject(targetRow);
                    }
                });

                for (const state of updatedStateMap.values()) {
                    if (state.isPinned && state.pinBucket === 'top') { topPinnedRowCount++; }
                    else if (state.isPinned && state.pinBucket === 'bottom') { bottomPinnedRowCount++; }
                }

                return updatedStateMap;
            });
            pinningActionInfo.current = {
                topDiffer: prevTopPinnedRowCount - topPinnedRowCount,
                isUnpinned: !isPinned,
                isBottomPinned: position === 'bottom',
                prevTopPinnedCachedRowObjects: [...(gridRef.current?.getPinnedTopTableRowsObject?.() ?? [])],
                topPinnedRowCount,
                isBottomUnpinned
            };
            },
            [gridRef, getRowIdentity, pinnedRowsState]
        );

        const updatePinnedRowObjectsData: (savedRowObject: IRow<ColumnProps<T>>, startArgs: SaveEvent<T>, isEditCell?: boolean) => void =
            useCallback((savedRowObject: IRow<ColumnProps<T>>, startArgs: SaveEvent<T>, isEditCell?: boolean): void => {
                const updateRowObject: (rowObject: IRow<ColumnProps<T>> | undefined) => void =
                    (rowObject: IRow<ColumnProps<T>> | undefined): void => {
                        rowObject?.setRowObject?.((previousRowObject: IRow<ColumnProps<T>>) => ({
                            ...previousRowObject,
                            data: startArgs.data
                        }));
                    };
                const getPinnedRowObject: (pinBucket: 'top' | 'bottom' | undefined, rowData: T) => IRow<ColumnProps<T>> | undefined =
                    (pinBucket: 'top' | 'bottom' | undefined, rowData: T) => {
                        const primaryKeyField: string = gridRef.current?.getPrimaryKeyFieldNames?.()?.[0];
                        const rowKey: unknown = (rowData as Record<string, unknown>)?.[primaryKeyField as string];
                        const pinnedRows: IRow<ColumnProps<T>>[] = pinBucket === 'top'
                            ? gridRef.current?.getPinnedTopTableRowsObject?.()
                            : pinBucket === 'bottom' ? gridRef.current?.getPinnedBottomTableRowsObject?.()
                                : gridRef.current?.getContentTableRowsObject?.();
                        return pinnedRows.find((rowObject: IRow<ColumnProps<T>>) =>
                            (rowObject?.data as Record<string, unknown>)?.[primaryKeyField as string] === rowKey);
                    };
                const getPinnedRowCacheObject: (pinBucket: 'top' | 'bottom' | undefined, rowData: T) => IRow<ColumnProps<T>> | undefined =
                    (pinBucket: 'top' | 'bottom' | undefined, rowData: T) => {
                        const primaryKeyField: string = gridRef.current?.getPrimaryKeyFieldNames?.()?.[0];
                        const rowKey: unknown = (rowData as Record<string, unknown>)?.[primaryKeyField as string];
                        const pinnedRowCache: Map<number | string, IRow<ColumnProps<T>>> | undefined = pinBucket === 'top'
                            ? gridRef.current?.getPinnedTopTableCachedRowObjects?.()
                            : pinBucket === 'bottom' ? gridRef.current?.getPinnedBottomTableCachedRowObjects?.()
                                : gridRef.current?.getContentTableCachedRowObjects?.();
                        return Array.from(pinnedRowCache?.values()).find((rowObject: IRow<ColumnProps<T>>) =>
                            (rowObject?.data as Record<string, unknown>)?.[primaryKeyField as string] === rowKey);
                    };
                if (savedRowObject?.isPinned) {
                    const rowElement: HTMLTableRowElement | null = savedRowObject.element;
                    const isTopPinnedRow: boolean = rowElement?.classList?.contains('sf-pinned-row-top');
                    const isBottomPinnedRow: boolean = rowElement?.classList?.contains('sf-pinned-row-bottom');
                    if (isTopPinnedRow || isBottomPinnedRow) {
                        if (!isEditCell) {
                            const pinBucket: 'top' | 'bottom' = isTopPinnedRow ? 'top' : 'bottom';
                            updateRowObject(getPinnedRowObject(pinBucket, startArgs.data));
                            updateRowObject(getPinnedRowCacheObject(pinBucket, startArgs.data));
                        }

                        // Update corresponding content row object cache.
                        updateRowObject(getPinnedRowObject(undefined, startArgs.data));
                        updateRowObject(getPinnedRowCacheObject(undefined, startArgs.data));
                    } else {
                        if (!isEditCell) {
                            updateRowObject(getPinnedRowObject(undefined, startArgs.data));
                            updateRowObject(getPinnedRowCacheObject(undefined, startArgs.data));
                        }

                        const pinBucket: 'top' | 'bottom' = savedRowObject?.pinBucket;
                        if (pinBucket) {
                            updateRowObject(getPinnedRowObject(pinBucket, startArgs.data));
                            updateRowObject(getPinnedRowCacheObject(pinBucket, startArgs.data));
                        }
                    }
                }
            }, [gridRef, getRowIdentity]
            );

        const initializePinnedRowsState: (isRowPinned?: (row: T) => 'top' | 'bottom' | null | undefined) => void =
        useCallback((isRowPinned?: (row: T) => 'top' | 'bottom' | null | undefined): void => {
            if (!isInitialLoad || hasInitializedPinnedRows.current || !gridRef.current?.getData) {
                return;
            }
            const completeData: Object[] | Promise<unknown> = gridRef.current.getData(true);
            const initialState: Map<string, { isPinned: boolean; pinBucket?: 'top' | 'bottom'; rowData?: T; }> = new Map();
            for (const row of completeData as T[]) {
                const rowKey: string | undefined = getRowIdentity(row);
                if (!rowKey) { continue; }
                if (typeof gridRef.current?.isRowPinnable === 'function' && !gridRef.current.isRowPinnable(row)) {
                    continue;
                }
                const pinBucket: 'top' | 'bottom' | null | undefined = isRowPinned?.(row);
                if (pinBucket === 'top' && !canPinRow(row, 'top')) {
                    continue;
                }
                if (pinBucket === 'bottom' && !canPinRow(row, 'bottom')) {
                    continue;
                }
                initialState.set(rowKey, {
                    isPinned: pinBucket === 'top' || pinBucket === 'bottom',
                    pinBucket: pinBucket === 'top' || pinBucket === 'bottom' ? pinBucket : undefined,
                    rowData: row
                });
            }
            hasInitializedPinnedRows.current = true;
            setPinnedRowsState(initialState);
        }, [canPinRow, gridRef, getRowIdentity, isInitialLoad]);

        const updatePinnedColumnOrder: () => void = useCallback((): void => {
            const liveColumns: ColumnProps<T>[] | undefined = uiColumns?.current;
            if (!liveColumns) { return; }
            const leftColumns: ColumnProps<T>[] = [];
            const rightColumns: ColumnProps<T>[] = [];
            const unpinnedColumns: ColumnProps<T>[] = [];
            for (const candidate of liveColumns) {
                const candidateSide: ColumnPinDirection = resolvePinDirection<unknown>(
                    candidate.pinDirection as ColumnPinDirection, candidate as ColumnProps<unknown>);
                if (candidateSide === ColumnPinDirection.Left) {
                    leftColumns.push(candidate);
                } else if (candidateSide === ColumnPinDirection.Right) {
                    rightColumns.push(candidate);
                } else {
                    unpinnedColumns.push(candidate);
                }
            }
            const sortByOrderIndex: (a: ColumnProps<T>, b: ColumnProps<T>) => number =
                (a: ColumnProps<T>, b: ColumnProps<T>): number => (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
            leftColumns.sort(sortByOrderIndex);
            unpinnedColumns.sort(sortByOrderIndex);
            rightColumns.sort(sortByOrderIndex);
            let cursor: number = 0;
            for (const current of [...leftColumns, ...unpinnedColumns, ...rightColumns]) {
                current.orderIndex = cursor++;
            }
        }, [uiColumns]);

        /**
         * Pins the column identified by `field` to the requested side.
         * Mutates `uiColumns.current` in place — sets `pinDirection` and lays out
         * a deterministic `orderIndex` so `colGroup.sort` paints the left/right
         * pinned columns in the expected visual order ([left-pinned, unpinned, right-pinned]).
         * Bumps `setColumnChooserState` so `prepareColumns` reruns.
         *
         * @private
         * @param {string} field - Field name of the column to pin.
         * @param {ColumnPinDirection.Left | ColumnPinDirection.Right | string} direction - Pin side.
         * @returns {void}
         */
        const pinColumn: (field: string, direction: ColumnPinDirection.Left | ColumnPinDirection.Right | string) => void =
            useCallback((field: string, direction: ColumnPinDirection.Left | ColumnPinDirection.Right | string): void => {
                const liveColumns: ColumnProps<T>[] | undefined = uiColumns?.current;
                if (!liveColumns || isNullOrUndefined(field)) { return; }
                const column: ColumnProps<T> | undefined = liveColumns.find((col: ColumnProps<T>) => col.field === field ||
                col.uid === field);
                if (!column) { return; }
                const resolved: ColumnPinDirection =
                    resolvePinDirection<unknown>(direction as unknown as ColumnPinDirection, column as ColumnProps<unknown>);
                if (resolved !== ColumnPinDirection.Left && resolved !== ColumnPinDirection.Right) { return; }
                column.pinDirection = resolved;
                updatePinnedColumnOrder();
                setColumnChooserState?.({});
            }, [setColumnChooserState, uiColumns, updatePinnedColumnOrder]);

        /**
         * Unpins the column identified by `field` (collapses its pin direction to `None`)
         * and bumps the column-chooser sentinel so `prepareColumns` reruns and
         * the column flows back into the main virtual order.
         *
         * @private
         * @param {string} field - Field name of the column to unpin.
         * @returns {void}
         */
        const unpinColumn: (field: string) => void =
            useCallback((field: string): void => {
                const pinningSettings: { enabled?: boolean; } | undefined = gridRef.current?.pinningSettings;
                if (!pinningSettings?.enabled) { return; }
                const liveColumns: ColumnProps<T>[] | undefined = uiColumns?.current;
                if (!liveColumns || isNullOrUndefined(field)) { return; }
                const column: ColumnProps<T> | undefined = liveColumns.find((col: ColumnProps<T>) => col.field === field ||
                col.uid === field);
                if (!column) { return; }
                column.pinDirection = ColumnPinDirection.None;
                updatePinnedColumnOrder();
                setColumnChooserState?.({});
            }, [gridRef, setColumnChooserState, uiColumns, updatePinnedColumnOrder]);

        return {
            updatePinnedRowsState,
            updatePinnedRowObjectsData,
            initializePinnedRowsState,
            pinnedRowsState,
            dynamicallyChangedPinnedRows,
            dynamicallyChangedPinnedRowsCount,
            pinColumn,
            unpinColumn,
            pinningActionInfo
        };
    };

export const PinningModule: <T>(options: PinningModuleOptions<T>) => PinningModuleResult<T> = <T, >({ gridRef, setColumnChooserState,
    uiColumns, isInitialLoad }: PinningModuleOptions<T>) => usePinning<T>(gridRef, setColumnChooserState, uiColumns, isInitialLoad);
