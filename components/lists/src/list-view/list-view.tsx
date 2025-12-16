import * as React from 'react';
import { forwardRef, useRef, useImperativeHandle, useLayoutEffect, useState, useEffect, HTMLAttributes, useCallback, useMemo } from 'react';
import { DataManager, Query } from '@syncfusion/react-data';
import { defaultMappedFields, ListItems } from '../common/listItems';
import { getData, getFieldValues, groupDataSource, addSorting } from '../common/utils';
import { isNullOrUndefined, preRender, useProviderContext } from '@syncfusion/react-base';
import { ArrowLeftIcon } from '@syncfusion/react-icons';
import {FieldsMapping, SortOrder, CheckBoxPosition, DataSource, VirtualizationProps} from '../common/types';
import { SelectEvent } from '../common';

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
    event: React.MouseEvent | React.KeyboardEvent;

    /**
     * Specifies name of the event.
     */
    name?: string;
}

const CLS_HAS_CHILD: string = 'sf-has-child';

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

            const listviewRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
            const contentRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
            const headerRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

            const { dir } = useProviderContext();

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
                    if (virtualization === undefined && (listItemDatas as DataSource[]).length === 0) {
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
                        dataToRender = getData(dataToRender, query);
                    }
                    setListItemDatas(dataToRender);
                    onActionComplete?.();
                }
            }, [dataSource, fields, sortOrder]);

            const keyActionHandler: (e: React.KeyboardEvent<HTMLLIElement>) => void =
                (e: React.KeyboardEvent<HTMLLIElement>): void => {
                    e.preventDefault();
                    switch (e.key) {
                    case 'Enter':
                        if (Object.keys(listItemDatas).length && contentRef.current) {
                            const li: HTMLLIElement = e.currentTarget as HTMLLIElement;
                            if (li && li.classList.contains('sf-has-child')) {
                                renderSubList(li);
                            }
                        }
                        break;
                    }
                };

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
                                <div className="sf-list-back-icon" onClick={back}>
                                    <ArrowLeftIcon className="sf-font-size-lg"></ArrowLeftIcon>
                                </div>
                            )}
                            <div className="sf-list-header-content">
                                {header}
                            </div>
                        </div>
                    );
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

            const handleScroll: (e: React.UIEvent<HTMLDivElement>) => void = useCallback((e: React.UIEvent<HTMLDivElement>) => {
                onListScroll(e);
            }, [onListScroll]);

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

            const handleSelectionChange: (event: SelectEvent) => void = useCallback((event: SelectEvent) => {
                const itemData: DataSource = event.data as DataSource;
                const fieldData: DataSource = getFieldValues(itemData, fields as FieldsMapping) as DataSource;
                if (checkBox || !fieldData[fields.selected as string]){
                    onSelect?.({ data: itemData, event: event.event, name: 'onSelect'});
                }
                if (event.selected) {
                    const hasChildren: DataSource[] = fieldData[fields.child as string] as DataSource[];
                    if (hasChildren && Array.isArray(hasChildren) && hasChildren.length > 0) {
                        renderSubList(event.event.currentTarget as Element, itemData);
                    }
                }
            }, [fields, onSelect]);

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
                        fields as FieldsMapping) as DataSource;
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
                    const fieldData: DataSource = getFieldValues(data, fields as FieldsMapping) as DataSource;
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

            const listContainer: React.ReactElement | null  = useMemo(() => {
                if (listItemDatas && listItemDatas.length > 0 || (virtualization !== undefined && dataSource instanceof DataManager)) {
                    return (
                        <ListItems
                            ref={contentRef}
                            items={listItemDatas}
                            fields={fields}
                            dataSource={dataSource}
                            baseQuery={query}
                            headerRef={headerRef}
                            onActionBegin={onActionBegin}
                            onActionComplete={onActionComplete}
                            onActionFailure={onActionFailure}
                            scrollParent={listviewRef as React.RefObject<HTMLElement>}
                            onSelect={handleSelectionChange}
                            onItemKeyDown={keyActionHandler}
                            setListItemDatas={setListItemDatas}
                            disabled={disabled}
                            curDSLevel={curDSLevel}
                            itemTemplate={itemTemplate}
                            groupTemplate={groupTemplate}
                            checkBoxPosition={checkBoxPosition}
                            virtualization={virtualization}
                            ariaAttributes={{
                                itemRole: 'listitem', listRole: 'list', itemText: '',
                                groupItemRole: 'presentation', wrapperRole: 'presentation'
                            }}
                            checkBox={checkBox}
                        />
                    );
                }
                return null;
            }, [listItemDatas, contentRef, dataSource, query, handleSelectionChange, disabled,
                checkBox, curDSLevel]);

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
