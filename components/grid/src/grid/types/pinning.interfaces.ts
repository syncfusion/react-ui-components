import { Dispatch, RefObject, SetStateAction } from 'react';
import { GridRef } from './grid.interfaces';
import { IRow } from './interfaces';
import { SaveEvent } from './edit.interfaces';
import { ColumnProps } from './column.interfaces';
import { ColumnPinDirection, PinScope } from './enum';

/**
 * Configures global pinning behavior in the grid for both rows and columns.
 * Controls whether pinning is enabled, which dimensions are eligible, and which sides are permitted.
 *
 * Follows the same composition pattern as `VirtualizationSettings`: a master `enabled`
 * switch plus a `type` selector that scopes pinning to rows, columns, or both.
 *
 * @default {
 *   enabled: false
 * }
 *
 * @example
 * ```tsx
 * // Both row and column pinning
 * const pinning: PinningSettings = {
 *   enabled: true,
 *   type: PinScope.Both,
 *   allowTopPin: true,
 *   allowBottomPin: true
 * };
 * <Grid pinningSettings={pinning} />
 * ```
 */
export interface PinningSettings {
    /**
     * Enables or disables pinning for the grid.
     * When `true`, the dimensions selected by `type` respond to pinning interactions
     * (context menu, programmatic `pinRows` / `pinColumn`) and the `isRowPinned` /
     * `ColumnProps.pinDirection` declarations take effect.
     * When `false`, all pinning callbacks and interactions are ignored.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Specifies the pinning scope when `enabled` is true.
     * Selects whether rows, columns, or both are eligible for pinning.
     *
     * @default PinScope.Row
     */
    type?: PinScope;

    /**
     * Allows rows to be pinned to the top section of the grid.
     * Evaluated only when `type` includes rows (`Rows` or `Both`).
     *
     * @default true
     */
    allowTopPin?: boolean;

    /**
     * Allows rows to be pinned to the bottom section of the grid.
     * Evaluated only when `type` includes rows (`Rows` or `Both`).
     *
     * @default true
     */
    allowBottomPin?: boolean;
}

/**
 * Represents the pinning transition for a row.
 * Provides the affected row and its previous and current pin buckets.
 */
export interface RowPinningEvent<T = unknown> {
    /**
     * Row data associated with the pinning transition.
     *
     * @default undefined
     */
    rowData?: T;

    /**
     * Pin bucket before the transition.
     *
     * @default undefined
     */
    previousPinBucket?: 'top' | 'bottom' | undefined;

    /**
     * Pin bucket after the transition.
     *
     * @default undefined
     */
    currentPinBucket?: 'top' | 'bottom' | undefined;

    /**
     * Describes whether the row was pinned or unpinned.
     */
    action: 'pin' | 'unpin';
}

/**
 * Defines options passed to the row pinning module factory.
 * Provides the grid reference required for row pinning state and operations.
 * `uiColumns` is forwarded so the module can mutate column pin direction and
 * trigger a column re-preparation without coupling to the grid component directly.
 */
export interface PinningModuleOptions<T = unknown> {
    /** Reference to the grid component. */
    gridRef: RefObject<GridRef<T>>;
    /** Live column reference that `pinColumn` / `unpinColumn` mutate in place. */
    uiColumns?: RefObject<ColumnProps<T>[]>;
    /** Sentinel setter that triggers `prepareColumns` to re-run. */
    setColumnChooserState?: Dispatch<SetStateAction<object>>;
    isInitialLoad: boolean;
}

/**
 * Defines the row pinning module API.
 * Manages pinned row state and pinning operations for the grid.
 * Also exposes column pinning helpers used when the user pins/unpins a column
 * via context menu (`pinColumn(field, direction)` and `unpinColumn(field)`).
 */
export interface PinningModuleResult<T = unknown> {
    updatePinnedRowsState: (rows: T[], isPinned: boolean, position?: 'top' | 'bottom') => void;
    updatePinnedRowObjectsData: (savedRowObject: IRow<ColumnProps<T>>, startArgs: SaveEvent<T>, isEditCell?: boolean) => void;
    initializePinnedRowsState: (isRowPinned?: (row: T) => 'top' | 'bottom' | null | undefined) => void;
    pinnedRowsState: Map<string, {
        isPinned: boolean;
        pinBucket?: 'top' | 'bottom';
        rowData?: T;
    }>;
    dynamicallyChangedPinnedRows: RefObject<boolean>;
    dynamicallyChangedPinnedRowsCount: RefObject<number>;
    /**
     * Pins a column by `field` (matching `ColumnProps.field`) to the given side.
     * Updates `uiColumns.current` in place and bumps `setColumnChooserState` so
     * `prepareColumns` reruns for the new pin direction. The sticky offset maps
     * and pinned-cell CSS classes take effect on the next paint.
     *
     * @param {string} field - Field name of the column to pin (e.g. `'OrderID'`).
     * @param {ColumnPinDirection} direction - Side to pin to (`Left` or `Right`).
     * @returns {void}
     */
    pinColumn: (field: string, direction: ColumnPinDirection.Left | ColumnPinDirection.Right | string) => void;
    /**
     * Unpins a column by `field`, collapsing its pin direction to `None`.
     * Bumps `setColumnChooserState` so `prepareColumns` reruns and the column
     * flows back into the main virtual order with sticky CSS offsets dropped.
     *
     * @param {string} field - Field name of the column to unpin.
     * @returns {void}
     */
    unpinColumn: (field: string) => void;

    pinningActionInfo: RefObject<PinningActionInfo>;
}

/**
 * Defines the row pinning module factory contract.
 * Creates a row pinning module from grid-specific initialization options.
 */
export type PinningModuleType<T = unknown> = (options: PinningModuleOptions<T>) => PinningModuleResult<T>;

/**
 * @private
 */
export interface PinningActionInfo {
    topDiffer: number;
    isUnpinned: boolean;
    isBottomPinned: boolean;
    prevTopPinnedCachedRowObjects?: IRow<ColumnProps>[];
    topPinnedRowCount?: number;
    isBottomUnpinned?: boolean;
}
