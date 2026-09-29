import { SchedulerResource, SchedulerGroup } from '../types/scheduler-types';
import { CellData, ResourceNodeRef, ResourceTreeItem } from '../types/internal-interface';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { getItemByIndex, getItemByKey } from '../utils/array-utils';

/**
 * Represents a single resource in the hierarchy.
 *
 * @private
 */
export interface ResourceLevel {
    /**
     * The resource configuration.
     */
    resource: SchedulerResource;

    /**
     * The associated resource data.
     */
    resourceData: Record<string, any>;

    /**
     * Hierarchical path as an array of IDs.
     */
    groupOrder: string[];

    /**
     * Available render dates for this resource.
     */
    renderDates: Date[];

    /**
     * Working days for this resource.
     */
    workDays: number[];

    /**
     * Child resources in the hierarchy.
     */
    children: ResourceLevel[];

    /**
     * CSS class for events in this resource.
     */
    cssClass?: string;

    /**
     * Index for group identification.
     */
    groupIndex?: number;
}

/**
 * Metadata for resource grouping configuration.
 *
 * @private
 */
export interface ResourceGroupingMetadata {
    /**
     * Grouping order of resource names.
     */
    resourceNames: string[];

    /**
     * Whether rendering is grouped by date first.
     */
    byDate: boolean;

    /**
     * Whether to filter by group ID.
     */
    byGroupID: boolean;

    /**
     * Enables creating and editing linked appointments assigned to multiple resources.
     */
    groupEdit: boolean

    /**
     * Depth of the resource hierarchy.
     */
    depth: number;

    /**
     * Array of leaf-level resources.
     */
    leafResources: ResourceLevel[];

    /**
     * Whether the scheduler is rendering in compact view mode.
     * When `true`, the DOM contains only the visible leaf's cells and
     * cell-index arithmetic must collapse to the date index alone.
     */
    enableCompactView: boolean;
}

/**
 * Metadata for a timeline resource row used in resource grouping views.
 *
 * @private
 */
export interface TimelineResourceRowMeta {
    /**
     * Resource data associated with this row.
     */
    resourceData?: Record<string, any>;

    /**
     * Resource configuration metadata.
     */
    resource?: SchedulerResource;

    /**
     * Unique index of the resource group.
     */
    groupIndex: number;

    /**
     * Parent resource group index.
     */
    parentGroupIndex?: number;

    /**
     * Number of child resources.
     */
    count?: number;

    /**
     * Display text of the resource row.
     */
    resourceName?: string;

    /**
     * Hierarchy depth level of the resource.
     */
    depth?: number;

    /**
     * Resource hierarchy path used to match timeline events.
     */
    groupOrder?: string[];
}

