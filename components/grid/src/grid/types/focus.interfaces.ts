import { MouseEvent, KeyboardEvent, RefObject } from 'react';
import { IRow } from '../types';
import { ColumnProps } from '../types/column.interfaces';
import { useFocusStrategy } from '../hooks';

/**
 * Defines the type for the focus strategy module in the Data Grid.
 * Represents the return type of the useFocusStrategy hook for managing focus navigation.
 * Used internally to encapsulate focus-related functionality.
 *
 * @private
 */
export type FocusStrategyModule = ReturnType<typeof useFocusStrategy>;

/**
 * Represents the matrix object for managing focusable cells in the Data Grid.
 * Provides a grid-like structure to track and navigate focusable cells in content, header, or aggregate sections.
 * Used internally to facilitate keyboard navigation and cell focus operations.
 *
 * @private
 */
export interface IFocusMatrix {
    /**
     * Stores a two-dimensional array representing the focusable state of cells in the grid.
     * Each element indicates whether a cell at [rowIndex, columnIndex] is focusable (e.g., 1 for focusable, 0 for not).
     * Used to map the grid’s structure for navigation and focus management.
     *
     * @default []
     */
    matrix: number[][];

    /**
     * Specifies the current position in the matrix as an array of [rowIndex, columnIndex].
     * Tracks the currently focused cell’s coordinates for navigation operations.
     * Updated dynamically as focus moves within the grid.
     *
     * @default []
     */
    current: number[];

    /**
     * Indicates the total number of columns in the focus matrix.
     * Reflects the width of the grid’s focusable structure, corresponding to visible columns.
     * Used to define boundaries for navigation calculations.
     *
     * @default 0
     */
    columns: number;

    /**
     * Indicates the total number of rows in the focus matrix.
     * Reflects the height of the grid’s focusable structure, corresponding to visible rows.
     * Used to define boundaries for navigation calculations.
     *
     * @default 0
     */
    rows: number;

    /**
     * Updates the focusable state of a specific cell in the matrix.
     * Sets whether the cell at the given row and column indices is focusable, with an optional boolean flag.
     * Used to dynamically configure the focusable structure of the grid.
     *
     * @param {number} rowIndex - The row index of the cell.
     * @param {number} columnIndex - The column index of the cell.
     * @param {boolean} allow - Optional. Whether the cell should be focusable.
     * @returns {void}
     */
    set: (rowIndex: number, columnIndex: number, allow?: boolean) => void;

    /**
     * Retrieves the coordinates of the next valid focusable cell based on navigation parameters.
     * Uses the current position, navigation direction, and optional validation to determine the next cell to focus.
     * Supports complex navigation scenarios, such as skipping non-focusable cells.
     *
     * @param {number} rowIndex - The current row index.
     * @param {number} columnIndex - The current column index.
     * @param {number[]} navigator - Navigation direction array.
     * @param {string} action - Optional. The navigation action.
     * @param {Function} validator - Optional. Function to validate cell selection.
     * @param {Object} active - Optional. Active element information.
     * @returns {number[]} The next valid cell coordinates.
     */
    get: (rowIndex: number, columnIndex: number, navigator: number[], action?: string, validator?: Function,
        active?: Object) => number[];

    /**
     * Selects a specific cell in the matrix to receive focus.
     * Updates the grid’s focus state to highlight the cell at the given row and column indices.
     * Used for programmatic focus changes or user-driven navigation.
     *
     * @param {number} rowIndex - The row index of the cell to select.
     * @param {number} columnIndex - The column index of the cell to select.
     * @returns {void}
     */
    select: (rowIndex: number, columnIndex: number) => void;

    /**
     * Generates a focus matrix from the grid’s row data.
     * Creates a two-dimensional array of focusable states based on row data and a selector function.
     * Supports row templates for customized focus behavior in complex grid layouts.
     *
     * @param {IRow<ColumnProps>[]} rowsData - Array of row data.
     * @param {Function} selector - Function to select focusable cells.
     * @param {boolean} isRowTemplate - Optional. Whether using row template.
     * @returns {number[][]} The generated matrix.
     */
    generate: (rowsData: IRow<ColumnProps>[], selector: Function, isRowTemplate?: boolean) => number[][];

