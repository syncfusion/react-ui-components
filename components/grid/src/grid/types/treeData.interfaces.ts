import { Query } from '@syncfusion/react-data';
import { NormalizedTreeRow } from '../utils/treeDataUtils';

/**
 * Settings for configuring tree data behavior
 *
 * Supports two modes:
 * - Mode 1 (Nested): Set treeDataChildrenField to specify field with children array
 * - Mode 2 (Parent ID): Set both treeDataIdMapping and treeDataParentIdField
 *
 * Both modes are mutually exclusive; using both will throw an error.
 */
export interface ITreeDataSettings {
    /**
     * Enable or disable tree data mode
     *
     * @default false
     */
    enabled: boolean;

    /**
     * Column index where tree expand/collapse UI should render
     *
     * Specifies which column (by index position) displays the expand/collapse buttons
     * and indentation for tree nodes. Index is 0-based.
     *
     * @default 0
     * @example
     * ```typescript
     * // Render tree UI in column at index 1 (second column)
     * treeDataSettings={{
     *   enabled: true,
     *   treeColumnIndex: 1,
     *   treeDataChildrenField: 'children'
     * }}
     * ```
     *
     * @example
     * ```typescript
     * // With parent ID mode - tree UI in first column (index 0)
     * treeDataSettings={{
     *   enabled: true,
     *   treeColumnIndex: 0,
     *   treeDataIdMapping: 'id',
     *   treeDataParentIdField: 'parentId'
     * }}
     * ```
     */
    treeColumnIndex?: number;

    /**
     * Field name containing children array (Mode 1: Nested data)
     * Example: 'children', 'teams', 'employees'
     *
     * When set, data is expected as nested objects where children
     * are stored in the specified field as an array.
     *
     * @example
     * ```typescript
     * // Data structure
     * {
     *   name: 'Engineering',
     *   teams: [
     *     { name: 'Frontend', teams: [] },
     *     { name: 'Backend', teams: [] }
     *   ]
     * }
     *
     * // Configuration
     * { treeDataChildrenField: 'teams' }
     * ```
     */
    treeDataChildrenField?: string;

    /**
     * Field name for unique ID (Mode 2: Parent ID references)
     * Example: 'id', 'employeeId', 'nodeId'
     *
     * Used to identify nodes when using parent ID mapping mode.
     * Required when treeDataParentIdField is set.
     *
     * @example
     * ```typescript
     * { treeDataIdMapping: 'id' }
     * ```
     */
    treeDataIdMapping?: string;

    /**
     * Field name containing parent ID reference (Mode 2: Parent ID references)
     * Example: 'parentId', 'managerId', 'parentNodeId'
     *
     * Nodes with null or undefined parent ID are treated as root nodes.
     * Required when treeDataIdMapping is set.
     *
     * @example
     * ```typescript
     * // Data structure
     * [
     *   { id: 1, name: 'Alice', parentId: null },
     *   { id: 2, name: 'Bob', parentId: 1 },
     *   { id: 3, name: 'Charlie', parentId: 1 }
     * ]
     *
     * // Configuration
     * {
     *   treeDataIdMapping: 'id',
     *   treeDataParentIdField: 'parentId'
     * }
     * ```
     */
    treeDataParentIdField?: string;

    /**
     * Excludes child rows from a filtered tree result when the parent row matches the active filter.
     *
     * @default false
     */
    excludeChildrenWithFiltering?: boolean;
}

/**
 * Tree data state and operations
 * Manages normalized data and expansion state
 */
export interface ITreeDataState {
    /** Normalized hierarchical data (before expansion filtering) */
    data: NormalizedTreeRow[];
    /** Currently expanded node keys */
    expandedKeys: Set<string>;
}

/**
 * @hidden
 */
export type ReturnType = {
    result: Object[];
    count?: number;
    aggregates?: string;
    distinctCount?: number;
};

/**
 * Tree node expansion operations
 * Methods for controlling tree node visibility
 */
export interface ITreeDataOperations {
    /**
     * Toggle expansion state of a node
     * If expanded, collapse it; if collapsed, expand it.
     */
    toggleNodeExpansion(treeKey: string, treeRowData: TreeGridRow): void;


    generateTreeData(query: Query): ReturnType;
}

/**
 * Complete tree data result including render data
 */
export interface ITreeDataResult extends ITreeDataOperations {
    /** Render-ready data filtered by expansion state */
    renderData: NormalizedTreeRow[];
    /** All normalized data (unfiltered) */
    normalizedData: NormalizedTreeRow[];
    /** Current expansion state */
    expandedKeys: Set<string>;
    generateTreeData(query: Query): ReturnType;
}

/**
 * Grid row with optional tree metadata
 * Extends base row interface with tree-specific properties
 * @private
 */
export interface TreeGridRow {
    // Tree properties (optional, present only when tree data is enabled)
    treeLevel?: number;
    treeKey?: string;
    treeParentKey?: string | null;
    isTreeParent?: boolean;
    isTreeExpanded?: boolean;
    index?: number;
    // Original data fields preserved
    [key: string]: any;
}


/**
 * Tree cell renderer context
 * Information provided to custom tree cell renderers
 */
export interface ITreeCellContext {
    /** The row data */
    row: NormalizedTreeRow;
    /** Column index */
    columnIndex: number;
    /** Row index in render data */
    rowIndex: number;
    /** Handler to toggle expansion */
    onToggleExpand: (treeKey: string) => void;
    /** Indentation level (treeLevel * indent pixels) */
    indentLevel: number;
}
