import { RefObject, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { DataManager } from '@syncfusion/react-data';
import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import type { ListItemData } from '../types';
import { compareItemData, isPrimitive, updateItemData } from '../utils';
import { T } from '../../drop-down-list/types';
import { UseDropdownValueSyncProps } from './hook-types';

export const useDropdownValueSync: (props: UseDropdownValueSyncProps) => void = (props: UseDropdownValueSyncProps): void => {
    const {
        state: { itemData, dropdownValue, listData, isPopupOpen, popupListData },
        actions: { setTextValue, setItemData, setDropdownValue },
        config: { spanClickable, dataSource, customValue, multiSelectable, value, defaultValue, allowObjectBinding },
        internalProps: { resolvedFields: fields, prefetchData, getTextByValue }
    } = props;

    const prevDefaultRef: RefObject<T | null | undefined> = useRef<T | null | undefined>(defaultValue);
    const ranOnceRef: RefObject<boolean> = useRef<boolean>(false);
    const prevDataSourceRef: RefObject<unknown> = useRef<unknown>(dataSource);
    const isValueControlled: boolean = useMemo(() => value !== undefined, [value]);

    const setFallback: (val: T[] | T | null) => void = useCallback((val: T[] | T | null): void => {
        const values: T[] = Array.isArray(val) ? val : (val !== null ? [val] : []);
        if (values.length === 0) {
            setTextValue('');
            return;
        }
        if (Array.isArray(dataSource)) {
            const first: unknown = dataSource[0];
            const isStringArray: boolean = typeof first === 'string' || dataSource.length === 0;
            for (const candidate of values) {
                if (isStringArray && typeof candidate === 'boolean') {
                    setTextValue('');
                    return;
                } else if (typeof first === 'object' && !allowObjectBinding) {
                    return;
                }
            }
        }
        const textValues: string[] = [];
        const textField: string | undefined = fields?.text;
        for (const candidate of values) {
            const objectValue: string = textField && candidate && typeof candidate === 'object' ? String((candidate as Record<string, unknown>)[textField as string]) : '';
            const textValue: string = isPrimitive(candidate) ? String(candidate) : (allowObjectBinding && textField ? String(objectValue) : '');
            textValues.push(textValue);
        }
        const finalText: string = multiSelectable ? '' : (textValues[0] || '');
        setTextValue(finalText);

    }, [dataSource, isPrimitive, setTextValue, allowObjectBinding, fields?.text, multiSelectable]);

    const getValueField: () => string | undefined = useCallback(() =>
        (spanClickable === false && !multiSelectable && fields?.text) ? fields?.text : fields?.value,
                                                                [spanClickable, multiSelectable, fields?.text, fields?.value] );

    const getLookupValue: (candidate: unknown) => T | null = useCallback(
        (candidate: unknown): T | null => {
            const valueField: string | undefined = getValueField();
            if (allowObjectBinding && candidate && typeof candidate === 'object' && valueField) {
                const value: unknown = (candidate as Record<string, unknown>)[valueField as string];
                return (value as T);
            }
            return (candidate as T);
        },
        [allowObjectBinding, fields?.value, fields?.text, spanClickable, getValueField]);

    const getTextFromData: (values: T[] | T, dataSourceListItems: ListItemData[] | undefined) => string =
        useCallback((values: T[] | T, dataSourceListItems: ListItemData[] | undefined) => {
            const valuesArray: T[] = Array.isArray(values) ? values : [values];
            const valueField: string | undefined = getValueField();
            if (!dataSourceListItems || dataSourceListItems.length === 0 || !valueField) {
                return valuesArray[0]?.toString() || '';
            }
            const matchedItems: T[] = [];
            const textValues: string[] = [];
            for (const searchValue of valuesArray) {
                for (let i: number = 0; i < dataSourceListItems.length; i++) {
                    const itemValue: unknown = getValue(valueField, dataSourceListItems[i as number].item);

                    if (String(itemValue) === String(searchValue)) {
                        const itemText: unknown = getValue((fields.text || fields.value) as string, dataSourceListItems[i as number].item);
                        matchedItems.push(dataSourceListItems[i as number].item as T);
                        textValues.push(String(itemText));
                        break;
                    }
                }
            }
            if (matchedItems.length > 0) {
                const itemsToUpdate: T[] | T = multiSelectable ? matchedItems : matchedItems[0];
                setItemData?.(updateItemData(itemData as string[], itemsToUpdate as unknown as string, Boolean(multiSelectable)));
            }

            const finalText: string = multiSelectable ? '' : (textValues[0] || valuesArray[0]?.toString() || '');
            return finalText;

        }, [fields?.value, fields?.text, spanClickable, multiSelectable, setItemData, itemData, getValueField]);

    const handleArrayDataSource: (source: T[], val: T[] | T | null) => boolean =
        useCallback((source: T[], val: T[] | T | null): boolean => {
            if (!Array.isArray(source) || isNullOrUndefined(val)) { return false; }
            const values: T[] = Array.isArray(val) ? val : [val];
            const isPrimitiveArray: boolean = source.length > 0 && isPrimitive(source[0]);
            const valueField: string | undefined = getValueField();
            const textField: string | undefined = fields?.text as string | undefined;
            const indexMap: Map<string, number> = new Map();
            source.forEach((item: T, index: number) => {
                const key: string = isPrimitiveArray ? String(item) : (valueField ? String(getValue(valueField, item)) : '');
                indexMap.set(key, index);
            });
            const matchedItems: T[] = [];
            const textValues: string[] = [];

            for (const candidate of values) {
                const idx: number = indexMap.get(String(candidate)) ?? -1;
                if (idx !== -1) {
                    const item: T = source[idx as number];
                    matchedItems.push(item);
                    const text: string = isPrimitiveArray ? String(item) : (textField ? String(getValue(textField, item)) :
                        String(candidate));
                    textValues.push(text);
                } else {
                    return false;
                }
            }

            const itemsToUpdate: T[] | T = multiSelectable ? matchedItems : matchedItems[0];
            const textToSet: string = multiSelectable ? '' : (textValues[0] || matchedItems[0]?.toString() || '');
            setTextValue(textToSet);
            setItemData?.(updateItemData(itemData as string[], itemsToUpdate as unknown as string, Boolean(multiSelectable)));
            return true;
        }, [fields?.value, fields?.text, isPrimitive, setTextValue, spanClickable, setItemData, multiSelectable, itemData, getValueField]);

    const applyCustomOrFallback: (candidate: T | null | undefined) => void =
        useCallback((candidate: T | null | undefined): void => {
            if (customValue) {
                const text: string = isPrimitive(candidate) ? String(candidate) : (allowObjectBinding && fields?.text ?
                    String((candidate as Record<string, unknown>)[fields.text as string]) : String(candidate));
                setTextValue(multiSelectable ? '' : text);
                setItemData?.(updateItemData(itemData as string[], candidate as string, Boolean(multiSelectable)));
            } else {
                setFallback(candidate as T);
            }
        }, [customValue, isPrimitive, allowObjectBinding, fields?.text, setTextValue, itemData, setItemData, setFallback, multiSelectable]);

    const handleArraySourceWithFallback: (source: T[], candidate: T | T[]) => void =
    useCallback((source: T[], candidate: T | T[]): void => {
        if (!handleArrayDataSource(source, candidate)) {
            applyCustomOrFallback(candidate as T);
        }
    }, [handleArrayDataSource, applyCustomOrFallback]);

    const prefetchAndSync: (candidate: T | T[]) => void =
    useCallback((candidate: T | T[]): void => {
        if (prefetchData) {
            prefetchData().then((fetched: T[] | null) => {
                if (!fetched || fetched.length === 0) { return; }
                handleArraySourceWithFallback(fetched, candidate);
            });
        }
    }, [prefetchData, handleArraySourceWithFallback]);

    useLayoutEffect(() => {
        if (isValueControlled) {
            const candidate: T | null | undefined = value;
            if (!isNullOrUndefined(candidate) && (!Array.isArray(candidate) || candidate.length > 0)) {
                if (compareItemData(dropdownValue, candidate)) { return; }
                setDropdownValue(updateItemData(dropdownValue as string[], candidate as string, Boolean(multiSelectable)));
                const ds: T[] | DataManager | undefined = popupListData?.length > 0 ? popupListData : dataSource;
                if (ds && Array.isArray(ds)) {
                    handleArraySourceWithFallback(ds, candidate as T);
                } else if (ds instanceof DataManager) {
                    const lookupVal: T | null = getLookupValue(candidate);
                    if (!isNullOrUndefined(lookupVal)) {
                        let text: string = getTextByValue?.(lookupVal as T) ?? '';
                        if (text === '' && !isPopupOpen) {
                            if (listData && listData.length > 0) {
                                text = getTextFromData(lookupVal as T, listData);
                            }
                            else if (prefetchData) {
                                prefetchAndSync(candidate as T);
                            }
                        }
                        setTextValue(multiSelectable ? '' : text);
                    } else {
                        setTextValue('');
                    }
                }
            }
            else {
                if (!multiSelectable) {
                    { setTextValue(''); }
                }
                setItemData?.(updateItemData(itemData as string[], null, Boolean(multiSelectable)));
            }
            return;
        }

        if (!ranOnceRef.current || !compareItemData(prevDefaultRef.current, defaultValue) ||
            !compareItemData(prevDataSourceRef.current, dataSource)) {
            const candidate: T | null | undefined = (value != null ? value : defaultValue)
                ?? (dropdownValue && dropdownValue.length > 0 ? dropdownValue[0] : null);
            if (!isNullOrUndefined(candidate)) {
                setDropdownValue(updateItemData(dropdownValue as string[], candidate as string, Boolean(multiSelectable)));
                if (dataSource && Array.isArray(dataSource)) {
                    handleArraySourceWithFallback(dataSource, candidate as T);
                } else if (dataSource instanceof DataManager && prefetchData) {
                    prefetchAndSync(candidate as T);
                }
            } else {
                setTextValue('');
            }
            ranOnceRef.current = true;
            prevDefaultRef.current = defaultValue;
            prevDataSourceRef.current = dataSource;
        }
    }, [isValueControlled, value, defaultValue, dataSource, fields?.value, fields?.text,
        handleArrayDataSource, setDropdownValue, setFallback, setTextValue, multiSelectable, dropdownValue]);
};
