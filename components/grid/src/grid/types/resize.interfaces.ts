import { Dispatch, RefObject, SetStateAction } from 'react';
import { ColumnProps } from '../types/column.interfaces';
import { ResizeMode } from './enum';
import { GridRef } from './grid.interfaces';
import { ITooltip } from '@syncfusion/react-popups';

/**
 * Configures the column resize feature at grid scope.
 * Controls whether resizing is active, how width changes distribute, how often the layout re-derives on container resize, and the keyboard step size for keyboard-driven resize.
 */
export interface ResizeSettings {
    /**
     * Enables or disables interactive column resizing for the grid.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Defines how a width change propagates to the rest of the columns.
     * `ResizeMode.Normal` adjusts only the active column; `ResizeMode.Auto` redistributes inverse delta across following columns that opt in to auto-sizing.
     *
     * @default ResizeMode.Auto
     */
    mode?: ResizeMode;

    /**
     * Specifies the throttle interval in milliseconds for re-deriving column widths after a container resize.
     *
     * @default 150
     */
    throttle?: number;

    /**
     * Defines the width adjustment step in pixels applied per arrow-key press when the resize handle has focus.
     * Left/Right arrows shrink/grow the active column by this amount, clamped to `minWidth`/`maxWidth`.
     *
     * @default 10
     */
    resizeKeyboardStep?: number;
}

/**
 * Event arguments supplied to the Grid `onColumnResizeStart` callback.
 * Fired at the start of a resize interaction (pointer drag, keyboard activation, or programmatic invocation); canceling the interaction prevents the width change for that session.
 */
export interface ColumnResizeStartEvent {
    /**
     * Marks the resize interaction as canceled when set to true.
     *
     * @default false
     */
    cancel: boolean;

    /**
     * Identifies the column targeted by the resize interaction.
     * Provides access to field, header text, and other column configuration.
     */
    column: ColumnProps;

    /**
     * Specifies the column width in pixels at the moment the interaction begins.
     */
    width: number;
}

/**
 * Event arguments supplied to the Grid `onColumnResize` callback.
 * Fired continuously while a column width changes during an active resize interaction.
 */
export interface ColumnResizeEvent {
    /**
     * Identifies the column whose width is changing.
     */
    column: ColumnProps;

    /**
     * Specifies the column width in pixels after the most recent resize step.
     */
    width: number;
}

/**
 * Event arguments supplied to the Grid `onColumnResizeEnd` callback.
 * Fired when the resize interaction completes (pointer release, end of keyboard step, or completion of a programmatic resize/auto-fit on the targeted column).
 */
export interface ColumnResizeEndEvent {
    /**
     * Identifies the column whose width was finalized.
     */
    column: ColumnProps;

    /**
     * Specifies the final column width in pixels.
     */
    width: number;
}

/**
 * Defines an entry for programmatic column resize operations invoked through the Grid ref API.
 */
export interface ResizeColumn {
    /**
     * Identifies the column targeted for resize by its `field` name.
     *
     * @default ''
     */
    field: string;

    /**
     * Specifies the new column width in pixels.
     * Clamped to the column's `minWidth`/`maxWidth` constraints before being applied.
     */
    width: number;
}

/**
 * Defines the contract for the column resize feature module.
 * Encapsulates the active resize settings, pointer and keyboard handlers wired to the resize handle, and the programmatic batch invocation.
 * Published through the grid mutable context and consumed by `useColumnResize`.
 *
 * @private
 */
export interface ColumnResizeModule {
    /**
     * Exposes the active resize settings used by the module, including enable, mode, throttle, and keyboard step.
     */
    resizeSettings: ResizeSettings;

    /**
     * Initializes a resize interaction in response to a pointer event on the resize handle.
     * Invokes the cancelable `onColumnResizeStart` event, attaches `pointermove` and `pointerup` listeners on `document`, and seeds the drag delta state.
     *
     * @param {React.PointerEvent} e - The originating pointer event from the resize handle element.
     * @returns {void}
     */
    onResizeHandlePointerDown: (e: React.PointerEvent) => void;

    /**
     * Handles a `document`-level `pointermove` event during an active resize.
     * Computes the pointer delta (inverted in RTL) and applies it to the active column's width.
     *
     * @param {PointerEvent} e - The pointer move event captured at the document level.
     * @returns {void}
     */
    onResizeHandlePointerMove: (e: PointerEvent) => void;