export class ResourceGroupingService {
    /**
     * Builds a hierarchical resource tree based on grouping configuration.
     * Adapts the recursive "group" function from EJ2 Scheduler.
     *
     * @param {SchedulerResource[]} resources - All available resources
     * @param {SchedulerGroup} groupConfig - Grouping configuration (resources, byGroupID)
     * @param {Date[]} allRenderDates - Global render dates (used as fallback)
     * @param {number[]} defaultWorkDays - Default work days (used as fallback)
     * @returns {ResourceLevel[]} Root-level resource array for rendering
     *
     * @private
     */
    static buildResourceTree(
        resources: SchedulerResource[],
        groupConfig: SchedulerGroup,
        allRenderDates: Date[],
        defaultWorkDays: number[]
    ): ResourceLevel[] {
        const resourceMap: Map<string, SchedulerResource> = new Map<string, SchedulerResource>();
        resources.forEach((res: SchedulerResource) => resourceMap.set(res.name, res));
        const resourceTreeLevel: ResourceLevel[] = [];
        const groupResources: string[] = groupConfig.resources || [];
        let groupIndex: number = 0;

        const group: (resourcesToGroup: SchedulerResource[], levelIndex: number, prevResource?: SchedulerResource,
            prevResourceData?: Record<string, any>, prevGroupOrder?: string[]) => ResourceLevel[] = (
            resourcesToGroup: SchedulerResource[],
            levelIndex: number,
            prevResource?: SchedulerResource,
            prevResourceData?: Record<string, any>,
            prevGroupOrder?: string[]
        ): ResourceLevel[] => {
            const resTree: ResourceLevel[] = [];
            const currentResource: SchedulerResource = resourcesToGroup[0];
            if (currentResource) {
                let resourceDataSource: Record<string, any>[];
                if (prevResourceData && groupConfig.byGroupID && prevResource) {
                    const parentId: string = prevResourceData[prevResource.idField] as string;
                    resourceDataSource = (currentResource.dataSource as Record<string, any>[]).filter(
                        (item: Record<string, any>) => item[currentResource.groupIDField || ''] === parentId
                    );
                } else {
                    resourceDataSource = (currentResource.dataSource as Record<string, any>[]) || [];
                }
                for (let i: number = 0; i < resourceDataSource.length; i++) {
                    let currentGroupOrder: string[] = [];
                    if (prevGroupOrder && prevGroupOrder.length > 0) {
                        currentGroupOrder = [...prevGroupOrder];
                    }
                    currentGroupOrder.push(
                        resourceDataSource[parseInt(i.toString(), 10)][currentResource.idField] as string
                    );
                    const childItems: ResourceLevel[] = group(
                        resourcesToGroup.slice(1),
                        levelIndex + 1,
                        currentResource,
                        resourceDataSource[parseInt(i.toString(), 10)],
                        currentGroupOrder
                    );
                    if (levelIndex === 0 && childItems.length === 0 && groupResources.length > 1) {
                        continue;
                    }
                    const renderDates: Date[] = allRenderDates;
                    const workDays: number[] = defaultWorkDays;
                    const cssClass: string = resourceDataSource[parseInt(i.toString(), 10)][
                        currentResource.cssClassField || ''
                    ] as string | undefined;

                    const slotData: ResourceLevel = {
                        resource: currentResource,
                        resourceData: resourceDataSource[parseInt(i.toString(), 10)],
                        groupOrder: currentGroupOrder,
                        renderDates,
                        workDays,
                        children: childItems,
                        cssClass
                    };
                    if (childItems.length < 1) {
                        slotData.groupIndex = groupIndex;
                        groupIndex++;
                    }
                    resTree.push(slotData);
                }
            }
            return resTree;
        };

        if (groupResources.length > 0) {
            const firstResourceName: string = groupResources[0];
            const firstResource: SchedulerResource = resourceMap.get(firstResourceName);
            if (firstResource) {
                resourceTreeLevel.push(
                    ...group(
                        [firstResource, ...groupResources.slice(1).map((name: string) => resourceMap.get(name)!)],
                        0
                    )
                );
            }
        }
        return resourceTreeLevel;
    }

    /**
     * Extracts all leaf-level resources from the tree (final resources with data).
     *
     * @param {ResourceLevel[]} resourceTree - Root resource tree
     * @returns {ResourceLevel[]} Array of all leaf resources
     *
     * @private
     */
    static getLeafResources(resourceTree: ResourceLevel[]): ResourceLevel[] {
        const leaves: ResourceLevel[] = [];
        const traverse: (node: ResourceLevel) => void = (node: ResourceLevel): void => {
            if (node.children.length === 0) {
                leaves.push(node);
            } else {
                node.children.forEach(traverse);
            }
        };
        resourceTree.forEach(traverse);
        return leaves;
    }

    /**
     * Collects resource grouping metadata.
     *
     * @param {ResourceLevel[]} resourceTree - Root resource tree
     * @param {SchedulerGroup} groupConfig - Grouping configuration
     * @returns {ResourceGroupingMetadata} Metadata about the resource grouping
     *
     * @private
     */
    static getGroupingMetadata(
        resourceTree: ResourceLevel[],
        groupConfig: SchedulerGroup
    ): ResourceGroupingMetadata {
        const leaves: ResourceLevel[] = this.getLeafResources(resourceTree);
        return {
            resourceNames: groupConfig.resources,
            byDate: groupConfig.byDate || false,
            byGroupID: groupConfig.byGroupID || true,
            groupEdit: groupConfig.groupEdit || false,
            depth: groupConfig.resources.length,
            leafResources: leaves,
            enableCompactView: groupConfig.enableCompactView === true && leaves.length > 0
        };
    }

