import * as React from 'react';
import { isNullOrUndefined, getUniqueID } from '@syncfusion/react-base';
import type { ListAriaAttributes } from './listItems';
import { defaultMappedFields } from './listItems';
import { getFieldValues } from './utils';
import { FieldsMapping, VirtualizationProps } from './types';

const GROUP_CLASS: string = 'sf-list-group-item';
const LI_CLASS: string = 'sf-list-item';
const LEVEL_CLASS: string = 'sf-level';
const HAS_CHILD_CLASS: string = 'sf-has-child';
const DISABLED_CLASS: string = 'sf-disabled';
const NAVIGABLE_CLASS: string = 'sf-navigable';

export interface UseListItemResult {
    mergedFields: FieldsMapping;
    fieldData: { [key: string]: Object };
    uid: string;
    grpLI: boolean;
    checked: boolean;
    liProps: React.LiHTMLAttributes<HTMLLIElement>;
    displayText: string;
    hasChild: boolean;
    hasIcon: boolean;
    hasImage: boolean;
    hasUrl: boolean;
    templateContent?: React.ReactNode;
    dataValue?: string;
    ariaAttributes?: ListAriaAttributes;
}

export const useListItem: (item: { [key: string]: Object } | string | number, fields: FieldsMapping,
    index: number, focusedItemIndex: number,
    itemTemplate?: Function | React.ReactNode,
    groupTemplate?: Function | React.ReactNode,
    ariaAttributes?: ListAriaAttributes,
    checkBox?: boolean,
    parentClass?: string,
    virtualization?: VirtualizationProps,
    itemClassName?: string) =>
