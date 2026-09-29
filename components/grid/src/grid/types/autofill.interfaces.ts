import { RowCellInfo } from './cell-selection.interfaces';
import { ValueType, GroupedData, UseDataResult, ServiceLocator } from './';
import { ColumnProps } from './column.interfaces';
import { RefObject, Dispatch, SetStateAction } from 'react';
import { GridRef } from './grid.interfaces';
import { SelectionSettings } from './selection.interfaces';
import { EditSettings } from './edit.interfaces';
import { CellSelectionModel } from './cell-selection.interfaces';
import { Clipboard, ClipboardCopyEvent, ClipboardPasteEvent, ClipboardCutEvent } from './clipboard.interfaces';
import { UseUndoRedoResult } from './undoredo.interfaces';
import { editModule } from './edit.interfaces';
import { FocusStrategyResult } from './focus.interfaces';
import { UseCommandColumnResult } from './command.interfaces';
import { VirtualSettings } from './virtualization.interface';
import { PinningModuleResult } from './pinning.interfaces';
import { StagedRowData } from './batch-edit.interfaces';

/**
 * Represents the direction for cell fill operations.
 * Supported directions remain internal: down, up, left, right.
 * External fill permission settings use row, column, or both.
 * If direction handling changes, update all dependent code and cellFillSettings documentation.
 *
 * @private
 */
export type FillDirection = 'down' | 'up' | 'left' | 'right';

/**
 * Represents the type of fill pattern detected from source cells.
 * Used to determine how values should be propagated during fill operations.
 *
 * @private
 */
export type SeriesFillPattern = 'numeric' | 'text' | 'single' | 'numericTrend';

/**
 * Represents a single cell with its position and key information for fill operations.
 *
 * @private
 */
export interface AutoFillTarget {
    /**
     * Primary key value of the row containing the cell.
     */
    rowKey: string | number;

    /**
     * Field name (column identifier) of the cell.
     */
    fieldName: string;

    /**
     * Zero-based row index in the current viewport.
     */
    rowIndex: number;

    /**
     * Zero-based column index in visible columns.
     */
    columnIndex: number;
}

/**
 * Represents detected pattern information for a series of cell values.
 * Analyzes source cells to detect numeric sequences, text patterns, or simple repetition.
 *
 * @private
 */
export interface SeriesPattern {
    /**
     * Type of pattern detected: 'numeric' for number sequences, 'text' for text patterns, 'single' for single value.
     */
    pattern: SeriesFillPattern;

    /**
     * Numeric increment for detected number sequences.
     * Only populated when pattern is 'numeric'.
     * Example: For sequence [10, 20, 30], increment is 10.
     */
    step?: number;

    /**
     * Array of source values used to detect the pattern.
     * For 'numeric': the base values in the sequence.
     * For 'text': the values to repeat.
     * For 'single': the single value to copy.
     */
    baseValues: ValueType[];

    /**
     * Trend line slope for non-uniform numeric sequences.
     * Only populated when pattern is 'numericTrend'.
     */
    slope?: number;

    /**
     * Trend line intercept for non-uniform numeric sequences.
     * Only populated when pattern is 'numericTrend'.
     */
    intercept?: number;
}

/**
 * Represents the source selection that will be used as the fill template.
 * Captures selected cells, their values, detected patterns, and column metadata.
 *
 * @private
 */
export interface FillSourceSelection {
    /**
     * Array of rows with selected cells and their values.
     */
    selectedRowCells: RowCellInfo[];

    /**
     * Field names (columns) that are part of the selection.
     */
    selectedFieldNames: string[];

    /**
     * Extracted values from source cells, indexed by field name.
     * Key: field name, Value: array of cell values for that field.
     */
    cellValuesByField: { [fieldName: string]: ValueType[] };

    /**
     * Column definitions for selected fields used for validation and formatting.
     */
    columnsByField: { [fieldName: string]: ColumnProps };

    /**
     * Detected fill pattern for each field.
     * Used to determine how to propagate values during fill.
     */
    detectedPatternsByField: { [fieldName: string]: SeriesPattern };
}

/**
 * Represents the destination area where cells will be filled.
 * Specifies the range of cells to receive fill values based on drag direction and distance.
 *
 * @private
 */
