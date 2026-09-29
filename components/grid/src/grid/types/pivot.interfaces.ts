import { ReactElement, ReactNode, Ref } from 'react';
import { AggregateType } from './enum';
import { GridProps, GridRef } from './grid.interfaces';
import type { PivotAxisPath, PivotMeasureMetadata, PivotTotalKind } from './pivot-contracts';
import type { PivotMemberOption } from '../services/pivot-members';
import type { ColumnProps } from './column.interfaces';

/** Presentation overrides for a generated pivot value column. */
export type PivotColumnOverrides = Partial<Pick<ColumnProps<PivotResultRow>,
'headerText' | 'headerTemplate' | 'template' | 'format' | 'width' | 'minWidth' | 'maxWidth' |
'textAlign' | 'headerTextAlign' | 'cellClass' | 'customAttributes' | 'visible' | 'allowResize'>>;

/** Presentation overrides for a generated pivot group header. */
export type PivotColumnGroupOverrides = Partial<Pick<ColumnProps<PivotResultRow>,
'headerText' | 'headerTemplate' | 'headerTextAlign' | 'customAttributes'>>;

/** Read-only metadata supplied to value-column customization. Templates receive pivot result rows. */
export interface PivotColumnContext<T = unknown> {
    /** Generated definition before customization. */
    readonly column: Readonly<ColumnProps<PivotResultRow>>;
    /** Source measure definition, when available. */
    readonly sourceColumn?: Readonly<ColumnProps<T>>;
    /** Typed column-axis members. */
    readonly path: ReadonlyArray<Readonly<PivotAxisPath[number]>>;
    /** Source measure and aggregate. */
    readonly measure: Readonly<PivotMeasureMetadata>;
    /** Detail, subtotal or grand total. */
    readonly totalKind: PivotTotalKind;
}

/** Read-only metadata supplied to group-header customization. */
export interface PivotColumnGroupContext<T = unknown> {
    /** Generated group definition before customization. */
    readonly column: Readonly<ColumnProps<PivotResultRow>>;
    /** Source dimension definition; absent for grand totals. */
    readonly sourceColumn?: Readonly<ColumnProps<T>>;
    /** Dimension field; absent for grand totals. */
    readonly field?: string;
    /** Typed member value; absent for grand totals. */
    readonly value?: PivotAxisPath[number]['value'];
    /** Typed member path. */
    readonly path: ReadonlyArray<Readonly<PivotAxisPath[number]>>;
    /** Zero-based group depth. */
    readonly level: number;
    /** Group category. */
    readonly totalKind: PivotTotalKind;
}

/** Defines the field catalogue and assignment controls for a pivot panel.
 *
 * @private
 */
export interface PivotPanelProps<T> {
    /** Engine-inferred source types, used when a column omits its type. @internal */
    fieldTypes?: Record<string, string>;
    /** Panel height, matching the grid height. Defaults to auto. */
    height?: string | number;
    /** Whether field-menu sorting actions are enabled. @internal */
    sortingEnabled?: boolean;
    /** Whether field-menu filtering actions are enabled. @internal */
    filteringEnabled?: boolean;
    columns: ColumnProps<T>[];
    columnChildren?: ReactNode;
    settings: PivotSettings<T>;
    locale?: string;
    enableRtl?: boolean;
    onChange(next: PivotSettings<T>): void;
    getMemberData?(field: string, settings: PivotSettings<T>): {
        allKeys: string[];
        options: PivotMemberOption[];
        error?: string;
    };
}

/**
 * Defines the aggregate operations supported for pivot value calculations.
 * Combines the grid aggregate enum with the literal names used by the pivot engine.
 * Used when configuring numeric summaries for pivot rows, columns, and totals.
 */
export type PivotAggregateType = AggregateType.Sum | AggregateType.Count | AggregateType.Min |
AggregateType.Max | AggregateType.Average | 'Sum' | 'Count' | 'Min' | 'Max' | 'Average' | (string & {});

