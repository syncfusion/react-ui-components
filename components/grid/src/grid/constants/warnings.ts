/**
 * Centralized warning messages for the Data Grid.
 *
 * All `console.warn` calls in the grid codebase resolve to a constant or a
 * builder function declared in this file. Centralizing the strings makes it
 * easier to keep messages consistent, audit them, and update them in one place.
 *
 * Conventions:
 *  - Static messages are exposed as `const` values of type `string`.
 *  - Messages that require dynamic values (e.g. row counts, column names) are
 *    exposed as small builder functions returning `string`.
 */

/**
 * Emitted from [src/grid/components/Column.tsx] when a column is configured
 * with `allowGroup=true` without a `field` property.
 */
export const COLUMN_GROUP_FIELD_REQUIRED_MESSAGE: string = [
    '[Grid Column Validation] Column with allowGroup=true must have a \'field\' property defined for grouping to work correctly. '
].join('\n');

/**
 * Builder for the Column validation warning that appends the offending column
 * header text (or "(unnamed)" when the column has no headerText).
 *
 * @private
 * @param {string | undefined} columnHeaderText - Column identification text
 * @returns {string} Column Group Field Required Message
 */
export const buildColumnGroupFieldRequiredMessage: (columnHeaderText: string | undefined) => string =
    (columnHeaderText: string | undefined): string =>
        `${COLUMN_GROUP_FIELD_REQUIRED_MESSAGE}Column: ${columnHeaderText || '(unnamed)'}`;

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when the user has configured
 * Virtual or Infinite ScrollMode against a plain in-memory array.
 */
export const SCROLL_MODE_OVERRIDE_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Local in-memory data does not require server-side handling for Virtual (Known Count)' +
    ' and Infinite (Unknown Count) ScrollModes.',
    '- Detected incompatible configuration with array data source.',
    '- Overriding scrollMode to Auto for optimal performance.',
    '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/#scroll-modes'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when row DOM virtualization is
 * disabled alongside server-side Virtual or Infinite ScrollMode.
 */
export const DISABLE_ROW_DOM_VIRTUALIZATION_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Disabling DOM virtualization on server-side Virtual (Known Count) and Infinite' +
    ' (Unknown Count) ScrollModes is not supported due to invalid configuration.',
    '- Detected incompatible configuration with server-side performance optimization.',
    '- Overriding virtualization type to Both for optimal performance.'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when `height="auto"` is combined
 * with row DOM virtualization.
 */
export const AUTO_HEIGHT_OVERRIDE_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Auto height is not compatible with row DOM virtualization.',
    '- Detected height set to "auto" with virtualization settings.',
    '- Use either responsive grid height (100%) with a parent container static' +
    ' height (e.g., 90vh) or a fixed static height (e.g., 90vh) for optimal performance.',
    '- Overriding virtualization type to Column for optimal layout handling.',
    '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/#row-virtualization'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when ScrollMode.Infinite is used
 * with a local array data source.
 */
export const INFINITE_SCROLL_LOCAL_DATA_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- ScrollMode.Infinite requires a remote data source (DataManager).',
    '- Local data arrays are not supported with infinite scroll mode.',
    '- Please use ScrollMode.Auto (default) for local data.'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when aggregates are rendered in
 * infinite scroll mode.
 */
export const AGGREGATE_INFINITE_SCROLL_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Aggregates in infinite scroll mode display values only from the last' +
    ' loaded request due to unknown total record count.',
    '- This behavior is expected because infinite scrolling does not maintain' +
    ' a complete dataset context.',
    '- Consider using pagination or virtual scrolling for accurate aggregate values across the entire dataset.',
    '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/infinite-scroll/?theme=material#aggregation-and-grouping'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when grouping is enabled with
 * infinite scroll mode.
 */