export interface AutoFillRange {
    /**
     * Array of source cells that provide the fill values.
     * If not provided, the source selection will be used to determine fill values.
     * This allows for programmatic fill operations without requiring a user selection.
     */
    sourceCells?: AutoFillTarget[];
    /**
     * Array of destination cells that will receive fill values.
     */
    targetCells: AutoFillTarget[];

    /**
     * Direction of the fill operation: 'down', 'up', or 'right'.
     */
    direction: FillDirection;

    /**
     * Number of cells to fill in the specified direction.
     * For vertical fills: number of rows to fill.
     * For horizontal fills: number of columns to fill.
     */
    fillCount: number;

    /**
     * Indicates if the Alt key was pressed during the fill operation.
     */
    isAltFill?: boolean;
}

/**
 * Represents a filled cell value with validation and metadata.
 * Tracks the result of filling a single cell during fill operations.
 *
 * @private
 */
export interface FilledCell {
    /**
     * Field name of the filled cell.
     */
    fieldName: string;

    /**
     * Value that was populated into the cell.
     */
    filledValue: ValueType;
}

/**
 * Configuration options for cell fill (autofill) feature.
 * Controls behavior, allowed directions, and custom fill logic.
 *
 * @default { isEnabled: false, allowedDirection: 'both' }
 */
export interface CellFillOperationArgs {
    /**
     * The destination cell being filled.
     */
    cell: AutoFillTarget;

    /**
     * Zero-based position within the current fill sequence.
     */
    cellPosition: number;

    /**
     * Source selection data used as the fill template.
     */
    source: FillSourceSelection;

    /**
     * Destination range for the active fill operation.
     */
    fillRange: AutoFillRange;

    /**
     * Field name associated with the source value being evaluated.
     */
    fieldName: string;

    /**
     * Current value used to determine the next fill value.
     */
    currentValue: ValueType;

    /**
     * All source values for the active field in the selected range.
     */
    sourceValues: ValueType[];

    /**
     * Column definition for the current field when available.
     */
    column?: ColumnProps;
}

export interface AutoFillSettings {
    /**
     * Enables or disables the cell fill feature in the grid.
     * When enabled, users can drag from selected cells to fill adjacent cells with patterns or sequences.
     * Requires cell selection to be active and editing to be enabled.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid
     *   editSettings={{ allowEdit: true }}
     *   cellFillSettings={{ enabled: true }}
     * />
     * ```
     */
    enabled?: boolean;

    /**
     * Specifies which axes are allowed for cell fill operations.
     * - 'row': Allows horizontal fill only (left and right).
     * - 'column': Allows vertical fill only (up and down).
     * - 'both': Allows fill in all directions.
     *
     * @default 'both'
     *
     * @example
     * ```tsx
     * // Allow only vertical fill
     * <Grid
     *   editSettings={{ allowEdit: true }}
     *   cellFillSettings={{ isEnabled: true, allowedDirection: 'column' }}
     * />
     * ```
     */
    allowedDirection?: 'row' | 'column' | 'both';

    /**
     * Determines whether to clear cells when reducing the fill range.
     * When false (default), dragging backward clears the previously filled cells to null.
     * When true, can't drag backward to reduce the range.
     *
     * @default false
     *
     * @example
     * ```tsx
     * // Preserve values when user drags backward to reduce range
     * <Grid
     *   editSettings={{ allowEdit: true }}
     *   cellFillSettings={{ isEnabled: true, preventBackwardFill: false }}
     * />
     * ```
     */
    preventBackwardFill?: boolean;

