import { SchedulerResource, SchedulerGroup } from '../types/scheduler-types';
import { CellData } from '../types/internal-interface';

/**
 * Represents a single resource in the hierarchy.
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
     * Depth of the resource hierarchy.
     */
    depth: number;

    /**
     * Array of leaf-level resources.
     */
    leafResources: ResourceLevel[];
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
            depth: groupConfig.resources.length,
            leafResources: leaves
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
        const tdData: CellData = {
            type: 'resourceHeader',
            resource: resource.resource,
            resourceData: resource.resourceData,
            resourceLevelIndex: level,
            groupOrder: resource.groupOrder,
            className: ['sf-resource-cells'],
            colSpan: resource.children.length > 0 ? resource.children.length : 1,
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
}
