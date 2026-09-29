import { RowCellInfo } from './cell-selection.interfaces';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { ColumnProps } from './column.interfaces';
import { CellSelectionModel } from './cell-selection.interfaces';
import { SelectionSettings } from './selection.interfaces';
import { EditSettings } from './edit.interfaces';
import { GroupedData } from '../..';
import { UseDataResult } from './interfaces';
import { ValueType } from './';
import { UndoRedoAction } from './undoredo.interfaces';

/**
 * Interface for the result of useClipboard hook
 *
 * @private
 */
export interface Clipboard {
    /**
     * Copies the currently selected cells or rows to the clipboard.
     */
    copyToClipboard: (withHeaders?: boolean) => Promise<void>;

    /**
     * Pastes clipboard data into the grid starting from the active cell.
     */
    pasteFromClipboard: (clipboardText: string) => void;

    /**
     * Cuts the currently selected cells or rows: copies to clipboard and clears the selected editable cells.
     * Primary key columns are preserved during cut operations.
     */
    cutToClipboard: () => Promise<void>;

    /**
     * Validates a pasted value against the target column type.
     */
    validatePastedValue?: (rawValue: string, column: ColumnProps | undefined) => { value: ValueType | null, isInvalid: boolean };

    /**
     * Internal flag used to suppress selection reset during clipboard updates.
     *
     */
    isClipboardOperation: RefObject<boolean>;

    /**
     * Saves modified records to the data source after clipboard operations.
     * Used internally by the clipboard module to persist changes.
     */
    saveClipboardBulkChanges?: (records: unknown[], actionType?: UndoRedoAction['actionType']) => Promise<boolean>;
}


/**
 * Configures clipboard copy, paste, and cut functionality for the grid.
 * Controls whether users can copy, paste, and cut cell/row data to and from the clipboard.
 *
 * @default { enabled: true }
 *
 * @example
 * ```tsx
 * // Enable all clipboard operations (default)
 * <Grid clipboardSettings={{ enabled: true }} />
 *
 * // Disable all clipboard operations
 * <Grid clipboardSettings={{ enabled: false }} />
 *
 * // Enable copy and paste, but disable cut
 * <Grid clipboardSettings={{ enabled: true, allowCut: false }} />
 * ```
 */
export interface ClipboardSettings {
    /**
     * Enables or disables all clipboard operations (copy, paste, cut) in the grid.
     * When enabled, users can copy, paste, and cut selected cells/rows.
     * When disabled, all clipboard operations are completely blocked.
     * Individual operations can be controlled via allowCut and allowPaste properties.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   columns={columns}
     *   clipboardSettings={{ enabled: false }}
     * />
     * ```
     */
    enabled?: boolean;

    /**
     * Enables or disables cut operations in the grid.
     * When true, users can cut selected cells/rows using Ctrl+X.
     * When false, cut operations are blocked while copy and paste remain functional if enabled.
     * Requires enabled to be true and editSettings.allowDelete to be enabled for cut to work
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   clipboardSettings={{ enabled: true, allowCut: false }}
     * />
     * ```
     */
    allowCut?: boolean;

    /**
     * Enables or disables paste operations in the grid.
     * When true, users can paste clipboard data using Ctrl+V.
     * When false, paste operations are blocked while copy and cut remain functional if enabled.
     * Requires enabled to be true and editSettings.allowEdit to be enabled for paste to work.
     *
     * @default true
     *
     * @example
     * ```tsx
     * <Grid
     *   dataSource={employees}
     *   editSettings={{ allowEdit: true }}
     *   clipboardSettings={{ enabled: true, allowPaste: false }}
     * />
     * ```
     */
    allowPaste?: boolean;

    /**
     * Includes column headers in clipboard copy output by default.
     * When true, plain copy operations include headers, while the existing shortcut for copy with headers still works as before.
     *
     * @default false
     *
     * @example
     * ```tsx
     * <Grid clipboardSettings={{ copyWithHeaders: true }} />
     * ```
     */
    copyWithHeaders?: boolean;

    /**
     * When true, row selection takes precedence over focused cell.
     * Copy/Cut/Paste operate on selected rows.
     *
     * @default false
     */
    allowRowCopy?: boolean;
}

/**
 * Defines event arguments for clipboard copy operations in the Grid component.
 * Provides information about the data being copied, including selected cells or rows,
 * and allows customization or cancellation of the copy operation.
 *
 * Contains contextual information about which rows and columns were copied,
 * along with the formatted clipboard text being written.
 */
