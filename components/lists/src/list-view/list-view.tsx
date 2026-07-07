import { forwardRef, useRef, useImperativeHandle, useLayoutEffect, HTMLAttributes, useMemo, ReactNode, ForwardRefExoticComponent, RefAttributes, Ref, RefObject } from 'react';
import { defaultMappedFields, ListItems } from '../common/listItems';
import { FieldsMapping, SortOrder, DataSource, VirtualizationProps } from '../common/types';
import { DataManager, Query } from '@syncfusion/react-data';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { useData } from '../common/useData';

const LISTVIEW_BASE_CLASS: string = 'sf-control sf-lib sf-listview sf-display-flex';
const DISABLED_CLASS: string = 'sf-disabled';
const FOOTER_CLASS: string = 'sf-list-footer';
const RTL_CLASS: string = 'sf-rtl';
const HEADER_CLASS: string = 'sf-list-header';

/**
 * @private
 */
export type T = number | string | object | { [key: string]: unknown; };

/**
 * Specifies the event arguments for a data request triggered during data loading.
 */
export interface DataRequestEvent {
    /**
     * Specifies the dataSource, which can be an array of objects, DataManager, or primitive arrays.
     */
    data: DataManager | T[];

    /**
     * Specifies the query to retrieve data from the data source.
     */
    query: Query;
}

/**
 * Specifies the event arguments triggered after successful data fetch.
 */
export interface DataLoadEvent {
    /**
     * Specifies the dataSource, which can be an array of objects or primitive arrays.
     */
    data: T[];
}

/**
 * An interface that holds scrolled event arguments.
 */
export interface ScrollEvent {
    /**
     * Specifies the default scroll event arguments.
     */
    originalEvent: Event;
    /**
     * Species the current start index
     *
     */
    startIndex: number;
    /**
     * Species the current count of items
     *
     */
    count: number;
}

export interface ListViewProps {
    /*
    * Specifies the data source for the list items.
    * Can be an array of datasource objects or a DataManager instance.
    * When primitives are provided, they are automatically mapped to 'text' and 'id'.
    * For grouped rendering, consider pre-transforming the data with groupBy field.
    *
    * @default []
    */
    dataSource?: DataSource[] | DataManager

    /**
     * The `query` property is used to fetch the specific data from dataSource by using where and select keywords.
     *
     * @default -
     */
    query?: Query;

    /**
     * Specifies the sort order for items and for group headers when `fields.groupBy` is set.
     * When enabled, sorting uses `fields.sortBy` if defined; otherwise falls back to `fields.text`.
     * SortOrder.None preserves the original sequence of the dataSource.
     *
     * @default SortOrder.None
     */
    sortOrder?: SortOrder;

    /**
     * Maps properties from each record in `dataSource` to the internal ListView field names.
     * Only provide mappings that differ from defaults; values are shallow-merged with `defaultMappedFields`.
     *
     * @default { id: 'id', text: 'text', url: 'url', disabled: 'disabled', icon: 'icon', visible: 'visible', tooltip: 'tooltip', htmlAttributes: 'htmlAttributes', imageUrl: 'imageUrl', groupBy: undefined }
     */
    fields?: FieldsMapping;

    /**
     * Specifies content to be rendered at the top of the list, serving as a header.
     *
     * @default -
     */
    headerTemplate?: ReactNode;

    /**
     * Specifies a custom template for rendering each item in the ListView, allowing for customized appearance of list items.
     *
     * @default -
     */
    itemTemplate?: Function | ReactNode;

    /**
     * Specifies a custom template for rendering group header sections when items are categorized into groups.
     *
     */
    groupTemplate?: Function | ReactNode;

    /**
     * Specifies content to be rendered at the bottom of the list, serving as a footer.
     *
     * @default -
     */
    footerTemplate?: ReactNode;

    /**
     * Specifies whether user interactions with the ListView (e.g., clicks, key presses) are disabled.
     * When `true`, click and key handlers will early-return without performing any action.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies virtualization settings to enable windowed rendering for improved performance with large lists.
     *
     * @default -
     */
    virtualization?: VirtualizationProps;

