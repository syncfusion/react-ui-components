import { Dispatch, HTMLAttributes, JSX, ReactElement, ReactNode, RefObject, SetStateAction, MouseEvent, FocusEvent, CSSProperties, UIEvent } from 'react';
import { ReturnType, DataManager, Predicate, Query, DataResult, Aggregates } from '@syncfusion/react-data';
import { DateFormatOptions, NumberFormatOptions } from '@syncfusion/react-base';
import { AggregateType, CellTypes, RenderType, ScrollMode } from '../types/enum';
import { FilterSettings, FilterEvent, filterModule } from '../types/filter.interfaces';
import { ColumnProps, IColumnBase } from '../types/column.interfaces';
import { FocusStrategyModule } from '../types/focus.interfaces';
import { InlineEditFormRef, payload, editModule, CellEditFormRef } from '../types/edit.interfaces';
import { selectionModule } from '../types/selection.interfaces';
import { CellSelectionModel } from '../types/cell-selection.interfaces';
import { PagerRef } from '@syncfusion/react-pager';
import { AggregateColumnProps, AggregateData, AggregateRowProps } from '../types/aggregate.interfaces';
import { GridActionEvent, IGrid, IGridBase } from '../types/grid.interfaces';
import { PageEvent } from '../types/page.interfaces';
import { searchModule, SearchSettings, SearchEvent } from './search.interfaces';
import { SortSettings, SortModule, SortEvent, SortDescriptor } from '../types/sort.interfaces';
import { ToolbarAPI } from './toolbar.interfaces';
import * as React from 'react';
import { UseCommandColumnResult } from './command.interfaces';
import { VirtualSettings } from './virtualization.interface';
import { ContextMenuPanelRef } from './context.interfaces';
import { InfiniteScrollState } from './infinite-scroll.interface';
import { GroupedData } from './grouping.interfaces';
import { UseGroupResult } from '../hooks/useGroup';

/**
 * IValueFormatter interface defines the methods for value formatting services
 *
 * @private
 */
export interface IValueFormatter {
    /**
     * Converts a string value from the view to a typed value
     *
     * @param {string} value - The string value to convert
     * @param {Function} format - The format function to use
     * @param {string} [target] - Optional target type
     * @returns {string | number | Date} The converted value
     */
    fromView(value: string, format: Function, target?: string): string | number | Date;

    /**
     * Converts a typed value to a string for display in the view
     *
     * @param {number | Date} value - The value to format
     * @param {Function} format - The format function to use
     * @returns {string | Object} The formatted value
     */
    toView(value: number | Date, format: Function): string | Object;

    /**
     * Gets a format function for the specified format options
     *
     * @param {NumberFormatOptions | DateFormatOptions} format - The format options
     * @returns {Function} The format function
     */
    getFormatFunction?(format: NumberFormatOptions | DateFormatOptions): Function;

    /**
     * Gets a parser function for the specified format options
     *
     * @param {NumberFormatOptions | DateFormatOptions} format - The format options
     * @returns {Function} The parser function
     */
    getParserFunction?(format: NumberFormatOptions | DateFormatOptions): Function;
}
/**
 * Interface defining cell properties and metadata for grid rendering.
 *
 * @private
 */
export interface ICell<T> {
    /**
     * Specifies the number of columns the cell should span.
     *
     * @default 1
     */
    colSpan?: number;

    /**
     * Specifies the number of rows the cell should span.
     *
     * @default 1
     */
    rowSpan?: number;

    /**
     * Defines the type of cell content.
     *
     * @default -
     */
    cellType?: CellTypes;

    /**
     * Specifies whether the cell is visible.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Indicates whether the cell contains template content.
     *
     * @default false
     */
    isTemplate?: boolean;

    /**
     * Indicates whether this is a data cell.
     *
     * @default false
     */
    isDataCell?: boolean;

    /**
     * Indicates whether the cell is spanned by another cell.
     *
     * @default false
     */
    isSpanned?: boolean;

    /**
     * The column associated with this cell.
     *
     * @default null
     */
    column?: T;

    /**
     * The aggregate column definition if this is an aggregate cell.
     *
     * @default null
     */
    aggregateColumn?: AggregateColumnProps<T extends IColumnBase<infer C> ? C : unknown>;

    /**
     * The unique identifier for the row containing this cell.
     *
     * @default -
     */
    rowID?: string;

    /**
     * The index of the cell within the row.
     *
     * @default 0
     */
    index?: number;

    /**
     * The column index of the cell.
     *
     * @default 0
     */
    colIndex?: number;

    /**
     * Additional CSS class names for the cell.
     *
     * @default -
     */
    className?: string;

    /**
     * Indicates whether the cell is selected.
     * Used for cell selection mode to track which cells are currently selected.
     *
     * @default false
     */
    isSelected?: boolean;
}
/**
 * Interface defining row properties and metadata for grid rendering.
 *
 * @private
 */
export interface IRow<T> {
    spanCells?: ICell<ColumnProps<T>>[];
    /**
     * Function to set the row object state.
     *
     * @default null
     */
    setRowObject?: Dispatch<SetStateAction<IRow<ColumnProps<T extends IColumnBase<infer C> ? C : unknown>>>>;

    /**
     * Unique identifier for the row.
     *
     * @default -
     */
    uid?: string;

    /**
     * Data object associated with the row.
     *
     * @default null
     */
    data?: (T extends IColumnBase<infer C> ? C : unknown) | GroupedData<T extends IColumnBase<infer C> ? C : unknown>;

