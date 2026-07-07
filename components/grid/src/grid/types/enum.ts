/**
 * Defines the horizontal text alignment within grid cells and headers.
 * Used to control the visual alignment of text for better readability and layout consistency.
 *
 * @default TextAlign.Left
 * @example
 * ```tsx
 * <Column field="CustomerName" textAlign={TextAlign.Center} />
 * ```
 */
export enum TextAlign {
    /**
     * Aligns text to the left edge of the cell.
     * Commonly used for textual and string-based data.
     *
     * @default 'Left'
     */
    Left = 'Left',

    /**
     * Aligns text to the right edge of the cell.
     * Ideal for numeric or financial data to maintain column alignment.
     *
     * @default 'Right'
     */
    Right = 'Right',

    /**
     * Centers the text horizontally within the cell.
     * Useful for headers or balanced visual presentation.
     *
     * @default 'Center'
     */
    Center = 'Center',

    /**
     * Justifies the text to evenly spread across the cell width.
     * Best suited for paragraph-style content or long descriptions.
     *
     * @default 'Justify'
     */
    Justify = 'Justify'
}

/**
 * Defines various types of cells in the grid.
 *
 * @private
 */
export enum CellTypes {
    /**  Defines CellType as Data */
    Data,
    /**  Defines CellType as Header */
    Header,
    /**  Defines CellType as Summary */
    Summary,
    /**  Defines CellType as Filter */
    Filter
}

/**
 * Defines the grid line display modes for the grid layout.
 * Controls the visibility of horizontal and vertical lines between cells, enhancing visual structure and readability.
 *
 * @default GridLine.Default | 'Default'
 * @example
 * ```tsx
 * <Grid gridLines={GridLine.Default} />
 * ```
 */
export enum GridLine {
    /**
     * Displays both horizontal and vertical grid lines.
     * Provides a fully bordered layout for clear separation of cells.
     */
    Both = 'Both',

    /**
     * No grid lines are displayed.
     * Creates a clean, borderless layout for minimalistic design.
     */
    None = 'None',

    /**
     * Displays only horizontal grid lines.
     * Useful for row-based separation while keeping columns visually merged.
     */
    Horizontal = 'Horizontal',

    /**
     * Displays only vertical grid lines.
     * Useful for column-based separation while keeping rows visually merged.
     */
    Vertical = 'Vertical',

    /**
     * Displays only horizontal grid lines.
     * Useful for row-based separation while keeping columns visually merged.
     *
     * @default 'Default'
     */
    Default = 'Default'
}

/**
 * Defines the supported data types for grid columns.
 * Used to define how data is interpreted and rendered in each column.
 * If not explicitly defined, the type is inferred from the first row's data based on each cell value type.
 *
 * @default -
 * @example
 * ```tsx
 * <Column field="OrderID" type={ColumnType.Number} />
 * ```
 */
export enum ColumnType {
    /**
     * Represents text or string values.
     * Commonly used for names, descriptions, or identifiers.
     *
     * @default 'string'
     */
    String = 'string',

    /**
     * Represents numeric values.
     * Used for quantities, prices, or any numerical data.
     *
     * @default 'number'
     */
    Number = 'number',

    /**
     * Represents boolean values.
     * Used for true/false or yes/no type fields.
     *
     * @default 'boolean'
     */
    Boolean = 'boolean',

    /**
     * Represents date values.
     * Used for timestamps, birthdays, or scheduling data.
     *
     * @default 'date'
     */
    Date = 'date',

    /**
     * Represents date and time values.
     * Used for precise timestamps, scheduling data with time.
     *
     * @default 'dateTime'
     */
    DateTime = 'dateTime',

    /**
     * Represents a column type that renders checkboxes for row selection.
     * Includes both header-level and row-level Checkbox components for bulk and individual selection.
     *
     * @default 'checkbox'
     */
    Checkbox = 'checkbox',

    /**
     * Represents a special column type for rendering group captions in grouped data scenarios.
     *
     * @default 'singlegroup'
     */
    SingleGroup = 'singlegroup',

    /**
     * Represents a special column type for rendering command buttons (Edit, Delete, Update, Cancel).
     * Used to define a column that displays action buttons instead of data values.
     *
     * @default 'command'
     */
    Command = 'command'
}

/**
 * Defines types of Render.
 *
 * @private
 */