    /**
     * Checks whether a cell’s value in the matrix is invalid (0 or undefined).
     * Determines if the cell at the given value is non-focusable, aiding navigation logic.
     * Used to skip non-focusable cells during focus traversal.
     *
     * @param {number} value - The cell value to check.
     * @returns {boolean} True if the value is invalid.
     */
    inValid: (value: number) => boolean;

    /**
     * Finds the index of the first valid focusable cell in a vector (row or column).
     * Searches the specified vector starting from the given index, using navigation direction and optional action.
     * Supports moving focus to the identified cell if specified.
     *
     * @param {number[]} vector - The vector to search.
     * @param {number} index - The starting index.
     * @param {number[]} navigator - Navigation direction array.
     * @param {boolean} moveTo - Optional. Whether to move to the cell.
     * @param {string} action - Optional. The navigation action.
     * @returns {number} The index of the first valid cell.
     */
    first: (vector: number[], index: number, navigator: number[], moveTo?: boolean, action?: string) => number;

    /**
     * Finds the next or previous valid focusable cell index in the matrix.
     * Determines the coordinates of the next or previous focusable cell based on the current position and direction.
     * Used to support sequential navigation through focusable cells.
     *
     * @param {number[]} checkCellIndex - Current cell index to check.
     * @param {boolean} next - Whether to find the next cell (true) or previous (false).
     * @returns {number[]} The coordinates of the found cell.
     */
    findCellIndex: (checkCellIndex: number[], next: boolean) => number[];
}

/**
 * Defines event arguments for cell focus events in the Data Grid.
 * Provides detailed context about the focused cell, including its position, data, and triggering event.
 * Used to handle focus-related interactions and updates.
 */
export interface CellFocusEvent<T = unknown> {
    /**
     * Specifies the zero-based row index of the focused cell in the grid.
     * Identifies the row position of the cell that has received focus.
     * Used for tracking or processing the focused row’s context.
     *
     * @default -
     */
    rowIndex: number;

    /**
     * Specifies the zero-based column index of the focused cell in the grid.
     * Identifies the column position of the cell that has received focus.
     * Used for tracking or processing the focused column’s context.
     *
     * @default -
     */
    columnIndex: number;

    /**
     * References the DOM element of the focused cell.
     * Provides access to the cell’s HTMLElement for manipulation or inspection.
     * Used internally to manage focus state and UI updates.
     *
     * @private
     */
    element?: HTMLElement;

    /**
     * Contains the data object associated with the focused cell’s row.
     * Provides access to the row’s record data for processing or display.
     * Useful for retrieving context about the focused cell’s content.
     *
     * @default null
     */
    data?: T;

    /**
     * Contains the column configuration associated with the focused cell.
     * Provides metadata such as field name, data type, or formatting for the column.
     * Enables access to column-specific properties during focus events.
     *
     * @default null
     */
    column?: ColumnProps;

    /**
     * Contains the synthetic event object that triggered the focus event.
     * Provides details about the user action (e.g., click or keypress) that caused the focus change.
     * Useful for advanced event handling or custom logic.
     *
     * @default null
     */
    event?: MouseEvent | KeyboardEvent;

    /**
     * References the parent DOM element of the focused cell.
     * Typically the row or container element housing the cell, used for context or navigation.
     * Used internally to manage focus within the grid’s structure.
     *
     * @private
     */
    parent?: HTMLElement;

    /**
     * Contains an array of cell indexes, typically [rowIndex, colIndex], for the focused cell.
     * Provides a structured way to access the focused cell’s coordinates.
     * Used for navigation or state tracking during focus operations.
     *
     * @default []
     * @private
     */
    indexes?: number[];

    /**
     * Indicates whether the focus event was triggered by keyboard navigation.
     * When true, signifies that a keypress (e.g., arrow keys) caused the focus change.
     * Used internally to differentiate between keyboard and mouse interactions.
     *
     * @private
     * @default false
     */
    byKey?: boolean;

