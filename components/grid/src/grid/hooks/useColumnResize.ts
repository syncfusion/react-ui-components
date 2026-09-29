import { useCallback, RefObject, useMemo, useRef, Dispatch, SetStateAction, useState } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { ResizeSettings, ColumnResizeStartEvent, ColumnResizeEvent, ColumnResizeEndEvent, ColumnResizeModule, ColumnWidthInfo, ResizeColumn, ResizeHelper } from '../types/resize.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { applyColumnWidthConstraints, parseUnit } from '../utils';
import { ResizeMode } from '../types/enum';
import { ITooltip } from '@syncfusion/react-popups';

/* eslint-disable valid-jsdoc */
/**
 * Custom hook that provides interactive and programmatic column resize logic for the grid.
 * Encapsulates pointer and keyboard handlers wired to the resize handle, a transient drag state held in a ref, and `Auto` mode redistribution that propagates inverse width delta to subsequent columns that opt in to auto-sizing.
 * Constraints at `minWidth`/`maxWidth` are honored at all times; `onColumnResizeStart` (cancelable), `onColumnResize`, and `onColumnResizeEnd` fire in that order during an interaction.
 *
 * @private
 * @template T - Row data type.
 * @param {RefObject<GridRef>} gridRef - Ref to the grid's imperative API used to access the header table and column lookup helpers.
 * @param {ResizeSettings} resizeSettings - Active grid-level resize settings (enable, mode, throttle, keyboard step).
 * @param {ColumnProps<T>[]} columns - Array of prepared columns; used by `Auto` mode to discover following auto-sizing siblings.
 * @param {(event: ColumnResizeStartEvent) => void} onColumnResizeStart - Grid `onColumnResizeStart` callback invoked (cancelable) at the start of each interactive or programmatic resize.
 * @param {(event: ColumnResizeEvent) => void} onColumnResize - Grid `onColumnResize` callback invoked after each width step during a resize interaction or programmatic invocation.
 * @param {(event: ColumnResizeEndEvent) => void} onColumnResizeEnd - Grid `onColumnResizeEnd` callback invoked once the resize interaction or programmatic invocation completes.
 * @param {boolean} rtl - When true, the pointer drag delta is inverted so resizing matches the RTL layout.
 * @param {ColumnProps<T>[]} uiColumns - Internal uiColumns used to resolve column objects by `field` for programmatic resize.
 * @param {RefObject<ColumnWidthInfo>} columnWidthInfo - Ref to shared width-state flags; the hook sets `resizeTableWidth` so `useRender` re-derives `<col>` widths.
 * @param {Dispatch<SetStateAction<Object>>} setColumnWidthState - Column-width state setter; bumped during pointer move to commit the new width and trigger a re-render.
 * @returns {ColumnResizeModule} The module exposing the active resize settings, pointer and keyboard handlers, and the programmatic `resizeColumns` invoker.
 */