    /**
     * Custom callback to override default fill value logic.
     * Called for each destination cell to determine what value should be filled.
     * Return the fill value, or return false to use the default algorithm.
     *
     * @param {Object} args - Fill operation arguments
     * @param {AutoFillTarget} args.cell - Destination cell being filled
     * @param {number} args.cellPosition - Position index in the fill sequence (0-based)
     * @param {FillSourceSelection} args.source - Source selection data
     * @param {AutoFillRange} args.fillRange - The range being filled
     * @param {string} args.fieldName - Field name associated with the source value being used for this fill calculation.
     *  @param {ValueType} args.currentValue - Current source value used for calculating the destination value.
     * @param {ValueType[]} args.sourceValues - All source values from the selected range for the current field.
     * @param {ColumnProps} [args.column] - Column definition associated with the current field.
     * @returns {ValueType | false} Value to fill, or false for default behavior
     *
     * @example
     * ```tsx
     * <Grid
     *   editSettings={{ allowEdit: true }}
     *   cellFillSettings={{
     *     isEnabled: true,
     *     fillOperation: (args) => {
     *       if (args.fieldName !== 'DayOfWeek') {
     *         return false;
     *       }
     *       const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
     *       const currentIndex = days.indexOf(String(args.currentValue));
     *       if (currentIndex === -1) {
     *         return false;
     *       }
     *       const nextIndex = (currentIndex + 1) % days.length;
     *       return days[nextIndex];
     *     }}}
     * />
     * ```
     */
    fillOperation?: (args: CellFillOperationArgs) => ValueType | false;

    /**
     * Determines whether a specific column should be excluded from autofill operations.
     * When a column is marked as skipped, its cells retain their existing values and do not participate in fill operations.
     * Called during autofill processing for each column in the selection.
     *
     * @param {string} fieldName - The column field name being evaluated
     * @returns {boolean} True to skip autofill for this column, false to include in autofill
     *
     * @default false (all columns are filled by default)
     *
     * @example
     * ```tsx
     * // Skip autofill for Country column, preserving existing values
     * <Grid
     *   editSettings={{ allowEdit: true }}
     *   cellFillSettings={{
     *     isEnabled: true,
     *     excludeFromAutoFill: (fieldName) => {
     *       return fieldName === 'Country';
     *     }
     *   }}
     * />
     * ```
     */
    excludeFromAutoFill?: (fieldName: string) => boolean;
}

/**
 * Defines grid event callbacks consumed by the autofill module.
 *
 * @template T - The data type of grid rows
 * @private
 */
export interface AutoFillProps<T = unknown> {
    /**
     * Fires before autofill values are applied.
     */
    onCellFillStart?: (args: CellFillStartedEvent) => void;

    /**
     * Fires after autofill values are applied.
     */
    onCellFillComplete?: (args: CellFillCompletedEvent<T>) => void;

    /**
     * Fires when grid data is copied to the clipboard.
     */
    onClipboardCopy?: (args: ClipboardCopyEvent) => void;

    /**
     * Fires when clipboard data is pasted into the grid.
     */
    onClipboardPaste?: (args: ClipboardPasteEvent) => void;

    /**
     * Fires when grid data is cut to the clipboard.
     */
    onClipboardCut?: (args: ClipboardCutEvent) => void;
}

/**
 * Event arguments fired when cell fill operation initiates.
 * Allows validation or cancellation of the fill operation before values are applied.
 */
export interface CellFillStartedEvent {
    /**
     * Source cells selected by user before fill drag began.
     */
    source: FillSourceSelection;

    /**
     * Destination range targeted by the fill operation.
     */
    fillRange: AutoFillRange;

    /**
     * Flag to cancel the fill operation.
     * Set to true to prevent the fill from applying any changes.
     *
     * @default false
     */
    cancel?: boolean;
}

/**
 * Event arguments fired when cell fill operation completes successfully.
 * Provides details about filled cells and modified records.
 */
export interface CellFillCompletedEvent<T = unknown> {
    /**
     * Source cells that were used as the fill template.
     */
    source: FillSourceSelection;

    /**
     * Range that was filled with values.
     */
    fillRange: AutoFillRange;

    /**
     * Records that were modified during the fill operation.
     * Each record contains updated field values for affected rows.
     */
    modifiedRecords: T[];

    /**
     * Map of filled cells with their values and validation status.
     * Key format: "rowKey:fieldName".
     */
    filledCellsDetail: { [cellKey: string]: FilledCell };

}

/**
 * Return type of useCellFill hook.
 *
 * @private
 */
export interface AutoFill {
    /**
     * Validates whether autofill is available for the current grid configuration and source cells.
     *
     * @private
     */
    isAutoFillAllowed?: (sourceCells?: AutoFillTarget[]) => boolean;