    /**
     * Indicates whether the focus event was triggered by a mouse click.
     * When true, signifies that a click action caused the focus change.
     * Used internally to differentiate between click and keyboard interactions.
     *
     * @private
     * @default false
     */
    byClick?: boolean;

    /**
     * Contains arguments for the keyboard event that triggered the focus, if applicable.
     * Provides details about the keypress, such as key code or modifiers, for advanced handling.
     * Used to process keyboard-driven focus navigation.
     *
     * @default null
     * @private
     */
    keyArgs?: Object;

    /**
     * Indicates whether the focus change involves a jump to a non-adjacent cell.
     * When true, signifies a non-sequential focus move, such as to a specific cell or section.
     * Used to handle special navigation cases like home/end key actions.
     *
     * @default false
     * @private
     */
    isJump?: boolean;

    /**
     * Contains information about the container of the focused cell, such as content or header.
     * Provides context about the grid section (e.g., content, header, aggregate) where focus resides.
     * Used to manage focus within specific grid areas.
     *
     * @default null
     * @private
     */
    container?: Object;

    /**
     * Determines whether the focus outline is displayed for the focused cell.
     * When true, shows a visual focus indicator. When false, suppresses the outline for styling.
     * Enhances the user experience by controlling focus visibility.
     *
     * @default true
     * @private
     */
    outline?: boolean;

    /**
     * Contains information about matrix swapping during focus navigation.
     * Provides details about transitions between different matrix types (e.g., content to header).
     * Used internally to manage focus across grid sections.
     *
     * @default null
     * @private
     */
    swapInfo?: Object;

    /**
     * Determines whether the focus action should be prevented.
     * When set to true, cancels the focus change, allowing validation or conditional logic.
     * Used in event handlers to control focus behavior.
     *
     * @private
     */
    cancel?: boolean;
}

/**
 * Enumerates the matrix types used for focus navigation in the Data Grid.
 * Defines the grid sections (content, header, or aggregate) for focus management.
 * Used internally to differentiate focus contexts during navigation.
 *
 * @private
 */
export type Matrix = 'Content' | 'Header' | 'Aggregate';

/**
 * Defines information for swapping focus between matrices during navigation in the Data Grid.
 * Specifies details about transitions between grid sections, such as content or header.
 * Used internally to manage focus movement across different matrix types.
 *
 * @private
 */
export interface SwapInfo {
    /**
     * Indicates whether a matrix swap is required during focus navigation.
     * When true, triggers a transition to a different matrix type (e.g., from content to header).
     * Used to manage focus movement between grid sections.
     *
     * @default false
     */
    swap?: boolean;

    /**
     * Indicates whether focus should move to the header matrix.
     * When true, directs navigation to the header section of the grid.
     * Used to control transitions to column headers during focus navigation.
     *
     * @default false
     */
    toHeader?: boolean;

    /**
     * Specifies the target matrix type for focus navigation.
     * Defines the grid section (content, header, or aggregate) to move focus to.
     * Guides the focus system to the appropriate matrix during swaps.
     *
     * @default 'Content'
     */
    toMatrix?: Matrix;
}

/**
 * Defines the return value of the useFocusStrategy hook in the Data Grid.
 * Provides methods and properties for managing focus navigation, cell selection, and grid focus state.
 * Used internally to control focus behavior and interactions within the grid.
 *
 * @private
 */
export interface FocusStrategyResult {
    /**
     * Retrieves information about the currently focused cell in the grid.
     * Returns details such as row and column indexes, element references, and focus context.
     * Used to access the current focus state for processing or UI updates.
     *
     * @returns {FocusedCellInfo} The focused cell information.
     */
    getFocusedCell: () => FocusedCellInfo;

    /**
     * A React RefObject holding the current focused cell information in the Data Grid.
     * Provides persistent access to the focused cell state across component re-renders.
     * Enables imperative focus management by storing the FocusedCellInfo with detailed cell context.
     *
     * @default {}
     */
    focusedCell: RefObject<FocusedCellInfo>;

