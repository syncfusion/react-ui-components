import { forwardRef, HTMLAttributes, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { preRender, useProviderContext, SvgIcon, useRippleEffect } from '@syncfusion/react-base';
import * as React from 'react';

/**
 * Represents the variant types for the Chip component.
 */
export type ChipVariant = 'Filled' | 'Outlined';

/**
 * Represents the color types for the Chip component.
 */
export type ChipColor = 'Primary' | 'Info' | 'Error' | 'Success' | 'Warning';

/**
 * Represents the model for the Chip component.
 *
 */
export interface ChipBaseProps {
    /**
     * Specifies the text content for the Chip.
     *
     * @default -
     */
    text?: string;

    /**
     * Defines the value of the Chip.
     *
     * @default -
     */
    value?: string | number;

    /**
     * Specifies the icon CSS class or React node for the avatar in the Chip.
     *
     * @default -
     */
    avatar?: React.ReactNode;

    /**
     * Specifies the leading icon CSS class or React node for the Chip.
     *
     * @default -
     */
    leadingIcon?: React.ReactNode;

    /**
     * Specifies the trailing icon CSS or React node for the Chip.
     *
     * @default -
     */
    trailingIcon?: React.ReactNode;

    /**
     * Specifies whether the Chip component is disabled or not.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the leading icon url for the Chip.
     *
     * @default -
     */
    leadingIconUrl?: string;

    /**
     * Specifies the trailing icon url for the Chip.
     *
     * @default -
     */
    trailingIconUrl?: string;

    /**
     * Specifies whether the Chip is removable.
     *
     * @default false
     */
    removable?: boolean;

    /**
     * Specifies the variant of the Chip, either 'filled' or 'outlined'.
     *
     * @default 'filled'
     */
    variant?: ChipVariant;

    /**
     * Specifies the color of the Chip, one of 'Primary', 'Info', 'Error', 'Success', or 'Warning'.
     *
     * @default -
     */
    color?: ChipColor;
}

/**
 * Represents the props for the Chip component.
 *
 * @ignore
 */
export interface ChipProps extends ChipBaseProps {

    /**
     * Event handler for the delete action.
     *
     * @event onDelete
     */
    onDelete?: (event: ChipDeleteEvent) => void;
}

/**
 * Represents the arguments for the delete event of a Chip.
 */
export interface ChipDeleteEvent {
    /**
     * Specifies the data associated with the deleted Chip.
     */
    data: ChipBaseProps;

    /**
     * Specifies the event that triggered the delete action.
     */
    event: React.MouseEvent | React.KeyboardEvent;
}

/**
 * Represents the interface for the Chip component.
 */
export interface IChip extends ChipProps {
    /**
     * Specifies the Chip component element.
     *
     * @private
     */
    element?: HTMLDivElement | null;
}

type ChipComponentProps = ChipProps & HTMLAttributes<HTMLDivElement>;

/**
 * The Chip component represents information in a compact form, such as entity attribute, text, or action.
 *
 * ```typescript
 * import { Chip } from "@syncfusion/react-buttons";
 *
 * <Chip color="Primary" removable={true}>Anne</Chip>
 * ```
 */
export const Chip: React.ForwardRefExoticComponent<ChipComponentProps & React.RefAttributes<IChip>> =
React.memo(forwardRef<IChip, ChipProps>((props: ChipComponentProps, ref: React.Ref<IChip>) => {
    const {
        value,
        text,
        avatar,
        leadingIcon,
        trailingIcon,
        className,
        disabled = false,
        leadingIconUrl,
        trailingIconUrl,
        children,
        removable,
        variant = 'Filled',
        color,
        onDelete,
        onClick,
        ...otherProps
    } = props;

    const publicAPI: Partial<IChip> = {
        value,
        text,
        avatar,
        leadingIcon,
        trailingIcon,
        disabled,
        leadingIconUrl,
        trailingIconUrl,
        removable,
        variant,
        color
    };

    const chipRef: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const { dir, ripple } = useProviderContext();
    const closeIcon: string = 'M10.5858 12.0001L2.58575 4.00003L3.99997 2.58582L12 10.5858L20 2.58582L21.4142 4.00003L13.4142 12.0001L21.4142 20L20 21.4142L12 13.4143L4.00003 21.4142L2.58581 20L10.5858 12.0001Z';
    const selectIcon: string = 'M21.4142 6L9.00003 18.4142L2.58582 12L4.00003 10.5858L9.00003 15.5858L20 4.58578L21.4142 6Z';
    const IconClasses: string = 'sf-content-center sf-overflow-hidden';
    const { rippleMouseDown, Ripple} = useRippleEffect(ripple);

    useLayoutEffect(() => {
        preRender('chip');
    }, []);

    useImperativeHandle(ref, () => ({
        ...publicAPI as IChip,
        element: chipRef.current
    }));

    const handleDelete: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void =
    React.useCallback((e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
        if (!removable) {return; }
        e.stopPropagation();
        const eventArgs: ChipDeleteEvent = {
            event: e,
            data: props
        };

        if (onDelete) {
            onDelete(eventArgs);
        }
    }, [onDelete, text, props]);

    const handleSpanDelete: React.MouseEventHandler<HTMLSpanElement>  = React.useCallback((e: React.MouseEvent<HTMLSpanElement>) => {
        if (removable) {
            handleDelete(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
    }, [removable, handleDelete]);

    const handleClick: React.MouseEventHandler<HTMLDivElement>  =
    React.useCallback((e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
        if (onClick) {
            onClick(e as React.MouseEvent<HTMLDivElement>);
        }
    }, [onClick, text, props]);

    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement>  = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
            break;
        case 'Delete':
        case 'Backspace':
            if (removable) {
                e.preventDefault();
                handleDelete(e);
            }
            break;
        }
    }, [removable, handleClick, handleDelete]);

    const handleFocus: React.FocusEventHandler<HTMLDivElement> = React.useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur: React.FocusEventHandler<HTMLDivElement> = React.useCallback(() => {
        setIsFocused(false);
    }, []);

    const chipClassName: string = React.useMemo(() => {
        if (className?.includes('sf-chip')) {
            return className;
        }
        return [
            'sf-chip sf-control sf-chip-list',
            className,
            disabled ? `sf-disabled sf-chip-${color ? 'variant' : 'invariant'}-disabled` : '',
            dir === 'rtl' ? 'sf-rtl' : '',
            avatar ? 'sf-chip-avatar-wrap' :
                leadingIcon ? 'sf-chip-icon-wrap' : '',
            isFocused ? 'sf-focused' : '',
            variant === 'Outlined' ? 'sf-outline' : '',
            color ? `sf-${color.toLowerCase()}` : ''
        ].filter(Boolean).join(' ');
    }, [className, disabled, dir, avatar, leadingIcon, isFocused, variant, color]);

    const avatarClasses: string = React.useMemo(() => {
        return [
            'sf-chip-avatar',
            IconClasses,
            typeof avatar === 'string' ? avatar : ''
        ].filter(Boolean).join(' ');
    }, [avatar]);

    const trailingIconClasses: string = React.useMemo(() => {
        return [
            trailingIconUrl && !removable ? 'sf-chip-trailing-url' : 'sf-chip-delete',
            IconClasses,
            removable ? 'sf-dlt-btn' : (typeof trailingIcon === 'string' ? trailingIcon : '')
        ].filter(Boolean).join(' ');
    }, [trailingIconUrl, removable, trailingIcon]);

    return (
        <div
            ref={chipRef}
            className={chipClassName}
            tabIndex={disabled ? -1 : 0}
            role="button"
            aria-disabled={disabled ? 'true' : 'false'}
            aria-label={text ? text : undefined}
            data-value={value ? value.toString() : undefined}
            onClick={handleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={rippleMouseDown}
            {...otherProps}
        >
            {chipClassName.includes('sf-selectable') && (
                <span className='sf-chip-selectable-icon sf-content-center'>
                    <SvgIcon d={ selectIcon }></SvgIcon>
                </span>
            )}
            {(avatar) && (
                <span className={avatarClasses}>
                    {typeof avatar !== 'string' && avatar}
                </span>
            )}
            {(leadingIcon && !avatar) && (
                typeof leadingIcon === 'string' ?
                    <span className={`sf-chip-icon ${leadingIcon} ${IconClasses}`}></span> :
                    <span className={`sf-chip-icon ${IconClasses}`}>{leadingIcon}</span>
            )}
            {(leadingIconUrl && !leadingIcon && !avatar) && (
                <span className={`sf-chip-avatar sf-chip-image ${IconClasses}`}>
                    {leadingIconUrl && (<img className='sf-chip-leading-image' src={leadingIconUrl} alt="leading image" />)}
                </span>
            )}
            {children ? (<div className="sf-chip-template sf-display-inline-flex">{children}</div>) : text ? (<span className="sf-chip-text sf-ellipsis">{text}</span>) : null}
            {(trailingIcon || trailingIconUrl || removable) && (
                <span
                    className={trailingIconClasses}
                    onClick={handleSpanDelete}
                >
                    {removable && (
                        <SvgIcon d={closeIcon} ></SvgIcon>
                    )}
                    {!removable && typeof trailingIcon !== 'string' && trailingIcon}
                    {!removable && trailingIconUrl && (
                        <img className='sf-chip-trailing-image' src={trailingIconUrl} alt="trailing image"/>
                    )}
                </span>
            )}
            {ripple && <Ripple />}
        </div>
    );
}));

export default Chip;
