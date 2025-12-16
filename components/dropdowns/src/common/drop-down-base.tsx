import * as React from 'react';
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo, useCallback, Ref, JSX } from 'react';
import { DataManager, Query, DataOptions, QueryOptions } from '@syncfusion/react-data';
import { getValue, IL10n, isNullOrUndefined, L10n, Size, useProviderContext } from '@syncfusion/react-base';
import { ListItems, SelectEvent, DataSource, GetItemPropsOptions } from '@syncfusion/react-lists';
import { InputBase, renderClearButton } from '@syncfusion/react-inputs';
import { useFilter } from '../drop-down-list/hooks/useFilter';
import { DropDownBaseClassList, DropDownBaseProps, IDropDownBase } from './types';
import Header from './header';
import Footer from './footer';
import NoRecords from './no-records';
import ErrorMessage from './error-message';
import { FieldSettingsModel, SortOrder } from '../drop-down-list/types';
import { normalizeOperator, processDataResult } from '../drop-down-list/hooks/useDropDownList';
import { Spinner } from '@syncfusion/react-popups';

const defaultMappedFields: FieldSettingsModel = {
    text: 'text',
    value: 'value',
    disabled: 'disabled',
    groupBy: undefined,
    htmlAttributes: 'htmlAttributes'
};

const dropDownBaseClasses: DropDownBaseClassList = {
    root: 'sf-dd-base',
    content: 'sf-content',
    selected: 'sf-active',
    focus: 'sf-item-focus',
    li: 'sf-list-item',
    disabled: 'sf-disabled',
    grouping: 'sf-dd-group',
    hover: 'sf-hover',
    noData: 'sf-dd-nodata'
};

type IDropDownBaseProps = DropDownBaseProps & Omit<React.HTMLAttributes<HTMLDivElement>, keyof DropDownBaseProps>;

/**
 * DropDownBase provides core functionality for dropdown-type components
 */
