import * as React from 'react';
import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo, useCallback, Ref } from 'react';
import { DataManager, Query, DataOptions } from '@syncfusion/react-data';
import { EmitType, getUniqueID, getValue, IL10n, isNullOrUndefined, L10n, useProviderContext } from '@syncfusion/react-base';
import { generateUL, ListItem, ListBaseOptions, groupDataSource, defaultListBaseOptions, getDataSource, addSorting, SortOrder }
    from '@syncfusion/react-lists';
import { TooltipAnimationOptions, IPopup } from '@syncfusion/react-popups';
import { InputBase, renderClearButton } from '@syncfusion/react-inputs';

export const dropDownBaseClasses: DropDownBaseClassList = {
    root: 'sf-dropdownbase',
    content: 'sf-content',
    selected: 'sf-active',
    focus: 'sf-item-focus',
    li: 'sf-list-item',
    disabled: 'sf-disabled',
    grouping: 'sf-dd-group',
    hover: 'sf-hover'
};

export interface DropDownBaseClassList {
    root: string;
    content: string;
    selected: string;
    focus: string;
    li: string;
    disabled: string;
    grouping: string;
    hover: string;
}

export interface FieldSettingsModel {
    text?: string;
    value?: string;
    groupBy?: string;
    disabled?: string;
    htmlAttributes?: string;
    icon?: string;
}

export interface DataEventArgs {
    cancel?: boolean;
    data: { [key: string]: object }[] | DataManager | string[] | number[] | boolean[];
    query?: Query;
}

export interface PopupEventArgs {
    animation?: TooltipAnimationOptions;
    event?: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.TouchEvent<Element> | object;
    popup: IPopup;
}

export interface FocusEventArgs {
    event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.TouchEvent<Element> | React.KeyboardEvent<Element>;
}

export interface SelectEventArgs {
    item: HTMLLIElement;
    itemData: FieldSettingsModel;
    e: React.MouseEvent<Element> | React.KeyboardEvent<Element> | React.TouchEvent<Element>;
}

export const defaultMappedFields: FieldSettingsModel = {
    text: 'text',
    value: 'value',
    disabled: 'disabled',
    groupBy: 'undefined',
    htmlAttributes: 'htmlAttributes',
    icon: 'icon'
};

export interface FilteringEventArgs {
    preventDefaultAction: boolean;
    baseEventArgs: object;
    text: string;
    updateData: (dataSource: DataManager | string[] | number[] | boolean[], query?: Query, fields?: FieldSettingsModel) => void;
}

export type FilterType = 'StartsWith' | 'EndsWith' | 'Contains';

export interface DropDownBaseProps {
    /**
     * Specifies the data source for the dropdown items
     */
    dataSource: { [key: string]: object }[] | DataManager | string[] | number[] | boolean[];

    /**
     * Defines mapping fields for the data items
     */
    fields: FieldSettingsModel;

    /**
     * Specifies the selected value
     */
    value?: number | string | boolean | object | null;

    /**
     * Defines the query to retrieve specific data from the data source
     */
    query?: Query;

    /**
     * Specifies the sort order for the data items
     */
    sortOrder?: SortOrder;

    /**
     * Specifies whether to ignore case while filtering or selecting items.
     *
     * @default true
     */
    ignoreCase?: boolean;

    /**
     * Specifies whether to ignore diacritics while filtering or selecting items.
     *
     * @default false
     */
    ignoreAccent?: boolean;

    /**
     * Specifies whether filtering is enabled in the dropdown base.
     * When enabled, a search box appears at the top of the popup that allows users to filter items.
     *
     * @default false
     * @private
     */
    isDropdownFiltering?: boolean;

    /**
     * Specifies the placeholder text for the filter input field.
     * This is displayed when the filter input is empty.
     *
     * @default ''
     */
    filterPlaceholder?: string;

    /**
     * Defines the filtering type to apply when searching for items.
     * Possible values are 'StartsWith', 'EndsWith', and 'Contains'.
     *
     * @default 'StartsWith'
     */
    filterType?: FilterType;

    /**
     * Defines template for rendering individual items
     */
    itemTemplate?: Function | React.ReactNode;

