import * as React from 'react';
import { VirtualizedList } from './virtualizedList';
import { CheckBoxPosition, DataSource, FieldsMapping, VirtualizationProps } from './types';
import { ListItem } from './listItem';
import { DataManager, Query } from '@syncfusion/react-data';
import { SelectEvent, useListItemSelection, UseListItemSelectionResult } from './useListItemSelection';
import { isNullOrUndefined } from '@syncfusion/react-base';

const UL_CLASS: string = 'sf-list-parent sf-ul';

export interface GetItemPropsOptions {
    item: { [key: string]: Object } | string | number;
    index: number;
}

/**
 * Interface for ListItems common props.
 *
 */
export interface ListItemsCommonProps {
    /** ARIA roles/text for list and items; listRole is applied to the <ul>. */
    ariaAttributes?: ListAriaAttributes;
    /** Render a checkbox for each list item. */
    checkBox?: boolean;
    /** Checkbox position relative to item content (effective when checkBox is true). */
    checkBoxPosition?: CheckBoxPosition;
    /** Virtualization settings; when set and no parentClass, renders via VirtualizedList. */
    virtualization?: VirtualizationProps;
    /** Custom item content template (function or ReactNode). */
    itemTemplate?: Function | React.ReactNode;
    /** Custom group header template (function or ReactNode). */
    groupTemplate?: Function | React.ReactNode;
    /** Custom container class; also disables spacer path when set. */
    parentClass?: string;
    /*** Optional callback to provide additional/overridden HTML attributes for each rendered item. */
    getItemProps?: (args: GetItemPropsOptions) =>
    React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement> | undefined;
    /** KeyDown handler for each ListItem (overrides options.itemKeyDown when provided). */
    onItemKeyDown?: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void;
}

/**
 * Interface representing ARIA attribute in list item.
 *
 * @private
 */
export interface ListAriaAttributes {
    level?: number;
    listRole?: string;
    itemRole?: string;
    groupItemRole?: string;
    itemText?: string;
    wrapperRole?: string;
}

/**
 * Default ARIA attributes.
 */
const defaultAriaAttributes: ListAriaAttributes = {
    level: 1,
    listRole: 'presentation',
    itemRole: 'presentation',
    groupItemRole: 'group',
    itemText: 'list-item',
    wrapperRole: 'presentation'
};

/**
 * Default field mapping configuration.
 */
export const defaultMappedFields: FieldsMapping = {
    id: 'id',
    text: 'text',
    url: 'url',
    value: 'value',
    selected: 'selected',
    checked: 'checked',
    disabled: 'disabled',
    icon: 'icon',
    child: 'child',
    visible: 'visible',
    hasChildren: 'hasChildren',
    tooltip: 'tooltip',
    htmlAttributes: 'htmlAttributes',
    imageUrl: 'imageUrl',
    groupBy: undefined,
    sortBy: undefined
};

/**
 * Props for the ListItems component.
 */
export interface ListItemsProps extends ListItemsCommonProps {
    /** Items to render (objects or primitives). */
    items?: DataSource[];
    /** Fields mapping for ListItem; falls back to options.fields when omitted. */
    fields?: FieldsMapping;
    /**Ref to the scrollable parent element for virtualization calculations. */
    scrollParent?: React.RefObject<HTMLElement>
    /** Data source for local/remote binding (used by virtualization). */
    dataSource?: DataSource[] | DataManager;
    /** Base query for DataManager operations. */
    baseQuery?: Query;
    /** Header element ref (used for offset calculations in virtualization). */
    headerRef?: React.RefObject<HTMLDivElement | null>;
    /** Focused item index for styling/focus parity. */
    focusedIndex?: number;
    /** Called before data action begins (e.g., fetch). */
    onActionBegin?: () => void;
    /** Called after data action completes successfully. */
    onActionComplete?: () => void;
    /** Called when a data action fails. */
    onActionFailure?: (e: object) => void;
    /** Selection event handler triggered when item is selected/checked. */
    onSelect?: (event: SelectEvent) => void;
    /** Function to update list item data source. */
    setListItemDatas?: (data: DataSource[]) => void;
    /** Whether the list is disabled. */
    disabled?: boolean;
    /** Current data source level for nested lists. */
    curDSLevel?: string[];
}

/**
 * ListItems — presentational list renderer.
 */