/** A named numeric aggregation available in pivot value menus. */
export interface PivotCustomAggregate {
    /** Unique, case-sensitive name. Built-in names are reserved. */
    name: string;
    /** Display caption; defaults to name. */
    label?: string;
    /** Receives finite, non-null source values for this intersection, including totals. */
    aggregate(values: readonly number[]): number | undefined;
}

/**
 * Defines one pivot summary value bound to a source field.
 * Maps a field path to the aggregate used when calculating the result matrix.
 *
 * @example
 * ```tsx
 * const value: PivotValue<OrderRecord> = {
 *   field: 'TotalAmount',
 *   type: 'Sum'
 * };
 * ```
 */
export interface PivotValue<T = unknown> {
    /**
     * Source field used for the aggregation.
     * Supports dot-separated field paths when the underlying data model is nested.
     */
    field: Extract<keyof T, string> | (string & {});

    /**
     * Summary operation applied to the field value.
     *
     * Required. Use 'Sum', 'Count', 'Min', 'Max', 'Average', or a registered custom aggregate name.
     */
    type: PivotAggregateType;
}

/**
 * Defines sorting for a pivot member in the row or column axis.
 * Orders grouped members before rendering the result hierarchy.
 */
export interface PivotMemberSort<T = unknown> {
    /**
     * Field whose members are ordered.
     */
    field: Extract<keyof T, string> | (string & {});

    /**
     * Sort direction for the member collection.
     *
     * @default 'Ascending'
     */
    direction: 'Ascending' | 'Descending';
}

/**
 * Defines a source-member filter that restricts rows before aggregation.
 * Omit the filter to leave future members available for matching.
 */
export interface PivotMemberFilter<T = unknown> {
    /**
     * Field that supplies the member values to filter.
     */
    field: Extract<keyof T, string> | (string & {});

    /**
     * Opaque member identities returned by the pivot member UI.
     * Persist these values exactly as received; an empty array matches no source records.
     */
    memberKeys: string[];
}

/**
 * Configures local relational pivoting for the Grid.
 * Defines the report layout, aggregation values, and expansion behavior for pivot result generation.
 * Requires the `PivotModule` feature registration.
 *
 * @example
 * ```tsx
 * const pivotSettings: PivotSettings<OrderRecord> = {
 *   enabled: true,
 *   rows: ['Category'],
 *   columns: ['Quarter'],
 *   values: [{ field: 'Amount', type: 'Sum' }],
 *   showGrandTotals: true,
 *   showSubTotals: true
 * };
 * ```
 */
export interface PivotSettings<T = unknown> {
    /** Custom numeric summaries. Reports with these callbacks use the main thread, including paged reports. */
    customAggregates?: readonly PivotCustomAggregate[];
    /**
     * Enables or disables pivot result rendering.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Row dimensions included in the pivot report.
     * Each value represents a source field that builds the vertical hierarchy.
     */
    rows?: (Extract<keyof T, string> | (string & {}))[];

    /**
     * Column dimensions included in the pivot report.
     * Each value represents a source field that builds the horizontal hierarchy.
     */
    columns?: (Extract<keyof T, string> | (string & {}))[];

    /**
     * Summary definitions used to calculate values for each pivot intersection.
     */
    values?: PivotValue<T>[];

    /**
     * Member ordering applied independently to row and column dimensions.
     */
    memberSorts?: PivotMemberSort<T>[];

    /**
     * Source-member selections applied before aggregation.
     * Supports engine paging and worker-driven calculations when enabled.
     */
    memberFilters?: PivotMemberFilter<T>[];

    /**
     * Shows the pivot field panel and toggle UI.
     *
     * @default false
     */
    showPanel?: boolean;

    /**
     * Defers layout updates until the user applies the current pivot configuration.
     *
     * @default false
     */
    deferLayoutUpdate?: boolean;