    /**
     * Defines template for rendering group headers
     */
    groupTemplate?: Function | React.ReactNode;

    /**
     * Defines template for header section
     */
    headerTemplate?: Function | React.ReactNode;

    /**
     * Defines template for footer section
     */
    footerTemplate?: Function | React.ReactNode;

    /**
     * Defines template when no data is available
     */
    noRecordsTemplate?: Function | React.ReactNode;

    /**
     * Specifies the height of the popup
     */
    popupHeight?: string | number;

    /**
     * Triggers when data fetching fails
     */
    actionFailure?: (e: object) => void;

    /**
     * Triggers when an item is clicked
     */
    onItemClick?: (e: React.MouseEvent<HTMLLIElement>, index: number) => void;

    /**
     * Handles keyboard actions
     */
    keyActionHandler?: (e: React.KeyboardEvent<HTMLElement>) => void;

    /**
     * Triggers on typing a character in the filter bar when the filtering is enabled.
     */
    onFilterChange?: EmitType<FilteringEventArgs>;

    /**
     * Callback that triggers when remote data loading completes
     *
     * @private
     */
    onDataLoaded?: () => void;

    /**
     * Triggers after data is fetched successfully from the remote server.
     */
    actionComplete?: EmitType<object>;
}

export interface IDropDownBase {
    /**
     * Gets formatted value based on type
     */
    getFormattedValue(value: string | number | boolean): string | number | boolean | [];

    /**
     * Gets data object by value
     */
    getDataByValue(value: string | number | boolean): { [key: string]: object } | string | number | boolean | undefined;

    /**
     * Gets index by value
     */
    getIndexByValue(value: string | number | boolean): number;

    /**
     * Gets text by value
     */
    getTextByValue(value: string | number | boolean): string;

    /**
     * Gets all list items
     */
    getListItems(): HTMLLIElement[];

