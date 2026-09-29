import { Dispatch, RefObject, SetStateAction } from 'react';
import { ColumnProps } from './column.interfaces';
import { GridRef } from './grid.interfaces';
import { RowReorderModuleType } from './row-reordering.interfaces';

/**
 * Configures the column reorder feature at grid scope.
 * Controls whether interactive and programmatic column reordering is active for the grid.
 */
export interface ReorderSettings {
    /**
     * Enables or disables interactive column reordering for the grid.
     *
     * @default false
     */
    enabled?: boolean;
}

/**
 * Event arguments supplied to the Grid `onColumnDrag` callback.
 */
export interface ColumnReorderEvent<T = unknown> {
    /**
     * Identifies the column being moved by the active reorder interaction.
     */
    column: ColumnProps<T>;

    /**
     * Specifies the source `orderIndex` of the column at the start of the interaction.
     */
    fromIndex: number;

    /**
     * Specifies the current target `orderIndex` based on the resolved pointer target column.
     */
    toIndex: number;
}

/**
 * Event arguments supplied to the Grid `onColumnReorderStart` callback.
 */
export interface ColumnReorderStartEvent<_T = unknown> extends ColumnReorderEvent {
    /**
     * Marks the reorder interaction as canceled when set to true.
     *
     * @default false
     */
    cancel: boolean;
}

/**
 * Event arguments supplied to the Grid `onColumnReorderEnd` callback.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ColumnReorderEndEvent<_T = unknown> extends ColumnReorderStartEvent { }

/**
 * Defines the contract for the column reorder feature module.
 * Encapsulates the active reorder settings, the pointer handler wired to the header cell, the transient drag state, the helper chevron placement state, and the programmatic batch invokers.
 * Published through the grid mutable context and consumed by `useColumnReorder`.
 *
 * @private
 */
export interface ColumnReorderModule<_T> {
    /**
     * Exposes the active reorder settings used by the module.
     */
    reorderSettings: ReorderSettings;

    /**
     * Initializes a reorder interaction in response to a pointer event on a column header cell.
     * Exits early when the resolved column's `allowReorder` is false. Invokes the cancelable `onColumnReorderStart` event, attaches `pointermove` and `pointerup` listeners on `document`, and seeds the drag state.
     *
     * @param {React.PointerEvent} event - The originating pointer event from the header cell element.
     * @returns {Promise<void>}
     */
    onColumnPointerDown: (event: React.PointerEvent) => void;

    /**
     * Exposes the transient drag state held in a ref so `document.pointermove` / `document.pointerup` handlers always read the latest values without forcing a re-render.
     * Populated in `onColumnPointerDown`, mutated in `handlePointerMove`, cleared in `finishPointerReorder`.
     */
    reorderState: RefObject<ReorderState>;

    /**
     * Exposes the internal reorder helper state used to render the `sf-grid-reorder-helper` chevron pair.
     * Includes `reordering` (true while a pointer drag is active), `left` (CSS left offset for the chevrons), `top` (CSS top offset for the down chevron), and `bottom` (CSS top offset for the up chevron).
     */
    reorderHelper: ReorderHelper;

    /**
     * Programmatically reorders the column at `orderIndex === fromIndex` to `toIndex`.
     * Exits early when `reorderSettings.enabled` is false, when the target column's `allowReorder` is false, when `toIndex` is out of range, or when start / end events are canceled.
     *
     * @param {number} fromIndex - Source `orderIndex` of the column to move.
     * @param {number} toIndex - Target `orderIndex`.
     * @returns {Promise<void>}
     */
    reorderColumnByIndex: (fromIndex: number, toIndex: number) => Promise<void>;

    /**
     * Programmatically reorders the column(s) whose `field` matches `fieldName` to `toIndex`.
     * Accepts a single field name or an array of field names; iterates the field list in order, skipping entries whose `allowReorder` is false. Fires start / end events per affected column and bumps `setColumnReorderState({})` once at the end when at least one column was actually moved.
     *
     * @param {string | string[]} fieldName - Single field name or array of field names identifying the column(s) to move.
     * @param {number} toIndex - Target `orderIndex`.
     * @returns {Promise<void>}
     */
    reorderColumns: (fieldName: string | string[], toIndex: number) => Promise<void>;