    /**
     * Handles a `document`-level `pointerup` event that ends the active resize interaction.
     * Invokes `onColumnResizeEnd`, detaches the move/up listeners, and clears the drag state.
     *
     * @param {PointerEvent} e - The pointer up event captured at the document level.
     * @returns {void}
     */
    onResizeHandlePointerUp: (e: PointerEvent) => void;

    /**
     * Handles keyboard activation of a focused resize handle.
     * Adjusts the column width by `resizeSettings.resizeKeyboardStep` per arrow-key press (Left/Right), then re-applies focus to the grid's focus module.
     *
     * @param {React.KeyboardEvent} e - The keyboard event originating from the resize handle.
     * @returns {void}
     */
    onResizeHandleKeyDown: (e: React.KeyboardEvent) => void;

    /**
     * Programmatically resizes the supplied columns to their target widths.
     * Skips entries that target columns with `allowResize === false` or are canceled by `onColumnResizeStart`. No-op when `resizeSettings.enabled` is false.
     *
     * @param {ResizeColumn[]} columns - List of columns to resize with their target widths in pixels.
     * @returns {void}
     */
    resizeColumns: (columns: ResizeColumn[]) => void;

    /**
     * Exposes the internal resize helper state used to render the drag indicator.
     * Includes `resizing` (true while a pointer drag is active), `left` (CSS left offset for the indicator), `top` (CSS top offset for the indicator), and `height` (CSS height for the indicator).
     */
    resizeHelper: ResizeHelper;
}

/**
 * Defines the column resize feature module.
 * @private
 */
export type ResizeModuleType<T = unknown> = (
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
) => ColumnResizeModule;

/**
 * Defines the contract for the column resize helper state used to render the drag indicator.
 * Includes `resizing` (true while a pointer drag is active), `left` (CSS left offset for the indicator), `top` (CSS top offset for the indicator), and `height` (CSS height for the indicator).
 * @private
 */
export interface ResizeHelper {
    /**
     * Marks that a pointer drag is active and the resize indicator should be rendered.
     *
     * @default false
     */
    resizing: boolean;

    /**
     * Specifies the CSS left offset for the resize indicator.
     */
    left: string;

    /**
     * Specifies the CSS top offset for the resize indicator.
     */
    top: string;

    /**
     * Specifies the CSS height for the resize indicator.
     */
    height: string;
}

/**
 * Internal state flags shared between the resize feature and the column preparation pipeline.
 * Used by `useRender` / `useColumns` to decide when to recompute the shared `<col>` width array and whether the content table should grow to fit the constrained widths.
 *
 * @private
 */
export interface ColumnWidthInfo {
    /**
     * Marks that the column widths have changed since the last prepare pass.
     * Set by `useColumns` when the width state counter changes; consumed by `prepareColumns` to re-derive `<col>` widths.
     *
     * @default false
     */
    isColumnWidthChanged?: boolean;

    /**
     * Marks the initial render pass before the first user interaction or programmatic resize.
     * Once cleared, `useRender` no longer rewrites `column.width` from rendered DOM measurements.
     *
     * @default true
     */
    renderInitialWidth?: boolean;

    /**
     * Tracks whether `useColumns` is currently processing a width reconciliation pass.
     * Prevents re-entrance when `setColumnWidthState` is invoked from within the width effect.
     *
     * @default false
     */
    widthProcess?: boolean;

    /**
     * Marks that at least one column has reached its `maxWidth` during the current pass.
     * When true, header / content / footer tables grow their `style.width` to `totalWidth` to keep alignment.
     *
     * @default false
     */
    maxTableWidth?: boolean;

    /**
     * Marks that the active resize interaction has updated one or more column widths and the table needs to be re-evaluated.
     * Reset by the resize hook after a successful re-render.
     *
     * @default false
     */
    resizeTableWidth?: boolean;

    /**
     * Marks that one or more columns use a dynamic width value such as `auto`, an empty string, or a percentage.
     * Used by the column preparation and resize logic when deriving the rendered table width.
     *
     * @default false
     */
    hasDynamicWidth?: boolean;

    /**
     * Marks that one or more columns have been auto-fitted to their content and the table needs to be re-evaluated.
     * Reset by the resize hook after a successful re-render.
     * @default false
     */
    hasAutoFitWidth?: boolean;
}
