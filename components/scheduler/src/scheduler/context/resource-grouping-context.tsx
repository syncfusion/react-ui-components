import { createContext, useContext, useEffect, FC, ReactNode, useMemo, useState, useCallback, Context } from 'react';
import { SchedulerGroup, SchedulerResource, ResourceChangeEvent } from '../types/scheduler-types';
import { CellData, ResourceTreeItem } from '../types/internal-interface';
import { ResourceGroupingMetadata, ResourceGroupingService, ResourceLevel, TimelineResourceRowMeta } from '../services/ResourceGroupingService';
import { getItemByIndex } from '../utils/array-utils';
import { useSchedulerRenderDatesContext } from './scheduler-render-dates-context';
import { useSchedulerPropsContext } from './scheduler-context';

/**
 * Resource grouping context value type
 *
 * @private
 */
export interface ResourceGroupingContextType {
    /**
     * Whether resource grouping is active
     */
    isGroupingEnabled: boolean;

    /**
     * Resource grouping configuration
     */
    groupConfig: SchedulerGroup;

    /**
     * Mode-aware (compact-narrowed when `isCompact === true`, otherwise the
     * full list) hierarchical resource tree. Most renderers — including
     * timeline, month, week, day, agenda, header rows, and the compact
     * sidebar — should read this field directly.
     */
    resourceTree: ResourceLevel[];

    /**
     * Mode-aware (compact-narrowed when `isCompact === true`, otherwise the
     * full list) leaf-level resources. Most renderers should read this field
     * directly.
     */
    leafResources: ResourceLevel[];

    /**
     * Grouping metadata
     */
    metadata: ResourceGroupingMetadata;

    /**
     * Mode-aware (compact-narrowed when `isCompact === true`, otherwise the
     * full hierarchy) column header levels. Each cell carries its own
     * `date`/`groupIndex`/`groupOrder`. Most renderers should read this
     * field directly.
     */
    columnLevels: CellData[][];

    /**
     * Unfiltered, mode-agnostic counterpart of `leafResources`. `cell.groupIndex`
     * values index this list. Modules that must resolve a leaf by `groupIndex`
     * regardless of compact mode — quick-info popups, the editor popup, and
     * any other code that needs the full set — must use this field.
     */
    allLeafResources: ResourceLevel[];

    /**
     * Unfiltered, mode-agnostic counterpart of `resourceTree`. Mirrors
     * `allLeafResources` for tree consumers (e.g. quick-info popups, the
     * editor popup).
     */
    allResourceTree: ResourceLevel[];

    /**
     * Unfiltered, mode-agnostic counterpart of `columnLevels`. Mirrors
     * `allLeafResources` for column-level consumers that need the full
     * hierarchy (e.g. quick-info popups, the editor popup).
     */
    allColumnLevels: CellData[][];

    /**
     * Column header levels specifically for Month view rendering
     * Uses weekday slots (7 per week) instead of full render dates
     */
    monthColumnLevels?: CellData[][];

    /**
     * Flat tree of all resource rows. Populated for timeline views and
     * compact view mode (any view type) for the sidebar TreeView.
     *
     * @private
     */
    timelineResourceHeaders?: TimelineResourceRowMeta[];

    /**
     * `ResourceTreeItem[]` for the compact-view `TreeView`.
     *
     * @private
     */
    resourceTreeData: ResourceTreeItem[];

    /**
     * `selectedIds` for the compact-view `TreeView`.
     *
     * @private
     */
    selectedTreeIds: string[];

    /**
     * `defaultExpandedIds` for the compact-view `TreeView`.
     *
     * @private
     */
    defaultExpandedTreeIds: string[];

    /**
     * Rows visible after expand/collapse. Populated for timeline views and
     * compact view mode (any view type).
     *
     * @private
     */
    visibleResourceHeaders?: TimelineResourceRowMeta[];

    /**
     * Expand/collapse state per groupIndex. Populated for timeline views and
     * compact view mode (any view type).
     *
     * @private
     */
    expandedState?: Map<number, boolean>;

    /**
     * Toggle a resource row's expanded state. Populated for timeline views and
     * compact view mode (any view type).
     *
     * @private
     */
    toggleExpanded?: (groupIndex: number) => void;

    /**
     * Measured heights for timeline resource rows.
     *
     * @private
     */
    resourceRowHeights?: Map<number, number>;