    /**
     * Group summary count for the row.
     *
     * @default 0
     */
    gSummary?: number;

    /**
     * Template index for the row.
     *
     * @default 0
     */
    tIndex?: number;

    /**
     * Indicates whether this is a caption row.
     *
     * @default false
     */
    isCaptionRow?: boolean;

    /**
     * Indicates whether this is an alternate row.
     *
     * @default false
     */
    isAltRow?: boolean;

    /**
     * Indicates whether this is a data row.
     *
     * @default false
     */
    isDataRow?: boolean;

    /**
     * Indicates whether this is a data row.
     *
     * @default false
     */
    isDetailRow?: boolean;

    /**
     * Indicates whether this is an aggregate row.
     *
     * @default false
     */
    isAggregateRow?: boolean;

    /**
     * Indicates whether the row is selected.
     *
     * @default false
     */
    isSelected?: boolean;

    /**
     * Indicates whether the selection is in an intermediate state.
     *
     * @default false
     */
    isIntermediateState?: boolean;

    /**
     * Indicates whether the selection is in an disabled state.
     *
     * @default false
     */
    isDisabled?: boolean;

    /**
     * Indicates whether the row is expanded.
     *
     * @default false
     */
    isExpand?: boolean;

    /**
     * Specifies whether the row is visible.
     *
     * @default true
     */
    visible?: boolean;

    /**
     * Specifies the number of rows this row should span.
     *
     * @default 1
     */
    rowSpan?: number;

    /**
     * Array of cells contained in this row.
     *
     * @default []
     */
    cells?: ICell<T>[];

    /**
     * Index of the row.
     *
     * @default 0
     */
    rowIndex?: number;

    /**
     * Indentation level for hierarchical rows.
     *
     * @default 0
     */
    indent?: number;

    /**
     * Height of the row.
     *
     * @default -
     */
    height?: number;

    /**
     * Parent row unique identifier for hierarchical rows.
     *
     * @default -
     */
    parentUid?: string;

    // /**
    //  * Unique identifier for the row's parent group if this row is part of a grouped dataset.
    //  * Used for efficient lookups and operations on grouped rows.
    //  *
    //  * @default -
    //  */
    // parentGroupedRowIndex?: number;

    /**
     * Reference to the row's DOM element.
     *
     * @default null
     */
    element?: HTMLTableRowElement | null;

    /**
     * Reference to the inline edit form for this row.
     *
     * @default null
     */
    editInlineRowFormRef?: RefObject<InlineEditFormRef<T extends IColumnBase<infer C> ? C : unknown>>;

    /**
     * Unique react identifier for the row.
     *
     * @default -
     */
    key?: string;
}

/**
 * @private
 */
export interface Scroll {
    /**
     * Method to set padding based on scrollbar width
     */
    setPadding?: () => void;
    getScrollBarWidth?: () => number;
    virtualRowInfo: VirtualRowInfo;
    virtualColumnInfo: VirtualColumnInfo;
    scrollIntoVirtualRowsRangeView: (startPage: number, endPage: number, filteredTotalRecordsCount?: number, throttle?: number) => void;
    // virtualScrollRequest: () => void;
    isDataOperationPreventVirtualCache: RefObject<boolean>;
    // isDataOperationTotalCountChange: RefObject<boolean>;
    scrollToVirtualColumnIndex: (index?: number) => void;
    setVirtualColumnEndIndex: (visibleColumns?: ColumnProps[]) => void;
}

/**
 * @private
 */
export interface MutableGridBase<T = unknown> {
    /**
     * Column directives element
     */
    columnsDirective?: ReactElement;

    /**
     * State changed UI Column updated properties
     *
     * @private
     */
    uiColumns?: RefObject<ColumnProps<T>[]>;

    /**
     * Sort settings model
     */
    sortSettings?: SortSettings;

    /**
     * Default locale object
     */
    defaultLocale?: Object;

    /**
     * Sets the current view data
     *
     * @param {Object[]} data - The data to set
     */
    setCurrentViewData?: (data: (T | GroupedData<T>)[]) => void;

    /**
     * Current view data
     */
    currentViewData?: (T | GroupedData<T>)[];

    pageWiseGroupResponseViewData?: Map<number, GroupedData<T>[]>;
    setPageWiseGroupResponseViewData?: Dispatch<SetStateAction<Map<number, GroupedData<T>[]>>>;

    /**
     * Sets the virtual cached current view data
     *
     * @param {Map<number, Object>} data - The data to set
     */
    setVirtualCachedViewData?: Dispatch<SetStateAction<Map<number, (T | GroupedData<T>)>>>;

    /**
     * Current virtual cached view data
     */
    virtualCachedViewData?: Map<number, (T | GroupedData<T>)>;

    /**
     * Header row depth for stacked headers
     */
    headerRowDepth?: number;

    /**
     * Column elements for the grid
     */
    colElements?: JSX.Element[];
    isInitialLoad?: boolean;

    /**
     * Focus strategy module for centralized focus management
     */
    focusModule?: FocusStrategyModule;

    /**
     * The `selectionModule` is used to selecting the row in the Data Grid.
     */
    selectionModule?: selectionModule<T>;

    /**
     * The `cellSelectionModule` is used for cell selection in the Data Grid.
     */
    cellSelectionModule?: CellSelectionModel;

    /**
     * The `sortModule` is used to manipulate sorting in the Data Grid.
     */
    sortModule?: SortModule;

    /**
     * The `filterModule` is used to manipulate filtering in the Data Grid.
     */
    filterModule?: filterModule;