    private static getResourcesAtLevel(nodes: ResourceLevel[], targetLevel: number, currentLevel: number = 0): ResourceLevel[] {
        if (currentLevel === targetLevel) {
            return nodes;
        }
        const result: ResourceLevel[] = [];
        for (const node of nodes) {
            if (node.children && node.children.length > 0) {
                result.push(...this.getResourcesAtLevel(node.children, targetLevel, currentLevel + 1));
            }
        }
        return result;
    }

    private static buildResourceHeaderCell(
        resource: ResourceLevel,
        level: number,
        renderDates?: Date[],
        includeGroupIndex: boolean = false
    ): CellData {
        const getLeafCount: (node: ResourceLevel) => number = (node: ResourceLevel): number => {
            if (!node?.children || node.children?.length === 0) {
                return 1;
            }
            return node.children.reduce((sum: number, child: ResourceLevel) => sum + getLeafCount(child), 0);
        };
        const tdData: CellData = {
            type: 'resourceHeader',
            resource: resource.resource,
            resourceData: resource.resourceData,
            resourceLevelIndex: level,
            groupOrder: resource.groupOrder,
            className: ['sf-resource-cells'],
            colSpan: resource.children.length > 0 ? getLeafCount(resource) : 1,
            cssClass: resource.cssClass
        };
        if (renderDates) {
            tdData.renderDates = renderDates;
        }
        if (includeGroupIndex) {
            tdData.groupIndex = resource.groupIndex;
        }
        return tdData;
    }

    private static buildHeaderLevel(
        resourceTree: ResourceLevel[],
        level: number,
        renderDates?: Date[]
    ): CellData[] {
        return this.getResourcesAtLevel(resourceTree, level).map((resource: ResourceLevel) =>
            this.buildResourceHeaderCell(resource, level, renderDates)
        );
    }


    /**
     * Generates column levels for rendering with unified slot handling.
     * This is a unified method supporting both date-based (Day/Week views) and weekday-based (Month view) layouts.
     * Slot format is auto-detected: slots with 'weekdayIndex' are treated as weekday headers,
     * Date objects or CellData with 'date' property are treated as date headers.
     *
     * @param {ResourceLevel[]} resourceTree - Root resource tree
     * @param {SchedulerGroup} groupConfig - Grouping configuration
     * @param {Date[] | CellData[]} slots - Generic slot data (Date objects OR weekday slots with CellData)
     * @param {ResourceLevel[]} [leafResources] - Pre-calculated leaf resources (avoids recalculation)
     * @returns {ColumnLevel[]} Hierarchical column level structure for rendering
     *
     * @private
     */
    static generateColumnLevels(
        resourceTree: ResourceLevel[],
        groupConfig: SchedulerGroup,
        slots: Date[] | CellData[],
        leafResources?: ResourceLevel[]
    ): CellData[][] {
        const columnLevels: CellData[][] = [];
        const isMonthViewSlots: boolean = slots.length > 0 && typeof slots[0] === 'object' && 'weekdayIndex' in slots[0];

        if (!groupConfig.byDate) {
            for (let level: number = 0; level < groupConfig.resources.length; level++) {
                const levelData: CellData[] = isMonthViewSlots
                    ? this.buildHeaderLevel(resourceTree, level)
                    : this.buildHeaderLevel(resourceTree, level, slots as Date[]);
                if (levelData.length > 0) {
                    columnLevels.push(levelData);
                }
            }

            const leaves: ResourceLevel[] = leafResources;
            const slotLevel: CellData[] = [];

            leaves.forEach((leafResource: ResourceLevel) => {
                slots.forEach((slot: Date | CellData) => {
                    if (isMonthViewSlots) {
                        const monthSlot: CellData = slot as CellData;
                        slotLevel.push({
                            ...monthSlot,
                            type: 'monthWeekday',
                            groupOrder: leafResource.groupOrder,
                            groupIndex: leafResource.groupIndex
                        });
                    } else {
                        const dateSlot: Date = slot as Date;
                        slotLevel.push({
                            type: 'dateHeader',
                            date: dateSlot,
                            className: ['sf-date-header'],
                            groupOrder: leafResource.groupOrder,
                            groupIndex: leafResource.groupIndex
                        });
                    }
                });
            });

            columnLevels.push(slotLevel);
        } else {
            const resourceDepth: number = groupConfig.resources.length;
            const templateLevels: CellData[][] = [];

            for (let level: number = 0; level < resourceDepth; level++) {
                const levelData: CellData[] = this.getResourcesAtLevel(resourceTree, level).map((resource: ResourceLevel) =>
                    this.buildResourceHeaderCell(
                        resource,
                        level,
                        isMonthViewSlots ? undefined : (slots as Date[]),
                        true
                    )
                );
                templateLevels.push(levelData);
            }

            const leaves: ResourceLevel[] = leafResources;
            const leafCount: number = leaves.length;

            const topSlotLevel: CellData[] = slots.map((slot: Date | CellData) => {
                if (isMonthViewSlots) {
                    const monthSlot: CellData = slot as CellData;
                    const monthHeader: CellData = {
                        ...monthSlot,
                        type: 'monthWeekday',
                        colSpan: leafCount
                    };
                    return monthHeader;
                } else {
                    const dateSlot: Date = slot as Date;
                    const dateHeader: CellData = {
                        type: 'dateHeader',
                        date: dateSlot,
                        className: ['sf-date-header'],
                        colSpan: leafCount
                    };
                    return dateHeader;
                }
            });

            const maxLevel: number = isMonthViewSlots ? resourceDepth + 1 : resourceDepth;
            for (let level: number = 0; level < maxLevel; level++) {
                columnLevels.push([]);
            }

            slots.forEach((slot: Date | CellData) => {
                for (let level: number = 0; level < resourceDepth; level++) {
                    const clonedLevel: CellData[] = templateLevels[parseInt(level.toString(), 10)].map((td: CellData) => {
                        const clonedTd: CellData = {
                            ...td,
                            groupOrder: [...(td.groupOrder || [])]
                        };

                        if (isMonthViewSlots) {
                            const monthSlot: CellData = slot as CellData;
                            clonedTd.weekdayIndex = monthSlot.weekdayIndex;
                            clonedTd.dayName = monthSlot.dayName;
                        } else {
                            clonedTd.date = slot as Date;
                        }

                        return clonedTd;
                    });

                    if (isMonthViewSlots) {
                        columnLevels[level + 1].push(...clonedLevel);
                    } else {
                        columnLevels[parseInt(level.toString(), 10)].push(...clonedLevel);
                    }
                }
            });

            if (isMonthViewSlots) {
                columnLevels[0] = topSlotLevel;
            } else {
                columnLevels.unshift(topSlotLevel);
            }
        }

        return columnLevels;
    }