export interface ClipboardCopyEvent {
    /**
     * Specifies the type of selection being copied.
     * * `Cell` — Individual cell selections are being copied.
     * * `Row` — Complete rows are being copied.
     *
     * @default undefined
     */
    selectionType?: 'Cell' | 'Row';

    /**
     * Contains the formatted tab-separated or newline-separated text content being copied to clipboard.
     * For rectangular selections, uses tab-separated columns within each row.
     * For scattered selections, uses newline-separated values.
     *
     * @default ''
     */
    clipboardText?: string;

    /**
     * Specifies whether column headers are included in the copied content.
     *
     * @default false
     *
     * @example
     * ```tsx
     * {
     *   clipboardText: 'OrderID\tCustomerName\nOrder1\tJohn\n',
     *   copyWithHeaders: true
     * }
     * ```
     */
    copyWithHeaders?: boolean;

    /**
     * List of selected row indexes being copied.
     * Applicable only when selectionType is `Row`.
     * Contains zero-based row indexes in ascending order.
     *
     * @default []
     */
    selectedRowIndexes?: number[];

    /**
     * List of selected cells being copied.
     * Applicable only when selectionType is `Cell`.
     * Contains row and column information for each selected cell.
     *
     * @default []
     */
    selectedCells?: RowCellInfo[];

    /**
     * Cancel the copy operation. Setting this to true prevents the data from being written to clipboard.
     *
     * @default false
     *
     * @example
     * ```tsx
     * const handleClipboardCopy = (args: ClipboardCopyEvent) => {
     *   // Prevent copying sensitive data
     *   if (args.selectedRowIndexes?.some(idx => sensitiveRowIndices.includes(idx))) {
     *     args.cancel = true;
     *   }
     * };
     * ```
     */
    cancel?: boolean;
}

/**
 * Defines event arguments for clipboard cut operations in the Grid component.
 * Provides information about the data being cut, including selected cells or rows,
 * and allows cancellation of the operation. When successful, cut clears the selected cells/rows.
 *
 * Contains contextual information about what data is being cut and enables validation or custom cut logic.
 */
export interface ClipboardCutEvent {
    /**
     * Specifies the type of selection being cut.
     * * `Cell` — Individual cell selections are being cut.
     * * `Row` — Complete rows are being cut.
     *
     * @default undefined
     */
    selectionType?: 'Cell' | 'Row';

    /**
     * Contains the formatted tab-separated or newline-separated text content being cut to clipboard.
     * For rectangular selections, uses tab-separated columns within each row.
     * For scattered selections, uses newline-separated values.
     *
     * @default ''
     */
    clipboardText?: string;

    /**
     * Specifies whether column headers are included in the cut content.
     *
     * @default false
     *
     * @example
     * ```tsx
     * {
     *   clipboardText: 'OrderID\tCustomerName\nOrder1\tJohn\n',
     *   copyWithHeaders: true
     * }
     * ```
     */
    copyWithHeaders?: boolean;

    /**
     * List of selected row indexes being cut.
     * Applicable only when selectionType is `Row`.
     * Contains zero-based row indexes in ascending order.
     *
     * @default []
     */
    selectedRowIndexes?: number[];

    /**
     * List of selected cells being cut.
     * Applicable only when selectionType is `Cell`.
     * Contains row and column information for each selected cell.
     *
     * @default []
     */
    selectedCells?: RowCellInfo[];

    /**
     * Cancel the cut operation. Setting this to true prevents the data from being written to clipboard and clears the selected cells.
     *
     * @default false
     *
     * @example
     * ```tsx
     * const handleClipboardCut = (args: ClipboardCutEvent) => {
     *   // Prevent cutting primary key columns
     *   if (args.selectedCells?.some(cell => primaryKeyFields.includes(cell.fieldName))) {
     *     args.cancel = true;
     *   }
     * };
     * ```
     */
    cancel?: boolean;
}

/**
 * Defines event arguments for clipboard paste operations in the Grid component.
 * Provides information about the data being pasted, including the source content
 * and target cells or rows, allowing validation or custom paste logic.
 *
 * Contains contextual information about where data is being pasted and what data is being applied.
 */
export interface ClipboardPasteEvent {
    /**
     * Specifies the type of selection where data is being pasted.
     * * `Cell` — Pasting into individual cells.
     * * `Row` — Pasting into complete rows.
     *
     * @default undefined
     */
    selectionType?: 'Cell' | 'Row';

