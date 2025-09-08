import * as React from 'react';
import { extend, isNullOrUndefined, getValue } from '@syncfusion/react-base';
import { DataManager, Query, QueryOptions } from '@syncfusion/react-data';
import { CSSCheckbox } from '@syncfusion/react-buttons';

/**
 * An enum type that denotes the position of checkbox in the ListView. Available options are as follows Left and Right;
 */
export enum CheckBoxPosition {
    /**
     * The checkbox is positioned on the left side of the ListView item.
     */
    Left = 'Left',
    /**
     * The checkbox is positioned on the right side of the ListView item.
     */
    Right = 'Right'
}

/**
 * Enumeration for specifying sorting orders in the ListView. Available options are as follows None, Ascending, and Descending.
 *
 */
export enum SortOrder {
    /**
     * No specific sorting order is applied to the ListView items. The items are displayed in their original order.
     */
    None = 'None',
    /**
     * Ascending order sorting is applied to the ListView items.
     */
    Ascending = 'Ascending',
    /**
     * Descending order sorting is applied to the ListView items.
     */
    Descending = 'Descending'
}

/**
 * Enumeration for HTML attributes that are allowed in ListView. Available options are as follows class, className, style, title, aria-level.
 *
 */
enum AllowedHTMLAttributes {
    /**
     * Specifies a class name for custom styling through CSS.
     */
    className = 'className',

    /**
     * Defines inline CSS styles for the element.
     */
    style = 'style',

    /**
     * Provides a title that appears when hovering over the ListView items.
     */
    title = 'title',

    /**
     * Indicates the level of an element in a structured document for accessibility.
     */
    ariaLevel = 'aria-level'
}

/**
 * Interface representing field mappings in ListView items.
 */
export interface FieldsMapping {
    /**
     * The `id` field is used to map the unique identifier from the data source. This field is used to uniquely identify each ListView item.
     */
    id?: string;
    /**
     * The `text` field is used to map the text value from the data source for each list item.
     */
    text?: string;
    /**
     * The `value` field is used to map the unique value from the data source for each list item.
     */
    value?: string;
    /**
     * The `isSelected` field is used to select or unselect the list item.
     */
    isSelected?: string;
    /**
     * The `isChecked` field is used to check or uncheck the list item.
     */
    isChecked?: string;
    /**
     * The `isVisible` field is used to  hide or show the list item.
     */
    isVisible?: string;
    /**
     * The `url` field is used to map the URL value from the data source for each list item.
     * We can navigate to the URL by clicking on the list item.
     */
    url?: string;
    /**
     * The `isDisabled` field is used to enable or disable the list item.
     */
    isDisabled?: string;
    /**
     * The `groupBy` field is used to map the list items to the corresponding group based on group value in data source.
     */
    groupBy?: string;
    /**
     * The `icon` field is used to map the icon class value from the data source for each list item.
     *  We can add a specific image to the icons using `icon` field.
     */
    icon?: React.ReactNode;
    /**
     * The `child` field is used to map the list items to their corresponding parent items and facilitates nested navigation functionality.
     */
    child?: string;
    /**
     * The `tooltip` field is used to display the content about the target element when hovering on list item.
     */
    tooltip?: string;
    /**
     * The `hasChildren` field is used to check whether the list items have child items or not.
     */
    hasChildren?: string;
    /**
     * The `htmlAttributes` field allows additional attributes such as id, class, etc., and
     *  accepts n number of attributes in a key-value pair format.
     */
    htmlAttributes?: string;
    /**
     * The `imageUrl` field is used to map the image URL value from the data source for each list item.
     */
    imageUrl?: string;
    /**
     * The `sortBy` field used to enable the sorting of list items to be ascending or descending order.
     */
    sortBy?: string
    /**
     * The `tableName` field is used for data retrival operations from a specific table in the server.
     */
    tableName?: string;
}

/**
 * Interface for listbase options of a listitem.
 */