    /**
     * Indicates whether the grid currently has focus.
     * When true, signifies that the grid or one of its elements is actively focused; when false, indicates no focus.
     * Used to track the grid’s focus state for navigation or interaction handling.
     *
     * @default false
     */
    isGridFocused: boolean;

    /**
     * Indicates whether the current focus was triggered by a mouse click event.
     * When true, signifies that a click caused the focus change; when false, indicates another trigger like keyboard input.
     * Used to differentiate between click-based and other focus mechanisms.
     *
     * @default false
     */
    focusByClick: boolean;

    /**
     * Sets the focus state of the grid.
     * Updates whether the grid or its elements should be focused, controlling the active focus state.
     * Used to programmatically manage focus for accessibility or user interactions.
     *
     * @param {boolean} isFocused - Whether the grid should be focused.
     * @returns {void}
     */
    setGridFocus: (isFocused: boolean) => void;

    /**
     * Retrieves the focus matrix for the grid’s content area.
     * Returns the matrix representing focusable cells in the content section, used for navigation.
     * Enables focus management within the grid’s data rows.
     *
     * @returns {IFocusMatrix} The content focus matrix.
     */
    getContentMatrix: () => IFocusMatrix;

    /**
     * Retrieves the focus matrix for the grid’s header area.
     * Returns the matrix representing focusable cells in the header section, used for column header navigation.
     * Enables focus management within the grid’s header elements.
     *
     * @returns {IFocusMatrix} The header focus matrix.
     */
    getHeaderMatrix: () => IFocusMatrix;

    /**
     * Retrieves the focus matrix for the grid’s aggregate area.
     * Returns the matrix representing focusable cells in the aggregate (e.g., footer) section, used for summary row navigation.
     * Enables focus management within the grid’s aggregate elements.
     *
     * @returns {IFocusMatrix} The aggregate focus matrix.
     */
    getAggregateMatrix: () => IFocusMatrix;

    /**
     * Retrieves the currently active focus matrix for navigation.
     * Returns the matrix (content, header, or aggregate) currently used for focus operations.
     * Used to determine the active focus context within the grid.
     *
     * @returns {IFocusMatrix} The active focus matrix.
     */
    getActiveMatrix: () => IFocusMatrix;

    /**
     * Sets the active matrix type for focus navigation.
     * Updates the focus context to the specified matrix type (content, header, or aggregate).
     * Used to switch focus navigation between different grid sections.
     *
     * @param {Matrix} matrixType - The matrix type to set as active.
     * @returns {void}
     */
    setActiveMatrix: (matrixType: Matrix) => void;

    /**
     * Sets focus to the grid or a specific cell, optionally triggered by a keyboard event.
     * Activates focus on the grid or a targeted cell, updating the UI and focus state.
     * Used for programmatic focus changes or user-driven navigation.
     *
     * @param {KeyboardEvent} e - Optional. The keyboard event that triggered focus.
     * @param {React.FocusEvent} focus - Optional. The focus event that triggered focus.
     * @returns {void}
     */
    focus: (e?: KeyboardEvent, focus?: React.FocusEvent) => void;

    /**
     * Removes focus from the grid.
     * Clears the current focus state, removing focus from any cell or grid element.
     * Used to reset focus for UI updates or navigation transitions.
     *
     * @returns {void}
     */
    removeFocus: () => void;

    /**
     * Removes the tab index from all focusable elements in the grid.
     * Disables keyboard navigation by clearing tab index attributes, preventing focus via Tab key.
     * Used to control accessibility behavior or focus management.
     *
     * @returns {void}
     */
    removeFocusTabIndex: () => void;

    /**
     * Applies focus to a specific cell based on provided cell information.
     * Updates the focus state to highlight the specified cell, optionally triggered by a keyboard event.
     * Used for precise focus control in response to user or programmatic actions.
     *
     * @param {FocusedCellInfo} info - The cell information to focus.
     * @param {KeyboardEvent} e - Optional. The keyboard event that triggered focus.
     * @returns {void}
     */
    addFocus: (info: FocusedCellInfo, e?: KeyboardEvent) => void;