/* eslint-enable valid-jsdoc */
const useColumnResize: <T>(
    gridRef: RefObject<GridRef>,
    resizeSettings: ResizeSettings,
    columns: ColumnProps<T>[],
    onColumnResizeStart: (event: ColumnResizeStartEvent) => void,
    onColumnResize: (event: ColumnResizeEvent) => void,
    onColumnResizeEnd: (event: ColumnResizeEndEvent) => void,
    rtl: boolean,
    uiColumns: ColumnProps<T>[],
    columnWidthInfo: RefObject<ColumnWidthInfo>,
    setColumnWidthState: Dispatch<SetStateAction<Object>>,
    ellipsisTooltipRef: RefObject<ITooltip>
) => ColumnResizeModule =
    <T>(
        gridRef: RefObject<GridRef>,
        resizeSettings: ResizeSettings,
        columns: ColumnProps<T>[],
        onColumnResizeStart: (event: ColumnResizeStartEvent) => void,
        onColumnResize: (event: ColumnResizeEvent) => void,
        onColumnResizeEnd: (event: ColumnResizeEndEvent) => void,
        rtl: boolean,
        uiColumns: ColumnProps<T>[],
        columnWidthInfo: RefObject<ColumnWidthInfo>,
        setColumnWidthState: Dispatch<SetStateAction<Object>>,
        ellipsisTooltipRef: RefObject<ITooltip>
    ): ColumnResizeModule => {
        const [resizeHelper, setResizeHelper] = useState<ResizeHelper>({
            resizing: false,
            left: '0px',
            top: '0px',
            height: '0px'
        });

        const resizeState: RefObject<{
            activeColumn: ColumnProps;
            lastClientX: number;
        }> = useRef<{
            activeColumn: ColumnProps;
            lastClientX: number;
        }>({
            activeColumn: null,
            lastClientX: 0
        });

        /**
         * Applies a width delta to a single column.
         * Computes the new width, clamps it to `minWidth`/`maxWidth`, and when `resizeSettings.mode === ResizeMode.Auto` redistributes the inverse delta across following columns that opt in to auto-sizing (`width: 'auto' | ''`), freezing columns that hit a constraint until the safety guard (entries.length + 1 iterations) is exhausted.
         */
        const resizeColumn: (column: ColumnProps<unknown>, delta: number) => void =
            useCallback((column: ColumnProps, delta: number): void => {

                const previousWidth: number = parseUnit(column.width);
                let newWidth: number = previousWidth + delta;
                newWidth = applyColumnWidthConstraints(column, newWidth);
                column.width = newWidth + 'px';

                if (resizeSettings.mode === ResizeMode.Auto && previousWidth !== newWidth) {
                    // const autoCols: ColumnProps[] = gridRef.current?.getColumns?.()?.filter((_col: ColumnProps<T>, i: number) =>
                    //     uiColumns?.[i as number]?.uid !== column?.uid && (columns?.[i as number]?.width === 'auto' ||
                    //         columns?.[i as number].width === '') && uiColumns?.[i as number].visible);
                    const autoCols: ColumnProps[] = gridRef.current?.getColumns?.()?.filter((_col: ColumnProps<T>, i: number) =>
                        uiColumns?.[i as number]?.uid !== column?.uid && !columns?.[i as number]?.autoFit &&
                    uiColumns?.[i as number].visible);
                    if (autoCols.length) {
                        const differenceWidth: number = delta * -1;
                        let shouldDistribute: boolean = true;
                        if (differenceWidth < 0) {
                            const headerTable: HTMLElement = gridRef.current.getHeaderTable();
                            const contentTable: HTMLTableElement = gridRef.current.getContentTable();
                            const containerWidth: number = contentTable.closest('.sf-grid-content').clientWidth;
                            const cumulativeSiblingWidth: number = uiColumns.reduce(
                                (sum: number, col: ColumnProps<T>) => {
                                    if (!headerTable.querySelector('[data-mappinguid="' + col.uid + '"]')) {
                                        return sum;
                                    }
                                    return sum + parseUnit(col.width);
                                },
                                0
                            );
                            if (cumulativeSiblingWidth <= containerWidth) {
                                shouldDistribute = false;
                            }
                        }
                        if (shouldDistribute) {
                            interface AutoColState {
                                col: ColumnProps;
                                uiCol: ColumnProps;
                                originalWidth: number;
                                frozen: boolean;
                            }
                            const state: AutoColState[] = [];
                            for (let i: number = 0; i < autoCols.length; i++) {
                                const autoCol: ColumnProps = autoCols[parseInt(i.toString(), 10)];
                                const uiCol: ColumnProps | undefined = uiColumns.find(
                                    (c: ColumnProps) => c.uid === autoCol.uid
                                );
                                if (uiCol) {
                                    state.push({
                                        col: autoCol,
                                        uiCol: uiCol,
                                        originalWidth: parseUnit(uiCol.width),
                                        frozen: false
                                    });
                                }
                            }
                            let remaining: number = differenceWidth;
                            const safetyGuard: number = state.length + 1;
                            let guard: number = safetyGuard;
                            while (remaining !== 0 && guard-- > 0) {
                                const liveState: AutoColState[] = state.filter((s: AutoColState) => !s.frozen);
                                if (liveState.length === 0) { break; }
                                const share: number = remaining / liveState.length;
                                let anyFrozen: boolean = false;
                                let totalAbsorbed: number = 0;
                                for (let i: number = 0; i < liveState.length; i++) {
                                    const s: AutoColState = liveState[parseInt(i.toString(), 10)];
                                    const requested: number = s.originalWidth + share;
                                    const constrained: number = applyColumnWidthConstraints(s.uiCol, requested);
                                    if (constrained !== requested) {
                                        s.uiCol.width = constrained + 'px';
                                        totalAbsorbed += (constrained - s.originalWidth);
                                        s.frozen = true;
                                        anyFrozen = true;
                                    } else {
                                        s.uiCol.width = constrained + 'px';
                                        totalAbsorbed += (constrained - s.originalWidth);
                                        s.originalWidth = constrained;
                                    }
                                }
                                remaining -= totalAbsorbed;
                                if (!anyFrozen) { break; }
                            }
                        }
                    }
                }

                onColumnResize?.({
                    column,
                    width: newWidth
                });

                columnWidthInfo.current.resizeTableWidth = true;

            }, [gridRef, columns, onColumnResize, uiColumns, columnWidthInfo, resizeSettings?.mode]);

        // Computes the `top` offset and full vertical `height` for the resize helper overlay.
        const getResizeHelperMetrics: () => { top: number; height: number } =
            useCallback((): { top: number; height: number } => {
                const headerContainer: HTMLElement = gridRef.current.element.querySelector('.sf-grid-header-container');
                const top: number = headerContainer.offsetTop;
                const contentContainer: HTMLElement = gridRef.current.element.querySelector('.sf-grid-content-container') as HTMLElement;
                const actualHeight: number = contentContainer.getBoundingClientRect().height;
                const gridContent: HTMLElement = contentContainer.querySelector('.sf-grid-content') as HTMLElement;
                const horizontalScrollbarHeight: number = gridContent.offsetHeight - gridContent.clientHeight;
                const heightWithoutScrollbar: number = actualHeight - horizontalScrollbarHeight;
                let height: number = headerContainer.getBoundingClientRect().height + heightWithoutScrollbar;
                const footerContainer: HTMLElement = gridRef.current.element.querySelector('.sf-grid-footer-container');
                if (footerContainer) {
                    height += footerContainer.getBoundingClientRect().height;
                }
                return { top, height };
            }, []);

        /**
         * Handles a `document`-level `pointermove` event during an active resize.
         */
        const onResizeHandlePointerMove: (e: PointerEvent) => void =
            useCallback((e: PointerEvent): void => {

                e.preventDefault();
                e.stopPropagation();

                const oldActiveColumnWidth: number = parseUnit(resizeState.current.activeColumn.width);
                const gridColumns: ColumnProps[] = gridRef.current?.getColumns?.();
                const activeColumn: ColumnProps = resizeState.current.activeColumn;
                const getColumnWidth: (column: ColumnProps) => number = (column: ColumnProps) => {
                    if (column.uid === activeColumn.uid) {
                        return parseUnit(activeColumn.width);
                    }
                    const uiColumn: ColumnProps = uiColumns?.find((currentColumn: ColumnProps) => currentColumn.uid === column.uid);
                    return parseUnit(uiColumn?.width);
                };
                const oldColumnWidths: Map<string, number> = new Map(gridColumns.map((column: ColumnProps) =>
                    [column.uid, getColumnWidth(column)]));
                const delta: number = rtl
                    ? resizeState.current.lastClientX - e.clientX
                    : e.clientX - resizeState.current.lastClientX;
                resizeState.current.lastClientX = e.clientX;

                resizeColumn(resizeState.current.activeColumn, delta);

                const activeColumnIndex: number = gridColumns.findIndex((column: ColumnProps) => column.uid ===
                    resizeState.current.activeColumn.uid);
                const boundaryDelta: number = gridColumns.slice(0, activeColumnIndex + 1).
                    reduce((difference: number, column: ColumnProps) => {
                        return difference + getColumnWidth(column) - (oldColumnWidths.get(column.uid));
                    }, 0);
                setResizeHelper((prev: ResizeHelper) => {
                    const currentActiveColumnWidth: number = parseUnit(resizeState.current?.activeColumn?.width);
                    const isLeftChanged: boolean = oldActiveColumnWidth !== currentActiveColumnWidth;
                    const left: string = parseUnit(prev.left) + (rtl ? -boundaryDelta : boundaryDelta) + 'px';
                    const resizeHelperMetrics: { top: number; height: number } = getResizeHelperMetrics();
                    return {
                        ...prev,
                        top: resizeHelperMetrics.top + 'px',
                        height: resizeHelperMetrics.height + 'px',
                        ...(isLeftChanged ? { left } : {})
                    };
                });
                setColumnWidthState({});

            }, [rtl, resizeColumn, setColumnWidthState]);

        /**
         * Handles a `document`-level `pointerup` event that ends the active resize interaction.
         */
        const onResizeHandlePointerUp: (e: PointerEvent) => void =
            useCallback((e: PointerEvent): void => {

                e.preventDefault();
                e.stopPropagation();

                const column: ColumnProps = resizeState.current.activeColumn;

                onColumnResizeEnd?.({
                    column,
                    width: parseUnit(column.width)
                });

                document.removeEventListener('pointermove', onResizeHandlePointerMove);
                document.removeEventListener('pointerup', onResizeHandlePointerUp);

                setResizeHelper({
                    resizing: false,
                    left: '0px',
                    top: '0px',
                    height: '0px'
                });

                resizeState.current.activeColumn = null;
                resizeState.current.lastClientX = 0;

            }, [onColumnResizeEnd, onResizeHandlePointerMove]);

        /**
         * Handles the pre-action pointerdown on a column resize handle.
         */
        const onResizeHandlePointerDown: (e: React.PointerEvent) => void =
            useCallback((e: React.PointerEvent): void => {

                const target: HTMLElement = e.target as HTMLElement;
                const cell: HTMLElement = target.parentElement;
                const cellRect: DOMRect = cell.getBoundingClientRect();
                const headerCell: HTMLElement = cell.querySelector('.sf-grid-header-cell');
                const column: ColumnProps = gridRef.current.getColumnByUid(headerCell.getAttribute('data-mappinguid'));
                const startEvent: ColumnResizeStartEvent = {
                    cancel: false,
                    column,
                    width: cellRect.width
                };

                onColumnResizeStart?.(startEvent);

                if (startEvent.cancel) {
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                const resizeHelperMetrics: { top: number; height: number } = getResizeHelperMetrics();
                const headerContainer: HTMLElement = gridRef.current.element.querySelector('.sf-grid-header-container');
                const headerRect: DOMRect = headerContainer.getBoundingClientRect();
                let left: number = cellRect.left - headerRect.left;
                if (!rtl) {
                    left += cellRect.width;
                }

                ellipsisTooltipRef.current?.closeTooltip?.();
                setResizeHelper({
                    resizing: true,
                    left: left + 'px',
                    top: resizeHelperMetrics.top + 'px',
                    height: resizeHelperMetrics.height + 'px'
                });

                resizeState.current.activeColumn = column;
                resizeState.current.lastClientX = e.clientX;

                document.addEventListener('pointermove', onResizeHandlePointerMove);
                document.addEventListener('pointerup', onResizeHandlePointerUp);

            }, [gridRef, resizeSettings?.enabled, uiColumns, onColumnResizeStart, onResizeHandlePointerMove, onResizeHandlePointerUp]);

        /**
         * Programmatically resizes the supplied columns to their target widths.
         */
        const resizeColumns: (columns: ResizeColumn[]) => void =
            useCallback((columns: ResizeColumn[]): void => {
                if (!resizeSettings?.enabled) {
                    return;
                }

                for (let i: number = 0; i < columns.length; i++) {
                    const column: ResizeColumn = columns[i as number];
                    const uiColumn: ColumnProps = uiColumns.find((col: ColumnProps) => col.field === column.field);

                    if (!uiColumn?.allowResize) {
                        continue;
                    }

                    const startEvent: ColumnResizeStartEvent = {
                        cancel: false,
                        column: uiColumn,
                        width: parseUnit(uiColumn.width)
                    };

                    onColumnResizeStart?.(startEvent);

                    if (startEvent.cancel) {
                        continue;
                    }

                    const delta: number = column.width - parseUnit(uiColumn.width);

                    resizeColumn(uiColumn, delta);

                    onColumnResizeEnd?.({
                        column: uiColumn,
                        width: parseUnit(uiColumn.width)
                    });
                }

                if (columnWidthInfo.current.resizeTableWidth) {
                    setColumnWidthState({});
                }

            }, [resizeSettings?.enabled, uiColumns, onColumnResizeStart, onColumnResize, onColumnResizeEnd,
                setColumnWidthState, columnWidthInfo, resizeColumn]);

        /**
         * Handles keyboard activation of a focused resize handle.
         */
        const onResizeHandleKeyDown: (e: React.KeyboardEvent) => void =
            useCallback((e: React.KeyboardEvent): void => {

                e.preventDefault();
                e.stopPropagation();

                const target: HTMLElement = e.target as HTMLElement;
                const headerCell: HTMLElement = target.querySelector('.sf-grid-header-cell');
                const column: ColumnProps = gridRef.current.getColumnByUid(headerCell.getAttribute('data-mappinguid'));
                if (!column) {
                    return;
                }
                const newWidth: number = parseUnit(column?.width) + (resizeSettings.resizeKeyboardStep * (e.keyCode === 37 ? -1 : 1));
                resizeColumns([{ field: column?.field, width: newWidth }]);

                requestAnimationFrame(() => {
                    gridRef.current.focusModule.focus();
                });

            }, [resizeColumns, gridRef, resizeSettings?.resizeKeyboardStep]);

        const resizeModule: ColumnResizeModule = useMemo(() => ({
            resizeSettings,
            onResizeHandlePointerDown,
            onResizeHandlePointerMove,
            onResizeHandlePointerUp,
            onResizeHandleKeyDown,
            resizeColumns,
            resizeHelper
        }), [resizeSettings, onResizeHandlePointerDown, onResizeHandlePointerMove, onResizeHandlePointerUp,
            onResizeHandleKeyDown, resizeColumns, resizeHelper]);

        return resizeModule;
    };

export { useColumnResize as ResizeModule };