export interface ListBaseOptions {
    fields?: FieldsMapping;
    ariaAttributes?: AriaAttributesMapping;
    checkBox?: boolean;
    checkBoxPosition?: CheckBoxPosition;
    virtualization?: VirtualizationProps;
    sortOrder?: SortOrder;
    itemTemplate?: Function | React.ReactNode;
    groupTemplate?: Function | React.ReactNode;
    moduleName?: string;
    hoverIndex?: number;
    topLiItemsHeight?: number,
    bottomLiItemsHeight?: number,
    listItemSize?: number,
    parentClass?: string,
    itemClick?: (event: React.MouseEvent<HTMLLIElement>, index: number) => void;
    itemKeyDown?: (event: React.KeyboardEvent<HTMLLIElement>, index: number) => void;
}

/**
 * Interface that holds settings for virtualization in the ListView component.
 * Virtualization helps improve performance by only rendering items that are currently visible on the screen.
 */
export interface VirtualizationProps {
    /**
     * Specifies the height of each list item in pixels. This is necessary to calculate the scrolling height and manage the visible window.
     *
     * @default 40
     */
    itemSize?: number;

    /**
     * The total count of items in the data source. This is used to calculate the total scrollable content size.
     *
     * @default 15
     */
    itemsCount?: number;

    /**
     * The number of items to pre-render beyond the visible area. This helps prevent flickering by loading additional items in advance.
     *
     * @default 5
     */
    overscanCount?: number;
}

/**
 * Interface for CSS class names used for list item.
 */
interface ClassList {
    li: string;
    ul: string;
    group: string;
    icon: string;
    text: string;
    textContent: string;
    hasChild: string;
    level: string;
    url: string;
    disabled: string;
    image: string;
    anchorWrap: string;
    navigable: string;
    hover: string;
}

/**
 * Interface for additional HTML attributes.
 */
interface AdditionalAttributes {
    /** Unique data identifier. */
    'data-uid'?: string;
    /** Data value attribute. */
    'data-value'?: string;
}

/**
 * Interface representing ARIA attribute mappings in list item.
 */
interface AriaAttributesMapping {
    level?: number;
    listRole?: string;
    itemRole?: string;
    groupItemRole?: string;
    itemText?: string;
    wrapperRole?: string;
}

/**
 * Default class configuration for CSS classes.
 */
const cssClass: ClassList = {
    li: 'sf-list-item',
    ul: 'sf-list-parent sf-ul',
    group: 'sf-list-group-item',
    icon: 'sf-list-icon',
    text: 'sf-list-text',
    textContent: 'sf-text-content',
    hasChild: 'sf-has-child',
    level: 'sf-level',
    url: 'sf-list-url',
    disabled: 'sf-disabled',
    image: 'sf-list-img',
    anchorWrap: 'sf-anchor-wrap',
    navigable: 'sf-navigable',
    hover: 'sf-hover'
};

/**
 * Default ARIA attributes.
 */
const defaultAriaAttributes: AriaAttributesMapping = {
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
    isSelected: 'isSelected',
    isChecked: 'isChecked',
    isDisabled: 'isDisabled',
    icon: 'icon',
    child: 'child',
    isVisible: 'isVisible',
    hasChildren: 'hasChildren',
    tooltip: 'tooltip',
    htmlAttributes: 'htmlAttributes',
    imageUrl: 'imageUrl',
    groupBy: undefined,
    sortBy: undefined
};

/**
 * Default options for the list base configuration.
 */
export const defaultListBaseOptions: ListBaseOptions = {
    checkBox: false,
    checkBoxPosition: CheckBoxPosition.Left,
    virtualization: undefined,
    topLiItemsHeight: 0,
    bottomLiItemsHeight: 0,
    listItemSize: 0,
    fields: defaultMappedFields,
    ariaAttributes: defaultAriaAttributes,
    sortOrder: SortOrder.None,
    itemTemplate: undefined,
    groupTemplate: undefined,
    moduleName: 'list',
    hoverIndex: -1
};

