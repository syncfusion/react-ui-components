import { useCallback, useLayoutEffect, useRef } from 'react';
import { DataManager } from '@syncfusion/react-data';
import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import type { IDropDownBase } from '../../common/types';
import { ListItemData } from './useKeyboardNavigation';
import { FieldSettingsModel } from '../types';

/**
 * Specifies the properties used by the `useValueSync` hook to manage the state and behavior of the DropDownList component.
 *
 * @private
 */
interface UseValueSyncProps {
    value?: number | string | boolean | object | null;
    defaultValue?: number | string | boolean | object | null;
    dataSource?: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[];
    dataSourceListItems?: ListItemData[];
    fields: FieldSettingsModel;
    isValueControlled?: boolean;
    allowObjectBinding?: boolean;
    filterable?: boolean;
    dropdownbaseRef?: React.RefObject<IDropDownBase | null>;
    setDropdownValue: (v: number | string | boolean | object | null) => void;
    setTextValue: (v: string) => void;
    setActiveIndex: (v: number | null) => void;
    setItemData?: (v:  string | number | boolean | { [key: string]: unknown } | null) => void;
    prefetchData?: () => Promise<(string | number | boolean | { [key: string]: unknown })[] | null>;
}

export const useValueSync: (props: UseValueSyncProps) => void = (props: UseValueSyncProps): void => {
    const { value, defaultValue, dataSource, dataSourceListItems, fields, isValueControlled, allowObjectBinding, filterable,
        dropdownbaseRef, setDropdownValue, setTextValue, setActiveIndex, setItemData, prefetchData } = props;

    const prevDefaultRef: React.RefObject<number | string | boolean | object |
    null | undefined> = useRef<number | string | boolean | object | null | undefined>(defaultValue);
    const ranOnceRef: React.RefObject<boolean> = useRef<boolean>(false);
    const prevDataSourceRef: React.RefObject<unknown> = useRef<unknown>(dataSource);

    const isPrimitive: (val: unknown) => boolean = useCallback((val: unknown): boolean => {
        return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
    }, []);

    const setFallback: (val: number | string | boolean | object | null) => void =
        useCallback((val: number | string | boolean | object | null): void => {
            if (Array.isArray(dataSource)) {
                const first: unknown = dataSource[0];
                const isStringArray: boolean = typeof first === 'string' || dataSource.length === 0;
                if ((isStringArray && typeof val === 'boolean')) {
                    setTextValue('');
                    return;
                } else if (typeof first === 'object' && !allowObjectBinding) {
                    return;
                }
            }
            const textField: string | undefined = (fields as FieldSettingsModel | undefined)?.text;
            const objectValue: string =
                textField && val && typeof val === 'object' ? String((val as Record<string, unknown>)[textField as string]) : '';
            setTextValue(isPrimitive(val) ? String(val) : allowObjectBinding && textField ? String(objectValue)  : '');
        }, [dataSource, isPrimitive, setTextValue]);

    const getLookupValue: (candidate: unknown) => string | number | boolean | null = useCallback(
        (candidate: unknown): string | number | boolean | null => {
            const valueField: string | undefined = fields?.value;
            if (allowObjectBinding && candidate && typeof candidate === 'object' && valueField) {
                const value: unknown = (candidate as Record<string, unknown>)[valueField as string];
                return (value as string | number | boolean) ?? null;
            }
            return (candidate as string | number | boolean | null) ?? null;
        },
        [allowObjectBinding, fields?.value]
    );

    const getTextFromData: (value: string | number | boolean, dataSourceListItems: ListItemData[] | undefined) => { index: number;
        textValue: string; } = useCallback( (value: string | number | boolean, dataSourceListItems: ListItemData[] | undefined) => {
        const valueField: string | undefined = fields?.value;
        if (dataSourceListItems && typeof dataSourceListItems === 'object' && valueField) {
            for (let i: number = 0; i < dataSourceListItems.length; i++) {
                if (getValue(valueField, dataSourceListItems[i as number].item) === value) {
                    return {index: i, textValue: getValue((fields.text || fields.value) as string, dataSourceListItems[i as number].item)};
                }
            }
        }
        return {index: -1, textValue: value};
    }, [fields?.value, fields?.text] );

    const handleArrayDataSource: (source: Array<string | number | boolean | { [key: string]: object; }>, val: number | string | boolean
    | object | null) => boolean = useCallback(( source: Array<string | number | boolean | { [key: string]: object }>, val: number |
    string | boolean | object | null ): boolean => {
        if (!Array.isArray(source) || isNullOrUndefined(val)) { return false; }
        const isPrimitiveArray: boolean = source.length > 0 && isPrimitive(source[0]);
        const valueField: string | undefined = fields?.value as string | undefined;
        const textField: string | undefined = fields?.text as string | undefined;
        const indexMap: Map<string, number> = new Map();
        source.forEach((item: string | number | boolean | { [key: string]: object }, index: number) => {
            const key: string = isPrimitiveArray ? String(item) : (valueField ? String(getValue(valueField, item)) : '');
            indexMap.set(key, index);
        });
        const idx: number = indexMap.get(String(val)) ?? -1;
        if (idx !== -1) {
            const item: string | number | boolean | { [key: string]: object } = source[idx as number];
            const text: string = isPrimitiveArray ? String(item) : (textField ? String(getValue(textField, item)) : String(val));
            setTextValue(text);
            setActiveIndex(idx);
            setItemData?.(item);
            return true;
        }
        return false;
    }, [fields?.value, fields?.text, isPrimitive, setActiveIndex, setTextValue]);

    useLayoutEffect(() => {
        if (isValueControlled) {
            const candidate: string | number | boolean | object | null | undefined = value;
            if (!isNullOrUndefined(candidate)) {
                setDropdownValue(candidate as number | string | boolean | object);
                const ds: { [key: string]: unknown; }[] | DataManager | string[] | number[] | boolean[] | undefined =
                filterable ? dropdownbaseRef?.current?.getFilteredListData() : dataSource;
                if (ds && Array.isArray(ds)) {
                    if (!handleArrayDataSource( ds as Array<string | number | boolean | { [key: string]: object }>,
                                                candidate as number | string | boolean | object )) {
                        setFallback(candidate as number | string | boolean | object);
                    }
                } else if (ds instanceof DataManager) {
                    const lookupVal: string | number | boolean | null = getLookupValue(candidate);
                    if (!isNullOrUndefined(lookupVal)) {
                        let text: string = dropdownbaseRef?.current?.getTextByValue?.(lookupVal as string | number | boolean) ?? '';
                        let idx: number =  dropdownbaseRef?.current?.getIndexByValue?.(lookupVal as string | number | boolean) ?? -1;
                        if (text === '' && !dropdownbaseRef?.current) {
                            const { index, textValue } = getTextFromData(lookupVal as string | number | boolean, dataSourceListItems);
                            text = textValue; idx = index;
                        }
                        setTextValue(text);
                        setActiveIndex(idx !== -1 ? idx : null);
                    } else {
                        setTextValue('');
                        setActiveIndex(null);
                    }
                }
            }
            else {
                setTextValue('');
                setActiveIndex(null);
            }
            return;
        }

        const defaultChanged: boolean = JSON.stringify(prevDefaultRef.current) !== JSON.stringify(defaultValue);
        const dsChanged: boolean = JSON.stringify(prevDataSourceRef.current) !== JSON.stringify(dataSource);

        if (!ranOnceRef.current || defaultChanged || dsChanged) {
            const candidate: number | string | boolean | object | null | undefined = value != null ? value : defaultValue;
            if (!isNullOrUndefined(candidate)) {
                setDropdownValue(candidate as number | string | boolean | object);
                if (dataSource && Array.isArray(dataSource)) {
                    if (!handleArrayDataSource( dataSource as Array<string | number | boolean | { [key: string]: object }>,
                                                candidate as number | string | boolean | object
                    )) {
                        setFallback(candidate as number | string | boolean | object);
                    }
                } else if (dataSource instanceof DataManager) {
                    if (prefetchData) {
                        prefetchData().then((fetched: (string | number | boolean | { [key: string]: unknown; })[] | null) => {
                            if (!fetched || fetched.length === 0) { return; }
                            if (!handleArrayDataSource( fetched as Array<string | number | boolean | { [key: string]: object }>,
                                                        candidate as number | string | boolean | object)) {
                                setFallback(candidate as number | string | boolean | object);
                            }
                        });
                    }
                }
            } else {
                setTextValue('');
                setActiveIndex(null);
            }
            ranOnceRef.current = true;
            prevDefaultRef.current = defaultValue;
            prevDataSourceRef.current = dataSource as unknown;
        }
    }, [isValueControlled, value, defaultValue, dataSource, fields?.value, fields?.text,
        handleArrayDataSource, setDropdownValue, setFallback, setTextValue, setActiveIndex]);
};