    /**
     * The `searchModule` is used to manipulate searching in the Data Grid.
     */
    searchModule?: searchModule;

    /**
     * The `groupModule` is used to manipulate row grouping in the Data Grid.
     */
    groupModule?: UseGroupResult<T>;

    /**
     * The `editModule` is used to manipulate editing in the Data Grid.
     */
    editModule?: editModule<T>;

    /**
     * Manages user-selected aggregate types via context menu.
     */
    aggregateSelection?: UseAggregateSelectionResult;

    gridAction?: GridActionEvent;
    filterSettings?: FilterSettings;
    searchSettings?: SearchSettings;
    currentPage?: number;
    totalRecordsCount?: number;
    expandedGroupCountRef: RefObject<number>;
    loadedPageWiseGroupExpandedCountRef?: RefObject<Map<number, number>>;
    loadedPageWiseVirtualGroupStartEndRowIndexes?: RefObject<Map<number, {startIndex: number, endIndex: number}>>;
    singleGroupColumn?: ColumnProps<T> | undefined;
    groupCaptionAggregateType?: Map<string, string[]>;
    responseData?: Object;
    setResponseData?: Dispatch<SetStateAction<Object>>;
    commandColumnModule?: UseCommandColumnResult<T>;
    /**
     * Get the parent element
     */
    getParentElement?: () => HTMLElement;
    /**
     * To evaluate sf-ellipsistooltip class required or not
     *
     * @param {HTMLElement} element - Defines the original cell reference element
     * @param {HTMLDivElement} htable - Dummy class based header table
     * @param {HTMLDivElement} ctable - Dummy class based content table
     * @returns {boolean} Define whether sf-ellipsistooltip class required for cell or not.
     * @private
     */
    evaluateTooltipStatus?: (element: HTMLElement) => boolean;
    isInitialBeforePaint?: RefObject<boolean>;
    isStateChangeEventTriggeringRequired?: RefObject<boolean>;
    cssClass?: string;

    /**
     * The data module for data operations (similar to original getDataModule())
     */
    dataModule?: UseDataResult;

    setColumnChooserState?: Dispatch<SetStateAction<object>>;

    /**
     * The toolbar module for toolbar operations
     */
    toolbarModule?: ToolbarAPI;

    /**
     * Indicates whether the grid has a checkbox selection column
     */
    isCheckBoxColumn?: boolean;
    /**
     * Indicates whether the configured columns include rowSpan or colSpan.
     */
    isSpannedColumns?: boolean;
    /** @default {enableRow: true, enableColumn: true, preventMaxRenderedRows: false, rowBuffer: preventMaxRenderedRows ? 500 : 5, columnBuffer: 5} */
    virtualSettings?: VirtualSettings;
    /** @default ScrollMode.Auto */
    scrollMode?: ScrollMode;
    totalVirtualColumnWidth?: number;
    columnOffsets?: {[key: number]: number};
    offsetX?: number;
    offsetY?: number;
    setOffsetX?: Dispatch<SetStateAction<number>>;
    setOffsetY?: Dispatch<SetStateAction<number>>;

    /**
     * Infinite scroll internal state (unified object for all infinite scroll data).
     * Internal mutable state for infinite scroll pagination via continuation tokens.
     *
     * @default { isInfiniteEndReached: false, infiniteCachePages: new Map(), infiniteCacheViewData: [], nextContinuationToken: null }
     */
    infiniteScrollState?: InfiniteScrollState;

    /**
     * Sets the infinite scroll state.
     * Updates entire state object atomically to maintain consistency.
     *
     * @param {InfiniteScrollState} state - New infinite scroll state
     */
    setInfiniteScrollState?: Dispatch<SetStateAction<InfiniteScrollState>>;

    /**
     * Stores the expansion state for master-detail rows in the grid.
     * Maps row indices to boolean values indicating whether each row is expanded or collapsed.
     *
     * @default new Map()
     */
    expansionState?: Map<number, boolean>;

    /**
     * Toggles expansion state for a master row
     *
     * @param {number} rowIndex - The row ID to toggle
     * @param {T} [rowData] - Optional row data
     * @returns {void}
     */
    onExpandStateChange?: (rowIndex: number, rowData?: T) => void;
}

/**
 * Interface for row reference and operations.
 *
 * @private
 */
export interface RowRef<T = unknown> {
    /**
     * Reference to the row DOM element.
     *
     * @default null
     */
    readonly rowRef: RefObject<HTMLTableRowElement | null>;

    /**
     * Gets the cell options objects.
     *
     * @returns {ICell<ColumnProps>[]} The cell options objects
     */
    getCells?: () => ICell<ColumnProps<T>>[];

    /**
     * Reference to the inline edit form for this row.
     *
     * @default null
     */
    editInlineRowFormRef?: RefObject<InlineEditFormRef<T>>;

    /**
     * Reference to the cell edit form for this row in cell edit mode.
     * Provides access to programmatic methods: focus(), getValue(), setValue(), and inputRef.
     *
     * @default null
     */
    editCellFormRef?: RefObject<CellEditFormRef>;

    /**
     * Function to set the row object state.
     *
     * @default null
     */
    setRowObject?: Dispatch<SetStateAction<IRow<ColumnProps<T>>>>;
}

/**
 * Interface defining custom operators for different data types in grid filtering.
 *
 * @private
 */
