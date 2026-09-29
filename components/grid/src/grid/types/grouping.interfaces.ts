/**
 * Row Grouping Type Definitions for React Grid
 */
import { Dispatch, NamedExoticComponent, RefObject, SetStateAction } from 'react';
import { ValueType } from './interfaces';
import { GroupSummaryPosition, GroupType, SortDirection } from './enum';
import { AggregateData } from './aggregate.interfaces';
import { RowInfo } from './grid.interfaces';
import { ColumnProps } from './column.interfaces';

/**
 * Configuration settings for row grouping feature.
 * Enables multi-column hierarchical grouping with expand/collapse, drag-drop, and keyboard navigation.
 *
 * @example
 * ```tsx
 * const groupSettings: GroupSettings = {
 *   enabled: true,
 *   columns: ['ShipCountry', 'CustomerID'],
 *   defaultExpanded: true,
 *   captionFormat: 'verbose'
 * };
 * ```
 */
export interface GroupSettings {
    /**
     * Enables or disables grouping capability in the grid.
     * When false, all grouping UI and APIs are disabled.
     *
     * @default false
     */
    enabled?: boolean;

    /**
     * Array of field names to group by, in hierarchical order.
     * First field is top-level group, subsequent fields are nested groups.
     *
     * @example ['ShipCountry', 'CustomerID'] // Country groups containing Customer groups.
     * @default []
     */
    columns?: string[];

    /**
     * Defines the grouping mode, affecting UI and behavior.
     * * 'GroupRows'- Default mode with group caption rows and expand/collapse functionality.
     * * 'SingleColumn'- Groups are displayed in a single column(either default first visible column or separate `ColumnType.SingleGroup` type defined column) with indentation, no separate caption rows.
     * * 'MultipleColumns'- Each grouped field has its own column, showing group values inline with data.
     */
    type?: string | GroupType;

    /**
     * Automatically sort groups by their key values.
     * When true, groups are sorted in ascending order by default.
     *
     * @private
     * @default true
     */
    autoSort?: boolean;

    /**
     * Allows users to reorder grouped columns via drag-and-drop in the group drop area.
     * When true, users can change the grouping hierarchy by dragging group chips to reorder them.
     *
     * @private
     * @default false
     */
    allowReorder?: boolean;

    /**
     * Initial expansion state for all groups on mount.
     * * `true`- All groups expanded initially.
     * * `false`- All groups collapsed initially.
     * * `number`- Expand N levels deep (e.g., 2 = two levels).
     *
     * @remarks Only applies on initial render. User interactions override this setting.
     * @default false
     */
    defaultExpanded?: boolean | number;

    /**
     * Caption row display format for grouped data.
     * * `'verbose'`- Shows field name and value (e.g., "Country: USA - 45 items")
     * * `'compact'`- Shows only value and count (e.g., "USA (45)")
     *
     * @default 'compact'
     */
    captionFormat?: 'verbose' | 'compact';

    /**
     * Auto-refresh grouped data when grouped columns are edited.
     * When false, grouped data will not update until next manual refresh or data load.
     *
     * @private
     * @default true
     */
    autoRefreshOnEdit?: boolean;

    /**
     * Shows drop area UI above grid for drag-drop grouping configuration.
     *
     * @default false
     */
    showDropArea?: boolean;


    /**
     * Enables group summary functionality for the grid.
     * When set to true, the grid calculates and displays summary values for grouped data.
     *
     * @default false
     */
    groupSummaryPosition?: GroupSummary | GroupSummaryPosition;

    // /**
    //  * Keeps grouped columns visible in grid header after grouping.
    //  * When false, grouped columns are hidden from data area.
    //  *
    //  * @default false
    //  */
    // showGroupedColumn?: boolean;

    // /**
    //  * Shows ungroup button in grouped column headers in drop area.
    //  *
    //  * @default false
    //  */
    // showUngroupButton?: boolean;

    // /**
    //  * Custom template for rendering group caption rows.
    //  * Can display aggregates, custom values, or icons.
    //  *
    //  * @default '{key} - {count} items'
    //  */
    // captionTemplate?: string | React.ReactElement | Function;
}

