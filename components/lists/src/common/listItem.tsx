import { CSSProperties, ElementType, FC, HTMLAttributes, KeyboardEventHandler, memo, MouseEventHandler, ReactElement, ReactNode, RefAttributes, useCallback, useMemo, type KeyboardEvent, type MouseEvent } from 'react';
import { useProviderContext, useRippleEffect, isNullOrUndefined } from '@syncfusion/react-base';
import { useListItem, UseListItemResult } from './useListItem';
import { ListItemBaseProps } from './listItems';

const ICON_CLASS: string = 'sf-list-icon';
const TEXT_CLASS: string = 'sf-list-text';
const URL_CLASS: string = 'sf-list-url';
const IMAGE_CLASS: string = 'sf-list-img';
const ANCHOR_WRAP_CLASS: string = 'sf-anchor-wrap';

/**
 * Interface for ListItem component props
 */
interface ListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onClick' | 'onKeyDown'>, ListItemBaseProps {
    item: { [key: string]: Object } | string | number;
    index: number;
    focusedIndex?: number;
    as?: ElementType
    onItemClick?: (e: MouseEvent<HTMLLIElement>, index: number) => void;
}

/**
 * A component that renders a item in a list.
 */
export const ListItem: FC<ListItemProps & RefAttributes<HTMLElement>> = memo(({
    item,
    fields,
    index,
    focusedIndex,
    parentClass,
    itemTemplate,
    groupTemplate,
    ariaAttributes,
    as,
    onItemClick,
    onItemKeyDown,
    getItemProps,
    ...restProps
}: ListItemProps): ReactElement | null => {

    if (isNullOrUndefined(item)) {
        return null;
    }
    const { ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple);

    const {className, ...extraProps} = useMemo<HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>>(() => {
        return getItemProps?.({ item, index }) || {};
    }, [getItemProps, item, index]);

    const model: UseListItemResult = useListItem(item, fields, index, focusedIndex, itemTemplate, groupTemplate,
                                                 ariaAttributes, parentClass, className);
    const ParentTag: ElementType = as ?? 'li';

    const handleClick: MouseEventHandler<HTMLLIElement> = useCallback((e: MouseEvent<HTMLLIElement>) => {
        onItemClick?.(e, index);
    }, [onItemClick, index]);

    const handleKeyDown: KeyboardEventHandler<HTMLLIElement> = useCallback((e: KeyboardEvent<HTMLLIElement>) => {
        onItemKeyDown?.(e, index);
    }, [onItemKeyDown, index]);

    const combinedStyle: CSSProperties = useMemo(() => {
        const liPropsStyle: CSSProperties | undefined = model.liProps?.style;
        const restPropsStyle: CSSProperties | undefined = restProps?.style;
        const extraPropsStyle: CSSProperties | undefined = extraProps?.style;
        if (!liPropsStyle && !restPropsStyle && !extraPropsStyle) {
            return undefined as unknown as CSSProperties;
        }
        return { ...(liPropsStyle || {}), ...(restPropsStyle || {}), ...(extraPropsStyle || {}) };
    }, [model.liProps?.style, restProps?.style, extraProps?.style]);

    const baseProps: HTMLAttributes<HTMLElement> = {
        ...model.liProps,
        ...restProps,
        ...extraProps,
        style: combinedStyle,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
        onMouseDown: rippleMouseDown
    };

    const TextSpan: () => ReactNode = () => (
        <span
            className={TEXT_CLASS}
        >
            {model.displayText}
        </span>
    );
    const IconImage: () => ReactNode = () => (
        <>
            {model.hasIcon && (
                <div className={ICON_CLASS}>
                    {model.fieldData[String(model.mergedFields.icon)] as ReactNode}
                </div>
            )}
            {model.hasImage && (
                <img className={IMAGE_CLASS} src={String(model.fieldData[String(model.mergedFields.imageUrl)])} alt="Icon" />
            )}
        </>
    );

    return (
        <ParentTag key={model.uid} data-value={model.uid} data-index={index} {...baseProps}>
            {model.templateContent ? (model.templateContent) : (
                <>
                    {parentClass && model.displayText}
                    {!parentClass && (
                        <div className='sf-list-text-content'>
                            {model.hasUrl ? (
                                <a className={`${TEXT_CLASS} ${URL_CLASS}`} href={String(model.fieldData[String(model.mergedFields.url)])}>
                                    <div className={ANCHOR_WRAP_CLASS}>
                                        <IconImage />
                                        {model.displayText}
                                    </div>
                                </a>
                            ) : (
                                <>
                                    <IconImage />
                                    <>
                                        <TextSpan />
                                    </>
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
