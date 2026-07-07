import { useCallback, useEffect } from 'react';
import { SchedulerResource } from '../types/scheduler-types';
import { ResourceLevel } from '../services/ResourceGroupingService';
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
        const { leafResources } = useResourceGroupingContext();
        const { resources } = useSchedulerPropsContext();

        return useCallback((groupIndex?: number): Record<string, any> => {
            const resourceValues: Record<string, any> = {};
            if (!resources?.length) { return resourceValues; }
            const assignValue: (field: string, value: string | number | (string | number)[], multiple?: boolean) => void = (
                field: string,
                value: string | number | (string | number)[] | undefined,
                multiple?: boolean
            ) => {
                if (!isNullOrUndefined(value)) {
                    resourceValues[`${field}`] = multiple ? [value] : value;
                }
            };
            const hasGroup: boolean = typeof groupIndex === 'number' && Number.isFinite(groupIndex) && leafResources?.length > 0;
            resources.forEach((resource: SchedulerResource, index: number) => {
                const { field, multiple } = resource;
                let value: string | number | (string | number)[] | undefined;
                if (hasGroup) {
                    const leaf: ResourceLevel = leafResources![parseInt(groupIndex.toString(), 10)];
                    const groupOrder: string[] = leaf?.groupOrder;
                    value = groupOrder?.[parseInt(index.toString(), 10)];
                }
                else if (Array.isArray(resource.dataSource) && resource.dataSource.length > 0) {
                    const firstItem: Record<string, any> = resource.dataSource[0] as Record<string, any>;
                    const idField: string = resource.idField || 'id';
                    value = firstItem[`${idField}`];
                }
                assignValue(field, value, multiple);
            });
            return resourceValues;
        }, [resources, leafResources]);
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