/**
 * Event arguments for group operations (add, remove, reorder, expand, collapse).
 *
 * @example
 * ```tsx
 * const handleGroup = (args: OnGroupArgs) => {
 *   console.log(`Operation: ${args.operation}, Columns: ${args.columns.join(', ')}`);
 * };
 * ```
 */
export interface OnGroupArgs<T = unknown> {
    /**
     * Type of grouping operation performed.
     */
    action: 'add' | 'remove' | 'removeall' |'expand' | 'collapse' | 'expandall' | 'collapseall' | 'refresh';

    /**
     * Current array of grouped field names after operation.
     */
    columns?: string[];

    /**
     * Expand/collapse row data for expand/collapse operations, containing group key and items.
     */
    rowData?: T | GroupedData<T>;
}

/**
 * Event arguments for shouldExpandGroup event, allowing cancellation of group expand/collapse.
 */
export interface ShouldExpandGroupEvent {
    /**
     * Unique key of the group being expanded or collapsed.
     */
    groupKey: ValueType;
}

/**
 * Data structure for grouped data transformation.
 */
export interface GroupedData<T = unknown> {
    /**
     * Group key value (unique identifier).
     */
    key: ValueType;

    /**
     * Internal flattened key for nested groups, used for efficient lookups (e.g., "USA-NY").
     */
    flattedKey?: string;

    /**
     * Internal flattened level for nested groups, used for efficient lookups and rendering optimizations.
     */
    flattedLevel?: number;

    /**
     * Number of records in this group.
     */
    count: number;

    /**
     * Nested groups or data rows within this group.
     */
    items: (GroupedData<T> | T)[];

    /**
     * Field name used for this grouping level.
     */
    field: string;

    /**
     * Nesting level (0=top-level, 1=nested, etc.).
     */
    level?: number;

    /**
     * Aggregates for this group (`sum`, `avg`, `min`, `max`).
     */
    aggregates?: AggregateData<T>;

    /**
     * Unique GUID for this group.
     *
     * @private
     */
    GroupGuid?: string;

    /**
     * Number of nesting levels below this group.
     */
    childLevels?: number;

    /**
     * Raw records in this group (before nested grouping).
     */
    records?: T[];
}

/**
 * Group module API methods exposed on grid ref.
 * Methods are called directly on gridRef (NOT nested in groupModule object).
 *
 * @private
 * @example
 * ```tsx
 * // Add column to grouping
 * gridRef.current.groupColumn('ShipCountry');
 *
 * // Remove column from grouping
 * gridRef.current.ungroupColumn('ShipCountry');
 * ```
 */
export interface IGroupModule {
    /**
     * Add a column to grouping hierarchy.
     *
     * @param field - Field name to group by
     * @param {boolean} [isResetRequired] - If true, resets existing groupings before applying the new grouping. Default is false, which adds to existing groupings.
     * @OnGroup Triggers `onGroup` event with operation 'add'
     */
    groupColumn: (fields: string[], isResetRequired?: boolean) => void;

    /**
     * Remove a column from grouping hierarchy.
     *
     * @param field - Field name to ungroup
     * @OnGroup Triggers `onGroup` event with operation 'remove'
     */
    ungroupColumn: (fields: string[]) => void;

    /**
     * Clear all grouping, returning to flat row display.
     *
     * @OnGroup Triggers `onGroup` event with operation 'removeall'
     */
    clearGrouping: () => void;

    /**
     * Add a column to grouping hierarchy and resolve once the grid's UI has committed the change.
     * Resolves without rejecting when the group is vetoed by `onGroupStart` or is a no-op.
     *
     * @param {string[]} fields - Field names to group by.
     * @param {boolean} [isResetRequired] - If true, resets existing groupings before applying the new grouping.
     * @returns {Promise<void>} Resolves after grouping completes.
     */
    groupColumnAsync?: (fields: string[], isResetRequired?: boolean) => Promise<void>;