    /**
     * Determines if a resource row should be hidden based on parent expansion state.
     *
     * Traverses the parent hierarchy of a resource row. If any ancestor parent is collapsed
     * (expandedState = false), the entire row and its descendants are hidden from view.
     * This ensures child resources of collapsed parents remain hidden from the UI.
     *
     * @param {TimelineResourceRowMeta} row - The resource row to evaluate for visibility
     * @param {Map<number, boolean>} expandedState - Map of groupIndex to expansion state (true = expanded, false = collapsed)
     * @param {TimelineResourceRowMeta[]} allRows - Complete list of all timeline resource rows for hierarchy lookup
     * @returns {boolean} True if row should be hidden; false if row should be visible
     *
     * @private
     */
    static shouldHideTimelineResourceRow(
        row: TimelineResourceRowMeta,
        expandedState: Map<number, boolean>,
        allRows: TimelineResourceRowMeta[]
    ): boolean {
        let parentIndex: number | undefined = row.parentGroupIndex;
        while (typeof parentIndex === 'number') {
            const parentRow: TimelineResourceRowMeta | undefined =
                allRows.find((candidate: TimelineResourceRowMeta) => candidate.groupIndex === parentIndex);
            if (!parentRow) {
                break;
            }
            if (expandedState.get(parentRow.groupIndex) === false) {
                return true;
            }
            parentIndex = parentRow.parentGroupIndex;
        }
        return false;
    }

