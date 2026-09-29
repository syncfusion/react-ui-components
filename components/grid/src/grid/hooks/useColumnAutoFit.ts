import { useCallback, RefObject, Dispatch, SetStateAction } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { ColumnResizeStartEvent, ColumnResizeEndEvent, ColumnWidthInfo } from '../types/resize.interfaces';
import { AutoFitColumn, ColumnAutoFitModule } from '../types/auto-fit.interfaces';
import { GridRef } from '../types/grid.interfaces';
import { createElement } from '@syncfusion/react-base';
import { applyColumnWidthConstraints, parseUnit } from '../utils';
import { AutoFitMode } from '../types/enum';
import { IRow } from '../types';

/* eslint-disable valid-jsdoc */
/**
 * Custom hook that provides column auto-fit measurement logic for the grid.
 * Measures content width and applies constraints to determine optimal column sizes.
 * Used internally to implement auto-fit column resizing behavior.
 *
 * @private
 * @param {RefObject<GridRef>} gridRef - Ref to the grid's imperative API used to access tables, rows, and column lookup helpers.
 * @param {AutoFitMode} autoFit - Grid-level auto-fit scope resolved from the `autoFit` grid prop; used as the fallback per-column mode.
 * @param {ColumnProps<T>[]} columns - Array of columns configured on the grid (currently unused; retained for compatibility with `useGrid` wiring).
 * @param {(event: ColumnResizeStartEvent) => void} onColumnResizeStart - Grid `onColumnResizeStart` callback invoked (cancelable) before each column is auto-fit.
 * @param {(event: ColumnResizeEndEvent) => void} onColumnResizeEnd - Grid `onColumnResizeEnd` callback invoked after each column is auto-fit.
 * @param {ColumnProps<T>[]} uiColumns - Array of internal uiColumns used to resolve the visible column matching each requested `field`.
 * @param {RefObject<ColumnWidthInfo>} columnWidthInfo - Ref to the shared width-state flags consumed by `useRender` to re-derive `<col>` widths and total table width.
 * @param {Dispatch<SetStateAction<Object>>} setColumnWidthState - Column-width state setter incremented to commit the updated widths and trigger a re-render.
 * @returns {ColumnAutoFitModule} The module exposing the active auto-fit scope, the programmatic `autoFitColumns` invoker, and the resize-handle double-click handler.
 */
