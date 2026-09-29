import { ComponentType, Dispatch, HTMLAttributes, ReactElement, ReactNode, RefObject, SetStateAction } from 'react';
import { IL10n } from '@syncfusion/react-base/src/l10n';
import { HeaderCellRenderEvent, CellRenderEvent, RowRenderEvent, ServiceLocator, RenderRef, MutableGridBase, DataChangeRequestEvent, DataRequestEvent, IRowBase, IValueFormatter, ValueType, UseDataResult } from '../types/interfaces';
import { GridLine, SortDirection, WrapMode, Action, ClipMode, RowType, ToolbarItems, Theme, LoadingIndicatorType, ScrollMode, ActionType, GroupSummaryPosition, AutoFitMode, ColumnPinDirection } from '../types/enum';
import { DataResponse } from './infinite-scroll.interface';
import { ContextMenuClickEvent, contextMenuModule, ContextMenuOpenEvent, ContextMenuSettings } from './context.interfaces';
import { FilterSettings, FilterEvent, FilterDialogBeforeOpenEvent, FilterDialogAfterOpenEvent, filterModule } from '../types/filter.interfaces';
import { ColumnProps, FlattenedColumn, IColumnBase } from '../types/column.interfaces';
import { CellFocusEvent, FocusStrategyResult } from '../types/focus.interfaces';
import { EditSettings, FormRenderEvent, RowEditEvent, CellEditEvent, DeleteEvent,
    RowAddEvent, SaveEvent, FormCancelEvent, DeleteDialogEventArgs, UseEditResult, editModule } from '../types/edit.interfaces';
import { AggregateCellRenderEvent, AggregateRowRenderEvent, AggregateRowProps, aggregateModule } from '../types/aggregate.interfaces';
import { GroupedData, GroupSettings, GroupSummary, OnGroupArgs, ShouldExpandGroupEvent, UseGroupResult } from '../types/grouping.interfaces';
import { ToolbarAPI, ToolbarClickEvent, ToolbarConfig, ToolbarItemProps } from '../types/toolbar.interfaces';
import { IsRowSelectable, RowSelectEvent, RowSelectingEvent, SelectionModel, SelectionSettings, selectionModule } from '../types/selection.interfaces';
import { PageEvent, pagerModule, PageSettings } from '../types/page.interfaces';
import { SortEvent, SortSettings } from '../types/sort.interfaces';
import { SearchAPI, SearchEvent, SearchSettings } from '../types/search.interfaces';
import { VirtualizationSettings, VirtualSettings } from './virtualization.interface';
import { SpinnerProps } from '@syncfusion/react-popups/src/spinner/spinner';
import { SkeletonProps } from '@syncfusion/react-notifications/src/skeleton/skeleton';
import { CellSelectionModel, CellSelectEvent, CellSelectingEvent, CellDeselectEvent, CellDeselectingEvent, RowCellInfo, CellIdentifier } from '../types/cell-selection.interfaces';
import { MenuSelectEvent } from '@syncfusion/react-navigations/src/menu/types';
import { DetailRowTemplate, RowExpandEvent, RowCollapseEvent } from './master-detail';
import { DetailCellRendererParams } from './detail-cell-renderer.interfaces';
import { ClipboardCopyEvent, ClipboardCutEvent, ClipboardPasteEvent, ClipboardSettings, ClipboardModuleType, Clipboard } from './clipboard.interfaces';
import { UseCommandColumnResult } from './command.interfaces';
import { columnChooserModule } from './column-chooser.interface';
import { DataManager, Query, DataResult, ReturnType as DataReturnType, Aggregates } from '@syncfusion/react-data';
import { AutoFitColumn, AutoFitModuleType } from './auto-fit.interfaces';
import { UndoStartEvent, UndoCompleteEvent, RedoStartEvent, RedoCompleteEvent, UseUndoRedoResult } from './undoredo.interfaces';
import { ColumnResizeEndEvent, ColumnResizeEvent, ColumnResizeStartEvent, ResizeColumn, ResizeModuleType, ResizeSettings } from './resize.interfaces';
import { AutoFillModuleType, AutoFillSettings, CellFillCompletedEvent, CellFillStartedEvent, AutoFill, AutoFillRange } from './autofill.interfaces';
import { RowDragEventArgs } from './row-reordering.interfaces';
import { DetailGridModuleType } from './detail-grid.interfaces';
import { ColumnReorderEndEvent, ColumnReorderEvent, ColumnReorderStartEvent, ReorderModuleType, ReorderSettings } from './reorder.interfaces';
import { RowPinningEvent, PinningSettings, PinningModuleType, PinningModuleResult } from './pinning.interfaces';
import { FormulaModuleType, FormulaSettings } from './formula.interfaces';
import { StagedRowData } from './batch-edit.interfaces';
import { TreeGridRow } from './treeData.interfaces';
import { TreeDataSettings, UseTreeDataResult } from '../hooks/useTreeData';
import { PivotModuleType } from './pivot.interfaces';
import { PivotSettings, PivotColumnContext, PivotColumnOverrides,
    PivotColumnGroupContext, PivotColumnGroupOverrides } from './pivot.interfaces';
import { PivotChangeEvent } from './pivot.interfaces';
import { PivotErrorEvent } from './pivot.interfaces';
import { SideBar, SideBarToolPanelModule } from './sidebar.interfaces';

/**
 * Defines settings for the loading indicator displayed during grid data operations.
 * Combines indicator type configuration with component-specific customization options.
 * Used to provide visual feedback to users when the grid is fetching, processing, or rendering data.
 *
 * Supports two indicator types:
 * * `Spinner` - Displays a traditional spinner animation (circular or linear). Configured with SpinnerProps for customization.
 * * `Shimmer` - Displays a skeleton placeholder that previews the content layout. Configured with SkeletonProps for customization.
 *
 * @default {
 *   indicatorType: LoadingIndicatorType.Spinner,
 *   params: {
 *     visible: true,
 *     thickness: '3px',
 *     animationDuration: '1s',
 *     overlay: true,
 *     size: '36px',
 *     color: Color.Primary
 *   }
 * }
 *
 * @example
 * ```tsx
 * // Using default Spinner
 * <Grid loadingIndicatorSettings={{ indicatorType: LoadingIndicatorType.Spinner }} />
 *
 * // Using Shimmer with custom parameters
 * <Grid loadingIndicatorSettings={{
 *   indicatorType: LoadingIndicatorType.Shimmer,
 *   params: {
 *     width: '100%',
 *     height: '10px',
 *     variant: 'text',
 *     animation: 'wave'
 *   }
 * }} />
 * ```
 */
export interface LoadingIndicatorSettings {
    /**
     * Specifies the type of loading indicator to display.
     * * `Spinner` - Displays a circular or linear spinner animation for traditional loading feedback.
     * * `Shimmer` - Displays a skeleton placeholder that simulates the content being loaded.
     *
     * @default LoadingIndicatorType.Spinner
     */
    indicatorType?: LoadingIndicatorType;

    /**
     * Provides customization options for the selected loading indicator type.
     * Accepts properties from `SpinnerProps` (for Spinner type) or `SkeletonProps` (for Shimmer type).
     * Allows fine-tuning of appearance, animation, colors, and behavior specific to the selected indicator.
     *
     * @default
     * Spinner: `{ visible: true, thickness: '3px', animationDuration: '1s', overlay: true, type: SpinnerType.Circular, size: '36px', color: Color.Primary }`
     * Shimmer: `{ width: '100%', height: '10px', variant: Variants.Text, animation: AnimationType.Wave }`
     */
    params?: SpinnerProps | SkeletonProps;
}

/**
 * Configures the behavior and appearance of the `ColumnChooser` dialog.
 * Provides options for search, column ordering, and template customization.
 */
export interface ColumnChooserSettings {
    /**
     * Specifies when column visibility changes are committed.
     *
     * @default 'deferred'
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{ mode: 'immediate' }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    mode?: 'deferred' | 'immediate';

    /**
     * Specifies the debounce delay for Immediate mode column visibility updates in milliseconds.
     *
     * @default 1500
     */
    immediateModeDelay?: number;

    /**
     * Enables drag-and-drop reordering inside the column chooser.
     * Requires grid-level column reordering to be enabled.
     *
     * @default false
     */
    enableReorder?: boolean;

    /**
     * Enables or disables the search box in the `ColumnChooser` dialog.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{ enableSearch: false }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    enableSearch?: boolean;

    /**
     * Specifies the search operator used to filter columns by name in the Column Chooser.
     *
     * Available operators:
     *   * `startsWith` — Matches columns that start with the search term.
     *   * `endsWith` — Matches columns that end with the search term.
     *   * `contains` — Matches columns that contain the search term.
     *   * `equal` — Exact match with the search term.
     *   * `notEqual` — Columns that do not match the search term.
     *
     * @default 'startsWith'
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{ operator: 'contains' }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    operator?: 'startsWith' | 'endsWith' | 'contains' | 'equal' | 'notEqual';

    /**
     * Enables diacritics-insensitive searching in the `ColumnChooser`.
     * When true, accent marks and special characters are ignored during search.
     *
     * Example: Searching for `Resume` matches `Résumé`.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{ ignoreAccent: true }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    ignoreAccent?: boolean;

    /**
     * Specifies the sort direction for columns displayed in the `ColumnChooser`.
     *
     * Available options:
     *   * `None` — Display columns in their original order.
     *   * `Ascending` — Sort columns alphabetically A-Z by `field`.
     *   * `Descending` — Sort columns alphabetically Z-A by `field`.
     *
     * @default 'None'
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{ sortDirection: 'Ascending' }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    sortDirection?: 'None' | 'Ascending' | 'Descending';

    /**
     * Ordered list of column field to display in the `ColumnChooser`.
     * When provided, columns included in this array appear in the specified order.
     * Columns not included retain their original position.
     *
     * @default []
     *
     * @example
     * ```tsx
     * <Grid
     *   columnChooserSettings={{
     *     selectedColumns: ['CustomerName', 'OrderID', 'Freight']
     *   }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    selectedColumns?: string[];

    /**
     * Custom template for the `ColumnChooser` dialog header.
     * Replaces the default header area above the search box.
     *
     * Template receives no props by default.
     *
     * @default null
     *
     * @example
     * ```tsx
     * const HeaderTemplate = () => (
     *   <div style={{ padding: '10px', background: '#f0f0f0' }}>
     *     <h3>Customize Columns</h3>
     *     <p>Select columns to display</p>
     *   </div>
     * );
     *
     * <Grid
     *   columnChooserSettings={{ headerTemplate: HeaderTemplate }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    headerTemplate?: ComponentType | ReactElement | string;

    /**
     * Custom template for the `ColumnChooser` dialog footer.
     * Renders below the column list and receives `ColumnChooserFooterProps`.
     *
     * @default null
     *
     * @example
     * ```tsx
     * const FooterTemplate = ({ visibleCount, totalCount }) => (
     *   <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
     *     <small>{visibleCount} of {totalCount} columns visible</small>
     *   </div>
     * );
     *
     * <Grid
     *   columnChooserSettings={{ footerTemplate: FooterTemplate }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    footerTemplate?: ComponentType<ColumnChooserFooterProps> | ReactElement | string;

    /**
     * Custom template that replaces the default column list and dialog content.
     * Receives `ColumnChooserTemplateProps` including columns data and utility functions
     * such as `showColumns`, `hideColumns`, and `searchValue`.
     *
     * @default null
     *
     * @example
     * ```tsx
     * const ChooserTemplate = ({ columns, showColumns, hideColumns, searchValue }) => (
     *   <div className="custom-chooser">
     *     <h4>Columns ({columns.length})</h4>
     *     {columns.map(col => (
     *       <div key={col.field}>
     *         <input type="checkbox" checked={col.visible} />
     *         {col.headerText}
     *       </div>
     *     ))}
     *   </div>
     * );
     *
     * <Grid
     *   columnChooserSettings={{ template: ChooserTemplate }}
     *   showColumnChooser={true}
     * />
     * ```
     */
    template?: ComponentType<ColumnChooserTemplateProps> | ReactElement | string;
}

/**
 * Configuration for the per-column header menu displayed inside header cells.
 * Use `columnMenuSettings.enabled` to turn the feature on or off.
 */
export interface ColumnMenuSettings {
    /**
     * When true, displays the column menu trigger inside header cells.
     *
     * @default false
     */
    enabled?: boolean;
    /**
     * When true, renders a "Filter" item inside the per-column menu which opens
     * the column's filter dialog when selected. If false (default), the filter
     * can still be opened via the header filter icon but will not appear in the
     * column menu.
     *
     * @default false
     */
    showFilter?: boolean;
}

/**
 * Defines the event arguments passed when the column menu is opened.
 * Provides the target column and available menu actions before display.
 */
export interface ColumnMenuOpenEvent {
    /**
     * Indicates whether the column menu should be canceled.
     *
     * @default false
     */
    cancel?: boolean;
    /**
     * The list of menu item identifiers that are available in the menu.
     */
    items: string[];
    /**
     * The column associated with the menu trigger.
     */
    column?: ColumnProps;
    /**
     * The HTML element that triggered the menu.
     */
    target?: HTMLElement;
    /**
     * Native event associated with the menu open action, when available.
     */
    event?: Event;
}

/**
 * Defines the event arguments passed when a column menu item is clicked.
 */
export interface ColumnMenuClickEvent {
    /**
     * The selected menu item identifier.
     */
    item: string;
    /**
     * The column associated with the menu trigger.
     */
    column?: ColumnProps;
    /**
     * The HTML element that triggered the menu.
     */
    target?: HTMLElement;
    /**
     * Native menu selection event.
     */
    event?: MenuSelectEvent;
}

/**
 * Defines the event arguments passed when the column menu is closed.
 */
export interface ColumnMenuCloseEvent {
    /**
     * The column associated with the closed menu.
     */
    column?: ColumnProps;
    /**
     * The HTML element that triggered the menu.
     */
    target?: HTMLElement;
    /**
     * Native close event, when available.
     */
    event?: Event;
}

/**
 * Configures row drag-and-drop between grid instances.
 */
export interface DragAndDropSettings {
    /**
     * Enables row drag-and-drop.
     */
    enabled?: boolean;

    /**
     * Specifies the id of a grid that accepts dropped rows.
     */
    targetID?: string;
}

/**
 * Props passed to the Column Chooser footer template.
 */
export interface ColumnChooserFooterProps {
    /**
     * Number of columns currently visible in the chooser.
     */
    visibleCount: number;

    /**
     * Total number of columns available in the chooser.
     */
    totalCount: number;

    /**
     * Array of currently visible column fields.
     */
    visibleColumns: string[];

    /**
     * Array of currently hidden column fields.
     */
    hiddenColumns: string[];
    /**
     * Called when the template requests applying changes (OK).
     */
    onApply?: () => void;
    /**
     * Called when the template requests closing or canceling the dialog.
     */
    onClose?: () => void;
    /**
     * Current visibility map keyed by `field` or `uid`.
     */
    columnVisibility?: Map<string, boolean>;
}

/**
 * Props passed to the Column Chooser template.
 */
export interface ColumnChooserTemplateProps<T = unknown> {
    /**
     * Array of all columns available in the Column Chooser.
     * Each item is a partial `ColumnProps<T>` object.
     */
    columns: Partial<ColumnProps<T>>[];

    /**
     * Array of currently visible column fields.
     */
    showColumns: string[];
    /**
     * Array of currently hidden column fields.
     */
    hideColumns: string[];

    /**
     * Current search value in the chooser search box.
     */
    searchValue?: string;

    /**
     * Toggle handler for individual columns. Receives the column `field` or `uid` and the target checked state.
     */
    onToggle?: (fieldOrUid: string, checked: boolean) => void;

    /**
     * Toggle handler for the "Select All" action. Receives the target checked state.
     */
    onSelectAll?: (checked: boolean) => void;

    /**
     * Apply/OK handler exposed to templates.
     */
    onApply?: () => void;

    /**
     * Close/Cancel handler exposed to templates.
     */
    onClose?: () => void;

    /**
     * Current visibility map keyed by `field` or `uid`.
     */
    columnVisibility?: Map<string, boolean>;
}

/**
 * Event raised before the `ColumnChooser` dialog opens.
 *
 * Provides the effective `ColumnChooser` settings for the pending dialog.
 * Allows modification of settings or cancellation of the dialog open action.
 * Use this event to adjust search, ordering, or selected columns before display.
 */
export interface ColumnChooserBeforeOpenEvent extends GridActionEvent {
    /**
     * Specifies when Immediate mode visibility changes are committed.
     *
     * @type {'deferred' | 'immediate'}
     * @default 'deferred'
     */
    mode?: 'deferred' | 'immediate';

    /**
     * Specifies the debounce delay for Immediate mode visibility changes in milliseconds.
     *
     * @type {number}
     * @default 1500
     */
    immediateModeDelay?: number;

    /**
     * Enables or disables the search functionality in the `ColumnChooser` dialog.
     *
     * @type {boolean}
     * @default true
     */
    enableSearch?: boolean;

    /**
     * Specifies the search operator for filtering columns.
     *
     * @type {'startsWith' | 'endsWith' | 'contains' | 'equal' | 'notEqual'}
     * @default 'startsWith'
     */
    operator?: 'startsWith' | 'endsWith' | 'contains' | 'equal' | 'notEqual';

    /**
     * Enables diacritics-insensitive searching in the `ColumnChooser`.
     *
     * @type {boolean}
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies the sort direction for columns in the `ColumnChooser` dialog.
     *
     * @type {'None' | 'Ascending' | 'Descending'}
     * @default 'None'
     */
    sortDirection?: 'None' | 'Ascending' | 'Descending';

    /**
     * Specifies an ordered list of column fields to display in the `ColumnChooser`.
     *
     * @type {string[]}
     * @default []
     */
    selectedColumns?: string[];

    /**
     * When true, prevents the `ColumnChooser` dialog from opening.
     *
     * @type {boolean}
     * @default false
     */
    cancel?: boolean;
}

/**
 * Event raised when column changes are applied in the `ColumnChooser` dialog.
 *
 * Fired when the user confirms changes (Apply/OK). Provides the final
 * chooser settings and a visibility map for all columns.
 */
export interface ColumnChooserApplyEvent extends GridActionEvent {
    /**
     * Specifies when Immediate mode visibility changes are committed.
     *
     * @type {'deferred' | 'immediate'}
     * @default 'deferred'
     */
    mode?: 'deferred' | 'immediate';

    /**
     * Specifies the debounce delay for Immediate mode visibility changes in milliseconds.
     *
     * @type {number}
     * @default 1500
     */
    immediateModeDelay?: number;

    /**
     * Enables or disables the search functionality in the `ColumnChooser` dialog.
     *
     * @type {boolean}
     * @default true
     */
    enableSearch?: boolean;

    /**
     * Specifies the search operator for filtering columns.
     *
     * @type {'startsWith' | 'endsWith' | 'contains' | 'equal' | 'notEqual'}
     * @default 'startsWith'
     */
    operator?: 'startsWith' | 'endsWith' | 'contains' | 'equal' | 'notEqual';

    /**
     * Enables diacritics-insensitive searching in the `ColumnChooser`.
     *
     * @type {boolean}
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies the sort direction for columns in the `ColumnChooser` dialog.
     *
     * @type {'None' | 'Ascending' | 'Descending'}
     * @default 'None'
     */
    sortDirection?: 'None' | 'Ascending' | 'Descending';

