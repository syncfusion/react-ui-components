import { DetailGridOptions, DetailGridCacheEntry, DetailGridCacheConfig } from '../types/detail-cell-renderer.interfaces';

/**
 * LRU cache for nested detail grid descriptors.
 *
 * @remarks
 * - Stores child grid descriptors keyed by `parentKey + depth + configReference`
 * - Preserves child data, configuration, and UI state across expand/collapse
 * - Provides LRU eviction when `maxInstances` threshold is reached
 * - Supports custom destroy hooks for releasing resources on eviction
 *
 * @public
 */
export class DetailGridCache<TData = unknown> {
    private static readonly DEFAULT_MAX_INSTANCES: number = 50;

    private readonly instances: Map<string, DetailGridCacheEntry<TData>> = new Map();
    private readonly maxInstances: number;
    private readonly enableInstanceReuse: boolean;
    private readonly destroyHooks: Map<string, () => void> = new Map();

    /**
     * Construct a new detail grid cache.
     *
     * @param {DetailGridCacheConfig} [config] - Optional configuration overrides
     */
    public constructor(config?: DetailGridCacheConfig) {
        this.maxInstances = config?.maxInstances ?? DetailGridCache.DEFAULT_MAX_INSTANCES;
        this.enableInstanceReuse = config?.enableInstanceReuse ?? true;
    }

    /**
     * Build a stable cache key for a parent row.
     * The key combines a parent identifier, nesting depth, and a configuration
     * reference so that different option sets produce distinct entries.
     *
     * @param {unknown} parentData - Parent row data
     * @param {number} nestingDepth - Current depth in the hierarchy
     * @param {DetailGridOptions | undefined} options - Detail grid configuration
     * @returns {string} Deterministic cache key
     */
    public static buildCacheKey(
        parentData: unknown,
        nestingDepth: number,
        options: DetailGridOptions | undefined
    ): string {
        const id: string = DetailGridCache.resolveParentIdentifier(parentData);
        const optionsRef: string = DetailGridCache.resolveOptionsReference(options);
        return `detail-grid::${id}::depth-${nestingDepth}::opts-${optionsRef}`;
    }

    /**
     * Retrieve a cached entry or create a new one.
     * When reuse is enabled and a matching key exists, the existing entry is
     * returned and its `lastAccessed` timestamp is refreshed.
     *
     * @param {string} key - Cache key
     * @param {TData} parentData - Parent row data
     * @param {number} nestingDepth - Nesting depth
     * @param {DetailGridOptions} options - Detail grid configuration
     * @returns {DetailGridCacheEntry<TData>} The cached or newly created entry
     */
    public getOrCreate(
        key: string,
        parentData: TData,
        nestingDepth: number,
        options: DetailGridOptions
    ): DetailGridCacheEntry<TData> {
        if (this.enableInstanceReuse && this.instances.has(key)) {
            const existing: DetailGridCacheEntry<TData> = this.instances.get(key) as DetailGridCacheEntry<TData>;
            existing.lastAccessed = Date.now();
            // Refresh parentData reference so consumers see the latest row object
            existing.parentData = parentData;
            // Refresh configuration if a new options object was supplied
            existing.options = options;
            // Promote entry to most-recently-used by re-inserting it
            this.instances.delete(key);
            this.instances.set(key, existing);
            return existing;
        }

        if (this.instances.size >= this.maxInstances) {
            this.evictOldest();
        }

        const now: number = Date.now();
        const entry: DetailGridCacheEntry<TData> = {
            key,
            parentData,
            nestingDepth,
            options,
            data: [],
            isLoading: false,
            error: null,
            lastAccessed: now,
            createdAt: now
        };
        this.instances.set(key, entry);
        return entry;
    }

    /**
     * Check whether a cache entry exists for the given key.
     *
     * @param {string} key - Cache key
     * @returns {boolean} True when an entry is cached
     */
    public has(key: string): boolean {
        return this.instances.has(key);
    }

    /**
     * Retrieve a cached entry without creating a new one.
     * Refreshes the `lastAccessed` timestamp as a side-effect.
     *
     * @param {string} key - Cache key
     * @returns {DetailGridCacheEntry<TData> | undefined} Cached entry or undefined
     */
    public get(key: string): DetailGridCacheEntry<TData> | undefined {
        if (!this.instances.has(key)) {
            return undefined;
        }
        const entry: DetailGridCacheEntry<TData> = this.instances.get(key) as DetailGridCacheEntry<TData>;
        entry.lastAccessed = Date.now();
        // Promote entry to most-recently-used
        this.instances.delete(key);
        this.instances.set(key, entry);
        return entry;
    }

