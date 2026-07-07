import { DataResult } from '@syncfusion/react-data';

/**
 * Represents the internal state and cache for infinite scrolling pagination.
 * Managed by the grid internally; exposed via Grid context and GridRef for read-only access.
 * Generic type `T` represents the row/record data structure.
 *
 * **Configuration Note**: This state object contains ONLY runtime state (cache, tokens, signals).
 * Configuration properties (infiniteCountMode, infiniteInitialBlockSize, infiniteMaxBlockSize, enableCache)
 * are deliberately NOT included here. Instead, they are read directly from virtualizationSettings
 * (single source of truth, no state duplication). See VirtualizationSettings interface for configuration.
 *
 * @private
 */
export interface InfiniteScrollState {
    /**
     * Indicates whether the server has signaled the end of available data.
     * Set to true when a response contains no continuation token (or continuation token is null/false/undefined).
     * When true, further pagination requests are suppressed (no more rows will be loaded).
     * When false, more data may be available from the server.
     *
     * @default false
     */
    isInfiniteEndReached: boolean;

    /**
     * Useful for `pageSettings.pageSizeControlledBy: 'server'` purpose update default pageSize to initially responsed result length if provided by server, otherwise use pageSize from props or default value.
     * This allows the grid to adapt to server-defined page sizes without requiring manual reconfiguration and optimize initial load.
     *
     * @default 50 | 12
     */
    serverPageSize?: number;

    /**
     * Continuation token from the last server response.
     * Extracted from response properties: `@odata.nextLink`, `next`, `pageInfo.endCursor`, or `hasMore`.
     * Passed to the next request to fetch additional pages.
     * Null or absent in the response indicates end-of-data.
     *
     * @default null
     */
    nextContinuationToken?: string | null;

    /**
     * Flag to indicate if the current request is a virtual scroll request with cache disabled (sliding window mode).
     * Used internally to manage pagination behavior when `enableCache === false`.
     *
     * @default false
     */
    isVirtualScrollRequest?: boolean;
}

/**
 * @private
 */
interface GraphQLPageInfo {
    /**
     * Indicates whether more data is available after the current page.
     * True = more pages available; false = current page is the last page.
     */
    hasNextPage?: boolean;

    /**
     * Cursor pointing to the end of the current result set.
     * Used to request the next page: include `after: endCursor` in the next query.
     */
    endCursor?: string | null;

    /**
     * Cursor pointing to the start of the current result set.
     * Used for bidirectional pagination (not typically used with infinite scroll).
     *
     * @private
     */
    startCursor?: string | null;
}

/**
 * Represents the response structure expected from a remote data source when using infinite scroll.
 * Defines the contract for data returned by custom binding (`onDataRequest`) or server endpoints.
 * Backend implementations must include at least one continuation token property for Unknown/Estimated count modes.
 *
 * @example
 * ```typescript
 * // OData API response
 * const response: DataResponse<Order> = {
 *   result: [order1, order2, ..., order20],
 *   '@odata.nextLink': 'https://api.example.com/data?$skip=20&$top=20'
 * };
 *
 * // REST API response
 * const response: DataResponse<Order> = {
 *   result: [order1, order2, ..., order20],
 *   next: 'https://api.example.com/data?page=2'
 * };
 *
 * // GraphQL response
 * const response: DataResponse<Order> = {
 *   result: [order1, order2, ..., order20],
 *   pageInfo: {
 *     hasNextPage: true,
 *     endCursor: 'Y3Vyc29yOnVzZXI6Mg=='
 *   }
 * };
 * ```
 *
 * @private
 */
export interface DataResponse extends DataResult {
    /**
     * OData-format continuation token.
     * URL pointing to the next page of results in OData API.
     * Property name: `@odata.nextLink`.
     * Null or Empty string or absent indicates end-of-data.
     *
     * Example: `'https://odata.example.com/data?$skip=20&$top=20'`
     *
     * @optional
     */
    '@odata.nextLink'?: string | null;

    /**
     * REST-format continuation token (link to next page).
     * URL pointing to the next page of results in REST API.
     * Property name: `next`.
     * Null or Empty string or absent indicates end-of-data.
     *
     * Example: `'https://api.example.com/data?page=2&limit=20'`
     *
     * @optional
     */
    next?: string | null;

    /**
     * REST-format boolean flag indicating more data availability.
     * Property name: `hasMore`.
     * True = more data available, false or absent = end-of-data.
     *
     * @optional
     */
    hasMore?: boolean;

    /**
     * Azure APIs (Storage, Graph, Resource APIs) use `continuationToken` for pagination.
     * Null or Empty string or absent indicates end-of-data.
     *
     * @optional
     */
    continuationToken?: string | null;

    /**
     * AWS APIs (DynamoDB, S3, etc.) use `LastEvaluatedKey` as a pagination token.
     * Null or Empty string or absent indicates end-of-data.
     *
     * @optional
     */
    LastEvaluatedKey?: string | null;

    /**
     * gRPC APIs often use `next_page_token` for pagination.
     * Null or Empty string or absent indicates end-of-data.
     *
     * @optional
     */
    'next_page_token'?: string | null;

    /**
     * GraphQL-format pagination info.
     * Contains standard GraphQL pagination properties: `hasNextPage`, `endCursor`, `startCursor`.
     * Used primarily for GraphQL backends.
     *
     * @optional
     */
    pageInfo?: GraphQLPageInfo;
}