    /**
     * To filter the data from given data source by using query
     */
    filter(dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
        query?: Query, fields?: FieldSettingsModel): void;
}

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
            itemTemplate,
            groupTemplate,
            headerTemplate,
            footerTemplate,
            sortOrder = SortOrder.None,
            noRecordsTemplate,
            popupHeight,
            id = getUniqueID('dropdownlist'),
            actionFailure,
            onItemClick,
            onFilterChange,
            onDataLoaded,
            actionComplete
        } = props;

        const [listData, setListDatas] = useState<{ [key: string]: object }[] | boolean[] | string[] | number[]>([]);
        const [isRequesting, setIsRequesting] = useState<boolean>(false);
        const [isDataInitialized, setIsDataInitialized] = useState<boolean>(false);
        const [, setListBaseOptions] = useState<ListBaseOptions>(defaultListBaseOptions);
        const { locale } = useProviderContext();
        const localeStrings: Record<string, string> = { noRecordsTemplate: 'No Records Found' };
        const l10nInstance: IL10n = L10n('drop-down-list', localeStrings, locale || 'en-US');
        const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
        const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
        const listItemsRef: React.RefObject<(HTMLLIElement | null)[]> = useRef<(HTMLLIElement | null)[]>([]);
        const filterInputElementRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
        const [typedString, setTypedString] = useState<string>('');
        const [, setIsDataFetched] = useState<boolean>(false);
        const [isCustomFilter, setIsCustomFilter] = useState<boolean>(false);
        const typedStringRef: React.RefObject<string> = useRef(typedString);
        const containerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

        useEffect(() => {
            if (value != null && listData.length > 0) {
                const itemIndex: number = listData.findIndex((item: string | number | boolean | {[key: string]: object}) => {
                    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                        return String(item) === String(value);
                    } else {
                        return String(getValue(fields.value ?? '', item)) === String(value);
                    }
                });

                if (itemIndex !== -1) {
                    setSelectedItemIndex(itemIndex);
                }
            }
        }, [value, listData, fields]);

        useEffect(() => {
            if (typedString !== null) {
                typedStringRef.current = typedString;
                setListData(dataSource, query);
            }
        }, [typedString]);

        useEffect(() => {
            if (isDropdownFiltering && filterInputElementRef.current) {
                filterInputElementRef.current.focus();
            }
        }, [isDropdownFiltering, filterInputElementRef.current]);

        const typeOfData: (items: (string | number | boolean | { [key: string]: object })[]) =>
        { typeof: string | null, item: string | number | boolean | { [key: string]: object } | null } =
            useCallback((items: (string | number | boolean | { [key: string]: object })[]) => {
                let item: {
                    typeof: string | null;
                    item: string | number | boolean | { [key: string]: object } | null;
                } = { typeof: null, item: null };
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

        const getFormattedValue: (value: string | number | boolean | []) => string | number | boolean =
            useCallback((value: string | number | boolean | []): string | number | boolean => {
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

        const checkIgnoreCase: (item: string, text: string) => boolean = useCallback((item: string, text: string): boolean => {
            if (isNullOrUndefined(item)) {
                return false;
            }
            return String(item).toLowerCase() === text?.toString().toLowerCase();
        }, []);

        const checkValueCase: (
            text: string,
            ignoreCase: boolean,
            isTextByValue?: boolean
        ) => string | number | null = useCallback((
            text: string,
            ignoreCase: boolean,
            isTextByValue?: boolean
        ): string | number | null => {
            let value: string | number | null = null;
            if (isTextByValue) {
                value = text;
            }
            if (!isNullOrUndefined(listData)) {
                const dataSource: { [key: string]: object }[] = listData as { [key: string]: object }[];
                if (ignoreCase) {
                    dataSource.filter((item: { [key: string]: object }) => {
                        const itemValue: string | number = getValue(fields.value as string, item);
                        if (!isNullOrUndefined(itemValue) &&
                            checkIgnoreCase(getValue(fields.text || fields.value || '', item).toString(), text)) {
                            value = getValue(fields.value as string, item) as string;
                        }
                    });
                } else {
                    if (isTextByValue) {
                        const compareValue: string | number | null = value;
                        dataSource.filter((item: { [key: string]: object }) => {
                            const itemValue: string | number = getValue(fields.value as string, item);
                            if (!isNullOrUndefined(itemValue) && !isNullOrUndefined(value) &&
                                compareValue != null && itemValue.toString() === compareValue.toString()) {
                                value = getValue(fields.text as string, item) as string;
                            }
                        });
                    }
                }
            }
            return value;
        }, [
            listData,
            fields,
            typeOfData
        ]);

        const getTextByValue: (value: string | number | boolean) => string = useCallback((value: string | number | boolean): string => {
            const dataType: string = typeOfData(dataSource as (string | number | boolean | { [key: string]: object })[]).typeof as string;
            if (dataType === 'string' || dataType === 'number' || dataType === 'boolean') {
                return value.toString();
            }

            return checkValueCase(value as string, ignoreCase ? true : false, true) as string || '';
        }, [checkValueCase, typeOfData, dataSource]);

        const getQuery: (newQuery?: Query) => Query = useCallback((newQuery?: Query): Query => {
            let filterQuery: Query;
            if (!isCustomFilter && isDropdownFiltering && ((typedStringRef.current) || filterInputElementRef.current)) {
                filterQuery = (newQuery as Query).clone();
                const filteringType: string = typedStringRef.current === '' ? 'contains' : filterType;
                const dataType: string | null = typeOfData(dataSource as (string | number | boolean | { [key: string]: object })[]).typeof;
                if (!(dataSource instanceof DataManager) && (dataType === 'string' || dataType === 'number')) {
                    filterQuery.where('', filteringType, typedStringRef.current, ignoreCase, ignoreAccent);
                } else if ((isDropdownFiltering && typedStringRef.current !== '')) {
                    const field: string = (fields?.text) ? fields.text : '';
                    filterQuery.where(field, filteringType, typedStringRef.current, ignoreCase, ignoreAccent);
                }
            } else {
                filterQuery = (newQuery as Query).clone();
            }
            return filterQuery.clone();
        }, [query, isCustomFilter, isDropdownFiltering, filterType, ignoreCase, ignoreAccent, fields]);

        const handleItemClick: (e: React.MouseEvent<HTMLLIElement>, index: number) => void =
            useCallback((e: React.MouseEvent<HTMLLIElement>, index: number): void => {
                const value: string | null = e.currentTarget.getAttribute('data-value');
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
                setSelectedItemIndex(index);
                setFocusedItemIndex(null);
                onItemClick?.(e, index);
            }, [getDataByValue, getFormattedValue, getTextByValue, onItemClick, typeOfData, dataSource]);

        const setItemFocus: () => void = useCallback((): void => {
            if (listData.length > 0) {
                let isSelectedItem: boolean = false;

                if (value != null) {
                    const itemIndex: number = listData.findIndex((item: string | number | boolean | {
                        [key: string]: object
                    }) =>
                        getValue(fields.value ?? '', item) === value);
                    if (itemIndex !== -1) {
                        setSelectedItemIndex(itemIndex);
                        isSelectedItem = true;
                        setFocusedItemIndex(null);
                    }
                }

                if (!isSelectedItem) {
                    const firstEnabledIndex: number = listData.findIndex((item: string | number | boolean | {
                        [key: string]: object
                    }) =>
                        !getValue(fields.disabled ?? '', item));
                    if (firstEnabledIndex !== -1) {
                        setFocusedItemIndex(firstEnabledIndex);
                    }
                }
            }
        }, [value, fields, listData]);

        const setListData: (
            dataSource: { [key: string]: object }[] | string[] | number[] | DataManager | boolean[],
            query?: Query
        ) => void = useCallback((
            dataSource: { [key: string]: object }[] | string[] | number[] | DataManager | boolean[],
            query?: Query
        ): void => {
            let filteredDataSource: typeof dataSource;
            if (Array.isArray(dataSource)) {
                filteredDataSource = dataSource.filter((item: string | number | boolean | {[key: string]: object}) =>
                    item !== null && item !== undefined) as typeof dataSource;
            } else {
                filteredDataSource = dataSource;
            }
            const eventArgs: DataEventArgs = { cancel: false, data: filteredDataSource, query: query };
            if (!isRequesting && !eventArgs.cancel) {
                setIsRequesting(true);
                if (dataSource instanceof DataManager) {
                    (eventArgs.data as DataManager).executeQuery(getQuery(eventArgs.query || new Query()))
                        .then((e: Record<string, any>) => {
                            if (!e.cancel) {
                                const completeEventArgs: { result: Array<{ [key: string]: object } | string | number | boolean>;
                                    query: Query } = {
                                    result: e.result,
                                    query: getQuery(eventArgs.query || new Query())
                                };
                                actionComplete?.(completeEventArgs);
                                processDataResult(completeEventArgs.result);
                            }
                            setIsRequesting(false);
                            onDataLoaded?.();
                        })
                        .catch((e: object) => {
                            setIsRequesting(false);
                            actionFailure?.(e);
                        });
                } else {
                    const dataManager: DataManager = new DataManager(eventArgs.data as DataOptions | JSON[]);
                    const listItems: { [key: string]: object }[] =
                        getQuery(eventArgs.query || new Query()).executeLocal(dataManager) as { [key: string]: object }[];
                    actionComplete?.({ result: listItems, query: getQuery(eventArgs.query || new Query()) });
                    processDataResult(listItems);
                    setIsRequesting(false);
                }
            }
        }, [
            isRequesting,
            getQuery,
            sortOrder,
            actionFailure,
            onDataLoaded,
            actionComplete
        ]);

        const listbaseClasses: string = useMemo(() => {
            const isPrimitiveArray: boolean = Array.isArray(listData) && listData.length > 0 &&
            (typeof listData[0] === 'string' ||
            typeof listData[0] === 'number' ||
            typeof listData[0] === 'boolean');
            return [
                dropDownBaseClasses.content,
                dropDownBaseClasses.root,
                (!isPrimitiveArray && fields.groupBy) ? dropDownBaseClasses.grouping : '',
                listData.length === 0 ? 'sf-nodata' : ''
            ].filter(Boolean).join(' ');
        }, [fields.groupBy, listData]);

        useEffect(() => {
            const updatedOptions: ListBaseOptions = {
                fields: fields,
                parentClass: listbaseClasses,
                hoverIndex: -1,
                itemTemplate: itemTemplate,
                groupTemplate: groupTemplate,
                ariaAttributes: {
                    itemRole: 'listitem',
                    listRole: 'list',
                    itemText: '',
                    groupItemRole: 'presentation',
                    wrapperRole: 'presentation'
                }
            };
            setListBaseOptions(updatedOptions);
        }, [fields, itemTemplate, groupTemplate, sortOrder, listbaseClasses]);

        useEffect(() => {
            if (!isDataInitialized) {
                setListData(dataSource, query);
            }
        }, [dataSource, fields, query, isDataInitialized]);

        useEffect(() => {
            setItemFocus();
        }, [setItemFocus]);

        const processDataResult: (result: Array<{ [key: string]: object } | string | number | boolean>) =>
        void = useCallback((result: Array<{ [key: string]: object } | string | number | boolean>): void => {
            if (!isDataInitialized) {
                setIsDataInitialized(true);
            }
            const isPrimitiveArray: boolean = result.length > 0 &&
    (typeof result[0] === 'string' || typeof result[0] === 'number' || typeof result[0] === 'boolean');
            if (isPrimitiveArray || !fields.groupBy) {
                if (isPrimitiveArray && sortOrder !== SortOrder.None) {
                    const sortedResult:  (string | number | boolean | {[key: string]: object})[] = [...result];
                    if (sortOrder === SortOrder.Ascending) {
                        sortedResult.sort((a: string | number | boolean | { [key: string]: object },
                                           b: string | number | boolean | { [key: string]: object }) =>
                            String(a).localeCompare(String(b))
                        );
                    } else if (sortOrder === SortOrder.Descending) {
                        sortedResult.sort((a: string | number | boolean | { [key: string]: object },
                                           b: string | number | boolean | { [key: string]: object }) =>
                            String(b).localeCompare(String(a))
                        );
                    }
                    setListDatas(sortedResult as typeof listData);
                } else {
                    const sortQuery: Query = addSorting(sortOrder, fields?.text || 'text', query);
                    setListDatas(getDataSource(result as { [key: string]: object }[], sortQuery));
                }
            } else {
                setListDatas(groupDataSource(result as { [key: string]: object }[], fields, sortOrder));
            }
        }, [sortOrder, fields, isDataInitialized, setIsDataInitialized, query]);

        const listBaseOptions: ListBaseOptions = useMemo(() => ({
            fields: fields,
            parentClass: listbaseClasses,
            hoverIndex: -1,
            itemTemplate: itemTemplate,
            groupTemplate: groupTemplate,
            itemClick: handleItemClick,
            sortOrder: sortOrder,
            ariaAttributes: {
                itemRole: 'option',
                listRole: 'listbox',
                itemText: '',
                groupItemRole: 'presentation',
                wrapperRole: 'presentation'
            }
        }), [fields, listbaseClasses, itemTemplate, groupTemplate, handleItemClick, sortOrder]);


        const listItems: React.ReactElement[] = useMemo(() => {
            listItemsRef.current = new Array(listData.length).fill(null);
            const activeValues: Set<unknown> = new Set();
            return (listData as ({ [key: string]: object } | string | number)[]).map(
                (item: { [key: string]: object } | string | number, index: number) => {
                    const actualIndex: number = index;
                    let isSelected: boolean = false;
                    let itemValue: string = '';
                    if (value !== null) {
                        if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
                            itemValue = String(item);
                            isSelected = String(item) === String(value);
                        } else {
                            itemValue = String(getValue(fields.value || '', item));
                            isSelected = itemValue === String(value);
                        }
                        if (isSelected && activeValues.has(itemValue)) {
                            isSelected = false;
                        }

                        if (isSelected) {
                            activeValues.add(itemValue);
                        }
                    }
                    const isActive: boolean = isSelected || index === selectedItemIndex;
                    const isFocused: boolean = index === focusedItemIndex && index !== selectedItemIndex;
                    const isDisabled: string | boolean | undefined = fields.disabled &&
                        typeof item === 'object' &&
                        getValue(fields.disabled, item) === true;

                    const itemClassName: string = [
                        isActive ? dropDownBaseClasses.selected : '',
                        isFocused ? dropDownBaseClasses.focus : '',
                        isDisabled ? dropDownBaseClasses.disabled : ''
                    ].filter(Boolean).join(' ');

                    return (
                        <ListItem
                            key={`list-item-${index}`}
                            item={item}
                            itemClassName={itemClassName}
                            fields={listBaseOptions.fields || defaultMappedFields}
                            index={actualIndex}
                            options={listBaseOptions}
                            onClick={(e: React.MouseEvent<HTMLLIElement>) => listBaseOptions.itemClick?.(e, index)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLLIElement>) =>
                                listBaseOptions.itemKeyDown?.(e, index)}
                            aria-selected={isActive ? 'true' : 'false'}
                            aria-disabled={isDisabled ? 'true' : 'false'}
                            data-id={getUniqueID()}
                            listItemRef={(el: HTMLLIElement | null) => { listItemsRef.current[index as number] = el;
                            }}
                        />
                    );
                }
            );
        }, [
            listData,
            listBaseOptions,
            selectedItemIndex,
            focusedItemIndex,
            value,
            fields,
            dropDownBaseClasses
        ]);

        const getListItems: () => HTMLLIElement[] = useCallback((): HTMLLIElement[] => {
            if ((fields.groupBy || itemTemplate) && containerRef.current) {
                return Array.from(containerRef.current.getElementsByClassName(dropDownBaseClasses.li)) as HTMLLIElement[];
            }
            return listItemsRef.current.filter(Boolean) as HTMLLIElement[];
        }, [fields.groupBy, itemTemplate, dropDownBaseClasses.li]);

        const getIndexByValue: (value: string | number | boolean) => number = useCallback((value: string | number | boolean): number => {
            let index: number = -1;
            const listItems: HTMLLIElement[] = getListItems();
            for (let i: number = 0; i < listItems.length; i++) {
                const itemValue: string | null = listItems[i as number].getAttribute('data-value');
                if (!isNullOrUndefined(value) && !isNullOrUndefined(itemValue) &&
        String(itemValue) === String(value)) {
                    index = i;
                    break;
                }
            }
            return index;
        }, [getListItems]);

        const ulListContainer: React.ReactElement = useMemo(() => {
            return generateUL(listItems, listBaseOptions);
        }, [listItems, listBaseOptions]);

        const renderHeader: React.ReactNode = useMemo(() => {
            if (React.isValidElement(headerTemplate)) {
                return headerTemplate;
            }
            if (typeof headerTemplate === 'function') {
                return (headerTemplate as () => React.ReactNode)();
            }
            return null;
        }, [headerTemplate]);

        const renderFooter: React.ReactNode = useMemo(() => {
            if (React.isValidElement(footerTemplate)) {
                return footerTemplate;
            }
            if (typeof footerTemplate === 'function') {
                return (footerTemplate as () => React.ReactNode)();
            }
            return null;
        }, [footerTemplate]);

        const renderNoRecords: React.ReactNode = useMemo(() => {
            if (noRecordsTemplate === null) {
                return null;
            }
            if (React.isValidElement(noRecordsTemplate)) {
                return noRecordsTemplate;
            }
            if (typeof noRecordsTemplate === 'function') {
                return (noRecordsTemplate as () => React.ReactNode)();
            }
            return (
                <div className="sf-content sf-dropdownbase sf-nodata">
                    {l10nInstance.getConstant('noRecordsTemplate')}
                </div>
            );
        }, [noRecordsTemplate, l10nInstance]);

        useImperativeHandle(ref, () => ({
            getFormattedValue,
            getDataByValue,
            getIndexByValue,
            getTextByValue,
            getListItems,
            filterType,
            filter
        } as IDropDownBase), [
            getFormattedValue,
            getDataByValue,
            getIndexByValue,
            getTextByValue,
            getListItems,
            listData
        ]);

        const filterInputAttributes: { [key: string]: string } = {
            autoComplete: 'off',
            autoCapitalize: 'off',
            spellCheck: 'false',
            'aria-expanded': 'false',
            'aria-disabled': 'false',
            role: 'combobox'
        };

        const onFilterUp: (e: React.KeyboardEvent<HTMLInputElement>) =>
        void = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (props.keyActionHandler) {props.keyActionHandler(e); }
        };

        const filter: (
            dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
            query?: Query,
            fields?: FieldSettingsModel
        ) => void = (
            dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
            query?: Query,
            fields?: FieldSettingsModel
        ): void => {
            setIsCustomFilter(true);
            const currentValue: string = filterInputElementRef.current?.value || typedString;
            if (currentValue) {
                const filterQuery: Query = query || new Query();
                if (!query) {
                    filterQuery.where(
                        fields?.text || 'text',
                        'contains',
                        currentValue,
                        ignoreCase
                    );
                }
                filteringAction(dataSource, filterQuery);
            } else {
                filteringAction(dataSource, query);
            }
        };


        const filteringAction: (
            dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
            query?: Query | null
        ) => void = (
            dataSource: { [key: string]: Object }[] | DataManager | string[] | number[] | boolean[],
            query?: Query | null
        ): void => {
            if (filterInputElementRef.current != null && filterInputElementRef.current.value.trim() !== '') {
                const filterQuery: Query = query || new Query();
                if (!query) {
                    const isPrimitive: boolean = Array.isArray(dataSource) && dataSource.length > 0 &&
                (typeof dataSource[0] === 'string' || typeof dataSource[0] === 'number' || typeof dataSource[0] === 'boolean');
                    if (isPrimitive) {
                        filterQuery.where('', filterType, filterInputElementRef.current.value, ignoreCase, ignoreAccent);
                    } else {
                        filterQuery.where(
                            fields.text || 'text',
                            filterType,
                            filterInputElementRef.current.value,
                            ignoreCase,
                            ignoreAccent
                        );
                    }
                }
                setListData(dataSource, filterQuery);
            } else {
                setListData(dataSource, query || new Query());
            }
        };

        const searchLists: (e: KeyboardEvent | MouseEvent, filterValue?: string) => void =
        (e: KeyboardEvent | MouseEvent, filterValue?: string): void => {
            setIsDataFetched(false);
            if (isDropdownFiltering && (filterInputElementRef.current != null)) {
                setIsRequesting(false);
                const eventArgs: FilteringEventArgs = {
                    preventDefaultAction: false,
                    text: filterValue as string,
                    updateData: (dataSource: DataManager | string[] | number[] | boolean[], query?: Query) => {
                        setIsCustomFilter(true);
                        filteringAction(dataSource, query);
                    },
                    baseEventArgs: e
                };
                if (onFilterChange) {
                    onFilterChange(eventArgs);
                }
                if (!isCustomFilter && !eventArgs.preventDefaultAction) {
                    filteringAction(dataSource, null);
                }
            }
        };

        const clearText: () => void = (): void => {
            setTypedString('');
        };

        return (
            <>
                {isDropdownFiltering && !isRequesting && (
                    <span className={'sf-filter-parent'}>
                        <span className='sf-input-group sf-control-wrapper sf-input-focus'>
                            <InputBase
                                ref={filterInputElementRef as React.RefObject<HTMLInputElement>}
                                type='text'
                                value={typedString}
                                className={'sf-input-filter'}
                                placeholder={filterPlaceholder}
                                aria-controls={`${id}_filter`}
                                aria-autocomplete="list"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setTypedString(e.target.value);
                                    searchLists(e as unknown as KeyboardEvent, e.target.value);
                                }}
                                onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => onFilterUp(e)}
                                {...filterInputAttributes}
                            />
                            {renderClearButton(typedString, () => clearText())}
                        </span>
                    </span>
                )}
                {!isRequesting && (
                    <div
                        ref={containerRef}
                        tabIndex={-1}
                        style={popupHeight ? {
                            maxHeight: typeof popupHeight === 'number' ? `${popupHeight}px` : popupHeight,
                            overflow: 'auto'
                        } : undefined}
                    >
                        <div className="sf-ddl-header">
                            {renderHeader}
                        </div>
                        {(listData.length === 0 && !(dataSource instanceof DataManager)) ? renderNoRecords : ulListContainer}
                        <div className="sf-ddl-footer">
                            {renderFooter}
                        </div>
                    </div>
                )}
            </>
        );
    });

export default React.memo(DropDownBase);