    /**
     * Specifies the ordered list of column fields with their final visibility state after apply.
     *
     * @type {string[]}
     * @default []
     */
    selectedColumns?: string[];

    /**
     * Map of column field names to visibility states for all columns in the dialog.
     *
     * @type {Map<string, boolean>}
     */
    columnVisibility?: Map<string, boolean>;
}

/**
 * Represents information about a specific row and cell in the grid.
 * Used for identifying row/cell context during events and operations.
 */
export interface RowInfo<T = unknown> {
    /**
     * Represents the element of a cell within a grid row.
     *
     * This element provides access to the cell's DOM properties and methods.
     *
     * @default null
     */
    cell?: Element;

    /**
     * Specifies the zero-based index of the cell within its parent row.
     *
     * Used for identifying the cell's position in the row.
     *
     * @default null
     */
    columnIndex?: number;

    /**
     * Represents the element of the row within the grid.
     *
     * This element provides access to the row's DOM properties and methods.
     *
     * @default null
     */
    row?: Element;

    /**
     * Specifies the zero-based index of the row within the grid.
     *
     * Used for identifying the row's position in the grid.
     *
     * @default null
     */
    rowIndex?: number;

    /**
     * Specifies the zero-based index of the virtual row within the grid.
     *
     * Used for identifying the aria virtual row's position in the grid.
     *
     * @private
     * @default null
     */
    ariaRowIndex?: number;

    /**
     * Specifies the zero-based index of the virtual cell within the grid.
     *
     * Used for identifying the aria virtual cell's position in the grid.
     *
     * @private
     * @default null
     */
    ariaColIndex?: number;

    /**
     * Contains the data object associated with the row.
     *
     * This object holds the row's data, which can be used for rendering or processing.
     *
     * @default null
     */
    data?: T;

    /**
     * Provides configuration for the column associated with the cell.
     *
     * Such as column name, formatting rules and more.
     *
     * @default null
     */
    column?: ColumnProps;
}

/**
 * Interface for Data Grid component reference containing all imperative methods and properties.
 * Provides access to grid instance methods and current state information.
 *
 * @private
 */
export interface GridRef<T = unknown> extends Omit<RenderRef<T>, 'refresh'>, IGrid<T>, MutableGridBase<T> {
    /**
     * Reference to the grid's clipboard module state.
     *
     * @private
     */
    clipboardModule?: Clipboard;

    /**
     * Reference to the grid's root DOM element.
     *
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Pins one or more rows to the specified section.
     *
     * @param {T[]} rows - Row data objects to pin.
     * @param {'top' | 'bottom'} position - Pinned section.
     * @returns {Promise<void>}
     */
    pinRows(rows: T[], position?: 'top' | 'bottom'): void;

    /**
     * Removes one or more rows from the pinned section.
     *
     * @param {T[]} rows - Row data objects to unpin.
     * @returns {void}
     */
    unpinRows(rows: T[]): void;

    /**
     * Pins a column (identified by its `field`) to the requested side. Only
     * available when `PinningModule` is present in the `modules` prop.
     *
     * @param {string} field - Field name of the column to pin.
     * @param {ColumnPinDirection.Left | ColumnPinDirection.Right | string} direction - Pin side
     * (static enum or its `'Left' | 'Right'` string alias).
     * @returns {void}
     */
    pinColumn(field: string, direction: ColumnPinDirection.Left | ColumnPinDirection.Right | string): void;

    /**
     * Removes the pin from a column (collapses its direction to `None`). Only
     * available when `PinningModule` is present in the `modules` prop.
     *
     * @param {string} field - Field name of the column to unpin.
     * @returns {void}
     */
    unpinColumn(field: string): void;

    /**
     * Current view data available in the grid.
     *
     * @default []
     */
    currentViewData?: T[];

    /**
     * Gets the current view records
     *
     * @returns {Object[]} The current records
     */
    getCurrentViewRecords(): T[];

    /**
     * Resizes the specified columns to the supplied widths.
     * Accepts a required array of `ResizeColumn` entries (`field` + `width`) and applies each width after clamping to the column's `minWidth`/`maxWidth` constraints.
     *
     * @param {ResizeColumn[]} columns - List of columns to resize with their target widths in pixels.
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * gridRef.current?.resizeColumns([
     *   { field: 'id', width: 100 },
     *   { field: 'name', width: 200 }
     * ]);
     * ```
     */
    resizeColumns(columns: ResizeColumn[]): void;

    /**
     * Auto-fits columns to their widest header and/or content cell (based on the supplied or grid-level `autoFit` mode), clamped to `minWidth`/`maxWidth`.
     * Accepts an optional array of `AutoFitColumn` entries; when omitted, auto-fits every visible column.
     *
     * @param {AutoFitColumn[]} [columns] - Optional list of columns to auto-fit. When omitted, processes every visible column with a defined `field`.
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Auto-fit all visible columns
     * gridRef.current?.autoFitColumns();
     *
     * // Auto-fit specific columns
     * gridRef.current?.autoFitColumns([
     *   { field: 'name' },
     *   { field: 'email', autoFit: AutoFitMode.Header }
     * ]);
     * ```
     */
    autoFitColumns(columns?: AutoFitColumn[]): void;

    /**
     * Reorders the column at `fromIndex` to `toIndex`.
     *
     * @param {number} fromIndex - Index of the column to move.
     * @param {number} toIndex - Target index.
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * gridRef.current?.reorderColumnByIndex(0, 2);
     * ```
     */
    reorderColumnByIndex(fromIndex: number, toIndex: number): Promise<void>;

    /**
     * Reorders the column(s) whose `field` matches `fieldName` to `toIndex`.
     *
     * @param {string | string[]} fieldName - Single field name or array of field names identifying the column(s) to move.
     * @param {number} toIndex - Target index.
     * @returns {Promise<void>}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Move a single column by field name
     * gridRef.current?.reorderColumns('OrderID', 2);
     *
     * // Move multiple columns in a single call
     * gridRef.current?.reorderColumns(['CustomerID', 'Freight'], 3);
     * ```
     */
    reorderColumns(fieldName: string | string[], toIndex: number): Promise<void>;

    /**
     * Defines the selected row indexes.
     *
     * @default []
     */
    selectedRowIndexes?: number[];

    /**
     * Whether the grid is currently in edit mode.
     *
     * @default false
     */
    isEdit?: boolean;

    /**
     * Index of the row being edited.
     *
     * @default -
     */
    editRowIndex?: number;

    /**
     * Data of the row being edited.
     *
     * @default null
     */
    editData?: T | null;

    /**
     * Reference to the cell selection module for programmatic cell selection operations.
     * Provides access to cell selection methods when cell selection is enabled.
     * Only available when selectionSettings.type is 'Cell'.
     *
     * @default undefined
     */
    cellSelectionModule?: CellSelectionModel;

    /**
     * Reference to the cell fill module for programmatic autofill operations.
     * Enables methods such as fillSelectedToRange and clearFillRange.
     *
     * @default undefined
     */
    autoFillModule?: AutoFill;

    /**
     * @private
     */
    getGroupCaptionAggregateType?: () => Map<string, string[]>;
}


export interface GridModules<T = unknown> {
    /**
     * Injects the Columns sidebar tool-panel shell.
     */
    ColumnToolPanelModule?: SideBarToolPanelModule<T>;

    /**
     * Injects the Filters sidebar tool-panel shell.
     */
    FilterToolPanelModule?: SideBarToolPanelModule<T>;

    /**
     * Injects the selection-aware editing sidebar tool panel.
     */
    EditToolPanelModule?: SideBarToolPanelModule<T>;

    /**
     * Injects clipboard functionality into the Grid.
     * Enables copy, paste, and cut operations.
     *
     * @example
     * ```tsx
     * modules={{ ClipboardModule }}
     * ```
     */
    ClipboardModule?: ClipboardModuleType<T>;

    /**
     * Injects column resizing functionality into the Grid.
     * Enables users to resize columns by dragging column headers.
     *
     * @example
     * ```tsx
     * modules={{ ResizeModule }}
     * ```
     */
    ResizeModule?: ResizeModuleType<T>;

    /**
     * Injects column reordering functionality into the Grid.
     *
     * @example
     * ```tsx
     * modules={{ ReorderModule }}
     * ```
     */
    ReorderModule?: ReorderModuleType<T>;

    /**
     * Injects column auto-fitting functionality into the Grid.
     * Enables automatic adjustment of column widths based on header and/or content dimensions.
     *
     * @example
     * ```tsx
     * modules={{ AutoFitModule }}
     * ```
     */
    AutoFitModule?: AutoFitModuleType<T>;

    /**
     * Injects autofill functionality into the Grid.
     * Enables fill-handle rendering and cell fill operations.
     *
     * @example
     * ```tsx
     * modules={{ AutoFillModule }}
     * ```
     */
    AutoFillModule?: AutoFillModuleType<T>;

    /**
     * Injects master-detail row functionality into the Grid.
     * Enables rendering of detail rows and nested detail grids.
     *
     * @example
     * ```tsx
     * modules={{ DetailGridModule }}
     * ```
     */
    DetailGridModule?: DetailGridModuleType;
    FilterModule?: (
        gridRef?: RefObject<GridRef<unknown>>,
        filterSetting?: FilterSettings,
        setGridAction?: (action: FilterEvent | Record<string, unknown>) => void,
        serviceLocator?: ServiceLocator,
        setCurrentPage?: Dispatch<SetStateAction<number>>,
        virtualSettings?: VirtualSettings,
        scrollMode?: ScrollMode
    ) => filterModule;
    EditModule?: <T>(
        _gridRef: RefObject<GridRef<T>>,
        serviceLocator: ServiceLocator,
        columns: ColumnProps<T>[],
        currentViewData: (GroupedData<T> | T)[],
        dataOperations: UseDataResult<T>,
        focusModule: FocusStrategyResult,
        selectionModule: selectionModule<T>,
        editSettings: EditSettings<T>,
        setGridAction: Dispatch<SetStateAction<Object>>,
        setCurrentPage: Dispatch<SetStateAction<number>>,
        setResponseData: Dispatch<SetStateAction<Object>>,
        commandColumnModule: UseCommandColumnResult<T>,
        virtualSettings: VirtualSettings,
        pinningModule: PinningModuleResult<T>,
        batchEditStagedRowsRef?: RefObject<Map<string | number, StagedRowData<T>>>,
        undoRedoModule?: UseUndoRedoResult
    ) => UseEditResult<T>;
    PagerModule?: () => pagerModule;
    GroupModule?: <T = unknown>(
        _gridRef?: RefObject<GridRef<T>>,
        groupSettingsProp?: GroupSettings,
        setGridAction?: (action: OnGroupArgs & { requestType: ActionType }) => void,
        setCurrentViewData?: Dispatch<SetStateAction<GroupedData<T>[]>>,
        currentViewData?: (GroupedData<T> | T)[],
        setVirtualCachedViewData?: Dispatch<SetStateAction<Map<number, (T | GroupedData<T>)>>>,
        virtualizationSettings?: VirtualizationSettings,
        loadedPageWiseGroupExpandedCountRef?: RefObject<Map<number, number>>,
        loadedPageWiseVirtualGroupStartEndRowIndexes?: RefObject<Map<number, {
            startIndex: number;
            endIndex: number;
        }>>,
        pageWiseGroupResponseViewData?: Map<number, GroupedData<T>[]>,
        totalRecordCount?: number,
        gridProps?: Partial<IGridBase<T>>,
        setCurrentPage?: Dispatch<SetStateAction<number>>,
        uiColumns?: RefObject<ColumnProps<T>[]>,
        setColumnChooserState?: Dispatch<SetStateAction<object>>,
        groupSummary?: GroupSummary | GroupSummaryPosition,
        groupCaptionAggregateType?: Map<string, string[]>
    ) => UseGroupResult<T>;
    TreeDataModule?: (
        _gridRef?: RefObject<GridRef<T>>,
        setCurrentViewData?: Dispatch<SetStateAction<(TreeGridRow | T[])>>,
        data?: TreeGridRow[] | T[],
        settings?: TreeDataSettings,
        pageSettings?: PageSettings,
        filterSettings?: FilterSettings,
        sortSettings?: SortSettings,
        searchSettings?: SearchSettings,
        setTotalRecordsCount?: Dispatch<SetStateAction<number>>,
        currentPage?: number,
        isOffline?: boolean
    ) => UseTreeDataResult;
    ToolbarModule?: (
        config: ToolbarConfig,
        editModule?: editModule,
        selectionModule?: SelectionModel,
        currentViewData?: unknown[],
        allowSearching?: boolean,
        commandColumnModule?: UseCommandColumnResult,
        selectionSettings?: SelectionSettings,
        showColumnChooser?: boolean,
        virtualSettings?: VirtualSettings,
        totalRecordsCount?: number,
        gridRef?: RefObject<GridRef>
    ) => ToolbarAPI;
    ContextMenuModule?: () => contextMenuModule;
    ColumnChooserModule?: () => columnChooserModule;
    SearchModule?: (
        gridRef?: RefObject<GridRef<unknown>>,
        searchSetting?: SearchSettings,
        setGridAction?: (action: SearchEvent) => void,
        setCurrentPage?: Dispatch<SetStateAction<number>>,
        virtualSettings?: VirtualSettings,
        scrollMode?: ScrollMode
    ) => SearchAPI;
    CommandColumnModule?: <T>(isCommandColumnEnabled?: boolean) => UseCommandColumnResult<T>;
    AggregateModule?: <T>(
        props: Partial<IGridBase<T>>,
        gridRef?: RefObject<GridRef<T>>,
        directiveAggregates?: ReactElement
    ) => aggregateModule;
    GridAllModules?: Omit<GridModules<T>, 'GridAllModules'>;

    /**
     * Injects row pinning functionality into the Grid.
     * Enables row pin and unpin operations.
     *
     * @example
     * ```tsx
     * modules={{ PinningModule }}
     * ```
     */
    PinningModule?: PinningModuleType<T>;
    /**
     * Injects pivot calculation and field configuration controls into the Grid.
     * Registers the pivot view responsible for relational result calculation,
     * report-field configuration, member filtering and pivot result presentation.
     *
     * @default undefined
     * @example
     * ```tsx
     * import { Grid } from '@syncfusion/react-grid';
     * import { PivotModule } from '@syncfusion/react-grid';
     *
     * <Grid
     *   dataSource={salesData}
     *   modules={{ PivotModule }}
     *   pivotSettings={{
     *     enabled: true,
     *     rows: ['country'],
     *     values: [{ field: 'sales', type: 'Sum' }]
     *   }}
     * />
     * ```
     */
    PivotModule?: PivotModuleType;
    /**
     * Injects spreadsheet-style formula evaluation and formula-cell editing support.
     *
     * @example
     * ```tsx
     * modules={{ FormulaModule }}
     * formulaSettings={{ enabled: true }}
     * ```
     */
    FormulaModule?: FormulaModuleType<T>;
}

export interface RowNumberSettings {
    /**
     * Enables the display of sequential row numbers in a dedicated grid column.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid rowNumberSettings={{ enabled: true }} />
     * ```
     */
    enabled?: boolean;
}

/**
 * @private
 */