UseListItemResult = (item: { [key: string]: Object } | string | number,
                     fields: FieldsMapping,
                     index: number,
                     focusedItemIndex: number,
                     itemTemplate?: Function | React.ReactNode,
                     groupTemplate?: Function | React.ReactNode,
                     ariaAttributes?: ListAriaAttributes,
                     checkBox?: boolean,
                     parentClass?: string,
                     virtualization?: VirtualizationProps,
                     itemClassName?: string): UseListItemResult => {
    const mergedFields: FieldsMapping = React.useMemo(() => ({ ...defaultMappedFields, ...fields }), [fields]);

    const fieldData: { [key: string]: Object } = React.useMemo(() => (
        getFieldValues(item, mergedFields) as { [key: string]: Object }
    ), [item, mergedFields]);

    const uid: string = React.useMemo(
        () => (fieldData[mergedFields.id as string] as string || getUniqueID('listitem')),
        [fieldData, mergedFields.id]
    );

    const grpLI: boolean = React.useMemo(
        () => Boolean(Object.prototype.hasOwnProperty.call(item, 'isHeader') && (item as { isHeader: Object } & { [key: string]: Object }).isHeader),
        [item]
    );

    const hasChild: boolean = React.useMemo(() => {
        const subDS: { [key: string]: Object }[] = fieldData[mergedFields.child as string] as { [key: string]: Object }[] || [];
        return Boolean(fieldData[mergedFields.hasChildren as string]) || subDS.length > 0;
    }, [fieldData, mergedFields.child, mergedFields.hasChildren]);

    const checked: boolean = React.useMemo(() => (
        Boolean(fieldData[mergedFields.checked as string] && (fieldData[mergedFields.checked as string]).toString() === 'true')
    ), [fieldData, mergedFields.checked]);

    const displayText: string = React.useMemo(() => (
        (fieldData[mergedFields.text as string] as string) || (mergedFields.value && fieldData[mergedFields.value as string] ? fieldData[mergedFields.value as string].toString() : '')
    ), [mergedFields.text, mergedFields.value, fieldData]);

    const hasIcon: boolean = React.useMemo(() => {
        return mergedFields.icon as string in fieldData && !isNullOrUndefined(fieldData[mergedFields.icon as string]);
    }, [fieldData, mergedFields.icon]);

    const hasImage: boolean = React.useMemo(() => (
        Boolean(fieldData[mergedFields.imageUrl as string])
    ), [fieldData, mergedFields.imageUrl]);

    const hasUrl: boolean = React.useMemo(() => (Boolean(fieldData[mergedFields.url as string])), [fieldData, mergedFields.url]);

    const templateContent: React.ReactNode = React.useMemo(() => {
        if (!grpLI && itemTemplate) {
            return typeof itemTemplate === 'function' ? itemTemplate(item) : itemTemplate;
        } else if (grpLI && groupTemplate) {
            return typeof groupTemplate === 'function' ? groupTemplate(item) : groupTemplate;
        }
        return null;
    }, [grpLI, groupTemplate, itemTemplate, item]);

    const dataValue: string = fieldData[mergedFields.value as string] as string || displayText;

    const className: string = React.useMemo(() => {
        const classes: string[] = [
            grpLI ? GROUP_CLASS : LI_CLASS,
            `${LEVEL_CLASS}-${ariaAttributes?.level ?? 1}`,
            fieldData && !isNullOrUndefined(fieldData[mergedFields.disabled as string]) && (fieldData[mergedFields.disabled as string]).toString() === 'true' ? DISABLED_CLASS : '',
            hasChild ? HAS_CHILD_CLASS : '',
            checkBox ? 'sf-checklist' : '',
            (parentClass ? itemClassName ?? '' : index === focusedItemIndex ? 'sf-focused' : '') || '',
            fieldData && fieldData[mergedFields.url as string] ? NAVIGABLE_CLASS : '',
            fieldData && !isNullOrUndefined(fieldData[mergedFields.visible as string]) && (fieldData[mergedFields.visible as string]).toString() === 'false' ? 'sf-display-none' : '',
            fieldData && !isNullOrUndefined(fieldData[mergedFields.selected as string]) && (fieldData[mergedFields.selected as string]).toString() === 'true' ? 'sf-active' : '',
            fieldData && checked ? 'sf-active' : ''
        ];
        return classes.filter(Boolean).join(' ').trim();
    }, [grpLI, ariaAttributes?.level, fieldData, mergedFields.disabled, hasChild,
        checkBox, parentClass, itemClassName, index, focusedItemIndex]);

    const baseLiProps: React.LiHTMLAttributes<HTMLLIElement> = React.useMemo(() => {
        const props: React.LiHTMLAttributes<HTMLLIElement> = {
            className,
            role: (ariaAttributes?.groupItemRole !== '' && ariaAttributes?.itemRole !== '') ? (grpLI ? ariaAttributes?.groupItemRole : ariaAttributes?.itemRole) : undefined,
            'aria-level': ariaAttributes?.groupItemRole === 'presentation' || ariaAttributes?.itemRole === 'presentation' ? undefined : ariaAttributes?.level,
            ...(grpLI !== true && { 'tabIndex': mergedFields.groupBy ? index === 1 ? 0 : -1 : index === 0 ? 0 : -1 })
        };

        if (!isNullOrUndefined(fieldData)) {
            if (!isNullOrUndefined(fieldData[mergedFields.tooltip as string])) {
                props.title = fieldData[mergedFields.tooltip as string] as string;
            }
            if (virtualization !== undefined) {
                const itemHeight: number = virtualization?.itemSize ?? 0;
                const lineHeight: number = itemHeight / 2;
                const paddingTop: number = lineHeight / 2;
                props.style = {
                    height: itemHeight + 'px',
                    lineHeight: lineHeight + 'px',
                    paddingTop: paddingTop + 'px',
                    paddingBottom: paddingTop + 'px'
                } as React.CSSProperties;
            }
        }

        return props;
    }, [className, ariaAttributes, grpLI, mergedFields, index, fieldData]);

    const liProps: React.LiHTMLAttributes<HTMLLIElement> = React.useMemo(() => {
        if (!fieldData || !Object.prototype.hasOwnProperty.call(fieldData, mergedFields.htmlAttributes as string)
                || !fieldData[mergedFields.htmlAttributes as string]) {
            return baseLiProps;
        }
        let updatedProps: React.LiHTMLAttributes<HTMLLIElement> = { ...baseLiProps };
        const htmlAttributes: React.HTMLAttributes<HTMLLIElement> =
                fieldData[mergedFields.htmlAttributes as string] as React.HTMLAttributes<HTMLLIElement>;
        const { className, style, ...restProps } = htmlAttributes;
        if (className) {
            updatedProps.className = `${updatedProps.className || ''} ${className}`.trim();
        }
        if (style) {
            updatedProps.style = { ...updatedProps.style, ...style } as React.CSSProperties;
        }
        updatedProps = { ...updatedProps, ...restProps };
        return updatedProps;
    }, [baseLiProps, fieldData, mergedFields.htmlAttributes]);

    return {
        mergedFields, fieldData, uid, grpLI, checked, liProps,
        displayText, hasChild, hasIcon, hasImage, hasUrl, templateContent, dataValue, ariaAttributes
    };
};
