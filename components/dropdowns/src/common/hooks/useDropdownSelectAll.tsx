import { SyntheticEvent, useCallback, useMemo } from 'react';
import { ListItemData } from '../types';
import { T } from '../../drop-down-list/types';
import { getTextValueField } from '../utils';
import { UseDropdownSelectAllProps, UseDropdownSelectAllReturn } from './hook-types';

export const useDropdownSelectAll: (props: UseDropdownSelectAllProps) => UseDropdownSelectAllReturn = (props: UseDropdownSelectAllProps):
UseDropdownSelectAllReturn => {
    const {
        state: { listData, itemData },
        actions: { setItemData, setDropdownValue },
        config: { fields, onSelectAll, maximumSelectionLength, multiSelectable, checkbox, showSelectAll }
    } = props;

    const enabled: boolean = Boolean(multiSelectable && checkbox && showSelectAll);

    const selectableItems: T[] = useMemo(() => {
        if (!enabled) { return []; }
        return listData.filter((li: ListItemData) => !li.isDisabled && !li.isHeader).map((li: ListItemData) => li.item as T);
    }, [listData, enabled]);

    const { isAllSelected, isIndeterminate } = useMemo(() => {
        if (!enabled || !itemData?.length || selectableItems.length === 0) {
            return { isAllSelected: false, isIndeterminate: false };
        }
        return {
            isAllSelected: selectableItems.length === itemData.length,
            isIndeterminate: itemData.length > 0 && itemData.length < selectableItems.length
        };
    }, [itemData, selectableItems, enabled]);

    const handleSelectAll: (e: SyntheticEvent) => void = useCallback((e: SyntheticEvent) => {
        e.preventDefault();
        let newItemData: T[];

        if (isAllSelected) {
            newItemData = [];
        } else {
            if (maximumSelectionLength && selectableItems.length > maximumSelectionLength) {
                newItemData = selectableItems.slice(0, maximumSelectionLength);
            } else {
                newItemData = [...selectableItems];
            }
        }
        setItemData(newItemData as string[]);
        setDropdownValue(newItemData.map((item: T) => getTextValueField(item as string, 'value', fields)));
        onSelectAll?.({ selectedItems: newItemData as string[], event: e });
    }, [isAllSelected, itemData, selectableItems, setItemData, setDropdownValue, fields, onSelectAll, maximumSelectionLength]);

    return { isAllSelected, isIndeterminate, handleSelectAll };
};
