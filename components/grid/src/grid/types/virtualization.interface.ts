import { ScrollMode } from './enum';

/**
 * Specifies the virtualization rendering strategy for grid content.
 * Determines whether rows, columns, or both are virtualized in the DOM for optimal rendering performance.
 * Virtualization reduces the number of rendered DOM elements, improving performance with large datasets.
 *
 * @default VirtualDomType.Both
 * @example
 * ```tsx
 * <Grid virtualizationSettings={{ type: VirtualDomType.Row }} />
 * ```
 */
export enum VirtualDomType {
    /**
     * Virtualizes only rows in the DOM.
     * Renders only the visible rows within the viewport while keeping all columns in the DOM.
     * Suitable when column virtualization is not needed due to a manageable number of columns.
     *
     * @default 'Row'
     */
    Row = 'Row',

    /**
     * Virtualizes only columns in the DOM.
     * Renders only the visible columns within the viewport while keeping all rows in the DOM.
     * Useful for grids with many columns and a manageable number of rows.
     *
     * @default 'Column'
     */
    Column = 'Column',

    /**
     * Virtualizes both rows and columns in the DOM.
     * Provides optimal performance for large datasets by rendering only visible cells.
     * Recommended for grids with large datasets containing many rows and columns.
     *
     * @default 'Both'
     */
    Both = 'Both'
}

/**
 * Defines buffer settings for virtualization in the Data Grid component.
 * Specifies the number of extra rows and columns rendered outside the viewport beyond the visible area.
 * This buffer improves perception of scrolling smoothness by pre-rendering content that will soon become visible.
 *
 * @example
 * ```tsx
 * const bufferSettings: VirtualBufferSettings = {
 *   rows: 10,
 *   columns: 5
 * };
 * <Grid virtualizationSettings={{ viewPortBuffer: bufferSettings }} />
 * ```
 */
export interface VirtualBufferSettings {
    /**
     * Number of extra rows rendered above and below the currently visible viewport.
     * Larger values improve scrolling smoothness at the cost of increased DOM size.
     * Helps reduce flickering and blank spaces during fast scrolling by pre-rendering upcoming rows.
     *
     * @default 5
     */
    rows?: number;

    /**
     * Number of extra columns rendered to the left and right of the currently visible viewport.
     * Larger values improve horizontal scrolling smoothness at the cost of increased DOM size.
     * Helps reduce flickering and blank spaces during fast horizontal scrolling by pre-rendering upcoming columns.
     *
     * @default 5
     */
    columns?: number;
}

/**
 * Configures virtualization behavior for Grid rendering and performance optimization.
 * Provides comprehensive options for enabling virtualization, defining DOM type (rows, columns, or both),
 * customizing buffer sizes, and controlling scroll strategies and caching behavior.
 * Virtualization dramatically improves grid performance with large datasets by rendering only visible content.
 *
 * @default {
 *   enabled: true,
 *   type: VirtualDomType.Both,
 *   viewPortBuffer: { rows: 5, columns: 5 },
 *   scrollMode: ScrollMode.Auto,
 *   preventMaxRenderedRows: false,
 *   enableCache: true
 * }
 *
 * @example
 * ```tsx
 * // Virtual scrolling with server-side data
 * const virtualization: VirtualizationSettings = {
 *   enabled: true,
 *   type: VirtualDomType.Both,
 *   viewPortBuffer: { rows: 10, columns: 5 },
 *   scrollMode: ScrollMode.Virtual,
 *   enableCache: true
 * };
 * <Grid virtualizationSettings={virtualization} />
 * ```
 */
export interface VirtualizationSettings {
    /**
     * Enables or disables virtualization for the grid.
     * When true, only visible rows and columns in the viewport are rendered in the DOM, significantly improving performance with large datasets.
     * When false, all rows and columns are rendered, which may impact performance on grids with thousands of rows or columns.
     *
     * @default true
     */
    enabled?: boolean;

    /**
     * Specifies the virtualization type to determine which dimensions are virtualized.
     * Allows independent control over row and column virtualization strategies.
     *
     * @default VirtualDomType.Both
     */
    type?: VirtualDomType;

    /**
     * Defines buffer settings for rows and columns outside the viewport.
     * The buffer represents extra rows and columns rendered beyond the visible viewport
     * to reduce flickering and improve perceived scrolling smoothness during rapid scrolling.
     *
     * @default { rows: 5, columns: 5 }
     */
    viewPortBuffer?: VirtualBufferSettings;

    /**
     * Controls maximum row rendering behavior when row virtualization is disabled or not fully active.
     * When enabled, restricts the total number of rendered rows to avoid excessive DOM growth in non-virtualized layouts or column-only virtualized scenarios.
     * Automatically increases the default row buffer value from 5 to 500 to maintain stable rendering performance in large data scenarios.
     * Useful for improving layout stability, reducing unnecessary DOM elements, minimizing reflow operations, and optimizing repaint performance.
     *
     * @default false
     */
    preventMaxRenderedRows?: boolean;

    /**
     * Specifies the scroll mode for server-side virtualization and data loading.
     * Determines how the grid loads and manages row data during scrolling operations.
     * This property controls the integration between virtualization and data loading strategies.
     *
     * @default ScrollMode.Auto
     */
    scrollMode?: ScrollMode;

    /**
     * Enables caching of virtualized content to optimize performance during repeated browsing.
     * When true, previously loaded and rendered data segments are cached in memory to avoid re-fetching from the server when returning to previously viewed ranges.
     * When false, every viewport change or navigation to a previously viewed range triggers a new data request from the server.
     * Generally recommended to be true for improved performance, unless memory constraints are a concern with extremely large datasets.
     *
     * @default true
     */
    enableCache?: boolean;

    /**
     * Specifies the throttle time in milliseconds for scroll events when using virtual or infinite scroll modes.
     * Throttling scroll events can improve performance by limiting the frequency of data loading and rendering during rapid scrolling.
     * A lower value results in more responsive updates but may increase the number of server requests and DOM updates.
     * A higher value reduces the number of updates but may cause a less responsive scrolling experience.
     *
     * @default 150
     */
    throttleTime?: number;
}

/**
 * Provides granular control over row and column virtualization.
 * Includes buffer settings and caching options for optimized rendering.
 *
 * @private
 */
export interface VirtualSettings {
    /**
     * Enables row virtualization.
     *
     * @default true
     */
    enableRow?: boolean;

    /**
     * Enables column virtualization.
     *
     * @default true
     */
    enableColumn?: boolean;

    /**
     * Number of extra rows rendered above and below the viewport.
     * Improves smooth scrolling.
     *
     * @default 5
     */
    rowBuffer?: number;

    /**
     * Number of extra columns rendered to the left and right of the viewport.
     * Improves smooth scrolling.
     *
     * @default 5
     */
    columnBuffer?: number;

    /**
     * Prevents rendering of maximum rows when row virtualization is disabled.
     *
     * @default false
     */
    preventMaxRenderedRows?: boolean;

    /**
     * Enables caching of virtualized content for improved performance.
     *
     * @default true
     */
    enableCache?: boolean;

    /**
     * Specifies the throttle time in milliseconds for scroll events when using virtual or infinite scroll modes.
     * Throttling scroll events can improve performance by limiting the frequency of data loading and rendering during rapid scrolling.
     * A lower value results in more responsive updates but may increase the number of server requests and DOM updates.
     * A higher value reduces the number of updates but may cause a less responsive scrolling experience.
     *
     * @default 150
     */
    throttleTime?: number;
}