    /**
     * Builds flat timeline resource headers from hierarchical tree with proper group indexing.
     *
     * @param {ResourceLevel[]} resourceTree - Root resource tree
     * @param {string} textField - Field name to use for resource name display
     * @returns {TimelineResourceRowMeta[]} Flat array of timeline resource rows with parent relationships
     *
     * @private
     */
    static buildTimelineResourceHeaders(resourceTree: ResourceLevel[]): TimelineResourceRowMeta[] {
        const headers: TimelineResourceRowMeta[] = [];
        let groupIndex: number = 0;

        const build: (node: ResourceLevel, depth?: number, parentGroupIndex?: number) => void =
            (node: ResourceLevel, depth: number = 0, parentGroupIndex?: number): void => {
                const currentIndex: number = groupIndex;
                headers.push({
                    groupIndex: currentIndex,
                    parentGroupIndex,
                    count: node.children?.length ?? 0,
                    resourceName: node.resourceData[node.resource?.textField] || '',
                    depth,
                    resourceData: node.resourceData,
                    resource: node.resource,
                    groupOrder: node.groupOrder
                });
                groupIndex++;
                node.children?.forEach((child: ResourceLevel) => build(child, depth + 1, currentIndex));
            };

        resourceTree.forEach((root: ResourceLevel) => build(root));
        return headers;
    }

    /**
     * Resolves the leaf-resource index for a given initial resource identifier.
     * Used by compact view mode to honour `group.selectedResource`.
     *
     * @param {ResourceLevel[]} leafResources - All leaf resources, as returned by `getLeafResources`.
     * @param {string | number | undefined} id - Resource identifier (string or number). Matched against each leaf's value at `resource.idField` (default: `'id'`).
     * @returns {number} The zero-based index of the matching leaf resource. Returns `0` when no match is found or when `id` is `undefined`.
     *
     * @private
     */
    static getResourceByInitialId(
        leafResources: ResourceLevel[],
        id: string | number | undefined
    ): number {
        if (!Array.isArray(leafResources) || leafResources.length === 0 || id === undefined || id === null) {
            return 0;
        }
        const matchIndex: number = leafResources.findIndex((leaf: ResourceLevel) => {
            const idField: string = leaf.resource?.idField || 'id';
            const leafId: unknown = getItemByKey(leaf.resourceData, idField);
            return String(leafId) === String(id);
        });
        return matchIndex >= 0 ? matchIndex : 0;
    }

    /**
     * Returns a stable, human-readable label for a leaf resource. The fallback
     * order mirrors the Blazor `RenderResourceHeaderText` resolution
     * (textField ? name ? id) so the breadcrumb renders correctly even when
     * `resourceData` is partially populated by upstream consumers.
     *
     * @param {ResourceLevel} leaf - The leaf resource whose label should be resolved.
     * @returns {string} The resolved label; an empty string when no label candidate is found.
     *
     * @private
     */
    static getLeafLabel(leaf: ResourceLevel | null | undefined): string {
        if (!leaf || typeof leaf !== 'object') {
            return '';
        }
        const resource: SchedulerResource | undefined = leaf.resource;
        const data: Record<string, unknown> | undefined = leaf.resourceData;
        const fieldName: string | undefined = resource?.textField;
        const value: unknown = fieldName ? getItemByKey(data, fieldName) : undefined;
        if (value !== undefined && value !== null) {
            return String(value);
        }
        return '';
    }

    /**
     * Builds a composite, stable id for a tree node as
     * `${resource.name}_${getNodeId(node)}`. Used by the compact-view
     * TreeView so the bound node id is unique across both the resource
     * type and the resource row, matching how the resource data is
     * identified elsewhere in the grouping pipeline.
     *
     * @param {ResourceNodeRef} node - The node whose composite id should be built.
     * @returns {string} The composite id; an empty string when the node, its
     *   `resource` or its resolved id is missing.
     *
     * @private
     */
    static getTreeNodeId(node: ResourceNodeRef | null | undefined): string {
        if (!node || typeof node !== 'object' || !node.resource || !node.resourceData) {
            return '';
        }
        const name: string | undefined = node.resource.name;
        const id: string | number | null = ResourceGroupingService.getNodeId(node);
        if (isNullOrUndefined(name) || isNullOrUndefined(id)) {
            return '';
        }
        return `${name}_${id}`;
    }

    /**
     * Returns the stable identifier of a tree node. Looks up the configured
     * `idField`, falling back to `'id'`. Returns `null` when the node, its
     * data or the resolved id is missing — callers can treat `null` as a
     * non-match rather than crashing on `undefined`.
     *
     * @param {ResourceNodeRef | null | undefined} node - Node whose id should be resolved.
     * @returns {string | number | null} Stable id; `null` when the node, its data, or its id is missing.
     *
     * @private
     */
    static getNodeId(node: ResourceNodeRef | null | undefined): string | number | null {
        if (!node || typeof node !== 'object' || !node.resourceData || !node.resource) {
            return null;
        }
        const idField: string = node.resource.idField ?? 'id';
        const id: unknown = getItemByKey(node.resourceData, idField);
        if (id === undefined || id === null) {
            return null;
        }
        return id as string | number;
    }

