import { HTMLAttributes, LiHTMLAttributes, ReactNode, useMemo } from 'react';
import { isNullOrUndefined, getUniqueID } from '@syncfusion/react-base';
import type { ListAriaAttributes } from './listItems';
import { defaultMappedFields } from './listItems';
import { getFieldValues } from './utils';
import { FieldsMapping } from './types';

const GROUP_CLASS: string = 'sf-list-group-item';
const LI_CLASS: string = 'sf-list-item';
const LEVEL_CLASS: string = 'sf-level';
const DISABLED_CLASS: string = 'sf-disabled';
const NAVIGABLE_CLASS: string = 'sf-navigable';

export interface UseListItemResult {
    mergedFields: FieldsMapping;
    fieldData: { [key: string]: Object };
    uid: string;
    grpLI: boolean;
    liProps: LiHTMLAttributes<HTMLLIElement>;
    displayText: string;
    hasIcon: boolean;
    hasImage: boolean;
    hasUrl: boolean;
    templateContent?: ReactNode;
    ariaAttributes?: ListAriaAttributes;
}

export const useListItem: (item: { [key: string]: Object } | string | number, fields?: FieldsMapping,
    index?: number, focusedItemIndex?: number,
    itemTemplate?: Function | ReactNode,
    groupTemplate?: Function | ReactNode,
    ariaAttributes?: ListAriaAttributes,
    parentClass?: string,
    itemClassName?: string,
) =>
UseListItemResult = (item: { [key: string]: Object } | string | number,
                     fields?: FieldsMapping,
                     index?: number,
                     focusedItemIndex?: number,
                     itemTemplate?: Function | ReactNode,
                     groupTemplate?: Function | ReactNode,
                     ariaAttributes?: ListAriaAttributes,
                     parentClass?: string,
                     itemClassName?: string): UseListItemResult => {
    const mergedFields: FieldsMapping = useMemo(() => ({ ...defaultMappedFields, ...fields }), [fields]);

    const fieldData: { [key: string]: Object } = useMemo(() => (
        getFieldValues(item, mergedFields) as { [key: string]: Object }
    ), [item, mergedFields]);

    const uid: string = useMemo(
        () => {
            const idVal: string | number | undefined = fieldData[String(mergedFields.id)] as string | number | undefined;
            return (idVal != null && String(idVal) !== '') ? String(idVal) : getUniqueID('listitem');
        },
        [fieldData, mergedFields.id]
    );

    const grpLI: boolean = useMemo(
        () => Boolean(Object.prototype.hasOwnProperty.call(item, 'isHeader') && fieldData.isHeader),
        [item]
    );



    const displayText: string = useMemo(() => (
        (fieldData[String(mergedFields.text)] as string) || (mergedFields.id && fieldData[String(mergedFields.id)] ? fieldData[String(mergedFields.id)].toString() : '')
    ), [mergedFields.text, mergedFields.id, fieldData]);

    const hasIcon: boolean = useMemo(() => {
        return String(mergedFields.icon) in fieldData && !isNullOrUndefined(fieldData[String(mergedFields.icon)]);
    }, [fieldData, mergedFields.icon]);

    const hasImage: boolean = useMemo(() => (
        Boolean(fieldData[String(mergedFields.imageUrl)])
    ), [fieldData, mergedFields.imageUrl]);

    const hasUrl: boolean = useMemo(() => (Boolean(fieldData[String(mergedFields.url)])), [fieldData, mergedFields.url]);

    const templateContent: ReactNode = useMemo(() => {
        if (!grpLI && itemTemplate) {
            return typeof itemTemplate === 'function' ? itemTemplate(item) : itemTemplate;
        } else if (grpLI && groupTemplate) {
            return typeof groupTemplate === 'function' ? groupTemplate(item) : groupTemplate;
        }
        return null;
    }, [grpLI, groupTemplate, itemTemplate, item]);

    const className: string = useMemo(() => {
        const classes: string[] = [
            grpLI ? GROUP_CLASS : LI_CLASS,
            grpLI && index === 0 ? 'sf-list-group-first-item' : '',
            `${LEVEL_CLASS}-${ariaAttributes?.level ?? 1}`,
            fieldData && !isNullOrUndefined(fieldData[String(mergedFields.disabled)]) && (fieldData[String(mergedFields.disabled)]).toString() === 'true' ? DISABLED_CLASS : '',
            (parentClass ? itemClassName ?? '' : index === focusedItemIndex ? 'sf-active' : '') || '',
            fieldData && fieldData[String(mergedFields.url)] ? NAVIGABLE_CLASS : '',
            fieldData && !isNullOrUndefined(fieldData[String(mergedFields.visible)]) && (fieldData[String(mergedFields.visible)]).toString() === 'false' ? 'sf-display-none' : '',
            ''
        ];
        return classes.filter(Boolean).join(' ').trim();
    }, [grpLI, ariaAttributes?.level, fieldData, mergedFields.disabled,
        parentClass, itemClassName, index, focusedItemIndex]);

    const baseLiProps: LiHTMLAttributes<HTMLLIElement> = useMemo(() => {
        const props: LiHTMLAttributes<HTMLLIElement> = {
            className,
            role: (ariaAttributes?.groupItemRole !== '' && ariaAttributes?.itemRole !== '') ? (grpLI ? ariaAttributes?.groupItemRole : ariaAttributes?.itemRole) : undefined,
            'aria-level': ariaAttributes?.groupItemRole === 'presentation' || ariaAttributes?.itemRole === 'presentation' ? undefined : ariaAttributes?.level
        };

        if (!isNullOrUndefined(fieldData)) {
            if (!isNullOrUndefined(fieldData[String(mergedFields.tooltip)])) {
                props.title = String(fieldData[String(mergedFields.tooltip)]);
            }
        }
        return props;
    }, [className, ariaAttributes, grpLI, mergedFields, index, fieldData]);

    const liProps: LiHTMLAttributes<HTMLLIElement> = useMemo(() => {
        if (!fieldData || !Object.prototype.hasOwnProperty.call(fieldData, String(mergedFields.htmlAttributes))
                || !fieldData[String(mergedFields.htmlAttributes)]) {
            return baseLiProps;
        }
        let updatedProps: LiHTMLAttributes<HTMLLIElement> = { ...baseLiProps };
        const htmlAttributes: HTMLAttributes<HTMLLIElement> =
                fieldData[String(mergedFields.htmlAttributes)];
        const { className, style, ...restProps } = htmlAttributes;
        if (className) {
            updatedProps.className = `${updatedProps.className || ''} ${className}`.trim();
        }
        if (style) {
            updatedProps.style = { ...updatedProps.style, ...style };
        }
        updatedProps = { ...updatedProps, ...restProps };
        return updatedProps;
    }, [baseLiProps, fieldData, mergedFields.htmlAttributes]);

    return {
        mergedFields, fieldData, uid, grpLI, liProps,
        displayText, hasIcon, hasImage, hasUrl, templateContent, ariaAttributes
    };
};

