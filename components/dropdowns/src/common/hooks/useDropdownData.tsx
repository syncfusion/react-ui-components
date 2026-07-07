import { RefObject, useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { DataManager, Query, QueryOptions } from '@syncfusion/react-data';
import { DataRequestEvent, ScrollEvent, ScrollMode, SortOrder, T } from '../../drop-down-list/types';
import { applyMaxSuggestions, compareItemData, determineDataType, ensureValueExistsInCache, getDataByValueField, getResolvedQuery, isPrimitive, normalizeOperator, processDataResult, resolveTextFromValue } from '../utils';
import { getValue, isNullOrUndefined } from '@syncfusion/react-base';
import { GroupedData } from '@syncfusion/react-lists';
import { UseDropdownDataProps, UseDropdownDataReturn } from './hook-types';
import { CSS_CLASSES } from '../constants';

export const useDropdownData: (props: UseDropdownDataProps) => UseDropdownDataReturn = (props: UseDropdownDataProps):
UseDropdownDataReturn => {
    const {
        state: { isDataInitialized, itemData, isRequesting, popupListData, isPopupOpen },
        actions: { setIsDataInitialized, setPopupListData, setIsRequesting, setIsActionFailed, setIsLoading, setIsPopupFilterLoading },
        refs: { remoteCacheRef, filterInputElementRef, listBaseKey, popupContentRef, inputElementRef, isFetchedRef },
        config: { filterable, sortOrder = SortOrder.None, query, virtualization, maxSuggestions, filterType, dataSource, ignoreAccent,
            ignoreCase, spanClickable, forceFilterOnOpen, maximumSelectionLength, hideSelectedItem, onScroll, onDataRequest, onError,
            onDataLoad, multiSelectable, checkbox, enableSelectionOrder},
        internalProps: { fields, isRemoteData }
    } = props;

    const isRequestingRef: RefObject<boolean> = useRef(false);
    const filterCacheRef: RefObject<T[]> = useRef<T[]>([]);
    const typedStringRef: RefObject<string> = useRef('');
    const [reorderItemData, setReorderItemData] = useState<T[]>([]);
    const externalFilterInputRef: RefObject<HTMLInputElement | null> | undefined = !spanClickable ? inputElementRef : undefined;
    const isSelectionReOrderEnabled: boolean = useMemo((): boolean => {
        return !!enableSelectionOrder && !!multiSelectable && !!checkbox && !hideSelectedItem;
    }, [enableSelectionOrder, multiSelectable, checkbox, hideSelectedItem]);

    const setRequesting: (val: boolean) => void = useCallback((val: boolean) => {
        isRequestingRef.current = val;
        setIsRequesting(val);
    }, []);

    const handleOnError: (err: Error) => void = useCallback((err: Error) => {
        setIsLoading(false);
        onError?.(err);
    }, [onError]);

    const handleDataRequest: (event: DataRequestEvent, fromFilter: boolean) => void =
        useCallback((event: DataRequestEvent, fromFilter: boolean): void => {
            if (!spanClickable || !fromFilter) {
                setIsLoading(true);
            }
            onDataRequest?.(event);
        }, [onDataRequest, spanClickable]);

    const handleOnDataLoad: (e: { data: DataManager | T[] }, fromFilter?: boolean) => void =
        useCallback((e: { data: DataManager | T[] }, fromFilter?: boolean): void => {
            onDataLoad?.(e);
            setIsLoading(false);
            if (fromFilter) { return; }
            if (Array.isArray(e.data)) {
                const normalized: T[] = (e.data).filter((v: T) => v != null);
                remoteCacheRef.current = normalized;
            } else {
                remoteCacheRef.current = null;
            }
            isFetchedRef.current = true;
        }, [onDataLoad, remoteCacheRef]);

    useEffect(() => {
        if (isPopupOpen && isSelectionReOrderEnabled) {
            setReorderItemData(Array.isArray(itemData) ? itemData : []);
        }
    }, [isPopupOpen, isSelectionReOrderEnabled]);

    const computedListData: { items: T[]; reorderSelectedItemCount: number } = useMemo(() => {
        const selectedItems: T[] = Array.isArray(itemData) ? itemData : [];
        const reorderSelectedItems: T[] = reorderItemData;
        const isReorderMode: boolean = isSelectionReOrderEnabled && isDataInitialized && reorderSelectedItems.length > 0;
        if (!isReorderMode && (!hideSelectedItem || !isDataInitialized || selectedItems.length === 0)) {
            return { items: popupListData, reorderSelectedItemCount: 0 };
        }
        const data: T[] = popupListData ?? [];
        const isItemSelected: (candidate: T) => boolean = (candidate: T): boolean => {
            for (let i: number = 0; i < selectedItems.length; i++) {
                if (compareItemData(candidate, selectedItems[i as number])) {
                    return true;
                }
            }
            return false;
        };

        if (isReorderMode) {
            const selectedItemsInListOrder: T[] = [];
            const availableItems: T[] = [];
            const selectedValueSet: Set<string> = new Set<string>();
            const valueField: string = fields?.value ?? 'value';
            const getItemValue: (item: T) => string | undefined = (item: T): string | undefined => {
                const rawValue: unknown = isPrimitive(item)
                    ? item : getValue(valueField, item as Record<string, unknown>);
                return isNullOrUndefined(rawValue) ? undefined : String(rawValue);
            };
            for (const selectedItem of reorderSelectedItems) {
                const selectedValue: string | undefined = getItemValue(selectedItem);
                if (selectedValue !== undefined) {
                    selectedValueSet.add(selectedValue);
                }
            }
            for (const item of data) {
                const itemValue: string | undefined = getItemValue(item);
                if (itemValue !== undefined && selectedValueSet.has(itemValue)) {
                    selectedItemsInListOrder.push(item);
                } else {
                    availableItems.push(item);
                }
            }
            return {
                items: selectedItemsInListOrder.concat(availableItems),
                reorderSelectedItemCount: selectedItemsInListOrder.length
            };
        }

        const nonHidden: T[] = [];
        for (let i: number = 0; i < data.length; i++) {
            const item: T & Partial<GroupedData> = data[i as number] as T & Partial<GroupedData>;
            let selected: boolean = isItemSelected(item);
            if (item?.isHeader) {
                const children: T[] = Array.isArray(item.items) ? (item.items as T[]) : [];
                if (children.length === 0) {
                    selected = true;
                } else {
                    const selectedChild: T[] = [];
                    for (let j: number = 0; j < children.length; j++) {
                        if (isItemSelected(children[j as number])) {
                            selectedChild.push(children[j as number]);
                        }
                    }
                    selected = selectedChild.length === children.length;
                }
            }

            if (!selected) { nonHidden.push(item as T); }
        }
        return { items: nonHidden, reorderSelectedItemCount: 0 };
    }, [hideSelectedItem, isDataInitialized, itemData, popupListData, isSelectionReOrderEnabled, fields, reorderItemData]);

    const computedNonHiddenItems: T[] = computedListData.items;
    const reorderSelectedItemCount: number = computedListData.reorderSelectedItemCount;

    const computedDisabledItems: Set<T> = useMemo(() => {
        if (maximumSelectionLength !== undefined && maximumSelectionLength > 0 && Array.isArray(itemData) &&
            itemData.length >= maximumSelectionLength && isDataInitialized) {
            const disabled: Set<T> = new Set<T>();
            const filteredData: T[] = popupListData as T[];
            for (let i: number = 0; i < filteredData.length; i++) {
                const item: T = filteredData[i as number];
                const isSelected: boolean = itemData.some((selected: T) => { return compareItemData(item, selected); });
                if (!isSelected) {
                    disabled.add(item);
                }
            }
            return disabled;
        }
        return new Set();
    }, [maximumSelectionLength, itemData, isDataInitialized, popupListData]);

    const getQuery: (newQuery?: Query) => Query = useCallback((newQuery?: Query): Query => {
        let filterQuery: Query;
        if (filterable) {
            filterQuery = getResolvedQuery(newQuery);
            const currentText: string = typedStringRef.current ?? '';
            if (currentText !== '') {
                const filteringType: string = normalizeOperator(filterType);
                const item: T | null = determineDataType(dataSource as T[], fields).item;
                const primitive: boolean = !(dataSource instanceof DataManager) && isPrimitive(item);
                if (primitive) {
                    filterQuery.where('', filteringType, currentText, ignoreCase, ignoreAccent);
                } else {
                    const field: string = (fields?.text) ? fields.text : 'text';
                    filterQuery.where(field, filteringType, currentText, ignoreCase, ignoreAccent);
                }
            }
        } else {
            filterQuery = getResolvedQuery(newQuery);
        }
        return getResolvedQuery(filterQuery);
    }, [query, filterable, filterType, ignoreCase, ignoreAccent, fields]);

    const processAndSetData: (result: T[]) => void = useCallback((result: T[]): void => {
        if (!isDataInitialized) {
            setIsDataInitialized(true);
        }
        const processed: T[] = processDataResult(result, fields, sortOrder, query ?? new Query());
        setPopupListData(processed);
    }, [fields, sortOrder, query, isDataInitialized]);

    const togglePopupSpinner: (fromFilter: boolean, show: boolean) => void = useCallback((fromFilter: boolean, show: boolean): void => {
        if (fromFilter) {
            setIsPopupFilterLoading(show);
        }
    }, [setIsPopupFilterLoading]);

    const handleQueryError: (error: object, fromFilter: boolean) => void = useCallback((error: object, fromFilter: boolean) => {
        setRequesting(false);
        setIsActionFailed(true);
        setIsDataInitialized(false);
        togglePopupSpinner(fromFilter, false);
        handleOnError?.(error as Error);
    }, [setIsRequesting, setIsActionFailed, setIsDataInitialized, togglePopupSpinner, handleOnError, setRequesting]);

    const handleQuerySuccess: (fromFilter?: boolean) => void = useCallback((fromFilter: boolean = false) => {
        togglePopupSpinner(Boolean(fromFilter), false);
        setRequesting(false);
        setIsActionFailed(false);
    }, [togglePopupSpinner, setIsActionFailed, setRequesting]);

    const handleBeforeQueryRequest: (event: DataRequestEvent, fromFilter?: boolean) => void =
        useCallback((event: DataRequestEvent, fromFilter: boolean = false) => {
            handleDataRequest?.(event, Boolean(fromFilter));
            setRequesting(true);
            setIsActionFailed(false);
            togglePopupSpinner(Boolean(fromFilter), true);
        }, [togglePopupSpinner, setIsActionFailed, handleDataRequest, setRequesting]);

    const ensureValues: (fromFilter?: boolean) => void = useCallback((fromFilter: boolean = false) => {
        if (filterable && !fromFilter && itemData && isRemoteData) {
            for (const item of itemData) {
                remoteCacheRef.current = ensureValueExistsInCache(item, remoteCacheRef.current, fields) as T[];
            }
        }
    }, [filterable, remoteCacheRef, itemData, fields, isRemoteData]);

    const executeLocalCachedQuery: (eventArgs: DataRequestEvent) => void = useCallback((eventArgs: DataRequestEvent) => {
        const cached: T[] = remoteCacheRef.current as T[];
        const localData: DataManager = new DataManager(cached);
        const localQuery: Query = eventArgs.query ? eventArgs.query : getQuery(new Query());
        if (localQuery.queries.some((q: QueryOptions) => q.fn === 'onTake')) {
            localQuery.queries = localQuery?.queries?.filter((item: QueryOptions) => item.fn !== 'onTake');
            localQuery.take(cached.length);
        }
        const result: unknown = localQuery.executeLocal(localData);
        const listItems: T[] = (result && Array.isArray((result as { result: unknown }).result) ?
            (result as { result: unknown }).result : result) as T[];
        const args: { data: T[]; } = { data: listItems };
        handleOnDataLoad?.(args);
        processAndSetData(args.data);
    }, [remoteCacheRef, getQuery, handleOnDataLoad, processAndSetData]);

    const extractDataFromResult: (result: unknown) => T[] = (result: unknown): T[] => {
        return (result && Array.isArray((result as { result: unknown }).result) ?
            (result as { result: unknown }).result : []) as T[];
    };

    const updateCacheWithData: (cacheRef: RefObject<T[] | null>, newData: T[]) => void =
        useCallback((cacheRef: RefObject<T[] | null>, newData: T[]) => {
            let existingF: T[] = [];
            if (Array.isArray(cacheRef.current)) {
                existingF = cacheRef.current;
            }
            const mergedF: T[] = existingF.concat(newData);
            cacheRef.current = mergedF;
        }, []);

    const loadDataWithSuggestions: (cacheData: T[], fromFilter?: boolean) => void =
        useCallback((cacheData: T[], fromFilter: boolean = false) => {
            const args: { data: T[]; } = {
                data: applyMaxSuggestions(Array.from(cacheData), maxSuggestions, externalFilterInputRef?.current?.value)
            };
            handleOnDataLoad?.(args, fromFilter);
            processAndSetData(cacheData);
        }, [maxSuggestions, externalFilterInputRef, handleOnDataLoad, processAndSetData]);

    const handleFetchRemoteSuccess: (isFilteringActive: boolean, e: unknown, fromFilter: boolean) => void =
        useCallback((isFilteringActive: boolean, e: unknown, fromFilter: boolean) => {
            const fullResult: T[] = extractDataFromResult(e);
            if (isFilteringActive) {
                updateCacheWithData(filterCacheRef, fullResult);
            } else if (remoteCacheRef && (!fromFilter || forceFilterOnOpen)) {
                updateCacheWithData(remoteCacheRef, fullResult);
            }
            if (!(e as { cancel: boolean }).cancel) {
                if (isFilteringActive && filterCacheRef?.current) {
                    loadDataWithSuggestions(filterCacheRef.current, true);
                } else if (remoteCacheRef?.current) {
                    loadDataWithSuggestions(remoteCacheRef.current);
                }
            }
            handleQuerySuccess(Boolean(fromFilter));
        }, [remoteCacheRef, filterCacheRef, extractDataFromResult, forceFilterOnOpen, maxSuggestions, externalFilterInputRef,
            applyMaxSuggestions, handleOnDataLoad, processAndSetData, loadDataWithSuggestions]);

    const formListData: (dataSource: T[] | DataManager, query?: Query, fromFilter?: boolean, typedText?: string) => void =
        useCallback((dataSource: T[] | DataManager, query?: Query, fromFilter?: boolean, typedText?: string): void => {
            if (fromFilter && isRemoteData && virtualization && virtualization.scrollMode === ScrollMode.FetchViewPort) {
                fetchRemoteVirtualData(dataSource as DataManager, getResolvedQuery(query), fromFilter, typedText);
                return;
            }
            let filteredDataSource: DataManager | T[];
            if (Array.isArray(dataSource)) {
                filteredDataSource = dataSource.filter((item: T) => item !== null && item !== undefined);
            } else {
                filteredDataSource = dataSource;
            }
            typedStringRef.current = typedText ?? '';
            const eventArgs: DataRequestEvent = { data: filteredDataSource, query: getResolvedQuery(query) };
            if (filteredDataSource instanceof DataManager) {
                const data: DataManager = filteredDataSource;
                ensureValues();
                if (remoteCacheRef?.current && !fromFilter) {
                    executeLocalCachedQuery(eventArgs);
                    return;
                }

                if (!isRequesting) {
                    handleBeforeQueryRequest({ data: eventArgs.data, query: query ? eventArgs.query as Query : getQuery(new Query()) },
                                             Boolean(fromFilter));
                    data.executeQuery(eventArgs.query ? eventArgs.query : getQuery(new Query()))
                        .then((e: unknown) => {
                            const fullResult: T[] = extractDataFromResult(e);
                            if (remoteCacheRef && !fromFilter) {
                                remoteCacheRef.current = fullResult;
                            }
                            if (!(e as { cancel: boolean }).cancel) {
                                const args: { data: T[]; } = { data: (e as { result: unknown }).result as T[] };
                                args.data = applyMaxSuggestions(args.data, maxSuggestions, externalFilterInputRef?.current?.value);
                                handleOnDataLoad?.(args, fromFilter);
                                processAndSetData(args.data);
                            }
                            handleQuerySuccess(Boolean(fromFilter));
                        })
                        .catch((error: object) => {
                            handleQueryError(error, Boolean(fromFilter));
                        });
                }
            } else {
                const dataManager: DataManager = new DataManager(eventArgs.data);
                let listItems: T[] = getQuery(eventArgs.query || new Query()).executeLocal(dataManager) as T[];
                listItems = applyMaxSuggestions(listItems, maxSuggestions, externalFilterInputRef?.current?.value);
                const args: { data: T[]; } = { data: listItems };
                handleOnDataLoad?.(args);
                processAndSetData(args.data);
                handleQuerySuccess(Boolean(fromFilter));
            }
        }, [isRequesting, getQuery, sortOrder, handleOnError, handleDataRequest, handleOnDataLoad, processAndSetData,
            ensureValueExistsInCache, togglePopupSpinner, itemData, handleQueryError, handleQuerySuccess, handleBeforeQueryRequest,
            extractDataFromResult, ensureValues, executeLocalCachedQuery]);

    const fetchRemoteVirtualData: (dataSource: DataManager, query: Query, fromFilter?: boolean, typedText?: string,
        fromScroll?: boolean) => Promise<void> = useCallback(async (dataSource: DataManager, query: Query, fromFilter?: boolean,
                                                                    typedText?: string, fromScroll?: boolean): Promise<void> => {
        if (fromFilter) {
            filterCacheRef.current = [];
        }
        typedStringRef.current = typedText ?? '';
        const eventArgs: DataRequestEvent = { data: dataSource, query: query };
        const data: DataManager = dataSource;
        ensureValues();
        const currentFilter: HTMLInputElement | null = externalFilterInputRef?.current ?? filterInputElementRef?.current;
        const isFilteringActive: boolean = Boolean(filterable && currentFilter?.value);
        if (fromFilter && virtualization && isFilteringActive) {
            const initialTake: number = virtualization.pageSize + (virtualization.overscanCount ?? 5);
            const filterQuery: Query = getQuery(new Query()).skip(0).take(initialTake).requiresCount();
            if (!isRequestingRef.current) {
                handleBeforeQueryRequest({ data: eventArgs.data, query: filterQuery }, Boolean(fromFilter));
                await data.executeQuery(filterQuery)
                    .then((e: unknown) => {
                        const fullResult: T[] = extractDataFromResult(e);
                        filterCacheRef.current = filterCacheRef.current.concat(fullResult);
                        listBaseKey.current++;
                        const args: { data: T[]; } = {
                            data: applyMaxSuggestions(fullResult, maxSuggestions, externalFilterInputRef?.current?.value)
                        };
                        handleOnDataLoad?.(args, fromFilter);
                        processAndSetData(filterCacheRef.current);
                        handleQuerySuccess(Boolean(fromFilter));
                    })
                    .catch((error: object) => {
                        handleQueryError(error, Boolean(fromFilter));
                    });
            }
            return;
        }
        if (remoteCacheRef?.current && !fromScroll) {
            executeLocalCachedQuery(eventArgs);
            return;
        }
        if (!isRequestingRef.current) {
            handleBeforeQueryRequest({ data: eventArgs.data, query: eventArgs.query as Query }, Boolean(fromFilter));
            await data.executeQuery(eventArgs.query)
                .then((e: unknown) => {
                    handleFetchRemoteSuccess(isFilteringActive, e, Boolean(fromFilter));
                })
                .catch((error: object) => {
                    handleQueryError(error, Boolean(fromFilter));
                });
        }
    }, [getQuery, handleOnError, handleDataRequest, handleOnDataLoad, processAndSetData, ensureValueExistsInCache, forceFilterOnOpen,
        filterable, filterInputElementRef, itemData, virtualization, typedStringRef, remoteCacheRef, filterCacheRef,
        setRequesting, setIsDataInitialized, setIsActionFailed, listBaseKey, isRequestingRef, externalFilterInputRef, maxSuggestions,
        fields, dataSource, handleQueryError, handleQuerySuccess, handleBeforeQueryRequest, extractDataFromResult, ensureValues,
        executeLocalCachedQuery, handleFetchRemoteSuccess]);

    const handleInternalScrollRequest: (e: ScrollEvent) => void = useCallback(async (e: ScrollEvent) => {
        if (!virtualization) { return; }
        if (!(dataSource instanceof DataManager) || (virtualization && virtualization.scrollMode === ScrollMode.FetchAll)) {
            onScroll?.(e);
            return;
        }
        const currentFilter: HTMLInputElement | null = externalFilterInputRef?.current ?? filterInputElementRef?.current;
        const isFilteringActive: boolean = Boolean(filterable && currentFilter?.value);
        typedStringRef.current = isFilteringActive ? currentFilter?.value as string : typedStringRef.current;
        const scrollQuery: Query = getQuery(new Query()).skip(e.startIndex).take(e.count).requiresCount();
        await fetchRemoteVirtualData(dataSource, scrollQuery, false, undefined, true);
        onScroll?.(e);
    }, [dataSource, onScroll, fetchRemoteVirtualData, getQuery, filterable,
        filterInputElementRef, typedStringRef, virtualization, externalFilterInputRef]);

    const getFormattedValue: (value: T) => T = useCallback((value: T): T => {
        if (popupListData && popupListData.length) {
            const item: { typeof: string | null; item: T | null; } = determineDataType(popupListData as T[], fields);
            if (typeof getValue((fields.value as string), item.item) === 'number' || item.typeof === 'number') {
                return parseFloat(value as string);
            }
            if (typeof getValue((fields.value as string), item.item) === 'boolean' || item.typeof === 'boolean') {
                return ((value === 'true') || ('' + value === 'true'));
            }
        }
        return value;
    }, [popupListData, fields]);

    const getDataByValue: (value: T) => T | undefined = useCallback((value: T) => {
        if (!isNullOrUndefined(popupListData)) {
            const item: T | null = determineDataType(popupListData, fields).item;
            return getDataByValueField(value, popupListData, fields, item);
        }
        return undefined;
    }, [popupListData, fields]);

    const getTextByValue: (value: T) => string = useCallback((value: T): string => {
        const item: T | null = determineDataType(dataSource as T[], fields).item;
        return resolveTextFromValue(value, item, popupListData, fields, Boolean(ignoreCase));
    }, [dataSource, popupListData, fields, ignoreCase]);

    const getScrollContainer: () => HTMLElement | null = useCallback((): HTMLElement | null => {
        if (!popupContentRef.current) { return null; }
        const specific: HTMLElement | null = popupContentRef.current.querySelector('.' + CSS_CLASSES.UL_CLASS) as HTMLElement | null;
        if (specific) { return specific; }
        return null;
    }, [popupContentRef]);

    return {
        formListData, fetchRemoteVirtualData, handleInternalScrollRequest, getTextByValue, getDataByValue, getFormattedValue,
        getQuery, getScrollContainer, computedDisabledItems, computedNonHiddenItems, reorderSelectedItemCount
    };
};