    /**
     * Retrieves detailed information about the current focus state.
     * Returns the FocusedCellInfo object with details like row and column indexes, element references, and context.
     * Used to access the current focus for processing or UI updates.
     *
     * @returns {FocusedCellInfo} The current focus information.
     */
    getFocusInfo: () => FocusedCellInfo;

    /**
     * Sets the tab index for the first focusable element in the grid.
     * Ensures the first focusable cell or element is accessible via keyboard navigation.
     * Enhances accessibility by defining the initial focus point for Tab key navigation.
     *
     * @returns {void}
     */
    setFirstFocusableTabIndex: () => void;

    /**
     * Sets focus to the content area of the grid.
     * Moves focus to the content section, typically the first focusable cell in the data rows.
     * Used to initiate focus navigation within the grid’s main data area.
     *
     * @returns {void}
     */
    focusContent: () => void;

    /**
     * Applies a focus outline to the currently focused cell.
     * Adds a visual indicator (e.g., CSS class) to highlight the focused cell in the UI.
     * Enhances user experience by visually marking the active cell.
     *
     * @returns {void}
     */
    addOutline: () => void;

    /**
     * Removes the focus outline or indicator from the currently focused cell.
     * Clears any visual markers (e.g., CSS class) used to highlight the focused cell.
     * Used to reset the UI or manage focus visibility.
     *
     * @returns {void}
     */
    clearIndicator: () => void;

    /**
     * Processes keyboard events to handle focus navigation within the grid.
     * Interprets keypresses (e.g., arrow keys, Tab) to move focus between cells or sections.
     * Enhances accessibility by enabling keyboard-driven navigation.
     *
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {void}
     */
    handleKeyDown: (event: KeyboardEvent) => void;

    /**
     * Processes mouse click events to manage focus within the grid.
     * Updates the focus state based on user clicks on cells or other focusable elements.
     * Used to handle click-based focus changes and UI updates.
     *
     * @param {MouseEvent} event - The mouse event.
     * @returns {void}
     */
    handleGridClick: (event: MouseEvent) => void;

    /**
     * Navigates focus to a specific cell identified by row and column indexes.
     * Moves focus to the specified cell, optionally within a given matrix type (content, header, or aggregate).
     * Used for precise programmatic navigation to a target cell.
     *
     * @param {number} rowIndex - The row index to navigate to.
     * @param {number} colIndex - The column index to navigate to.
     * @param {Matrix} matrixType - Optional. The matrix type containing the cell.
     * @returns {void}
     */
    navigateToCell: (rowIndex: number, colIndex: number, matrixType?: Matrix) => void;

    /**
     * Navigates focus to the next cell in the specified direction.
     * Moves focus based on directions like 'up', 'down', 'left', 'right', 'nextCell', or 'prevCell'.
     * Used for sequential navigation through focusable cells in the grid.
     *
     * @param {'up' | 'down' | 'left' | 'right' | 'nextCell' | 'prevCell'} direction - The navigation direction.
     * @returns {void}
     */
    navigateToNextCell: (direction: 'up' | 'down' | 'left' | 'right' | 'nextCell' | 'prevCell') => void;

    /**
     * Navigates focus to the first focusable cell in the grid.
     * Moves focus to the initial focusable cell, typically in the content or header matrix.
     * Used for quick navigation to the starting point of focusable elements.
     *
     * @returns {void}
     */
    navigateToFirstCell: () => void;

    /**
     * Navigates focus to the last focusable cell in the grid.
     * Moves focus to the final focusable cell, typically in the content or aggregate matrix.
     * Used for quick navigation to the end of focusable elements.
     *
     * @returns {void}
     */
    navigateToLastCell: () => void;