    /**
     * Remove a column from grouping hierarchy and resolve once the grid's UI has committed the change.
     *
     * @param {string[]} fields - Field names to ungroup.
     * @returns {Promise<void>} Resolves after ungrouping completes.
     */
    ungroupColumnAsync?: (fields: string[]) => Promise<void>;

    /**
     * Clear all grouping and resolve once the grid's UI has committed the flat row display.
     *
     * @returns {Promise<void>} Resolves after grouping is cleared.
     */
    clearGroupingAsync?: () => Promise<void>;

    /**
     * Expand all groups in the grid.
     *
     * @OnGroup Triggers `onGroup` event with operation 'expandall'
     */
    expandAll: () => void;

    /**
     * Collapse all groups in the grid.
     *
     * @OnGroup Triggers `onGroup` event with operation 'collapseall'
     */
    collapseAll: () => void;
}

/**
 * Callback type for determining row selectability and checkbox visibility per row.
 *
 * @template T - Row data type
 * @param groupKey - The unique key of the group being evaluated
 * @param groupLevel - The nesting level of the group (0=top-level, 1=nested, etc.)
 * @returns GroupSummaryPosition
 */
export type GroupSummary = (groupKey: string, groupLevel: number) => GroupSummaryPosition;

/**
 * Props for the GroupDropArea component.
 *
 * @private
 */
export interface GroupDropAreaProps {
    /**
     * Array of field names currently in the grouping hierarchy (ordered).
     *
     */
    groupColumns: ColumnProps[];

    /**
     * Optional CSS class name for custom styling of the group drop area container.
     */
    cssClass?: string;

    /**
     * Callback fired when user clicks the ungroup (close) button on a group chip.
     *
     * @param field - Field name to remove from grouping
     */
    onUngroupColumn?: IGroupModule['ungroupColumn'];

    /**
     * Current sort direction for each grouped column.
     *
     * Key = field name, value = sort direction.
     */
    sortDirections?: Record<string, SortDirection | string>;
}

/**
 * Return type for useGroup hook
 *
 * @template T - Data type of grid rows
 * @private
 */
export interface UseGroupResult<T = unknown> extends IGroupModule {
    /** Set of currently expanded group keys */
    expandedGroups: Set<string>;
    /** Set of currently collapsed group keys */
    collapsedGroups: Set<string>;
    /** All currently grouped column field names (ordered) */
    groupedColumns: string[];
    fieldBasedExpandedGroupKeysRef: RefObject<Map<string, Set<string>>>;
    fieldBasedCollapsedGroupKeysRef: RefObject<Map<string, Set<string>>>;
    /** Toggle a single group row expanded/collapsed. Updates expandedGroupCountRef based on rowObject.items.length */
    toggleGroup: (rowObject: RowInfo<T>) => void;
    /** Determine if a group key is expanded */
    isGroupExpanded: (key: string, field?: string) => boolean;
    /** Current groupSettings snapshot */
    groupSettings: GroupSettings;
    /** Internal: update grouped columns list */
    setGroupedColumns: (columns: string[]) => void;
    /** Internal: update expanded groups Set */
    setExpandedGroups: Dispatch<SetStateAction<Set<string>>>;
    /** Internal: update collapsed groups Set */
    setCollapsedGroups: Dispatch<SetStateAction<Set<string>>>;
    /** Ref for the group drop area element, used for height calculations in Render */
    groupDropAreaRef: RefObject<HTMLDivElement>;
    GroupDropArea: NamedExoticComponent<GroupDropAreaProps>
}

/**
 * Internal result type for child group information used in grouping layout calculations.
 *
 * @private
 * @template T - The data type of grid rows
 */
export type ChildInfoResult<T = unknown> = {
    count: number;
    currentViewData: (GroupedData<T> | T)[];
    expandedGroups: string[];
    collapsedGroups: string[];
    fieldBasedExpandedGroupKeys: Map<string, Set<string>>;
    fieldBasedCollapsedGroupKeys: Map<string, Set<string>>;
};