    /**
     * Contains the raw clipboard text being pasted, including tabs and newlines.
     * Raw format before parsing and validation.
     *
     * @default ''
     */
    clipboardText?: string;

    /**
     * Specifies the zero-based row index where the paste operation starts.
     * Indicates the first row receiving pasted data.
     *
     * @default -1
     */
    startRowIndex?: number;

    /**
     * Specifies the zero-based column index where the paste operation starts for cell selections.
     * Indicates the first column receiving pasted data.
     * Applicable only when selectionType is `Cell`.
     *
     * @default -1
     */
    startColumnIndex?: number;

    /**
     * Contains the parsed clipboard data organized as a two-dimensional matrix.
     * Each inner array represents a row of tab-separated values from the clipboard.
     * Format: `[['value1', 'value2'], ['value3', 'value4']]`
     *
     * @default []
     *
     * @example
     * ```tsx
     * {
     *   pasteMatrix: [
     *     ['Order1', 'John', '100'],
     *     ['Order2', 'Jane', '200']
     *   ]
     * }
     * ```
     */
    pasteMatrix?: string[][];

    /**
     * Cancel the paste operation. Setting this to true prevents data from being applied to the grid.
     *
     * @default false
     *
     * @example
     * ```tsx
     * const handleClipboardPaste = (args: ClipboardPasteEvent) => {
     *   // Prevent pasting into read-only rows
     *   if (args.startRowIndex >= readOnlyStartIndex) {
     *     args.cancel = true;
     *   }
     * };
     * ```
     */
    cancel?: boolean;
}

/**
 * Options for initializing the clipboard module.
 * Passed internally by the Grid to configure the clipboard hook.
 *
 * @private
 */
export interface ClipboardModuleOptions<T = unknown> {
    /** Reference to the grid component */
    gridRef: RefObject<any>;

    /** Current view data for the active page or view */
    currentViewData: T[];

    /** Visible columns used for clipboard formatting */
    visibleColumns: ColumnProps[];

    /** Selection configuration for copy, paste, and cut operations */
    selectionSettings?: SelectionSettings;

    /** Cell selection model for clipboard operations */
    cellSelectionModule?: CellSelectionModel;

    /** Selection module for row-based clipboard actions */
    selectionModule?: any;

    /** Callback used to update an entire row after clipboard edits */
    setRowData?: (key: string | number, data: T, isDataSourceChangeRequired?: boolean) => void;

    /** Edit settings for the grid */
    editSettings?: EditSettings<T>;

    /** Clipboard configuration options */
    clipboardSettings?: ClipboardSettings;

    /** Callback fired when data is copied to clipboard */
    onClipboardCopy?: (args: ClipboardCopyEvent) => void;

    /** Callback fired when data is pasted from clipboard */
    onClipboardPaste?: (args: ClipboardPasteEvent) => void;

    /** Callback fired when data is cut from clipboard */
    onClipboardCut?: (args: ClipboardCutEvent) => void;

    /** Callback to trigger aggregate recalculation after clipboard operations */
    setResponseData?: Dispatch<SetStateAction<Object>>;

    /** Callback to update the current view data */
    setCurrentViewData?: Dispatch<SetStateAction<(GroupedData<T> | T)[]>>;

    /** Data operations used to persist clipboard changes */
    dataOperations: UseDataResult<T>;

    /** Undo/redo history module used to record grouped paste actions. */
    undoRedoModule?: import('./undoredo.interfaces').UseUndoRedoResult;

    /** Map of field names to their index positions in visible columns */
    fieldOrderMap?: Map<string, number>;

    /** Map of field names to their corresponding column properties */
    columnMap?: Map<string, ColumnProps<T>>;
}

/**
 * Type definition for the clipboard module.
 * A clipboard module is a function (typically the useClipboard hook) that accepts
 * ClipboardModuleOptions and returns a Clipboard instance with copy, paste, and cut methods.
 *
 * @template T - The data type of grid rows
 *
 * @example
 * ```tsx
 * import { Grid, ClipboardModule } from '@syncfusion/react-grid';
 *
 * <Grid
 *   dataSource={data}
 *   modules={ClipboardModule}
 * />
 * ```
 */
export type ClipboardModuleType<T = unknown> = (
    options: ClipboardModuleOptions<T>
) => Clipboard;