export const GROUP_INFINITE_SCROLL_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Grouping in infinite scroll mode may lead to unexpected behavior due to unknown total record count.',
    '- This is because infinite scrolling dynamically loads data without a complete dataset context, which can affect group' +
    ' counts and expand/collapse behavior.',
    '- Consider using pagination or virtual scrolling for more consistent grouping behavior across the entire dataset.',
    '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/infinite-scroll/?theme=material#aggregation-and-grouping'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useGrid.tsx] when pager is combined with
 * server-side virtual or infinite scroll.
 */
export const PAGER_WITH_SERVER_VIRTUAL_INFINITE_SCROLL_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Using pager with server-side pagination in virtual or infinite scroll mode may lead to unexpected behavior.',
    '- This is because server-side pagination relies on explicit page navigation, while virtual/infinite scrolling' +
    ' dynamically loads data (server-side pagination) as the user scrolls.',
    '- Consider using either pager for server-side pagination or disabling the pager for virtual/infinite scroll scenarios.'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useRender.tsx] when the end of the dataset is
 * reached before the estimated total record count can be honoured.
 */
export const ESTIMATED_TOTAL_RECORDS_OVERRIDE_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Estimated total records count may be inaccurate as the end of dataset was reached' +
    ' before loading the estimated count of records based on server page size.',
    '- Overriding estimatedTotalRecordsCount to cached data count.'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useRender.tsx] when the server page size does
 * not match the client page size.
 */
export const SERVER_CLIENT_PAGE_SIZE_MISMATCH_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Detected server pageSize does not match with client pageSize.',
    '- Overriding client pageSize to match server pageSize for achieving better accuracy.'
].join('\n');

/**
 * Emitted from [src/grid/hooks/useRender.tsx] when initial filtering or
 * searching returns a page size that does not match the client page size.
 */
export const INITIAL_FILTER_SEARCH_PAGE_SIZE_MISMATCH_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Detected initial filtering or searching configuration with server response does' +
    ' not match with client pageSize.',
    '- Please make sure to set server pageSize as client pageSize.',
    '- Ignore if already configured.'
].join('\n');

/**
 * Emitted from [src/grid/views/ContentRows.tsx] when the row rendering count
 * exceeds the safe threshold with DOM virtualization disabled.
 */
export const MAX_ROWS_LIMIT_WARNING_MESSAGE: string = [
    'Syncfusion Pure React Data Grid:',
    '- Rendering more than the recommended maximum row limit (500) without DOM' +
    ' virtualization may impact performance.',
    '- Detected preventMaxRenderedRows is disabled and row rendering exceeds the' +
    ' safe threshold.',
    '- Consider enabling row virtualization or limiting the number of rendered rows.',
    '- Learn more: https://react.syncfusion.com/react-ui/data-grid/scrolling/configuration/' +
    '#limit-maximum-rows-when-virtualization-is-disabled'
].join('\n');

/**
 * Builder for the Excel export data-size warning.
 *
 * @private
 * @param {number} dataLength - Number of rows the caller is about to export.
 * @param {number} threshold - Configured `maxRowsWarningThreshold` value.
 * @returns {string} Fully formatted warning message.
 */
export const buildExcelMaxRowsWarningMessage: (dataLength: number, threshold: number) => string =
    (dataLength: number, threshold: number): string =>
        `Excel export service: Data size (${dataLength} rows) exceeds warning threshold (${threshold} rows).`;

/**
 * Builder for the PDF export data-size warning.
 *
 * @private
 * @param {number} dataLength - Number of rows the caller is about to export.
 * @param {number} threshold - Configured `maxRowsWarningThreshold` value.
 * @returns {string} Fully formatted warning message.
 */
export const buildPdfMaxRowsWarningMessage: (dataLength: number, threshold: number) => string =
    (dataLength: number, threshold: number): string =>
        `PDF Export service: Data size (${dataLength} rows) exceeds warning threshold (${threshold} rows).`;

/**
 * Emitted from [src/grid/services/excel-export-service.ts] when the
 * `onBeforeExcelExport` callback cancels the export.
 */