export interface ICustomOptr {
    /**
     * Custom operators for string type filtering.
     *
     * @default []
     */
    stringOperator?: { [key: string]: Object }[];
    /**
     * Custom operators for number type filtering.
     *
     * @default []
     */
    numberOperator?: { [key: string]: Object }[];
    /**
     * Custom operators for date type filtering.
     *
     * @default []
     */
    dateOperator?: { [key: string]: Object }[];
    /**
     * Custom operators for datetime type filtering.
     *
     * @default []
     */
    datetimeOperator?: { [key: string]: Object }[];
    /**
     * Custom operators for boolean type filtering.
     *
     * @default []
     */
    booleanOperator?: { [key: string]: Object }[];
}

/**
 * Extended row interface with additional properties
 *
 * @private
 */
export interface IRowBase<T = unknown> extends Omit<HTMLAttributes<HTMLTableRowElement>, 'children'> {
    /**
     * Type of row rendering
     */
    rowType?: RenderType;

    /**
     * Row data and metadata
     */
    row?: IRow<ColumnProps<T>>;

    /**
     * Child elements of the row
     */
    children?: ReactNode | ReactElement[];

    /**
     * Controls the padding area around the table scrollable region
     */
    tableScrollerPadding?: boolean;

    /**
     * Defines the aggregate row information.
     */
    aggregateRow?: AggregateRowProps;

    /**
     * column cells of the row
     */
    column?: ColumnProps<T>;
}

/**
 * Defines the supported data types for grid values, used in filtering, sorting, and other operations.
 * ```props
 * * number :- Represents numeric values.
 * * string :- Represents text values.
 * * Date :- Represents date values.
 * * boolean :- Represents true/false values.
 * ```
 */
export type ValueType = number | string | Date | boolean;

/**
 * Interface for render reference
 *
 * @private
 */
export interface RenderRef<T = unknown> extends HeaderPanelRef, ContentPanelRef<T>, FooterPanelRef, ContextMenuPanelRef {
    /**
     * Refreshes the grid view by getting the updated data
     */
    refresh(): void;
    /**
     * Refreshes the grid tbody UI content view
     *
     * @private
     */
    refreshContentUI(): void;
    /**
     * Useful for aria-busy grid role element attribute update purpose
     *
     * @private
     */
    isContentBusy: boolean;
    /** Shows a loading spinner overlay on the grid to indicate that an operation is in progress. */
    showSpinner(): void;
    /** Hides the loading spinner overlay that was previously shown on the grid. */
    hideSpinner(): void;
    /**
     * Scroll module reference
     */
    scrollModule?: Scroll;

    /**
     * Pager module reference
     */
    pagerModule?: PagerRef;

    /**
     * Opens the column chooser dialog programmatically
     *
     * @param {number} x - Optional X coordinate for custom positioning
     * @param {number} y - Optional Y coordinate for custom positioning
     */
    openColumnChooser(x?: number, y?: number): void;
}

/**
 * Base interface for render components
 *
 * @private
 */
export interface IRenderBase {
    /**
     * Child elements
     */
    children?: ReactNode;
}

/**
 * Interface for header panel reference
 *
 * @private
 */
export interface HeaderPanelRef extends HeaderTableRef {
    /**
     * Reference to the header panel element
     */
    readonly headerPanelRef?: HTMLDivElement | null;

    /**
     * Reference to the header scroll element
     */
    readonly headerScrollRef?: HTMLDivElement | null;
}

/**
 * Base interface for header panel properties
 *
 * @private
 */
export interface IHeaderPanelBase {
    /**
     * Attributes for the panel element
     */
    panelAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Attributes for the scroll content element
     */
    scrollContentAttributes?: HTMLAttributes<HTMLDivElement>;
}

/**
 * Interface for header table reference
 *
 * @private
 */
export interface HeaderTableRef extends HeaderRowsRef {
    /**
     * Reference to the header table element
     */
    readonly headerTableRef?: HTMLTableElement | null;
    getHeaderTable?: () => HTMLTableElement | null;
    columnClientWidth?: number;
}

/**
 * Base interface for header table properties
 *
 * @private
 */
export type IHeaderTableBase = HTMLAttributes<HTMLTableElement>;

/**
 * Interface for header rows reference
 *
 * @private
 */
export interface HeaderRowsRef {
    /**
     * Reference to the header section element
     */
    readonly headerSectionRef?: HTMLTableSectionElement | null;

    /**
     * Gets the header rows collection
     *
     * @returns {HTMLCollectionOf<HTMLTableRowElement> | undefined} The header rows
     */
    getHeaderRows?: () => HTMLCollectionOf<HTMLTableRowElement> | undefined;

    /**
     * Gets the row options objects with DOM element references
     *
     * @returns {IRow<ColumnProps>[]} The row options objects
     */
    getHeaderRowsObject?: () => IRow<ColumnProps>[];
}

/**
 * Base interface for header rows properties
 *
 * @private
 */
export type IHeaderRowsBase = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Interface for content panel reference
 *
 * @private
 */
export interface ContentPanelRef<T = unknown> extends ContentTableRef<T> {
    /**
     * Reference to the content panel element
     */
    readonly contentPanelRef?: HTMLDivElement | null;

    /**
     * Reference to the content scroll element
     */
    readonly contentScrollRef?: HTMLDivElement | null;

    /**
     * Reference to the virtual content row scroll element
     */
    readonly virtualContentRowScrollRef?: HTMLDivElement | null;

    /**
     * Reference to the virtual content column scroll element
     */
    readonly virtualContentColumnScrollRef?: HTMLDivElement | null;
}

/**
 * Base interface for content panel properties
 *
 * @private
 */
