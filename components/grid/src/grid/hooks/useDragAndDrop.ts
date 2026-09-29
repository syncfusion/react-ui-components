import { RefObject, useEffect, useRef } from 'react';
import { createElement, DragEvent } from '@syncfusion/react-base';
import { useGridComputedProvider, useGridMutableProvider } from '../contexts';
import { ContentTableRef, GroupedData, RowDragEventArgs } from '../types';
import { isGroupedData } from '../utils/utils';

const CSS_CONTENT_ROW: string = '.sf-grid-content-row';
const CSS_ROW_DRAG_HANDLE: string = '.sf-row-drag-handle';
const CSS_ROW_DRAGGING: string = 'sf-row-dragging';
const CSS_ROW_DRAG_INDICATOR: string = 'sf-row-drag-indicator';
const CSS_ROW_DRAG_CLONE: string = 'sf-row-dragclone';
const CSS_ROW_DRAG_COUNT: string = 'sf-row-drag-count';
const CSS_GRID_DRAG_SOURCE: string = 'sf-grid-drag-source';

interface DragGridEndpoint<T> {
    currentViewData: () => (T | GroupedData<T>)[];
    currentDataSource: () => (T | GroupedData<T>)[];
    updateDataSource: (recordsToRemove: T[], recordsToAdd?: T[], targetRecord?: T, insertAfterTarget?: boolean) => void;
    setCurrentViewData: (data: (T | GroupedData<T>)[]) => void;
    setTotalRecordsCount?: (value: number | ((prev: number) => number)) => void;
    expandedGroupCountRef?: RefObject<number>;
    currentPage?: number;
    pageSize?: number;
}

const dragGridEndpoints: Map<string, DragGridEndpoint<unknown>> = new Map();

/**
 * Defines the row drag-and-drop handlers used by the content panel.
 *
 */
export interface DragAndDropHandlers {
    dragHelper: (args: { sender?: MouseEvent & TouchEvent }) => HTMLElement | null;
    dragStart: (args: DragEvent) => void;
    drag: (args: DragEvent) => void;
    dragStop: (args: DragEvent) => Promise<void>;
}

/**
 * Manages row drag-and-drop state and reordering behavior.
 *
 * @template T - Data type for grid rows
 * @param {RefObject<ContentTableRef<T>>} contentTableRef - Reference to the content table
 * @returns {DragAndDropHandlers<T>} Drag-and-drop handlers for the content panel
 */
