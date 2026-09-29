import { Dispatch, RefObject, SetStateAction } from 'react';
import { AutoFitMode } from './enum';
import { GridRef } from './grid.interfaces';
import { ColumnProps } from './column.interfaces';
import { ColumnResizeEndEvent, ColumnResizeStartEvent, ColumnWidthInfo } from './resize.interfaces';

/**
 * Defines an entry for programmatic column auto-fit operations invoked through the Grid ref API.
 * Maps a column field name to an optional `AutoFitMode` that overrides the grid-level default for that column.
 */
export interface AutoFitColumn {
    /**
     * Specifies the field name of the column targeted for auto-fit.
     * Identifies the column to measure against its rendered header and content cells.
     *
     * @default ''
     */
    field: string;

    /**
     * Defines the auto-fit scope applied to the targeted column.
     * Overrides the grid-level `autoFit` setting for this column only.
     *
     * @default null
     */
    autoFit?: AutoFitMode;
}

/**
 * Defines the contract for the column auto-fit feature module.
 * Encapsulates the auto-fit scope, the programmatic auto-fit invoker, and the double-click handler wired to the resize handle.
 *
 * @private
 */
export interface ColumnAutoFitModule<T = unknown> {
    /**
     * Defines the default auto-fit scope applied when a column or caller omits a per-column override.
     * Resolved from the grid-level `autoFit` prop and threaded through the mutable context.
     *
     * @default null
     */
    autoFit: AutoFitMode;

    /**
     * Triggers auto-fit for the supplied columns or, when omitted, for every visible column.
     * Iterates the provided entries, resolves the matching `uiColumn`, honors per-column `autoFit` or grid-level fallback, measures the widest header and content cell, and clamps the result to `minWidth`/`maxWidth`.
     * Invokes `onColumnResizeStart` (cancelable) and `onColumnResizeEnd` for each column that is measured and updated.
     *
     * @param {AutoFitColumn[]} [columns] - Optional list of columns to auto-fit. When omitted or empty, processes every visible column with a defined `field`.
     * @returns {void}
     */
    autoFitColumns: (columns?: AutoFitColumn[]) => void;

    /**
     * Measures the widest cell for the supplied column and returns the width in pixels.
     * Honors per-column `autoFit` or grid-level fallback, measures the widest header and content cell, and clamps the result to `minWidth`/`maxWidth`.
     *
     * @param {ColumnProps<T>} column - The column to measure for auto-fit.
     * @param {AutoFitMode} autoFit - The auto-fit scope to apply when measuring the column.
     * @returns {number} The measured width in pixels for the supplied column.
     */
    autoFitColumn: (column: ColumnProps<T>, autoFit: AutoFitMode) => number;

    /**
     * Fires when the user double-clicks a column resize handle.
     * Resolves the originating column from the resize handle DOM, then delegates to `autoFitColumns` with a single-column entry.
     *
     * @event onResizeHandleDoubleClick
     * @param {React.MouseEvent<HTMLElement>} e - The originating double-click event from the resize handle element.
     * @returns {void}
     */
    onResizeHandleDoubleClick: (e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Defines the column auto-fit feature module.
 * @private
 */
export type AutoFitModuleType<T = unknown> = (
    gridRef: RefObject<GridRef>,
    autoFit: AutoFitMode,
    columns: ColumnProps<T>[],
    onColumnResizeStart: (event: ColumnResizeStartEvent) => void,
    onColumnResizeEnd: (event: ColumnResizeEndEvent) => void,
    uiColumns: ColumnProps<T>[],
    columnWidthInfo: RefObject<ColumnWidthInfo>,
    setColumnWidthState: Dispatch<SetStateAction<Object>>
) => ColumnAutoFitModule;