export const EXCEL_EXPORT_CANCELLED_MESSAGE: string =
    'Excel export was canceled by onBeforeExcelExport callback.';

/**
 * Emitted from [src/grid/services/excel-export-service.ts] when an exception
 * is thrown during Excel export.
 */
export const EXCEL_EXPORT_FAILED_MESSAGE: string = 'Excel export failed:';

/**
 * Emitted from [src/grid/services/pdf-export-service.ts] when the
 * `onBeforePdfExport` callback cancels the export.
 */
export const PDF_EXPORT_CANCELLED_MESSAGE: string =
    'PDF export was canceled by onBeforePdfExport callback.';

/**
 * Emitted from [src/grid/services/pdf-export-service.ts] when an exception
 * is thrown during PDF export.
 */
export const PDF_EXPORT_FAILED_MESSAGE: string = 'PDF export failed:';

/**
 * Module injection reminder header.
 *
 * Emitted once during grid initialization when `enableDevMode` is true and at
 * least one user-enabled feature is missing its corresponding module from the
 * `modules` prop. The reminder enumerates the missing modules together with
 * the feature(s) that require them so the user can fix the configuration in a
 * single place (`files: warnings.ts`).
 */
export const MODULE_INJECTION_REMINDER_HEADER: string = [
    'Syncfusion Pure React Data Grid (module injection reminder):',
    '- One or more features are enabled but their corresponding module(s) are not injected via the `modules` prop.',
    '- Tree-shaken builds will silently drop those features until the modules are provided.'
].join('\n');

/**
 * Builder for the missing-module message lines shown after
 * {@link MODULE_INJECTION_REMINDER_HEADER}.
 *
 * Each line is rendered as:
 * `  - "<ModuleName>": required by <reason>`
 *
 * @private
 * @param {string[]} lines - Per-reminder lines (each describing one module).
 * @returns {string} Newline-joined output ready for `console.warn`.
 */
export const buildModuleInjectionReminderBody: (lines: string[]) => string =
    (lines: string[]): string => lines.join('\n');

/**
 * Reminder line emitted when `clipboardSettings.enabled` is true (default) but
 * `ClipboardModule` is not present in the `modules` prop.
 */
export const CLIPBOARD_MODULE_REQUIRED_REMINDER: string =
    '- "ClipboardModule": required by "clipboardSettings.enabled" (Copy/Paste/Cut)';

/**
 * Reminder line emitted when `searchSettings.enabled` is true but
 * `SearchModule` is not present in the `modules` prop.
 */
export const SEARCH_MODULE_REQUIRED_REMINDER: string =
    '- "SearchModule": required by "searchSettings.enabled" (Toolbar Search bar)';

/**
 * Reminder line emitted when `filterSettings.enabled` is true but
 * `FilterModule` is not present in the `modules` prop.
 */
export const FILTER_MODULE_REQUIRED_REMINDER: string =
    '- "FilterModule": required by "filterSettings.enabled" (Filter bar / Excel filter dialog)';

/**
 * Reminder line emitted when the sidebar requests the Columns panel without
 * its independently injectable tool-panel module.
 */
export const COLUMN_TOOL_PANEL_MODULE_REQUIRED_REMINDER: string =
    '- "ColumnToolPanelModule": required by "sideBar" Columns panel';

/**
 * Reminder line emitted when the sidebar requests the Filters panel without
 * its independently injectable tool-panel module.
 */
export const FILTER_TOOL_PANEL_MODULE_REQUIRED_REMINDER: string =
    '- "FilterToolPanelModule": required by "sideBar" Filters panel';

export const RESIZE_MODULE_REQUIRED_REMINDER: string =
    '- "ResizeModule": required by "resizeSettings.enabled"';

export const REORDER_MODULE_REQUIRED_REMINDER: string =
    '- "ReorderModule": required by "reorderSettings.enabled" (Column reordering via drag-and-drop or keyboard)';

