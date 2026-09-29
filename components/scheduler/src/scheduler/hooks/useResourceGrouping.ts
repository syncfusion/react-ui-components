import { useCallback, useEffect } from 'react';
import { SchedulerResource } from '../types/scheduler-types';
import { ResourceLevel, TimelineResourceRowMeta } from '../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';

/**
 * Custom hook to extract resource values from a groupIndex.
 *
 * Maps a groupIndex to its corresponding resource IDs using the leafResources array.
 * When groupIndex is undefined/null, falls back to using the first item from each resource's dataSource.
 *
 * @returns {Function} Function that takes optional groupIndex and returns a map of { fieldName: resourceId }
 *
 * @private
 */
export const useSetResourceValues: () => (groupIndex?: number) => Record<string, any> =
    (): ((groupIndex?: number) => Record<string, any>) => {
        const { allLeafResources, timelineResourceHeaders } = useResourceGroupingContext();
        const { resources, isTimelineView } = useSchedulerPropsContext();

        return useCallback((groupIndex?: number): Record<string, any> => {
            const resourceValues: Record<string, any> = {};
            if (!resources?.length) { return resourceValues; }
            let hasGroup: boolean = typeof groupIndex === 'number' && groupIndex >= 0;
            hasGroup = hasGroup && groupIndex < (isTimelineView ? timelineResourceHeaders.length : allLeafResources.length);
            const leaf: ResourceLevel | TimelineResourceRowMeta | undefined = hasGroup
                ? (isTimelineView ? timelineResourceHeaders[parseInt(groupIndex.toString(), 10)]
                    : allLeafResources[parseInt(groupIndex.toString(), 10)]) : undefined;
            const groupOrder: string[] | undefined = leaf?.groupOrder;
            resources.forEach((resource: SchedulerResource, index: number) => {
                const { field } = resource;
                let value: string | number | (string | number)[] | undefined;
                if (hasGroup && groupOrder) {
                    value = groupOrder?.[parseInt(index.toString(), 10)];
                }
                else if (Array.isArray(resource.dataSource) && resource.dataSource.length > 0) {
                    const firstItem: Record<string, any> = resource.dataSource[0] as Record<string, any>;
                    const idField: string = resource.idField || 'id';
                    value = firstItem[`${idField}`];
                }
                if (!isNullOrUndefined(value) && !isNullOrUndefined(field)) {
                    resourceValues[`${field}`] = value;
                }
            });
            return resourceValues;
        }, [resources, allLeafResources, timelineResourceHeaders]);
    };

/**
 *
 * When the editor opens with a groupIndex (from cell double-click), this hook
 * automatically extracts the corresponding resource values and applies them.
 *
 * @param {number} groupIndex - The group index (available when cell was double-clicked)
 * @param {function(Object): void} onResourceValuesExtracted - Callback when resource values are extracted
 * @param {string} action - The action type (Add/Edit)
 * @returns {void}
 *
 * @private
 */
export const useExtractResourceValuesFromGroupIndex: (
    groupIndex?: number,
    onResourceValuesExtracted?: (values: Record<string, any>) => void,
    action?: string
) => void = (
    groupIndex?: number,
    onResourceValuesExtracted?: (values: Record<string, any>) => void,
    action?: string
): void => {
    const setResourceValuesFunc: (groupIndex: number) => Record<string, any> = useSetResourceValues();
    useEffect(() => {
        if (action === 'Add' && onResourceValuesExtracted) {
            const extractedValues: Record<string, any> = setResourceValuesFunc(parseInt(groupIndex?.toString(), 10));
            if (Object.keys(extractedValues).length > 0) {
                onResourceValuesExtracted(extractedValues);
            }
        }
    }, [groupIndex, action]);
};
