import * as React from 'react';
import { forwardRef, useRef, useImperativeHandle, useLayoutEffect, useState, useEffect, HTMLAttributes, useCallback, useMemo } from 'react';
import { DataManager, Query, ReturnOption } from '@syncfusion/react-data';
import { ListItem, ListBaseOptions, FieldsMapping, SortOrder, CheckBoxPosition, VirtualizationProps } from '../common/list-base';
import { defaultListBaseOptions, getDataSource, getFieldValues, groupDataSource, addSorting, defaultMappedFields, generateUL } from '../common/list-base';
import { isNullOrUndefined, merge, preRender, useProviderContext, SvgIcon } from '@syncfusion/react-base';

/**
 * An enum type that denotes the ListView scroll direction.
 */
export enum Direction {
    /**
     * The scrollbar is moved upwards.
     */
    Top = 'Top',
    /**
     * The scrollbar is moved downwards.
     */
    Bottom = 'Bottom'
}

/**
 * An interface that holds scrolled event arguments.
 */
export interface ScrolledEvent {
    /**
     * Specifies the direction “Top” or “Bottom” in which the scrolling occurs.
     */
    scrollDirection: Direction;
    /**
     * Specifies the default scroll event arguments.
     */
    originalEvent: React.UIEvent<HTMLDivElement>;
    /**
     * Specifies the distance from the scrollbar to the top and bottom ends.
     */
    distanceY: number;
}

/**
 * An interface that holds clicked ListView item details.
 */
export interface ClickEvent {
    /**
     * Specifies the clicked list item data.
     */
    data: { [key: string]: Object };

    /**
     * Specifies the DOM event object triggered by the user's interaction through mouse or keyboard.
     */
    event: MouseEvent | KeyboardEvent;

    /**
     * Specifies name of the event.
     */
    name?: string;
}

/**
 * An interface representing a data source object that maps string keys to various data types.
 * The value associated with each key can be an object, string, number, or boolean.
 */
interface DataSource {
    [key: string]: object | string | number | boolean;
}

const CLS_SELECTED: string = 'sf-active';
const CLS_LISTITEM: string = 'sf-list-item';
const CLS_GROUP_LISTITEM: string = 'sf-list-group-item';
const CLS_HAS_CHILD: string = 'sf-has-child';
const CLS_DISABLE: string = 'sf-disabled';
const BACKICON_PATH: string = 'M12.4142 19L6.41424 13H21V11H6.41424L12.4142 5L11 3.58578L2.58582 12L11 20.4142L12.4142 19Z';

export interface ListViewProps {
    /**
     * The `disabled` property is used to enable or disable the ListView component.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * The `dataSource` property provides the data to render the ListView component which is mapped with the fields of ListView.
     *
     * @default []
     */
    dataSource?: { [key: string]: Object }[] | DataManager;

    /**
     * The `query` property is used to fetch the specific data from dataSource by using where and select keywords.
     *
     * @default -
     */
    query?: Query;

    /**
     * The `fields` property is used to map keys from the dataSource which extracts the appropriate data from the dataSource
     *  with specified mapped with the column fields to render the ListView.
     *
     * @default defaultMappedFields
     */
    fields?: FieldsMapping;

    /**
     * The `sortOrder` is used to sort the data source. The available type of sort orders are,
     * * `None` - The data source is not sorting.
     * * `Ascending` - The data source is sorting with ascending order.
     * * `Descending` - The data source is sorting with descending order.
     *
     * @default SortOrder.None
     */
    sortOrder?: SortOrder;

    /**
     * The `checkBox` property is used to render the checkbox in the ListView component.
     *
     * @default false
     */
    checkBox?: boolean;

    /**
     * The `checkBoxPosition` is used to set the position of check box in a list item.
     * By default, the `checkBoxPosition` is Left, which will appear before the text content in a list item.
     *
     * @default CheckBoxPosition.Left
     */
    checkBoxPosition?: CheckBoxPosition;

    /**
     * The ListView component supports to customize the content of each list items with the help of `itemTemplate` property.
     *
     * @default -
     */
    itemTemplate?: Function | React.ReactNode;

    /**
     * The ListView has an option to custom design the ListView header title with the help of `header` property.
     *
     * @default -
     */
    header?: Function | React.ReactNode;

    /**
     * The ListView has an option to custom design the group header title with the help of `groupTemplate` property.
     *
     * @default -
     */
    groupTemplate?: Function | React.ReactNode;

    /**
     * Provides configuration options for enabling and managing virtualization
     * in the ListView component. Virtualization enhances performance by
     * only rendering items that are currently visible in the viewport.
     *
     * @default -
     */
    virtualization?: VirtualizationProps;