export enum RenderType {
    /**  Defines RenderType as Header */
    Header,
    /**  Defines RenderType as Filter */
    Filter,
    /**  Defines RenderType as Content */
    Content,
    /**  Defines RenderType as Summary */
    Summary
}

/**
 * Defines the direction of sorting applied to grid columns.
 * Used to control the order in which data is displayed.
 *
 * @default SortDirection.Ascending
 * @example
 * ```tsx
 * <Grid sortSettings={{columns:[{field: 'OrderID', direction: SortDirection.Descending}]}} />
 * ```
 */
export enum SortDirection {
    /**
     * Sorts data in ascending order (e.g., A–Z, 0–9).
     * Commonly used for alphabetical or chronological sorting.
     *
     * @default 'Ascending'
     */
    Ascending = 'Ascending',

    /**
     * Sorts data in descending order (e.g., Z–A, 9–0).
     * Useful for prioritizing higher values or latest entries.
     *
     * @default 'Descending'
     */
    Descending = 'Descending'
}

/**
 * Defines the type of filter UI to be used in the Data Grid component.
 * Controls the visual interface and behavior for applying filters to columns.
 * ```props
 * * FilterBar :- Specifies the filter type as filter bar.
 * * Excel :- Specifies the filter type as excel filter.
 * * CheckBox :- Specifies the filter type as checkbox filter.
 * ```
 *
 * @default 'FilterBar'
 */
export type FilterType =
    'FilterBar' |
    'Excel' |
    'CheckBox';

/**
 * Defines Loading Indicator of the Grid.
 * ```props
 * * Spinner :- Defines Loading Indicator as Spinner.
 * * Shimmer :- Defines Loading Indicator as Shimmer.
 * ```
 */
export type IndicatorType =
    'Spinner' |
    'Shimmer';

/**
 * Enumerates the filter bar types supported by Data Grid component for column-level filtering.
 * Defines the type of filter UI and logic applied to a column, such as string, numeric, or date-based filtering.
 * Used to configure the filtering behavior and user interface for specific columns in the grid.
 *
 * @default FilterBarType.TextBox
 * @example
 * ```tsx
 * <Column field="Price" filter={{ filterBarType: FilterBarType.NumericTextBox}} />
 * ```
 */
export enum FilterBarType {
    /**
     * Applies a string-based filter using a text input.
     * Suitable for filtering textual data.
     *
     * @default 'StringFilter'
     */
    TextBox = 'StringFilter',

    /**
     * Applies a numeric filter using a number input.
     * Ideal for filtering numeric fields such as price, quantity, etc.
     *
     * @default 'NumericFilter'
     */
    NumericTextBox = 'NumericFilter',

    /**
     * Applies a date-based filter using a date picker.
     * Useful for filtering columns with date values.
     *
     * @default 'DatePickerFilter'
     */
    DatePicker = 'DatePickerFilter'
}

/**
 * Defines the filter mode options for grid filtering behavior across all filter types.
 * Determines how and when the filter operation is triggered in the filter bar, Excel filter, and checkbox filter.
 *
 * @default FilterMode.OnEnter
 * @example
 * ```tsx
 * <Grid filterSettings={{ mode: FilterMode.Immediate }} />
 * ```
 */
export enum FilterMode {
    /**
     * In filter bar: Filtering triggers only after pressing Enter key following data entry.
     * In Excel/Checkbox filter: Filtering triggers only after user changes selection and clicks OK button. Clicking Clear clears the filter.
     * Suitable for precise filtering and reducing unnecessary operations.
     *
     * @default 'OnEnter'
     */
    OnEnter = 'OnEnter',

    /**
     * In filter bar: Filtering triggers immediately as the user types, with a configurable delay.
     * In Excel/Checkbox filter: Filtering triggers immediately when user checks/unchecks items or performs search, without requiring OK confirmation.
     * Ideal for responsive filtering with immediate results.
     *
     * @default 'Immediate'
     */
    Immediate = 'Immediate'
}

/**
 * Specifies the sorting behavior supported by the Data Grid component.
 * Determines whether sorting is limited to a single column or can be applied to multiple columns simultaneously.
 * This enum is used internally to configure sorting logic and user interactions.
 *
 * @default SortMode.Single
 * @example
 * ```tsx
 * <Grid sortSettings={{ mode: SortMode.Multiple }} />
 * ```
 */
