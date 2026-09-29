import { ReactElement, useCallback, useMemo, useRef, useState } from 'react';
import { ColumnReorderEvent, ColumnReorderStartEvent, ColumnReorderModule, ReorderModuleOptions, ColumnReorderEndEvent, ReorderHelper } from '../types/reorder.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { getEffectiveOrderIndex } from '../utils/utils';
import { useRowReorder } from './useDragAndDrop';

/* eslint-disable valid-jsdoc */
/**
 * Custom hook that provides interactive and programmatic column reorder logic for the grid.
 * Encapsulates pointer handlers wired to the header cell, a transient drag state held in a ref, and an O(range) `orderIndex` shift that reorders columns by mutating `options.uiColumns.current` and bumping `setColumnReorderState({})` to commit the new visual order.
 * Per-column `allowReorder` opt-out is honored (forced `false` for command and checkbox columns in `useColumn`); `onColumnReorderStart` (cancelable) fires at pointer down, `onColumnDrag` fires per move when the target `orderIndex` changes, and `onColumnReorderEnd` (cancelable) fires at pointer up.
 *
 * @private
 * @template T - Row data type.
 * @param {ReorderModuleOptions<T>} options - Module options including grid ref, reorder settings, column collections, event callbacks, the `setColumnReorderState` setter, and the RTL flag.
 * @param {RefObject<GridRef<T>>} options.gridRef - Ref to the grid's imperative API used to resolve the grid root element for helper positioning.
 * @param {ReorderSettings} options.reorderSettings - Active grid-level reorder settings (enable).
 * @param {ColumnProps<T>[]} options.columns - Array of prepared columns; used by `reorderColumns` to look up target columns by `field`.
 * @param {RefObject<ColumnProps<T>[]>} options.uiColumns - Internal uiColumns used to resolve column objects by `field` or `orderIndex` and to mutate `orderIndex` for the visual order.
 * @param {(event: ColumnReorderStartEvent<T>) => void} options.onColumnReorderStart - Grid `onColumnReorderStart` callback invoked (cancelable) at the start of each interactive or programmatic reorder.
 * @param {(event: ColumnReorderEvent<T>) => void} options.onColumnDrag - Grid `onColumnDrag` callback invoked per pointer move when the target column's `orderIndex` changes.
 * @param {(event: ColumnReorderEndEvent<T>) => void} options.onColumnReorderEnd - Grid `onColumnReorderEnd` callback invoked (cancelable) at the end of each interactive or programmatic reorder.
 * @param {Dispatch<SetStateAction<Object>>} options.setColumnReorderState - Reorder state setter; bumped on drop or programmatic reorder to trigger `prepareColumns` to re-emit the new visual order.
 * @param {boolean} options.rtl - When true, the helper `left` offset is flipped when the move direction inverts relative to LTR.
 * @returns {ColumnReorderModule<T>} The module exposing the active reorder settings, the `onColumnPointerDown` handler, the transient `reorderState` ref, the `reorderHelper` state, and the programmatic `reorderColumnByIndex` and `reorderColumns` invokers.
 * @default reorderSettings: { enabled: true }
 * @event onColumnReorderStart
 * @event onColumnDrag
 * @event onColumnReorderEnd
 */