/**
 * Reminder line emitted when `editSettings.allowAdd/Edit/Delete` is true but
 * `EditModule` is not present in the `modules` prop.
 */
export const EDIT_MODULE_REQUIRED_REMINDER: string =
    '- "EditModule": required by "editSettings.allowAdd | allowEdit | allowDelete" (Add/Edit/Delete operations)';

/**
 * Reminder line emitted when `groupSettings.enabled` is true but
 * `GroupModule` is not present in the `modules` prop.
 */
export const GROUP_MODULE_REQUIRED_REMINDER: string =
    '- "GroupModule": required by "groupSettings.enabled" (Grouping / Group captions)';

/**
 * Reminder line emitted when `isTreeMode` is true but
 * `TreeDataModule` is not present in the `modules` prop.
 */
export const TREE_MODULE_REQUIRED_REMINDER: string =
    '- "TreeDataModule": required by "isTreeMode" (TreeData / Expand / Collapse)';

/**
 * Reminder line emitted when `pageSettings.enabled` is true but
 * `PagerModule` is not present in the `modules` prop.
 */
export const PAGER_MODULE_REQUIRED_REMINDER: string =
    '- "PagerModule": required by "pageSettings.enabled" (Pager UI / page navigation)';

/**
 * Reminder line emitted when `pinningSettings.enabled` is true but
 * `PinningModule` is not present in the `modules` prop.
 */
export const PINNING_MODULE_REQUIRED_REMINDER: string =
    '- "PinningModule": required by "pinningSettings.enabled" (row pinning / column pinning / pinned rows / pinned Columns)';

/**
 * Reminder line emitted when the `aggregates` prop (or `<Aggregates>` children)
 * is provided but `AggregateModule` is not present in the `modules` prop.
 */
export const AGGREGATE_MODULE_REQUIRED_REMINDER: string =
    '- "AggregateModule": required by "aggregates" prop or <Aggregates> children (Summary rows)';

/**
 * Reminder line emitted when a toolbar is configured but `ToolbarModule` is
 * not present in the `modules` prop.
 */
export const TOOLBAR_MODULE_REQUIRED_REMINDER: string =
    '- "ToolbarModule": required by "toolbar" prop (Toolbar rendering / predefined items)';

/**
 * Reminder line emitted when `contextMenuSettings.enabled` is true but
 * `ContextMenuModule` is not present in the `modules` prop.
 */
export const CONTEXTMENU_MODULE_REQUIRED_REMINDER: string =
    '- "ContextMenuModule": required by "contextMenuSettings.enabled" (Right-click menu)';

/**
 * Reminder line emitted when `dragAndDropSettings.enabled` is true but
 * `ReorderModule` is not present in the `modules` prop.
 */
export const ROWREORDER_MODULE_REQUIRED_REMINDER: string =
     '- "ReorderModule": required by "dragAndDropSettings.enabled" (Row drag-and-drop reordering)';

/**
 * Reminder line emitted when `showColumnChooser` is true (or the toolbar
 * includes the `ColumnChooser` item) but `ColumnChooserModule` is not present
 * in the `modules` prop.
 */
export const COLUMNCHOOSER_MODULE_REQUIRED_REMINDER: string =
    '- "ColumnChooserModule": required by "showColumnChooser" or toolbar "ColumnChooser" item';

/**
 * Reminder line emitted when any column declares command items (for example
 * via the `commands` prop) but `CommandColumnModule` is not present in the
 * `modules` prop.
 */
export const COMMANDCOLUMN_MODULE_REQUIRED_REMINDER: string =
    '- "CommandColumnModule": required by columns that declare command items (Edit/Delete/Save/Cancel buttons in a column)';

/**
 * Reminder line emitted when master-detail rendering is enabled but
 * `DetailGridModule` is not present in the `modules` prop.
 */
export const DETAILGRID_MODULE_REQUIRED_REMINDER: string =
    '- "DetailGridModule": required by "isMasterDetail" (Detail row / nested detail grid rendering)';