export interface GridProps<T = unknown> extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onError'> {
    /**
     * Fires before a Grid-level undo request is applied.
     *
     * @event onUndoStart
     */
    onUndoStart?: (event: UndoStartEvent) => void;

    /**
     * Fires after a Grid-level undo request completes.
     *
     * @event onUndoComplete
     */
    onUndoComplete?: (event: UndoCompleteEvent) => void;

    /**
     * Fires before a Grid-level redo request is applied.
     *
     * @event onRedoStart
     */
    onRedoStart?: (event: RedoStartEvent) => void;

    /**
     * Fires after a Grid-level redo request completes.
     *
     * @event onRedoComplete
     */
    onRedoComplete?: (event: RedoCompleteEvent) => void;

    /**
     * Configures the optional grid sidebar and its tool panels.
     *
     * @default undefined
     */
    sideBar?: SideBar<T>;

    /**
     * Specifies a unique identifier for the grid component.
     * Provides a distinct ID for the grid instance, enabling targeted interactions, styling, or accessibility features.
     * Used to differentiate multiple grid instances within the same application or DOM.
     *
     * @default React.useId()
     * @example
     * ```tsx
     * <Grid
     *   id="employee-grid"
     *   dataSource={employees}
     *   columns={columns}
     * />
     * ```
     */
    id?: string;

    /**
     * Indicates whether the grid is a child grid within a master-detail relationship.
     * When true, the grid is treated as a detail grid and may inherit certain behaviors or styles from its parent.
     *
     * @private
     * @default false
     * @example
     *
     * ```tsx
     * <Grid
     *   isChildrenGrid={true}
     *   dataSource={detailData}
     *   columns={detailColumns}
     * />
     * ```
     */
    isChildrenGrid?: boolean;

    /**
     * Supplies the data to be displayed in the grid.
     *
     * The data source can be provided as:
     * * An array of JavaScript objects
     * * A `DataManager` instance for local/remote data operations
     * * A `DataResponse` object with processed data
     *
     * The grid will automatically bind to this data and render rows based on the provided records.
     *
     * @default []
     *
     * @example
     * ```tsx
     * import React from 'react';
     * import { Grid } from '@company/react-grid';
     *
     * const GridExample: React.FC = () => {
     *   // Local data array
     *   const employees = [
     *     { id: 1, name: 'John Doe', role: 'Developer', salary: 75000 },
     *     { id: 2, name: 'Jane Smith', role: 'Designer', salary: 65000 },
     *   ];
     *
     *   return (
     *     <Grid
     *       dataSource={employees}
     *     />
     *   );
     * };
     * ```
     */
    dataSource?: T[] | DataManager | DataResponse;

    /**
     * Defines the columns to be displayed in the grid.
     *
     * An array of ColumnProps objects that specify how each column in the grid should be configured.
     * This includes properties like `field`, `headerText`, `width`, `format`, and more.
     * The order of columns in the array determines their display order in the grid.
     *
     * @default []
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={[
     *     { field: 'id', headerText: 'ID', width: 100, textAlign: 'Right' },
     *     { field: 'name', headerText: 'Employee Name', width: 200 },
     *     { field: 'role', headerText: 'Role', width: 150 },
     *     {
     *       field: 'salary',
     *       headerText: 'Salary',
     *       width: 150,
     *       format: 'C2',
     *       textAlign: 'Right'
     *     }
     *   ]}
     * />
     * ```
     */
    columns?: ColumnProps[];

    /**
     * Sets the height of the grid component.
     *
     * Controls the vertical size of the grid. Can be specified as:
     * * A number (interpreted as pixels).
     * * A string with CSS units (e.g., '500px', '100%').
     * * `auto` to adjust to content.
     *
     * When a fixed height is set, scrollbars appear automatically when content exceeds the height.
     *
     * @default 'auto'
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   height={400}
     * />
     * ```
     */
    height?: number | string;

    /**
     * Specifies row indices that should be expanded by default when the grid loads.
     * Applies only when the master-detail feature enabled using `isMasterDetail={true}` in the grid props.
     * Rows at these indices automatically display their detail templates on initial render.
     *
     * @default []
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   isMasterDetail={true}
     *   defaultExpandedRows={[2, 4]}
     *   detailRowTemplate={(params) => (
     *     <div>Detail content for row {params.rowIndex}</div>
     *   )}
     * />
     * ```
     */
    defaultExpandedRows?: number[];

    /**
     * Sets the width of the grid component.
     *
     * Controls the horizontal size of the grid. Can be specified as:
     * * A number (interpreted as pixels).
     * * A string with CSS units (e.g., '800px', '100%').
     * * `auto` to adjust to parent container.
     *
     * When a fixed width is set, horizontal scrollbars appear automatically when content exceeds the width.
     *
     * @default 'auto'
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   width={900}
     * />
     * ```
     */
    width?: number | string;

    /**
     * Configures the visibility of grid lines between cells.
     *
     * Determines which grid lines are displayed in the grid. Available options are:
     * * `Default`: Shows horizontal lines only.
     * * `None`: Displays no grid lines.
     * * `Both`: Shows both horizontal and vertical grid lines.
     * * `Horizontal`: Shows horizontal lines only.
     * * `Vertical`: Shows vertical lines only.
     *
     * @default 'Default'
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   gridLines="Both"
     * />
     * ```
     */
    gridLines?: GridLine | string;

    /**
     * Enables automatic row and column span behavior for grid cells.
     * When set to true, adjacent cells with matching values automatically merge using both row and column spanning.
     * When set to false, automatic spanning is disabled and only explicit numeric span values are applied.
     * Cells must have `rowSpan={true}` or `colSpan={true}` to participate in automatic spanning.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   enableAutoSpan={true}
     * />
     * ```
     */
    enableAutoSpan?: boolean;

    /**
     * Controls whether hover effect is applied to grid rows.
     *
     * By default, rows are visually highlighted on pointer hover.
     * When set to false, rows retain a static appearance regardless of pointer hover movement.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   enableHover={true}
     * />
     * ```
     */
    enableHover?: boolean;

    /**
     * Enables development-specific diagnostics for the grid component.
     * When set to true, the grid outputs additional console warnings, validation messages,
     * and debugging information to assist in identifying configuration issues and improving integration.
     * When set to false, these development diagnostics are suppressed to reduce console noise
     * and minimize runtime overhead.
     * This is a non-reactive property and applies only during initial render.
     *
     * @default true
     *
     * @example
     * ```tsx
     * const isDev: boolean = process.env.NODE_ENV === 'development';
     * <Grid
     *   dataSource={data}
     *   columns={columns}
     *   enableDevMode={isDev ? true : false}
     * />
     * ```
     */
    enableDevMode?: boolean;

    /**
     * Configures the display of sequential row numbers in the grid.
     *
     * @default { enabled: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   rowNumberSettings={{ enabled: true }}
     * />
     * ```
     */
    rowNumberSettings?: RowNumberSettings;

    /**
     * Controls whether keyboard navigation is enabled for the Data Grid.
     *
     * By default, navigation and interaction with grid elements can be performed using keyboard shortcuts and arrow keys.
     * When set to false, the grid's default focus navigation behavior is disabled.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   allowKeyboard={true}
     * />
     * ```
     */
    allowKeyboard?: boolean;

    /**
     * Defines the cell content's overflow mode. The available modes are:
     * * `Clip` -  Truncates the cell content when it overflows its area.
     * * `Ellipsis` -  Displays ellipsis when the cell content overflows its area.
     * * `EllipsisWithTooltip` - Applies an ellipsis to overflowing cell content and displays a tooltip on hover for enhanced readability.
     *
     * @default ClipMode.Ellipsis | 'Ellipsis'
     */
    clipMode?: ClipMode | string;

    /**
     * Enables chart options in the context menu.
     *
     * @default false
     */
    enableGridChart?: boolean;

    /**
     * Defines the default auto-fit scope applied to columns that omit a per-column `autoFit` value.
     * Determines which cells the auto-fit measurement considers: `AutoFitMode.Header` (header only), `AutoFitMode.Content` (content only), or `AutoFitMode.All` (widest of both).
     *
     * @default null
     * @example
     * ```tsx
     * <Grid autoFit={AutoFitMode.All} />
     * ```
     */
    autoFit?: AutoFitMode;

    /**
     * Determines whether the `sf-alt-row` CSS class is added to alternate rows in the Data Grid.
     *
     * When set to true, the grid adds the `sf-alt-row` class to alternate row elements.
     * This supports alternating row styles, which can improve readability in data-dense layouts.
     * The grid does not apply any default styling for this class. Styling must be defined externally.
     *
     * When set to false, the grid does not add the `sf-alt-row` class to any row.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <GridComponent
     *   dataSource={employees}
     *   columns={columns}
     *   enableAltRow={true}
     * />
     *
     * // External CSS
     * .sf-alt-row {
     *   background-color: #f5f5f5;
     * }
     * ```
     */
    enableAltRow?: boolean;

    /**
     * Configures row drag-and-drop between grid instances.
     *
     * @default { enabled: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   dragAndDropSettings={{
     *     enabled: true,
     *     targetID: 'destination-grid'
     *   }}
     * />
     * ```
     */
    dragAndDropSettings?: DragAndDropSettings;

    /**
     * Enables right-to-left (RTL) direction for the grid.
     *
     * When set to true, the grid's layout changes to support right-to-left languages like Arabic.
     * This includes reversing the direction of UI elements, text alignment, and scrollbars.
     *
     * @private
     * @default false
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   enableRtl={true}
     * />
     * ```
     */
    enableRtl?: boolean;

    /**
     * Configures the grid's selection settings, determines whether `Single` or `Multiple` selections are allowed.
     * Used to customize the selection experience for user interactions.
     *
     * @default { enabled: true, mode: 'Single', enableToggle: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   selectionSettings={{
     *     enabled: true,
     *     type: 'Row',
     *     mode: 'Multiple'
     *   }}
     * />
     * ```
     */
    selectionSettings?: SelectionSettings;

    /**
     * Enables cell fill (autofill) behavior when selection and editing are active.
     * Allows dragging selected cells to fill adjacent cells with repeated or sequential values.
     *
     * @default undefined
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={data}
     *   columns={columns}
     *   editSettings={{ allowEdit: true }}
     *   selectionSettings={{ type: 'Cell' }}
     *   autoFillSettings={{ isEnabled: true }}
     * />
     * ```
     */
    autoFillSettings?: AutoFillSettings;

    /**
     * Fires when a cell fill operation begins.
     *
     * @event onCellFillStart
     * @param {CellFillStartedEvent} args - Fill start event arguments
     * @returns {void}
     */
    onCellFillStart?: (args: CellFillStartedEvent) => void;

    /**
     * Fires when a cell fill operation completes.
     *
     * @event onCellFillComplete
     * @param {CellFillCompletedEvent<T>} args - Fill complete event arguments
     * @returns {void}
     */
    onCellFillComplete?: (args: CellFillCompletedEvent<T>) => void;

    /**
     * Configures clipboard copy and paste functionality for the grid.
     * Enables or disables copy/paste operations on selected cells or rows.
     *
     * @default { enabled: true }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   clipboardSettings={{ enabled: true }}
     * />
     * ```
     */
    clipboardSettings?: ClipboardSettings;

    /**
     * Defines the feature modules to be injected into the Grid.
     * Injecting modules enables optional functionality and improves tree-shaking by
     * including only the required features in the application bundle.
     *
     * To enable clipboard operations such as copy, paste, cut, and copy with headers,
     * inject the `ClipboardModule`.
     *
     * @default {}
     *
     * @example
     * ```tsx
     * import { Grid, ClipboardModule } from '@syncfusion/react-grid';
     *
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   modules={{ ClipboardModule }}
     * />
     * ```
     */
    modules?: GridModules<T>;

    /**
     * Configures spreadsheet-style formula processing for explicitly enabled columns.
     *
     * @default { enabled: false }
     */
    formulaSettings?: FormulaSettings;

    /**
     * Callback to determine whether a row is selectable and how its checkbox renders.
     *
     * @template T - Row data type
     * @param rowData - The data object for the row being evaluated
     * @returns true (row selectable) or false (row non-selectable with disabled checkbox shown),
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   isRowSelectable={(row) => row.status !== 'Rejected'}
     * />
     * ```
     */
    isRowSelectable?: IsRowSelectable<T>;

    /**
     * Specifies the sorting configuration for the grid, includes options to enable/disable sorting and controlling how data is ordered.
     * Used to customize sorting behavior for data presentation and user interactions.
     *
     * @default { columns: [], allowUnsort: true, enabled: false, mode: 'Multiple' }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   sortSettings={{
     *     enabled: true,
     *     columns: [
     *       { field: 'salary', direction: 'Descending' },
     *       { field: 'name', direction: 'Ascending' }
     *     ],
     *     allowUnsort: true
     *   }}
     * />
     * ```
     */
    sortSettings?: SortSettings;

    /**
     * Specifies the grouping configuration for the grid, enabling hierarchical data organization by column values.
     * Controls group expansion, drag-drop UI, caption formatting, and visibility of grouped columns.
     * Used to organize data into collapsible groups for improved readability and analysis.
     *
     * @default { enabled: false, columns: [], defaultExpanded: false, captionFormat: 'compact', showDropArea: false, showGroupedColumn: false, showUngroupButton: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={orders}
     *   columns={columns}
     *   groupSettings={{
     *     enabled: true,
     *     columns: ['ShipCountry', 'CustomerID'],
     *     defaultExpanded: true,
     *     showDropArea: true,
     *     captionFormat: 'verbose'
     *   }}
     * />
     * ```
     */
    groupSettings?: GroupSettings;

    /**
     * Enable tree mode for hierarchical data display.
     * When enabled, uses individual tree props for configuration instead of treeDataSettings object.
     * Provides a simplified root-level API for tree grid functionality.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employeeData}
     *   isTreeMode={true}
     *   treeColumnIndex={1}
     *   treeDataIdMapping="id"
     *   treeDataParentIdField="managerId"
     * />
     * ```
     */
    isTreeMode?: boolean;

    /**
     * Column index where tree expand/collapse UI should render.
     * Specifies which column displays the expand/collapse buttons and indentation.
     * Used when `isTreeMode` is enabled.
     *
     * @default 0
     *
     * @example
     * ```tsx
     * <Grid isTreeMode={true} treeColumnIndex={1} />
     * ```
     */
    treeColumnIndex?: number;

    /**
     * Field name containing children array for nested tree data mode.
     * Expects an array field at the specified field name containing child objects.
     * Used when `isTreeMode` is enabled.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Grid isTreeMode={true} treeDataChildrenField="teams" />
     * ```
     */
    treeDataChildrenField?: string;

    /**
     * Unique identifier field name for parent ID tree mode.
     * Used in conjunction with `treeDataParentIdField` to establish parent-child relationships.
     * Used when `isTreeMode` is enabled.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Grid isTreeMode={true} treeDataIdMapping="id" treeDataParentIdField="managerId" />
     * ```
     */
    treeDataIdMapping?: string;

    /**
     * Parent identifier field name for parent ID tree mode.
     * References the parent node using the value from `treeDataIdMapping` field.
     * Root nodes have null or undefined values in this field.
     * Used when `isTreeMode` is enabled.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Grid isTreeMode={true} treeDataIdMapping="id" treeDataParentIdField="managerId" />
     * ```
     */
    treeDataParentIdField?: string;

    /**
     * Excludes child nodes from filtered tree results when a parent row matches the active filter.
     * Useful when filtering a tree should keep only matching parent rows and hide descendant rows unless they individually match.
     * Used when `isTreeMode` is enabled.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   isTreeMode={true}
     *   treeDataChildrenField="children"
     *   excludeChildrenWithFiltering={true}
     * />
     * ```
     */
    excludeChildrenWithFiltering?: boolean;
    /**
     * Specifies the filtering configuration for the grid, controlling the filter UI and behavior.
     * Includes options to enable/disable filtering, set the filter UI type, define custom operators, and configure case or accent sensitivity.
     * Used to tailor the filtering experience to match application requirements and data types.
     *
     * @default { enabled: false, columns: [], type: 'FilterBar', mode: 'Immediate', immediateModeDelay: 1500, ignoreAccent: false, operators: null, caseSensitive: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   filterSettings={{
     *     enabled: true,
     *     type: 'FilterBar',
     *     ignoreAccent: true,
     *     caseSensitive: false
     *   }}
     * />
     * ```
     */
    filterSettings?: FilterSettings;

    /**
     * Specifies the search configuration for the grid, controlling how data is searched.
     * Defines settings for enabling the search bar, specifying searchable fields, initial search terms, operators, and case/accent sensitivity.
     * Used to customize the search experience for filtering grid data.
     *
     * @default { enabled: false, fields: [], value: undefined, operator: 'contains', caseSensitive: true, ignoreAccent: false }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   searchSettings={{
     *     enabled: true,
     *     fields: ['name', 'role'],
     *     caseSensitive: true,
     *     operator: 'contains',
     *     key: 'dev'
     *   }}
     * />
     * ```
     */
    searchSettings?: SearchSettings;

    /**
     * Configures the column resize feature at grid scope.
     * Controls the resize handle rendering, drag and keyboard resize interactions, distribution mode, keyboard step, and throttle interval.
     *
     * @default { enabled: false, mode: ResizeMode.Auto, throttle: 150, resizeKeyboardStep: 10 }
     * @example
     * ```tsx
     * <Grid resizeSettings={{ enabled: false, mode: ResizeMode.Normal }} />
     * ```
     */
    resizeSettings?: ResizeSettings;

    /**
     * Configures the column reorder feature at grid scope.
     *
     * @default { enabled: false }
     * @example
     * ```tsx
     * <Grid reorderSettings={{ enabled: true }} />
     * ```
     */
    reorderSettings?: ReorderSettings;

    /**
     * Specifies the pagination configuration for the grid, controlling how data is divided and navigated.
     * Includes options to enable/disable pagination, set the number of records per page, define the number of navigation links, and select the initial page.
     * Used to tailor the pagination UI and behavior for efficient data handling.
     *
     * @default { enabled: false, currentPage: 1, pageSize: 12, pageCount: 8 }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   pageSettings={{
     *     enabled: true,
     *     pageSize: 10,
     *     pageCount: 5,
     *   }}
     * />
     * ```
     */
    pageSettings?: PageSettings;

    /**
     * Controls HTML sanitization for grid content.
     *
     * When set to true, the grid will sanitize any suspected untrusted HTML content before rendering it.
     * This helps prevent cross-site scripting (XSS) attacks by removing or neutralizing potentially malicious scripts and HTML.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   enableHtmlSanitizer={true}
     * />
     * ```
     */
    enableHtmlSanitizer?: boolean;

    /**
     * Makes the grid header remain visible during scrolling.
     *
     * When enabled, column headers will "sticky" to the top of the viewport and remain visible even when the user scrolls down through the grid data.
     * This improves usability by keeping column headers in view at all times.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   height={400}
     *   enableStickyHeader={true}
     * />
     * ```
     */
    enableStickyHeader?: boolean;

    /**
     * Specifies the text wrapping configuration for the grid, controlling how text is displayed.
     * Defines the wrap mode to determine which grid sections (header, content, or both) apply text wrapping.
     * Used to customize text display for readability and layout optimization.
     *
     * @default { enabled: false, wrapMode: 'Both' }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   textWrapSettings={{
     *     enabled: true,
     *     wrapMode: 'Content'
     *   }}
     * />
     * ```
     */
    textWrapSettings?: TextWrapSettings;

    /**
     * Specifies the height for all rows in the grid.
     *
     * * When a numeric value is provided, all rows will have a fixed height in pixels.
     * * If `rowHeight` is `undefined` and row DOM virtualization is enabled, the height defaults to the `theme` property based value (e.g., `Theme.Material` = 50).
     * * When `null` (default), row height is automatically calculated based on content and applied styles for grids without row DOM virtualization.
     *
     * @default null | 50
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   rowHeight={40}
     * />
     * ```
     */
    rowHeight?: number;

    /**
     * Gets the height of a specific row dynamically at runtime.
     * Accepts a callback function that returns the height in pixels based on row information, allowing row-specific height customization.
     * This property enables dynamic row sizing based on content, data values, or other custom logic.
     *
     * @param props - Partial row information used to calculate the row height, including row index, data, and column configuration.
     * @returns number - Height of the row in pixels.
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   getRowHeight={(props) => props.data?.OrderID === 10248 ? 60 : 40}
     * />
     * ```
     */
    getRowHeight?: (props: Partial<RowInfo<T | GroupedData<T>>>) => number;

    /**
     * Specifies the theme configuration for the Data Grid component.
     * Used internally to determine default values for theme-dependent properties (e.g., row height in virtualization).
     *
     * The theme property defines static default values and calculations used during grid initialization and rendering,
     * such as the default `rowHeight` value when row DOM virtualization is enabled.
     *
     * Grid styling and visual appearance are controlled by importing the corresponding theme CSS files,
     * not by the `theme` property alone. The `theme` property must be coordinated with the appropriate CSS import.
     *
     * @default Theme.Material
     *
     * @example
     * ```tsx
     * // Import Material theme CSS for styling
     * import '@syncfusion/react-grids/styles/material.css';
     *
     * // Specify theme for internal default calculations
     * <Grid theme={Theme.Material} />
     * ```
     */
    theme?: Theme;

    /**
     * Configures virtualization behavior for grid rendering.
     * Includes options for enabling virtualization, defining DOM type, and customizing buffer and scroll settings.
     *
     * @default {
     *   enabled: true,
     *   type: VirtualDomType.Both,
     *   viewPortBuffer: { rows: 5, columns: 5 },
     *   scrollMode: ScrollMode.Auto,
     *   preventMaxRenderedRows: false
     * }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   virtualizationSettings={{
     *     enabled: true,
     *     type: VirtualDomType.Row,
     *     viewPortBuffer: { rows: 10, columns: 5 }
     *   }}
     * />
     * ```
     */
    virtualizationSettings?: VirtualizationSettings;

    /**
     * Child components for the grid.
     *
     * Allows rendering of child elements within the grid component structure.
     *
     * @default null
     * @private
     */
    children?: ReactElement<IRowBase> | ReactElement<IRowBase>[] | ReactNode;

    /**
     * Service for value formatting
     *
     * @private
     */
    valueFormatterService?: IValueFormatter;

    /**
     * Service locator for dependency injection
     *
     * @private
     */
    serviceLocator?: ServiceLocator;

    /**
     * Localization object
     *
     * @private
     */
    localeObj?: IL10n;

    /**
     * Sets the localization language for the grid.
     *
     * Determines the language used for all text in the grid interface, including built-in messages, button labels, and other UI text.
     * The grid must have the corresponding locale definitions loaded to use a specific locale.
     *
     * @private
     * @default 'en-US'
     */
    locale?: string;

    /**
     * Defines a query to execute against the data source.
     *
     * Allows you to apply a predefined `Query` object to the data source, which can include filtering, sorting, paging, and other data operations.
     * This is especially useful when working with remote data sources or when you need complex data operations.
     *
     * @default new Query()
     *
     * @example
     * ```tsx
     * import { Query } from '@company/data';
     *
     * const GridExample: React.FC = () => {
     *   // Create a query to filter and sort data
     *   const query = new Query()
     *     .where('salary', 'greaterThan', 50000)
     *     .sortBy('name', 'ascending');
     *
     *   return (
     *     <Grid
     *       dataSource={employees}
     *       columns={columns}
     *       query={query}
     *     />
     *   );
     * };
     * ```
     */
    query?: Query;

    /**
     * Template for displaying content when the grid has no records.
     *
     * Customizes what is displayed when the grid has no data to show. This can be provided as a string, React element, or a function that returns content.
     * It provides better user experience by explaining why the grid is empty or suggesting actions to take.
     *
     * @default null
     *
     * @example
     * ```tsx
     * const GridExample: React.FC = () => {
     *   // Custom template as a React element
     *   const emptyTemplate = (
     *     <div className="empty-grid-message">
     *       <img src="/assets/empty-state.svg" alt="No data" />
     *       <h3>No employees found</h3>
     *       <p>Try adjusting your search or filters, or add a new employee.</p>
     *       <button className="btn btn-primary">Add Employee</button>
     *     </div>
     *   );
     *
     *   return (
     *     <Grid
     *       dataSource={[]}
     *       columns={columns}
     *       emptyRecordTemplate={emptyTemplate}
     *     />
     *   );
     * };
     * ```
     */
    emptyRecordTemplate?: ComponentType<void> | ReactElement | string;

    /**
     * Specifies a custom template for rendering rows in the grid.
     *
     * Allows complete customization of row rendering by providing a template that replaces the default row structure.
     * This can be a string template, React element, or function that returns the row content.
     *
     * @default null
     *
     * @example
     * ```tsx
     * const CustomRowTemplate = (props: Employee) => {
     *   return (
     *     <tr>
     *       <td colSpan={3}>
     *         <div className="custom-row">
     *           <h4>{props.name}</h4>
     *           <p>Role: {props.role} | Salary: {props.salary}</p>
     *         </div>
     *       </td>
     *     </tr>
     *   );
     * };
     *
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   rowTemplate={CustomRowTemplate}
     * />
     * ```
     */
    rowTemplate?: ComponentType<T> | ReactElement | string;

    /**
     * Configures summary rows with aggregate functions.
     *
     * The aggregates property allows you to add summary rows to the grid, such as totals, averages, or counts.
     * Each aggregate row can contain multiple aggregations that apply functions like `sum`, `average`, `min`, `max`, or `count` to specific columns.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   aggregates={[
     *     {
     *       columns: [
     *         {
     *           field: 'salary',
     *           type: 'Sum',
     *           format: 'C2',
     *           footerTemplate: 'Total Salary: ${Sum}'
     *         },
     *         {
     *           field: 'id',
     *           type: 'Count',
     *           footerTemplate: 'Total Employees: ${Count}'
     *         }
     *       ]
     *     }
     *   ]}
     * />
     * ```
     */
    aggregates?: AggregateRowProps[];

    /**
     * Configures the editing behavior of the Data Grid.
     *
     * The editSettings property enables and controls editing functionality.
     * It defines which editing operations are permitted, such as adding, editing, and deleting rows,
     * and specifies the editing mode to be used.
     *
     * @default { allowAdd: false, allowEdit: false, allowDelete: false, mode: 'Normal', editOnDoubleClick: true, confirmOnEdit: true, confirmOnDelete: false, newRowPosition: 'Top' }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   editSettings={{
     *     allowAdd: true,
     *     allowEdit: true,
     *     allowDelete: true,
     *     mode: 'Inline',
     *     confirmOnDelete: true
     *   }}
     * />
     * ```
     */
    editSettings?: EditSettings;

    /**
     * Enable master-detail (expandable rows) feature for this grid.
     * When enabled, all data rows become expandable master rows.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   isMasterDetail={true}
     *   detailRowHeight={400}
     *   detailRowTemplate={(params) => (
     *     <div style={{ padding: '20px' }}>
     *       <h4>Order {params.rowIndex} Details</h4>
     *       <Grid
     *         dataSource={getDetailData(params.row.id)}
     *         columns={detailColumns}
     *       />
     *     </div>
     *   )}
     * />
     * ```
     */
    isMasterDetail?: boolean;

    /**
     * Defines the height of the detail row.
     * By default, the detail row height is set to "300px".
     * A custom height can be applied when the master‑detail feature is enabled `isMasterDetail={true}` in the grid props.
     *
     * @default 300
     *
     * @example
     * ```tsx
     * <Grid isMasterDetail detailRowHeight={400} />
     * ```
     */
    detailRowHeight?: number;

    /**
     * Template for rendering the content of a detail row.
     * Invoked for each expanded master row, providing its row data.
     * Commonly used to render a nested Grid or other custom components.
     *
     * @type {DetailRowTemplate<T>}
     *
     * @example
     * ```tsx
     * <Grid
     *   isMasterDetail
     *   detailRowTemplate={(params) => (
     *     <div style={{ padding: '20px' }}>
     *       <h4>Order {params.rowIndex} Details</h4>
     *       <Grid
     *         dataSource={detailData[params.row.id]}
     *         columns={detailColumns}
     *       />
     *     </div>
     *   )}
     * />
     * ```
     */
    detailRowTemplate?: DetailRowTemplate<T> | ReactElement | string;

    /**
     * Configuration and callbacks for auto-rendering nested detail grids.
     * Enables hierarchical data display with callback-driven data binding.
     * When provided with `isMasterDetail={true}`, automatically renders nested grids
     * for expanded rows based on the specified `childDataPath`.
     *
     * @optional
     * @default undefined
     *
     * @template T - The row data type
     *
     * @example
     * ```tsx
     * <Grid
     *   isMasterDetail={true}
     *   detailCellRendererParams={{
     *     detailGridOptions: {
     *       columns: childColumns,
     *       height: 250,
     *     },
     *     getDetailRowData: (params) => {
     *       // Provide child data via callback
     *       params.successCallback(params.data.orderLines);
     *     },
     *     onDetailGridCreate: (context) => {
     *       console.log(`Detail grid created at depth ${context.nestingDepth}`);
     *     },
     *   }}
     *   childDataPath="orderLines"
     *   maxNestingDepth={3}
     * />
     * ```
     *
     * @remarks
     * - Requires `isMasterDetail={true}` to be enabled
     * - Works in conjunction with `childDataPath` and `maxNestingDepth` props
     * - Supports both synchronous and asynchronous data binding via callback
     * - Cannot be used simultaneously with `detailRowTemplate` (this takes precedence)
     */
    detailCellRendererParams?: DetailCellRendererParams<T>;

    /**
     * Path to child data in the parent row object.
     * Specifies which property contains the array of child rows for nested detail grids.
     * Used in conjunction with `detailCellRendererParams` for auto-rendering.
     *
     * @optional
     * @default undefined
     *
     * @example
     * ```tsx
     * // String notation (for simple property access)
     * childDataPath="orderLines"
     *
     * // Dot notation for nested properties
     * childDataPath="metadata.children"
     * ```
     *
     * @remarks
     * - Accepts string notation for property path (e.g., "address.details")
     * - If specified without `detailCellRendererParams`, child data is displayed in default format
     * - Used by `getDetailRowData` callback to extract and identify child data
     * - Ignored if `detailRowTemplate` is specified (uses old API)
     */
    childDataPath?: string;

    /**
     * Maximum nesting depth for recursive detail grids.
     * Prevents infinite recursion when child grids also have nested children.
     * Once `nestingDepth >= maxNestingDepth`, detail grids cannot have further nested grids.
     *
     * @optional
     * @default 3
     *
     * @example
     * ```tsx
     * // Allow: Master → Level1 → Level2 (3 levels total)
     * maxNestingDepth={2}
     *
     * // Allow: Master → Level1 → Level2 → Level3 (4 levels total)
     * maxNestingDepth={3}
     * ```
     *
     * @remarks
     * - Must be a positive integer (> 0)
     * - Default is 3, suitable for most hierarchical data structures
     * - Prevents memory issues with deeply nested data
     * - Check `canNestDeeper` from `useDetailGrid` hook to enforce limit
     * - Depth counting starts at 0 for first-level detail grids
     */
    maxNestingDepth?: number;

    /**
     * Current nesting level in grid hierarchy (internal use).
     * Automatically set by recursive DetailCellRenderer rendering.
     * Used to track depth and enforce maxNestingDepth limit in nested grids.
     * Level 0 = Master grid, Level 1 = First detail grid, Level 2 = Second detail grid, etc.
     *
     * @optional
     * @default 0
     * @internal
     *
     * @remarks
     * - This prop is for internal use only and should not be set by end users
     * - Automatically incremented by DetailCellRenderer for each nesting level
     * - Used by DetailCellRenderer to prevent exceeding maxNestingDepth
     * - Should not be modified directly in user code
     */
    currentNestingDepth?: number;

    /**
     * Fires when a master row is expanded.
     *
     * @private
     * @event onRowExpand
     * ```tsx
     * <Grid
     *   isMasterDetail
     *   onRowExpand={(args) => {
     *     console.log('Row expanded:', args.rowIndex);
     *   }}
     * />
     * ```
     */
    onRowExpand?: (event: RowExpandEvent<T>) => void;

    /**
     * Fires when a master row is collapsed.
     *
     * @private
     * @event onRowCollapse
     * ```tsx
     * <Grid
     *   isMasterDetail
     *   onRowCollapse={(args) => {
     *     console.log('Row collapsed:', args.rowIndex);
     *   }}
     * />
     * ```
     */
    onRowCollapse?: (event: RowCollapseEvent<T>) => void;


    /**
     * Configures the grid toolbar with predefined or custom items.
     *
     * The toolbar property allows you to add a toolbar to the grid with both predefined actions (add, edit, delete, update, cancel, search)
     * and custom items. Custom items can include text, template content, and click handlers.
     *
     * @default null
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel', 'Search']}
     *   editSettings={{
     *     allowAdd: true,
     *     allowEdit: true,
     *     allowDelete: true
     *   }}
     * />
     * ```
     */
    toolbar?: Array<(string | ToolbarItems | ToolbarItemProps)>;

    /**
     * Determines whether the column chooser functionality is enabled.
     * When set to false (default), the column chooser button will be disabled in the toolbar (but still visible if included in toolbar array).
     * When set to true, the column chooser button will be enabled and the dialog can be opened.
     *
     * This property controls the enabled/disabled state of the column chooser feature, not its visibility.
     * To show the column chooser button, you must include 'ColumnChooser' in the toolbar array.
     *
     * @default false
     *
     * @example
     * ```tsx
     * // Column Chooser button is visible but disabled (default behavior)
     * <Grid
     *   dataSource={data}
     *   toolbar={['Add', 'Edit', 'ColumnChooser']}
     * />
     *
     * // Column Chooser button is visible and enabled
     * <Grid
     *   dataSource={data}
     *   toolbar={['Add', 'Edit', 'ColumnChooser']}
     *   showColumnChooser={true}
     * />
     * ```
     */
    showColumnChooser?: boolean;

    /**
     * Defines the configuration for the Column Chooser dialog,
     * controlling both its behavior and appearance. Enables customization of:
     *
     * - Search with customizable operators
     * - Diacritics‑insensitive search
     * - Column ordering and sorting
     * - Custom templates for header, footer, and column items
     *
     * @default { enableSearch: true, operator: 'startsWith', ignoreAccent: false, sortDirection: 'None', selectedColumns: [] }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={data}
     *   toolbar={['ColumnChooser']}
     *   showColumnChooser={true}
     *   columnChooserSettings={{
     *     enableSearch: true,
     *     operator: 'contains',
     *     ignoreAccent: true,
     *     sortDirection: 'Ascending',
     *     selectedColumns: ['OrderID', 'CustomerName']
     *   }}
     * />
     * ```
     */
    columnChooserSettings?: ColumnChooserSettings;

    /**
     * Settings for the inline column menu displayed inside header cells.
     * When `enabled` is true, a small per-column menu trigger will render in the header cell.
     */
    columnMenuSettings?: ColumnMenuSettings;

    /**
     * Fires when the column menu is opened for a specific header column.
     * Provides the menu items and the target column for customization or cancellation.
     *
     * @event onColumnMenuOpen
     * @param {ColumnMenuOpenEvent} event - Event payload containing the column and available actions.
     * @returns {ColumnMenuOpenEvent | Promise<ColumnMenuOpenEvent>} The updated event or a Promise resolving to it.
     */
    onColumnMenuOpen?: (event: ColumnMenuOpenEvent) => void | ColumnMenuOpenEvent | Promise<ColumnMenuOpenEvent>;

    /**
     * Fires when the column menu is closed.
     * Useful for resetting UI state after the menu finishes interacting.
     *
     * @event onColumnMenuClose
     * @param {ColumnMenuCloseEvent} event - Event payload containing the closed column.
     * @returns {void}
     */
    onColumnMenuClose?: (event: ColumnMenuCloseEvent) => void;

    /**
     * Fires when a column menu item is selected.
     * Provides the item identifier and the target column for custom logic.
     *
     * @event onColumnMenuClick
     * @param {ColumnMenuClickEvent} event - Event payload containing the clicked item and column.
     * @returns {void}
     */
    onColumnMenuClick?: (event: ColumnMenuClickEvent) => void;

    /**
     * Applies a CSS class to each grid row either globally or conditionally.
     * Accepts a static class name or a callback function that returns a class name based on row context.
     *
     * The callback receives a `RowClassProps` object with the following properties:
     * * `rowType` – Identifies the structural role of the row: `Header`, `Content`, or `Aggregate`. Useful for styling header, data, or summary rows.
     * * `rowIndex` – The zero-based index of the row.
     * * `data` – The full data object for the row, enabling conditional styling based on field values.
     *
     * @param props - Optional event payload containing row type, row index, and complete row data.
     * @returns A CSS class name to apply to the row.
     *
     * @default -
     *
     * @example
     * const GridComponent = () => {
     *   const handleRowClass = (props?: RowClassProps): string => {
     *     if (props?.rowType === RowType.Header) return 'Header-row';
     *     if (props?.rowType === RowType.Aggregate) return 'summary-row';
     *     return '';
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={data}
     *       rowClass={handleRowClass}
     *     />
     *   );
     * };
     */
    rowClass?: string | ((props?: RowClassProps<T>) => string);

    /**
     * Configures loading indicator settings for the Data Grid component.
     * Applies spinner or skeleton customization during data operations.
     *
     * @default
     * {
     *   indicatorType: LoadingIndicatorType.Spinner,
     *   params: {
     *     visible: true,
     *     thickness: '3px',
     *     animationDuration: '1s',
     *     overlay: true,
     *     size: '36px',
     *     color: Color.Primary
     *   }
     * }
     *
     * @example
     * ```tsx
     * <Grid loadingIndicatorSettings={{
     *   indicatorType: LoadingIndicatorType.Spinner,
     *   params: { size: '48px', color: '#0078D4' }
     * }} />
     * ```
     */
    loadingIndicatorSettings?: LoadingIndicatorSettings;

    /**
     * Configures the context menu settings for the Data Grid component.
     * Enables and customizes the context menu that appears on right‑click interactions.
     * Provides options to:
     *
     * - Enable or disable the context menu
     * - Define default or custom menu items
     *
     * @default { enabled: false, items: [], menuSettings: {} }
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   contextMenuSettings={{
     *     enabled: true,
     *     items: ['Edit', 'Delete', 'SortAscending', 'SortDescending']
     *   }}
     * />
     * ```
     */
    contextMenuSettings?: ContextMenuSettings;

    /**
     * Fires when the context menu is about to be opened or displayed on the grid.
     * Allows customization, validation, or cancellation of the context menu before it appears.
     * Provides access to the target element, menu items, and associated row/column data.
     *
     * Supports both synchronous and asynchronous menu item loading:
     * - **Synchronous**: Return the modified ContextMenuOpenEvent object.
     * - **Asynchronous**: Return a Promise that resolves to the modified ContextMenuOpenEvent object.
     *
     * @event onContextMenuOpen
     * @param {ContextMenuOpenEvent} event - Event arguments containing menu configuration, target element, and row/column context.
     * @returns {ContextMenuOpenEvent | Promise<ContextMenuOpenEvent>} The modified event object or a Promise resolving to the modified event object.
     *
     * @example
     * ```tsx
     * // Synchronous example
     * const handleContextMenuOpen = (event: ContextMenuOpenEvent) => {
     *   // Customize menu items based on context
     *   if (event.data?.role === 'Admin') {
     *     // Show additional menu items for admin users
     *   }
     *   return event; // Return the modified event
     * };
     *
     * // Asynchronous example
     * const handleContextMenuOpen = (args: ContextMenuOpenEvent) => {
     *   return new Promise<ContextMenuOpenEvent>((res) => setTimeout(() => res(args), 2000));
     * }
     *
     * return (
     *   <Grid
     *     dataSource={employees}
     *     columns={columns}
     *     contextMenuSettings={{ enabled: true }}
     *     onContextMenuOpen={handleContextMenuOpen}
     *   />
     * );
     * ```
     */
    onContextMenuOpen?: (event: ContextMenuOpenEvent) => ContextMenuOpenEvent | Promise<ContextMenuOpenEvent>;

    /**
     * Fires when the context menu is closed or hidden on the grid.
     * Suitable for cleanup operations or resetting UI state after the context menu interaction completes.
     * Triggered when the user dismisses the menu through selection, clicking outside, or pressing Escape.
     *
     * @event onContextMenuClose
     * @returns {void}
     *
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleContextMenuClose = () => {
     *     // Perform cleanup or reset UI state
     *     console.log('Context menu closed');
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employees}
     *       columns={columns}
     *       contextMenuSettings={{ enabled: true }}
     *       onContextMenuClose={handleContextMenuClose}
     *     />
     *   );
     * };
     * ```
     */
    onContextMenuClose?: () => void;

    /**
     * Fires when a context menu item is selected or clicked by the user.
     * Handles the action associated with the selected menu item, such as `Edit`, `Delete`, `Sort`, etc.
     * Provides context about the selected item, target row/column, and triggering element.
     *
     * @event onContextMenuClick
     * @param {ContextMenuClickEvent} event - Event arguments containing selected item details and grid context.
     * @returns {void}
     *
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleContextMenuClick = (event: ContextMenuClickEvent) => {
     *     // Handle the selected context menu action
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employees}
     *       columns={columns}
     *       contextMenuSettings={{ enabled: true }}
     *       onContextMenuClick={handleContextMenuClick}
     *     />
     *   );
     * };
     * ```
     */
    onContextMenuClick?: (event: ContextMenuClickEvent) => void;

    /**
     * Fires at the start of grid initialization before data processing. and component mount.
     * This event is triggered during the React render phase, before the component is mounted to the DOM.
     * Useful for initial configurations or showing loading indicators.
     * Do not perform state updates in this callback, as they will trigger React warnings
     * about updating unmounted components. Use `onGridRenderComplete` instead for state updates.
     *
     * @event onGridRenderStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleGridRenderStart = () => {
     *     // Safe: Logging only - no state updates
     *     console.log('Grid render starting');
     *   };
     *
     *   const handleGridRenderComplete = () => {
     *     // Safe: State updates after mount (use this callback for state updates)
     *     setGridReady(true);
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={data}
     *       onGridRenderStart={handleGridRenderStart}
     *       onGridRenderComplete={handleGridRenderComplete}
     *     />
     *   );
     * };
     * ```
     */
    onGridRenderStart?: () => void;

    /**
     * Fires after the grid is fully initialized and rendered in the DOM.
     * Ideal for DOM-related operations or interacting with the grid.
     *
     * @private
     * @event onGridInit
     */
    onGridInit?: () => void;

    /**
     * Fires after data is received but before binding to the grid.
     * Allows data modification or filtering before rendering.
     *
     * @private
     * @event onDataLoadStart
     */
    onDataLoadStart?: (event: DataLoadStartEvent | DataReturnType) => void;

    /**
     * Fires after data is successfully bound to the grid.
     * Suitable for actions requiring fully loaded data.
     *
     * @event onDataLoad
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleDataLoaded = () => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <div id="loadingIndicator">Loading...</div>
     *       <Grid
     *         dataSource={data}
     *         onDataLoad={handleDataLoaded}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onDataLoad?: () => void;

    /**
     * Fired when the grid is fully loaded and ready for user interaction.
     * Suitable for actions requiring only on grid initially fully loaded data.
     *
     * @event onGridRenderComplete
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleGridReady = () => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <div id="loadingIndicator">Loading...</div>
     *       <Grid
     *         dataSource={data}
     *         onGridRenderComplete={handleGridReady}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onGridRenderComplete?: () => void;

    /**
     * Fires for each header cell during grid rendering.
     * Enables customization of header cell appearance or content.
     *
     * @private
     * @event onHeaderCellRender
     */
    onHeaderCellRender?: (event: HeaderCellRenderEvent) => void;

    /**
     * Fires for each aggregate cell during grid rendering.
     * Allows customization of aggregate cell appearance or content.
     *
     * @private
     * @event onAggregateCellRender
     */
    onAggregateCellRender?: (event: AggregateCellRenderEvent<T>) => void;

    /**
     * Fires for each data cell during grid rendering.
     * Enables customization of data cell appearance or content.
     *
     * @private
     * @event onCellRender
     */
    onCellRender?: (event: CellRenderEvent<T>) => void;

    /**
     * Fires for each row when bound with data.
     * Allows customization of row appearance or behavior.
     *
     * @private
     * @event onRowRender
     */
    onRowRender?: (event: RowRenderEvent<T>) => void;

    /**
     * Fires for each aggregate row when bound with data.
     * Enables customization of aggregate row appearance or behavior.
     *
     * @private
     * @event onAggregateRowRender
     */
    onAggregateRowRender?: (event: AggregateRowRenderEvent<T>) => void;

    /**
     * Fires when grid operations like sorting or filtering fail.
     * Provides error details for handling and user feedback.
     *
     * @event onError
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleActionFailure = (event: Error) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onError={handleActionFailure}
     *     />
     *   );
     * };
     * ```
     */
    onError?: (event: Error) => void;

    /**
     * Fires when grid refresh.
     *
     * @private
     */
    onRefreshStart?: (event: Object) => void;

    /**
     * Fired when the grid data is refreshed or updated.
     *
     * @event onRefresh
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleGridRefresh = () => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onRefresh={handleGridRefresh}
     *     />
     *   );
     * };
     * ```
     */
    onRefresh?: () => void;

    /**
     * Fires when grid data state changes due to sorting or paging.
     * Monitors and responds to changes in grid state.
     *
     * @event onDataRequest
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const [currentState, setCurrentState] = useState({});
     *   const handleDataStateRequest = (event: DataRequestEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={data}
     *       onDataRequest={handleDataStateRequest}
     *       sortSettings={{enabled: true}}
     *     />
     *   );
     * };
     * ```
     */
    onDataRequest?: (event: DataRequestEvent) => void;

    /**
     * Fires when the grid's data source is changed.
     * Monitors and responds to updates in the grid's data source.
     *
     * @event onDataChangeRequest
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const [currentData, setCurrentData] = useState([]);
     *   const handleDataChangeRequest = (event: DataChangeRequestEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={currentData}
     *       onDataChangeRequest={handleDataChangeRequest}
     *       sortSettings={{enabled: true}}
     *     />
     *   );
     * };
     * ```
     */
    onDataChangeRequest?: (event: DataChangeRequestEvent<T>) => void;

    /**
     * Fires when the grid component is destroyed.
     *
     * @private
     * @event onGridDestroy
     */
    onGridDestroy?: () => void;

    /**
     * Fires when a filtering operation begins on the grid.
     * Allows customization or cancellation of filter behavior.
     *
     * @private
     * @event onFilterStart
     */
    onFilterStart?: (event: FilterEvent) => void;

    /**
     * Fires after a filtering operation completes on the grid.
     * Provides filter state details for post-filter actions.
     *
     * @event onFilter
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleFilterEnd = (event: FilterEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onFilter={handleFilterEnd}
     *       filterSettings={{ enabled: true }}
     *     />
     *   );
     * };
     * ```
     */
    onFilter?: (event: FilterEvent) => void;

    /**
     * Fires before the filter Dialog is displayed or opened.
     * Allows customization or cancellation before the filter interface appears.
     *
     * @private
     * @event onFilterDialogBeforeOpen
     */
    onFilterDialogBeforeOpen?: (event: FilterDialogBeforeOpenEvent) => void;

    /**
     * Fires after the filter Dialog is fully displayed and ready for interaction.
     * Suitable for initializing custom filter components or DOM manipulation.
     *
     * @event onFilterDialogAfterOpen
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleFilterDialogOpen = (event: FilterDialogAfterOpenEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onFilterDialogAfterOpen={handleFilterUIOpen}
     *       filterSettings={{ enabled: true,  }}
     *     />
     *   );
     * };
     * ```
     */
    onFilterDialogAfterOpen?: (event: FilterDialogAfterOpenEvent) => void;

    /**
     * Fires before the Column Chooser dialog is displayed or opened.
     * Allows customization of column visibility or cancellation before the dialog appears.
     *
     * @event onColumnChooserBeforeOpen
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleColumnChooserBeforeOpen = (event: ColumnChooserBeforeOpenEvent) => {
     *     // handle your action here
     *     if (someCondition) {
     *       event.cancel = true; // prevent dialog from opening
     *     }
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onColumnChooserBeforeOpen={handleColumnChooserBeforeOpen}
     *       showColumnChooser={true}
     *     />
     *   );
     * };
     * ```
     */
    onColumnChooserBeforeOpen?: (event: ColumnChooserBeforeOpenEvent) => void;

    /**
     * Fires when column changes are applied in the Column Chooser dialog.
     * Triggered when the user clicks OK/Apply button with the final column visibility configuration.
     * Used to track which columns were shown/hidden and perform post-apply actions.
     *
     * @event onColumnChooserApply
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleColumnChooserApply = (event: ColumnChooserApplyEvent) => {
     *     // handle column visibility changes
     *     console.log('Columns:', event.selectedColumns);
     *     console.log('Visibility:', event.columnVisibility);
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employeeData}
     *       onColumnChooserApply={handleColumnChooserApply}
     *       showColumnChooser={true}
     *     />
     *   );
     * };
     * ```
     */
    onColumnChooserApply?: (event: ColumnChooserApplyEvent) => void;

    /**
     * Fires when a sorting operation begins on the grid.
     * Allows customization or cancellation of sort behavior.
     *
     * @private
     * @event onSortStart
     */
    onSortStart?: (event: SortEvent) => void;

    /**
     * Fires after a sorting operation completes on the grid.
     * Provides sort state details for post-sort actions.
     *
     * @event onSort
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleSortEnd = (event: SortEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={productData}
     *       onSort={handleSortEnd}
     *       sortSettings={{enabled: true}}
     *     />
     *   );
     * };
     * ```
     */
    onSort?: (event: SortEvent) => void;

    /**
     * Fires when a grouping operation begins on the grid.
     * Allows customization or cancellation of group behavior.
     *
     * @private
     * @event onGroupStart
     */
    onGroupStart?: (args: OnGroupArgs) => void;

    /**
     * Fires when a grouping operation occurs on the grid.
     * Triggered by add/remove column, expand/collapse, or reorder group operations.
     * Provides current grouped columns and operation type for custom handling.
     *
     * @event onGroup
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleGroup = (args: OnGroupArgs) => {
     *     console.log(`Operation: ${args.operation}, Columns: ${args.columns.join(', ')}`);
     *   };
     *   const [groupSettings] = useState<GroupSettings>({ enabled: true, showDropArea: true });
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onGroup={handleGroup}
     *       groupSettings={groupSettings}
     *     />
     *   );
     * };
     * ```
     */
    onGroup?: (args: OnGroupArgs) => void;

    /**
     * Fires before a group is expanded or collapsed.
     * Allows validation or cancellation of group expand/collapse behavior.
     *
     * @event shouldExpandGroup
     */
    shouldExpandGroup?: (event: ShouldExpandGroupEvent) => boolean;

    /**
     * Fires when a searching operation begins on the grid.
     * Allows customization or addition of search conditions.
     *
     * @private
     * @event onSearchStart
     */
    onSearchStart?: (event: SearchEvent) => void;

    /**
     * Fires after a searching operation completes on the grid.
     * Provides search result details for post-search actions.
     *
     * @event onSearch
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleSearchEnd = (event: SearchEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <Grid
     *         dataSource={productData}
     *         onSearch={handleSearchEnd}
     *         toolbar={['Search']}
     *         searchSettings={{ enabled: true }}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onSearch?: (event: SearchEvent) => void;

    /**
     * Fires when a column resize interaction begins.
     * Triggered on pointer-down of the resize handle, keyboard focus activation, or the start of a programmatic resize/auto-fit.
     *
     * @event onColumnResizeStart
     * @param {ColumnResizeStartEvent} event - Event arguments containing the target column, current width, and a cancelable flag.
     * @returns {void}
     * @example
     * ```tsx
     * const handleResizeStart = (event: ColumnResizeStartEvent) => {
     *   if (event.column.field === 'id') {
     *     event.cancel = true;
     *   }
     * };
     *
     * return <Grid onColumnResizeStart={handleResizeStart} />;
     * ```
     */
    onColumnResizeStart?: (event: ColumnResizeStartEvent) => void;

    /**
     * Fires as the column width changes during an active resize interaction.
     * Triggered continuously while the user drags the resize handle, steps with the keyboard, or when a programmatic resize/auto-fit updates a column.
     *
     * @event onColumnResize
     * @param {ColumnResizeEvent} event - Event arguments containing the target column and the new width in pixels.
     * @returns {void}
     * @example
     * ```tsx
     * const handleResize = (event: ColumnResizeEvent) => {
     *   console.log(event.column.field, event.width);
     * };
     *
     * return <Grid onColumnResize={handleResize} />;
     * ```
     */
    onColumnResize?: (event: ColumnResizeEvent) => void;

    /**
     * Fires when a column resize interaction ends.
     * Triggered on pointer-up of the resize handle, end of a keyboard resize step, or completion of a programmatic resize/auto-fit on each updated column.
     *
     * @event onColumnResizeEnd
     * @param {ColumnResizeEndEvent} event - Event arguments containing the target column and the final width in pixels.
     * @returns {void}
     * @example
     * ```tsx
     * const handleResizeEnd = (event: ColumnResizeEndEvent) => {
     *   console.log('Final width:', event.column.field, event.width);
     * };
     *
     * return <Grid onColumnResizeEnd={handleResizeEnd} />;
     * ```
     */
    onColumnResizeEnd?: (event: ColumnResizeEndEvent) => void;

    /**
     * Fires when a column reorder interaction begins.
     *
     * @event onColumnReorderStart
     * @param {ColumnReorderStartEvent<T>} event - Event arguments containing the targeted column, `fromIndex`, initial `toIndex`, and a cancelable flag.
     * @returns {void}
     * @example
     * ```tsx
     * const handleReorderStart = (event: ColumnReorderStartEvent) => {
     *   if (event.column.field === 'OrderID') {
     *     event.cancel = true;
     *   }
     * };
     *
     * return <Grid onColumnReorderStart={handleReorderStart} />;
     * ```
     */
    onColumnReorderStart?: (event: ColumnReorderStartEvent<T>) => void;

    /**
     * Fires while a column reorder drag is in progress.
     *
     * @event onColumnDrag
     * @param {ColumnReorderEvent<T>} event - Event arguments containing the targeted column, `fromIndex`, and current `toIndex`.
     * @returns {void}
     * @example
     * ```tsx
     * const handleColumnDrag = (event: ColumnReorderEvent) => {
     *   console.log('Dragging', event.column.field, 'from', event.fromIndex, 'to', event.toIndex);
     * };
     *
     * return <Grid onColumnDrag={handleColumnDrag} />;
     * ```
     */
    onColumnDrag?: (event: ColumnReorderEvent<T>) => void;

    /**
     * Fires when a column reorder interaction ends.
     *
     * @event onColumnReorderEnd
     * @param {ColumnReorderEndEvent<T>} event - Event arguments containing the targeted column, `fromIndex`, final `toIndex`, and a cancelable flag.
     * @returns {void}
     * @example
     * ```tsx
     * const handleReorderEnd = (event: ColumnReorderEndEvent) => {
     *   console.log('Reordered', event.column.field, 'from', event.fromIndex, 'to', event.toIndex);
     * };
     *
     * return <Grid onColumnReorderEnd={handleReorderEnd} />;
     * ```
     */
    onColumnReorderEnd?: (event: ColumnReorderEndEvent<T>) => void;

    /**
     * Fires when a grid row is clicked.
     * Provides details about the clicked row for custom actions.
     *
     * @event onRowDoubleClick
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleRowDoubleClick = (event: RecordDoubleClickEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <Grid
     *         dataSource={customerData}
     *         onRowDoubleClick={handleRowDoubleClick}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onRowDoubleClick?: (event: RecordDoubleClickEvent<T>) => void;

    /**
     * Fires when a toolbar item is clicked.
     * Enables custom actions for toolbar buttons.
     *
     * @event onToolbarItemClick
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleToolbarClick = (event: ClickEventArgs) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={productData}
     *       onToolbarItemClick={handleToolbarClick}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel', 'Print']}
     *     >
     *       <Toolbar />
     *     </Grid>
     *   );
     * };
     * ```
     */
    onToolbarItemClick?: (event: ToolbarClickEvent) => void;

    /**
     * Fires when a grid cell gains focus.
     * Provides details about the focused cell.
     *
     * @event onCellFocus
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellFocused = (event: CellFocusEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={productData}
     *       onCellFocus={handleCellFocused}
     *     />
     *   );
     * };
     * ```
     */
    onCellFocus?: (event: CellFocusEvent<T>) => void;

    /**
     * Fires when a grid cell is clicked.
     * Provides details about the clicked cell.
     *
     * @event onCellClick
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellClick = (event: CellFocusEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <Grid
     *         dataSource={orderData}
     *         onCellClick={handleCellClick}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onCellClick?: (event: CellFocusEvent<T>) => void;

    /**
     * Fires before a grid cell gains focus.
     * Allows validation or modification of focus behavior.
     *
     * @private
     * @event onCellFocusStart
     */
    onCellFocusStart?: (event: CellFocusEvent<T>) => void;

    /**
     * Fires before a row is selected.
     * Allows validation or cancellation of row selection.
     *
     * @private
     * @event onRowSelecting
     */
    onRowSelecting?: (event: RowSelectingEvent<T>) => void;

    /**
     * Fires after a row is successfully selected.
     * Provides details about the selected row.
     *
     * @event onRowSelect
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleRowSelected = (event: RowSelectEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div className="app-container">
     *       <Grid
     *         dataSource={customerData}
     *         onRowSelect={handleRowSelected}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onRowSelect?: (event: RowSelectEvent<T>) => void;

    /**
     * Fires when a data row drag operation starts.
     *
     * @event onRowDragStart
     * @param {RowDragEventArgs<T>} args - Dragged rows and source index.
     * @returns {void}
     */
    onRowDragStart?: (args: RowDragEventArgs<T>) => void;

    /**
     * Fires while a data row drag operation is in progress.
     *
     * @event onRowDrag
     * @param {RowDragEventArgs<T>} args - Dragged rows and current target index.
     * @returns {void}
     */
    onRowDrag?: (args: RowDragEventArgs<T>) => void;

    /**
     * Fires when a data row drag operation ends.
     *
     * @event onRowDrop
     * @param {RowDragEventArgs<T>} args - Dragged rows and final target index.
     * @returns {void}
     */
    onRowDrop?: (args: RowDragEventArgs<T>) => void;

    /**
     * Fires before a row is deselected.
     * Allows validation or cancellation of row deselection.
     *
     * @private
     * @event onRowDeselecting
     */
    onRowDeselecting?: (event: RowSelectingEvent<T>) => void;

    /**
     * Fires after a row is successfully deselected.
     * Provides details about the deselected row.
     *
     * @event onRowDeselect
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleRowDeselected = (event: RowSelectEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <Grid
     *         dataSource={itemData}
     *         onRowDeselect={handleRowDeselected}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onRowDeselect?: (event: RowSelectEvent<T>) => void;

    /**
     * Fires before cells are selected in the grid.
     * Allows validation or cancellation of cell selection.
     * Only fires when selectionSettings.type is `Cell`.
     *
     * @private
     * @event onCellSelecting
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellSelecting = (event: CellSelectingEvent) => {
     *     // Prevent selection of specific cells
     *     if (event.cells.some(cell => cell.rowIndex === 0)) {
     *       event.cancel = true;
     *     }
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onCellSelecting={handleCellSelecting}
     *       selectionSettings={{ type: 'Cell', cellSelection: { enabled: true } }}
     *     />
     *   );
     * };
     * ```
     */
    onCellSelecting?: (event: CellSelectingEvent<T>) => void;

    /**
     * Fires after cells are successfully selected in the grid.
     * Provides details about the selected cells including data and positions.
     * Only fires when selectionSettings.type is 'Cell'.
     *
     * @event onCellSelect
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellSelect = (event: CellSelectEvent) => {
     *     console.log('Selected cells:', event.cells);
     *     console.log('Cell data:', event.data);
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onCellSelect={handleCellSelect}
     *       selectionSettings={{ type: 'Cell', cellSelection: { enabled: true } }}
     *     />
     *   );
     * };
     * ```
     */
    onCellSelect?: (event: CellSelectEvent<T>) => void;

    /**
     * Fires before cells are deselected in the grid.
     * Allows validation or cancellation of cell deselection.
     * Only fires when selectionSettings.type is `Cell`.
     *
     * @private
     * @event onCellDeselecting
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellDeselecting = (event: CellDeselectingEvent) => {
     *     // Prevent deselection of specific cells
     *     if (event.cells.length > 5) {
     *       event.cancel = true;
     *     }
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onCellDeselecting={handleCellDeselecting}
     *       selectionSettings={{ type: 'Cell', cellSelection: { enabled: true } }}
     *     />
     *   );
     * };
     * ```
     */
    onCellDeselecting?: (event: CellDeselectingEvent<T>) => void;

    /**
     * Fires after cells are successfully deselected in the grid.
     * Provides details about the deselected cells.
     * Only fires when selectionSettings.type is 'Cell'.
     *
     * @event onCellDeselect
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellDeselect = (event: CellDeselectEvent) => {
     *     console.log('Deselected cells:', event.cells);
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onCellDeselect={handleCellDeselect}
     *       selectionSettings={{ type: 'Cell', cellSelection: { enabled: true } }}
     *     />
     *   );
     * };
     * ```
     */
    onCellDeselect?: (event: CellDeselectEvent<T>) => void;

    /**
     * Event triggered before the paging operation start.
     *
     * @private
     * @event onPageChangeStart
     */
    onPageChangeStart?: (event: PageEvent) => void;

    /**
     * Event triggered after a paging operation is completed on the grid.
     *
     * @event onPageChange
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handlePageChangeEnd = (event: PageEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <div>
     *       <Grid
     *         dataSource={itemData}
     *         onPageChange={handlePageChangeEnd}
     *       />
     *     </div>
     *   );
     * };
     * ```
     */
    onPageChange?: (event: PageEvent) => void;

    /**
     * Fires when editing begins on a grid record.
     * Allows validation or field modification before editing.
     *
     * @event onRowEditStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleRowEdit = (event: EditEventArgs) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onRowEditStart={handleRowEdit}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onRowEditStart?: (event: RowEditEvent<T>) => void;

    /**
     * Fires when cell editing begins in `Cell` edit mode.
     * Provides an opportunity to validate the target cell or cancel the edit
     * before the editor is presented.
     *
     * @event onCellEditStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleCellEdit = (event: CellEditEvent) => {
     *     // Prevent editing for specific cells
     *     if (event.field === 'id') {
     *       event.cancel = true;
     *     }
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onCellEditStart={handleCellEdit}
     *       editSettings={{ mode: 'Cell', allowEdit: true }}
     *     />
     *   );
     * };
     * ```
     */
    onCellEditStart?: (event: CellEditEvent<T>) => void;

    /**
     * Fires when the process of adding a new row starts.
     *
     * @event onRowAddStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleRowAdd = (event: RowAddEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onRowEditStart={handleRowadd}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onRowAddStart?: (event: RowAddEvent<T>) => void;
    /**
     * Fires when the edit or add form is fully loaded and ready for user input.
     *
     * @event onFormRender
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleFormReady = (event: FormRenderEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onFormRender={handleFormReady}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onFormRender?: (event: FormRenderEvent<T>) => void;
    /**
     * Fires when a create, update, or delete operation is started.
     *
     * @event onDataChangeStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleDataChangeStart = (event: SaveEvent | DeleteEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onDataChangeStart={handleDataChangeStart}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onDataChangeStart?: (event: SaveEvent<T> | DeleteEvent<T>) => void;
    /**
     * Fires when a create, update, or delete operation is completed.
     *
     * @event onDataChangeComplete
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleDataChangeComplete = (event: SaveEvent | DeleteEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onDataChangeComplete={handleDataChangeComplete}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onDataChangeComplete?: (event: SaveEvent<T> | DeleteEvent<T>) => void;
    /**
     * Fires when a CRUD operation is cancelled.
     *
     * @event onDataChangeCancel
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleDataChangeCancel = (event: FormCancelEvent) => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onDataChangeCancel={handleDataChangeCancel}
     *       editSettings={{ allowEdit: true, allowAdd: true, allowDelete: true }}
     *       toolbar={['Add', 'Edit', 'Delete', 'Update', 'Cancel']}
     *     />
     *   );
     * };
     * ```
     */
    onDataChangeCancel?: (event: FormCancelEvent<T>) => void;

    /**
     * Fires when the bulk‑delete confirmation dialog opens with cross‑page selection enabled.
     * Allows customization of dialog options, such as disabling specific choices or setting the default selection.
     *
     * Use Cases:
     * - Disable "Delete Current Page": Prevents partial deletion when records are selected across multiple pages.
     * - Preselect "Delete All Selected Records": Ensures this option is the default, reducing errors and maintaining consistency.
     *
     * @event onDeleteDialogOpen
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleDeleteDialogOpen = (eventArgs: DeleteDialogEventArgs) => {
     *     // Customize dialog options
     *     if (eventArgs.totalSelectedCount > 100) {
     *       eventArgs.customizations = {
     *         pageOptionDisabled: true,
     *         defaultOption: 'all'
     *       };
     *     }
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={orderData}
     *       onDeleteDialogOpen={handleDeleteDialogOpen}
     *       editSettings={{ allowDelete: true }}
     *       selectionSettings={{ mode: 'Multiple', persistSelection: true }}
     *     />
     *   );
     * };
     * ```
     */
    onDeleteDialogOpen?: (eventArgs: DeleteDialogEventArgs) => void;

    /**
     * Fires when data is copied to the clipboard from the Grid.
     * Triggered after the copy operation completes, providing details about the copied content,
     * selected rows/cells, and allowing cancellation of the operation.
     *
     * Use Cases:
     * - Audit copying operations for sensitive data
     * - Modify clipboard content before writing (via beforeClipboardCopy alternative event if available)
     * - Track user interactions with grid data
     * - Prevent copying from specific rows or in certain conditions
     *
     * @event onClipboardCopy
     * @param {ClipboardCopyEvent} args - Event arguments containing copied data, selection info, and cancellation option
     * @returns {void}
     *
     * @example
     * ```tsx
     * const handleClipboardCopy = (args: ClipboardCopyEvent) => {
     *   console.log('Data copied to clipboard');
     *   console.log('Selection type:', args.selectionType);
     *   console.log('Selected rows:', args.selectedRowIndexes);
     *   console.log('Copied text:', args.clipboardText);
     * };
     *
     * return (
     *   <Grid
     *     dataSource={employees}
     *     columns={columns}
     *     selectionSettings={{ mode: 'Multiple', type: 'Row' }}
     *     clipboardSettings={{ enabled: true }}
     *     onClipboardCopy={handleClipboardCopy}
     *   />
     * );
     * ```
     */
    onClipboardCopy?: (args: ClipboardCopyEvent) => void;

    /**
     * Fires when data is cut from the grid using Ctrl+X.
     * Triggered when cut operation completes, providing details about the cut content,
     * selected rows/cells, and allowing cancellation of the operation.
     *
     * Use Cases:
     * - Audit cutting operations for sensitive data
     * - Track user interactions with grid data
     * - Prevent cutting from primary key columns
     * - Prevent cutting from specific rows in certain conditions
     * - Log or transform cut operations before data is cleared
     *
     * @event onClipboardCut
     * @param {ClipboardCutEvent} args - Event arguments containing cut data, selection info, and cancellation option
     * @returns {void}
     *
     * @example
     * ```tsx
     * const handleClipboardCut = (args: ClipboardCutEvent) => {
     *   console.log('Data cut from grid');
     *   console.log('Selection type:', args.selectionType);
     *   console.log('Selected rows:', args.selectedRowIndexes);
     *   console.log('Cut text:', args.clipboardText);
     *
     *   // Prevent cutting primary key columns
     *   if (args.selectedCells?.some(cell => cell.fieldName === 'id')) {
     *     args.cancel = true;
     *   }
     * };
     *
     * return (
     *   <Grid
     *     dataSource={employees}
     *     columns={columns}
     *     editSettings={{ allowEdit: true }}
     *     selectionSettings={{ mode: 'Multiple', type: 'Cell' }}
     *     clipboardSettings={{ enabled: true }}
     *     onClipboardCut={handleClipboardCut}
     *   />
     * );
     * ```
     */
    onClipboardCut?: (args: ClipboardCutEvent) => void;

    /**
     * Fires when data is pasted from the clipboard into the Grid.
     * Triggered after paste operation completes, providing details about the pasted data,
     * target location, and allowing cancellation of the operation.
     *
     * Use Cases:
     * - Validate pasted data before applying to grid
     * - Log paste operations for compliance or audit purposes
     * - Prevent pasting into read-only rows or columns
     * - Transform or filter pasted content
     *
     * @event onClipboardPaste
     * @param {ClipboardPasteEvent} args - Event arguments containing pasted data, target location, and cancellation option
     * @returns {void}
     *
     * @example
     * ```tsx
     * const handleClipboardPaste = (args: ClipboardPasteEvent) => {
     *   console.log('Data pasted from clipboard');
     *   console.log('Target row index:', args.startRowIndex);
     *   console.log('Pasted matrix:', args.pasteMatrix);
     *
     *   // Prevent pasting into read-only rows
     *   if (args.startRowIndex >= readOnlyRowStart) {
     *     args.cancel = true;
     *   }
     * };
     *
     * return (
     *   <Grid
     *     dataSource={employees}
     *     columns={columns}
     *     editSettings={{ allowEdit: true }}
     *     clipboardSettings={{ enabled: true }}
     *     onClipboardPaste={handleClipboardPaste}
     *   />
     * );
     * ```
     */
    onClipboardPaste?: (args: ClipboardPasteEvent) => void;

    /**
     * Callback that determines whether a row should be pinned and to which position.
     *
     * Invoked for each data row during rendering to determine its pinning bucket.
     * Returning `'top'` places the row in the top-pinned section,
     * returning `'bottom'` places it in the bottom-pinned section,
     * and returning `null` or `undefined` places it in the regular scrollable section.
     *
     * @default undefined
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   isRowPinned={(row) => row.isPinned ? 'top' : null}
     * />
     * ```
     */
    isRowPinned?: (row: T) => 'top' | 'bottom' | null | undefined;

    /**
     * Callback that determines whether a row is eligible for pinning.
     *
     * Invoked for each row to determine if pinning actions (such as context menu options)
     * should be available for that row. Returning `false` disables pinning for the row.
     *
     * @default undefined
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   isRowPinnable={(row) => row.allowPin !== false}
     * />
     * ```
     */
    isRowPinnable?: (row: T) => boolean;

    /**
     * Global configuration settings for pinning behavior across both rows and columns.
     *
     * Controls whether pinning is enabled, which dimensions (`type`) are eligible,
     * and which sides are permitted (top/bottom for rows, left/right for columns).
     * Follows the same composition pattern as `virtualizationSettings`.
     *
     * @default undefined
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   pinningSettings={{ enabled: true, type: PinScope.Both }}
     *   isRowPinned={(row) => row.isPinned ? 'top' : null}
     * />
     * ```
     */
    pinningSettings?: PinningSettings;

    /**
     * Fires when a row changes its pinning state due to user interaction or programmatic update.
     * Provides the affected row, its previous pin bucket, its current pin bucket, and the action performed.
     *
     * @event onPinnedRowsChanged
     *
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handlePinnedRowsChanged = (event: RowPinningEvent) => {
     *     console.log('Row:', event.rowData);
     *     console.log('Pin bucket:', event.previousPinBucket, '->', event.currentPinBucket);
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={employees}
     *       onPinnedRowsChanged={handlePinnedRowsChanged}
     *     />
     *   );
     * };
     * ```
     */
    onPinnedRowsChanged?: (event: RowPinningEvent<T>) => void;

    /**
     * Configures client-side relational pivoting for the Grid.
     * Defines report fields, aggregate values, member filters, result totals,
     * expansion defaults, generated-column limits and execution behavior.
     * Requires `PivotModule` in the `modules` property.
     *
     * @default undefined
     * @example
     * ```tsx
     * <Grid
     *   dataSource={salesData}
     *   modules={{ PivotModule }}
     *   pivotSettings={{
     *     enabled: true,
     *     rows: ['country'],
     *     columns: ['year'],
     *     values: [{ field: 'sales', type: 'Sum' }]
     *   }}
     * />
     * ```
     */
    pivotSettings?: PivotSettings<T>;

    /**
     * Returns presentation overrides for generated pivot value columns on the UI thread.
     * Pure callbacks may run repeatedly. User presentation adjustments take precedence.
     * Templates receive generated pivot rows, not source records. Omitted callbacks preserve defaults.
     */
    customizePivotColumn?: (context: PivotColumnContext<T>) => PivotColumnOverrides | undefined;

    /**
     * Returns presentation overrides for generated pivot group headers on the UI thread.
     * Custom header templates retain the built-in expand/collapse control.
     * Pure callbacks may run repeatedly; exceptions propagate to the React error boundary.
     */
    customizePivotColumnGroup?: (context: PivotColumnGroupContext<T>) => PivotColumnGroupOverrides | undefined;

    /**
     * Fires after interactive pivot configuration changes are applied.
     * Triggered when report fields, member filters, sorting, totals or other
     * pivot settings change through the integrated pivot controls.
     *
     * @event onPivotChange
     * @param {PivotChangeEvent<T>} event - Event arguments containing the applied pivot settings.
     * @returns {void}
     * @example
     * ```tsx
     * <Grid
     *   onPivotChange={(event) => {
     *     console.log('Pivot settings:', event.settings);
     *   }}
     * />
     * ```
     */
    onPivotChange?: (event: PivotChangeEvent<T>) => void;

    /**
     * Fires when pivot calculation or configuration validation fails.
     * Triggered when the pivot report contains invalid fields or settings,
     * unsupported data-source or scroll-mode combinations, exceeds the column limit,
     * or encounters a calculation failure.
     *
     * @event onPivotError
     * @param {PivotErrorEvent} event - Event arguments containing the error code and message.
     * @returns {void}
     * @example
     * ```tsx
     * <Grid
     *   onPivotError={(event) => {
     *     console.error(event.code, event.message);
     *   }}
     * />
     * ```
     */
    onPivotError?: (event: PivotErrorEvent) => void;
}