    /**
     * Maps `ResourceLevel` tree to compact-view `TreeView` items.
     *
     * @param {ResourceLevel[]} resourceTree - Root resource tree.
     * @returns {ResourceTreeItem[]} Tree items, or `[]` for empty input.
     * @private
     */
    static buildResourceTreeItems(resourceTree: ResourceLevel[] | null | undefined): ResourceTreeItem[] {
        if (!Array.isArray(resourceTree) || resourceTree.length === 0) {
            return [];
        }
        const build: (node: ResourceLevel) => ResourceTreeItem = (node: ResourceLevel): ResourceTreeItem => {
            const isParent: boolean = Array.isArray(node.children) && node.children.length > 0;
            return {
                id: ResourceGroupingService.getTreeNodeId(node),
                label: ResourceGroupingService.getLeafLabel(node),
                selectable: !isParent,
                child: isParent ? node.children.map(build) : [],
                leafIndex: isParent ? undefined : node.groupIndex,
                resourceData: node.resourceData,
                resource: node.resource
            };
        };
        return resourceTree.map(build);
    }

    /**
     * Resolves `selectedIds` for the leaf at `selectedGroupIndex`.
     *
     * @param {ResourceLevel[]} leafResources - Leaves in current scope.
     * @param {number} selectedGroupIndex - Index into `leafResources`, or `-1`.
     * @returns {string[]} `[nodeId]` or `[]`.
     * @private
     */
    static resolveTreeSelectionId(
        leafResources: ResourceLevel[] | null | undefined,
        selectedGroupIndex: number | null | undefined
    ): string[] {
        const idx: number = typeof selectedGroupIndex === 'number' ? selectedGroupIndex : -1;
        const leaf: ResourceLevel | undefined = getItemByIndex(leafResources, idx);
        const id: string = ResourceGroupingService.getTreeNodeId(leaf);
        return id.length > 0 ? [id] : [];
    }

    /**
     * Resolves `defaultExpandedIds` — every parent row (`count > 0`) is expanded.
     *
     * @param {TimelineResourceRowMeta[]} rows - Timeline resource headers.
     * @returns {string[]} Composite node ids for parent rows.
     * @private
     */
    static resolveDefaultExpandedTreeIds(rows: TimelineResourceRowMeta[] | null | undefined): string[] {
        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }
        const ids: string[] = [];
        for (const row of rows) {
            if ((row.count ?? 0) <= 0) {
                continue;
            }
            const id: string = ResourceGroupingService.getTreeNodeId(row);
            if (id.length > 0) {
                ids.push(id);
            }
        }
        return ids;
    }

    /**
     * Resolves the labels for a leaf resource's hierarchy path.
     *
     * @param {ResourceLevel[] | null | undefined} tree - Resource hierarchy.
     * @param {ResourceLevel | null | undefined} leaf - Leaf resource.
     * @returns {string[]} Labels for the leaf's hierarchy path.
     *
     * @private
     */
    static resolveLeafBreadcrumb(
        tree: ResourceLevel[] | null | undefined,
        leaf: ResourceLevel | null | undefined
    ): string[] {
        if (!leaf) {
            return [];
        }
        const path: (string | number)[] = Array.isArray(leaf.groupOrder) ? [...leaf.groupOrder] : [];
        if (path.length === 0 || !Array.isArray(tree) || tree.length === 0) {
            return [];
        }
        const labels: string[] = [];
        let currentLevel: ResourceLevel[] = tree;
        for (const segment of path) {
            const target: string = String(segment);
            const match: ResourceLevel | undefined = currentLevel.find((node: ResourceLevel): boolean => {
                const nodeId: string | number | null = ResourceGroupingService.getNodeId(node);
                return nodeId !== null && String(nodeId) === target;
            });
            if (!match) {
                break;
            }
            const label: string = ResourceGroupingService.getLeafLabel(match);
            if (label.length > 0) {
                labels.push(label);
            }
            currentLevel = Array.isArray(match.children) ? match.children : [];
        }
        return labels;
    }
}
