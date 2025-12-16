import * as React from 'react';
import { useProviderContext, useRippleEffect, isNullOrUndefined } from '@syncfusion/react-base';
import { CSSCheckbox } from '@syncfusion/react-buttons';
import { ChevronRightIcon } from '@syncfusion/react-icons';
import { useListItem, UseListItemResult } from './useListItem';
import { FieldsMapping } from './types';
import { ListItemsCommonProps } from './listItems';

const ICON_CLASS: string = 'sf-list-icon';
const TEXT_CLASS: string = 'sf-list-text';
const URL_CLASS: string = 'sf-list-url';
const IMAGE_CLASS: string = 'sf-list-img';
const ANCHOR_WRAP_CLASS: string = 'sf-anchor-wrap';

/**
 * Interface for ListItem component props
 */
interface ListItemProps extends Omit<React.HTMLAttributes<HTMLLIElement>, 'onClick' | 'onKeyDown'>, ListItemsCommonProps {
    item: { [key: string]: Object } | string | number;
    fields: FieldsMapping;
    onItemClick?: (e: React.MouseEvent<HTMLLIElement>, index: number) => void;
    index: number;
    focusedIndex?: number;
}

/**
 * A component that renders a item in a list.
 */
export const ListItem: React.FC<ListItemProps & React.RefAttributes<HTMLElement>> = React.memo(({
    item,
    fields,
    index,
    focusedIndex,
    virtualization,
    parentClass,
    itemTemplate,
    groupTemplate,
    ariaAttributes,
    checkBox,
    checkBoxPosition,
    onItemClick,
    onItemKeyDown,
    getItemProps,
    ...restProps
}: ListItemProps): React.ReactElement | null => {

    if (isNullOrUndefined(item)) {
        return null;
    }
    const { ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple);

    const {className, ...extraProps} = React.useMemo<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>(() => {
        return getItemProps?.({ item, index }) || {};
    }, [getItemProps, item, index]);

    const model: UseListItemResult = useListItem(item, fields, index, focusedIndex as number, itemTemplate,
                                                 groupTemplate, ariaAttributes, checkBox, parentClass, virtualization, className);
    const ParentTag: 'div' | 'li' = (virtualization ? 'div' : 'li') as 'div' | 'li';

    const handleClick: React.MouseEventHandler<HTMLLIElement> = React.useCallback((e: React.MouseEvent<HTMLLIElement, MouseEvent>) => {
        onItemClick?.(e, index);
    }, [onItemClick, index]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLLIElement> = React.useCallback((e: React.KeyboardEvent<HTMLLIElement>) => {
        onItemKeyDown?.(e, index);
    }, [onItemKeyDown, index]);

    const baseProps: React.HTMLAttributes<HTMLElement> = {
        ...model.liProps,
        ...restProps,
        ...extraProps,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        onMouseDown: rippleMouseDown
    };

    const TextSpan: () => React.ReactNode = () => (
        <span
            className={TEXT_CLASS}
            role={model.ariaAttributes?.itemText || undefined}
        >
            {model.displayText}
        </span>
    );
    const Chevron: () => React.ReactNode = () => <ChevronRightIcon className="sf-font-size-lg" />;
    const Checkbox: ({ position }: { position: 'Left' | 'Right'; }) => React.ReactNode = ({ position }: { position: 'Left' | 'Right' }) => (
        <CSSCheckbox
            className={`sf-listview-checkbox sf-checkbox-${position.toLowerCase()}`}
            checked={model.checked}
            aria-checked={model.checked.toString()}
            aria-label={model.displayText}
        />
    );
    const IconImage: () => React.ReactNode = () => (
        <>
            {model.hasIcon && (
                <div className={ICON_CLASS}>
                    {model.fieldData[model.mergedFields.icon as keyof typeof model.fieldData] as React.ReactNode}
                </div>
            )}
            {model.hasImage && (
                <img className={IMAGE_CLASS} src={model.fieldData[model.mergedFields.imageUrl as string] as string} alt="Icon" />
            )}
        </>
    );

    return (
        <ParentTag key={model.uid} data-uid={model.uid} data-value={model.dataValue || undefined} {...baseProps}>
            {model.templateContent ? (model.templateContent) : (
                <>
                    {parentClass && model.displayText}
                    {!parentClass && (
                        <div
                            className='sf-list-text-content'
                            role={model.ariaAttributes?.wrapperRole || undefined}
                        >
                            {model.hasUrl ? (
                                <a className={`${TEXT_CLASS} ${URL_CLASS}`} href={model.fieldData[model.mergedFields.url as string] as string}>
                                    <div className={ANCHOR_WRAP_CLASS}>
                                        <IconImage />
                                        {model.displayText}
                                        {model.hasChild && <Chevron />}
                                    </div>
                                </a>
                            ) : (
                                <>
                                    <IconImage />
                                    {!model.fieldData['isHeader'] && checkBox && (
                                        checkBoxPosition === 'Left' ? (
                                            <>
                                                <Checkbox position="Left" />
                                                <TextSpan />
                                                {model.hasChild && <Chevron />}
                                            </>
                                        ) : (
                                            <>
                                                <TextSpan />
                                                <Checkbox position="Right" />
                                                {model.hasChild && <Chevron />}
                                            </>
                                        )
                                    )}

                                    {!checkBox && (
                                        <>
                                            <TextSpan />
                                            {model.hasChild && <Chevron />}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
            {!model.grpLI && ripple && <Ripple />}
        </ParentTag>
    );
});