    /**
     * Update the measured height of a timeline resource row.
     *
     * @private
     */
    updateResourceRowHeight?: (groupIndex: number, height: number) => void;

    /**
     * `true` only when all of the following hold: `group.enableCompactView === true`,
     * resource grouping is active, and there is at least one leaf resource.
     *
     * @private
     */
    isCompact: boolean;

    /**
     * Index of the currently selected leaf resource within `allLeafResources`.
     *
     * @private
     */
    selectedGroupIndex: number;

    /**
     * Whether the compact-view resource tree sidebar is currently visible.
     *
     * @private
     */
    treeVisible: boolean;

    /**
     * Toggle the compact-view resource tree sidebar. Pass an explicit boolean
     * to force the next value, or omit to flip the current value.
     *
     * @private
     */
    toggleTree: (next?: boolean) => void;

    /**
     * Programmatically select a leaf resource by its index in `allLeafResources`.
     * Fires `onResourceChange` exactly once when the index actually changes
     * and closes the tree on every selection.
     *
     * @private
     */
    selectResource: (nextIndex: number) => void;

    /**
     * Currently selected `ResourceLevel` leaf, or `undefined` when grouping is off
     * or there are no leaves.
     *
     * @private
     */
    selectedLeaf: ResourceLevel | null;

    /**
     * Breadcrumb of resource names (root → leaf) for the currently selected
     * leaf. Empty when no resource is selected.
     *
     * @private
     */
    selectedResourcePath: string[];
}

/**
 * React Context for resource grouping
 *
 * @private
 */
const ResourceGroupingContext: Context<ResourceGroupingContextType> = createContext<ResourceGroupingContextType | null>(null);

/**
 * Resource Grouping Context Provider Props
 *
 * @private
 */
export interface ResourceGroupingProviderProps {
    /**
     * Child components
     */
    children: ReactNode;
}

/**
 * Internal: full/unfiltered values used inside the provider. The public
 * context exposes the **mode-aware** variants of the same fields.
 *
 * @private
 */
interface BaseGroupingFields {
    isGroupingEnabled: boolean;
    groupConfig: SchedulerGroup;
    resourceTree: ResourceLevel[];
    leafResources: ResourceLevel[];
    metadata: ResourceGroupingMetadata;
    columnLevels: CellData[][];
}

/**
 * Internal: the leafResources / resourceTree / columnLevels triple in the
 * shape the public context exposes them. In compact mode this is narrowed to
 * the selected leaf; otherwise it matches `BaseGroupingFields` for the same
 * three fields.
 *
 * @private
 */
interface ModeAwareGroupingFields {
    leafResources: ResourceLevel[];
    resourceTree: ResourceLevel[];
    columnLevels: CellData[][];
}

/**
 * Resolves the active compact-view scope. When `isCompact` is off, returns
 * the full `leafResources`/`resourceTree` unchanged. When on, returns the
 * selected leaf (today) or, in the future, the leaves under the selected
 * parent. The `tree` value always preserves `ResourceLevel`'s recursive
 * `.children` shape.
 *
 * @param {boolean} isCompact Whether compact view is active
 * @param {ResourceLevel | null} selectedLeaf The currently selected leaf resource
 * @param {ResourceLevel[]} leafResources The complete list of leaf resources
 * @param {ResourceLevel[]} resourceTree The complete resource hierarchy
 * @returns {Object} The resource leaves and tree for the active compact-view scope
 * @private
 */
function getCompactScope(
    isCompact: boolean,
    selectedLeaf: ResourceLevel | null,
    leafResources: ResourceLevel[],
    resourceTree: ResourceLevel[]
): { leaves: ResourceLevel[]; tree: ResourceLevel[] } {
    if (!isCompact) {
        return { leaves: leafResources, tree: resourceTree };
    }
    if (selectedLeaf) {
        return { leaves: [selectedLeaf], tree: [selectedLeaf] };
    }
    return { leaves: leafResources, tree: resourceTree };
}

/**
 * Unified provider for all views. Computes grouping fields for every view and
 * also builds timeline-style resource headers (and expand/collapse state) for
 * timeline views and compact view mode (any view type), since the compact
 * sidebar mounts the ResourceTreeView everywhere.
 *
 * @param {ResourceGroupingProviderProps} root0 - Provider props.
 * @param {ReactNode} root0.children - Child content to render.
 * @returns {ReactNode} The resource grouping context provider
 * @private
 */