    /**
     * Triggers when we click the ListView item in the component.
     *
     * @event onSelect
     */
    onSelect?: (event: ClickEvent) => void;

    /**
     * Triggers before the data binding process starts in ListView component.
     *
     * @event onActionBegin
     */
    onActionBegin?: () => void;

    /**
     * Triggers after the data binding process completes in ListView component.
     *
     * @event onActionComplete
     */
    onActionComplete?: () => void;

    /**
     * Triggers, when the data fetch request from the remote server, fails.
     *
     * @event onActionFailure
     */
    onActionFailure?: (event: object) => void;

    /**
     * Triggers when the ListView component is scrolled.
     *
     * @event onScroll
     */
    onScroll?: (event: ScrolledEvent) => void;
}

export interface IListView extends ListViewProps {
    /**
     * This is ListView component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}

type IListViewProps = ListViewProps & HTMLAttributes<HTMLDivElement>;

export const ListView: React.ForwardRefExoticComponent<ListViewProps & HTMLAttributes<HTMLDivElement> & React.RefAttributes<IListView>> =
    forwardRef<IListView, IListViewProps>(
        (props: IListViewProps, ref: React.Ref<IListView>) => {

            const [listItemDatas, setListItemDatas] = useState<DataSource[]>([]);
            const [curDSLevel, setCurDSLevel] = useState<string[]>([]);
            const [headerContent, setHeaderContent] = useState<string | React.ReactNode>();
            const [listbaseOptions, setListbaseOptions] = useState<ListBaseOptions>(defaultListBaseOptions);
            const [selectedItemIndex, setSelectedItemIndex] = useState<number>(-1);
            const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
            const [liStartIndex, setLIStartIndex] = useState<number>(0);
            const [activeItemsId, setActiveItemsId] = useState<string[]>([]);
            const [totalItemsCount, setTotalItemsCount] = useState<number>(0);

            const listviewRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
            const contentRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
            const headerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
            const scrollTimeoutRef: React.RefObject<number | null> = useRef<number | null>(null);
            const requestedRange: React.RefObject<{ start: number; end: number }> =
                useRef<{ start: number; end: number }>({ start: 0, end: 0 });

            const { dir } = useProviderContext();

            let totalHeight: number = 0;

            const {
                disabled = false,
                dataSource = [],
                query,
                fields = defaultMappedFields,
                sortOrder = SortOrder.None,
                checkBox = false,
                checkBoxPosition = CheckBoxPosition.Left,
                virtualization,
                itemTemplate,
                header,
                groupTemplate,
                className,
                onSelect,
                onActionBegin,
                onActionComplete,
                onActionFailure,
                onScroll,
                ...additionalAttrs
            } = props;

            const publicAPI: Partial<IListView> = {
                disabled,
                dataSource,
                query,
                fields,
                sortOrder,
                checkBox,
                checkBoxPosition,
                virtualization
            };

            useImperativeHandle(ref, () => ({
                ...publicAPI as IListView,
                element: listviewRef.current
            }), [publicAPI]);

            useLayoutEffect(() => {
                preRender('listview');
            }, []);

            useEffect(() => {
                if (dataSource instanceof DataManager) {
                    if (virtualization !== undefined && (listItemDatas as DataSource[]).length === 0) {
                        const initialItemsCount: number = virtualization.itemsCount || 15;
                        const initialOverscan: number = virtualization.overscanCount || 5;
                        const initialEndIndex: number = initialItemsCount + initialOverscan;
                        onActionBegin?.();
                        const initialQuery: Query = query ?
                            query.clone().skip(0).take(initialEndIndex).requiresCount() as Query :
                            new Query();
                        (dataSource as DataManager).executeQuery(initialQuery)
                            .then((dataResult: ReturnOption) => {
                                const items: DataSource[] = dataResult.result as DataSource[];
                                const totalCount: number = dataResult.count as number;
                                requestedRange.current = { start: 0, end: initialEndIndex };
                                const liHeight: number = virtualization.itemSize || 40;
                                const itemCountToRender: number = virtualization.itemsCount || 15;
                                const totalItemCountToRender: number = itemCountToRender + (virtualization.overscanCount || 5);
                                totalHeight = (totalCount * liHeight) - (totalItemCountToRender * liHeight);
                                setTotalItemsCount(totalCount);
                                setListItemDatas(items);
                                setListbaseOptions((prevOptions: ListBaseOptions) => ({
                                    ...prevOptions,
                                    topLiItemsHeight: 0,
                                    bottomLiItemsHeight: totalHeight,
                                    listItemSize: liHeight
                                }));

                                onActionComplete?.();
                            }).catch((error: object) => {
                                if (onActionFailure) {
                                    onActionFailure(error as object);
                                }
                            });
                    } else {
                        onActionBegin?.();
                        if ((props.dataSource as DataManager).ready) {
                            (props.dataSource as DataManager).ready.then((e: Object) => {
                                const isOffline: boolean = (props.dataSource as DataManager).dataSource.offline as boolean;
                                if (props.dataSource instanceof DataManager && isOffline) {
                                    renderRemoteLists(e);
                                }
                            }).catch((e: Object) => {
                                triggerActionFailure(e);
                            });
                        } else {
                            (props.dataSource as DataManager).executeQuery(getQuery()).then((e: object) => {
                                renderRemoteLists(e);
                            }).catch((e: Object) => {
                                triggerActionFailure(e);
                            });
                        }
                    }

                }
                else {
                    onActionBegin?.();
                    let dataToRender: DataSource[] = dataSource as DataSource[];
                    if (fields?.groupBy) {
                        dataToRender = groupDataSource(dataToRender, fields, sortOrder);
                    } else if (sortOrder !== 'None') {
                        const query: Query = addSorting(sortOrder as SortOrder, fields?.sortBy || fields?.text || 'text');
                        dataToRender = getDataSource(dataToRender, query);
                    }
                    if (virtualization !== undefined && (listItemDatas as DataSource[]).length === 0) {
                        const liHeight: number = virtualization.itemSize || 40;
                        const itemCountToRender: number = virtualization.itemsCount || 15;
                        const firstIndex: number = 0;
                        const lastIndex: number = itemCountToRender;
                        const otherDs: { [key: string]: object }[] =
                            (dataSource as DataSource[]).slice(firstIndex, lastIndex + 1) as { [key: string]: object }[];
                        totalHeight = (Object.keys(dataSource).length * liHeight) - (itemCountToRender * liHeight);
                        setListItemDatas(otherDs);
                    } else {
                        setListItemDatas(dataToRender);
                    }
                    onActionComplete?.();
                }
            }, [dataSource, fields, sortOrder]);

            useEffect(() => {
                const updatedOptions: ListBaseOptions = {
                    fields: fields,
                    itemTemplate: itemTemplate,
                    groupTemplate: groupTemplate,
                    sortOrder: sortOrder,
                    checkBox: checkBox,
                    checkBoxPosition: checkBoxPosition,
                    ariaAttributes: {
                        itemRole: 'listitem', listRole: 'list', itemText: '',
                        groupItemRole: 'presentation', wrapperRole: 'presentation'
                    },
                    virtualization: virtualization,
                    topLiItemsHeight: 0,
                    bottomLiItemsHeight: totalHeight,
                    listItemSize: virtualization?.itemSize,
                    itemClick: handleItemClick,
                    itemKeyDown: handleItemKeyDown
                };
                setListbaseOptions(updatedOptions);
            }, [
                fields,
                itemTemplate,
                header,
                groupTemplate,
                sortOrder,
                checkBox
            ]);

            useEffect(() => {
                if (header != null && headerContent == null) {
                    const headerContent: React.ReactNode = typeof header === 'function' ? header({}) : header;
                    setListHeader(headerContent);
                } else {
                    setHeaderContent(null);
                }
            }, [header]);

            const setListHeader: (header: React.ReactNode) => void
                = (header: React.ReactNode): void => {
                    setHeaderContent(
                        <div ref={headerRef} className="sf-list-header">
                            {curDSLevel.length > 0 && (
                                <div className="sf-icon-back sf-back-button" onClick={back}>
                                    <SvgIcon width='18' height='18' d={BACKICON_PATH}></SvgIcon>
                                </div>
                            )}
                            <div className="sf-text">
                                <span className="sf-headertext">{header}</span>
                            </div>
                        </div>
                    );
                };

            const fetchData: (query: Query, startIndex: number, endIndex: number) => Promise<void>
                = async (query: Query, startIndex: number, endIndex: number) => {
                    try {
                        const liHeight: number = virtualization?.itemSize || 40;
                        (dataSource as DataManager).executeQuery(query)
                            .then((dataResult: ReturnOption) => {
                                let items: DataSource[] = dataResult.result as DataSource[];

                                if (activeItemsId && activeItemsId.length > 0) {
                                    const mapFunction: (item: DataSource) => DataSource =
                                        (item: DataSource) => ({
                                            ...item,
                                            [checkBox ?
                                                fields.isChecked as string || 'isChecked' :
                                                fields.isSelected as string || 'isSelected'
                                            ]: activeItemsId.includes(item[fields.id as string]?.toString())
                                        });
                                    items = items.map(mapFunction);
                                }

                                if (items && Array.isArray(items)) {
                                    requestAnimationFrame(() => {
                                        setListItemDatas(items);
                                        setLIStartIndex(startIndex);
                                        setListbaseOptions((prevOptions: ListBaseOptions) => ({
                                            ...prevOptions,
                                            topLiItemsHeight: startIndex * liHeight,
                                            bottomLiItemsHeight: Math.max(0, (totalItemsCount - endIndex) * liHeight),
                                            listItemSize: liHeight
                                        }));
                                    });
                                }
                            });
                    } catch (error) {
                        onActionFailure?.(error as object);
                    }
                };

            const handleScroll: (e: React.UIEvent<HTMLDivElement>) => void = useCallback((e: React.UIEvent<HTMLDivElement>) => {
                onListScroll(e);
                if (virtualization !== undefined) {
                    const scrollTop: number = e.currentTarget.scrollTop;
                    const liHeight: number = virtualization.itemSize || 40;
                    if (!(dataSource instanceof DataManager)) {
                        const { visibleData, topHeight, bottomHeight, startIndex } = calculateVirtualization(scrollTop);
                        let updatedVisibleData: DataSource[] = visibleData;
                        if (activeItemsId && activeItemsId.length > 0) {
                            updatedVisibleData =
                                visibleData.map((item: DataSource) => {
                                    return {
                                        ...item,
                                        [checkBox ?
                                            fields.isChecked as string || 'isChecked' :
                                            fields.isSelected as string || 'isSelected'
                                        ]: activeItemsId.includes(item[fields.id as string]?.toString())
                                    };
                                });
                        }
                        setListItemDatas(updatedVisibleData);
                        setLIStartIndex(startIndex);
                        setListbaseOptions((prevOptions: ListBaseOptions) => ({
                            ...prevOptions,
                            topLiItemsHeight: topHeight,
                            bottomLiItemsHeight: bottomHeight,
                            listItemSize: virtualization.itemSize
                        }));
                    }
                    else {
                        if (scrollTimeoutRef.current) {
                            clearTimeout(scrollTimeoutRef.current);
                        }
                        const headerHeight: number = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
                        const itemsCount: number = virtualization.itemsCount || 15;
                        const overscan: number = virtualization.overscanCount || 5;
                        scrollTimeoutRef.current = window.setTimeout(() => {
                            const adjustedScrollTop: number = Math.max(0, scrollTop - headerHeight);
                            const startIndex: number = Math.floor(adjustedScrollTop / liHeight);
                            const endIndex: number = Math.min(startIndex + itemsCount + overscan, totalItemsCount);
                            const currentStart: number = requestedRange.current?.start || 0;
                            if (Math.abs(startIndex - currentStart) > Math.floor(overscan / 2)) {
                                requestedRange.current = { start: startIndex, end: endIndex };
                                const query: Query = new Query().skip(startIndex).take(endIndex - startIndex);
                                fetchData(query, startIndex, endIndex);
                            }
                            scrollTimeoutRef.current = null;
                        }, 30);
                    }
                }
            }, [dataSource, virtualization, headerRef, activeItemsId, totalItemsCount]);

            const calculateVirtualization: (scrollTop: number) => {
                visibleData: { [key: string]: object }[];
                topHeight: number;
                bottomHeight: number;
                startIndex: number;
            } = (scrollTop: number): {
                visibleData: { [key: string]: object }[];
                topHeight: number;
                bottomHeight: number;
                startIndex: number;
            } => {
                const totalHeight: number = (dataSource as { [key: string]: object }[]).length * (virtualization?.itemSize || 40);
                const headerHeight: number = headerRef.current ? headerRef.current.getBoundingClientRect().height : 0;
                const adjustedScrollTop: number = Math.max(0, scrollTop - headerHeight);
                const startIndex: number = Math.max(
                    0,
                    Math.floor(adjustedScrollTop / (virtualization?.itemSize || 40)) - (virtualization?.overscanCount || 5)
                );
                const endIndex: number = Math.min(
                    startIndex + (virtualization?.itemsCount || 15) + (2 * (virtualization?.overscanCount || 5)),
                    (dataSource as { [key: string]: object }[]).length
                );
                const topHeight: number = startIndex * (virtualization?.itemSize || 40);
                const visibleHeight: number = (endIndex - startIndex) * (virtualization?.itemSize || 40);
                const bottomHeight: number = Math.max(0, totalHeight - (topHeight + visibleHeight));
                const visibleData: { [key: string]: object }[] = (dataSource as { [key: string]: object }[]).slice(startIndex, endIndex);
                return { visibleData, topHeight, bottomHeight, startIndex };
            };

            const onListScroll: (e: React.UIEvent<HTMLDivElement>) => void =
                useCallback((e: React.UIEvent<HTMLDivElement>): void => {
                    const element: EventTarget & HTMLDivElement = e.currentTarget;
                    const args: ScrolledEvent = {
                        originalEvent: e,
                        scrollDirection: Direction.Bottom,
                        distanceY: element.scrollHeight - element.scrollTop
                    };
                    args.scrollDirection = Direction.Bottom;
                    args.distanceY = element.scrollHeight - element.clientHeight - element.scrollTop;
                    onScroll?.(args as ScrolledEvent);
                }, [onScroll]);

            const handleItemClick: (e: React.MouseEvent<HTMLLIElement>, index: number)
            => void = useCallback((e: React.MouseEvent<HTMLLIElement>, index: number) => {
                const li: HTMLLIElement = e.currentTarget as HTMLLIElement;
                if (!disabled && checkBox && isValidLI(li)) {
                    if (li.classList.contains(CLS_HAS_CHILD)) {
                        handleSelection(li, e, index);
                    } else {
                        setCheckboxLI(li, e, index);
                    }
                } else {
                    handleSelection(li, e, index);
                }
            }, [listItemDatas]);

            const handleItemKeyDown: (e: React.KeyboardEvent<HTMLLIElement>, index: number)
            => void = useCallback((e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
                keyActionHandler(e, index);
            }, [focusedItemIndex, selectedItemIndex, listItemDatas]);

            const getQuery: () => Query = (): Query => {
                const columns: string[] = [];
                const queryLV: Query = query ? query : new Query();
                if (!query) {
                    for (const column of Object.keys((fields as FieldsMapping & { properties: object }).properties)) {
                        if (column !== 'tableName' && !!((fields as DataSource)[`${column}`]) &&
                            (fields as DataSource)[`${column}`] !==
                            (defaultMappedFields as DataSource)[`${column}`]
                            && columns.indexOf((fields as { [key: string]: string })[`${column}`]) === -1) {

                            columns.push((fields as { [key: string]: string })[`${column}`]);

                        }
                    }
                    queryLV.select(columns);
                    if (Object.prototype.hasOwnProperty.call((fields as FieldsMapping & { properties: object }).properties, 'tableName')) {
                        queryLV.from((fields as FieldsMapping).tableName as string);
                    }
                }
                return queryLV;
            };

            const renderRemoteLists: (e: Object) => void = (e: Object): void => {
                const remoteData: DataSource[] = (e as { [key: string]: object }).result as DataSource[];
                setListItemDatas(remoteData);
                onActionComplete?.();
            };

            const triggerActionFailure: (e: Object) => void = (e: Object): void => {
                onActionFailure?.(e as object);
            };

            const uncheckAllItems: () => void = (): void => {
                if (checkBox) {
                    const updatedDataSource: DataSource[] =
                        listItemDatas.map((item: DataSource) => {
                            return {
                                ...item,
                                [fields.isChecked as string || 'isChecked']: false
                            };
                        });
                    setListItemDatas(updatedDataSource);
                }
            };

            const handleSelection: (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent, index: number) => void
                = (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent, index: number): void => {
                    if (isValidLI(li) && !li.classList.contains(CLS_SELECTED) && !disabled) {
                        const itemId: string | null = li.getAttribute('data-uid');
                        processSelection(li, e, itemId, index);
                    }
                };

            const processSelection: (
                li: HTMLLIElement,
                e: React.MouseEvent | React.KeyboardEvent,
                itemId: string | null, index: number
            ) => void = (
                li: HTMLLIElement,
                e: React.MouseEvent | React.KeyboardEvent,
                itemId: string | null,
                index: number
            ): void => {
                const selectedItemData: DataSource = getItemData(li);
                const eventArgs: object = createClickEventArgs({ 'isSelected': true }, e, selectedItemData);
                onSelect?.(eventArgs as ClickEvent);
                if (li.classList.contains(CLS_HAS_CHILD)) {
                    setFocusedItemIndex(-1);
                    renderSubList(li, selectedItemData);
                }
                else {
                    setSelectedItemIndex(index);
                    setListItemDatas(updateDataSource(itemId as string));
                }
            };

            const updateDataSource: (listItemId: string) => DataSource[]
                = (listItemId: string): DataSource[] => {
                    const listviewDatas: DataSource[] = listItemDatas;
                    const selectedFieldName: string = fields.isSelected as string || 'isSelected';
                    const updatedDataSource: DataSource[] =
                        listviewDatas.map((item: DataSource) => {
                            if (item.isHeader === true) {
                                return item;
                            }
                            if ((item[fields.id as string]).toString() === listItemId) {
                                setActiveItemsId([listItemId.toString()]);
                                return {
                                    ...item,
                                    [selectedFieldName]: true
                                };
                            } else {
                                return {
                                    ...item,
                                    [selectedFieldName]: false
                                };
                            }
                        });
                    return updatedDataSource;
                };

            const back: () => void = (): void => {
                curDSLevel.pop();
                setCurDSLevel(curDSLevel);
                getSubDS(curDSLevel);
            };

            const getSubDS: (curDSLevel: string[]) => DataSource[] = (curDSLevel: string[]): DataSource[] => {
                const levelKeys: string[] = curDSLevel;
                let curDSJSON: DataSource;
                let fieldData: DataSource = {};
                if (levelKeys.length) {
                    let ds: DataSource[] = dataSource as DataSource[];
                    for (const key of levelKeys) {
                        const field: DataSource = {};
                        field[(fields as FieldsMapping).id as string] = key as FieldsMapping;
                        curDSJSON = findItemFromDS(ds, field) as DataSource[] & DataSource;
                        fieldData =
                            getFieldValues(
                                curDSJSON as { [key: string]: Object },
                                fields as FieldsMapping) as DataSource;
                        ds = fieldData[(fields as FieldsMapping).child as string] as DataSource[] & DataSource;
                    }
                    const textValue: string = fieldData[(fields as FieldsMapping).text as string] as string;
                    setListItemDatas(ds);
                    setListHeader(textValue);
                    return ds;
                }
                setListItemDatas(dataSource as DataSource[]);
                const headerContent: React.ReactNode = typeof header === 'function' ? header({}) : header;
                setListHeader(headerContent);
                return dataSource as DataSource[];
            };

            const getElementUID: (obj: DataSource | HTMLElement) => DataSource =
                (obj: DataSource | HTMLElement): DataSource => {
                    let listFields: DataSource = {};
                    if (obj instanceof HTMLElement) {
                        listFields[(fields as FieldsMapping).id as string] = obj.getAttribute('data-uid') as FieldsMapping;
                    } else {
                        listFields = obj as DataSource;
                    }
                    return listFields;
                };

            const getItemData: (li?: HTMLLIElement | DataSource) => DataSource =
                (li?: HTMLLIElement | DataSource): DataSource => {
                    const listFields: DataSource = getElementUID(li as HTMLLIElement);
                    return findItemFromDS(listItemDatas, listFields as DataSource) as DataSource;
                };

            const createClickEventArgs: (
                selected: { [key: string]: boolean },
                e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent,
                selectedData: DataSource
            ) => Object = (
                selected: { [key: string]: boolean },
                e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent,
                selectedData: DataSource): Object => {
                const eventArgs: object = {};
                merge(eventArgs, { data: selectedData });
                merge(eventArgs, selected);
                merge(
                    eventArgs,
                    {
                        event: e,
                        name: 'onSelect'
                    }
                );
                return eventArgs;
            };

            const renderSubList: (li: Element, selectedListItemData?: DataSource)
            => void = (li: Element, selectedListItemData?: DataSource): void => {
                const uID: string | null = li.getAttribute('data-uid');
                if (li.classList.contains(CLS_HAS_CHILD) && uID) {
                    curDSLevel.push(uID);
                    setCurDSLevel(curDSLevel);
                    const field: DataSource = {};
                    field[(fields as FieldsMapping).id as string] = uID as FieldsMapping;
                    const subListItems: DataSource = findItemFromDS(dataSource as DataSource[], field) as DataSource[] & DataSource;
                    const fieldData: DataSource = getFieldValues(
                        subListItems as { [key: string]: Object },
                        listbaseOptions.fields as FieldsMapping) as DataSource;
                    const ds: DataSource[] = fieldData[(fields as FieldsMapping).child as string] as DataSource[];
                    setListItemDatas(ds);
                    if ((selectedListItemData || curDSLevel) && header) {
                        if (typeof header === 'string') {
                            const newHeaderContent: string = String(fieldData[(fields as FieldsMapping).text as string]);
                            setListHeader(newHeaderContent);
                        }
                        else {
                            const headerContent: React.ReactElement = typeof header === 'function' ? header({}) : header;
                            setListHeader(headerContent);
                        }
                    }
                }
            };

            const findItemFromDS: (
                dataSource: DataSource[],
                listFields: DataSource,
                parent?: boolean
            ) => DataSource[] | DataSource | undefined = (
                dataSource: DataSource[],
                listFields: DataSource,
                parent: boolean = false
            ): DataSource[] | DataSource | undefined => {
                for (const data of dataSource) {
                    const fieldData: DataSource = getFieldValues(data, listbaseOptions.fields as FieldsMapping) as DataSource;
                    if ((listFields[(fields as FieldsMapping).id as string]) &&
                            (!listFields[(fields as FieldsMapping).id as string] || (!isNullOrUndefined(fieldData[fields.id as string]) &&
                                fieldData[fields.id as string].toString()) ===
                                listFields[(fields as FieldsMapping).id as string].toString()) &&
                            (!listFields[(fields as FieldsMapping).text as string] ||
                                fieldData[fields.text as string] === listFields[(fields as FieldsMapping).text as string])) {
                        return parent ? dataSource : data;
                    }
                    else if (Object.prototype.hasOwnProperty.call(fieldData as object, (fields as FieldsMapping).child as string) &&
                            (fieldData[fields.child as string] as object[]).length) {
                        const childResult: DataSource | DataSource[] | undefined = findItemFromDS(
                            fieldData[fields.child as string] as DataSource[],
                            listFields,
                            parent
                        );
                        if (childResult) {
                            return childResult;
                        }
                    }
                }
                return undefined;
            };

            const isValidLI: (li: Element) => boolean = (li: Element): boolean => {
                return (
                    li &&
                    li.classList.contains(CLS_LISTITEM) &&
                    !li.classList.contains(CLS_GROUP_LISTITEM) &&
                    !li.classList.contains(CLS_DISABLE)
                );
            };

            const setCheckboxLI: (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, index: number) => void
                = (li: HTMLLIElement, e: React.MouseEvent | React.KeyboardEvent | React.FocusEvent, index: number): void => {
                    const itemId: string = li.getAttribute('data-uid') as string;
                    const checkedItemData: DataSource = getItemData(li);
                    const isActive: boolean = !li.classList.contains('sf-active');
                    const eventArgs: object = createClickEventArgs({ 'isChecked': isActive }, e, checkedItemData);
                    onSelect?.(eventArgs as ClickEvent);
                    updateCheckboxState(itemId);
                    setFocusedItemIndex(index);
                };

            const updateCheckboxState: (listItemId: string) => void = (listItemId: string) => {
                const checkedFieldName: string = fields.isChecked as string || 'isChecked';
                const listviewDatas: DataSource[] = listItemDatas;
                const updatedDataSource: DataSource[] =
                    listviewDatas.map((item: DataSource) => {
                        if ((item[fields.id as string]).toString() === listItemId) {
                            const currentCheckedValue: boolean | string = item[`${checkedFieldName}`] as boolean | string;
                            const isCurrentlyChecked: boolean =
                                currentCheckedValue === true ||
                                currentCheckedValue === 'true';
                            if (isCurrentlyChecked) {
                                setActiveItemsId((prev: string[]) => prev.filter((item: string) =>
                                    item.toString() !== listItemId.toString()));
                                return {
                                    ...item,
                                    [checkedFieldName]: false
                                };
                            } else {
                                setActiveItemsId((prev: string[]) => [...prev, listItemId.toString()]);
                                return {
                                    ...item,
                                    [checkedFieldName]: true
                                };
                            }
                        }
                        return item;
                    });
                setListItemDatas(updatedDataSource);
            };

            const keyActionHandler: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void =
                (e: React.KeyboardEvent<HTMLLIElement>, index: number): void => {
                    e.preventDefault();
                    switch (e.key) {
                    case 'Home':
                        homeKeyHandler(e, false);
                        break;
                    case 'End':
                        homeKeyHandler(e, true);
                        break;
                    case 'ArrowDown':
                        arrowKeyHandler(e, false);
                        break;
                    case 'ArrowUp':
                        arrowKeyHandler(e, true);
                        break;
                    case 'Enter':
                        enterKeyHandler(e);
                        break;
                    case 'Backspace':
                        if (checkBox && curDSLevel[curDSLevel.length - 1]) {
                            uncheckAllItems();
                        }
                        back();
                        break;
                    case ' ':
                        if (!isNullOrUndefined(e.target) && (e.target as HTMLElement).classList.contains('sf-focused')) {
                            spaceKeyHandler(e, index);
                        }
                        break;
                    }
                };

            const findValidIndex: (startIndex: number, direction: number, allValidListItems: HTMLLIElement[], key: string) => number
                = (startIndex: number, direction: number, allValidListItems: HTMLLIElement[], key: string): number => {
                    let index: number = key === 'arrowKey' ? startIndex + direction : startIndex;
                    while (index >= 0 && index < allValidListItems.length) {
                        if (!allValidListItems[`${index}`].classList.contains('sf-list-group-item')) {
                            return index;
                        }
                        index += direction;
                    }
                    return -1;
                };

            const homeKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, end: boolean) => void =
                (e: React.KeyboardEvent<HTMLLIElement>, end: boolean): void => {
                    if (Object.keys(listItemDatas).length && contentRef.current) {
                        const allItems: HTMLLIElement[] = Array.from(contentRef.current?.querySelectorAll('li'))
                            .filter((item: HTMLLIElement) => item instanceof HTMLLIElement && item.classList.contains('sf-list-item'));
                        const newIndex: number = end ? allItems.length - 1 : findValidIndex(0, 1, allItems, 'homeKey');
                        if (newIndex !== -1) {
                            const li: HTMLLIElement = allItems[`${newIndex}`];
                            if (li.classList.contains('sf-has-child') || checkBox) {
                                setFocusedItemIndex(newIndex);
                                setSelectedItemIndex(-1);
                            } else {
                                handleSelection(li, e, newIndex);
                            }
                            li.focus();
                        }
                    }
                };

            const arrowKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, prev: boolean) =>
            void = (e: React.KeyboardEvent<HTMLLIElement>, prev: boolean):
            void => {
                if (Object.keys(listItemDatas).length && contentRef.current) {
                    const allItems: HTMLLIElement[] = Array.from(contentRef.current?.querySelectorAll('li'))
                        .filter((item: Element): item is HTMLLIElement => item instanceof HTMLLIElement);
                    const currentIndex: number = focusedItemIndex !== -1 ?
                        focusedItemIndex :
                        selectedItemIndex !== -1 ? selectedItemIndex : -1;
                    let newIndex: number;
                    if (currentIndex !== -1) {
                        newIndex = findValidIndex(currentIndex, prev ? -1 : 1, allItems, 'arrowKey');
                    } else {
                        newIndex = findValidIndex(prev ? allItems.length : -1, prev ? -1 : 1, allItems, 'arrowKey');
                    }
                    if (newIndex !== -1) {
                        const li: HTMLLIElement = allItems[`${newIndex}`];
                        if (li.classList.contains('sf-has-child') || checkBox) {
                            setFocusedItemIndex(newIndex);
                            setSelectedItemIndex(-1);
                        } else {
                            handleSelection(li, e, newIndex);
                        }
                        li.focus();
                    }
                }
            };

            const enterKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>) => void =
                (e: React.KeyboardEvent<HTMLLIElement>): void => {
                    if (Object.keys(listItemDatas).length && contentRef.current) {
                        const li: HTMLLIElement = e.currentTarget as HTMLLIElement;
                        if (li && li.classList.contains('sf-has-child')) {
                            setFocusedItemIndex(-1);
                            renderSubList(li);
                        }
                    }
                };

            const spaceKeyHandler: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void =
                (e: React.KeyboardEvent<HTMLLIElement>, index: number): void => {
                    if (!disabled && checkBox && Object.keys(listItemDatas).length
                        && contentRef.current) {
                        if (checkBox) {
                            const li: HTMLLIElement = e.target as HTMLLIElement;
                            setCheckboxLI(li, e, index);
                            li.focus();
                        }
                    }
                };


            const listItems: React.ReactElement[] = useMemo(() => {
                return listItemDatas?.map((item: { [key: string]: Object } | string | number, index: number) => {
                    const actualIndex: number = liStartIndex + index;
                    return (
                        <ListItem
                            key={actualIndex}
                            item={item}
                            fields={listbaseOptions.fields as FieldsMapping}
                            index={actualIndex as number}
                            onClick={handleItemClick}
                            onKeyDown={handleItemKeyDown}
                            focused={focusedItemIndex}
                            options={listbaseOptions}
                        />
                    );
                });
            }, [
                listItemDatas,
                selectedItemIndex,
                focusedItemIndex,
                listbaseOptions,
                liStartIndex
            ]);


            const listContainer: React.ReactElement | null  = useMemo(() => {
                if (listItemDatas && listItemDatas.length > 0) {
                    return generateUL(listItems, listbaseOptions, contentRef);
                }
                return null;
            }, [listItems, listbaseOptions, contentRef]);

            return (
                <div
                    id={props.id}
                    className={[
                        'sf-control sf-lib sf-listview',
                        className,
                        virtualization !== undefined ? 'sf-virtualization' : '',
                        dir === 'rtl' ? 'sf-rtl' : '',
                        disabled ? 'sf-disabled' : '',
                        header != null ? 'sf-has-header' : ''
                    ].filter(Boolean).join(' ').trim()}
                    ref={listviewRef}
                    onScroll={handleScroll}
                    {...additionalAttrs}
                >
                    {headerContent}
                    {listContainer}
                </div>
            );
        });

export default ListView;