export enum SortMode {
    /**
     * Allows sorting by only one column at a time.
     * Selecting a new column will clear the previous sort.
     *
     * @default 'Single'
     */
    Single = 'Single',

    /**
     * Enables multi-column sorting.
     * Users can sort by multiple columns in sequence, typically using the Ctrl key.
     *
     * @default 'Multiple'
     */
    Multiple = 'Multiple'
}

/**
 * Specifies the selection behavior supported by the Data Grid component.
 * Determines whether selection is limited to a `Single` row or can be applied to `Multiple` row simultaneously.
 * This enum is used internally to configure selection logic and user interactions.
 *
 * @default SelectionMode.Single
 * @example
 * ```tsx
 * <Grid selectionSettings={{ mode: SelectionMode.Multiple }} />
 * ```
 */
export enum SelectionMode {
    /**
     * Allows selection by only one row at a time.
     * Selecting a new row will clear the previous row selection.
     *
     * @default 'Single'
     */
    Single = 'Single',

    /**
     * Enables multi-row selection.
     * Users can select by multiple row in sequence, typically using the Ctrl or Shift key.
     *
     * @default 'Multiple'
     */
    Multiple = 'Multiple'
}

/**
 * Defines the type of selection target in the grid.
 * Determines whether selection applies to rows or cells.
 *
 * @default SelectionType.Row
 * @example
 * ```tsx
 * <Grid selectionSettings={{ type: SelectionType.Row }} />
 * ```
 */
export enum SelectionType {
    /**
     * Enables row selection only.
     * Allows selecting entire rows as individual units.
     * Maintains backward compatibility as the default selection behavior.
     *
     * @default 'Row'
     */
    Row = 'Row',

    /**
     * Enables cell selection only.
     * Allows selecting individual cells within the grid.
     *
     * @default 'Cell'
     */
    Cell = 'Cell'
}

/**
 * Specifies the header checkbox click behavior for remote data sources.
 * Controls how the header checkbox toggles between states for selection operations.
 *
 * @default AutoSelectMode.Default
 * @example
 * ```tsx
 * <Grid selectionSettings={{ autoSelectMode: AutoSelectMode.Intermediate }} />
 * ```
 */
export enum AutoSelectMode {
    /**
     * The header checkbox toggles between checked and unchecked (two-state behavior).
     * When checked, all rows on the current page are selected.
     * When unchecked, all rows on the current page are deselected.
     */
    Default = 'Default',

    /**
     * The header checkbox toggles through all three states: checked, unchecked, and intermediate (tri-state behavior).
     * Allows more granular control over selection state representation.
     * Particularly useful for partial selection scenarios.
     */
    Intermediate = 'Intermediate'
}

/**
 * Defines the structural category of a layout element.
 * Used to distinguish between header, content, and aggregate sections for styling and behavior customization.
 * Applicable to row-level configurations in React Data Grid component.
 *
 * @default -
 * @example
 * ```tsx
 * <Grid rowClass={(props) => props.rowType === RowType.Header ? 'Header-row' : ''} />
 * ```
 */
export enum RowType {
    /**
     * Represents the header section of a layout.
     * Commonly used for column titles, labels, or control elements.
     *
     * @default 'Header'
     */
    Header = 'Header',

    /**
     * Represents the main content section of a layout.
     * Typically used for displaying primary data or interactive elements.
     *
     * @default 'Content'
     */
    Content = 'Content',

    /**
     * Represents the aggregate or summary section of a layout.
     * Typically used for totals, summaries, or computed values.
     *
     * @default 'Aggregate'
     */
    Aggregate = 'Aggregate'
}

/**
 * Defines the structural category of a layout element.
 * Used to distinguish between header, content, and aggregate sections for styling and behavior customization.
 * Applicable to cell-level configurations in React Data Grid component.
 *
 * @default -
 * @example
 * ```tsx
 * <Grid cellClass={(props) => props.cellType === CellType.Header ? 'Header-row' : ''} />
 * ```
 */
export enum CellType {
    /**
     * Represents the header section of a layout.
     * Commonly used for column titles, labels, or control elements.
     *
     * @default 'Header'
     */
    Header = 'Header',

    /**
     * Represents the main content section of a layout.
     * Typically used for displaying primary data or interactive elements.
     *
     * @default 'Content'
     */
    Content = 'Content',