/* eslint-enable valid-jsdoc */
const useColumnReorder: <T>(options: ReorderModuleOptions<T>) => ColumnReorderModule<T> =
    <T, >(options: ReorderModuleOptions<T>): ColumnReorderModule<T> => {

        const {reorderState, isStackedHeader, stackedFlattedColumnProps, allStackedColumnProps} = options;
        const optionsRef: React.RefObject<ReorderModuleOptions<T>> = useRef<ReorderModuleOptions<T>>(options);
        optionsRef.current = options;
        // Helper chevron placement state consumed by the `sf-grid-reorder-helper` icons rendered in `src/grid/components/Grid.tsx`.
        const [reorderHelper, setReorderHelper] = useState<ReorderHelper>({
            reordering: false,
            left: '0px',
            top: '0px',
            bottom: '0px'
        });

        const getColumnFromUID: (columns: ColumnProps<T>[], uid: string) => ColumnProps<T> = useCallback((columns: ColumnProps<T>[],
                                                                                                          uid: string): ColumnProps<T> => {
            let column: ColumnProps<T>;
            for (let i: number = 0; i < columns.length; i++) {
                const col: ColumnProps<T> = columns[i as number];
                if (col.uid === uid) {
                    if (options?.isStackedHeader && !col.columns?.length && (col.children as ReactElement[])?.length) {
                        column = getColumnFromUID(options?.uiColumns.current, uid);
                    } else {
                        column = col;
                    }
                } else if (col.columns) {
                    column = getColumnFromUID(col.columns, uid);
                }
                if (column) { break; }
            }
            return column;
        }, []);

        /**
         * Checks if a column exists within another column's children (recursively).
         * Used for stacked header reorder validation to ensure dragged column is a child of target column.
         *
         * @param draggedColumn The column being dragged
         * @param targetColumn The target column under the pointer
         * @returns true if draggedColumn exists in targetColumn's children hierarchy
         */
        const isColumnInChildren: (
            draggedColumn: ColumnProps<T>,
            targetColumn: ColumnProps<T>
        ) => boolean = useCallback((draggedColumn: ColumnProps<T>, targetColumn: ColumnProps<T>): boolean => {
            if (!targetColumn.columns || targetColumn.columns.length === 0) {
                return false;
            }

            for (const child of targetColumn.columns) {
                if (child.uid === draggedColumn.uid) {
                    return true;
                }
                if (child.columns?.length && isColumnInChildren(draggedColumn, child)) {
                    return true;
                }
            }

            return false;
        }, []);

        // Resolves a column from a pointer event target by walking up to the closest `.sf-cell`, querying the inner `.sf-grid-header-cell` for its `data-mappinguid`, and looking it up in `options.uiColumns.current`.
        const getColumnFromTarget: (target: EventTarget) => ColumnProps<T> = useCallback((target: EventTarget): ColumnProps<T> => {
            const element: HTMLElement = target as HTMLElement;
            const headerCell: HTMLElement = element?.querySelector('.sf-grid-header-cell');
            const uid: string = headerCell?.getAttribute('data-mappinguid');
            return isStackedHeader ? getColumnFromUID(allStackedColumnProps ?? options.uiColumns.current, uid)
                : options.uiColumns.current.find((column: ColumnProps<T>) => column.uid === uid);
        }, [allStackedColumnProps, options.uiColumns.current]);

        /**
         * Resolves the bottom edge of a stacked target for the reorder indicator.
         * Uses the first child for a left insertion edge and the last child for a right insertion edge.
         *
         * @param {HTMLElement} targetCell - Target header cell
         * @param {ColumnProps<T>} column - Target column
         * @param {boolean} isRightEdge - Indicates a right-side insertion edge
         * @returns {number} Bottom coordinate relative to the grid element
         * @private
         */
        const getStackedIndicatorBottom: (
            targetCell: HTMLElement, column: ColumnProps<T>, isRightEdge: boolean
        ) => number = useCallback((targetCell: HTMLElement, column: ColumnProps<T>, isRightEdge: boolean): number => {
            const targetBottom: number = targetCell.getBoundingClientRect().bottom;
            if (!isStackedHeader || !column?.columns?.length) {
                return targetBottom;
            }

            const targetGrid: Element = targetCell.closest('.sf-grid');
            let childColumn: ColumnProps<T> = isRightEdge
                ? column.columns[column.columns.length - 1]
                : column.columns[0];
            while (childColumn?.columns?.length) {
                childColumn = isRightEdge
                    ? childColumn.columns[childColumn.columns.length - 1]
                    : childColumn.columns[0];
            }
            const childCell: HTMLElement = Array.from(
                targetGrid?.querySelectorAll<HTMLElement>('.sf-grid-header-cell[data-mappinguid]') ?? []
            ).find((cell: HTMLElement) => cell.getAttribute('data-mappinguid') === childColumn?.uid)?.closest('.sf-cell') as HTMLElement;

            return childCell?.getBoundingClientRect().bottom ?? targetBottom;
        }, [isStackedHeader]);

        /**
         * Applies the O(range) `orderIndex` shift to commit a reorder.
         * Builds a sorted snapshot of `options.uiColumns.current` once, then walks `[min(fromIndex, toIndex), max(fromIndex, toIndex)]` setting the target column's `orderIndex` to `toIndex` and shifting each intermediate column by `+1` (move forward) or `-1` (move backward).
         * Mutates `uiColumns.current` in place; the caller is responsible for invoking `setColumnReorderState({})` to trigger a re-prepare.
         *
         * @private
         * @param {ColumnProps} column - The column being moved.
         * @param {number} fromIndex - Source `orderIndex`.
         * @param {number} toIndex - Target `orderIndex`.
         * @returns {void}
         */
        const reorderColumn: (column: ColumnProps<unknown>, fromIndex: number, toIndex: number) => void =
            useCallback((column: ColumnProps, fromIndex: number, toIndex: number): void => {
                const sortedColumns: ColumnProps<T>[] = [...options.uiColumns.current]
                    .sort((a: ColumnProps<T>, b: ColumnProps<T>) => a.orderIndex - b.orderIndex);
                const increment: number = toIndex < fromIndex ? 1 : -1;
                const start: number = Math.min(fromIndex, toIndex);
                const end: number = Math.max(fromIndex, toIndex);

                for (let i: number = start; i <= end; i++) {
                    const col: ColumnProps<T> = sortedColumns[i as number];
                    if (!col) { continue; }
                    if (col.uid === column.uid) {
                        col.orderIndex = toIndex;
                    } else {
                        col.orderIndex += increment;
                    }
                }
            }, [options]);

        /**
         * Handles the `document`-level `pointerup` event that ends the active reorder interaction.
         * Resolves the drop target, fires `onColumnReorderEnd` (cancelable), and if not canceled with a changed `orderIndex` calls `reorderColumn` and `setColumnReorderState({})`. Always resets `reorderHelper` and removes the document listeners, then clears `reorderState`.
         * Drops outside the grid header row are a no-op (state is reset without committing).
         * Cancels any pending auto-scroll animation frame.
         *
         * @private
         * @returns {void}
         */
        const finishPointerReorder: () => Promise<void> = useCallback(async (): Promise<void> => {
            const target: HTMLElement = reorderState.current.target;

            if (target?.closest('.sf-grid') && target?.closest('.sf-grid-header-row') && target?.closest('.sf-cell')) {
                const column: ColumnProps<T> = getColumnFromTarget(target.closest('.sf-cell'));

                const dropEvent: ColumnReorderEndEvent<T> = {
                    column: reorderState.current.column as ColumnProps<T>,
                    fromIndex: reorderState.current.fromIndex,
                    toIndex: column?.orderIndex,
                    cancel: false
                };
                optionsRef.current.onColumnReorderEnd?.(dropEvent);

                if (!dropEvent.cancel && reorderState.current.column?.uid !== column?.uid) {
                    const shouldAllowUndoRedoClear: boolean = optionsRef.current.gridRef.current?.editModule?.editSettings?.allowUndoRedo ?
                        await optionsRef.current.gridRef.current.editModule.confirmUndoRedoClear() : true;
                    if (shouldAllowUndoRedoClear) {
                        reorderState.current.targetColumn = column;
                        if (!isStackedHeader) {
                            reorderColumn(dropEvent.column, dropEvent.fromIndex, dropEvent.toIndex);
                        }

                        const draggedColumn: ColumnProps<T> = reorderState.current.column as ColumnProps<T>;
                        const targetColumn: ColumnProps<T> = column;

                        if (draggedColumn && targetColumn && targetColumn.pinDirection) {
                            draggedColumn.pinDirection = targetColumn.pinDirection;
                        }
                        options.setColumnReorderState({});
                        optionsRef.current.gridRef.current?.clearUndoRedoHistory?.();
                    }
                }
            }

            if (autoScrollFrame !== null) {
                cancelAnimationFrame(autoScrollFrame);
                autoScrollFrame = null;
            }

            setReorderHelper({
                reordering: false,
                left: '0px',
                top: '0px',
                bottom: '0px'
            });

            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', finishPointerReorder);
            // reorderState.current = { column: null, fromIndex: -1, toIndex: -1, target: null };
        }, [options, getColumnFromTarget]);

        /**
         * Handles horizontal scrolling during column reorder drag.
         * Scrolls the header row horizontally when pointer reaches the left or right edge of the viewport.
         * Uses edge threshold detection and auto-scroll via requestAnimationFrame when at grid edges.
         *
         * @private
         * @param {PointerEvent} moveEvent - Pointer event from document pointermove.
         * @returns {void}
         */
        let autoScrollFrame: number = null;
        let lastMoveEvent: PointerEvent = null;

        const handleHorizontalScroll: (moveEvent: PointerEvent) => void = useCallback((moveEvent: PointerEvent): void => {
            if (isNullOrUndefined(options.gridRef.current.element)) { return; }
            lastMoveEvent = moveEvent;
            const contentContainer: HTMLElement = options.gridRef.current.element.querySelector('.sf-grid-content-container') as HTMLElement;
            const horizontalTarget: HTMLElement = contentContainer.querySelector('.sf-grid-content');
            const horizontalBounds: DOMRect = horizontalTarget?.getBoundingClientRect();
            const edgeThreshold: number = 32;
            const scrollStep: number = 6;

            if (horizontalTarget && horizontalBounds) {
                if (moveEvent.clientX < horizontalBounds.left + edgeThreshold) {
                    horizontalTarget.scrollLeft -= scrollStep;
                } else if (moveEvent.clientX > horizontalBounds.right - edgeThreshold) {
                    horizontalTarget.scrollLeft += scrollStep;
                }
            }

            const isAtEdge: boolean = !!(horizontalBounds &&
                (moveEvent.clientX < horizontalBounds.left + edgeThreshold || moveEvent.clientX > horizontalBounds.right - edgeThreshold));

            if (isAtEdge && autoScrollFrame === null) {
                autoScrollFrame = requestAnimationFrame(() => {
                    autoScrollFrame = null;
                    if (lastMoveEvent) {
                        handleHorizontalScroll(lastMoveEvent);
                    }
                });
            }
        }, [options]);

        /**
         * Handles the `document`-level `pointermove` event during an active reorder.
         * Resolves the pointer target to a column; if the resolved `orderIndex` differs from the previous target, fires `onColumnDrag` with the new `toIndex` (no event when `toIndex` is unchanged). When the move direction is forward in LTR (or backward in RTL), adds the cell width to the helper `left` offset. Always updates `reorderHelper` with the latest position, hiding it when no valid column is under the pointer.
         * Invokes horizontal scrolling to auto-scroll when pointer reaches left or right edges.
         *
         * @private
         * @param {PointerEvent} moveEvent - Pointer event from document pointermove.
         * @returns {void}
         */
        const handlePointerMove: (moveEvent: PointerEvent) => void = useCallback((moveEvent: PointerEvent): void => {
            handleHorizontalScroll(moveEvent);
            const target: HTMLElement = reorderState.current.target;
            let column: ColumnProps<T>;

            if (target?.closest('.sf-grid') && target?.closest('.sf-grid-header-row') && target?.closest('.sf-cell')) {
                column = getColumnFromTarget(target.closest('.sf-cell'));

                if (column && reorderState.current.toIndex !== column.orderIndex) {
                    reorderState.current.toIndex = column.orderIndex;
                    const dragEvent: ColumnReorderEvent<T> = {
                        column: reorderState.current.column as ColumnProps<T>,
                        fromIndex: reorderState.current.fromIndex,
                        toIndex: reorderState.current.toIndex
                    };
                    optionsRef.current.onColumnDrag?.(dragEvent);
                }
            }

            let helperInfo: ReorderHelper = {
                reordering: false,
                left: '0px',
                top: '0px',
                bottom: '0px'
            };
            // For stacked headers, additionally validate that dragged column exists in target column's children
            const targetOrderIndex: number = column && getEffectiveOrderIndex(column);
            const sourceOrderIndex: number = reorderState.current.column &&
                getEffectiveOrderIndex(reorderState.current.column as ColumnProps<T>);
            const isValidTarget: boolean = !isNullOrUndefined(column) && reorderState.current.column.uid !== column.uid &&
                (!isStackedHeader || !isColumnInChildren(reorderState.current.column as ColumnProps<T>, column));

            if (isValidTarget) {
                const cell: HTMLElement = target?.closest('.sf-cell');
                const cellClientRect: DOMRect = cell.getBoundingClientRect();
                const elementClientRect: DOMRect = options.gridRef.current.element.getBoundingClientRect();
                const top: number = cellClientRect.top - elementClientRect.top - 6.5;
                const isRightEdge: boolean = (!options.rtl && targetOrderIndex > sourceOrderIndex)
                    || (options.rtl && targetOrderIndex < sourceOrderIndex);
                const bottom: number = isStackedHeader ? getStackedIndicatorBottom(cell, column, isRightEdge) - 9.5 - elementClientRect.top
                    : top + cellClientRect.height - 3;
                const targetLeft: number = cellClientRect.left;
                const targetRight: number = cellClientRect.right;
                const gridLeft: number = elementClientRect.left;
                const gridRight: number = elementClientRect.right;
                const indicatorBoundary: number = isRightEdge ? targetRight : targetLeft;
                const constrainedBoundary: number = Math.max(gridLeft, Math.min(indicatorBoundary, gridRight));
                const left: number = constrainedBoundary - elementClientRect.left - 8;

                helperInfo = {
                    reordering: true,
                    left: left + 'px',
                    top: top + 'px',
                    bottom: bottom + 'px'
                };
            }
            setReorderHelper(helperInfo);
        }, [getColumnFromTarget, handleHorizontalScroll, options]);

        /**
         * Handles the pre-action `pointerdown` on a column header cell.
         * Resolves the target to a column; exits early when `column.allowReorder` is `false`. Fires `onColumnReorderStart` (cancelable) and exits early when canceled. Initializes `reorderState` with the resolved column, source `orderIndex`, and pointer target, then attaches the `document`-level `pointermove` and `pointerup` listeners.
         *
         * @private
         * @param {React.PointerEvent} event - React pointer event from the header cell.
         * @returns {void}
         */
        const onColumnPointerDown: (event: React.PointerEvent) => void =
            useCallback((event: React.PointerEvent): void => {
                const column: ColumnProps<T> = getColumnFromTarget((event.target as HTMLElement).closest('.sf-cell'));

                if (!column.allowReorder) { return; }

                const startEvent: ColumnReorderStartEvent<T> = {
                    column,
                    fromIndex: column.orderIndex,
                    toIndex: column.orderIndex,
                    cancel: false
                };
                optionsRef.current.onColumnReorderStart?.(startEvent);
                if (startEvent.cancel) { return; }

                reorderState.current = {
                    column,
                    fromIndex: column.orderIndex,
                    toIndex: column.orderIndex,
                    target: event.target as HTMLElement
                };

                document.addEventListener('pointermove', handlePointerMove);
                document.addEventListener('pointerup', finishPointerReorder);
            }, [finishPointerReorder, getColumnFromTarget, handlePointerMove, options]);

        /**
         * Programmatically reorders the column at `orderIndex === fromIndex` to `toIndex`.
         * Exits early when `reorderSettings.enabled` is `false`, when the target column's `allowReorder` is `false`, or when `toIndex` is out of range. Fires `onColumnReorderStart` and `onColumnReorderEnd` (both cancelable); exits early on either cancel. When `fromIndex !== toIndex` and the operation is not canceled, calls `reorderColumn` and `setColumnReorderState({})`.
         *
         * @private
         * @param {number} fromIndex - Source `orderIndex`.
         * @param {number} toIndex - Target `orderIndex`.
         * @returns {void}
         */
        const reorderColumnByIndex: (fromIndex: number, toIndex: number) => Promise<void> =
            useCallback(async (fromIndex: number, toIndex: number): Promise<void> => {
                const column: ColumnProps = (isStackedHeader ? stackedFlattedColumnProps :
                    options.uiColumns.current).find((col: ColumnProps<T>) => col.orderIndex === fromIndex);
                const targetColumn: ColumnProps = (isStackedHeader ? stackedFlattedColumnProps :
                    options.uiColumns.current).find((col: ColumnProps<T>) => col.orderIndex === toIndex);
                if (!options.reorderSettings.enabled || !column?.allowReorder
                    || toIndex >= (isStackedHeader ? stackedFlattedColumnProps.length : options.uiColumns.current.length)) { return; }
                reorderState.current = {
                    column,
                    fromIndex: fromIndex,
                    toIndex: toIndex,
                    targetColumn: targetColumn,
                    target: null
                };
                const startEvent: ColumnReorderStartEvent<T> = {
                    column,
                    fromIndex: fromIndex,
                    toIndex: toIndex,
                    cancel: false
                };
                optionsRef.current.onColumnReorderStart?.(startEvent);
                if (startEvent.cancel) { return; }

                const dropEvent: ColumnReorderEndEvent<T> = {
                    column,
                    fromIndex: fromIndex,
                    toIndex: toIndex,
                    cancel: false
                };
                optionsRef.current.onColumnReorderEnd?.(dropEvent);
                if (dropEvent.cancel) { return; }

                const shouldAllowUndoRedoClear: boolean = optionsRef.current.gridRef.current?.editModule?.editSettings?.allowUndoRedo ?
                    await optionsRef.current.gridRef.current.editModule.confirmUndoRedoClear() : true;
                if (fromIndex !== toIndex && shouldAllowUndoRedoClear) {
                    reorderColumn(column, fromIndex, toIndex);
                    options.setColumnReorderState({});
                    optionsRef.current.gridRef.current?.clearUndoRedoHistory?.();
                }
            }, [options]);

        /**
         * Programmatically reorders the column(s) whose `field` matches `fieldName` to `toIndex`.
         * Accepts a single field name or an array of field names; iterates the field list in order, skipping entries whose `allowReorder` is `false`. Per affected column, fires `onColumnReorderStart` and `onColumnReorderEnd` (both cancelable). Exits early when `reorderSettings.enabled` is `false`. When at least one column was actually moved, calls `setColumnReorderState({})` once at the end to commit the new visual order.
         *
         * @private
         * @param {string | string[]} fieldName - Single field name or array of field names identifying the column(s) to move.
         * @param {number} toIndex - Target `orderIndex`.
         * @returns {void}
         */
        const reorderColumns: (fieldName: string | string[], toIndex: number) => Promise<void> =
            useCallback(async (fieldName: string | string[], toIndex: number): Promise<void> => {
                const fields: string[] = typeof fieldName === 'string' ? [fieldName] : fieldName;

                if (!options.reorderSettings.enabled) { return; }
                const hasReorderableField: boolean = fields.some((field: string) => options.uiColumns.current.
                    some((column: ColumnProps<T>) =>
                        column.field === field && column.allowReorder));
                const shouldAllowUndoRedoClear: boolean = optionsRef.current.gridRef.current?.editModule?.editSettings?.allowUndoRedo ?
                    await optionsRef.current.gridRef.current.editModule.confirmUndoRedoClear() : true;
                if (hasReorderableField && !shouldAllowUndoRedoClear) {
                    return;
                }

                let reorder: boolean = false;

                for (let i: number = 0; i < fields.length; i++) {
                    const column: ColumnProps<T> = options.uiColumns.current
                        .find((col: ColumnProps<T>) => col.field === fields[i as number]);

                    if (!column?.allowReorder) { continue; }

                    const startEvent: ColumnReorderStartEvent<T> = {
                        column,
                        fromIndex: column.orderIndex,
                        toIndex: toIndex,
                        cancel: false
                    };
                    optionsRef.current.onColumnReorderStart?.(startEvent);
                    if (startEvent.cancel) { continue; }

                    const dropEvent: ColumnReorderEndEvent<T> = {
                        column,
                        fromIndex: column.orderIndex,
                        toIndex: toIndex,
                        cancel: false
                    };
                    optionsRef.current.onColumnReorderEnd?.(dropEvent);
                    if (dropEvent.cancel) { continue; }

                    if (column.orderIndex !== toIndex) {
                        reorder = true;
                        reorderColumn(column, column.orderIndex, toIndex);
                    }
                }

                if (reorder) {
                    options.setColumnReorderState({});
                    optionsRef.current.gridRef.current?.clearUndoRedoHistory?.();
                }
            }, [options]);

        /**
         * Memod `ColumnReorderModule<T>` consumed by `Grid.tsx` and `HeaderPanel.tsx`.
         * Re-emits only when the active `reorderSettings`, `onColumnPointerDown`, `reorderHelper`, `reorderColumnByIndex`, or `reorderColumns` identity changes — keeping the module referentially stable across unrelated renders.
         *
         * @private
         * @returns {ColumnReorderModule<T>} Module exposing `reorderSettings`, `onColumnPointerDown`, `reorderState`, `reorderHelper`, `reorderColumnByIndex`, and `reorderColumns`.
         */
        return useMemo(() => ({
            reorderSettings: options.reorderSettings,
            onColumnPointerDown,
            reorderState,
            reorderHelper,
            reorderColumnByIndex,
            reorderColumns,
            rowReorderModule: useRowReorder
        }), [options.reorderSettings, onColumnPointerDown, reorderHelper, reorderColumnByIndex, reorderColumns]);
    };

export { useColumnReorder as ReorderModule };