    /**
     * Persist the latest data, loading, and error state for a cached entry.
     * No-op when the key is unknown, ensuring that the cache never mutates
     * state for entries that have already been evicted.
     *
     * @param {string} key - Cache key
     * @param {unknown[]} data - Latest child data set
     * @param {boolean} isLoading - Loading state
     * @param {string | null} error - Error message or null
     * @returns {void}
     */
    public update(key: string, data: unknown[], isLoading: boolean, error: string | null): void {
        const entry: DetailGridCacheEntry<TData> | undefined = this.instances.get(key);
        if (!entry) {
            return;
        }
        entry.data = data;
        entry.isLoading = isLoading;
        entry.error = error;
        entry.lastAccessed = Date.now();
    }

    /**
     * Register a destroy hook to invoke when an entry is released.
     * Used to release external resources (e.g. timers, subscriptions) tied
     * to the cached entry. Replaces any previously registered hook.
     *
     * @param {string} key - Cache key
     * @param {Function} hook - Destroy hook to invoke
     * @returns {void}
     */
    public registerDestroyHook(key: string, hook: () => void): void {
        this.destroyHooks.set(key, hook);
    }

    /**
     * Release the entry for the given cache key, invoking any destroy hook
     * before removing the entry from the cache.
     *
     * @param {string} key - Cache key
     * @returns {boolean} True when an entry was released
     */
    public release(key: string): boolean {
        const hook: (() => void) | undefined = this.destroyHooks.get(key);
        if (hook) {
            try {
                hook();
            } catch {
                // Swallow hook errors to avoid cascading release failures
            }
            this.destroyHooks.delete(key);
        }
        return this.instances.delete(key);
    }

    /**
     * Clear all cached entries, invoking destroy hooks before removal.
     *
     * @returns {void}
     */
    public clear(): void {
        const keys: string[] = Array.from(this.instances.keys());
        for (const key of keys) {
            this.release(key);
        }
    }

    /**
     * Return a snapshot of cache statistics. Useful for diagnostics and tests.
     *
     * @returns {object} Cache statistics
     */
    public getStats(): { size: number; maxInstances: number; enableInstanceReuse: boolean; keys: string[]; } {
        return {
            size: this.instances.size,
            maxInstances: this.maxInstances,
            enableInstanceReuse: this.enableInstanceReuse,
            keys: Array.from(this.instances.keys())
        };
    }

    /**
     * Evict the least-recently-used entry from the cache.
     *
     * @private
     * @returns {void}
     */
    private evictOldest(): void {
        const oldestKey: string | undefined = this.instances.keys().next().value;
        if (oldestKey !== undefined) {
            this.release(oldestKey);
        }
    }

    /**
     * Resolve a stable identifier for a parent row.
     * Falls back to a generated id when the parent data lacks a primary key.
     *
     * @private
     * @param {unknown} parentData - Parent row data
     * @returns {string} Stable identifier
     */
    private static resolveParentIdentifier(parentData: unknown): string {
        if (parentData === null || parentData === undefined) {
            return 'null';
        }
        if (typeof parentData !== 'object') {
            return String(parentData);
        }
        const data: Record<string, unknown> = parentData as Record<string, unknown>;
        // The candidate key list is a fixed, hard-coded set of safe property
        // names - we never use user-supplied input here.
        /* eslint-disable security/detect-object-injection */
        const candidateKeys: string[] = [
            'OrderID', 'Id', 'ID', 'id', 'orderId', 'key'
        ];
        for (const candidate of candidateKeys) {
            if (Object.prototype.hasOwnProperty.call(data, candidate) &&
                data[candidate] !== undefined && data[candidate] !== null) {
                return `${candidate}-${String(data[candidate])}`;
            }
        }
        // Fall back to the first primitive value, or a generated id
        for (const value of Object.values(data)) {
            if (typeof value === 'string' || typeof value === 'number') {
                return `auto-${String(value)}`;
            }
        }
        /* eslint-enable security/detect-object-injection */
        return `gen-${Math.random().toString(36).slice(2, 10)}`;
    }

    /**
     * Resolve a stable reference for the options object.
     * We rely on JSON serialisation as a deterministic fingerprint.
     *
     * @private
     * @param {DetailGridOptions | undefined} options - Detail grid configuration
     * @returns {string} Options fingerprint
     */
    private static resolveOptionsReference(options: DetailGridOptions | undefined): string {
        if (!options) {
            return 'default';
        }
        try {
            const fingerprint: string = JSON.stringify({
                columns: options.columns,
                height: options.height,
                rowHeight: options.rowHeight,
                pageSettings: options.pageSettings,
                maxNestingDepth: options.maxNestingDepth,
                currentNestingDepth: options.currentNestingDepth
            });
            // Hash the fingerprint to keep the key short
            let hash: number = 0;
            for (let i: number = 0; i < fingerprint.length; i++) {
                hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
                hash |= 0;
            }
            return Math.abs(hash).toString(36);
        } catch {
            return `opts-${Math.random().toString(36).slice(2, 10)}`;
        }
    }
}