/**
 * Provides context for customizing row appearance or behavior.
 * Includes row type, index, and optional complete row data.
 */
export interface RowClassProps<T = unknown> {
    /**
     * Type of the row: `Header`, `Content`, or `Aggregate`.
     * Useful for applying different styles based on row category.
     *
     * @default -
     */
    rowType: string | RowType;

    /**
     * The index of the row in the grid.
     * Useful for alternating styles or row-specific logic.
     *
     * @default -
     */
    rowIndex: number;

    /**
     * The complete data object for the row.
     * Optional, used for conditional styling based on row values.
     *
     * @default -
     */
    data?: T | GroupedData<T>;
}

/**
 * The Syncfusion React Grid component is a feature-rich, customizable data grid for building responsive, high-performance applications.
 * It supports advanced functionalities like sorting, filtering, paging, and editing, with flexible data binding to local or remote data sources.
 * Key features include customizable columns, aggregates, row templates, and built-in support for localization.
 * The component offers a robust API with methods for dynamic data manipulation and events for handling user interactions.
 */
export interface IGrid<T = unknown> extends GridProps<T> {
    /**
     * Reference to the grid's root DOM element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Displays a loading spinner overlay on the grid to indicate an ongoing operation.
     * Used to enhance the user experience during asynchronous or time-consuming operations.
     *
     * @returns {void}
     */
    showSpinner(): void;