    /**
     * Shows summary values for parent rows in the hierarchy.
     *
     * @default true
     */
    showSubTotals?: boolean;

    /**
     * Shows a bottom total row and trailing total columns for the result matrix.
     *
     * @default true
     */
    showGrandTotals?: boolean;

    /**
     * Expands each result hierarchy by default.
     *
     * @default false
     */
    defaultExpanded?: boolean;

    /**
     * Maximum generated value columns, including totals, before the report is capped.
     *
     * @default 200
     */
    maxGeneratedColumns?: number;

    /**
     * Calculates result pages using a retained engine session.
     *
     * @default false
     */
    useEnginePaging?: boolean;

    /**
     * Selects the execution mode used to calculate pivot results.
     *
     * @default 'sync'
     */
    execution?: 'sync' | 'worker';

    /**
     * Shows a hover tooltip on pivot value cells.
     * Displays default measure summary content when `tooltipTemplate` is omitted.
     *
     * @default false
     */
    showTooltip?: boolean;

    /**
     * Custom content renderer for pivot value-cell tooltips.
     * Receives the cell context for the hovered value intersection.
     *
     * @param {PivotCellContext<T>} context - Hovered pivot value cell context.
     * @returns {ReactNode} Tooltip content.
     */
    tooltipTemplate?: (context: PivotCellContext<T>) => ReactNode;
}

/**
 * Fires when the pivot configuration is updated after user interaction or report changes.
 * Triggered whenever the layout, grouping, or member selection is committed.
 *
 * @event onPivotChange
 * @param {{ settings: PivotSettings<T> }} args - Contains the latest pivot report configuration.
 * @returns {void}
 * @example
 * ```tsx
 * const handlePivotChange = (args: PivotChangeEvent<OrderRecord>) => {
 *   console.log(args.settings.rows);
 * };
 *
 * <Grid onPivotChange={handlePivotChange} />;
 * ```
 */
export interface PivotChangeEvent<T = unknown> {
    /**
     * Latest pivot configuration applied to the data source.
     */
    settings: PivotSettings<T>;
}

/**
 * Identifies a generated pivot result row in the rendered matrix.
 * This value is distinct from source-record keys and is only valid within the pivot result model.
 */
export type PivotResultRowId = string & { readonly __pivotResultRowId: unique symbol };

/**
 * Identifies a generated pivot result column in the rendered matrix.
 * This value is distinct from source-record keys and is only valid within the pivot result model.
 */
export type PivotResultColumnId = string & { readonly __pivotResultColumnId: unique symbol };

/**
 * Defines one rendered row in the pivot result set.
 * Represents a hierarchy node, total row, or leaf node created by the underlying pivot engine.
 *
 * @private
 */
export interface PivotResultRow {
    /**
     * Generated row identifier for the current result row.
     */
    id: PivotResultRowId;

    /**
     * Display label for the row header.
     */
    label: string;

    /**
     * Engine path that identifies the current hierarchy position.
     */
    path: PivotAxisPath;

    /**
     * Depth of the current row within the hierarchy.
     */
    level: number;

    /**
     * Parent row identifier when the current row is nested below a higher-level hierarchy node.
     */
    parentId?: PivotResultRowId;

    /**
     * Indicates whether the row contains nested child rows.
     */
    hasChildren: boolean;

    /**
     * Summary kind for the current row when it represents a total or subtotal.
     */
    totalKind: PivotTotalKind;

    /**
     * Compatibility flag retained for the current renderer.
     * Prefer `totalKind` for new integrations.
     */
    grandTotal: boolean;

    /**
     * Aggregated cell values keyed by generated measure identifiers.
     */
    cells: Readonly<Record<string, number | undefined>>;
}

/**
 * Defines metadata for one generated value column in the pivot result matrix.
 * Describes the axis path and measure associated with each rendered leaf column.
 *
 * @private
 */