export const ListItems: React.NamedExoticComponent<ListItemsProps & React.RefAttributes<HTMLDivElement>> =
    React.memo(React.forwardRef<HTMLDivElement, ListItemsProps>(({
        items,
        fields = defaultMappedFields,
        scrollParent,
        headerRef,
        dataSource,
        baseQuery,
        checkBox= false,
        checkBoxPosition= CheckBoxPosition.Left,
        virtualization,
        parentClass,
        itemTemplate,
        groupTemplate,
        ariaAttributes,
        onActionBegin, onActionComplete, onActionFailure, getItemProps,
        onItemKeyDown, onSelect, setListItemDatas, disabled = false, curDSLevel = [] }:
    ListItemsProps, ref: React.ForwardedRef<HTMLDivElement>) => {
        const curAttributes: ListAriaAttributes = { ...defaultAriaAttributes, ...ariaAttributes };
        ariaAttributes = curAttributes;
        const ParentTag: 'div' | 'ul' = (virtualization ? 'div' : 'ul') as 'div' | 'ul';
        const contentRef: React.RefObject<HTMLDivElement | null> = React.useRef<HTMLDivElement | null>(null);
        React.useImperativeHandle(ref, () => contentRef.current as HTMLDivElement, []);

        const selectionHook: UseListItemSelectionResult = useListItemSelection({
            disabled,
            checkBox: checkBox as boolean,
            fields: fields as FieldsMapping,
            listItemDatas: items || [],
            curDSLevel,
            onSelect,
            setListItemDatas: setListItemDatas || (() => undefined),
            contentRef: contentRef as React.RefObject<HTMLDivElement>
        });

        const handleItemClick: (e: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => void =
        React.useCallback((e: React.MouseEvent<HTMLLIElement>, index: number) => {
            if (isNullOrUndefined(fields.id)) {
                onSelect?.({event: e, index: index});
                return;
            }
            const li: HTMLLIElement = e.currentTarget as HTMLLIElement;
            if (!disabled && checkBox && selectionHook.isValidLI(li)) {
                if (li.classList.contains('sf-has-child')) {
                    selectionHook.handleSelection(li, e, index);
                } else {
                    selectionHook.setCheckboxLI(li, e, index);
                }
            } else {
                selectionHook.handleSelection(li, e, index);
            }
        }, [disabled, checkBox, selectionHook]);

        const handleItemKeyDown: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void =
        React.useCallback((e: React.KeyboardEvent<HTMLLIElement>, index: number) => {
            if (!isNullOrUndefined(fields.id)) {
                selectionHook.keyActionHandler(e, index);
            }
            onItemKeyDown?.(e, index);
        }, [selectionHook, onItemKeyDown]);

        return (
            <div ref={contentRef} className={parentClass ? parentClass : 'sf-list-container'}>
                <ParentTag className={UL_CLASS} role={ariaAttributes?.listRole ?? undefined}
                    aria-label={ariaAttributes.listRole ?? undefined}>
                    {virtualization ? (
                        <VirtualizedList
                            items={items}
                            fields={fields}
                            onItemClick={handleItemClick}
                            onItemKeyDown={handleItemKeyDown}
                            scrollParent={scrollParent}
                            dataSource={dataSource}
                            baseQuery={baseQuery}
                            headerRef={headerRef}
                            onActionBegin={onActionBegin}
                            onActionComplete={onActionComplete}
                            onActionFailure={onActionFailure}
                            setListItemDatas={setListItemDatas}
                            getItemProps={getItemProps}
                            activeItemsId={selectionHook.activeItemsId}
                            focusedIndex={selectionHook.focusedItemIndex}
                            itemTemplate={itemTemplate}
                            groupTemplate={groupTemplate}
                            checkBoxPosition={checkBoxPosition}
                            virtualization={virtualization}
                            parentClass={parentClass}
                            ariaAttributes={ariaAttributes}
                            checkBox={checkBox}
                        />
                    ) : (items?.map((item: DataSource, index: number) => {
                        return (
                            <ListItem
                                key={`item-${index}`}
                                item={item}
                                fields={fields as FieldsMapping}
                                index={index}
                                onItemClick={handleItemClick}
                                onItemKeyDown={handleItemKeyDown}
                                getItemProps={getItemProps}
                                focusedIndex={selectionHook.focusedItemIndex}
                                itemTemplate={itemTemplate}
                                groupTemplate={groupTemplate}
                                checkBoxPosition={checkBoxPosition}
                                virtualization={virtualization}
                                parentClass={parentClass}
                                ariaAttributes={ariaAttributes}
                                checkBox={checkBox}
                            />
                        );
                    })
                    )}
                </ParentTag>
            </div>
        );
    }));