    /**
     * Hides the loading spinner overlay previously shown on the grid.
     * Used to update the UI after completing asynchronous or time-consuming operations.
     *
     * @returns {void}
     */
    hideSpinner(): void;

    /**
     * Refreshes the grid’s data and view to reflect the latest state.
     * Updates the grid’s display by re-rendering data based on current settings, such as filters, sorting, pagination or other.
     * Used to synchronize the grid’s UI with changes in the data source or configuration.
     */
    refresh(): void;

    /**
     * Retrieves the column configuration object for a specified field name.
     * Returns the ColumnProps object matching the provided field, enabling access to column metadata like field, header text, or formatting.
     * Used for dynamically accessing or modifying column properties at runtime.
     *
     * @param {string} field - The field name of the column to retrieve.
     * @returns {ColumnProps} The column configuration object for the specified field.
     */
    getColumnByField(field: string): ColumnProps;

    /**
     * Retrieves an array of configuration objects for all currently visible columns in the grid.
     * Used to access metadata for visible columns for dynamic processing or UI updates.
     *
     * @returns {ColumnProps[]} An array of configuration objects for visible columns.
     */
    getVisibleColumns(): ColumnProps<T>[];

    /**
     * Flattened column entries (with depth and leaf count) shared by header and content rendering.
     *
     * @private
     */
    stackedHeaderColumns?: FlattenedColumn<T>[];

