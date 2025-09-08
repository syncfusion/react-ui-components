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
export enum CellType {
    /**  Defines CellType as Data */
    Data,
    /**  Defines CellType as Header */
    Header,
    /**  Defines CellType as Summary */
    Summary,
    /**  Defines CellType as GroupSummary */
    GroupSummary,
    /**  Defines CellType as CaptionSummary */
    CaptionSummary,
    /**  Defines CellType as Filter */
    Filter,
    /**  Defines CellType as Indent */
    Indent,
    /**  Defines CellType as GroupCaption */
    GroupCaption,
    /**  Defines CellType as GroupCaptionEmpty */
    GroupCaptionEmpty,
    /**  Defines CellType as Expand */
    Expand,
    /**  Defines CellType as HeaderIndent */
    HeaderIndent,
    /**  Defines CellType as StackedHeader */
    StackedHeader,
    /**  Defines CellType as DetailHeader */
    DetailHeader,
    /**  Defines CellType as DetailExpand */
    DetailExpand,
    /**  Defines CellType as CommandColumn */
    CommandColumn,
    /**  Defines CellType as DetailFooterIntent */
    DetailFooterIntent,
    /**  Defines CellType as RowDrag */
    RowDragIcon,
    /**  Defines CellType as RowDragHeader */
    RowDragHIcon
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
    DateTime = 'dateTime'
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
 *
 * @private
 * ```props
 * * FilterBar :- Specifies the filter type as filter bar.
 * ```
 */
export type FilterType =
    'FilterBar';

/**
 * Enumerates the filter bar types supported by Grid component for column-level filtering.
 * Defines the type of filter UI and logic applied to a column, such as string, numeric, or date-based filtering.
 * Used to configure the filtering behavior and user interface for specific columns in the grid.
 *
 * @default TextBox
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
     * @default 'stringFilter'
     */
    TextBox = 'stringFilter',

    /**
     * Applies a numeric filter using a number input.
     * Ideal for filtering numeric fields such as price, quantity, etc.
     *
     * @default 'numericFilter'
     */
    NumericTextBox = 'numericFilter',

    /**
     * Applies a date-based filter using a date picker.
     * Useful for filtering columns with date values.
     *
     * @default 'datePickerFilter'
     */
    DatePicker = 'datePickerFilter'
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
 * Defines Actions of the Grid.
 * ```props
 * * filtering :- Defines current action as filtering.
 * * clearFiltering :- Defines current action as clear filtering.
 * * sorting :- Defines current action as sorting.
 * * clearSorting :- Defines current action as clear sorting.
 * * searching :- Defines current action as searching.
 * * paging :-  Defines current action as paging.
 * ```
 *
 * @private
 */
export type Action =
    'filtering' |
    'clearFiltering' |
    'sorting' |
    'clearSorting' |
    'searching' |
    'paging' |
    'delete' |
    'edit' |
    'add' |
    'refresh';
/**
 * Enumerates the types of aggregate calculations supported by the Grid component.
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
     * @default 'stringEdit'
     */
    TextBox = 'stringEdit',

    /**
     * Defines a dropdown list for selecting string values.
     * Useful for predefined options or lookup fields.
     *
     * @default 'dropDownEdit'
     */
    DropDownList = 'dropDownEdit',

    /**
     * Defines a date picker for editing date values.
     * Ideal for scheduling, timestamps, or calendar-based inputs.
     *
     * @default 'datePickerEdit'
     */
    DatePicker = 'datePickerEdit',

    /**
     * Defines a checkbox for editing boolean values.
     * Used for true/false or yes/no type fields.
     *
     * @default 'booleanEdit'
     */
    CheckBox = 'booleanEdit',

    /**
     * Defines a numeric input for editing number values.
     * Supports validation and formatting for numeric fields.
     *
     * @default 'numericEdit'
     */
    NumericTextBox = 'numericEdit'
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
