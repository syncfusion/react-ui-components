import { forwardRef, ForwardRefExoticComponent, HTMLAttributes, memo, ReactNode, Ref, RefAttributes, RefObject,
    useCallback, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, MouseEventHandler, KeyboardEventHandler,
    FocusEventHandler, type MouseEvent, type KeyboardEvent
} from 'react';
import { preRender, useProviderContext, useRippleEffect, Size } from '@syncfusion/react-base';
import { CheckTickIcon, CloseIcon } from '@syncfusion/react-icons';
export { Size };

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
    avatar?: ReactNode;

    /**
     * Specifies the leading icon CSS class or React node for the Chip.
     *
     * @default -
     */
    leadingIcon?: ReactNode;

    /**
     * Specifies the trailing icon CSS or React node for the Chip.
     *
     * @default -
     */
    trailingIcon?: ReactNode;

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

    /**
     * Specifies the icon element to indicate the chip’s selected state.
     * When provided, replaces the default selection indicator.
     *
     * @default -
     */
    selectIcon?: ReactNode;

    /**
     * Specifies the icon element to render for the chip's remove action.
     * When provided, replaces the default close/remove icon.
     *
     * @default -
     */
    removeIcon?: ReactNode;

    /**
     * Specifies the size of the Chip. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
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
    event: MouseEvent | KeyboardEvent;
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
export const Chip: ForwardRefExoticComponent<ChipComponentProps & RefAttributes<IChip>> =
memo(forwardRef<IChip, ChipProps>((props: ChipComponentProps, ref: Ref<IChip>) => {
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
        size = Size.Medium,
        onDelete,
        onClick,
        selectIcon= <CheckTickIcon/>,
        removeIcon= <CloseIcon/>,
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
        color,
        size,
        selectIcon,
        removeIcon
    };

    const chipRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const { dir, ripple } = useProviderContext();
    const IconClasses: string = 'sf-content-center sf-overflow-hidden';
    const { rippleMouseDown, Ripple} = useRippleEffect(ripple);

    useLayoutEffect(() => {
        preRender('chip');
    }, []);

    useImperativeHandle(ref, () => ({
        ...publicAPI as IChip,
        element: chipRef.current
    }));

    const handleDelete: (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => void =
    useCallback((e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
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

    const handleSpanDelete: MouseEventHandler<HTMLSpanElement>  = useCallback((e: MouseEvent<HTMLSpanElement>) => {
        if (removable) {
            handleDelete(e as unknown as MouseEvent<HTMLDivElement>);
        }
    }, [removable, handleDelete]);

    const handleClick: MouseEventHandler<HTMLDivElement>  =
    useCallback((e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
        if (onClick) {
            onClick(e as MouseEvent<HTMLDivElement>);
        }
    }, [onClick, text, props]);

    const handleKeyDown: KeyboardEventHandler<HTMLDivElement>  = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
        case 'Enter':
        case ' ':
            e.preventDefault();
            handleClick(e as unknown as MouseEvent<HTMLDivElement>);
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

    const handleFocus: FocusEventHandler<HTMLDivElement> = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur: FocusEventHandler<HTMLDivElement> = useCallback(() => {
        setIsFocused(false);
    }, []);

    const chipClassName: string = useMemo(() => {
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
            color ? `sf-${color.toLowerCase()}` : '',
            avatar || leadingIcon || leadingIconUrl ? 'sf-chip-has-icon' : '',
            size ? `sf-chip-${size.toLowerCase()}` : ''
        ].filter(Boolean).join(' ');
    }, [className, disabled, dir, avatar, leadingIcon, isFocused, variant, color, size]);

    const avatarClasses: string = useMemo(() => {
        return [
            'sf-chip-avatar',
            IconClasses,
            typeof avatar === 'string' ? avatar : ''
        ].filter(Boolean).join(' ');
    }, [avatar]);

    const trailingIconClasses: string = useMemo(() => {
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
                    {selectIcon}
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
                        removeIcon
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