    /**
     * Represents the aggregate or summary section of a layout.
     * Typically used for totals, summaries, or computed values.
     *
     * @default 'Aggregate'
     */
    Aggregate = 'Aggregate'
}

/**
 * Defines the set of supported actions triggered during component interactions or programmatic operations.
 * Used across event interfaces to identify the type of operation performed, such as sorting, filtering, or editing.
 * Enables consistent handling and conditional logic based on action context.
 *
 * @default -
 * @example
 * ```tsx
 * if (props.action === ActionType.ClearFiltering) {
 *   logAction('Filters cleared');
 * }
 * ```
 */
export enum ActionType {
    /**
     * Represents a sorting operation applied to one or more fields.
     * Commonly triggered by interaction with column headers or programmatic sort logic.
     *
     * @default 'Sorting'
     */
    Sorting = 'Sorting',

    /**
     * Represents the removal of an existing sort configuration.
     * Typically used to reset sorting state.
     *
     * @default 'ClearSorting'
     */
    ClearSorting = 'ClearSorting',

    /**
     * Represents a filtering operation applied to one or more fields.
     * Typically triggered by input changes or programmatic filter logic.
     *
     * @default 'Filtering'
     */
    Filtering = 'Filtering',

    /**
     * Represents the event triggered before the filter dialog is opened.
     * Used to customize dialog content, modify configuration, or prevent opening based on conditions.
     *
     * @default 'FilterDialogBeforeOpen'
     */
    FilterDialogBeforeOpen = 'FilterDialogBeforeOpen',

    /**
     * Represents the event triggered after the filter dialog has been opened.
     * Used to perform post-open actions such as focusing elements or logging interactions.
     *
     * @default 'FilterDialogAfterOpen'
     */
    FilterDialogAfterOpen = 'FilterDialogAfterOpen',

    /**
     * Represents the event triggered before the Column Chooser dialog is opened.
     * Used to customize dialog settings, control visible columns, or prevent opening based on conditions.
     *
     * @default 'ColumnChooserBeforeOpen'
     */
    ColumnChooserBeforeOpen = 'ColumnChooserBeforeOpen',

    /**
     * Represents the event triggered when column changes are applied in the Column Chooser dialog.
     * Fired when the user clicks OK/Apply button with the final column configuration.
     *
     * @default 'ColumnChooserApply'
     */
    ColumnChooserApply = 'ColumnChooserApply',

    /**
     * Represents a searching operation applied to fields.
     * Typically triggered by toolbar search input changes or programmatic search logic.
     *
     * @default 'Searching'
     */
    Searching = 'Searching',

    /**
     * Represents the removal of all active filters.
     * Typically used to reset filtering state.
     *
     * @default 'ClearFiltering'
     */
    ClearFiltering = 'ClearFiltering',

    /**
     * Represents the initiation of a new record creation process.
     * Used to distinguish between create and update operations.
     *
     * @default 'Add'
     */
    Add = 'Add',

    /**
     * Represents before modification of an existing record.
     * Used to dynamically modify update logic or validations.
     *
     * @default 'BeginEdit'
     */
    BeginEdit = 'BeginEdit',

    /**
     * Represents the modification of an existing record.
     * Used to apply update logic or validations.
     *
     * @default 'Edit'
     */
    Edit = 'Edit',

    /**
     * Represents the deletion of an existing record.
     * Used to distinguish between delete operations.
     *
     * @default 'Delete'
     */
    Delete = 'Delete',

    /**
     * Represents a pagination operation applied to Data Grid component.
     * Commonly triggered by interaction with pager component items or programmatic pagination logic.
     *
     * @default 'Paging'
     */
    Paging = 'Paging',

    /**
     * Represents a grouping operation applied to one or more fields.
     * Commonly triggered by column grouping interactions or programmatic grouping logic.
     *
     * @default 'Grouping'
     */
    Grouping = 'Grouping',

    /**
     * Represents a refresh operation triggered to reload or re-render (only required state updates) the grid data.
     */
    Refresh = 'Refresh'
}

/**
 * Defines the available positions for inserting a new row within a data grid.
 * Used to control where the newly added record appears in the grid layout.
 * This enum is referenced by the `newRowPosition` property in `EditSettings`.
 *
 * @default NewRowPosition.Top
 * @example
 * ```tsx
 * <Grid editSettings={{ allowAdd: true, newRowPosition: NewRowPosition.Bottom }} />
 * ```
 */
