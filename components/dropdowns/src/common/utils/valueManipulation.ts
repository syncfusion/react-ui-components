import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { FieldSettingsModel } from '../../drop-down-list/types';

export const compareItemData: <T>(item1: T | null, item2: T | null) => boolean = <T>(
    item1: T | null, item2: T | null): boolean => {
    if (item1 == null && item2 == null) {
        return true;
    }
    if (item1 == null || item2 == null) {
        return false;
    }
    try {
        const str1: string = JSON.stringify(item1);
        const str2: string = JSON.stringify(item2);
        return str1 === str2;
    } catch {
        return item1 === item2;
    }
};

export const isPrimitive: <T>(value: T) => boolean = <T>(value: T): boolean => {
    return (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
};

export const getTextValueField: <T>(item: T, type: string, fields?: FieldSettingsModel) => T | string =
    <T>(item: T, type: string, fields?: FieldSettingsModel): T | string => {
        let resolvedField: string;
        if (type === 'value') {
            resolvedField = fields?.value ?? 'value';
        } else {
            resolvedField = fields?.text ?? 'text';
        }
        if (isPrimitive(item)) {
            return item;
        } else if (typeof item === 'object' && item !== null) {
            return getValue(resolvedField, item);
        } else {
            return '' ;
        }
    };

export const updateItemData: <T>(currentItemData: T[] | null, newItem: T | T[] | null, multiSelectable: boolean,
    maximumSelectionLength?: number) => T[] | null = <T>(currentItemData: T[] | null, newItem: T | T[] | null,
    multiSelectable: boolean, maximumSelectionLength: number = 0): T[] | null => {
    if (newItem === null) {
        return [];
    }
    if (multiSelectable) {
        if (Array.isArray(newItem)) {
            if (compareItemData(currentItemData, newItem)) {
                return currentItemData;
            }
            return newItem;
        }
        const itemExists: boolean = currentItemData?.some((item: T) => compareItemData(item, newItem)) || false;
        if (itemExists) {
            return (
                currentItemData?.filter((item: T) => !compareItemData(item, newItem)) || []
            );
        }
        if (maximumSelectionLength > 0 && currentItemData && currentItemData.length >= maximumSelectionLength) {
            return currentItemData;
        }
        return [...(currentItemData || []), newItem];
    } else {
        return Array.isArray(newItem) ? newItem : [newItem];
    }
};

export const getIndexOfItemData: <T>(itemData: T | null | undefined, listData: T[] | undefined, fields: FieldSettingsModel) => number =
    <T>(itemData: T | undefined | null, listData: T[] | undefined, fields: FieldSettingsModel): number => {
        if (isNullOrUndefined(itemData) || !Array.isArray(listData) || listData.length === 0) {
            return -1;
        }
        const valueField: string = fields?.value || 'value';
        const primitive: boolean = isPrimitive(itemData);
        const targetValue: string = !primitive ? String(getValue(valueField, itemData)) : String(itemData);
        for (let i: number = 0; i < listData.length; i++) {
            const row: T = listData[i as number];
            if (isNullOrUndefined(row) || (!primitive && (row as Record<string, unknown>)?.['isHeader'])) {
                continue;
            }
            if (!primitive) {
                const rowVal: unknown = getValue(valueField, row);
                if (!isNullOrUndefined(rowVal) && String(rowVal) === targetValue) {
                    return i;
                }
            } else if (String(row) === targetValue) {
                return i;
            }
        }
        return -1;
    };

export const hasItemData: <T>(itemData: T[] | null) => boolean = <T>(itemData: T[] | null): boolean => {
    return Array.isArray(itemData) && itemData.length > 0;
};

export const getLastItemData: <T>(itemData: T[] | null) => T | null = <T>(itemData: T[] | null): T | null => {
    if (!Array.isArray(itemData) || itemData.length === 0) {
        return null;
    }
    return itemData[itemData.length - 1];
};

export const removeItem: <T, V>(itemData: T[], removedValue: V, fields: FieldSettingsModel) => T[] =
    <T, V>(itemData: T[], removedValue: V, fields: FieldSettingsModel): T[] => {
        if (!Array.isArray(itemData) || removedValue === undefined) {
            return itemData;
        }
        return itemData.filter((item: T) => {
            return !compareItemData(getTextValueField(item, 'value', fields), removedValue as T);
        });
    };

export const extractValuesFromItems: <T>(items: T[], fields: FieldSettingsModel) => T[] | null =
    <T>(items: T[], fields: FieldSettingsModel): T[] | null => {
        if (!Array.isArray(items) || items.length === 0) {
            return null;
        }
        return items.map((item: T) => {
            if (typeof item === 'object' && item !== null && fields.value) {
                return getValue(fields.value, item);
            }
            return item;
        });
    };

export const isValueFieldMatched: <T>(itemData: T[], item: T, valueField: string) => boolean =
    <T>(itemData: T[], item: T, valueField: string): boolean => {
        if (!Array.isArray(itemData) || !itemData.length) {
            return false;
        }
        const currentItemValue: T = typeof item === 'object' && item !== null
            ? (item as Record<string, unknown>)[String(valueField)] as T : (item);
        return itemData.some((selectedItem: T) => {
            const selectedValue: T = typeof selectedItem === 'object' && selectedItem !== null
                ? (selectedItem as Record<string, unknown>)[String(valueField)] as T : (selectedItem);
            return String(selectedValue) === String(currentItemValue);
        });
    };

export const determineDataType: <T>(items: T[], fields: FieldSettingsModel) => { typeof: string | null; item: T | null } =
    <T>(items: T[], fields: FieldSettingsModel): { typeof: string | null; item: T | null } => {
        let result: { typeof: string | null; item: T | null } = { typeof: null, item: null };
        if (!Array.isArray(items) || items.length === 0) {
            return result;
        }
        for (let i: number = 0; i < items.length; i++) {
            if (items[i as number] !== null && items[i as number] !== undefined) {
                const primitive: boolean = isPrimitive(items[i as number]);
                const isNullData: boolean = primitive ? isNullOrUndefined(items[i as number]) :
                    isNullOrUndefined(getValue((fields.value ?? ''), items[i as number]));
                if (!isNullData) {
                    return result = { typeof: typeof items[i as number], item: items[i as number] };
                }
            }
        }
        return result;
    };

export const ensureValueExistsInCache: <T>(selected: T, remoteCache?: T[] | null, fields?: FieldSettingsModel) => T[] | null | undefined
    = <T>(selected: T , remoteCache?: T[] | null,
        fields?: FieldSettingsModel): T[] | null | undefined => {
        if (!remoteCache || !selected) { return remoteCache; }
        const cache: T[] = Array.from(remoteCache);
        const isPrim: boolean = isPrimitive(selected);
        const selectedValue: string = String(isPrim ? selected : getValue(fields?.value as string, selected));
        const exists: boolean = cache.some((data: T) => String(isPrim ? data : getValue(fields?.value as string, data)) === selectedValue);
        if (!exists) {
            cache.push(selected as T);
            return cache;
        }
        return remoteCache;
    };
