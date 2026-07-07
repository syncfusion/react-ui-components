import { useMemo, useCallback } from 'react';
import { getValue } from '@syncfusion/react-base';
import { isPrimitive } from '../utils';
import { ListItemData } from '../types';
import { T } from '../../drop-down-list';
import { GroupState, ToggleResult, UseDropdownGroupedSelectionProps, UseDropdownGroupedSelectionReturn } from './hook-types';

export const useDropdownGroupedSelection: (props: UseDropdownGroupedSelectionProps) => UseDropdownGroupedSelectionReturn =
    (props: UseDropdownGroupedSelectionProps): UseDropdownGroupedSelectionReturn => {
        const {
            config: { skipDisabledItems, maximumSelectionLength },
            state: { dropdownValue, itemData, listData },
            internalProps: { resolvedFields }
        } = props;

        const getItemValue: (item: T) => T = useCallback((item: T): T => {
            if (isPrimitive(item)) { return item; }
            return resolvedFields.value ? (getValue(resolvedFields.value, item)) : (item);
        }, [resolvedFields.value]);

        const getItemGroupKey: (item: T) => string = useCallback((item: T): string => {
            if (!resolvedFields.groupBy) { return ''; }
            return String(getValue(resolvedFields.groupBy, item) ?? '');
        }, [resolvedFields.groupBy]);

        const getHeaderGroupKey: (headerItem: T) => string = useCallback((headerItem: T): string => {
            const label: string = String(getValue(resolvedFields.text || 'text', headerItem) ?? '');
            return label;
        }, []);

        const groupsData: {
            groups: Record<string, { items: T[]; values: T[]; valueStrings: string[] }>;
            valueToItem: Map<string, T>;
            allItemValues: T[];
            valueToValueStr: Map<T, string>;
        } =
        useMemo(() => {
            const g: Record<string, { items: T[]; values: T[]; valueStrings: string[] }> = Object.create(null);
            const valueToItem: Map<string, T> = new Map();
            const allItemValues: T[] = [];
            const valueToValueStr: Map<T, string> = new Map();
            for (let i: number = 0; i < (listData?.length ?? 0); i++) {
                const li: ListItemData = listData[i as number];
                if (!li || li.isHeader) {
                    continue;
                }
                if (skipDisabledItems && li.isDisabled) {
                    continue;
                }
                const groupKey: string = getItemGroupKey(li.item);
                const val: T = getItemValue(li.item);
                const valStr: string = String(val);
                const bucket: { items: T[]; values: T[]; valueStrings: string[] } = g[groupKey as string] ?? (g[groupKey as string] =
                    { items: [], values: [], valueStrings: [] });
                bucket.items.push(li.item);
                bucket.values.push(val);
                bucket.valueStrings.push(valStr);
                valueToItem.set(valStr, li.item);
                valueToValueStr.set(val, valStr);
                allItemValues.push(val);
            }
            return { groups: g, valueToItem, allItemValues, valueToValueStr };
        }, [listData, skipDisabledItems, getItemGroupKey, getItemValue]);

        const selectedValueSet: Set<string> = useMemo(() => {
            const raw: T[] = itemData ?? [];
            const s: Set<string> = new Set();
            for (let i: number = 0; i < raw.length; i++) {
                s.add(String(getItemValue(raw[i as number])));
            }
            return s;
        }, [itemData, getItemValue]);

        const groupStates: Record<string, GroupState> = useMemo(() => {
            const state: Record<string, GroupState> = Object.create(null);
            for (const [key, bucket] of Object.entries(groupsData.groups)) {
                const values: T[] = bucket.values;
                const total: number = values.length;
                if (total === 0) {
                    state[key as string] = { checked: false, indeterminate: false, total: 0, selected: 0 };
                    continue;
                }
                let selected: number = 0;
                for (let j: number = 0; j < values.length; j++) {
                    if (selectedValueSet.has(String(values[j as number]))) {
                        selected++;
                    }
                }
                const checked: boolean = selected === total;
                const indeterminate: boolean = selected > 0 && selected < total;
                state[key as string] = { checked, indeterminate, total, selected };
            }
            return state;
        }, [groupsData.groups, selectedValueSet]);

        const toggleGroupByKey: (groupKey: string) => ToggleResult = useCallback((groupKey: string): ToggleResult => {
            const bucket: { items: T[]; values: T[]; valueStrings: string[] } = groupsData.groups[groupKey as string];
            if (!bucket) {
                return {
                    newItemData: (itemData ?? []),
                    newDropdownValue: (dropdownValue ?? [])
                };
            }
            const allValues: T[] = bucket.values;
            const valueStrings: string[] = bucket.valueStrings;
            let selectedCount: number = 0;
            for (let i: number = 0; i < valueStrings.length; i++) {
                if (selectedValueSet.has(valueStrings[i as number])) {
                    selectedCount++;
                }
            }
            const allSelected: boolean = selectedCount === allValues.length && allValues.length > 0;
            const nextSet: Set<string> = new Set(selectedValueSet);
            if (allSelected) {
                for (let i: number = 0; i < valueStrings.length; i++) {
                    nextSet.delete(valueStrings[i as number]);
                }
            } else {
                for (let i: number = 0; i < valueStrings.length; i++) {
                    if (maximumSelectionLength && maximumSelectionLength > 0 && nextSet.size >= maximumSelectionLength) {
                        break;
                    }
                    nextSet.add(valueStrings[i as number]);
                }
            }
            const nextItems: T[] = [];
            const nextValues: T[] = [];
            if (itemData && itemData.length > 0) {
                for (let i: number = 0; i < itemData.length; i++) {
                    const item: T = itemData[i as number];
                    const val: T = getItemValue(item);
                    const valStr: string = groupsData.valueToValueStr.get(val) ?? String(val);
                    if (nextSet.has(valStr)) {
                        nextItems.push(item);
                        nextValues.push(val);
                    }
                }
            }

            for (const valStr of nextSet) {
                if (!selectedValueSet.has(valStr)) {
                    const item: T | undefined = groupsData.valueToItem.get(valStr);
                    if (item !== undefined) {
                        nextItems.push(item);
                        const val: T = getItemValue(item);
                        nextValues.push(val);
                    }
                }
            }

            return { newItemData: nextItems, newDropdownValue: nextValues };
        }, [groupsData.groups, groupsData.valueToItem, groupsData.valueToValueStr, selectedValueSet, maximumSelectionLength, itemData,
            getItemValue]);

        return { groupStates, getHeaderGroupKey, toggleGroupByKey };
    };