    /**
     * Flattened leaf column elements shared by header and content rendering.
     *
     * @private
     */
    stackedFlattedColumns?: ReactElement<IColumnBase<T>>[];

    /**
     * Indicates whether the grid is currently using stacked headers.
     */
    isStackedHeader?: boolean;

    /**
     * Array of stacked header data where each item contains uid as key and headerText as value.
     * Generated from stackedHeaderColumns for convenient access to header mappings.
     *
     * @private
     */
    visibleStackedHeaderColumns?: ColumnProps<T>[];

    /**
     * Flat collection of every column prop (parent and leaf) participating in a stacked header
     * hierarchy. Useful for external consumers that need to iterate the full set without
     * re-traversing the nested `columns` tree.
     *
     * @private
     */
    allStackedColumnProps?: ColumnProps<T>[];

    /**
     * Flat collection of leaf column props (columns with a `field`) participating in a stacked
     * header hierarchy. Mirrors `stackedFlattedColumns` but as plain prop objects rather than
     * React elements, for convenient access from non-rendering code paths.
     *
     * @private
     */
    stackedFlattedColumnProps?: ColumnProps<T>[];

    /**
     * Matrix of stacked header rows, where the outer index represents the depth in the column
     * hierarchy and the inner array contains the column props rendered at that depth.
     *
     * @private
     */
    stackedRowEntries?: ColumnProps<T>[][];

    /**
     * Retrieves the column configuration object for a specified unique identifier (UID).
     * Used for dynamically accessing or modifying column settings at runtime using a unique identifier.
     *
     * @private
     * @param {string} uid - The unique identifier of the column to retrieve.
     * @returns {ColumnProps} The column configuration object for the specified UID.
     */
    getColumnByUid(uid: string): ColumnProps;

    /**
     * Retrieves all records from the grid based on current settings.
     * Returns an array of data objects reflecting applied pagination, filters, sorting, and searching settings.
     * For remote data sources, returns only the current view data.
     *
     * @param {boolean} skipPage - Optional. If true, excludes pagination information from the returned data.
     * @param {boolean} requiresCount - Optional. If true, includes the total record count in the response.
     * @param {Object[] | DataManager | DataResponse} dataSource - Defines the source of data, which can be a local array or a remote data manager.
     * @returns {Object[] | Promise<Response | DataReturnType>} An array of records or a promise for remote data.
     */
    getData(skipPage?: boolean, requiresCount?: boolean, dataSource?: Object[] | DataManager | DataResponse):
    T[] | Promise<Response | DataReturnType>;

    /**
     * Determines whether the grid is using a remote data source.
     * Remote data sources typically involve server-side operations for pagination, filtering, sorting, and searching.
     *
     * @returns {boolean} True if the grid is bound to a remote data source; otherwise, false.
     */
    isRemote(): boolean;

    /**
     * Retrieves an array of configuration objects for all currently hidden columns in the grid.
     * Used to access metadata for hidden columns for dynamic processing or UI updates.
     *
     * @returns {ColumnProps[]} An array of configuration objects for hidden columns.
     */
    getHiddenColumns(): ColumnProps[];

    /**
     * Retrieves detailed information about the row containing a specified cell element or event target.
     * Returns a `RowInfo` object with metadata about the associated row, such as its index or data.
     * Used to access row-specific details for dynamic processing or event handling.
     *
     * @param {Element} target - The cell element or event target used to identify the row.
     * @returns {RowInfo} A RowInfo object containing details about the associated row.
     */
    getRowInfo(target: Element): RowInfo<T>