    /**
     * Renders the fill handle (small draggable square) at the bottom-right corner of the selection.
     * The fill handle is used to initiate fill operations by dragging.
     *
     * @returns {void}
     *
     */
    showFillHandle?: () => void;

    /**
     * Removes the fill handle from the DOM.
     *
     * @returns {void}
     *
     */
    removeFillHandle?: () => void;

    /**
     * Clipboard module instance created internally by useAutoFill.
     * Provides copy, cut, and paste functionality for autofill operations.
     *
     */
    clipboardModule?: Clipboard;

    /**
     * Edit module instance created internally when editing is not injected.
     */
    editModule?: editModule;

    /**
     * applies the fill operation to the specified range of cells.
     * Uses the source selection to determine values and patterns to fill into the target cells.
     * @param fillRange
     * @returns
     */
    applyFill: (fillRange: AutoFillRange) => Promise<void>;
}

/**
 * Options for initializing the autofill module.
 * Includes autofill configuration and all clipboard parameters needed internally.
 *
 * @template T - The data type of grid rows
 * @private
 */
export interface AutoFillModuleOptions<T = unknown> {
    /** Reference to the grid component. */
    gridRef: RefObject<GridRef<T>>;

    /** Current view data for the active page or view. */
    currentViewData: T[];

    /** Visible columns used by autofill. */
    visibleColumns: ColumnProps<T>[];

    /** Cell selection configuration. */
    selectionSettings: SelectionSettings;

    /** Cell selection module used to read the source range. */
    cellSelectionModule: CellSelectionModel;

    /** Edit configuration required for fill operations. */
    editSettings: EditSettings<T>;

    /** Autofill configuration options. */
    autoFillSettings?: AutoFillSettings;

    /** Grid event callbacks consumed by autofill. */
    props?: AutoFillProps<T>;

    /** Map of field names to their column definitions. */
    columnMap?: Map<string, ColumnProps<T>>;

    /** Data operations utilities. */
    dataOperations?: UseDataResult<T>;

    /** Setter for current view data. */
    setCurrentViewData?: Dispatch<SetStateAction<(GroupedData<T> | T)[]>>;

    /** Map of field names to their column order indices. */
    fieldOrderMap?: Map<string, number>;

    /** Row selection module for row-based clipboard operations. */
    selectionModule?: any;

    /** Callback to update entire row after clipboard paste. */
    setRowData?: (key: string | number, data: T, isDataSourceChangeRequired?: boolean) => void;

    /** Clipboard configuration options. */
    clipboardSettings?: any;

    /** Setter to trigger aggregate recalculation after clipboard operations. */
    setResponseData?: Dispatch<SetStateAction<Object>>;

    /** Undo/redo history module shared with the grid clipboard operations. */
    undoRedoModule?: UseUndoRedoResult;

    /** Tracks additive cell selection for internal autofill handle visibility. */
    isCtrlKeySelectionRef?: RefObject<boolean>;

    /** Existing edit module instance supplied by the grid when editing is injected. */
    editModule?: editModule<T>;

    /** Dependencies used to create the internal edit module. */
    serviceLocator: ServiceLocator;
    focusModule: FocusStrategyResult;
    setGridAction: Dispatch<SetStateAction<Object>>;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    commandColumnModule: UseCommandColumnResult<T>;
    virtualSettings: VirtualSettings;
    pinningModule?: PinningModuleResult<T>;
    batchEditStagedRowsRef?: RefObject<Map<string | number, StagedRowData<T>>>;
}

/**
 * Type definition for the autofill module.
 * The module is a function, typically the useAutoFill hook, that accepts AutoFillModuleOptions
 * and returns an AutoFill instance.
 *
 * @template T - The data type of grid rows
 *
 * @example
 * ```tsx
 * import { Grid, AutoFillModule } from '@syncfusion/react-grid';
 *
 * <Grid
 *   dataSource={data}
 *   modules={{ AutoFillModule }}
 * />
 * ```
 */
export type AutoFillModuleType<T = unknown> = (
    options: AutoFillModuleOptions<T>
) => AutoFill;