export interface IContentPanelBase {
    /**
     * Attributes for the panel element
     */
    panelAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Attributes for the scroll content element
     */
    scrollContentAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Attributes for the virtual scroll row content element
     */
    virtualRowScrollContentAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Attributes for the virtual scroll column content element
     */
    virtualColumnScrollContentAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Sets padding for the header
     */
    setHeaderPadding?: () => void;
}

/**
 * Interface for content table reference
 *
 * @private
 */
export interface ContentTableRef<T = unknown> extends ContentRowsRef<T> {
    /**
     * Reference to the content table element
     */
    readonly contentTableRef?: HTMLTableElement | null;
    getContentTable?: () => HTMLTableElement | null;

    /**
     * @private
     */
    addInlineRowFormRef?: RefObject<InlineEditFormRef<T>>;
    /**
     * @private
     */
    editInlineRowFormRef?: RefObject<InlineEditFormRef<T>>;
    /**
     * @private
     */
    editCellFormRef?: RefObject<CellEditFormRef>;
    columnClientWidth?: number;
}

/**
 * Base interface for content table properties
 *
 * @private
 */
export type IContentTableBase = HTMLAttributes<HTMLTableElement>;

/**
 * Interface for content rows reference
 *
 * @private
 */
export interface ContentRowsRef<T = unknown> {
    /**
     * Reference to the content section element
     */
    readonly contentSectionRef?: HTMLTableSectionElement | null;

    /**
     * Gets the rows collection
     *
     * @returns {HTMLCollectionOf<HTMLTableRowElement> | undefined} The rows
     */
    getRows(): HTMLCollectionOf<HTMLTableRowElement> | undefined;

    /**
     * Gets the row options objects with DOM references
     *
     * @returns {IRow<ColumnProps>[]} The row options objects with element references
     */
    getRowsObject(): IRow<ColumnProps<T>>[];

    /**
     * Gets the row by index
     *
     * @returns {HTMLTableRowElement}
     */
    getRowByIndex(rowIndex: number): HTMLTableRowElement;

    /**
     * Gets the row by uid
     *
     * @returns {IRow<ColumnProps>}
     */
    getRowObjectFromUID(uid: string): IRow<ColumnProps<T>>;
    cachedRowObjects: RefObject<Map<number | string, IRow<ColumnProps<T>>>>;
    totalRenderedRowHeight: RefObject<number>;
    totalAddFormRenderedRowHeight: RefObject<number>;
    setRequireMoreVirtualRowsForceRefresh?: Dispatch<SetStateAction<Object>>;
}

/**
 * Interface defining the foundational properties and attributes for footer panel component
 *
 * @private
 */
export interface IFooterPanelBase {
    /**
     * Attributes for the panel element
     */
    panelAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Attributes for the scroll content element
     */
    scrollContentAttributes?: HTMLAttributes<HTMLDivElement>;

    /**
     * Controls the padding area around the table scrollable region
     */
    tableScrollerPadding?: boolean;
}

/**
 * Interface defining the foundational properties and attributes for footer table component
 *
 * @private
 */
export interface IFooterTableBase extends HTMLAttributes<HTMLTableElement> {
    /**
     * Controls the padding area around the table scrollable region
     */
    tableScrollerPadding?: boolean;
}

/**
 * Interface defining the foundational properties and attributes for footer rows component
 *
 * @private
 */
export interface IFooterRowsBase extends HTMLAttributes<HTMLTableSectionElement> {
    /**
     * Controls the padding area around the table scrollable region
     */
    tableScrollerPadding?: boolean;
}

/**
 * Interface for footer panel reference
 *
 * @private
 */
export interface FooterPanelRef extends FooterTableRef {
    /**
     * Reference to the footer panel element
     */
    readonly footerPanelRef?: HTMLDivElement | null;

    /**
     * Reference to the footer scroll element
     */
    readonly footerScrollRef?: HTMLDivElement | null;
}

/**
 * Interface for footer table reference
 *
 * @private
 */
export interface FooterTableRef extends FooterRowsRef {
    /**
     * Reference to the footer table element
     */
    readonly footerTableRef?: HTMLTableElement | null;
    getFooterTable?: () => HTMLTableElement | null;
    columnClientWidth?: number;
}

/**
 * Interface for footer rows reference
 *
 * @private
 */
export interface FooterRowsRef {
    /**
     * Reference to the footer section element
     */
    readonly footerSectionRef?: HTMLTableSectionElement | null;

    /**
     * Gets the footer rows collection
     *
     * @returns {HTMLCollectionOf<HTMLTableRowElement> | undefined} The footer rows
     */
    getFooterRows?: () => HTMLCollectionOf<HTMLTableRowElement> | undefined;

    /**
     * Gets the row options objects with DOM element references
     *
     * @returns {IRow<ColumnProps>[]} The row options objects
     */
    getFooterRowsObject?: () => IRow<ColumnProps>[];
}

/**
 * Base interface for content rows properties
 *
 * @private
 */
export type IContentRowsBase = HTMLAttributes<HTMLTableSectionElement>;

/**
 * Defines event arguments for custom data service requests in the Data Grid component.
 * Provides parameters for querying data from a remote or custom data source, including pagination, filtering, sorting, and searching.
 * Used to configure and execute data retrieval operations for the grid.
 */
export interface DataRequestEvent {
    /**
     * Specifies the number of records to skip in the data source for pagination.
     * Used to navigate to specific pages or subsets of data.
     *
     * @default 0
     */
    skip?: number;

    /**
     * Specifies the number of records to retrieve per page from the data source.
     * Used to limit the data fetched in a single request.
     *
     * @default 12
     */
    take?: number;