/**
 * Generates an unordered list (UL) element.
 *
 * @param {HTMLElement[]} liElements - The array of list item elements to include in the UL.
 * @param {ListBaseOptions} [options] - Optional configuration options for the list.
 * @param {React.RefObject<HTMLDivElement | null>} [containerRef] - Optional ref object for the container element.
 * @returns {React.ReactElement} A React element representing the generated UL.
 */
export function generateUL(
    liElements: React.ReactElement[],
    options?: ListBaseOptions,
    containerRef?: React.RefObject<HTMLDivElement | null>
): React.ReactElement {
    const curOpt: ListBaseOptions = extend({}, defaultListBaseOptions, options);
    const ariaAttributes: AriaAttributesMapping = extend({}, defaultAriaAttributes, curOpt.ariaAttributes);
    return (
        <div ref={containerRef} className={options?.parentClass
            ? options.parentClass : 'sf-list-container'}>
            <ul className={cssClass.ul}
                role={ariaAttributes.listRole !== '' ? ariaAttributes.listRole : undefined} >
                {(curOpt.virtualization !== undefined) && (!options?.parentClass) ? (
                    <>
                        <div style={{ height: `${curOpt.topLiItemsHeight}px` }}></div>
                        {liElements.map((element: React.ReactElement, index: number) => React.cloneElement(element, { key: `item-${index}` }))}
                        <div style={{ height: `${curOpt.bottomLiItemsHeight}px` }}></div>
                    </>
                ) : (
                    liElements.map((element: React.ReactElement, index: number) => React.cloneElement(element, { key: `item-${index}` }))
                )}
            </ul>
        </div>
    );
}

/**
 * Interface for ListItem component props
 */
interface ListItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'onClick' | 'onKeyDown'> {
    item: { [key: string]: Object } | string | number;
    fields: FieldsMapping;
    index: number;
    onClick?: (e: React.MouseEvent<HTMLLIElement>, index: number) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLLIElement>, index: number) => void;
    focused?: number;
    options?: ListBaseOptions;
    itemClassName?: string;
    listItemRef?: (element: HTMLLIElement | null) => void;
}

const useFieldData: (
    item: { [key: string]: Object } | string | number,
    fields: FieldsMapping,
    options?: ListBaseOptions
) => {
    curOpt: ListBaseOptions;
    mergedFields: FieldsMapping;
    fieldData: { [key: string]: Object };
    ariaAttributes: AriaAttributesMapping;
    text: string;
    uid: string;
    grpLI: boolean;
    hasChildren: boolean;
    checked: boolean;
} = (item: { [key: string]: Object } | string | number,
     fields: FieldsMapping,
     options?: ListBaseOptions
) => {
    return React.useMemo(() => {
        const curOpt: ListBaseOptions = extend({}, defaultListBaseOptions, options);
        const mergedFields: FieldsMapping = extend({}, defaultMappedFields, curOpt.fields);
        const fieldData: { [key: string]: Object } = getFieldValues(item, mergedFields) as { [key: string]: Object };

        let text: string = fieldData[mergedFields.text as string] as string || '';
        if (!text && mergedFields.value && fieldData[mergedFields.value as string]) {
            text = fieldData[mergedFields.value as string].toString();
            // Also set the text field in fieldData so it's available elsewhere
            fieldData[mergedFields.text as string] = text;
        }
        const ariaAttributes: AriaAttributesMapping = extend({}, defaultAriaAttributes, curOpt.ariaAttributes);
        const uid: string = fieldData[mergedFields.id as string] as string;
        const grpLI: boolean = Boolean(Object.prototype.hasOwnProperty.call(item, 'isHeader') && (item as { isHeader: Object } & { [key: string]: Object }).isHeader);

        const subDS: { [key: string]: Object }[] = fieldData[mergedFields.child as string] as { [key: string]: Object }[] || [];
        const hasChildren: boolean = Boolean(fieldData[mergedFields.hasChildren as string]) || subDS.length > 0;
        const checked: boolean = Boolean(fieldData[mergedFields.isChecked as string] && (fieldData[mergedFields.isChecked as string]).toString() === 'true');

        return {
            curOpt,
            mergedFields,
            fieldData,
            ariaAttributes,
            text,
            uid,
            grpLI,
            hasChildren,
            checked
        };
    }, [item, fields, options]);
};

