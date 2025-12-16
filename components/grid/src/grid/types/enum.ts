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
 * Defines types of Filter.
 * ```props
 * * FilterBar :- Specifies the filter type as filter bar.
 * ```
 *
 * @private
 */
export type FilterType =
    'FilterBar';

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
 * Defines the filter bar mode options for grid filtering behavior.
 * Determines how and when the filter operation is triggered in the grid.
 *
 * @default FilterBarMode.OnEnter
 * @example
 * ```tsx
 * <Grid filterSettings={{ mode: FilterBarMode.Immediate }} />
 * ```
 */
export enum FilterBarMode {
    /**
     * Initiates the filter operation only after the Enter key is pressed.
     * Suitable for precise filtering and reducing unnecessary operations.
     *
     * @default 'OnEnter'
     */
    OnEnter = 'OnEnter',

    /**
     * Initiates the filter operation automatically after a short delay (default: 500 ms).
     * Ideal for responsive filtering as the user types.
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
     * Represents a pagination operation applied to grid component.
     * Commonly triggered by interaction with pager component items or programmatic pagination logic.
     *
     * @default 'Paging'
     */
    Paging = 'Paging',
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
    'Sorting' |
    'ClearSorting' |
    'Searching' |
    'Paging' |
    'Delete' |
    'Edit' |
    'Add' |
    'Refresh';
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
 * Defines the set of actionable items displayed in the grid toolbar. Each item maps to a specific user command. Enables direct data operations, UI control.
 * ```props
 * * Add :- Creates new row or record. Opens blank form or inserts editable row.
 * * Edit :- Enables editing for selected row. Supports selection logic, inline editing.
 * * Update :- Saves changes to data source. Triggers validation, lifecycle hooks.
 * * Delete :- Removes selected row or record.
 * * Cancel :- Discards unsaved changes. Exits edit mode, maintains data integrity.
 * * Search :- Displays input for row filtering. Supports keyword match, column-level queries
 * ```
 */
export type ToolbarItems =
    'Add' |
    'Edit' |
    'Update' |
    'Delete' |
    'Cancel' |
    'Search';

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