    /**
     * Determines whether a keyboard event corresponds to a navigation key.
     * Checks if the event involves keys like arrow keys, Tab, or Home/End for focus navigation.
     * Used to filter relevant keypresses for navigation handling.
     *
     * @param {KeyboardEvent} event - The keyboard event to check.
     * @returns {boolean} True if it's a navigation key.
     */
    isNavigationKey: (event: KeyboardEvent) => boolean;

    /**
     * Determines the navigation direction from a keyboard event.
     * Maps keypresses (e.g., arrow keys) to direction strings like 'up', 'down', 'left', or 'right'.
     * Used to interpret user intent for focus navigation.
     *
     * @param {KeyboardEvent} event - The keyboard event.
     * @returns {string} The navigation direction string.
     */
    getNavigationDirection: (event: KeyboardEvent) => string;

    /**
     * Checks if keyboard navigation should occur within command items in a command column cell.
     * Validates that the event is triggered within a command cell and involves navigation keys.
     * Returns true if the next command item should be focused, false otherwise.
     *
     * @param {KeyboardEvent} e - The keyboard event from arrow keys, Tab, or Shift+Tab
     * @returns {boolean} True if navigation should occur within command items, false otherwise
     */
    isNextCommandItem: (e: KeyboardEvent) => boolean;

    /**
     * Retrieves all command item buttons from a command cell element.
     * Queries the command cell container for all focusable button elements.
     * Returns an array of button elements that can be navigated using arrow keys.
     *
     * @param {HTMLElement} element - The command cell element containing command buttons
     * @returns {HTMLElement[]} Array of button elements found in the command cell
     */
    getCommandItems: (element: HTMLElement) => HTMLElement[];

    /**
     * Handles Tab navigation exit from inline edit rows back to the data grid.
     * Manages focus transition when tabbing out of edit/add rows to adjacent data rows or matrix sections.
     * Supports boundary navigation between Header, Content, and Aggregate matrices.
     *
     * @param {KeyboardEvent} e - Keyboard event (typically Tab or Shift+Tab for navigation)
     * @returns {void}
     */
    editToRow: (e: KeyboardEvent) => void;

    /**
     * Retrieves the indexes of the previously focused cell.
     * Returns an object with row and cell indexes of the prior focused cell, if applicable.
     * Used to track focus history for navigation or state management.
     *
     * @returns {{ rowIndex?: number, cellIndex?: number }} The previous indexes.
     */
    getPrevIndexes: () => { rowIndex?: number, cellIndex?: number };

    /**
     * Stores the index of the first focusable cell in the content area as [rowIndex, colIndex].
     * Identifies the starting point for focus navigation in the grid’s data rows.
     * Used to initialize focus or navigate to the first content cell.
     *
     * @default []
     */
    firstFocusableContentCellIndex: number[];

    /**
     * Stores the index of the first focusable cell in the header area as [rowIndex, colIndex].
     * Identifies the starting point for focus navigation in the grid’s column headers.
     * Used to initialize focus or navigate to the first header cell.
     *
     * @default []
     */
    firstFocusableHeaderCellIndex: number[];

    /**
     * Stores the index of the last focusable cell in the content area as [rowIndex, colIndex].
     * Identifies the ending point for focus navigation in the grid’s data rows.
     * Used to navigate to the final content cell.
     *
     * @default []
     */
    lastFocusableContentCellIndex: number[];

    /**
     * Stores the index of the last focusable cell in the header area as [rowIndex, colIndex].
     * Identifies the ending point for focus navigation in the grid’s column headers.
     * Used to navigate to the final header cell.
     *
     * @default []
     */
    lastFocusableHeaderCellIndex: number[];

    /**
     * Stores the index of the first focusable cell in the aggregate area as [rowIndex, colIndex].
     * Identifies the starting point for focus navigation in the grid’s summary or footer rows.
     * Used to initialize focus or navigate to the first aggregate cell.
     *
     * @default []
     */
    firstFocusableAggregateCellIndex: number[];

    /**
     * Stores the index of the last focusable cell in the aggregate area as [rowIndex, colIndex].
     * Identifies the ending point for focus navigation in the grid’s summary or footer rows.
     * Used to navigate to the final aggregate cell.
     *
     * @default []
     */
    lastFocusableAggregateCellIndex: number[];
}