const useHtmlAttributes: (
    fieldData: { [key: string]: Object },
    fields: FieldsMapping,
    baseProps: React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes
) => React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes = (
    fieldData: { [key: string]: Object },
    fields: FieldsMapping,
    baseProps: React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes) => {
    return React.useMemo(() => {
        if (!fieldData ||
            !Object.prototype.hasOwnProperty.call(fieldData, fields.htmlAttributes as string) ||
            !fieldData[fields.htmlAttributes as string])
        {
            return baseProps;
        }

        const htmlAttributes: { [key: string]: string | number } = fieldData[fields.htmlAttributes as string] as { [key: string]: string };
        const allowedAttributes: AllowedHTMLAttributes[] = [
            AllowedHTMLAttributes.className,
            AllowedHTMLAttributes.style,
            AllowedHTMLAttributes.title,
            AllowedHTMLAttributes.ariaLevel
        ];

        const updatedProps: React.HTMLAttributes<HTMLElement> = { ...baseProps };

        allowedAttributes.forEach((attr: AllowedHTMLAttributes) => {
            if (Object.prototype.hasOwnProperty.call(htmlAttributes, attr)) {
                switch (attr) {
                case 'className':
                    updatedProps.className = `${updatedProps.className} ${(htmlAttributes[`${attr}`] as string).trim()}`.trim();
                    break;
                case 'style':
                    if (typeof htmlAttributes[`${attr}`] === 'string') {
                        const styleString: string = htmlAttributes[`${attr}`] as string;
                        const styleObj: { [key: string]: string } = {};
                        styleString.split(';').forEach((style: string) => {
                            const [property, value] = style.split(':');
                            if (property && value) {
                                const formattedProperty: string = property.trim().replace(/-./g, (c: string) => c.substring(1).toUpperCase());
                                Object.assign(styleObj, { [formattedProperty]: value.trim() });
                            }
                        });
                        updatedProps.style = { ...updatedProps.style, ...styleObj };
                    }
                    break;
                case 'aria-level':
                    updatedProps['aria-level'] = htmlAttributes[`${attr}`] as number;
                    break;
                case 'title':
                    updatedProps.title = htmlAttributes[`${attr}`] as string;
                    break;
                }
            }
        });

        Object.keys(htmlAttributes).forEach((key: string) => {
            if (allowedAttributes.indexOf(key as AllowedHTMLAttributes) === -1) {
                (updatedProps as Record<string, string | number | boolean>)[`${key}`] = htmlAttributes[`${key}`];
            }
        });

        return updatedProps;
    }, [fieldData, fields.htmlAttributes, baseProps]);
};

/**
 * A component that renders a item in a list.
 *
 * @component
 * @param {string|Object|number} props.item - The item data to render. Can be a string, object, or number.
 * @param {FieldsMapping} props.fields - Mapping of field names to their display properties
 * @param {number} props.index - The index of the item in the list
 * @param {Function} [props.onClick] - Handler function called when the item is clicked
 * @param {Function} [props.onKeyDown] - Handler function called when a key is pressed while the item is focused
 * @param {boolean} [props.selected] - Whether the item is currently selected
 * @param {boolean} [props.checked] - Whether the item is currently checked (for checkable lists)
 * @param {number} [props.focused] - The index of the currently focused item
 * @param {ListBaseOptions} [props.options] - Additional options for list behavior
 * @returns {React.ReactElement} The rendered list item
 */