export interface PivotResultColumn {
    /**
     * Generated column identifier for the current result column.
     */
    id: PivotResultColumnId;

    /**
     * Engine path that identifies the current column location in the hierarchy.
     */
    path: PivotAxisPath;

    /**
     * Measure metadata for the generated value column.
     */
    measure: PivotMeasureMetadata;

    /**
     * Total kind associated with this column when it represents a subtotal or grand total.
     */
    totalKind: PivotTotalKind;
}

/**
 * Defines the cell context used when rendering a pivot result intersection.
 * Keeps source-record data and generated result coordinates distinct for custom templates and formatting.
 */
export interface PivotCellContext<T> {
    /**
     * Source records used to compute the current pivot state.
     */
    source: readonly T[];

    /**
     * Rendered row in the current pivot result set.
     */
    row: PivotResultRow;

    /**
     * Rendered column in the current pivot result set.
     */
    column: PivotResultColumn;

    /**
     * Current numeric value for the pivot intersection.
     */
    value: number | undefined;
}

/**
 * Defines a serializable snapshot of the current pivot interaction state.
 *
 * @private
 */
export interface PivotState<T = unknown> {
    /**
     * State schema version.
     *
     * @default 1
     */
    version: 1;

    /**
     * Current pivot report configuration represented by the state snapshot.
     */
    report: PivotSettings<T>;

    /**
     * Expanded row identifiers stored in the current state.
     */
    expandedRowIds: PivotResultRowId[];

    /**
     * Expanded column identifiers stored in the current state.
     */
    expandedColumnIds: PivotResultColumnId[];
}

/**
 * Defines the imperative pivot API exposed separately from source-row Grid APIs.
 * Provides access to the result set, state snapshot, and state restoration hooks.
 *
 * @private
 */
export interface PivotModuleRef<T = unknown> {
    /**
     * Returns the current serializable pivot state.
     */
    getState(): PivotState<T>;

    /**
     * Restores the specified drill down and expansion state.
     */
    applyState(state: PivotState<T>): void;

    /**
     * Returns the visible pivot result rows.
     */
    getResultRows(): readonly PivotResultRow[];

    /**
     * Returns the visible pivot result columns.
     */
    getResultColumns(): readonly PivotResultColumn[];
}

/**
 * Defines the supported pivot calculation error codes.
 * Used to classify failures returned by the pivot engine or report validation.
 */
export type PivotErrorCode = 'InvalidField' | 'InvalidSettings' | 'UnsupportedDataSource' |
'UnsupportedScrollMode' | 'ColumnLimitExceeded' | 'CalculationFailed';

/**
 * Fires when a pivot report cannot be calculated or validated.
 * Triggered when the report contains an invalid field, unsupported data source, or engine failure.
 *
 * @event onPivotError
 * @param {{ code: PivotErrorCode; message: string }} args - Contains the error code and human-readable message.
 * @returns {void}
 */
export interface PivotErrorEvent {
    /**
     * Machine-readable classification for the pivot failure.
     */
    code: PivotErrorCode;

    /**
     * Human-readable description of the failed pivot calculation.
     */
    message: string;
}

/**
 * Defines the internal view contract used by the pivot module renderer.
 * Connects the pivot view to the parent grid references and partial grid API state.
 *
 * @private
 */
export interface PivotViewProps<T = unknown> {
    /**
     * Partial grid properties passed into the pivot-aware view.
     */
    gridProps: Partial<GridProps<T>>;

    /**
     * Grid ref connected to the hosting Grid instance.
     */
    gridRef: Ref<GridRef<T>>;
}

/**
 * Defines the optional pivot feature registration contract.
 * Exposes the pivot view component used by the Grid to render pivot mode.
 *
 * @private
 */
export interface PivotModuleType {
    /**
     * Renders the pivot-aware Grid view for the supplied Grid props.
     */
    View: <T>(props: PivotViewProps<T>) => ReactElement;
}