export enum NewRowPosition {
    /**
     * Inserts the new row at the beginning of the grid.
     * Useful for prioritizing newly added records or maintaining top-down workflows.
     *
     * @default 'Top'
     */
    Top = 'Top',

    /**
     * Inserts the new row at the end of the grid.
     * Suitable for chronological data entry or bottom-up workflows.
     *
     * @default 'Bottom'
     */
    Bottom = 'Bottom'
}

/**
 * Defines the available text wrapping modes for grid cells.
 * Used to control how text is displayed within header and content cells, improving readability and layout flexibility.
 *
 * @default WrapMode.Both
 * @example
 * ```tsx
 * <Grid textWrapSettings={{wrapMode: WrapMode.Content, enabled: allowTextWrap}} />
 * ```
 */
export enum WrapMode {
    /**
     * Enables wrapping for both header and content cells.
     * Ensures full visibility of labels and cell values, especially useful for long or multilingual text.
     *
     * @default 'Both'
     */
    Both = 'Both',

    /**
     * Wraps only the header cells.
     * Content cells remain single-line for a compact layout while preserving header readability.
     *
     * @default 'Header'
     */
    Header = 'Header',

    /**
     * Wraps only the content cells.
     * Header cells stay single-line to maintain alignment and layout consistency.
     *
     * @default 'Content'
     */
    Content = 'Content'
}

/**
 * Defines the cell content's overflow handling mode.
 * Controls how text is displayed when it exceeds the cell's visible area.
 *
 * @default ClipMode.Clip
 * @example
 * ```tsx
 * <Column field="Description" clipMode={ClipMode.EllipsisWithTooltip} />
 * ```
 */
export enum ClipMode {
    /**
     * Truncates the cell content when it overflows its area.
     * No visual indication is provided for clipped content.
     *
     * @default 'Clip'
     */
    Clip = 'Clip',

    /**
     * Displays an ellipsis (`...`) when the cell content overflows.
     * Provides a visual cue that content is truncated.
     */
    Ellipsis = 'Ellipsis',

    /**
     * Applies an ellipsis to overflowing cell content and shows a tooltip on hover.
     * Enhances readability by allowing users to view the full content.
     */
    EllipsisWithTooltip = 'EllipsisWithTooltip'
}

/**
 * Defines Actions of the Data Grid.
 * ```props
 * * filtering :- Defines current action as filtering.
 * * clearFiltering :- Defines current action as clear filtering.
 * * sorting :- Defines current action as sorting.
 * * ClearSorting :- Defines current action as clear sorting.
 * * searching :- Defines current action as searching.
 * * paging :-  Defines current action as paging.
 * ```
 *
 * @private
 */
export type Action =
    'Filtering' |
    'ClearFiltering' |
    'FilterDialogBeforeOpen' |
    'FilterDialogAfterOpen' |
    'ColumnChooserBeforeOpen' |
    'ColumnChooserApply' |
    'Sorting' |
    'ClearSorting' |
    'Searching' |
    'Paging' |
    'Delete' |
    'Edit' |
    'Add' |
    'Refresh' |
    'Grouping';
/**
 * Enumerates the types of aggregate calculations supported by the Data Grid component.
 * Defines the available aggregation methods for summarizing data in the grid’s footer sections.
 * Used to configure how data is aggregated for display in aggregate rows or columns.
 * ```props
 * * Sum :- Specifies sum aggregate type.
 * * Average :- Specifies average aggregate type.
 * * Max :- Specifies maximum aggregate type.
 * * Min :- Specifies minimum aggregate type.
 * * Count :- Specifies count aggregate type.
 * * TrueCount :- Specifies true count aggregate type.
 * * FalseCount :- Specifies false count aggregate type.
 * * Custom :- Specifies custom aggregate type.
 * ```
 */
export enum AggregateType {
    Sum = 'Sum',
    Average = 'Average',
    Max = 'Max',
    Min = 'Min',
    Count = 'Count',
    TrueCount = 'TrueCount',
    FalseCount = 'FalseCount',
    Custom = 'Custom'
}