/* eslint-enable valid-jsdoc */
const useColumnAutoFit: <T>(
    gridRef: RefObject<GridRef>,
    autoFit: AutoFitMode,
    columns: ColumnProps<T>[],
    onColumnResizeStart: (event: ColumnResizeStartEvent) => void,
    onColumnResizeEnd: (event: ColumnResizeEndEvent) => void,
    uiColumns: ColumnProps<T>[],
    columnWidthInfo: RefObject<ColumnWidthInfo>,
    setColumnWidthState: Dispatch<SetStateAction<Object>>
) => ColumnAutoFitModule =
    <T>(
        gridRef: RefObject<GridRef>,
        autoFit: AutoFitMode,
        columns: ColumnProps<T>[],
        onColumnResizeStart: (event: ColumnResizeStartEvent) => void,
        onColumnResizeEnd: (event: ColumnResizeEndEvent) => void,
        uiColumns: ColumnProps<T>[],
        columnWidthInfo: RefObject<ColumnWidthInfo>,
        setColumnWidthState: Dispatch<SetStateAction<Object>>
    ): ColumnAutoFitModule => {

        /**
         * Measures a single column's widest header and/or content cells via a hidden off-DOM clone.
         */
        const autoFitColumn: (column: ColumnProps<T>, autoFit: AutoFitMode) => number =
            useCallback((column: ColumnProps<T>, autoFit: AutoFitMode): number => {

                const gridDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
                gridDiv.className = gridRef.current?.element.className;
                gridDiv.style.cssText = 'display: inline-block;visibility:hidden;position:absolute';

                let headerTable: HTMLTableElement;
                let contentTable: HTMLTableElement;
                const mainHeaderTable: HTMLTableElement = gridRef.current.getHeaderTable();
                const mainHeaderCell: HTMLElement = mainHeaderTable
                    .querySelector('[data-mappinguid="' + column.uid + '"]')
                    .closest('.sf-cell');

                if (autoFit === AutoFitMode.Header || autoFit === AutoFitMode.All) {

                    const headerDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
                    headerDiv.className = 'sf-grid-header-container';

                    headerTable = createElement('table') as HTMLTableElement;
                    headerTable.className = mainHeaderTable.className;
                    headerTable.style.cssText = 'table-layout: auto;width: auto';

                    const headerRow: HTMLTableRowElement = createElement('tr', {
                        attrs: { role: 'row' },
                        className: 'sf-grid-header-row'
                    }) as HTMLTableRowElement;

                    const emptyCell: HTMLElement = createElement('th', {
                        className: 'sf-cell',
                        styles: 'padding: 0'
                    }) as HTMLElement;

                    const headerCell: HTMLElement = mainHeaderCell.cloneNode(true) as HTMLElement;

                    headerRow.appendChild(emptyCell);
                    headerRow.appendChild(headerCell);
                    headerTable.appendChild(headerRow);
                    headerDiv.appendChild(headerTable);
                    gridDiv.appendChild(headerDiv);
                }

                if (autoFit === AutoFitMode.Content || autoFit === AutoFitMode.All) {

                    const contentDiv: HTMLDivElement = createElement('div') as HTMLDivElement;
                    contentDiv.className = 'sf-grid-content-container';

                    contentTable = createElement('table') as HTMLTableElement;
                    contentTable.className = gridRef.current.getContentTable().className;
                    contentTable.style.cssText = 'table-layout: auto;width: auto';

                    const contentRow: HTMLTableRowElement = createElement('tr', {
                        attrs: { role: 'row' },
                        className: 'sf-grid-content-row'
                    }) as HTMLTableRowElement;

                    const emptyCell: HTMLElement = createElement('td', {
                        className: 'sf-cell',
                        styles: 'padding: 0'
                    }) as HTMLElement;

                    contentRow.appendChild(emptyCell);

                    const rowData: IRow<ColumnProps<T>>[] = gridRef.current.getRowsObject() as IRow<ColumnProps<T>>[];
                    for (let i: number = 0; i < rowData.length; i++) {
                        const row: HTMLTableRowElement = contentRow.cloneNode(true) as HTMLTableRowElement;
                        const sourceCell: Element = rowData[i as number].element
                            ?.querySelector('[data-mappinguid="' + column.uid + '"]');
                        if (!sourceCell) { continue; }
                        const cell: Element = sourceCell.cloneNode(true) as Element;
                        row.appendChild(cell);
                        contentTable.appendChild(row);
                    }

                    contentDiv.appendChild(contentTable);
                    gridDiv.appendChild(contentDiv);
                }

                document.body.appendChild(gridDiv);

                let width: number;
                if (autoFit === AutoFitMode.Header) {
                    width = headerTable.rows[0].getBoundingClientRect().width;
                } else if (autoFit === AutoFitMode.Content) {
                    width = contentTable.rows[0]?.getBoundingClientRect().width ?? 0;
                } else if (autoFit === AutoFitMode.All) {
                    width = Math.max(headerTable.rows[0].getBoundingClientRect().width,
                                     contentTable.rows[0]?.getBoundingClientRect().width ?? 0);
                }

                columnWidthInfo.current.resizeTableWidth = true;

                document.body.removeChild(gridDiv);

                return width;
            }, [gridRef, columnWidthInfo]);

        /**
         * Triggers auto-fit for the supplied columns or, when omitted, for every visible column.
         */
        const autoFitColumns: (columns?: AutoFitColumn[]) => void =
            useCallback((columns?: AutoFitColumn[]): void => {

                let processColumns: AutoFitColumn[] = columns;
                const headerTable: HTMLElement = gridRef.current.getHeaderTable();
                const leaves: (items: ColumnProps<T>[]) => ColumnProps<T>[] =
                    (items: ColumnProps<T>[]): ColumnProps<T>[] => items.flatMap((item: ColumnProps<T>) =>
                        item.columns?.length ? leaves(item.columns) : [item]);
                const leafColumns: ColumnProps<T>[] = leaves(uiColumns);
                if (!processColumns?.length) {
                    processColumns = [];
                    for (let i: number = 0; i < leafColumns.length; i++) {
                        const col: ColumnProps<T> = leafColumns[i as number];
                        if (col.field) {
                            processColumns.push({ field: col.field });
                        }
                    }
                }

                for (let i: number = 0; i < processColumns.length; i++) {
                    const column: AutoFitColumn = processColumns[i as number];
                    const uiColumn: ColumnProps<T> = leafColumns.find((col: ColumnProps<T>) => col.field === column.field);
                    if (!uiColumn) { throw new Error(`Column '${column.field}' is not available for auto-fit.`); }
                    if (uiColumn.visible === false) { continue; }
                    const autoFit: AutoFitMode = column.autoFit ?? uiColumn.autoFit ?? gridRef.current.autoFit;
                    if (autoFit) {
                        const div: Element = headerTable.querySelector('[data-mappinguid="' + uiColumn.uid + '"]');
                        if (div) {
                            const cell: HTMLTableCellElement = div.closest('.sf-cell');
                            const startEvent: ColumnResizeStartEvent = {
                                cancel: false,
                                column: uiColumn,
                                width: cell.getBoundingClientRect().width
                            };

                            onColumnResizeStart?.(startEvent);

                            if (startEvent.cancel) {
                                continue;
                            }

                            const width: number = autoFitColumn(uiColumn, autoFit);
                            uiColumn.width = applyColumnWidthConstraints(uiColumn, width) + 'px';

                            onColumnResizeEnd?.({
                                column: uiColumn,
                                width: parseUnit(uiColumn.width)
                            });
                        }
                    }
                }

                if (columnWidthInfo.current.resizeTableWidth) {
                    setColumnWidthState({});
                }

            }, [uiColumns, onColumnResizeStart, onColumnResizeEnd, setColumnWidthState, gridRef, columnWidthInfo, autoFitColumn]);

        /**
         * Handles the pre-action double-click on a column resize handle.
         */
        const onResizeHandleDoubleClick: (e: React.MouseEvent<HTMLElement>) => void =
            useCallback((e: React.MouseEvent<HTMLElement>): void => {

                e.preventDefault();
                e.stopPropagation();

                const target: HTMLElement = e.target as HTMLElement;
                const cell: HTMLElement = target.parentElement;
                const headerCell: HTMLElement = cell.querySelector('.sf-grid-header-cell');
                const column: ColumnProps<T> = gridRef.current.getColumnByUid(headerCell.getAttribute('data-mappinguid')) as ColumnProps<T>;

                autoFitColumns([{ field: column.field }]);

            }, [uiColumns, columns, onColumnResizeStart, onColumnResizeEnd, setColumnWidthState, gridRef, autoFitColumns]);

        const autoFitModule: ColumnAutoFitModule<T> = {
            autoFit,
            autoFitColumns,
            autoFitColumn,
            onResizeHandleDoubleClick
        };

        return autoFitModule;
    };

export { useColumnAutoFit as AutoFitModule };
