import { createContext, useContext, FC, ReactNode, useMemo, Context } from 'react';
import { SchedulerGroup } from '../types/scheduler-types';
import { CellData } from '../types/internal-interface';
import { ResourceGroupingMetadata, ResourceGroupingService, ResourceLevel } from '../services/ResourceGroupingService';
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
     * Hierarchical resource tree
     */
    resourceTree: ResourceLevel[];

    /**
     * All leaf-level resources
     */
    leafResources: ResourceLevel[];

    /**
     * Grouping metadata
     */
    metadata: ResourceGroupingMetadata;

    /**
     * Column header levels for rendering (vertical views)
     */
    columnLevels: CellData[][];

    /**
     * Column header levels specifically for Month view rendering
     * Uses weekday slots (7 per week) instead of full render dates
     */
    monthColumnLevels?: CellData[][];
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
 * ResourceGroupingProvider component
 *
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} React component that provides resource grouping context to its children
 *
 * @private
 */
export const ResourceGroupingProvider: FC<ResourceGroupingProviderProps> = ({
    children
}: ResourceGroupingProviderProps) => {
    const { renderDates } = useSchedulerRenderDatesContext();
    const {resources, group, workDays} = useSchedulerPropsContext();
    const value: ResourceGroupingContextType = useMemo<ResourceGroupingContextType>(() => {
        const isGroupingEnabled: boolean =
            group && group.resources && group.resources.length > 0;

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
                    depth: 0,
                    leafResources: []
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