    /**
     * Indicates whether the data service should return both records and the total record count.
     * When true, requires the service to include the total count for pagination.
     *
     * @default false
     */
    requiresCounts?: boolean;

    /**
     * Contains an array of filter criteria for querying the data source.
     * Specifies conditions to filter data, such as equality or range checks on specific fields.
     * Used to apply user-defined or programmatic filters to the grid’s data.
     *
     * @default []
     */
    where?: Predicate[];

    /**
     * Contains an array of sort criteria defining the fields and directions for sorting.
     * Specifies how data should be ordered, such as ascending or descending by column.
     * Used to apply sorting to the grid’s data based on user or programmatic input.
     *
     * @default []
     */
    sort?: SortDescriptor[];

    /**
     * Contains an array of search criteria for full-text or field-specific searches.
     * Specifies search terms or conditions to filter data across one or more fields.
     * Used to implement search functionality within the grid.
     *
     * @default []
     */
    search?: SearchSettings[];

    /**
     * Contains an array of aggregation criteria for summarizing data in the grid.
     * Specifies functions like sum, average, min, max, or count to be applied on specific fields.
     * Used to compute and display aggregated values in the grid.
     *
     * @default []
     */
    aggregates?: Aggregates[];

    /**
     * Contains details about the grid action (e.g., paging, grouping, filtering, sorting, searching) that triggered the request.
     * Provides context about the user or programmatic action driving the data query.
     * Used to handle specific action-related logic in the data service.
     *
     * @default null
     */
    action?: FilterEvent | SortEvent | SearchEvent | PageEvent;

    /**
     * Specifies the name of the action associated with the data request.
     *
     * @default -
     */
    name?: string;

    /**
     * Contains an array of field names to retrieve from the data source.
     * Specifies which columns or properties should be included in the query result.
     * Used to optimize data retrieval by selecting only necessary fields.
     *
     * @default []
     */
    select?: string[];

    /**
     * Indicates whether the data service should return distinct counts for the result set.
     * When true, requires the service to calculate unique value counts alongside the data.
     * Used for scenarios requiring unique record counting or deduplication.
     *
     * @default false
     */
    distinctCounts?: boolean;

    /**
     * Specifies the type of request being made to the data service.
     * Indicates the context of the data request, such as 'filterChoiceRequest' for filter dropdown data.
     * Used to determine how the response should be processed and applied to the grid.
     *
     * @default null
     */
    requestType?: string;

    /**
     * Specifies a callback function to handle the data service response.
     * Executes with the query result when a specific request type requires custom handling.
     * Used for scenarios like filter choice requests that need direct response processing.
     *
     * @default null
     */
    dataSource?: Function;

    /**
     * Contains an array of filter criteria for distinct value queries.
     * Specifies conditions to filter data when calculating distinct counts.
     * Used alongside distinctCounts to apply the same filter predicates when fetching distinct values.
     *
     * @default []
     */
    distinct?: Predicate[];
}

/**
 * Defines event arguments for custom data source change requests in the Data Grid component.
 * Provides parameters for handling data modifications, such as adding, updating, or deleting records.
 * Used to manage data change operations and their associated actions in the grid.
 */
export interface DataChangeRequestEvent<T = unknown> {
    /**
     * Specifies the type of action being performed, such as add, edit, or delete.
     *
     * @default -
     */
    action?: string;

    /**
     * Specifies the primary column field used to identify records in the data source.
     * Defines the unique key for operations like updating or deleting specific records.
     * Used to target specific rows for data modifications.
     *
     * @default -
     */
    key?: string | string[];

    /**
     * Contains the state of the grid’s data request, including pagination, filtering, or sorting criteria.
     * Provides context for the data change operation, such as the current grid state.
     * Used to align the change with the grid’s current data configuration.
     *
     * @default null
     */
    state?: DataRequestEvent;

    /**
     * Contains the modified data for the operation.
     * Represents the record affected by the data change, such as new or updated rows.
     * Used to process or validate the data being modified.
     *
     * @default null
     */
    data?: T | T[];

    /**
     * Specifies the index of the row affected by the data change operation.
     * Identifies the row’s position in the grid for operations like insertion or selection.
     * Used to manage row-specific actions or UI updates.
     *
     * @default 0
     */
    rowIndex?: number;

    /**
     * Specifies a function to finalize the editing process after a data change.
     * Executes logic to complete the edit operation.
     * Used to manage the conclusion of editing in the grid.
     *
     * @default null
     */
    saveDataChanges?: Function;

    /**
     * Specifies a function to cancel the editing process.
     * Executes logic to discard changes and revert the grid to its previous state.
     * Used to handle cancellation of inline editing operations.
     *
     * @default null
     */
    cancelDataChanges?: Function;

    /**
     * Specifies a promise that resolves with the result of the data change operation.
     * Enables asynchronous handling of data modifications, such as API responses.
     * Used to manage the outcome of remote data operations.
     *
     * @private
     * @default null
     */
    promise?: Promise<Object>;
}

/**
 * Defines the pending state for Custom Service Data
 *
 * @private
 */
export interface PendingState {
    /**
     * The function which resolves the current action's promise.
     */
    resolver?: Function;
    /**
     * Defines the current state of the action.
     */
    isPending?: boolean;
    /**
     * Defines the edit action.
     */
    isEdit?: boolean;
}

/**
 * Interface for header cell render event arguments.
 *
 * @private
 */
