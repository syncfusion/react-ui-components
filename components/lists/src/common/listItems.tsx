import { ForwardedRef, forwardRef, HTMLAttributes, JSX, memo, NamedExoticComponent, ReactNode, RefAttributes, RefObject, UIEventHandler, useCallback, useImperativeHandle, useMemo, useRef, type UIEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { DataSource, FieldsMapping, VirtualizationProps } from './types';
import { ListItem } from './listItem';
import { SelectEvent, useListItemSelection, UseListItemSelectionResult } from './useListItemSelection';
import { isNullOrUndefined } from '@syncfusion/react-base';
import VirtualScroller from './virtualScroller';
import { ScrollEvent } from '../list-view';

const UL_CLASS: string = 'sf-list-parent sf-ul';

export interface GetItemPropsOptions {
    item: { [key: string]: Object } | string | number;
    index: number;
}

/**
 * Interface for ListItems common props.
 *
 */
export interface ListItemBaseProps {
    /** ARIA roles/text for list and items; listRole is applied to the <ul>. */
    ariaAttributes?: ListAriaAttributes;
    /** Custom item content template (function or ReactNode). */
    itemTemplate?: Function | ReactNode;
    /** Custom group header template (function or ReactNode). */
    groupTemplate?: Function | ReactNode;
    /** Custom container class; also disables spacer path when set. */
    parentClass?: string;
    /** Fields mapping for ListItem; falls back to options.fields when omitted. */
    fields?: FieldsMapping;
    /*** Optional callback to provide additional/overridden HTML attributes for each rendered item. */
    getItemProps?: (args: GetItemPropsOptions) =>
    HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement> | undefined;
    /** KeyDown handler for each ListItem (overrides options.itemKeyDown when provided). */
    onItemKeyDown?: (e: KeyboardEvent<HTMLElement>, index: number) => void;
}

/**
 * Interface representing ARIA attribute in list item.
 *
 * @private
 */
export interface ListAriaAttributes {
    level?: number;
    listRole?: string;
    listLabel?: string;
    itemRole?: string;
    groupItemRole?: string;
}

/**
 * Default ARIA attributes.
 */
const defaultAriaAttributes: ListAriaAttributes = {
    level: 1,
    listRole: 'list',
    listLabel: 'list',
    itemRole: 'listitem',
    groupItemRole: 'group'
};

/**
 * Default field mapping configuration.
 */
export const defaultMappedFields: FieldsMapping = {
    id: 'id',
    text: 'text',
    url: 'url',
    disabled: 'disabled',
    icon: 'icon',
    visible: 'visible',
    tooltip: 'tooltip',
    htmlAttributes: 'htmlAttributes',
    imageUrl: 'imageUrl',
    groupBy: undefined
};

/**
 * Props for the ListItems component.
 */
export interface ListItemsProps extends ListItemBaseProps {
    /** Items to render (objects or primitives). */
    items?: DataSource[];
    /** Selection event handler triggered when item is selected/checked. */
    onSelect?: (event: SelectEvent, isAlreadySelected: boolean) => void;
    /** Whether the list is disabled. */
    disabled?: boolean;
    /**Ref to the scrollable parent element for virtualization calculations. */
    scrollParent?: RefObject<HTMLElement>
    /** Virtualization settings; when set and no parentClass, renders via VirtualizedList. */
    virtualization?: VirtualizationProps;
    /** Disable the built-in keyboard navigation and click actions. */
    disableDefaultInteractions?: boolean;
    /** Called when the scroll reaches the end of the current virtual window. The consumer should append the next set starting at `startIndex` with `count` items. */
    onScrollRequest?: (args: ScrollEvent) => void | Promise<void>;
}

/**
 * ListItems — presentational list renderer.
 */
export const ListItems: NamedExoticComponent<ListItemsProps & RefAttributes<HTMLDivElement>> =
    memo(forwardRef<HTMLDivElement, ListItemsProps>(({
        items,
        fields = defaultMappedFields,
        scrollParent,
        virtualization,
        parentClass,
        itemTemplate,
        groupTemplate,
        ariaAttributes, getItemProps,
        onItemKeyDown, onSelect, onScrollRequest,
        disableDefaultInteractions = false, disabled = false}:
    ListItemsProps, ref: ForwardedRef<HTMLDivElement>) => {
        const curAttributes: ListAriaAttributes = { ...defaultAriaAttributes, ...ariaAttributes };
        ariaAttributes = curAttributes;
        const contentRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
        const ULRef: RefObject<HTMLDivElement | HTMLUListElement | null> = useRef<HTMLDivElement>(null);

        useImperativeHandle(ref, () => contentRef.current as HTMLDivElement, []);

        const selectionHook: UseListItemSelectionResult = useListItemSelection({
            fields: fields,
            listItemDatas: items || [],
            onSelect,
            scrollParent: (scrollParent?.current ? scrollParent : (ULRef as RefObject<HTMLElement>))
        });

        const idField: string = fields?.id ?? 'id';
        const focusedIndexNumber: number = useMemo(() => {
            if (!selectionHook.focusedItem || !items) { return -1; }
            const focussedId: string = String(selectionHook.focusedItem?.[String(idField)]);
            if (isNullOrUndefined(focussedId)) { return -1; }
            return items.findIndex((item: DataSource) => String(item?.[String(idField)]) === String(focussedId));
        }, [selectionHook.focusedItem, items, idField]);

        const handleItemClick: (e: MouseEvent<HTMLLIElement>, index: number) => void =
        useCallback((e: MouseEvent<HTMLLIElement>, index: number) => {
            if (disabled) { return; }
            if (disableDefaultInteractions) {
                onSelect?.({event: e, index: index}, focusedIndexNumber === index);
                return;
            }
            const currentData: DataSource | undefined = items?.[Number(index)];
            if (!currentData) { return; }
            selectionHook.handleSelection(currentData, e, index);
        }, [disableDefaultInteractions, disabled, selectionHook]);

        const handleItemKeyDown: (e: KeyboardEvent<HTMLElement>) => void =
        useCallback((e: KeyboardEvent<HTMLElement>) => {
            if (disabled) { return; }
            if (!disableDefaultInteractions) {
                selectionHook.keyActionHandler(e);
            }
            onItemKeyDown?.(e, focusedIndexNumber);
        }, [disableDefaultInteractions, selectionHook, onItemKeyDown, focusedIndexNumber, disabled]);

        const wrapperClass: string = useMemo(() => { return [
            parentClass ? parentClass : 'sf-list-container',
            virtualization ? 'sf-virtualization' : ''
        ].filter(Boolean).join(' ').trim();
        }, [virtualization, parentClass]);

        const renderItem: (index: number, item: DataSource) => JSX.Element = useCallback(
            (index: number, item: DataSource) => (
                <ListItem
                    key={`sf-item-${index}`}
                    item={item}
                    fields={fields}
                    index={index}
                    onItemClick={handleItemClick}
                    getItemProps={getItemProps}
                    itemTemplate={itemTemplate}
                    groupTemplate={groupTemplate}
                    parentClass={parentClass}
                    ariaAttributes={ariaAttributes}
                    focusedIndex={focusedIndexNumber}
                    as={!virtualization ? 'li' : 'div'}
                    style={virtualization ? { height: virtualization.itemSize } : undefined}
                />
            ),
            [fields, handleItemClick, getItemProps, itemTemplate, groupTemplate, parentClass, ariaAttributes,
                focusedIndexNumber]);

        const handleScrollRequest: UIEventHandler<HTMLUListElement>
        = useCallback((e: UIEvent<HTMLUListElement>) => {
            onScrollRequest?.({
                originalEvent: e.nativeEvent as Event,
                startIndex: 0,
                count: 0
            });
        }, [onScrollRequest]);

        return (
            <div ref={contentRef} className={wrapperClass}>
                {!virtualization ? (
                    <ul ref={ULRef as RefObject<HTMLUListElement>} className={UL_CLASS}
                        role={ariaAttributes?.listRole ?? undefined} aria-label={ariaAttributes?.listLabel ?? undefined}
                        tabIndex={0} onKeyDown={handleItemKeyDown} onScroll={handleScrollRequest}>
                        {items?.map((item: DataSource, index: number) => {
                            return renderItem(index, item);
                        })}
                    </ul>

                ) : (<div ref={ULRef as RefObject<HTMLDivElement>} className={UL_CLASS} role={ariaAttributes?.listRole ?? undefined}
                    aria-label={ariaAttributes?.listLabel ?? undefined} tabIndex={0} onKeyDown={handleItemKeyDown}>
                    <VirtualScroller
                        items={items as DataSource[]}
                        itemSize={virtualization?.itemSize}
                        pageSize={virtualization?.pageSize}
                        overscanCount={virtualization?.overscanCount}
                        showSkeleton={virtualization.showSkeleton}
                        scrollParent={scrollParent || ULRef as RefObject<HTMLElement>}
                        onScrollRequest={onScrollRequest}
                        itemContent={renderItem}
                    />
                </div>)}
            </div>
        );
    }));