/**
 * Defines the grouping behavior for the Data Grid component when grouping data by one or more columns.
 * Determines how grouped data is visually structured and organized within the grid.
 * Used to configure the grouping logic and presentation of grouped rows in the grid.
 * ```props
 * * SingleColumn :- Specifies single column grouping.
 * * MultipleColumns :- Specifies multiple columns grouping.
 * * GroupRows :- Specifies group rows grouping.
 * ```
 */
export enum GroupType {
    SingleColumn = 'SingleColumn',
    MultipleColumns = 'MultipleColumns',
    GroupRows = 'GroupRows'
}

/**
 * Defines the set of actionable items displayed in the grid toolbar. Each item maps to a specific user command. Enables direct data operations, UI control.
 * ```props
 * * Add :- Creates new row or record. Opens blank form or inserts editable row.
 * * Edit :- Enables editing for selected row. Supports selection logic, inline editing.
 * * Update :- Saves changes to data source. Triggers validation, lifecycle hooks.
 * * Delete :- Removes selected row or record.
 * * Cancel :- Discards unsaved changes. Exits edit mode, maintains data integrity.
 * * Search :- Displays input for row filtering. Supports keyword match, column-level queries
 * * ColumnChooser :- Opens column chooser dialog for showing/hiding columns
 * * Print :- Prints the grid with configured data range and formatting options.
 * ```
 */
export type ToolbarItems =
    'Add' |
    'Edit' |
    'Update' |
    'Delete' |
    'Cancel' |
    'Search' |
    'ColumnChooser' |
    'Print' |
    'PdfExport';

/**
 * Defines the available edit types for grid columns.
 * Used to configure the input control rendered during column cell editing.
 *
 * @default EditType.TextBox
 * @example
 * ```tsx
 * <Column field="OrderDate" editType={EditType.DatePicker} />
 * ```
 */
export enum EditType {
    /**
     * Defines a default standard text input for editing string values.
     * Suitable for general-purpose text fields.
     *
     * @default 'StringEdit'
     */
    TextBox = 'StringEdit',

    /**
     * Defines a dropdown list for selecting string values.
     * Useful for predefined options or lookup fields.
     *
     * @default 'DropDownEdit'
     */
    DropDownList = 'DropDownEdit',

    /**
     * Defines a date picker for editing date values.
     * Ideal for scheduling, timestamps, or calendar-based inputs.
     *
     * @default 'DatePickerEdit'
     */
    DatePicker = 'DatePickerEdit',

    /**
     * Defines a checkbox for editing boolean values.
     * Used for true/false or yes/no type fields.
     *
     * @default 'BooleanEdit'
     */
    CheckBox = 'BooleanEdit',

    /**
     * Defines a numeric input for editing number values.
     * Supports validation and formatting for numeric fields.
     *
     * @default 'NumericEdit'
     */
    NumericTextBox = 'NumericEdit'
}

/**
 * Defines the scrolling and data-loading strategy for the Data Grid component during virtualized row rendering.
 * Determines how rows are fetched and rendered based on the current scroll position and viewport.
 *
 * This enum is used with `VirtualizationSettings` to control whether data is loaded dynamically from a server
 * or rendered from locally available data.
 *
 * @default ScrollMode.Auto
 * @example
 * ```tsx
 * <Grid virtualizationSettings={{ scrollMode: ScrollMode.Virtual }} />
 * ```
 */
export enum ScrollMode {
    /**
     * Virtual scrolling mode with server-side data management.
     * Renders only the visible row range and requests the required data segment from the server based on the current viewport.
     * Works in conjunction with server-side paging and filtering.
     *
     * Caching behavior is controlled by VirtualizationSettings.enableCache:
     * - When true (default), previously loaded data segments are cached to avoid re-requesting the same range.
     * - When false, each revisit to a previously viewed range triggers a new server request.
     *
     * @default 'Virtual'
     */
    Virtual = 'Virtual',

    /**
     * Infinite scrolling mode for progressive data loading.
     * Loads additional rows progressively as the user scrolls toward the end of the currently loaded dataset.
     * New data is appended to the existing grid content without clearing previous rows.
     * Suitable for continuous data feeds, real-time data streams, and incremental loading of large remote datasets.
     *
     * @private
     * @default 'Infinite'
     */
    Infinite = 'Infinite',

    /**
     * Automatic scrolling mode with local data rendering.
     * Renders all available rows from the in-memory data source without making additional server requests.
     * No dynamic data loading occurs during scrolling.
     * Suitable for scenarios where the complete dataset is available locally or where data size is manageable without virtualization.
     *
     * @default 'Auto'
     */
    Auto = 'Auto'
}