export interface HeaderCellRenderEvent {
    /**
     * Defines the cell metadata.
     *
     * @private
     */
    cell: ICell<ColumnProps>;
    /**
     * Defines the column object associated with this cell.
     *
     * @default -
     */
    column: ColumnProps;
    /** Defines the cell element. */
    node: Element;
}

/**
 * Interface for cell render event arguments.
 *
 * @private
 */
export interface CellRenderEvent<T = unknown> {
    /**
     * Defines the row data associated with this cell.
     */
    data: T;
    /** Defines the cell element.
     *
     * @blazorType CellDOM
     */
    cell: Element;
    /**
     * Defines the column object associated with this cell.
     */
    column: ColumnProps<T>;
    /**
     * Defines the number of columns to be spanned.
     */
    colSpan: number;
    /**
     * Defines the number of rows to be spanned.
     */
    rowSpan: number;
}

/**
 * Interface for row render event arguments.
 *
 * @private
 */
export interface RowRenderEvent<T = unknown> {
    /**
     * Defines the current row data.
     */
    data: T | GroupedData<T>;
    /** Defines the row element. */
    row?: Element;
    /** Defines the row height */
    rowHeight: number;
    /**
     * Defines whether the row should be selectable or not.
     */
    isSelectable: boolean;
}

/**
 * CSS properties for scroll customization
 *
 * @private
 * @interface ScrollCss
 */
export interface ScrollCss {
    /** Padding direction based on RTL/LTR mode */
    padding?: 'paddingLeft' | 'paddingRight';
    /** Border direction based on RTL/LTR mode */
    border?: 'borderLeftWidth' | 'borderRightWidth';
}

/**
 * References to scroll-related DOM elements
 *
 * @interface ScrollElements
 * @private
 */
export interface ScrollElements {
    /** Reference to the header scroll container element */
    headerScrollElement: HTMLElement | null;
    /** Reference to the content scroll container element */
    contentScrollElement: HTMLElement | null;
    /** Reference to the virtual content row scroll container element */
    virtualContentRowScrollElement: HTMLElement | null;
    /** Reference to the virtual content column scroll container element */
    virtualContentColumnScrollElement: HTMLElement | null;
    /** Reference to the footer scroll container element */
    footerScrollElement: HTMLElement | null;
}

/**
 * @interface VirtualInfo
 * @private
 */
export interface VirtualInfo {
    startIndex: number;
    endIndex: number;
    isFastJumpScroll: boolean;
    isFocusScrollOffsetChange: boolean;
}

/**
 * @interface VirtualRowInfo
 * @private
 */
export interface VirtualRowInfo extends VirtualInfo {
    offsetY: number;
    requiredRowsRange: number[];
    currentPages: number[];
    previousPages: number[];
    scrollFocusCurrentAriaRowIndex: number;

    // Browser scroll height limitation handling
    maxDivHeight?: number;                      // Browser-detected max div height
    browserLimitStretchedRowOffset?: number;    // Current row offset for stretching
    isStretchingActive?: boolean;               // Whether stretching is needed
}

/**
 * @interface VirtualColumnInfo
 * @private
 */
export interface VirtualColumnInfo extends VirtualInfo {
    offsetX: number;
    scrollFocusCurrentAriaColIndex: number;
    columns: ColumnProps[];
    /**
     * Visible header cell metadata for the current virtual column viewport.
     */
    visibleHeaderColumns?: ColumnProps[];
}

/**
 * Return type for useScroll hook
 *
 * @private
 * @interface UseScrollResult
 */
export interface UseScrollResult<T> {
    /** Public API exposed to consumers */
    publicScrollAPI: Partial<IGrid<T>>;
    /** Private API for internal component use */
    privateScrollAPI: {
        /** Get CSS properties based on RTL/LTR mode */
        getCssProperties: ScrollCss;
        /** Border styles for header content */
        headerContentBorder: CSSProperties;
        /** Padding styles for header */
        headerPadding: CSSProperties;
        /** Event handler for content scroll events */
        onContentScroll: (event: UIEvent<HTMLDivElement>) => void;
        /** Event handler for virtual row content scroll events */
        onVirtualRowContentScroll: (event: UIEvent<HTMLDivElement>) => void;
        /** Event handler for virtual column content scroll events */
        onVirtualColumnContentScroll: (event: UIEvent<HTMLDivElement>) => void;
        /** Event handler for header scroll events */
        onHeaderScroll: (event: UIEvent<HTMLDivElement>) => void;
        /** Event handler for footer scroll events */
        onFooterScroll: (event: UIEvent<HTMLDivElement>) => void;
    };
    /** Protected API for extended components */
    protectedScrollAPI: Scroll;
    /** Method to set header scroll element reference */
    setHeaderScrollElement: (element: HTMLElement | null) => void;
    /** Method to set content scroll element reference */
    setContentScrollElement: (element: HTMLElement | null) => void;
    /** Method to set footer scroll element reference */
    setFooterScrollElement: (element: HTMLElement | null) => void;
}

/**
 * The `Sort` module internal properties
 *
 * @private
 */
export interface SortProperties {
    currentEvent: React.MouseEvent | React.KeyboardEvent;
    isMultiSort: boolean;
    sortSettings: SortSettings;
    contentRefresh: boolean;
    sortedColumns: string[];
}

/**
 * Interface for the result of useData hook
 *
 * @private
 */
export interface UseDataResult<T = unknown> {
    /**
     * The function is used to generate updated Query from Grid model.
     */
    generateQuery: () => Query;

    /**
     * The DataManager instance for data operations
     */
    dataManager: DataManager | DataResult;

    /**
     * Check if the data source is remote
     */
    isRemote: () => boolean;