export const useDragAndDrop: <T>(contentTableRef: RefObject<ContentTableRef<T>>) => DragAndDropHandlers = <T, >(
    contentTableRef: RefObject<ContentTableRef<T>>
): DragAndDropHandlers => {
    const { id, dataSource, dragAndDropSettings, groupSettings, filterSettings, sortSettings, searchSettings, onRowDragStart, onRowDrag,
        onRowDrop, setCurrentViewData, selectionSettings, setTotalRecordsCount, currentPage, pageSettings, expandedGroupCountRef } =
        useGridComputedProvider<T>();
    const { currentViewData, selectionModule, totalRecordsCount, editModule } = useGridMutableProvider<T>();
    const dragFromIndexRef: RefObject<number> = useRef<number>(-1);
    const draggedRowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
    const draggedRowsRef: RefObject<HTMLTableRowElement[]> = useRef<HTMLTableRowElement[]>([]);
    const draggedIndexesRef: RefObject<number[]> = useRef<number[]>([]);
    const draggedCloneRowRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
    const dragDataRef: RefObject<T[]> = useRef<T[]>([]);
    const dragTargetRef: RefObject<HTMLTableRowElement> = useRef<HTMLTableRowElement>(null);
    const dragSelectionRef: RefObject<boolean> = useRef<boolean>(false);
    const dragSelectionAnchorRef: RefObject<number> = useRef<number>(-1);
    const draggedCloneTableRef: RefObject<HTMLTableElement> = useRef<HTMLTableElement>(null);
    const dragSourceGridRef: RefObject<HTMLElement> = useRef<HTMLElement>(null);
    const dragSourceGridPositionRef: RefObject<string> = useRef<string>('');
    const dragSourceGridZIndexRef: RefObject<string> = useRef<string>('');
    const currentViewDataRef: RefObject<(T | GroupedData<T>)[]> = useRef<(T | GroupedData<T>)[]>(currentViewData);
    const dataSourceRef: RefObject<unknown> = useRef<unknown>(dataSource);
    let autoScrollFrameVertical: number = null;
    let lastMoveEventVertical: DragEvent = null;
    currentViewDataRef.current = currentViewData;
    dataSourceRef.current = dataSource;

    useEffect(() => {
        if (!id || !setCurrentViewData) {
            return undefined;
        }
        const endpoint: DragGridEndpoint<T> = {
            currentViewData: () => currentViewDataRef.current,
            currentDataSource: getCurrentDataSourceItems,
            updateDataSource,
            setCurrentViewData: setCurrentViewData as (data: (T | GroupedData<T>)[]) => void,
            setTotalRecordsCount: setTotalRecordsCount as (value: number | ((prev: number) => number)) => void,
            expandedGroupCountRef: expandedGroupCountRef as RefObject<number>,
            currentPage: pageSettings?.currentPage ?? currentPage,
            pageSize: pageSettings?.pageSize
        };
        dragGridEndpoints.set(id, endpoint as DragGridEndpoint<unknown>);
        return () => {
            if (dragGridEndpoints.get(id) === endpoint) {
                dragGridEndpoints.delete(id);
            }
        };
    }, [id, setCurrentViewData, setTotalRecordsCount]);

    const getPageSizedViewData: <U>(items: U[], size?: number, page?: number) => U[] =
        <U, >(items: U[], size?: number, page?: number): U[] => {
            const isPagingEnabled: boolean = !!pageSettings?.enabled;
            const isGroupedView: boolean = !!groupSettings?.enabled && !!groupSettings?.columns?.length &&
                items.some((item: U): boolean => isGroupedData<T>(item as T | GroupedData<T>));
            if (!Array.isArray(items) || isGroupedView || !isPagingEnabled || !size || size <= 0 || !page || page <= 0) {
                return items;
            }
            const startIndex: number = (page - 1) * size;
            return items.slice(startIndex, startIndex + size);
        };

    const getCurrentDataSourceItems: (updatedData?: (T | GroupedData<T>)[]) => (T | GroupedData<T>)[] =
        (updatedData?: (T | GroupedData<T>)[]): (T | GroupedData<T>)[] => {
            if (Array.isArray(updatedData) && ((groupSettings?.enabled && groupSettings?.columns?.length) ||
                (filterSettings?.enabled && filterSettings?.columns?.length) ||
                (sortSettings?.enabled && sortSettings?.columns?.length) ||
                (searchSettings?.enabled && searchSettings?.value?.length))) {
                return updatedData;
            }
            const dataManager: { dataSource?: { json?: (T | GroupedData<T>)[] } } = dataSourceRef.current as
                { dataSource?: { json?: (T | GroupedData<T>)[] } };
            if (Array.isArray(dataManager?.dataSource?.json)) {
                return dataManager.dataSource.json;
            }
            if (Array.isArray(dataSourceRef.current as unknown[])) {
                return dataSourceRef.current as (T | GroupedData<T>)[];
            }
            return [];
        };

    const getRowIndex: (row: Element | null) => number = (row: Element | null): number => {
        const rowIndex: number = Number.parseInt(row?.getAttribute('aria-rowindex') || '', 10);
        return Number.isNaN(rowIndex) ? -1 : rowIndex - 1;
    };

    const getContentRowIndex: (row: HTMLTableRowElement | null) => number =
        (row: HTMLTableRowElement | null): number => {
            const rowIndex: number = getRowIndex(row);
            if (rowIndex < 0 || !row) {
                return rowIndex;
            }
            const gridElement: Element | null = row.closest('.sf-grid');
            const topPinnedRowCount: number = gridElement?.querySelectorAll('tr.sf-pinned-row-top').length ?? 0;
            return rowIndex - topPinnedRowCount;
        };

    const getEventArgs: (event: MouseEvent, dropIndex: number, target: Element | null) => RowDragEventArgs<T> =
        (event: MouseEvent, dropIndex: number, target: Element | null): RowDragEventArgs<T> => ({
            data: dragDataRef.current,
            dropIndex,
            fromIndex: dragFromIndexRef.current,
            originalEvent: event,
            rows: draggedRowsRef.current,
            target
        });

    const clearDragSourceGridStyle: () => void = (): void => {
        const dragSourceGrid: HTMLElement = dragSourceGridRef.current;
        if (!dragSourceGrid) {
            return;
        }
        dragSourceGrid.classList.remove(CSS_GRID_DRAG_SOURCE);
        dragSourceGrid.style.position = dragSourceGridPositionRef.current;
        dragSourceGrid.style.zIndex = dragSourceGridZIndexRef.current;
        dragSourceGridRef.current = null;
    };

    const syncGroupedDataView:
    (items: (T | GroupedData<T>)[], movedRecords?: T[], targetRecord?: T, dropIndex?: number) =>
    (T | GroupedData<T>)[] =
        (items: (T | GroupedData<T>)[], movedRecords: T[] = [], targetRecord?: T, dropIndex: number = -1):
        (T | GroupedData<T>)[] => {
            const isGroupingEnabled: boolean = !!groupSettings?.enabled && !!groupSettings?.columns?.length;
            if (!isGroupingEnabled || !Array.isArray(items)) {
                return items;
            }
            const movedRecordsSet: Set<T> = new Set<T>(movedRecords);
            const findTargetGroup: (groupItems: (T | GroupedData<T>)[]) => GroupedData<T> | undefined =
                (groupItems: (T | GroupedData<T>)[]): GroupedData<T> | undefined => {
                    for (const item of groupItems) {
                        if (!isGroupedData<T>(item)) {
                            continue;
                        }
                        if (targetRecord && item.items?.some((child: T | GroupedData<T>): boolean => child === targetRecord)) {
                            return item;
                        }
                        const nestedTargetGroup: GroupedData<T> | undefined = findTargetGroup(item.items ?? []);
                        if (nestedTargetGroup) {
                            return nestedTargetGroup;
                        }
                    }
                    return undefined;
                };
            const targetGroup: GroupedData<T> | undefined = targetRecord ? findTargetGroup(items) : undefined;
            const normalizedItems: (T | GroupedData<T>)[] = [];
            for (const item of items) {
                if (isGroupedData<T>(item)) {
                    const childItems: (T | GroupedData<T>)[] = item.items ?? [];
                    const filteredChildren: (T | GroupedData<T>)[] = childItems.filter((child: T | GroupedData<T>): boolean => {
                        if (isGroupedData<T>(child)) {
                            return true;
                        }
                        return !movedRecordsSet.has(child as T) &&
                            (child as Record<string, unknown>)[item.field as string] === item.key;
                    });
                    const nextGroup: GroupedData<T> = { ...item, items: filteredChildren };
                    if (targetGroup && item.flattedKey === targetGroup.flattedKey) {
                        nextGroup.items = [...filteredChildren, ...movedRecords];
                    }
                    nextGroup.count = filteredChildren.reduce((total: number, child: T | GroupedData<T>): number =>
                        total + (isGroupedData<T>(child) ? (child.count ?? 0) : 1), 0);
                    if (targetGroup && item.flattedKey === targetGroup.flattedKey) {
                        nextGroup.count += movedRecords.length;
                    }
                    if (nextGroup.count > 0) {
                        normalizedItems.push(nextGroup);
                    }
                    continue;
                }
                if (!movedRecordsSet.has(item as T)) {
                    normalizedItems.push(item);
                }
            }
            if (movedRecords.length > 0 && dropIndex >= 0 && targetGroup) {
                const toIndex: number = normalizedItems.findIndex((item: T) => item === targetRecord) + 1;
                normalizedItems.splice(toIndex, 0, ...movedRecords);
            }
            return normalizedItems;
        };

    const updateDraggedRecordsGroupKey: (records: T[], targetViewData: (T | GroupedData<T>)[], targetIndex: number) => void =
        (records: T[], targetViewData: (T | GroupedData<T>)[], targetIndex: number): void => {
            if (!groupSettings?.enabled || !groupSettings.columns?.length || !records.length) {
                return;
            }
            const targetItem: T | GroupedData<T> | undefined = targetIndex >= 0 && targetIndex < targetViewData.length ?
                targetViewData[targetIndex as number] : targetViewData[targetViewData.length - 1];
            if (!targetItem) {
                return;
            }
            const targetGroupValues: Record<string, unknown> = {};
            if (isGroupedData<T>(targetItem)) {
                const groupField: string = targetItem.field as string;
                if (groupSettings.columns.includes(groupField) && targetItem.key !== undefined && targetItem.key !== null) {
                    targetGroupValues[groupField as string] = targetItem.key;
                }
            } else if (typeof targetItem === 'object') {
                for (const field of groupSettings.columns) {
                    const value: string | unknown = (targetItem as Record<string, unknown>)[field as string];
                    if (value !== undefined && value !== null) {
                        targetGroupValues[field as string] = value;
                    }
                }
            }
            if (!Object.keys(targetGroupValues).length) {
                return;
            }
            for (const record of records) {
                if (!record || typeof record !== 'object') {
                    continue;
                }
                for (const field of Object.keys(targetGroupValues)) {
                    (record as Record<string, unknown>)[field as string] = targetGroupValues[field as string];
                }
            }
        };

    const updateDataSource: (recordsToRemove: T[], recordsToAdd?: T[], targetRecord?: T,
        insertAfterTarget?: boolean) => void = (recordsToRemove: T[], recordsToAdd: T[] = [], targetRecord?: T,
                                                insertAfterTarget: boolean = false): void => {
        const dataManager: { dataSource?: { json?: (T | GroupedData<T>)[] } } = dataSourceRef.current as
            { dataSource?: { json?: (T | GroupedData<T>)[] } };
        if (dataManager?.dataSource?.json) {
            const sourceData: (T | GroupedData<T>)[] = dataManager.dataSource.json;
            const recordsToRemoveSet: Set<T> = new Set<T>(recordsToRemove);
            const remainingData: (T | GroupedData<T>)[] = sourceData.filter(
                (record: T | GroupedData<T>): boolean => !recordsToRemoveSet.has(record as T)
            );
            const targetIndex: number = targetRecord === undefined ? remainingData.length :
                remainingData.findIndex((record: T | GroupedData<T>): boolean => record === targetRecord);
            const insertionIndex: number = targetIndex < 0 ? remainingData.length : targetIndex + (insertAfterTarget ? 1 : 0);
            remainingData.splice(insertionIndex, 0, ...recordsToAdd);
            dataManager.dataSource.json = remainingData;
        }
    };

    const dragHelper: (args: { sender?: MouseEvent & TouchEvent }) => HTMLElement | null =
        (args: { sender?: MouseEvent & TouchEvent }): HTMLElement | null => {
            const sourceTarget: Element = args.sender?.target as Element;
            const isDragCell: boolean = sourceTarget?.closest('.sf-row-drag-cell') !== null;
            const sourceRow: HTMLTableRowElement = sourceTarget?.closest(CSS_CONTENT_ROW) as HTMLTableRowElement;
            const sourceHandle: Element = sourceTarget?.closest(CSS_ROW_DRAG_HANDLE);
            const fromIndex: number = getContentRowIndex(sourceRow);
            const dragEnabled: boolean = dragAndDropSettings?.enabled === true;
            const isSelectionDrag: boolean = dragEnabled && selectionSettings?.enabled !== false && selectionSettings?.type !== 'Cell'
                && selectionSettings?.mode === 'Multiple' && !sourceHandle && selectionSettings.checkboxOnly !== true && !isDragCell;
            const rowCount: number = isSelectionDrag ? totalRecordsCount : currentViewDataRef.current.length;
            dragSelectionRef.current = isSelectionDrag;
            dragSelectionAnchorRef.current = fromIndex;
            if ((!dragEnabled && !isSelectionDrag) || (!sourceHandle && !isSelectionDrag) || !sourceRow ||
                sourceRow.classList.contains('sf-grid-groupcaptionrow') ||
                sourceRow.classList.contains('sf-grid-edit-row') || sourceRow.classList.contains('sf-pinned-row-top') ||
                sourceRow.classList.contains('sf-pinned-row-bottom') || fromIndex < 0 || fromIndex >= rowCount) {
                return null;
            }
            const draggedCloneTable: HTMLTableElement = createElement('table') as HTMLTableElement;
            const draggedCloneBody: HTMLTableSectionElement = createElement('tbody') as HTMLTableSectionElement;
            if (!isDragCell) {
                draggedCloneTable.className = '';
                draggedCloneBody.style.display = 'none';
            }
            else {
                draggedCloneTable.className = 'sf-grid-drag-table';
            }
            const selectedIndexes: number[] = selectionModule?.selectedRowIndexes;
            dragFromIndexRef.current = fromIndex;
            draggedRowRef.current = sourceRow;
            if (!selectedIndexes.includes(fromIndex)) {
                const rowData: T = currentViewDataRef.current.slice(fromIndex, fromIndex + 1)[0] as T;
                dragDataRef.current = [rowData];
            } else if (isDragCell || dragAndDropSettings?.enabled) {
                const selectedRows: HTMLTableRowElement[] = selectedIndexes.map((index: number) =>
                    contentTableRef.current?.cachedRowObjects?.current?.get(index as number)?.element ??
                    contentTableRef.current?.getRows?.()[index as number] ??
                    (index === fromIndex ? sourceRow : null)
                ).filter((row: HTMLTableRowElement | null): row is HTMLTableRowElement => row !== null);
                draggedRowsRef.current = selectedRows;
                draggedIndexesRef.current = selectedIndexes;
                dragDataRef.current = selectionModule.getSelectedRecords() as T[];
                if (isDragCell) {
                    const draggedCountBadge: HTMLSpanElement = createElement('span', {
                        className: CSS_ROW_DRAG_COUNT,
                        innerHTML: String(dragDataRef.current.length ?? selectedIndexes.length)
                    }) as HTMLSpanElement;
                    draggedCloneTable.appendChild(draggedCountBadge);
                }
            }
            draggedCloneRowRef.current = sourceRow.cloneNode(true) as HTMLTableRowElement;
            const focusedCell: HTMLElement = draggedCloneRowRef.current.querySelector('.sf-focused');
            if (focusedCell) {
                focusedCell.classList.remove('sf-focused', 'sf-focus');
            }
            draggedCloneRowRef.current.classList.add(CSS_ROW_DRAG_CLONE);
            draggedCloneBody.appendChild(draggedCloneRowRef.current);
            draggedCloneTable.appendChild(draggedCloneBody);
            draggedCloneTableRef.current = draggedCloneTable;
            const dragSourceGrid: HTMLElement | null = sourceRow.closest('.sf-grid');
            if (dragSourceGrid) {
                dragSourceGridRef.current = dragSourceGrid;
                dragSourceGridPositionRef.current = dragSourceGrid.style.position;
                dragSourceGridZIndexRef.current = dragSourceGrid.style.zIndex;
                dragSourceGrid.classList.add(CSS_GRID_DRAG_SOURCE);
                dragSourceGrid.style.position = 'relative';
                dragSourceGrid.style.zIndex = '1000000000';
                dragSourceGrid.appendChild(draggedCloneTable);
            }
            return draggedCloneTable;
        };

    /**
     * Handles vertical scrolling during row drag.
     * Scrolls the content container vertically when pointer reaches the top or bottom edge of the viewport.
     * Uses edge threshold detection and auto-scroll via requestAnimationFrame when at grid edges.
     * Only scrolls when there is more content available in that direction.
     *
     * @private
     * @param {DragEvent} moveEvent - Drag event from document drag handler.
     * @returns {void}
     */
    const handleVerticalScroll: (moveEvent: DragEvent) => void = (moveEvent: DragEvent): void => {
        if (!draggedRowRef.current || !dragSourceGridRef.current) { return; }
        lastMoveEventVertical = moveEvent;
        const contentContainer: HTMLElement = dragSourceGridRef.current?.querySelector('.sf-grid-content-container') as HTMLElement;
        const verticalTarget: HTMLElement = contentContainer?.querySelector('.sf-grid-content');
        const verticalBounds: DOMRect = verticalTarget?.getBoundingClientRect();
        const bottomPinnedContainer: HTMLElement = dragSourceGridRef.current?.querySelector('.sf-pinned-rows-bottom-container') as HTMLElement;
        const bottomPinnedBounds: DOMRect = bottomPinnedContainer?.getBoundingClientRect();
        const scrollBottom: number = bottomPinnedBounds && verticalBounds &&
            bottomPinnedBounds.top > verticalBounds.top && bottomPinnedBounds.top < verticalBounds.bottom
            ? bottomPinnedBounds.top : verticalBounds?.bottom;
        const edgeThreshold: number = 32;
        const scrollStep: number = 6;
        const clientY: number = (moveEvent.event as MouseEvent)?.clientY ?? 0;
        const isAboveBottomPinnedRows: boolean = !bottomPinnedBounds || clientY < bottomPinnedBounds.top;

        if (verticalTarget && verticalBounds && clientY > 0) {
            // Scroll up only if there's content above to scroll to
            if (clientY < verticalBounds.top + edgeThreshold && verticalTarget.scrollTop > 0) {
                verticalTarget.scrollTop -= scrollStep;
            }
            // Scroll down only if there's content below to scroll to
            else if (isAboveBottomPinnedRows && clientY > scrollBottom - edgeThreshold &&
                     verticalTarget.scrollTop < verticalTarget.scrollHeight - verticalTarget.clientHeight) {
                verticalTarget.scrollTop += scrollStep;
            }
        }

        // Check if we can still scroll in either direction and pointer is at edge
        const canScrollUp: boolean = verticalTarget && verticalTarget.scrollTop > 0;
        const canScrollDown: boolean = verticalTarget
            && verticalTarget.scrollTop < verticalTarget.scrollHeight - verticalTarget.clientHeight;
        const isAtVerticalEdge: boolean = !!(verticalBounds && clientY > 0 &&
            ((clientY < verticalBounds.top + edgeThreshold && canScrollUp) ||
             (isAboveBottomPinnedRows && clientY > scrollBottom - edgeThreshold && canScrollDown)));

        if (isAtVerticalEdge && autoScrollFrameVertical === null) {
            autoScrollFrameVertical = requestAnimationFrame(() => {
                autoScrollFrameVertical = null;
                if (lastMoveEventVertical) {
                    handleVerticalScroll(lastMoveEventVertical);
                }
            });
        }
    };

    const dragStart: (args: DragEvent) => void = (args: DragEvent): void => {
        if (!draggedRowRef.current) { return; }
        if (dragSelectionRef.current) {
            selectionModule?.selectRowByRange(dragSelectionAnchorRef.current, dragSelectionAnchorRef.current);
            return;
        }
        onRowDragStart?.(getEventArgs(args.event as MouseEvent, -1, null));
    };

    const drag: (args: DragEvent) => void = (args: DragEvent): void => {
        if (!draggedRowRef.current) { return; }
        handleVerticalScroll(args);
        const targetRow: HTMLTableRowElement = (args.target as Element)?.closest(CSS_CONTENT_ROW) as HTMLTableRowElement;
        dragTargetRef.current?.classList.remove(CSS_ROW_DRAG_INDICATOR);
        const isPinnedTarget: boolean = targetRow?.classList.contains('sf-pinned-row-top') ||
            targetRow?.classList.contains('sf-pinned-row-bottom');
        const dropIndex: number = targetRow && !isPinnedTarget && !targetRow.classList.contains('sf-grid-groupcaptionrow')
            ? getContentRowIndex(targetRow) : -1;
        const rowCount: number = dragSelectionRef.current ? totalRecordsCount : currentViewDataRef.current.length;
        if (dropIndex >= 0 && dropIndex < rowCount) {
            if (dragSelectionRef.current !== true) {
                targetRow.classList.add(CSS_ROW_DRAG_INDICATOR);
            }
            dragTargetRef.current = targetRow;
        } else {
            dragTargetRef.current = null;
        }
        if (dragSelectionRef.current && dropIndex >= 0) {
            selectionModule?.selectRowByRange(dragSelectionAnchorRef.current, dropIndex);
            return;
        }
        onRowDrag?.(getEventArgs(args.event as MouseEvent, dropIndex, dropIndex >= 0 ? targetRow : null));
    };

    const dragStop: (args: DragEvent) => Promise<void> = async (args: DragEvent): Promise<void> => {
        const updateViewDataAfterDrop: (viewData: (T | GroupedData<T>)[], gridExpandedRef?: RefObject<number>) => void =
            (viewData: (T | GroupedData<T>)[], gridExpandedRef?: RefObject<number>): void => {
                const isGroupingEnabled: boolean = !!groupSettings?.enabled && !!groupSettings?.columns?.length;
                if (isGroupingEnabled && gridExpandedRef) {
                    gridExpandedRef.current = viewData.length;
                }
            };

        const clearDragState: () => void = (): void => {
            draggedRowRef.current?.classList.remove(CSS_ROW_DRAGGING);
            draggedRowRef.current?.removeAttribute('aria-grabbed');
            dragTargetRef.current?.classList.remove(CSS_ROW_DRAG_INDICATOR);
            draggedCloneTableRef.current?.remove();
            clearDragSourceGridStyle();
            if (autoScrollFrameVertical !== null) {
                cancelAnimationFrame(autoScrollFrameVertical);
                autoScrollFrameVertical = null;
            }
        };

        const targetRow: HTMLTableRowElement = (args.target as Element)?.closest(CSS_CONTENT_ROW) as HTMLTableRowElement;
        const targetGrid: Element = (args.target as Element)?.closest('[role="grid"]');
        const targetGridId: string = targetGrid?.getAttribute('id');
        const isCrossGridDrop: boolean = !!dragAndDropSettings?.enabled && !!dragAndDropSettings.targetID &&
            targetGridId === dragAndDropSettings.targetID && targetGridId !== id;
        const targetEndpoint: DragGridEndpoint<T> = isCrossGridDrop ?
            dragGridEndpoints.get(targetGridId) as DragGridEndpoint<T> : undefined;
        const isSameGridDrop: boolean = targetGridId === id;
        const isPinnedTarget: boolean = targetRow?.classList.contains('sf-pinned-row-top') ||
            targetRow?.classList.contains('sf-pinned-row-bottom');
        let dropIndex: number = targetRow && !isPinnedTarget && !targetRow.classList.contains('sf-grid-groupcaptionrow')
            ? getContentRowIndex(targetRow) : -1;
        const eventArgs: RowDragEventArgs<T> = getEventArgs(args.event as MouseEvent, dropIndex,
                                                            dropIndex >= 0 ? targetRow : null);
        const fromIndex: number = dragFromIndexRef.current;
        const movedRecords: T[] = [...dragDataRef.current];
        const movedRecordCount: number = movedRecords.length;
        const shouldRefreshTotalRecordsCount: boolean = !!pageSettings?.enabled || !!groupSettings?.enabled;
        const shouldAllowUndoRedoClear: boolean = editModule?.editSettings?.allowUndoRedo ?
            await editModule.confirmUndoRedoClear() : true;
        if (movedRecordCount && (dropIndex >= 0 || isCrossGridDrop) && !shouldAllowUndoRedoClear) {
            clearDragState();
            return;
        }

        if (targetEndpoint && movedRecordCount) {
            const targetData: (T | GroupedData<T>)[] = targetEndpoint.currentViewData();
            updateDraggedRecordsGroupKey(movedRecords, targetData, dropIndex >= 0 ? dropIndex : Math.max(targetData.length - 1, 0));
            targetEndpoint.updateDataSource([], movedRecords, dropIndex >= 0 ? targetData[dropIndex as number] as T : undefined);
            const refreshedTargetData: (T | GroupedData<T>)[] = getPageSizedViewData(
                targetEndpoint.currentDataSource(),
                targetEndpoint.pageSize,
                targetEndpoint.currentPage
            );
            targetEndpoint.setCurrentViewData(refreshedTargetData);
            updateViewDataAfterDrop(refreshedTargetData, targetEndpoint.expandedGroupCountRef);
            if (shouldRefreshTotalRecordsCount) {
                targetEndpoint.setTotalRecordsCount?.((prev: number) => Math.max(prev + movedRecordCount, 0));
            }

            // Remove moved records from source (O(n) instead of O(n²))
            const draggedDataSet: Set<T> = new Set<T>(movedRecords);
            const sourceIndexesToRemove: number[] = [];
            for (let i: number = 0; i < currentViewDataRef.current.length; i++) {
                if (draggedDataSet.has(currentViewDataRef.current[i as number] as T)) {
                    sourceIndexesToRemove.push(i);
                }
            }
            // Remove in reverse order to maintain indexes
            for (let i: number = sourceIndexesToRemove.length - 1; i >= 0; i--) {
                currentViewDataRef.current.splice(sourceIndexesToRemove[i as number], 1);
            }

            updateDataSource(movedRecords);
            selectionModule?.clearDeletedSelections(movedRecords);
            const refreshedSourcePage: (T | GroupedData<T>)[] = syncGroupedDataView(getCurrentDataSourceItems(undefined),
                                                                                    movedRecords, undefined, -1);
            const updatedSourceViewData:
            (T | GroupedData<T>)[] = getPageSizedViewData(refreshedSourcePage, pageSettings?.pageSize,
                                                          pageSettings?.currentPage ?? currentPage);
            setCurrentViewData?.(updatedSourceViewData);
            updateViewDataAfterDrop(updatedSourceViewData, expandedGroupCountRef);
            if (shouldRefreshTotalRecordsCount) {
                setTotalRecordsCount?.((prev: number) => Math.max(prev - movedRecordCount, 0));
            }
        } else if (dragSelectionRef.current) {
            dragFromIndexRef.current = -1;
            dragSelectionRef.current = false;
            dragSelectionAnchorRef.current = -1;
            draggedRowRef.current = null;
            draggedCloneRowRef.current = null;
            draggedCloneTableRef.current?.remove();
            draggedCloneTableRef.current = null;
            clearDragSourceGridStyle();
            dragTargetRef.current = null;
            return;
        }

        if (!selectionModule?.selectedRowIndexes.includes(fromIndex) && isSameGridDrop) {
            if (dropIndex >= 0 && dropIndex !== fromIndex) {
                const updatedData: (T | GroupedData<T>)[] = [...currentViewDataRef.current];
                const draggedRecord: T | GroupedData<T> = updatedData[fromIndex as number];
                const targetRecord: T | GroupedData<T> = updatedData[dropIndex as number];
                updateDraggedRecordsGroupKey([draggedRecord as T], updatedData, dropIndex);
                updatedData.splice(fromIndex, 1);
                updatedData.splice(dropIndex, 0, draggedRecord);
                updateDataSource([draggedRecord as T], [draggedRecord as T], targetRecord as T, true);
                const refreshedSameGridPage: (T | GroupedData<T>)[] = syncGroupedDataView(
                    getCurrentDataSourceItems(updatedData),
                    [draggedRecord as T],
                    targetRecord as T,
                    dropIndex
                );
                const updatedCurrentViewData:
                (T | GroupedData<T>)[] = getPageSizedViewData(refreshedSameGridPage, pageSettings?.pageSize,
                                                              pageSettings?.currentPage ?? currentPage);
                setCurrentViewData?.(updatedCurrentViewData);
                updateViewDataAfterDrop(updatedCurrentViewData, expandedGroupCountRef);
            }
        } else if (isSameGridDrop) {
            const draggedIndexes: number[] = draggedIndexesRef.current;
            if (dropIndex >= 0 && draggedIndexes.length) {
                const draggedIndexesSet: Set<number> = new Set<number>(draggedIndexes);
                if (!draggedIndexesSet.has(dropIndex)) {
                    const updatedData: (T | GroupedData<T>)[] = [...currentViewDataRef.current];
                    const draggedRecords: (T | GroupedData<T>)[] = draggedIndexes.map((index: number) => updatedData[index as number]);
                    const targetRecord: T | GroupedData<T> = updatedData[dropIndex as number];
                    dropIndex = dropIndex > fromIndex ? dropIndex + 1 : dropIndex;
                    const insertionIndex: number = dropIndex - draggedIndexes.filter((index: number) => index < dropIndex).length;
                    updateDraggedRecordsGroupKey(draggedRecords as T[], updatedData, dropIndex);
                    // Remove in reverse order to maintain indexes (O(n))
                    draggedIndexes.sort();
                    for (let i: number = draggedIndexes.length - 1; i >= 0; i--) {
                        updatedData.splice(draggedIndexes[i as number], 1);
                    }
                    updatedData.splice(insertionIndex, 0, ...draggedRecords);
                    updateDataSource(draggedRecords as T[], draggedRecords as T[], targetRecord as T, true);
                    const refreshedMultiGridPage: (T | GroupedData<T>)[] = syncGroupedDataView(
                        getCurrentDataSourceItems(updatedData),
                        draggedRecords as T[],
                        targetRecord as T,
                        dropIndex
                    );
                    const updatedCurrentViewData:
                    (T | GroupedData<T>)[] = getPageSizedViewData(refreshedMultiGridPage, pageSettings?.pageSize,
                                                                  pageSettings?.currentPage ?? currentPage);
                    setCurrentViewData?.(updatedCurrentViewData);
                    updateViewDataAfterDrop(updatedCurrentViewData, expandedGroupCountRef);
                }
            }
        }

        clearDragState();
        onRowDrop?.(eventArgs);
        dragFromIndexRef.current = -1;
        draggedRowRef.current = null;
        draggedRowsRef.current = [];
        draggedIndexesRef.current = [];
        draggedCloneRowRef.current = null;
        draggedCloneTableRef.current = null;
        dragDataRef.current = [];
        dragTargetRef.current = null;
    };

    return { dragHelper, dragStart, drag, dragStop };
};

export const useRowReorder: <T>(contentTableRef: RefObject<ContentTableRef<T>>) => DragAndDropHandlers = useDragAndDrop;