export const DropDownBase: React.ForwardRefExoticComponent<IDropDownBaseProps & React.RefAttributes<IDropDownBase>> =
    forwardRef<IDropDownBase, IDropDownBaseProps>((props: IDropDownBaseProps, ref: Ref<IDropDownBase>) => {
        const {
            dataSource = [],
            fields = defaultMappedFields,
            value,
            query = new Query(),
            isDropdownFiltering = false,
            filterPlaceholder = '',
            ignoreCase,
            ignoreAccent,
            filterType = 'StartsWith',
            size = Size.Medium,
            itemTemplate,
            groupTemplate,
            headerTemplate,
            footerTemplate,
            sortOrder = SortOrder.None,
            noRecordsTemplate,
            onErrorTemplate,
            allowObjectBinding = false,
            activeIndex,
            id,
            debounceDelay = 0,
            remoteCacheRef,
            itemData,
            onError,
            onItemClick,
            onFilter,
            onRemoteDataLoaded,
            onDataRequest,
            onDataLoad,
            getOptionId,
            endRemoteRequest
        } = props;

        const { locale } = useProviderContext();
        const localeStrings: Record<string, string> = {
            noRecordsMessage: 'No Records Found',
            errorMessage: 'Request Failed'
        };
        const l10nInstance: IL10n = L10n('dropdownList', localeStrings, locale || 'en-US');
        const baseQuery: Query = query.clone();
        const [listData, setListDatas] = useState<{ [key: string]: object }[] | boolean[] | string[] | number[]>([]);
        const [isRequesting, setIsRequesting] = useState<boolean>(false);
        const [isDataInitialized, setIsDataInitialized] = useState<boolean>(false);
        const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
        const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
        const [typedString, setTypedString] = useState<string>('');
        const [isActionFailed, setIsActionFailed] = useState<boolean>(false);

        const listItemsRef: React.RefObject<(HTMLLIElement | null)[]> = useRef<(HTMLLIElement | null)[]>([]);
        const filterInputElementRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const typedStringRef: React.RefObject<string> = useRef(typedString);
        const containerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const filterTimerRef: React.RefObject<number | null> = React.useRef<number | null>(null);

        const getQuery: (newQuery?: Query) => Query = useCallback((newQuery?: Query): Query => {
            let filterQuery: Query;
            if (isDropdownFiltering) {
                filterQuery = (newQuery as Query).clone();
                const currentText: string = typedStringRef.current ?? '';
                if (currentText !== '') {
                    const filteringType: 'startsWith' | 'endsWith' | 'contains' = normalizeOperator(filterType);
                    const dataType: string | null =
                    typeOfData(dataSource as (string | number | boolean | { [key: string]: object })[]).typeof;
                    const isPrimitive: boolean = !(dataSource instanceof DataManager) && (dataType === 'string' || dataType === 'number' || dataType === 'boolean');
                    if (isPrimitive) {
                        filterQuery.where('', filteringType, currentText, ignoreCase, ignoreAccent);
                    } else {
                        const field: string = (fields?.text) ? fields.text : 'text';
                        filterQuery.where(field, filteringType, currentText, ignoreCase, ignoreAccent);
                    }
                }
            } else {
                filterQuery = (newQuery as Query).clone();
            }
            return filterQuery.clone();
        }, [query, isDropdownFiltering, filterType, ignoreCase, ignoreAccent, fields]);

        const processAndSetData: (result: (string | number | boolean | {[key: string]: object; })[]) => void =
        useCallback((result: Array<{ [key: string]: object } | string | number | boolean>): void => {
            if (!isDataInitialized) {
                setIsDataInitialized(true);
            }
            const processed: (string | number | boolean | {[key: string]: Object; })[] =
            processDataResult(result, fields, sortOrder, query);
            setListDatas(processed as {[key: string]: Object; }[]);
        }, [fields, sortOrder, query, isDataInitialized]);

        const ensureValueInDatasource: (selected: string | number | boolean | {[key: string]: unknown; }) => void =
        useCallback((selected: { [key: string]: unknown } | string | number | boolean): void => {
            if (dataSource instanceof DataManager !== true || !remoteCacheRef?.current || !selected) { return; }
            const cache: (string | number | boolean | {[key: string]: unknown; })[] = Array.from(remoteCacheRef?.current) ;
            const isPrimitive: boolean = typeof selected === 'string' || typeof selected === 'number' || typeof selected === 'boolean';
            const selectedValue: string = String(isPrimitive ? selected as string | number | boolean :
                getValue(fields.value as string, selected as { [key: string]: unknown })) ;
            const exists: boolean = cache.some((data: string | number | boolean | {[key: string]: unknown; }) => String(isPrimitive ?
                typeof data !== 'object' && data : typeof data === 'object' && getValue(fields.value as string, data)) === selectedValue);
            if (!exists) {
                cache.push(selected as { [key: string]: unknown } | string | number | boolean);
                remoteCacheRef.current = cache as Array<{ [key: string]: unknown } | string | number | boolean>;
            }
        }, [fields, remoteCacheRef]);

        const setListData: (dataSource: { [key: string]: unknown }[] | string[] | number[] | DataManager | boolean[],
            query?: Query, fromFilter?: boolean, typedText?: string) => void = useCallback((  dataSource: { [key: string]: unknown }[] |
        string[] | number[] | DataManager | boolean[], query?: Query, fromFilter?: boolean, typedText?: string ): void => {
            let filteredDataSource: typeof dataSource;
            if (Array.isArray(dataSource)) {
                filteredDataSource = dataSource.filter((item: string | number | boolean | { [key: string]: unknown }) =>
                    item !== null && item !== undefined) as typeof dataSource;
            } else {
                filteredDataSource = dataSource;
            }
            typedStringRef.current = typedText ?? '';
            const eventArgs: { data: { [key: string]: unknown }[] | DataManager | string[] | number[] | boolean[],
                query: Query | undefined} = { data: filteredDataSource, query: query };

            if (filteredDataSource instanceof DataManager) {
                const data: DataManager = filteredDataSource as DataManager;

                if (isDropdownFiltering && !fromFilter){
                    ensureValueInDatasource(itemData as { [key: string]: unknown } | string | number | boolean);
                }
                if (remoteCacheRef?.current && !fromFilter) {
                    const cached: (string | number | boolean | {[key: string]: unknown; })[] = remoteCacheRef.current;
                    const localData: DataManager = new DataManager(cached as DataOptions | JSON[]);
                    const localQuery: Query = eventArgs.query ? eventArgs.query : getQuery(new Query());
                    if (localQuery.queries.some((q: QueryOptions) => q.fn === 'onTake')) {
                        localQuery.queries = localQuery?.queries?.filter((item: QueryOptions) => item.fn !== 'onTake');
                        localQuery.take(cached.length);
                    }
                    const listItems: {[key: string]: object; }[] = localQuery.executeLocal(localData) as { [key: string]: object }[];
                    const args: {data: {[key: string]: object; }[]; } = { data: listItems };
                    onDataLoad?.(args);
                    processAndSetData(args.data);
                    return;
                }

                if (!isRequesting) {
                    onDataRequest?.({ data: eventArgs.data, query: query ? eventArgs.query as Query : getQuery(new Query()) });
                    setIsRequesting(true);
                    setIsActionFailed(false);
                    data.executeQuery(eventArgs.query ? eventArgs.query : getQuery(new Query()))
                        .then((e: unknown) => {
                            const fullResult: { [key: string]: object; }[]  = (e && Array.isArray((e as {result: unknown}).result) ?
                                (e as {result: unknown}).result : []) as { [key: string]: object; }[];
                            if (remoteCacheRef && !fromFilter) {
                                remoteCacheRef.current = fullResult;
                            }

                            if (!(e as {cancel: boolean}).cancel) {
                                const args: {data: {[key: string]: object; }[]; } = {
                                    data: (e as {result: unknown}).result as { [key: string]: object; }[]};
                                if (!fromFilter) {
                                    onDataLoad?.(args);
                                }
                                processAndSetData(args.data);
                            }
                            setIsRequesting(false);
                            setIsActionFailed(false);
                            onRemoteDataLoaded?.();
                        })
                        .catch((error: object) => {
                            setIsRequesting(false);
                            setIsActionFailed(true);
                            setIsDataInitialized(false);
                            onError?.(error as Error);
                            endRemoteRequest?.();
                        });
                }
            } else {
                const dataManager: DataManager = new DataManager(eventArgs.data as DataOptions | JSON[]);
                const listItems: { [key: string]: object }[] =
                    getQuery(eventArgs.query || new Query()).executeLocal(dataManager) as { [key: string]: object }[];
                const args: {data: {[key: string]: object; }[]; } = {data: listItems};
                onDataLoad?.(args);
                processAndSetData(args.data);
                setIsRequesting(false);
                setIsActionFailed(false);
            }
        }, [isRequesting, getQuery, sortOrder, onError, onErrorTemplate, onRemoteDataLoaded, onDataRequest, onDataLoad, processAndSetData,
            ensureValueInDatasource]);

        const {onFilterUp, handleInputChange, clearText, filter} = useFilter({
            isDropdownFiltering,
            ignoreCase,
            ignoreAccent,
            filterType,
            fields,
            dataSource,
            baseQuery,
            onFilter: onFilter,
            setListData,
            externalTypedString: typedString,
            setExternalTypedString: setTypedString,
            externalFilterInputRef: filterInputElementRef
        });

        const listbaseClasses: string = useMemo(() => {
            const isPrimitiveArray: boolean = Array.isArray(listData) && listData.length > 0 &&
            (typeof listData[0] === 'string' || typeof listData[0] === 'number' || typeof listData[0] === 'boolean');
            return [
                dropDownBaseClasses.content,
                dropDownBaseClasses.root,
                (!isPrimitiveArray && fields.groupBy) ? dropDownBaseClasses.grouping : '',
                listData.length === 0 ? 'sf-dd-nodata' : ''
            ].filter(Boolean).join(' ');
        }, [fields.groupBy, listData]);

        const renderNoRecords: JSX.Element = (
            <NoRecords noRecordsTemplate={noRecordsTemplate} defaultText={l10nInstance.getConstant('noRecordsMessage')} />
        );

        const renderError: JSX.Element = (
            <ErrorMessage errorTemplate={onErrorTemplate}defaultText={l10nInstance.getConstant('errorMessage')} />
        );

        useEffect(() => {
            if (value != null && listData.length > 0) {
                const valueMap: Map<string, number> = new Map();
                listData.forEach((item: string | number | boolean | { [key: string]: object }, index: number) => {
                    const key: string = typeof item === 'object' ? String(getValue(fields.value ?? '', item)) : String(item);
                    valueMap.set(key, index);
                });
                const itemIndex: number = valueMap.get(String(value)) ?? -1;
                if (itemIndex !== -1) {
                    setSelectedItemIndex(itemIndex);
                }
            }
        }, [value, listData, fields]);

        useEffect(() => {
            if (isDropdownFiltering && filterInputElementRef.current) {
                filterInputElementRef.current.focus({preventScroll: true});
            }
        }, [isDropdownFiltering, filterInputElementRef.current]);

        useEffect(() => {
            if (!isDataInitialized) {
                setListData(dataSource, query);
            }
        }, [dataSource, query, isDataInitialized, setListData]);

        useEffect(() => {
            if (listData.length > 0) {
                if (activeIndex) {
                    setFocusedItemIndex(activeIndex);
                } else {
                    setFocusedItemIndex(0);
                }
            } else {
                setFocusedItemIndex(null);
            }
        }, [listData, activeIndex]);

        useEffect(() => {
            return () => {
                if (filterTimerRef.current) {
                    clearTimeout(filterTimerRef.current as unknown as number);
                    filterTimerRef.current = null;
                }
            };
        }, []);

        const scrollItemIntoViewWithin: (container: HTMLElement, el: HTMLElement) => void =
        useCallback((container: HTMLElement, el: HTMLElement) => {
            const popupElement: HTMLElement = containerRef?.current?.parentElement as HTMLElement;
            const originalDisplay: string = popupElement.style.display;
            popupElement.style.visibility = 'hidden';
            popupElement.style.display = 'block';
            const itemTop: number = el.offsetTop;
            const itemBottom: number = itemTop + el.offsetHeight;
            const viewTop: number = container.scrollTop;
            const viewBottom: number = container.scrollTop + container.clientHeight;
            if (itemBottom > viewBottom) {
                container.scrollTop = itemBottom - container.clientHeight;
            } else if (itemTop < viewTop) {
                container.scrollTop = Math.max(0, itemTop);
            }
            popupElement.style.visibility = '';
            popupElement.style.display = originalDisplay;
        }, [containerRef]);

        useEffect(() => {
            if (!isDataInitialized || isNullOrUndefined(itemData)) { return; }
            const currValue: string | number | boolean | null = typeof itemData === 'object' && itemData !== null
                ? (getValue(fields?.value ?? 'value', itemData) as string | number | boolean | null) : (itemData as string | number | boolean | null);
            if (isNullOrUndefined(currValue)) { return; }
            const listItems: HTMLLIElement[] | undefined = getListItems();
            const activeItem: HTMLLIElement | undefined =
            listItems?.find((item: HTMLElement) => item?.dataset?.value === String(currValue));
            const container: HTMLElement | null = getScrollContainer();
            if (activeItem && container) {
                scrollItemIntoViewWithin(container, activeItem);
            }
        }, [isDataInitialized]);

        const typeOfData: (items: (string | number | boolean | { [key: string]: object })[]) =>
        { typeof: string | null, item: string | number | boolean | { [key: string]: object } | null } =
            useCallback((items: (string | number | boolean | { [key: string]: object })[]) => {
                let item: {typeof: string | null; item: string | number | boolean | { [key: string]: object } | null; }
                = { typeof: null, item: null };
                if (!Array.isArray(items) || items.length === 0) {
                    return item;
                }
                for (let i: number = 0; i < items.length; i++) {
                    if (items[i as number] !== null && items[i as number] !== undefined) {
                        const listDataType: boolean = typeof items[i as number] === 'string' ||
                            typeof items[i as number] === 'number' || typeof items[i as number] === 'boolean';
                        const isNullData: boolean = listDataType ? isNullOrUndefined(items[i as number]) :
                            isNullOrUndefined(getValue((fields.value as string), items[i as number]));
                        if (!isNullData) {
                            return item = { typeof: typeof items[i as number], item: items[i as number] };
                        }
                    }
                }
                return item;
            }, [fields]);

        const getFormattedValue: (value: string | number | boolean) => string | number | boolean =
            useCallback((value: string | number | boolean): string | number | boolean => {
                if (listData && listData.length) {
                    const item: { [key: string]: object } &
                    { typeof?: string; item?: string | number | boolean | { [key: string]: object } | null } =
                    typeOfData(listData) as { [key: string]: object } &
                    { typeof?: string; item?: string | number | boolean | { [key: string]: object } | null };
                    if (typeof getValue((fields.value as string), item.item as { [key: string]: object }) === 'number' ||
                        item.typeof === 'number') {
                        return parseFloat(value as string);
                    }
                    if (typeof getValue((fields.value as string), item.item as { [key: string]: object }) === 'boolean' ||
                        item.typeof === 'boolean') {
                        return ((value === 'true') || ('' + value === 'true'));
                    }
                }
                return value as string | number | boolean;
            }, [listData, fields, typeOfData]);

        const getDataByValue: (value: string | number | boolean) => { [key: string]: Object } | string | number | boolean | undefined =
    useCallback((value: string | number | boolean) => {
        if (!isNullOrUndefined(listData)) {
            const type: string = typeOfData(listData).typeof as string;
            if (type === 'string' || type === 'number' || type === 'boolean') {
                for (let i: number = 0; i < listData.length; i++) {
                    const item: { [key: string]: Object } | string | number | boolean = listData[i as number];
                    if (isNullOrUndefined(item)) {continue; }
                    if (String(item) === String(value)) {
                        return item;
                    }
                }
            } else {
                for (let i: number = 0; i < listData.length; i++) {
                    const item: { [key: string]: Object } | string | number | boolean = listData[i as number];
                    if (isNullOrUndefined(item)) {continue; }
                    if (String(getValue((fields.value as string), item)) === String(value)) {
                        return item;
                    }
                }
            }
        }
        return undefined;
    }, [listData, fields, typeOfData]);

        const checkIgnoreCase: (item: string, text: string, ignoreCase: boolean) => boolean =
        useCallback((item: string, text: string, ignoreCase: boolean): boolean => {
            if (isNullOrUndefined(item)) {
                return false;
            }
            if (!ignoreCase) {
                return String(item) === text?.toString();
            }
            return String(item).toLowerCase() === text?.toString().toLowerCase();
        }, []);

        const checkValueCase: (text: string, ignoreCase: boolean) => string | number | null =
        useCallback((text: string, ignoreCase: boolean ): string | number | null => {
            if (!isNullOrUndefined(listData)) {
                const dataSource: { [key: string]: object }[] = listData as { [key: string]: object }[];
                const match: {[key: string]: object; } | undefined =
                dataSource.find((item: {[key: string]: object; }) => !isNullOrUndefined(getValue(fields.value as string, item)) &&
                checkIgnoreCase(String(getValue(fields.value || '', item)), text, ignoreCase) );
                return match ? (getValue((fields.text || fields.value) as string, match) as string) : null;
            }
            return null;
        }, [listData, fields, typeOfData]);

        const getTextByValue: (value: string | number | boolean) => string = useCallback((value: string | number | boolean): string => {
            const dataType: string = typeOfData(dataSource as (string | number | boolean | { [key: string]: object })[]).typeof as string;
            if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
                return value.toString();
            }

            return checkValueCase(value as string, ignoreCase ? true : false) as string || '';
        }, [checkValueCase, typeOfData, dataSource]);

        const handleItemClick: (e: SelectEvent) => void =
            useCallback((e: SelectEvent): void => {
                const value: string | null = ((e.event as React.MouseEvent<HTMLLIElement, MouseEvent>).currentTarget).dataset?.value
                ?? null;
                if (value) {
                    let itemData: { [key: string]: Object } | string | number | boolean | null | undefined;
                    const dataType: string = typeOfData(dataSource as (string | number | boolean | { [key: string]: object })[])
                        .typeof as string;
                    if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
                        itemData = value;
                    } else {
                        itemData = getDataByValue(getFormattedValue(value));
                    }
                    if (itemData) {
                        getTextByValue(value);
                    }
                }
                setSelectedItemIndex(e.index as number);
                setFocusedItemIndex(null);
                onItemClick?.(e.event as React.MouseEvent<HTMLLIElement, MouseEvent>, e.index as number);
            }, [getDataByValue, getFormattedValue, getTextByValue, onItemClick, typeOfData, dataSource]);

        const getItemProps: (args: GetItemPropsOptions) => React.HTMLAttributes<HTMLElement> = useCallback((args: GetItemPropsOptions):
        React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement> => {

            let itemValue: string = '';
            let textValue: string = '';
            let isSelectedByValue: boolean = false;
            if (value !== null) {
                if (typeof args.item === 'string' || typeof args.item === 'number' || typeof args.item === 'boolean') {
                    itemValue = textValue = String(args.item);
                    isSelectedByValue = String(args.item) === String(value);
                } else {
                    itemValue = String(getValue(fields.value || '', args.item));
                    textValue = String(getValue(fields.text || fields.value || '', args.item));
                    if (allowObjectBinding) {
                        const key: string | undefined = (fields as FieldSettingsModel | undefined)?.value;
                        const objectValue: unknown =
                                    key && typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key as string] : undefined;
                        isSelectedByValue = itemValue === String(objectValue ?? '');
                    } else {
                        isSelectedByValue = itemValue === String(value);
                    }
                }
            }
            let isActive: boolean = selectedItemIndex !== null ? (args.index === selectedItemIndex) : isSelectedByValue;
            try {
                const curr: string | number | boolean | {[key: string]: unknown; } | null =
                itemData as (string | number | boolean | { [key: string]: unknown } | null);
                if (curr !== undefined && curr !== null) {
                    const currVal: string = typeof curr === 'object' ? String(getValue(fields.value || 'value', curr)) : String(curr);
                    const currText: string = typeof curr === 'object' ? String(getValue(fields.text || fields.value || '', curr)) : String(curr);
                    isActive = String(itemValue) === currVal && String(textValue) === currText;
                }
            } catch {
                isActive = false;
            }
            const isFocused: boolean = itemData ? false : ( (listData?.[0] as { [key: string]: object }).isHeader ?
                args.index === 1 : args.index === 0 );
            const isDisabled: string | boolean | undefined = fields.disabled && typeof args.item === 'object' && getValue(fields.disabled, args.item) === true;

            const itemClassName: string = [
                isActive ? dropDownBaseClasses.selected : '',
                isFocused ? dropDownBaseClasses.focus : '',
                isDisabled ? dropDownBaseClasses.disabled : ''
            ].filter(Boolean).join(' ');

            const fallbackId: string = `${id}-option-${args.index}`;

            return {
                className: itemClassName,
                id: getOptionId ? getOptionId(args.index) : fallbackId,
                'aria-selected': isActive ? 'true' : 'false',
                'aria-disabled': isDisabled ? 'true' : 'false',
                ref: (el: HTMLLIElement | null) => { listItemsRef.current[args.index as number] = el; }
            };
        }, [listData, selectedItemIndex, listbaseClasses, value, fields, dropDownBaseClasses, focusedItemIndex, itemData]);

        const ulListContainer: React.ReactElement = useMemo(() => {
            return <ListItems
                getItemProps={getItemProps}
                items={listData as DataSource[]}
                parentClass={listbaseClasses}
                itemTemplate={itemTemplate}
                groupTemplate={groupTemplate}
                fields={fields}
                ariaAttributes={{
                    itemRole: 'option',
                    listRole: 'listbox',
                    itemText: '',
                    groupItemRole: 'presentation',
                    wrapperRole: 'presentation'
                }}
                onSelect={handleItemClick} />;
        }, [ listbaseClasses, itemTemplate, groupTemplate, listData, handleItemClick, getItemProps, fields, itemData]);

        const getListItems: () => HTMLLIElement[] = useCallback((): HTMLLIElement[] => {
            if ((fields.groupBy || itemTemplate) && containerRef.current) {
                return Array.from(containerRef.current.getElementsByClassName(dropDownBaseClasses.li)) as HTMLLIElement[];
            }
            return listItemsRef.current.filter(Boolean) as HTMLLIElement[];
        }, [fields.groupBy, itemTemplate, dropDownBaseClasses.li]);

        const getScrollContainer: () => HTMLElement | null = useCallback((): HTMLElement | null => {
            const root: HTMLElement | null = containerRef.current as HTMLElement | null;
            if (!root) { return null; }
            const specific: HTMLElement | null = root.querySelector('.sf-ul') as HTMLElement | null;
            if (specific) { return specific; }
            return null;
        }, []);

        const getFilteredListData: () => {[key: string]: object; } [] | boolean[] | string[] | number[] =
        useCallback((): {[key: string]: object; } [] | boolean[] | string[] | number[] => {
            return listData;
        }, [listData, setListData]);

        const getIndexByValue: (value: string | number | boolean) => number = useCallback((value: string | number | boolean): number => {
            let index: number = -1;
            const listItems: HTMLLIElement[] = getListItems();
            for (let i: number = 0; i < listItems.length; i++) {
                const itemValue: string | null = (listItems[i as number]).dataset?.value ?? null;
                if (!isNullOrUndefined(value) && !isNullOrUndefined(itemValue) && String(itemValue) === String(value)) {
                    index = i;
                    break;
                }
            }
            return index;
        }, [getListItems]);

        useImperativeHandle(ref, () => ({
            getFormattedValue,
            getDataByValue,
            getIndexByValue,
            getTextByValue,
            getScrollContainer,
            getListItems,
            getFilteredListData,
            filterType,
            filter
        } as IDropDownBase), [ getFormattedValue, getDataByValue, getIndexByValue, getTextByValue, getListItems, listData,
            getScrollContainer ]);

        const isNavigationKey: (key: string) => key is 'ArrowUp'
        | 'ArrowDown' | 'Home' | 'End' | 'PageUp'
        | 'PageDown' = (key: string) =>
            key === 'ArrowUp' ||
            key === 'ArrowDown' ||
            key === 'Home' ||
            key === 'End' ||
            key === 'PageUp' ||
            key === 'PageDown';

        const handleFilterChange: (e: React.ChangeEvent<HTMLInputElement>) => void =
        useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
            if (debounceDelay && debounceDelay > 0) {
                const value: string = filterInputElementRef.current?.value as string;
                if (filterTimerRef.current) {
                    clearTimeout(filterTimerRef.current as unknown as number);
                    filterTimerRef.current = null;
                }
                setTypedString(value);
                filterTimerRef.current = window.setTimeout(() => {
                    handleInputChange(e);
                    clearTimeout(filterTimerRef.current as unknown as number);
                    filterTimerRef.current = null;
                }, debounceDelay);
            } else {
                handleInputChange(e);
            }
        }, [debounceDelay, handleInputChange, filterInputElementRef, filterTimerRef, setTypedString]);

        const handleFilterKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void =
        useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key !== 'Enter' && !isNavigationKey(e.key)) {
                onFilterUp(e, props.keyActionHandler);
            }
        }, [onFilterUp, props.keyActionHandler]);

        const handleFilterKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void =
        useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                e.stopPropagation();
                onFilterUp(e, props.keyActionHandler);
                return;
            }
            if (isNavigationKey(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                props.keyActionHandler?.(e as unknown as React.KeyboardEvent<HTMLElement>);
                return;
            }
        }, [onFilterUp, props.keyActionHandler]);

        return (
            <>
                { isDataInitialized ? (
                    <div
                        className={size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium'}
                        ref={containerRef}
                    >
                        {isDropdownFiltering && (
                            <span className={'sf-ddl-filter-parent'}>
                                <span
                                    className={`sf-input-group sf-control sf-input-focus ${
                                        size === Size.Small ? 'sf-small' : size === Size.Large ? 'sf-large' : 'sf-medium'
                                    }`}
                                >
                                    <InputBase
                                        name={id + '_filter'}
                                        ref={filterInputElementRef as React.RefObject<HTMLInputElement>}
                                        type='text'
                                        value={typedString}
                                        className={'sf-input-filter'}
                                        placeholder={filterPlaceholder}
                                        title='Filter'
                                        onChange={handleFilterChange}
                                        onKeyUp={handleFilterKeyUp}
                                        onKeyDown={handleFilterKeyDown}
                                    />
                                    {isRequesting ? (<Spinner
                                        size={size === Size.Small ? '16px' : '20px'}
                                        visible={true}
                                    />) : renderClearButton(typedString, clearText) }
                                </span>
                            </span>
                        )}
                        {headerTemplate &&  (
                            <div className="sf-dd-header">
                                <Header headerTemplate={headerTemplate} />
                            </div>
                        )}
                        {(listData.length === 0 ? renderNoRecords : ulListContainer)}
                        {footerTemplate &&  (
                            <div className="sf-dd-footer">
                                <Footer footerTemplate={footerTemplate} />
                            </div>
                        )}
                    </div>
                ) : (
                    isActionFailed && (
                        <div className={dropDownBaseClasses.root + ' ' + dropDownBaseClasses.content + ' ' + dropDownBaseClasses.noData}>
                            {renderError}
                        </div>
                    )
                )}
            </>
        );
    });

export default React.memo(DropDownBase);