    /**
     * Perform data operations through DataManager
     */
    getData: (props?: { requestType?: string; data?: T | T[]; index?: number }, query?: Query, payload?: payload) =>
    Promise<Response | ReturnType | DataResult>;
    dataState: RefObject<PendingState>;
    getStateEventArgument: (query: Query) => DataRequestEvent;
}

/**
 * Manages user-selected aggregate types via context menu.
 *
 * @private
 */
export interface UseAggregateSelectionResult {
    /**
     * Retrieves selected aggregate for a specific row and column.
     * Returns undefined if no selection exists.
     */
    getAggregate: (rowIndex: number, field: string) => AggregateType | undefined;

    /**
     * Adds/replaces aggregate type for a specific row and column.
     * Replaces previous selection if it exists.
     */
    addAggregate: (rowIndex: number, field: string, type: AggregateType) => void;
}

/**
 * ServiceLocator for React components
 * Provides dependency injection capabilities for various services
 *
 * @private
 */
export interface ServiceLocator {
    /**
     * Register a service with the given name
     *
     * @param name - The name of the service
     * @param type - The service implementation
     */
    register<T extends object>(name: string, type: T): void;
    /**
     * Unregister all services
     * Used for cleanup
     */
    unregisterAll(): void;

    /**
     * Get a service by name
     *
     * @param name - The name of the service to retrieve
     * @returns The requested service
     * @throws Error if the service is not registered
     */
    getService<T extends object>(name: string): T;

    /**
     * Dictionary of registered services
     */
    readonly services: {
        readonly [x: string]: Object;
    };
}

/**
 * Interface for mutable grid state setters.
 *
 * @private
 */
export interface MutableGridSetter<T = unknown> {
    /**
     * Function to set the current view data.
     */
    setCurrentViewData: Dispatch<SetStateAction<(T | GroupedData<T>)[]>>;
    /**
     * Function to set the initial load state.
     */
    setInitialLoad: Dispatch<SetStateAction<boolean>>;
    /**
     * Function to set the current page number.
     */
    setCurrentPage: Dispatch<SetStateAction<number>>;
    /**
     * Function to set the total records count.
     */
    setTotalRecordsCount: Dispatch<SetStateAction<number>>;
    /**
     * Function to set the grid action.
     */
    setGridAction: Dispatch<SetStateAction<Object>>;
}

/**
 * Result interface for the useGridComputedProps hook
 *
 * @private
 */
export interface GridResult<T> {
    /**
     * Public API exposed to consumers of the grid
     */
    gridAPI: IGrid<T>;

    /**
     * Private API for internal grid operations
     */
    gridInternal: {
        /**
         * CSS styles for the grid container
         */
        styles: CSSProperties;
        isEllipsisTooltip: boolean;

        /**
         * Function to update the current view data
         */
        setCurrentViewData: Dispatch<SetStateAction<Object[]>>;
        setInitialLoad: Dispatch<SetStateAction<boolean>>;
        handleGridClick: (e: MouseEvent) => void;
        handleGridDoubleClick: (e: MouseEvent) => void;
        handleGridMouseDown: (e: MouseEvent) => void;
        handleGridMouseOut: (e: MouseEvent) => void;
        handleGridMouseOver: (e: MouseEvent) => void;
        getEllipsisTooltipContent: () => string;
        handleGridFocus: (e: FocusEvent) => void;
        handleGridBlur: (e: FocusEvent) => void;
        handleGridKeyDown: (e: React.KeyboardEvent) => void;
        handleGridKeyUp: (e: React.KeyboardEvent) => void;
        setCurrentPage: Dispatch<SetStateAction<number>>;
        setTotalRecordsCount: Dispatch<SetStateAction<number>>;
        setGridAction: Dispatch<SetStateAction<Object>>;
    };

    /**
     * Protected API for internal grid components
     */
    gridScoped: Partial<IGridBase<T>>;
}


/**
 * Interface for the result of useRender hook
 *
 * @private
 */
export interface UseRenderResult<T> {
    /**
     * Public API exposed to consumers
     */
    publicRenderAPI: Partial<IGrid<T>>;

    /**
     * Private API for internal operations
     */
    privateRenderAPI: {
        /**
         * CSS styles for content panel
         */
        contentStyles: CSSProperties;

        /**
         * Whether the layout is rendered
         */
        isLayoutRendered: boolean;

        /**
         * Whether the content is busy
         */
        isContentBusy: boolean;
    };

    /**
     * Protected API for internal components
     */
    protectedRenderAPI: {
        /**
         * Method to refresh the data
         */
        refresh: () => void;
        /** Shows a loading spinner overlay on the grid to indicate that an operation is in progress. */
        showSpinner: () => void;
        /** Hides the loading spinner overlay that was previously shown on the grid. */
        hideSpinner: () => void;
    };
}

/**
 * Interface for column children props
 *
 * @private
 */
export interface ColumnsChildren<T = unknown> {
    children: ReactElement<IColumnBase<T>>[] | ReactElement<IColumnBase<T>>;
}

/**
 * Interface for summary data
 *
 * @private
 */
export interface SummaryData {
    aggregates?: Aggregates;
    level?: number;
    parentUid?: string;
}

/**
 * Interface for group data
 *
 * @private
 */
export interface Group<T = unknown> {
    GroupGuid?: string;
    level?: number;
    childLevels?: number;
    records?: T[];
    key?: string;
    count?: number;
    items?: T[];
    aggregates?: AggregateData<T>;
    field?: string;
    result?: T[];
}