/**
 * Defines callback functions for focus-related events in the Data Grid.
 * Specifies handlers for cell focus, click, and pre-focus events to customize focus behavior.
 * Used internally to manage focus-related interactions.
 *
 * @private
 */
export interface FocusStrategyCallbacks {
    /**
     * Invoked when a cell receives focus in the grid.
     * Provides event arguments to process or respond to the focus change, such as updating UI or state.
     * Used to handle post-focus logic for user or programmatic interactions.
     *
     * @param {CellFocusEvent} event - The cell focus event arguments.
     * @event cellFocused
     */
    onCellFocus?: (event: CellFocusEvent) => void;

    /**
     * Invoked when a cell is clicked in the grid.
     * Provides event arguments to process click-based focus changes or trigger related actions.
     * Used to handle user interactions that involve clicking cells.
     *
     * @param {CellFocusEvent} event - The cell focus event arguments.
     * @event cellClick
     */
    onCellClick?: (event: CellFocusEvent) => void;

    /**
     * Invoked before a cell receives focus, allowing cancellation of the focus action.
     * Provides event arguments to validate or modify the focus change before it occurs.
     * Used to control focus behavior with conditional logic.
     *
     * @param {CellFocusEvent} event - The cell focus event arguments.
     * @event beforeCellFocus
     */
    beforeCellFocus?: (event: CellFocusEvent) => void;
}

/**
 * Defines information about a focused cell in the Data Grid.
 * Provides detailed context about the cell’s position, DOM element, and focus properties.
 * Used internally to manage focus state and navigation.
 *
 * @private
 */
export interface FocusedCellInfo {
    /**
     * Specifies the zero-based row index of the focused cell.
     * Identifies the row position of the cell within the grid’s data or structure.
     * Used to track the focused cell’s location for navigation or processing.
     *
     * @default -
     */
    rowIndex: number;

    /**
     * Specifies the zero-based column index of the focused cell.
     * Identifies the column position of the cell within the grid’s data or structure.
     * Used to track the focused cell’s location for navigation or processing.
     *
     * @default -
     */
    colIndex: number;

    /**
     * Indicates whether the focused cell is located in the header section of the grid.
     * When true, signifies the cell is part of the column headers; when false, indicates content or aggregate.
     * Used to determine the focus context within the grid’s structure.
     *
     * @default false
     */
    isHeader: boolean;

    /**
     * Indicates whether the focused cell is located in the aggregate section of the grid.
     * When true, signifies the cell is part of the summary or footer rows; when false, indicates content or header.
     * Used to determine the focus context within summary sections.
     *
     * @default false
     */
    isAggregate?: boolean;

    /**
     * References the DOM element of the focused cell.
     * Provides access to the cell’s HTMLElement for manipulation, styling, or focus management.
     * Used to update the UI or interact with the focused cell.
     *
     * @default null
     */
    element?: HTMLElement;

    /**
     * References the specific element within the cell that should receive focus.
     * Identifies a sub-element (e.g., input or button) within the cell for precise focus targeting.
     * Used to handle complex cells with focusable components.
     *
     * @default null
     */
    elementToFocus?: HTMLElement;

    /**
     * Specifies a unique identifier for the focused cell.
     * Used to track the cell across operations or for state management within the grid.
     * Ensures accurate reference to the focused cell in dynamic scenarios.
     *
     * @default -
     */
    uid?: string;

    /**
     * Determines whether the focus action for the cell should be skipped.
     * When true, prevents the cell from receiving focus, allowing navigation to bypass it.
     * Used to control focus behavior in specific scenarios.
     *
     * @default false
     */
    skipAction?: boolean;

    /**
     * Determines whether to apply a focus outline (e.g., sf-focused CSS class) to the cell.
     * When true, displays a visual indicator for the focused cell; when false, suppresses the outline.
     * Enhances user experience by controlling focus visibility.
     *
     * @default true
     */
    outline?: boolean;
}