export const ResourceGroupingProvider: FC<ResourceGroupingProviderProps> = ({
    children
}: ResourceGroupingProviderProps) => {
    const { renderDates } = useSchedulerRenderDatesContext();
    const { resources, group, workDays, viewType, onResourceChange } = useSchedulerPropsContext();
    const isTimeline: boolean = !!(viewType && viewType.startsWith('Timeline'));

    const baseGroupingValue: BaseGroupingFields = useMemo<BaseGroupingFields>(() => {
        const isGroupingEnabled: boolean = group && group.resources && group.resources.length > 0;

        if (!isGroupingEnabled) {
            return {
                isGroupingEnabled: false,
                groupConfig: group,
                resourceTree: [],
                leafResources: [],
                metadata: {
                    resourceNames: [],
                    byDate: false,
                    byGroupID: true,
                    groupEdit: false,
                    depth: 0,
                    leafResources: [],
                    enableCompactView: false
                },
                columnLevels: []
            };
        }

        const resourceTree: ResourceLevel[] = ResourceGroupingService.buildResourceTree(
            resources,
            group,
            renderDates,
            workDays
        );

        const leafResources: ResourceLevel[] = ResourceGroupingService.getLeafResources(resourceTree);

        const metadata: ResourceGroupingMetadata = ResourceGroupingService.getGroupingMetadata(
            resourceTree,
            group
        );

        const columnLevels: CellData[][] = ResourceGroupingService.generateColumnLevels(
            resourceTree,
            group,
            renderDates,
            leafResources
        );

        return {
            isGroupingEnabled,
            groupConfig: group,
            resourceTree,
            leafResources,
            metadata,
            columnLevels
        };
    }, [resources, group, renderDates, workDays]);

    const isCompact: boolean = useMemo<boolean>(() => {
        return baseGroupingValue.groupConfig?.enableCompactView === true
            && baseGroupingValue.isGroupingEnabled
            && baseGroupingValue.leafResources.length > 0;
    }, [
        baseGroupingValue.groupConfig?.enableCompactView,
        baseGroupingValue.isGroupingEnabled,
        baseGroupingValue.leafResources
    ]);

    const initialIndex: number = useMemo<number>(() => {
        const leaves: ResourceLevel[] = baseGroupingValue.leafResources;
        if (!leaves || leaves.length === 0) { return 0; }
        return ResourceGroupingService.getResourceByInitialId(leaves, group?.selectedResource);
    }, [baseGroupingValue.leafResources, baseGroupingValue.groupConfig?.selectedResource]);

    const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(initialIndex);
    const [treeVisible, setTreeVisible] = useState<boolean>(false);

    useEffect((): void => {
        setSelectedGroupIndex(initialIndex);
    }, [initialIndex]);

    const toggleTree: (next?: boolean) => void = useCallback((next?: boolean): void => {
        setTreeVisible((prev: boolean) => (typeof next === 'boolean' ? next : !prev));
    }, []);

    const selectResource: (nextIndex: number) => void = useCallback((nextIndex: number): void => {
        setSelectedGroupIndex((currentIdx: number) => {
            if (nextIndex === currentIdx) {
                setTreeVisible(false);
                return currentIdx;
            }
            const currentLeaf: ResourceLevel | undefined = getItemByIndex(baseGroupingValue.leafResources, currentIdx);
            const nextLeaf: ResourceLevel | undefined = getItemByIndex(baseGroupingValue.leafResources, nextIndex);
            const args: ResourceChangeEvent = {
                resource: (nextLeaf?.resourceData as Record<string, unknown>) ?? {},
                previousResource: (currentLeaf?.resourceData as Record<string, unknown>) ?? null,
                groupIndex: nextIndex,
                cancel: false
            };
            if (typeof onResourceChange === 'function') {
                onResourceChange(args);
            }
            if (args.cancel) {
                setTreeVisible(false);
                return currentIdx;
            }
            setTreeVisible(false);
            return nextIndex;
        });
    }, [baseGroupingValue.leafResources, onResourceChange]);

    const selectedLeaf: ResourceLevel | null = getItemByIndex(baseGroupingValue.leafResources, selectedGroupIndex) ?? null;

    const selectedResourcePath: string[] = useMemo<string[]>(
        () => ResourceGroupingService.resolveLeafBreadcrumb(
            baseGroupingValue.resourceTree ?? [],
            selectedLeaf
        ),
        [baseGroupingValue.resourceTree, selectedLeaf]
    );

    const populateTree: boolean = isTimeline || isCompact === true;

    const { leaves: visibleLeafResourcesArr, tree: visibleResourceTreeArr }: {
        leaves: ResourceLevel[]; tree: ResourceLevel[];
    } = useMemo(
        () => getCompactScope(isCompact, selectedLeaf, baseGroupingValue.leafResources, baseGroupingValue.resourceTree),
        [isCompact, selectedLeaf, baseGroupingValue.leafResources, baseGroupingValue.resourceTree]
    );

    const visibleColumnLevels: CellData[][] = useMemo<CellData[][]>(() => {
        const baseLevels: CellData[][] = baseGroupingValue.columnLevels;
        if (!baseGroupingValue.isGroupingEnabled || !isCompact || baseLevels.length === 0) {
            return baseLevels;
        }
        const lastLevel: CellData[] = baseGroupingValue.groupConfig.byDate ? baseLevels[0] : baseLevels[baseLevels.length - 1] || [];
        if (baseGroupingValue.groupConfig.byDate && selectedLeaf) {
            const dateCellsWithGroupIndex: CellData[] = lastLevel.map(
                (cell: CellData) => ({ ...cell, groupIndex: selectedLeaf?.groupIndex, groupOrder: selectedLeaf?.groupOrder })
            );
            return [dateCellsWithGroupIndex];
        }
        const visibleGroupIndexes: Set<number> = new Set(
            visibleLeafResourcesArr.map((leaf: ResourceLevel) => leaf.groupIndex)
        );
        const selectedResourceCells: CellData[] = lastLevel.filter(
            (cell: CellData) => cell.groupIndex !== undefined && visibleGroupIndexes.has(cell.groupIndex)
        );
        return [selectedResourceCells];
    }, [baseGroupingValue.isGroupingEnabled, baseGroupingValue.columnLevels,
        isCompact, visibleLeafResourcesArr, selectedLeaf]);

    const timelineResourceHeaders: TimelineResourceRowMeta[] = useMemo(() => {
        if (!populateTree || !baseGroupingValue.isGroupingEnabled) {
            return [];
        }
        return ResourceGroupingService.buildTimelineResourceHeaders(baseGroupingValue.resourceTree);
    }, [populateTree, baseGroupingValue.resourceTree, baseGroupingValue.isGroupingEnabled]);

    const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(() => new Set<number>());
    const [resourceRowHeights, setResourceRowHeights] = useState<Map<number, number>>(new Map());

    const updateResourceRowHeight: (groupIndex: number, height: number) => void = useCallback((
        groupIndex: number, height: number
    ): void => {
        setResourceRowHeights((current: Map<number, number>) => {
            if (current.get(groupIndex) === height) { return current; }
            const next: Map<number, number> = new Map(current);
            next.set(groupIndex, height);
            return next;
        });
    }, []);

    const expandedState: Map<number, boolean> | undefined = useMemo(() => {
        if (!populateTree || !baseGroupingValue.isGroupingEnabled || !timelineResourceHeaders?.length) {
            return undefined;
        }

        const state: Map<number, boolean> = new Map<number, boolean>();
        timelineResourceHeaders.forEach((row: TimelineResourceRowMeta) => {
            if (row.count > 0) {
                const resource: SchedulerResource | undefined = row.resource;
                let initialExpanded: boolean = true;
                if (resource && typeof resource.expandedField === 'string' && resource.expandedField.length > 0) {
                    initialExpanded = Boolean(row.resourceData?.[resource.expandedField]);
                }
                const toggled: boolean = collapsedNodes.has(row.groupIndex);
                state.set(row.groupIndex, initialExpanded !== toggled);
            }
        });
        return state;
    }, [populateTree, baseGroupingValue.isGroupingEnabled, timelineResourceHeaders, collapsedNodes]);

    const toggleExpanded: (groupIndex: number) => void = useCallback((groupIndex: number): void => {
        setCollapsedNodes((prev: Set<number>) => {
            const next: Set<number> = new Set(prev);
            if (next.has(groupIndex)) {
                next.delete(groupIndex);
            } else {
                next.add(groupIndex);
            }
            return next;
        });
    }, []);

    const visibleResourceHeaders: TimelineResourceRowMeta[] = useMemo(
        () => {
            if (!populateTree || !expandedState || !baseGroupingValue.isGroupingEnabled) {
                return [];
            }
            if (isCompact) {
                const visibleGroupOrders: Set<string> = new Set(
                    visibleLeafResourcesArr.map(
                        (leaf: ResourceLevel) => (leaf.groupOrder || []).join('-')
                    )
                );
                return timelineResourceHeaders.filter(
                    (row: TimelineResourceRowMeta) => visibleGroupOrders.has((row.groupOrder || []).join('-'))
                );
            }
            return timelineResourceHeaders.filter(
                (row: TimelineResourceRowMeta) =>
                    !ResourceGroupingService.shouldHideTimelineResourceRow(
                        row,
                        expandedState,
                        timelineResourceHeaders
                    )
            );
        },
        [populateTree, timelineResourceHeaders, expandedState, baseGroupingValue.isGroupingEnabled,
            isCompact, visibleLeafResourcesArr]
    );

    const resourceTreeData: ResourceTreeItem[] = useMemo<ResourceTreeItem[]>(
        () => isCompact ? ResourceGroupingService.buildResourceTreeItems(baseGroupingValue.resourceTree) : [],
        [isCompact, baseGroupingValue.resourceTree]
    );

    const selectedTreeIds: string[] = useMemo<string[]>(
        () => isCompact ? ResourceGroupingService.resolveTreeSelectionId(baseGroupingValue.leafResources, selectedGroupIndex) : [],
        [isCompact, baseGroupingValue.leafResources, selectedGroupIndex]
    );

    const defaultExpandedTreeIds: string[] = useMemo<string[]>(
        () => isCompact ? ResourceGroupingService.resolveDefaultExpandedTreeIds(timelineResourceHeaders) : [],
        [isCompact, timelineResourceHeaders]
    );

    const modeAwareFields: ModeAwareGroupingFields = isCompact
        ? {
            leafResources: visibleLeafResourcesArr,
            resourceTree: visibleResourceTreeArr,
            columnLevels: visibleColumnLevels
        }
        : {
            leafResources: baseGroupingValue.leafResources,
            resourceTree: baseGroupingValue.resourceTree,
            columnLevels: baseGroupingValue.columnLevels
        };

    const value: ResourceGroupingContextType = useMemo(() => ({
        ...baseGroupingValue,
        leafResources: modeAwareFields.leafResources,
        resourceTree: modeAwareFields.resourceTree,
        columnLevels: modeAwareFields.columnLevels,
        allLeafResources: baseGroupingValue.leafResources,
        allResourceTree: baseGroupingValue.resourceTree,
        allColumnLevels: baseGroupingValue.columnLevels,
        timelineResourceHeaders,
        visibleResourceHeaders,
        expandedState,
        toggleExpanded,
        resourceRowHeights,
        updateResourceRowHeight,
        isCompact,
        selectedGroupIndex,
        treeVisible,
        toggleTree,
        selectResource,
        selectedLeaf,
        selectedResourcePath,
        resourceTreeData,
        selectedTreeIds,
        defaultExpandedTreeIds
    }), [baseGroupingValue, modeAwareFields,
        timelineResourceHeaders, visibleResourceHeaders, expandedState, toggleExpanded,
        resourceRowHeights, updateResourceRowHeight, isCompact, selectedGroupIndex,
        treeVisible, toggleTree, selectResource, selectedLeaf, selectedResourcePath,
        resourceTreeData, selectedTreeIds, defaultExpandedTreeIds]);

    return (
        <ResourceGroupingContext.Provider value={value}>
            {children}
        </ResourceGroupingContext.Provider>
    );
};

/**
 * Hook to access resource grouping context
 *
 * @returns {ResourceGroupingContextType} Resource grouping context value
 * @throws Error if used outside ResourceGroupingProvider
 *
 * @private
 */
export function useResourceGrouping(): ResourceGroupingContextType {
    const context: ResourceGroupingContextType = useContext(ResourceGroupingContext);
    if (!context) {
        throw new Error(
            'useResourceGrouping must be used within ResourceGroupingProvider'
        );
    }
    return context;
}

/**
 * Hook to safely access resource grouping context (returns null if not provided)
 *
 * @returns {ResourceGroupingContextType|null} Resource grouping context value or null
 *
 * @private
 */
export function useResourceGroupingContext(): ResourceGroupingContextType | null {
    return useContext(ResourceGroupingContext);
}

export default ResourceGroupingContext;