    /**
     * Creates the row drag-and-drop handlers used by the content panel.
     */
    rowReorderModule?: RowReorderModuleType<_T>;
}

/**
 * Defines the options consumed by `useColumnReorder`.
 * Bundles the grid ref, active reorder settings, prepared and internal column collections, the lifecycle event callbacks, the `setColumnReorderState` setter, and the RTL flag.
 *
 * @private
 */
export interface ReorderModuleOptions<T> {
    /**
     * Ref to the grid's imperative API used to resolve the grid root element for helper chevron positioning.
     */
    gridRef: RefObject<GridRef<T>>;

    /**
     * Active grid-level reorder settings.
     */
    reorderSettings: ReorderSettings;

    /**
     * Array of prepared columns; used by `reorderColumns` to look up target columns by `field`.
     */
    columns: ColumnProps<T>[];

    /**
     * Internal uiColumns used to resolve column objects by `field` or `orderIndex` and to mutate `orderIndex` for the visual order.
     */
    uiColumns: RefObject<ColumnProps<T>[]>;

    /**
     * Grid `onColumnReorderStart` callback invoked (cancelable) at the start of each interactive or programmatic reorder.
     */
    onColumnReorderStart: (event: ColumnReorderStartEvent<T>) => void;

    /**
     * Grid `onColumnDrag` callback invoked per pointer move when the target column's `orderIndex` changes.
     */
    onColumnDrag: (event: ColumnReorderEvent<T>) => void;

    /**
     * Grid `onColumnReorderEnd` callback invoked (cancelable) at the end of each interactive or programmatic reorder.
     */
    onColumnReorderEnd: (event: ColumnReorderEndEvent<T>) => void;

    /**
     * Reorder state setter; bumped on drop or programmatic reorder to trigger `prepareColumns` to re-emit the new visual order.
     */
    setColumnReorderState: Dispatch<SetStateAction<Object>>;

    /**
     * When true, the helper `left` offset is flipped when the move direction inverts relative to LTR.
     */
    rtl: boolean;

    reorderState: RefObject<ReorderState>;
    isStackedHeader: boolean;
    stackedFlattedColumnProps: ColumnProps<T>[];
    allStackedColumnProps?: ColumnProps<T>[];
}

/**
 * Defines the column reorder feature module factory signature.
 * @private
 */
export type ReorderModuleType<T = unknown> = (options: ReorderModuleOptions<T>) => ColumnReorderModule<T>;

/**
 * Transient drag state held in a ref so document-level pointer handlers always read the latest values without forcing a re-render.
 * Populated in `onColumnPointerDown`, mutated in `handlePointerMove`, cleared in `finishPointerReorder`.
 *
 * @private
 */
export interface ReorderState {
    /**
     * Identifies the column being moved by the active reorder interaction.
     * `null` when no drag is active.
     */
    column: ColumnProps;
    targetColumn?: ColumnProps;

    /**
     * Specifies the source `orderIndex` of the column at the start of the interaction.
     * `-1` when no drag is active.
     */
    fromIndex: number;

    /**
     * Specifies the current target `orderIndex` based on the most recent resolved pointer target.
     * `-1` when no drag is active.
     */
    toIndex: number;

    /**
     * Holds the originating pointer event target so `document.pointermove` / `document.pointerup` handlers can resolve the current target without re-reading the event.
     * `null` when no drag is active.
     */
    target: HTMLElement;
}

/**
 * Defines the contract for the column reorder helper state used to render the `sf-grid-reorder-helper` chevron pair.
 * Includes `reordering` (true while a pointer drag is active), `left` (CSS left offset for the chevrons), `top` (CSS top offset for the down chevron), and `bottom` (CSS top offset for the up chevron).
 *
 * @private
 */
export interface ReorderHelper {
    /**
     * Marks that a pointer drag is active and the helper chevron pair should be rendered.
     *
     * @default false
     */
    reordering: boolean;

    /**
     * Specifies the CSS left offset for the helper chevron pair.
     * Derived from the target cell's `getBoundingClientRect().left` against the grid root, with an RTL flip applied when the move direction inverts.
     */
    left: string;

    /**
     * Specifies the CSS top offset for the down-pointing helper chevron.
     */
    top: string;

    /**
     * Specifies the CSS top offset for the up-pointing helper chevron.
     */
    bottom: string;
}