    /**
     * Retrieves the `field` names of the primary key columns defined in the grid.
     * Used to identify the primary keys for data operations like updates or deletions.
     *
     * @returns {string[]} An array of field names for the grid’s primary key columns.
     */
    getPrimaryKeyFieldNames(): string[];

    /**
     * Updates and refreshes a specific row’s data based on its primary key value.
     * Replaces the row’s data for the record matching the provided key, optionally updating the data source.
     *
     * Requires a primary key column defined via `columns.isPrimaryKey`.
     *
     * @param {string | number} key - The primary key value of the record to update.
     * @param {Object} data - The new data object for the row.
     * @param {boolean} isDataSourceChangeRequired - Optional. If true, updates the underlying data source.
     * @returns {void}
     */
    setRowData(key: string | number, data: T, isDataSourceChangeRequired?: boolean): void;

    /**
     * Updates a specific cell’s value in a row identified by its primary key.
     * Modifies the cell value for the specified field in the record matching the provided key, optionally updating the data source.
     *
     * Requires a primary key column defined via `columns.isPrimaryKey`.
     *
     * @param {string | number} key - The primary key value of the record containing the cell.
     * @param {string} field - The field name of the column to update.
     * @param {ValueType | null} value - The new value for the cell.
     * @param {boolean} isDataSourceChangeRequired - Optional. If true, updates the underlying data source.
     * @returns {void}
     */
    setCellValue(key: string | number, field: string, value: ValueType | null,
        isDataSourceChangeRequired?: boolean): void;

    /**
     * Updates one or more fields across multiple records in bulk.
     *
     * @param {Object} changedData - Field names and their new values to apply to all matching records.
     * @param {Object[]} [rowData] - Optional records to update. Falls back to selected records.
     * @param {Function} [callback] - Optional callback invoked with the result after the changes are saved.
     *
     * @returns {void}
     */
    saveBulkChanges(changedData: Object, rowData?: Object[], callBack?: Function): void;

    /**
     * Updates and refreshes a specific row’s data and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the row is not found or is not currently rendered (no-op).
     *
     * @param {string | number} key - The primary key value of the record to update.
     * @param {Object} data - The new data object for the row.
     * @param {boolean} isDataSourceChangeRequired - Optional. If true, updates the underlying data source.
     * @returns {Promise<void>} Resolves after the row value is updated.
     */
    setRowDataAsync(key: string | number, data: T, isDataSourceChangeRequired?: boolean): Promise<void>;

    /**
     * Updates a specific cell’s value and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the row is not found or is not currently rendered (no-op).
     *
     * @param {string | number} key - The primary key value of the record containing the cell.
     * @param {string} field - The field name of the column to update.
     * @param {ValueType | null} value - The new value for the cell.
     * @param {boolean} isDataSourceChangeRequired - Optional. If true, updates the underlying data source.
     * @returns {Promise<void>} Resolves after the cell value is updated.
     */
    setCellValueAsync(key: string | number, field: string, value: ValueType | null,
        isDataSourceChangeRequired?: boolean): Promise<void>;

    /**
     * Updates one or more fields across multiple records in bulk and resolves when the changes are saved.
     *
     * @param {Object} changedData - Field names and their new values to apply to all matching records.
     * @param {Object[]} [rowData] - Optional records to update. Falls back to selected records.
     *
     * @returns {Promise<Object>} A promise that resolves with the save result once the operation completes.
     */
    saveBulkChangesAsync(changedData: Object, rowData?: Object[]): Promise<Object | void>;

    /**
     * Retrieves the current configuration of all columns in the grid.
     * Returns an array of `ColumnProps` objects representing the grid’s column settings.
     * Used to access column data for dynamic processing or modifications.
     *
     * @returns {ColumnProps[]} An array of column configuration objects.
     */
    getColumns(): ColumnProps[];

    /**
     * Returns the data module used by the grid.
     *
     * Use this to access the current applied queries and data-related configuration settings for the grid.
     * This includes filtering, sorting, pagination, and other data operations.
     *
     * @returns {DataResult} The data module currently used by the grid.
     */
    getDataModule(): DataResult;

    /**
     * Retrieves the table row elements of the currently selected rows in the grid.
     * Used to access selected row elemnt for further processing or display.
     *
     * @private
     * @returns {HTMLTableRowElement[]} An array of selected table row elements.
     */
    getSelectedRows(): HTMLTableRowElement[];

    /**
     * Selects a single row by its index in the grid.
     * Updates the grid’s selection state to highlight the specified row, optionally toggling the existing selection.
     * Used to programmatically select a row based on its position.
     *
     * @param {number} rowIndex - The zero-based index of the row to select.
     * @param {boolean} isToggle - Optional. Specifies whether to toggle the existing selection.
     * @returns {void}
     */
    selectRow(rowIndex: number, isToggle?: boolean): void;

    /**
     * Selects multiple rows by their indexes in the grid.
     * Updates the grid’s selection state to highlight the specified rows, typically used in multi-selection mode.
     * Used to programmatically select a collection of rows.
     *
     * @param {number[]} rowIndexes - An array of zero-based row indexes to select.
     * @returns {void}
     */
    selectRows(rowIndexes: number[]): void;

    /**
     * Selects a range of rows from a start index to an optional end index in the grid.
     * Updates the grid’s selection state to highlight all rows within the specified range.
     * Used to programmatically select a continuous set of rows.
     *
     * @param {number} startIndex - The zero-based index of the first row in the range.
     * @param {number} endIndex - Optional. The zero-based index of the last row in the range.
     * @returns {void}
     */
    selectRowByRange(startIndex: number, endIndex?: number): void;

    /**
     * Retrieves the indexes of the currently selected rows in the grid.
     * Used to determine which rows are currently selected for further processing.
     *
     * @returns {number[]} An array of selected row indexes.
     */
    getSelectedRowIndexes(): number[];

    /**
     * Retrieves the selected row data or selection metadata from the grid.
     *
     * Returns different types based on configuration:
     * - Local data: Array of selected row data objects (`T[]`).
     * - Remote data with persistent selection: Object with `isSelectAll` (boolean) and `primaryKeys` (string[]).
     * - No selection: Empty array or null.
     *
     * @public
     * @returns {T[] | { isSelectAll: boolean; primaryKeys: string[] } | null} Selected records or selection metadata
     *
     * @example
     * ```tsx
     * const selection = gridRef.current?.getSelectedRecords();
     * // Check if it's metadata object or array
     * if (selection && typeof selection === 'object' && 'isSelectAll' in selection) {
     *   console.log('Select All:', selection.isSelectAll);
     * }
     * ```
     */
    getSelectedRecords(): T[] | { isSelectAll: boolean; primaryKeys: string[] } | null;

    /**
     * Retrieves the persistent selected data as an array of record objects.
     *
     * Provides access to the internal persistent selection storage maintained across paging,
     * sorting, filtering, and other grid operations. Only returns data when `persistSelection`
     * is enabled in `selectionSettings`.
     *
     * @public
     * @returns {T[]} Array of selected record objects
     *
     * @example
     * ```tsx
     * const persistData = gridRef.current?.getPersistSelectedData();
     * console.log('Total selected:', persistData?.length);
     * ```
     */
    getPersistSelectedData(): T[];


    /**
     * Deselects specific rows by their indexes in the grid.
     * Removes the specified rows from the current selection, updating the grid’s UI accordingly.
     * Used to programmatically remove selection from specific rows.
     *
     * @param {number[]} indexes - An array of zero-based row indexes to deselect.
     * @returns {void}
     */
    clearRowSelection(indexes: number[]): void;

    /**
     * Clears all currently selected rows in the grid.
     * Removes the selection state from all rows, resetting the grid’s selection UI.
     * Used to programmatically clear all row selections.
     *
     * @returns {void}
     */
    clearSelection(): void;

    /**
     * Copies the currently selected cells or rows to the clipboard.
     * Can optionally include column headers in the copied content.
     *
     * @param {boolean} withHeaders - Optional. Includes column headers when true.
     * @returns {Promise<void>}
     *
     * @example
     * ```tsx
     * await gridRef.current?.copyToClipboard(true);
     * ```
     */
    copyToClipboard(withHeaders?: boolean): Promise<void>;

    /**
     * Pastes clipboard text into the current grid selection.
     * The data is applied starting from the active cell or first selected row.
     *
     * @param {string} clipboardText - Clipboard content to paste into the grid.
     * @returns {void}
     *
     * @example
     * ```tsx
     * gridRef.current?.pasteFromClipboard('10248\tVINET');
     * ```
     */
    pasteFromClipboard(clipboardText: string): void;

    /**
     * Cuts the current grid selection to the clipboard.
     * The selected data is copied and then removed from the grid.
     *
     * @returns {Promise<void>}
     *
     * @example
     * ```tsx
     * await gridRef.current?.cutToClipboard();
     * ```
     */
    cutToClipboard(): Promise<void>;

    /**
     * Executes cell fill from source selection to destination range.
     * Generates fill values based on detected patterns and applies them to grid.
     *
     * @param {AutoFillRange} fillRange - The destination range to fill
     * @returns {Promise<void>} Resolves when fill operation completes
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * const handleFill = async () => {
     *   await gridRef.current?.applyFill({
     *     targetCells: destinationCells,
     *     direction: 'down',
     *     fillCount: 5,
     *     isRangeReduction: false
     *   });
     * };
     * ```
     */
    applyFill(fillRange: AutoFillRange): Promise<void>;

    /**
     * Selects a single cell specified by row key and field name.
     * When in this mode, selection persists across paging, sorting, and filtering.
     * This is the primary method for programmatic single-cell selection.
     *
     * @param {string | number} rowKey - The primary key value of the row containing the cell.
     * @param {string} fieldName - The field name (column identifier) of the cell.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // persistent across paging/sorting
     * gridRef.current.cellSelectionModule.selectCell('123', 'OrderID');
     * ```
     */
    selectCell(rowKey: string | number, fieldName: string): void;

    /**
     * Selects multiple cells specified by row keys and field names (data-based mode).
     * When in data-based mode, selections persist across paging, sorting, and filtering.
     * This is the primary method for programmatic cell selection.
     *
     * @param {RowCellInfo[]} cells - Array of objects specifying rows and their selected cells in data-based format.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Data-based mode (persistent across paging/sorting)
     * gridRef.current.cellSelectionModule.selectCells([
     *   { rowKey: '123', fieldNames: ['OrderID', 'CustomerName'] },
     *   { rowKey: '456', fieldNames: ['TotalAmount'] }
     * ]);
     * ```
     */
    selectCells(cells: RowCellInfo[]): void;

    /**
     * Selects a rectangular range of cells from start position to end position.
     * Selection behavior depends on the configured type (`Flow`/`Box`/`BoxWithBorder`).
     * Uses data-based position format to ensure selections persist across paging, sorting, and filtering.
     * This is the primary method for programmatic range selection.
     *
     * @param {CellIdentifier} start - The starting cell position (top-left corner) in data-based format {rowKey, fieldName}.
     * @param {CellIdentifier} end - The ending cell position (bottom-right corner) in data-based format {rowKey, fieldName}.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Data-based range selection (persistent across paging/sorting)
     * gridRef.current.cellSelectionModule.selectCellsByRange(
     *   { rowKey: '123', fieldName: 'OrderID' },
     *   { rowKey: '456', fieldName: 'TotalAmount' }
     * );
     * ```
     */
    selectCellsByRange(start: CellIdentifier, end: CellIdentifier): void;

    /**
     * Clears cell selections in the grid.
     * If specific cells are provided, only those cells are cleared.
     * If no cells are provided, all cell selections are cleared.
     * Removes highlighting and resets the cell selection state.
     *
     * Uses data-based format for cell specification:
     * - Data-based: `{ rowKey: string|number, fieldNames: string[] }`.
     *
     * @param {RowCellInfo[] | undefined} cells - Optional. Array of objects specifying rows and their cells to clear in data-based format.
     *                                                If not provided, all cell selections are cleared.
     * @returns {void}
     *
     * @example
     * ```tsx
     * // Clear all cell selections
     * gridRef.current.cellSelectionModule.clearCellSelection();
     *
     * // Clear specific cells (data-based)
     * gridRef.current.cellSelectionModule.clearCellSelection([
     *   { rowKey: '123', fieldNames: ['OrderID'] },
     *   { rowKey: '456', fieldNames: ['CustomerName', 'TotalAmount'] }
     * ]);
     * ```
     */
    clearCellSelection(cells?: RowCellInfo[]): void;

    /**
     * Retrieves the selected cells grouped by row in data-based format with cell values.
     * Returns an array of objects, each containing a row, its selected cells, and their values.
     *
     * Format: `{ rowKey: string|number, fieldNames: string[], data: { [fieldName]: value } }`.
     * In data-based mode, multiple cells in the same row are grouped together with their data values.
     *
     * @returns {RowCellInfo[]} Array of objects with row identifier, selected cell field names, and their values.
     *
     * @example
     * ```tsx
     * // Data-based mode result (persists across paging/sorting) with values included
     * const selectedCells = gridRef.current.cellSelectionModule.getSelectedCellsData();
     * // Returns: [
     * //   {
     * //     rowKey: '123',
     * //     fieldNames: ['OrderID', 'CustomerName'],
     * //     data: { OrderID: 10248, CustomerName: 'Vinet' }
     * //   },
     * //   {
     * //     rowKey: '456',
     * //     fieldNames: ['TotalAmount'],
     * //     data: { TotalAmount: 32.38 }
     * //   }
     * // ]
     * ```
     */
    getSelectedCellsData(): RowCellInfo[];

    /**
     * Sorts a specified column in the grid with given options.
     * Applies sorting to the column identified by its name, using the specified direction and multi-sort behavior.
     * Used to programmatically sort grid data by a column.
     *
     * @param {string} columnName - The name of the column to sort (e.g., field name).
     * @param {SortDirection | string} sortDirection - The sorting direction ('Ascending' or 'Descending').
     * @param {boolean} isMultiSort - Optional. Specifies whether to maintain previously sorted columns.
     * @returns {void}
     */
    sortByColumn(columnName: string, sortDirection: SortDirection | string, isMultiSort?: boolean): void;

    /**
     * Removes sorting from a specified column in the grid.
     * Clears the sorting applied to the column identified by its name, reverting it to an unsorted state.
     * Used to programmatically remove sorting from a specific column.
     *
     * @param {string} columnName - The name of the column to remove sorting from (e.g., field name).
     * @returns {void}
     */
    removeSortColumn(columnName: string): void;

    /**
     * Clears sorting from all columns in the grid.
     * Resets the grid to an unsorted state, removing all sorting applied to any columns.
     * Used to programmatically revert the grid to its original data order.
     *
     * @param {string[]} fields - Optional. An array of field names to clear sorts for. If omitted, clears all sorts.
     * @returns {void}
     */
    clearSort(fields?: string[]): void;

    /**
     * Sorts a specified column and resolves once the grid's UI has committed the new sort order.
     * Resolves without rejecting when the sort is vetoed by `onSortStart` or is a no-op.
     * Used to sequence a subsequent grid action so it operates on the post-sort grid state.
     *
     * @param {string} columnName - The name of the column to sort (e.g., field name).
     * @param {SortDirection | string} sortDirection - The sorting direction ('Ascending' or 'Descending').
     * @param {boolean} isMultiSort - Optional. Specifies whether to maintain previously sorted columns.
     * @returns {Promise<void>} Resolves after the sort completes.
     */
    sortColumnAsync(columnName: string, sortDirection: SortDirection | string, isMultiSort?: boolean): Promise<void>;

    /**
     * Removes sorting from a specified column and resolves once the grid's UI has committed the change.
     *
     * @param {string} columnName - The name of the column to remove sorting from (e.g., field name).
     * @returns {Promise<void>} Resolves after the sort is removed.
     */
    removeSortColumnAsync(columnName: string): Promise<void>;

    /**
     * Clears sorting from all columns and resolves once the grid's UI has committed the unsorted state.
     *
     * @param {string[]} fields - Optional. An array of field names to clear sorts for. If omitted, clears all sorts.
     * @returns {Promise<void>} Resolves after sorting is cleared.
     */
    clearSortingAsync(fields?: string[]): Promise<void>;


    /**
     * Filters grid rows by a specified column with given options.
     * Applies a filter to the column identified by its `field` name, using the provided operator and value, with optional predicate and sensitivity settings.
     * Used to programmatically filter grid data based on column-specific criteria.
     *
     * @param {string} fieldName - The `field` name of the column to filter.
     * @param {string} filterOperator - The operator to apply (e.g., 'contains', 'equal').
     * @param {ValueType | Array<ValueType>} filterValue - The value to filter against.
     * @param {string} predicate - Optional. The relationship between filter queries ('AND' or 'OR').
     * @param {boolean} caseSensitive - Optional. If true, performs case-sensitive filtering. If false, ignores case.
     * @param {boolean} ignoreAccent - Optional. If true, ignores diacritic characters during filtering.
     * @returns {void}
     */
    filterByColumn(fieldName: string, filterOperator: string,
        filterValue: ValueType| ValueType[],
        predicate?: string, caseSensitive?: boolean,
        ignoreAccent?: boolean): void;

    /**
     * Clears filters applied to the specified fields or all columns in the grid.
     * Removes filtering conditions, restoring the grid to display all data or data for specified fields.
     * Used to programmatically reset filtering for a fresh data view.
     *
     * @param {string[]} fields - Optional. An array of field names to clear filters for. If omitted, clears all filters.
     * @returns {void}
     */
    clearFilter(fields?: string[]): void;

    /**
     * Applies a filter to a specific column and resolves once the grid's UI has committed the filtered result.
     * Resolves without rejecting when the filter is vetoed by `onFilterStart` or is a no-op.
     * Used to sequence a subsequent grid action so it operates on the post-filter grid state.
     *
     * @param {string} fieldName - The `field` name of the column to filter.
     * @param {string} filterOperator - The operator to apply (e.g., 'contains', 'equal').
     * @param {ValueType | Array<ValueType>} filterValue - The value to filter against.
     * @param {string} predicate - Optional. The relationship between filter queries ('AND' or 'OR').
     * @param {boolean} caseSensitive - Optional. If true, performs case-sensitive filtering. If false, ignores case.
     * @param {boolean} ignoreAccent - Optional. If true, ignores diacritic characters during filtering.
     * @returns {Promise<void>} Resolves after the filter is applied.
     */
    filterByColumnAsync(fieldName: string, filterOperator: string,
        filterValue: ValueType| ValueType[],
        predicate?: string, caseSensitive?: boolean,
        ignoreAccent?: boolean): Promise<void>;

    /**
     * Clears filters applied to the specified fields and resolves once the grid's UI has committed
     * the unfiltered state.
     *
     * @param {string[]} fields - An array of field names to clear filters for.
     * @returns {Promise<void>} Resolves after filtering is cleared.
     */
    clearFilteringAsync(fields: string[]): Promise<void>;

    /**
     * Removes the filter applied to a specific column by its field name.
     * Clears the filter for the specified column, optionally resetting the filter bar’s input value.
     * Used to programmatically remove filtering from a single column.
     *
     * @private
     * @param {string} field - Optional. The field name of the column to remove the filter from.
     * @param {boolean} isClearFilterBar - Optional. If true, clears the filter bar’s input value.
     * @returns {void}
     */
    removeFilteredColsByField(field?: string, isClearFilterBar?: boolean): void;