/**
 * Specifies the theme configuration for the Data Grid component.
 * Used internally to determine default values for theme-dependent properties (e.g., row height in virtualization).
 *
 * The theme property defines static default values and calculations used during grid initialization and rendering,
 * such as the default rowHeight value when row DOM virtualization is enabled.
 *
 * Grid styling and visual appearance are controlled by importing the corresponding theme CSS files for the Data Grid,
 * not by the theme property alone. The theme property must be coordinated with the appropriate CSS import.
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
export enum Theme {
    /**
     * Material Design theme configuration for the Data Grid component.
     * Used internally for Material Design default calculations such as row height (50px) in the Data Grid.
     * Requires importing Material theme CSS for the Data Grid: '@syncfusion/react-grids/styles/material.css'.
     *
     * @default 'Material'
     */
    Material = 'Material'
}

/**
 * Specifies the type of visual loading indicator displayed during grid data operations.
 * Used to provide user feedback when the grid is fetching, processing, or rendering data.
 * Configured through LoadingIndicatorSettings.indicatorType.
 *
 * @default LoadingIndicatorType.Spinner
 * @example
 * ```tsx
 * <Grid loadingIndicatorSettings={{ indicatorType: LoadingIndicatorType.Shimmer }} />
 * ```
 */
export enum LoadingIndicatorType {
    /**
     * Displays a circular or linear spinner animation.
     * Provides a traditional loading indicator suitable for data fetching, filtering, and paging operations.
     * Recommended for minimalistic loading feedback without placeholder content.
     *
     * @default 'Spinner'
     */
    Spinner = 'Spinner',

    /**
     * Displays a shimmer (skeleton) effect as a loading placeholder.
     * Simulates the structure and shape of content being loaded, providing a more modern and engaging user experience.
     * Suitable for scenarios where previewing the expected content layout improves perceived performance.
     *
     * @default 'Shimmer'
     */
    Shimmer = 'Shimmer'
}

/**
 * @private
 */
export type EditEndAction = 'Click' | 'Key';

/**
 * Defines the keyboard navigation keys.
 *
 * @private
 */
export enum KeyboardKeys {
    UP = 'ArrowUp',
    DOWN = 'ArrowDown',
    LEFT = 'ArrowLeft',
    RIGHT = 'ArrowRight',
    TAB = 'Tab',
    HOME = 'Home',
    END = 'End',
    ENTER = 'Enter',
    SPACE = ' ',
    ESCAPE = 'Escape',
    ALT_J = 'j',
    ALT_W = 'w',
    PAGE_UP = 'PageUp',
    PAGE_DOWN = 'PageDown',
    F2 = 'F2',
    DELETE = 'Delete',
    CTRL_HOME = 'Home',
    CTRL_END = 'End'
}

/**
 * Defines the built‑in command item types (action buttons) available in a command column.
 * These buttons provide standard CRUD operations within grid rows.
 *
 * @default -
 * @example
 * ```tsx
 * // Using command item types in a command column
 * const getCommandItems = (event: CommandItemEvent) => [
 *   <CommandItem type={CommandItemType.Edit} />,
 *   <CommandItem type={CommandItemType.Delete} />
 * ];
 *
 * // In a grid configuration
 * <Grid>
 *   <Column
 *     field="command"
 *     type={ColumnType.Command}
 *     getCommandItems={getCommandItems}
 *   />
 * </Grid>
 * ```
 */
export enum CommandItemType {
    /**
     * Displays when the row is not in edit mode. Initiates editing for the row.
     *
     * @default 0
     */
    Edit,

    /**
     * Displays when the row is not in edit mode. Deletes the record.
     *
     * @default 1
     */
    Delete,

    /**
     * Displays in edit mode. Saves changes made to the record.
     *
     * @default 2
     */
    Update,

    /**
     * Displays in edit mode. Discards changes and restores the row to its previous state.
     *
     * @default 3
     */
    Cancel
}

/** @private */
export const ThemeDefaults: Record<Theme, { rowHeight: number, groupingIndent: number }> = {
    [Theme.Material]: { rowHeight: 50, groupingIndent: 20 }
};

