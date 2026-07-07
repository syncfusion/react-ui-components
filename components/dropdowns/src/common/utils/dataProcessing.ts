import { SortOrder, FieldSettingsModel } from '../../drop-down-list/types';
import { Query } from '@syncfusion/react-data';
import { addSorting, getData, groupDataSource } from '@syncfusion/react-lists';
import { isPrimitive } from './valueManipulation';
import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { ListItemData } from '../types';

export const processDataResult: <T>(result: T[], fields: FieldSettingsModel, sortOrder: SortOrder, query: Query) => T[] =
    <T>(result: T[], fields: FieldSettingsModel, sortOrder: SortOrder, query: Query): T[] => {
        const isPrimitiveArray: boolean = result.length > 0 && (isPrimitive(result[0]));
        if (isPrimitiveArray || !fields.groupBy) {
            if (isPrimitiveArray && sortOrder !== SortOrder.None) {
                const sortedResult: T[] = [...result];
                if (sortOrder === SortOrder.Ascending) {
                    sortedResult.sort((a: T, b: T) => String(a).localeCompare(String(b)));
                } else if (sortOrder === SortOrder.Descending) {
                    sortedResult.sort((a: T, b: T) => String(b).localeCompare(String(a)));
                }
                return sortedResult;
            } else {
                const sortQuery: Query = addSorting(sortOrder, fields?.text || 'text', query);
                const response: Object | null = getData(result as { [key: string]: Object }[], sortQuery);
                const fullResult: T[] = (response && Array.isArray((response as { result: T[] }).result) ?
                    (response as { result: T[] }).result : response as T[]);
                return fullResult;
            }
        } else {
            return groupDataSource(result as { [key: string]: Object }[], {
                id: fields?.value, text: fields?.text, groupBy: fields?.groupBy,
                disabled: fields?.disabled, htmlAttributes: fields?.htmlAttributes
            }, sortOrder) as T[];
        }
    };

export const getResolvedQuery: (query?: Query) => Query = (query?: Query): Query => {
    return (query || new Query()).clone();
};

export const applyMaxSuggestions: <T>(items: T[], maxSuggestions?: number, inputValue?: string) => T[]
    = <T, >(items: T[], maxSuggestions?: number, inputValue?: string): T[] => {
        if (inputValue?.trim() && typeof maxSuggestions === 'number' && maxSuggestions > 0 && Array.isArray(items)) {
            return items.slice(0, maxSuggestions);
        }
        return items;
    };

export const normalizeOperator: <T>(op: T) => string = <T>(op: T): string => {
    const raw: string = String(op ?? '');
    switch (raw) {
    case 'StartsWith':
        return 'startsWith';
    case 'EndsWith':
        return 'endsWith';
    case 'Contains':
        return 'contains';
    default:
        return 'contains';
    }
};

export const normalizeListData: <T>(dataSource: T[], remoteCacheRef: T[] | null, fields: FieldSettingsModel, sortOrder: SortOrder,
    query: Query) => ListItemData[] = <T>(dataSource: T[], remoteCacheRef: T[] | null, fields: FieldSettingsModel,
    sortOrder: SortOrder, query: Query): ListItemData[] => {
    const source: T[] = remoteCacheRef ? remoteCacheRef : (Array.isArray(dataSource) ? dataSource : []);
    if (source.length === 0) {
        return [];
    }
    const normalized: T[] = source.filter((v: T) => v != null);
    if (normalized.length === 0) { return []; }
    const processed: T[] = processDataResult(normalized, fields, sortOrder, query ?? new Query());
    return processed.map((item: T) => {
        const isDisabled: boolean = Boolean(fields.disabled && typeof item === 'object' && getValue(fields.disabled, item) === true);
        const isHeader: boolean = typeof item === 'object' && !!getValue('isHeader', item);
        return {
            item: item as object,
            isDisabled: Boolean(isDisabled),
            isHeader
        };
    });
};

export const normalizeRemoteData: <T>(data: unknown[] | null) => T[] | null =
    <T>(data: unknown[] | null): T[] | null => {
        if (!Array.isArray(data)) {
            return null;
        }
        return (data as T[]).filter((v: T) => v != null);
    };

export const resolveItemDisplayText: <T>(textByValue: string | undefined, formattedValue: T, hasTextField: boolean) => string =
    <T>(textByValue: string | undefined, formattedValue: T, hasTextField: boolean): string => {
        const text: string = textByValue || '';
        if (text === '' && !hasTextField && formattedValue !== undefined) {
            return String(formattedValue);
        }
        return text;
    };

export const getDataByValueField: <T, V>(value: V, listData: T[], fields: FieldSettingsModel, item: T | null) => T | undefined =
    <T, V>(value: V, listData: T[], fields: FieldSettingsModel, item: T | null): T | undefined => {
        if (!Array.isArray(listData) || listData.length === 0) {
            return undefined;
        }
        const primitive: boolean = isPrimitive(item);
        for (let i: number = 0; i < listData.length; i++) {
            const item: T = listData[i as number];
            if (isNullOrUndefined(item)) { continue; }
            if (String(primitive ? item : getValue((fields.value as string), item)) === String(value)) {
                return item;
            }
        }
        return undefined;
    };

export const compareTextWithCaseOption: (item: string, text: string, ignoreCase: boolean) => boolean =
    (item: string, text: string, ignoreCase: boolean): boolean => {
        if (isNullOrUndefined(item)) {
            return false;
        }
        if (!ignoreCase) {
            return String(item) === text?.toString();
        }
        return String(item).toLowerCase() === text?.toString().toLowerCase();
    };

export const findValueByTextMatch: <T>(text: string, listData: T[], fields: FieldSettingsModel,
    ignoreCase: boolean) => string | number | null =
    <T>(text: string, listData: T[], fields: FieldSettingsModel, ignoreCase: boolean): string | number | null => {
        if (!Array.isArray(listData) || listData.length === 0) {
            return null;
        }
        const match: T | undefined = listData.find((item: T) => {
            if (isNullOrUndefined(getValue(fields.value as string, item))) {
                return false;
            }
            return compareTextWithCaseOption(String(getValue(fields.value || '', item)), text, ignoreCase);
        });
        return match ? (getValue((fields.text || fields.value) as string, match) as string) : null;
    };

export const resolveTextFromValue: <T, V>(value: T, item: V, listData: V[], fields: FieldSettingsModel, ignoreCase: boolean) => string
    = <T, V>(value: T, item: V, listData: V[],
        fields: FieldSettingsModel, ignoreCase: boolean): string => {
        if (isPrimitive(item)) {
            return String(value);
        }
        return findValueByTextMatch(value as string, listData, fields, ignoreCase) as string || '';
    };

export const isSameData: <T>(newData: T, initialData: string | null) => boolean = <T>(newData: T, initialData: string | null) => {
    return JSON.stringify(newData) === initialData;
};