    /**
     * Specifies a scroll event handler to be attached to the scrollable container.
     * This is particularly useful when virtualization is enabled.
     *
     * @event onScroll
     */
    onScroll?: (event: ScrollEvent) => void;

    /**
     * Specifies an event that triggers before data is fetched.
     *
     * @event onDataRequest
     */
    onDataRequest?: (event: DataRequestEvent) => void;

    /**
     * Specifies an event that triggers after data is fetched successfully.
     *
     * @event onDataLoad
     */
    onDataLoad?: (event: DataLoadEvent) => void;
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

type IListViewProps = ListViewProps & Omit<HTMLAttributes<HTMLDivElement>, keyof ListViewProps>;

/**
 * The React ListView component renders a data-driven list with support for templates, grouping, sorting, and virtualization.
 * - Accepts array or DataManager datasource with customizable field mappings and provides header/footer/item/group templates and events (data load, data request, scroll).
 * - Optimized for large data via virtualization and exposes props for sorting, disabling, and query-based fetching.
 *
 * ```typescript
 * import { ListView } from '@syncfusion/react-lists';
 * export default function App() {
 *  const data = [{ id: '1', text: 'Artwork' }, { id: '2', text: 'Abstract' }, { id: '3', text: 'Modern Painting' }];
 *  <ListView dataSource={data} fields={{ id: 'id', text: 'text' }} />;
 * }
 * ```
 */
export const ListView: ForwardRefExoticComponent<IListViewProps & RefAttributes<IListView>> =
    forwardRef<IListView, IListViewProps>((props: IListViewProps, ref: Ref<IListView>) => {

        const { dir } = useProviderContext();
        const {
            id,
            dataSource,
            fields = defaultMappedFields,
            sortOrder = SortOrder.None,
            disabled = false,
            query,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            virtualization,
            className,
            onDataRequest,
            onDataLoad,
            onScroll,
            ...additionalAttrs
        } = props;

        const listviewRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);

        const fieldOptions: FieldsMapping = useMemo<FieldsMapping>(() => ({ ...defaultMappedFields, ...fields }), [fields]);

        const publicAPI: Partial<IListView> = useMemo<Partial<IListView>>(() => ({
            dataSource,
            fields,
            sortOrder,
            disabled,
            query,
            itemTemplate,
            headerTemplate,
            footerTemplate,
            groupTemplate,
            virtualization
        }), [dataSource, fields, sortOrder, disabled, query, itemTemplate, headerTemplate, footerTemplate,
            groupTemplate, virtualization]);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IListView,
            element: listviewRef.current
        }), [publicAPI]);

        useLayoutEffect(() => {
            preRender('listview');
        }, []);

        const {
            items,
            virtualizationOptions,
            onScrollRequest
        } = useData({
            dataSource,
            fieldOptions,
            sortOrder,
            query,
            virtualization,
            onDataRequest,
            onDataLoad,
            onScroll
        });

        const containerClassName: string = useMemo((): string => ([
            LISTVIEW_BASE_CLASS,
            className,
            dir === 'rtl' ? RTL_CLASS : '',
            disabled ? DISABLED_CLASS : ''
        ].filter(Boolean).join(' ').trim()), [className, dir, disabled]);

        return (
            <div
                id={id}
                className={containerClassName}
                ref={listviewRef}
                {...additionalAttrs}
            >
                {headerTemplate != null && (
                    <div className={HEADER_CLASS}>
                        {headerTemplate}
                    </div>
                )}
                <ListItems
                    items={items}
                    fields={fieldOptions}
                    itemTemplate={itemTemplate}
                    groupTemplate={groupTemplate}
                    virtualization={virtualizationOptions}
                    onScrollRequest={onScrollRequest}
                />
                {footerTemplate != null && (
                    <div className={FOOTER_CLASS}>
                        {footerTemplate}
                    </div>
                )}
            </div>
        );
    });

export default ListView;