    /**
     * Searches grid records using a specified search string.
     * Applies a search across the grid’s data based on the configured search settings, such as fields or operators.
     * Used to programmatically filter data using a search term.
     *
     * @param {string} searchString - Optional. The search term to apply. if omitted, clears the search.
     * @returns {void}
     */
    search(searchString?: string): void;

    /**
     * Searches grid records and resolves once the grid's UI has committed the search results.
     * Resolves without rejecting when the search is vetoed by `onSearchStart` or is a no-op.
     *
     * @param {string} searchString - Optional. The search term to apply. If omitted, clears the search.
     * @returns {Promise<void>} Resolves after the search completes.
     */
    searchAsync(searchString?: string): Promise<void>;

    /**
     * Navigates to a specific page in the grid’s paginated data.
     * Updates the grid to display the data for the specified page number.
     *
     * @param {number} pageNumber - The page number to navigate to.
     * @returns {void}
     */
    goToPage(pageNumber: number): void;

    /**
     * Navigates to a specific page and resolves once the grid's UI has committed the new page's data.
     * Resolves without rejecting when the navigation is vetoed by `onPageChangeStart` or is a no-op.
     *
     * @param {number} pageNumber - The page number to navigate to.
     * @returns {Promise<void>} Resolves after the page change completes.
     */
    goToPageAsync(pageNumber: number): Promise<void>;

    /**
     * Updates the text of an external message displayed in the grid.
     * Sets or clears a custom message, typically used for notifications or status updates in the grid’s UI.
     *
     * @param {string} message - Optional. The message text to display.
     * @returns {void}
     */
    setPagerMessage(message?: string): void;

    /**
     * Retrieves the DOM element containing the grid’s header content.
     * Used for programmatic access or manipulation of the grid’s header area.
     *
     * @private
     * @returns {HTMLDivElement} The header content element.
     */
    getHeaderContent(): HTMLDivElement;

    /**
     * Retrieves the DOM element containing the grid’s content area.
     * Used for programmatic access or manipulation of the grid’s content area.
     *
     * @private
     * @returns {HTMLDivElement} The content area element.
     */
    getContent(): HTMLDivElement;

    /**
     * Initiates editing for a specified row or the currently selected row.
     * Used to programmatically trigger the editing mode for a specific or selected row.
     *
     * @param {HTMLTableRowElement} rowElement - Optional. The row element to edit. If omitted, edits the selected row.
     * @returns {void}
     */
    editRecord(rowElement?: HTMLTableRowElement): void;

    /**
     * Commits the edited or newly added row to the data source after validating inputs and triggering lifecycle events such as `onDataChangeStart` and `onDataChangeComplete`.
     *
     * Typically invoked via the Update toolbar action or Enter key during editing.
     *
     * @param {HTMLTableRowElement} rowElement - The row element to save record in command editing.
     * @returns {Promise<boolean>} Resolves to true if the operation succeeds. returns false if validation fails or the action is cancelled.
     *
     * @example
     * ```tsx
     * const handleSave = async () => {
     *   const success = await gridRef.current?.saveDataChanges();
     *   if (success) {
     *     console.log('Changes saved successfully');
     *   } else {
     *     console.log('Save failed or was cancelled');
     *   }
     * };
     * ```
     */
    saveDataChanges(rowElement?: HTMLTableRowElement): Promise<boolean>;

    /**
     * Aborts the active CRUD operation, exits edit mode, and restores the original row state.
     *
     * Typically invoked via the Cancel toolbar action or Escape key during editing.
     *
     * @param {HTMLTableRowElement} rowElement - The row element to cancel record in command editing.
     * @returns {void}
     *
     * @example
     * ```tsx
     * gridRef.current?.cancelDataChanges();
     * ```
     */
    cancelDataChanges(rowElement?: HTMLTableRowElement): void;

    /**
     * Adds a new record to the grid’s data source.
     * Inserts a new row with the provided data at the specified index or at the start if no index is provided.
     *
     * @param {Object} data - Optional. The data object for the new record.
     * @param {number} index - Optional. The index at which to insert the new record.
     * @returns {void}
     */
    addRecord(data?: T, index?: number): void;

    /**
     * Deletes a record from the grid’s data source based on specified criteria or the selected row.
     * Removes a record matching the provided field name and data, or deletes the currently selected row if no parameters are provided.
     * Used to programmatically remove records, updating the grid’s display and data source accordingly.
     *
     * @param {string} fieldName - Optional. The field name to match for identifying the record to delete.
     * @param {Object | Object[]} data - Optional. The data object or array of objects to match for deletion.
     * @returns {void}
     */
    deleteRecord(fieldName?: string, data?: T): void;

    /**
     * Updates a specific row in the grid with new data.
     * Replaces the data of the row at the specified index with the provided data object.
     * Used to programmatically modify existing row data in the grid.
     *
     * @param {number} index - The zero-based index of the row to update.
     * @param {Object} data - The new data object for the row.
     * @returns {void}
     */
    updateRecord(index: number, data: T): void;

    /**
     * Adds a new record and resolves once the grid's UI has committed the new row.
     * Resolves without rejecting when the add is vetoed or is a no-op.
     *
     * @param {Object} data - Optional. The data object for the new record.
     * @param {number} index - Optional. The index at which to insert the new record.
     * @returns {Promise<void>} Resolves after the add operation completes.
     */
    addRecordAsync(data?: T, index?: number): Promise<void>;

    /**
     * Deletes a record and resolves once the grid's UI has committed the removal.
     * Resolves without rejecting when the delete is vetoed or is a no-op.
     *
     * @param {string} fieldName - Optional. The field name to match for identifying the record to delete.
     * @param {Object | Object[]} data - Optional. The data object or array of objects to match for deletion.
     * @returns {Promise<void>} Resolves after the delete operation completes.
     */
    deleteRecordAsync(fieldName?: string, data?: T): Promise<void>;

    /**
     * Updates a specific row and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the update is vetoed or is a no-op.
     *
     * @param {number} index - The zero-based index of the row to update.
     * @param {Object} data - The new data object for the row.
     * @returns {Promise<void>} Resolves after the update operation completes.
     */
    updateRecordAsync(index: number, data: T): Promise<void>;

    /**
     * Validates all fields in the current edit or add form against their defined rules.
     * Checks the input values in the editing form to ensure they meet column validation criteria.
     * Used to verify data integrity before saving changes.
     *
     * @returns {boolean} True if all fields pass validation, false otherwise.
     */
    validateEditForm(): boolean;

    /**
     * Validates a specific field against its defined column validation rules.
     * Checks the value of the specified field to ensure it meets the configured validation criteria.
     * Used to verify the validity of a single field during editing.
     *
     * @param {string} field - The name of the field to validate.
     * @returns {boolean} True if the field is valid, false otherwise.
     */
    validateField(field: string): boolean;

    /**
     * Begins editing the specified cell in the grid.
     * This method is available only when `editSettings.mode` is set to 'Cell'.
     *
     * @param {string | number} primaryKeyValue - The primary key value of the row containing the cell
     * @param {string} field - The field name of the cell to edit
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Enter edit mode on Freight cell in row with OrderID=10248
     * gridRef.current?.editCell(10248, 'Freight');
     * ```
     */
    editCell(primaryKeyValue: string | number, field: string): void;

    /**
     * Saves the changes made in cell edit mode and closes the edit state.
     * This method is available only when `editSettings.mode` is set to 'Cell'..
     * If validation is enabled, input is checked automatically; invalid cells are not saved.
     *
     * @returns {Promise<boolean>} Promise resolving to true if save succeeded, false if validation failed
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Save current cell changes
     * const success = await gridRef.current?.saveCellChanges();
     * if (success) {
     *   console.log('Cell saved successfully');
     * }
     * ```
     */
    saveCellChanges(): Promise<boolean>;

    /**
     * Cancels the current cell edit operation and discards all unsaved changes.
     *  This method can be used only when `editSettings.mode` is set to 'Cell'.
     *
     * @returns {Promise<void>}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Cancel cell edit and revert changes
     * await gridRef.current?.cancelCellChanges();
     * ```
     */
    cancelCellChanges(): Promise<void>;

    /**
     * Opens the column chooser dialog programmatically.
     * Requires the Column Chooser to be enabled `showColumnChooser={true}` in the grid configuration.
     *
     * @param {number} [x] - Optional X-axis position for dialog placement (in pixels)
     * @param {number} [y] - Optional Y-axis position for dialog placement (in pixels)
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Open column chooser at specific position
     * const handleButtonClick = () => {
     *   gridRef.current?.openColumnChooser(100, 40);
     * };
     *
     * // Open column chooser at default position
     * const handleOpen = () => {
     *   gridRef.current?.openColumnChooser();
     * };
     * ```
     */
    openColumnChooser(x?: number, y?: number): void;

    /**
     * Expands all grouped rows in the grid.
     * Fires the `onGroup` event with the argument 'expandall' as the operation argument
     * to represent the expand all groups action.
     *
     * @returns {void}
     */
    expandAll(): void;

    /**
     * Collapses all grouped rows in the grid.
     * Fires the `onGroup` event, passing 'collapseall' as the operation argument
     * to represent the collapse all groups action.
     *
     * @returns {void}
     */
    collapseAll(): void;

    /**
     * Groups the grid by the specified column fields.
     * The column must have `allowGroup` set to `true` as the default.
     * Triggers `onGroup` event with operation argument 'add'.
     *
     * @param {string} fields - The collection of field names of the column to group by.
     * @param {boolean} [isResetRequired] - If true, resets existing groupings before applying the new grouping. Default is false, which adds to existing groupings.
     * @returns {void}
     */
    groupColumn(fields: string[], isResetRequired?: boolean): void;

    /**
     * Removes grouping for the specified column fields.
     * Triggers `onGroup` event with operation argument 'remove'.
     *
     * @param {string} fields - The collection field names of the column to ungroup.
     * @returns {void}
     */
    ungroupColumn(fields: string[]): void;

    /**
     * Removes all active groupings and returns the grid to its default ungrouped state.
     * Fires the `onGroup` event, passing 'removeall' as the operation argument
     * to represent the clear grouping action.
     *
     * @returns {void}
     */
    clearGrouping(): void;

    /**
     * Groups the grid by the specified column fields and resolves once the grid's UI has committed the change.
     * Resolves without rejecting when the group is vetoed by `onGroupStart` or is a no-op.
     *
     * @param {string[]} fields - The collection of field names of the column to group by.
     * @param {boolean} [isResetRequired] - If true, resets existing groupings before applying the new grouping.
     * @returns {Promise<void>} Resolves after grouping completes.
     */
    groupColumnAsync(fields: string[], isResetRequired?: boolean): Promise<void>;

    /**
     * Removes grouping for the specified column fields and resolves once the grid's UI has committed the change.
     *
     * @param {string[]} fields - The collection field names of the column to ungroup.
     * @returns {Promise<void>} Resolves after ungrouping completes.
     */
    ungroupColumnAsync(fields: string[]): Promise<void>;

    /**
     * Removes all active groupings and resolves once the grid's UI has committed the ungrouped state.
     *
     * @returns {Promise<void>} Resolves after grouping is cleared.
     */
    clearGroupingAsync(): Promise<void>;

    /**
     * Reverts the most recent grid operation (edit, add, delete, paste, autofill, or batch save).
     * Restores the previous state in the grid's canonical data source and refreshes the view.
     * Requires `editSettings.allowUndoRedo` to be enabled.
     *
     * @returns {Promise<void>} Resolves after the undo operation completes.
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Undo the last operation
     * await gridRef.current?.undo();
     * ```
     */
    undo(): Promise<void>;

    /**
     * Reapplies the most recently undone grid operation.
     * Restores the committed state in the grid's canonical data source and refreshes the view.
     * Requires `editSettings.allowUndoRedo` to be enabled.
     *
     * @returns {Promise<void>} Resolves after the redo operation completes.
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Redo the last undone operation
     * await gridRef.current?.redo();
     * ```
     */
    redo(): Promise<void>;

    /**
     * Returns the current number of undoable actions in the history stack.
     * Each committed operation (edit, add, delete, paste, autofill, batch save) counts as one action.
     * Requires `editSettings.allowUndoRedo` to be enabled.
     *
     * @returns {number} The number of actions available to undo.
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * const undoCount = gridRef.current?.getUndoActionsCount() ?? 0;
     * console.log(`${undoCount} operations can be undone`);
     * ```
     */
    getUndoActionsCount(): number;

    /**
     * Returns the current number of redoable actions in the history stack.
     * After an undo operation, the undone action becomes available for redo.
     * Requires `editSettings.allowUndoRedo` to be enabled.
     *
     * @returns {number} The number of actions available to redo.
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * const redoCount = gridRef.current?.getRedoActionsCount() ?? 0;
     * console.log(`${redoCount} operations can be redone`);
     * ```
     */
    getRedoActionsCount(): number;

    /**
     * Clears all undo and redo history, removing all recorded operations.
     * Useful for resetting the history after data source changes, sorting, filtering, or other structural changes.
     * Requires `editSettings.allowUndoRedo` to be enabled.
     *
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Clear history after refreshing the data source
     * gridRef.current?.clearUndoRedoHistory();
     * ```
     */
    clearUndoRedoHistory(): void;

    /**
     * Toggles the expansion state of a specific tree node.
     * If expanded, it collapses; if collapsed, it expands.
     *
     * @param {string} treeKey - The unique identifier of the node to toggle (e.g., '0', '0_0', '0_0_1').
     * @returns {void}
     *
     * @example
     * ```tsx
     * const gridRef = useRef<GridRef>(null);
     *
     * // Toggle a node's expansion state
     * gridRef.current?.treeToggleNodeExpansion?.('0_0');
     * ```
     */
    treeToggleNodeExpansion?: (treeKey: string, rowData: TreeGridRow) => void;

    /**
     * Provides access to the rendered tree data array (flattened, filtered by expansion state).
     * Used for integration with custom rendering or data transformation pipelines.
     *
     * @private
     *
     */
    treeRenderData?: any[];

    /**
     * Provides access to the complete normalized tree data array (including collapsed nodes).
     * Contains all tree hierarchy information with metadata properties (treeLevel, treeKey, treeParentKey, etc.).
     *
     * @private
     *
     */
    treeNormalizedData?: any[];

    /**
     * Provides access to the Set of currently expanded node keys.
     * Used to track which nodes are currently expanded in the tree view.
     *
     * @private
     *
     */
    treeExpandedKeys?: Set<string>;
}

/**
 * Combined interface for grid base properties
 *
 * @private
 */
export type IGridBase<T = unknown> = MutableGridBase<T> & IGrid<T>;

/**
 * Defines the structure of the event arguments triggered when a row is double-clicked in the grid.
 *
 * Provides contextual information about the target element, cell, row, and associated data,
 * enabling precise handling of double-click interactions within grid components.
 */
export interface RecordDoubleClickEvent<T = unknown> {
    /**
     * The mouse event triggered by the double-click action.
     *
     * Provides access to event metadata such as cursor position, button state,
     * and the target element, allowing detailed interaction handling.
     *
     * @default -
     */
    event?: React.MouseEvent<HTMLDivElement>;

    /**
     * The cell element within the row where the double-click occurred.
     *
     * Refers to the HTML element representing the cell, which can be used
     * for styling, attribute inspection, or interaction logic.
     *
     * @default -
     */
    cell?: Element;

    /**
     * The zero-based index of the clicked cell within its parent row.
     *
     * Indicates the position of the cell in the row, useful for identifying
     * column alignment or applying cell-specific operations.
     *
     * @default -
     */
    columnIndex?: number;

    /**
     * The column configuration object associated with the clicked cell.
     *
     * Contains metadata such as field name, header text, formatting rules,
     * and other column-level settings defined in the grid configuration.
     *
     * @default -
     */
    column?: ColumnProps;

    /**
     * The name of the event triggered.
     *
     * Identifies the event type for internal processing or conditional logic
     * in event handler implementations.
     *
     * @private
     * @default -
     */
    name?: string;

    /**
     * The row element where the double-click occurred.
     *
     * Refers to the HTML element representing the row, which can be accessed
     * for styling, DOM traversal, or row-level manipulation.
     *
     * @default -
     */
    row?: Element;

    /**
     * The data object bound to the clicked row.
     *
     * Represents the complete data associated with the row, enabling
     * contextual operations such as editing, selection, or detail expansion.
     *
     * @default -
     */
    data?: T;

    /**
     * The zero-based index of the clicked row within the grid.
     *
     * Indicates the row's position in the grid's data source, supporting
     * navigation, selection, and programmatic access to row data.
     *
     * @default -
     */
    rowIndex?: number;
}

/**
 * Represents event arguments for data loading start events in the grid.
 * Contains information about the data being loaded and allows cancellation of the operation.
 *
 * @private
 */
export interface DataLoadStartEvent {
    /**
     * The array of data objects to be bound to the grid. Represents the raw data for rendering or processing.
     */
    result: Object[];
    /** The total number of data records available, used for pagination or display purposes. */
    count?: number;
    /**
     * Indicates whether to cancel the data binding operation.
     *
     * @private
     */
    cancel?: boolean;
    /** An array of aggregate values (e.g., sum, average) calculated for the data, if aggregates are defined. */
    aggregates?: Aggregates[];
    /**
     * The action arguments providing context for the data binding operation, such as filters or sorting criteria.
     *
     * @private
     */
    actionArgs?: Object;
    /** The query object defining the data retrieval parameters, such as filtering or sorting queries. */
    query: Query;
    /**
     * Defines the name of the event.
     *
     * @private
     */
    name?: string;
    /**
     * The actual result and count of the data, providing raw data before processing or transformation.
     *
     * @private
     */
    actual?: Object;
    /**
     * The type of request associated with the data binding operation.
     *
     * @private
     */
    request?: string;
}

/**
 * Configures text wrapping behavior in grid cells and headers. When enabled, text content wraps automatically to fit within the available cell width, ensuring full visibility.
 */
export interface TextWrapSettings {
    /**
     * The `wrapMode` property defines how the text in the grid cells should be wrapped. The available modes are:
     * * `Both`: Wraps text in both the header and content cells.
     * * `Content`: Wraps text in the content cells only.
     * * `Header`: Wraps texts in the header cells only.
     *
     * @default WrapMode.Both | 'Both'
     */
    wrapMode?: WrapMode | string;

    /**
     * Enables text wrapping in grid cells.
     *
     * When enabled, this property allows text in grid cells to wrap to multiple lines if it exceeds the column width.
     * This is especially useful for columns containing lengthy content.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   textWrapSettings={{enabled: true}}
     * />
     * ```
     */
    enabled?: boolean;
}

/**
 * Represents event arguments for general grid action events.
 * Contains information about the current action being performed on the grid.
 *
 * @private
 */
export interface GridActionEvent {
    /**
     * Defines the current action.
     *
     * @private
     */
    requestType?: Action;
    /**
     * Defines the type of event.
     *
     * @private
     */
    type?: string;
    /**
     * Cancel the current grid action
     *
     * @private
     */
    cancel?: boolean;
    /** @private */
    name?: string;
}