/**
 * Defines the cell selection mode for rectangular range selection behavior.
 * Controls how cells are selected when creating ranges via mouse drag or keyboard shortcuts.
 *
 * Modes:
 * * `Flow` - Selects all cells between start and end positions including all intermediate rows (default Excel-like behavior).
 * * `Box` - Selects only cells within the column boundaries of the start and end positions.
 * * `BoxWithBorder` - Box mode with visible border highlighting around the selection.
 *
 * @default Flow
 * @example
 * ```tsx
 * <Grid selectionSettings={{ type: 'Cell', cellSelection: { enabled: true, type: CellSelectionType.Box } }} />
 * ```
 */
export enum CellSelectionType {
    /**
     * Selects all cells between start and end positions including all intermediate rows (Excel-like behavior).
     * Direction-aware selection: maintains selection logic based on drag direction.
     *
     * @default 'Flow'
     */
    Flow = 'Flow',

    /**
     * Selects only cells within the column boundaries of the start and end positions.
     * Creates a rectangular block selection limited to the specified column range.
     *
     * @default 'Box'
     */
    Box = 'Box',

    /**
     * Box mode with visible border highlighting around the selection.
     * Provides a visual outline around the selected rectangular range for better clarity.
     *
     * @default 'BoxWithBorder'
     */
    BoxWithBorder = 'BoxWithBorder'
}

/**
 * Defines the set of built-in context menu item types available in the Data Grid component.
 * Specifies the standard actions that can be displayed in context menus when right-clicking on grid cells or rows.
 * Used to configure which default menu items should appear in the context menu alongside custom items.
 *
 * @default -
 * @example
 * ```tsx
 * const contextMenuSettings = {
 *   enabled: true,
 *   items: ['Edit', 'Delete', 'Save', 'Cancel']
 * };
 *
 * <Grid contextMenuSettings={contextMenuSettings} />
 * ```
 *
 * @remarks
 * **Available Items:**
 * * `Edit` - Initiates edit mode for the row where the context menu was triggered.
 * * `Delete` - Removes the row where the context menu was triggered.
 * * `Save` - Saves changes made during edit mode.
 * * `Cancel` - Cancels edit mode and discards unsaved changes to the row.
 * * `SortAscending` - Sorts the grid data in ascending order based on the selected column.
 * * `SortDescending` - Sorts the grid data in descending order based on the selected column.
 * * `ClearSort` - Removes sorting for the selected column.
 * * `FirstPage` - Navigates to the first page of paginated data in the grid.
 * * `PrevPage` - Navigates to the previous page of paginated data.
 * * `LastPage` - Navigates to the last page of paginated data.
 * * `NextPage` - Navigates to the next page of paginated data.
 * * `SelectRow` - Selects the row where the context menu was triggered.
 * * `ClearRowSelection` - Deselects the row where the context menu was triggered.
 * * `ClearSelection` - Clears all row selections in the grid.
 * * `Sum` - Adds Sum aggregation to the aggregate cell (number columns only).
 * * `Average` - Adds Average aggregation to the aggregate cell (number columns only).
 * * `Min` - Adds Min aggregation to the aggregate cell (number columns only).
 * * `Max` - Adds Max aggregation to the aggregate cell (number columns only).
 * * `Count` - Adds Count aggregation to the aggregate cell (all column types).
 * * `TrueCount` - Adds TrueCount aggregation to the aggregate cell (boolean columns only).
 * * `FalseCount` - Adds FalseCount aggregation to the aggregate cell (boolean columns only).
 * * `Custom` - Adds Custom aggregation to the aggregate cell (for columns with customAggregate property).
 */
export type ContextMenuItem = 'Edit' | 'Delete' | 'Save' | 'Cancel' | 'SortAscending' | 'SortDescending' | 'ClearSort' | 'FirstPage' | 'PrevPage' | 'LastPage' | 'NextPage' | 'SelectRow' | 'ClearRowSelection' | 'ClearSelection' | 'Sum' | 'Average' | 'Min' | 'Max' | 'Count' | 'TrueCount' | 'FalseCount' | 'Custom';

/**
 * Defines the range of rows to include in the print operation.
 * ```props
 * * All :- Prints all rows from the data source.
 * * CurrentPage :- Prints only rows displayed on the current page.
 * * Custom :- Prints a specified range of rows using startRow and endRow.
 * ```
 */
export type PrintRange = 'All' | 'CurrentPage' | 'Custom';