export const ListItem: React.FC<ListItemProps> = React.memo(({
    item,
    fields,
    index,
    onClick,
    onKeyDown,
    focused,
    options,
    itemClassName,
    listItemRef,
    ...restProps
}: ListItemProps): React.ReactElement => {

    const {
        curOpt,
        mergedFields,
        fieldData,
        ariaAttributes,
        text,
        uid,
        grpLI,
        hasChildren,
        checked
    } = useFieldData(item, fields, options);

    const dataSource: { [key: string]: object } = item as { [key: string]: Object };
    const itemRef: React.RefObject<HTMLLIElement | null> = React.useRef<HTMLLIElement>(null);

    const handleClick: React.MouseEventHandler<HTMLLIElement> = React.useCallback((e: React.MouseEvent<HTMLLIElement>) => {
        onClick?.(e, index);
    }, [onClick, index]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLLIElement> = React.useCallback((e: React.KeyboardEvent<HTMLLIElement>) => {
        onKeyDown?.(e, index);
    }, [onKeyDown, index]);

    const className: string = React.useMemo(() => {
        const classes: string[] = [
            grpLI ? cssClass.group : cssClass.li,
            `${cssClass.level}-${ariaAttributes.level}`,
            fieldData && fieldData[mergedFields.isDisabled as string] === false ? cssClass.disabled : '',
            hasChildren ? cssClass.hasChild : '',
            curOpt.checkBox ? 'sf-checklist' : '',
            (options?.parentClass ? itemClassName : index === focused ? 'sf-focused' : '') || '',
            curOpt.hoverIndex === index ? cssClass.hover : ''
        ];
        return classes.filter(Boolean).join(' ').trim();
    },
                                            [
                                                grpLI,
                                                ariaAttributes.level,
                                                fieldData,
                                                mergedFields.isDisabled,
                                                hasChildren,
                                                curOpt.checkBox,
                                                curOpt.hoverIndex,
                                                options?.parentClass,
                                                itemClassName,
                                                index,
                                                focused
                                            ]
    );

    const baseLiProps: React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes =
        React.useMemo((): React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes => {
            const isPrimitive: boolean = typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean';
            const props: React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes = {
                className,
                onClick: handleClick,
                onKeyDown: handleKeyDown,
                role: (ariaAttributes.groupItemRole !== '' && ariaAttributes.itemRole !== '') ?
                    (grpLI ? ariaAttributes.groupItemRole : ariaAttributes.itemRole) : undefined,
                'data-uid': uid,
                'aria-level': ariaAttributes.groupItemRole === 'presentation' || ariaAttributes.itemRole === 'presentation' ? undefined : ariaAttributes.level,
                'data-value': options?.parentClass?.includes('sf-dropdownbase') ?
                    (isPrimitive ? item.toString() : fieldData[mergedFields.value as keyof typeof fieldData] as string) :
                    undefined,
                ...(grpLI !== true && { 'tabIndex': mergedFields.groupBy ? index === 1 ? 0 : -1 : index === 0 ? 0 : -1 })
            };

            if (!isNullOrUndefined(dataSource)) {
                if (!isNullOrUndefined(fieldData[mergedFields.tooltip as string])) {
                    props.title = fieldData[mergedFields.tooltip as string] as string;
                }
                if (!isNullOrUndefined(fieldData[mergedFields.isVisible as string]) && (fieldData[mergedFields.isVisible as string]).toString() === 'false') {
                    props.className = props.className + ' sf-hide';
                }
                if (!isNullOrUndefined(fieldData[mergedFields.isSelected as string]) && (fieldData[mergedFields.isSelected as string]).toString() === 'true') {
                    props.className = props.className + ' sf-active';
                }
                if (!isNullOrUndefined(fieldData[mergedFields.isChecked as string]) && (fieldData[mergedFields.isChecked as string]).toString() === 'true') {
                    props.className = props.className + ' sf-active';
                }
                if (!isNullOrUndefined(fieldData[mergedFields.isDisabled as string]) && (fieldData[mergedFields.isDisabled as string]).toString() === 'true') {
                    props.className = props.className + ' sf-disabled';
                }
                if (fieldData[mergedFields.url as string]) {
                    props.className = props.className + ` ${cssClass.navigable}`;
                }
                if (curOpt.virtualization !== undefined && curOpt.virtualization?.itemSize && curOpt.virtualization?.itemSize > 0) {
                    const itemHeight: number = curOpt.listItemSize ?? 0;
                    const lineHeight: number = itemHeight / 2;
                    const paddingTop: number = lineHeight / 2;
                    props.style = {
                        height: itemHeight + 'px',
                        lineHeight: lineHeight + 'px',
                        paddingTop: paddingTop + 'px',
                        paddingBottom: paddingTop + 'px'
                    };
                }
            }

            return props;
        },
                      [
                          className,
                          handleClick,
                          handleKeyDown,
                          ariaAttributes,
                          grpLI,
                          uid,
                          options,
                          fieldData,
                          mergedFields,
                          index,
                          focused,
                          dataSource,
                          curOpt
                      ]
        );

    const liProps: React.HTMLAttributes<HTMLLIElement> & AdditionalAttributes = useHtmlAttributes(fieldData, mergedFields, {
        ...baseLiProps,
        ...restProps
    });
    const content: React.ReactNode = React.useMemo(() => {
        if (!grpLI && options && options.itemTemplate) {
            return typeof (options.itemTemplate) === 'function' ? options.itemTemplate(item, curOpt.moduleName) : options.itemTemplate;
        } else if (grpLI && options && options.groupTemplate) {
            return typeof (options.groupTemplate) === 'function' ? options.groupTemplate(item, curOpt.moduleName) : options.groupTemplate;
        }
        return null;
    }, [grpLI, options, item, curOpt.moduleName]);

    if (content) {
        return (
            <li key={uid} {...liProps}>
                {content}
            </li>
        );
    }

    return (
        <li key={uid} {...liProps} ref={listItemRef || itemRef}>
            {options?.parentClass && text}
            {!options?.parentClass && (
                <ListItemContent
                    fieldData={fieldData}
                    fields={mergedFields}
                    text={text}
                    checked={checked}
                    curOpt={curOpt}
                    ariaAttributes={ariaAttributes}
                    dataSource={dataSource}
                />
            )}
        </li>
    );
});

const ListItemContent: React.FC<{
    fieldData: { [key: string]: Object };
    fields: FieldsMapping;
    text: string;
    checked: boolean;
    curOpt: ListBaseOptions;
    ariaAttributes: AriaAttributesMapping;
    dataSource: { [key: string]: object };
}> = React.memo(({ fieldData, fields, text, checked, curOpt, ariaAttributes, dataSource }: {
    fieldData: { [key: string]: Object };
    fields: FieldsMapping;
    text: string;
    checked: boolean;
    curOpt: ListBaseOptions;
    ariaAttributes: AriaAttributesMapping;
    dataSource: { [key: string]: object };
}) => {
    // Use value as text if text is empty and value exists
    const displayText: string = text ||
        (fields.value && fieldData[fields.value as string] ?
            fieldData[fields.value as string].toString() : '');
    const textContentClassName: string = React.useMemo(() => {
        const classes: string[] = [
            cssClass.textContent,
            curOpt.checkBox ? (
                curOpt.checkBoxPosition === 'Left' ? 'sf-checkbox sf-checkbox-left' : 'sf-checkbox sf-checkbox-right'
            ) : ''
        ];
        return classes.filter(Boolean).join(' ').trim();
    }, [curOpt.checkBox, curOpt.checkBoxPosition]);

    const hasIcon: boolean = React.useMemo(() =>
        Object.prototype.hasOwnProperty.call(fieldData, fields.icon as string) && !isNullOrUndefined(fieldData[fields.icon as string])
    , [fieldData, fields.icon]);

    const hasImage: boolean = React.useMemo(() =>
        Object.prototype.hasOwnProperty.call(fieldData, fields.imageUrl as string) &&
        !isNullOrUndefined(fieldData[fields.imageUrl as string])
    , [fieldData, fields.imageUrl]);

    const hasUrl: object = React.useMemo(() =>
        dataSource && fieldData[fields.url as string]
    , [dataSource, fieldData, fields.url]);

    return (
        <div
            className={textContentClassName}
            role={ariaAttributes.wrapperRole !== '' ? ariaAttributes.wrapperRole : undefined}
        >
            {hasUrl ? (
                <a
                    className={`${cssClass.text} ${cssClass.url}`}
                    href={fieldData[fields.url as string] as string}
                >
                    <div className={cssClass.anchorWrap}>
                        {hasIcon && (
                            <div className={cssClass.icon}>
                                {fieldData[fields.icon as keyof typeof fieldData] as React.ReactNode}
                            </div>
                        )}
                        {hasImage && (
                            <img className={cssClass.image} src={fieldData[fields.imageUrl as string] as string} alt="Icon" />
                        )}
                        {text}
                    </div>
                </a>
            ) : (
                <>
                    {hasIcon && (
                        <div className={cssClass.icon}>
                            {fieldData[fields.icon as keyof typeof fieldData] as React.ReactNode}
                        </div>
                    )}
                    {hasImage && (
                        <img className={cssClass.image} src={fieldData[fields.imageUrl as string] as string} alt="Icon" />
                    )}
                    {!fieldData['isHeader'] && curOpt.checkBox && (
                        curOpt.checkBoxPosition === 'Left' ? (
                            <>
                                <CSSCheckbox
                                    className='sf-listview-checkbox sf-checkbox-left'
                                    checked={checked}
                                    aria-checked={checked ? 'true' : 'false'}
                                    aria-label={text}
                                />
                                <span
                                    className={cssClass.text}
                                    role={ariaAttributes.itemText !== '' ? ariaAttributes.itemText : undefined}
                                >
                                    {text}
                                </span>
                            </>
                        ) : (
                            <>
                                <span
                                    className={cssClass.text}
                                    role={ariaAttributes.itemText !== '' ? ariaAttributes.itemText : undefined}
                                >
                                    {text}
                                </span>
                                <CSSCheckbox
                                    className='sf-listview-checkbox sf-checkbox-right'
                                    checked={checked}
                                    aria-checked={checked ? 'true' : 'false'}
                                    aria-label={text}
                                />
                            </>
                        )
                    )}
                    {!curOpt.checkBox && (
                        <span
                            className={cssClass.text}
                            role={ariaAttributes.itemText !== '' ? ariaAttributes.itemText : undefined}
                        >
                            {displayText}
                        </span>
                    )}
                </>
            )}
        </div>
    );
});

/**
 * Groups the data source based on the specified fields and sort order.
 *
 * @param {{Object}[]} dataSource - The data source to group.
 * @param {FieldsMapping} fields - The fields configuration for grouping.
 * @param {SortOrder} sortOrder - Optional sort order for the grouped data.
 * @returns {Object[]} An array of grouped data objects.
 */
export function groupDataSource(
    dataSource: { [key: string]: Object }[],
    fields: FieldsMapping,
    sortOrder: SortOrder = SortOrder.None
): { [key: string]: Object }[] {
    const curFields: FieldsMapping = extend({}, defaultMappedFields, fields);
    let cusQuery: Query = new Query().group(curFields.groupBy as string);
    cusQuery = addSorting(sortOrder, 'key', cusQuery);
    const ds: { [key: string]: Object }[] = getDataSource(dataSource, cusQuery);
    const groupedData: { [key: string]: Object }[] = [];
    ds.forEach((group: { [key: string]: Object }) => {
        const groupItem: { [key: string]: Object } = {};
        groupItem[curFields.text as string] = (group as { key: string } & { [key: string]: Object }).key;
        groupItem['isHeader'] = true;
        let newtext: string = curFields.text as string;
        if (newtext === 'id') {
            newtext = 'text';
            Object.assign(groupItem, { 'text': group.key });
        }
        groupItem['_id'] = `group-list-item-${(group as { [key: string]: Object }).key ?
            (group as { [key: string]: Object }).key.toString().trim() : 'undefined'}`;
        groupItem['items'] = (group as { items: { [key: string]: Object }[] } & { [key: string]: Object }).items;
        groupedData.push(groupItem);
        groupedData.push(...(group as { items: { [key: string]: Object }[] } & { [key: string]: Object }).items);
    });

    return groupedData;
}

/**
 * Adds sorting to a query based on the specified sort order and field.
 *
 * @param {SortOrder} sortOrder - The sort order to apply.
 * @param {string} sortBy - The field to sort by.
 * @param {Query} query - Optional existing query to add sorting to.
 * @returns {Query} The query with added sorting.
 */
export function addSorting(sortOrder: SortOrder, sortBy: string, query: Query = new Query()): Query {
    if (sortOrder === 'Ascending') {
        query.sortBy(sortBy, 'ascending', true);
    } else if (sortOrder === 'Descending') {
        query.sortBy(sortBy, 'descending', true);
    } else {
        query.queries = query.queries.filter((q: QueryOptions) => q.fn !== 'onSortBy');
    }
    return query;
}

/**
 * Executes a query on the data source.
 *
 * @param {{Object}[]} dataSource - The data source to query.
 * @param {Query} query - The query to execute.
 * @returns {Object[]} The result of the query execution.
 */
export function getDataSource(dataSource: { [key: string]: Object }[], query: Query): { [key: string]: Object }[] {
    return new DataManager(dataSource).executeLocal(query) as { [key: string]: Object }[];
}

/**
 * Gets the field values from a data item based on the specified fields mapping.
 *
 * @param {Object} dataItem - The data item to extract field values from.
 * @param {FieldsMapping} fields - The fields mapping configuration.
 * @returns {Object|string|number} An object containing the extracted field values, or the original data item if it's a primitive value.
 */
export function getFieldValues(dataItem: { [key: string]: Object } | string | number | boolean, fields: FieldsMapping)
    : { [key: string]: Object } | string | number | boolean {
    const fieldData: { [key: string]: Object } = {};
    if (isNullOrUndefined(dataItem)) {
        return dataItem;
    }
    else if (typeof dataItem === 'string' || typeof dataItem === 'number' || typeof dataItem === 'boolean') {
        const stringValue: string = dataItem.toString();
        fieldData[fields.text || 'text'] = stringValue;
        fieldData[fields.value || 'value'] = dataItem;
        fieldData['text'] = stringValue;
        fieldData['value'] = dataItem;
        return fieldData;
    }
    else if (!isNullOrUndefined((dataItem as { [key: string]: Object }).isHeader)) {
        return dataItem;
    }
    else {
        for (const field of Object.keys(fields)) {
            if (Object.prototype.hasOwnProperty.call(fields, field)) {
                const dataField: string = fields[field as keyof FieldsMapping] as string;
                const value: { [key: string]: Object } = !isNullOrUndefined(dataField) &&
                    typeof (dataField) === 'string' ? getValue(dataField, dataItem) : undefined;
                if (!isNullOrUndefined(value)) {
                    Object.defineProperty(fieldData, dataField, { value: value });
                }
            }
        }
        // If text is not set but value is, use value as text
        if (!fields.text && fields.value && !isNullOrUndefined(getValue(fields.value, dataItem))) {
            const valueField: string = fields.value;
            const valueData: string = getValue(valueField, dataItem);
            Object.defineProperty(fieldData, 'text', { value: valueData });
        }
    }
    return fieldData;
}
