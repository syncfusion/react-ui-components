import { ComponentType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { DataManager, DataResult, Query, ReturnType as DataReturnType, Aggregates } from '@syncfusion/react-data';
import { IL10n } from '@syncfusion/react-base';
import { HeaderCellRenderEvent, CellRenderEvent, RowRenderEvent, ServiceLocator } from '../types/interfaces';
import { GridLine, SortDirection, WrapMode, Action, ClipMode, ValueType, RowType, ToolbarItems } from './index';
import { FilterSettings, FilterEvent } from '../types/filter.interfaces';
import { ColumnProps } from '../types/column.interfaces';
import { CellFocusEvent } from '../types/focus.interfaces';
import { EditSettings, FormRenderEvent, RowEditEvent, DeleteEvent,
    RowAddEvent, SaveEvent, FormCancelEvent } from '../types/edit.interfaces';
import { AggregateCellRenderEvent, AggregateRowRenderEvent, AggregateRowProps } from '../types/aggregate.interfaces';
import { ToolbarClickEvent, ToolbarItemProps } from '../types/toolbar.interfaces';
import { RenderRef, MutableGridBase, DataChangeRequestEvent, DataRequestEvent, IRowBase, IValueFormatter } from '../types/interfaces';
import { RowSelectEvent, RowSelectingEvent, SelectionSettings } from '../types/selection.interfaces';
import { PageEvent, PageSettings } from '../types/page.interfaces';
import { SortEvent, SortSettings } from '../types/sort.interfaces';
import { SearchEvent, SearchSettings } from '../types/search.interfaces';

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
 * Interface for Grid component reference containing all imperative methods and properties.
 * Provides access to grid instance methods and current state information.
 *
 * @private
 */
export interface GridRef<T = unknown> extends Omit<RenderRef<T>, 'refresh'>, IGrid<T>, MutableGridBase<T> {
    /**
     * Reference to the grid's root DOM element.
     *
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Current view data available in the grid.
     *
     * @default []
     */
    currentViewData?: T[];

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
}

/**
 * @private
 */
export interface GridProps<T = unknown> extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onError'> {
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
     * Supplies the data to be displayed in the grid.
     *
     * The data source can be provided as:
     * * An array of JavaScript objects
     * * A `DataManager` instance for local/remote data operations
     * * A `DataResult` object with processed data
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
    dataSource?: T[] | DataManager | DataResult;

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
     * Controls whether keyboard navigation is enabled for the Data Grid.
     *
     * By default, navigation and interaction with grid elements can be performed using keyboard shortcuts and arrow keys.
     * When set to false, the grid's default focus navigation behavior is disable
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
     * Defines the cell content's overflow mode. The available modes are
     * * `Clip` -  Truncates the cell content when it overflows its area.
     * * `Ellipsis` -  Displays ellipsis when the cell content overflows its area.
     * * `EllipsisWithTooltip` - Applies an ellipsis to overflowing cell content and displays a tooltip on hover for enhanced readability.
     *
     * @default ClipMode.Ellipsis | 'Ellipsis'
     */
    clipMode?: ClipMode | string;

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
     * @default { enabled: true, mode: 'Single', enableToggle: true }
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
     * When enabled, column headers will "stick" to the top of the viewport and remain visible even when the user scrolls down through the grid data.
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
     * Sets a fixed height for all rows in the grid.
     *
     * This property sets a uniform height for all rows in the grid. When set to a number, all rows will have exactly that height in pixels.
     * When null (default), row height is determined automatically based on content and styles.
     *
     * @default null
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
     * const CustomRowTemplate = (props: any) => {
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
     * Each aggregate row can contain multiple aggregations that apply functions like sum, average, min, max, or count to specific columns.
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
     * Fires at the start of grid initialization before data processing.
     * Useful for initial configurations or showing loading indicators.
     *
     * @event onGridRenderStart
     * @example
     * ```tsx
     * const GridComponent = () => {
     *   const handleGridRender = () => {
     *     // handle your action here
     *   };
     *
     *   return (
     *     <Grid
     *       dataSource={data}
     *       onGridRenderStart={handleGridRender}
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
    data?: T;
}

/**
 * The Syncfusion React Grid component is a feature-rich, customizable data grid for building responsive, high-performance applications.
 * It supports advanced functionalities like sorting, filtering, paging, and editing, with flexible data binding to local or remote data sources.
 * Key features include customizable columns, aggregates, row templates, and built-in support for localization.
 * The component offers a robust API with methods for dynamic data manipulation and events for handling user interactions.
 */
export interface IGrid<T = unknown> extends GridProps<T> {
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
    getVisibleColumns(): ColumnProps[];

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
     * @returns {Object[] | Promise<Response | DataReturnType>} An array of records or a promise for remote data.
     */
    getData(skipPage?: boolean, requiresCount?: boolean): T[] | Promise<Response | DataReturnType>;

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
     * Retrieves the current configuration of all columns in the grid.
     * Returns an array of `ColumnProps` objects representing the grid’s column settings.
     * Used to access column data for dynamic processing or modifications.
     *
     * @returns {ColumnProps[]} An array of column configuration objects.
     */
    getColumns(): ColumnProps[];

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
     * Retrieves the data objects of the currently selected rows in the grid.
     * Used to access the data of selected rows for processing or display.
     *
     * @returns {Object[] | null} An array of selected row data objects or null if none are selected.
     */
    getSelectedRecords(): T[] | null;

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
     * Navigates to a specific page in the grid’s paginated data.
     * Updates the grid to display the data for the specified page number.
     *
     * @param {number} pageNumber - The page number to navigate to.
     * @returns {void}
     */
    goToPage(pageNumber: number): void;

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
    saveDataChanges(): Promise<boolean>;

    /**
     * Aborts the active CRUD operation, exits edit mode, and restores the original row state.
     *
     * Typically invoked via the Cancel toolbar action or Escape key during editing.
     *
     * @returns {void}
     *
     * @example
     * ```tsx
     * gridRef.current?.cancelDataChanges();
     * ```
     */
    cancelDataChanges(): void;

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
