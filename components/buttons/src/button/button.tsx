import { useEffect, useRef, useState, useImperativeHandle, forwardRef, ButtonHTMLAttributes, Ref } from 'react';
import { preRender, useProviderContext, useRippleEffect, Color, Size, Variant, Position } from '@syncfusion/react-base';
import { ChevronDownFillIcon } from '@syncfusion/react-icons';
import * as React from 'react';
export {  Color, Size, Variant, Position };

/**
 * Button component properties interface.
 * Extends standard HTMLButtonElement attributes.
 */
export interface ButtonProps {
    /**
     * Specifies the position of the icon relative to the button text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default Position.Left
     */
    iconPosition?: Position;

    /**
     * Defines an icon for the button, which can either be a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: React.ReactNode;

    /**
     * Indicates whether the button functions as a toggle button. If true, the button can switch between active and inactive states each time it is clicked.
     *
     * @default false
     */
    toggleable?: boolean;

    /**
     * Sets the initial selected state for a toggle button. When true, the button is initially rendered in a 'selected' or 'active' state, otherwise it's inactive.
     *
     * @default false
     */
    selected?: boolean;

    /**
     * Specifies the Color style of the button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Error', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the variant style of the button. Options include 'Outlined', 'Filled', and 'Standard'.
     *
     * @default Variant.Filled
     */
    variant?: Variant;

    /**
     * Specifies the size style of the button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Styles the button to visually appear as a hyperlink. When true, the button text is underlined.
     *
     * @default false
     */
    isLink?: boolean;

    /**
     * Specifies the dropdown button icon.
     *
     * @default false
     * @private
     */
    dropIcon?:  boolean;
}

/**
 * Interface representing the Button component methods.
 */
export interface IButton extends ButtonProps {

    /**
     * This is button component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;

}

type IButtonProps = IButton & ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * The Button component is a versatile element for creating styled buttons with functionalities like toggling, icon positioning, and HTML attribute support, enhancing interaction based on its configuration and state.
 *
 * ```typescript
 * import { Button, Color } from '@syncfusion/react-buttons';
 *
 * <Button color={Color.Success}>Submit</Button>
 * ```
 */
export const Button: React.ForwardRefExoticComponent<IButtonProps & React.RefAttributes<IButton>> =
    forwardRef<IButton, IButtonProps>((props: IButtonProps, ref: Ref<IButton>) => {
        const buttonRef: React.RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement>(null);
        const {
            disabled = false,
            iconPosition = Position.Left,
            icon,
            className = '',
            dropIcon = false,
            toggleable = false,
            selected,
            color = Color.Primary,
            variant = Variant.Filled,
            size = Size.Medium,
            isLink = false,
            onClick,
            children,
            ...domProps
        } = props;

        const [isActive, setIsActive] = useState<boolean>(selected ?? false);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, { duration: 500 });
        const publicAPI: Partial<IButton> = {
            iconPosition,
            icon,
            toggleable,
            selected,
            color,
            variant,
            size,
            isLink
        };

        const handleButtonClick: React.MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement>) => {
            if (toggleable && selected === undefined) {
                setIsActive((prevState: boolean) => !prevState);
            }
            onClick?.(event);
        };

        useEffect(() => {
            if (selected !== undefined) {
                setIsActive(selected);
            }
        }, [selected]);

        useEffect(() => {
            preRender('btn');
        }, []);

        useImperativeHandle(ref, () => ({
            ...publicAPI as IButton,
            element: buttonRef.current
        }), [publicAPI]);

        const ButtonFontSizeClass: string = size && size.toLowerCase() === 'small'
            ? 'sf-font-size-12' : size && size.toLowerCase() === 'large' ? 'sf-font-size-16' : 'sf-font-size-14';

        const classNames: string = [
            'sf-btn sf-control sf-align-center sf-radius-12',
            ButtonFontSizeClass,
            iconPosition && (iconPosition === Position.Top || iconPosition === Position.Bottom) ? 'sf-btn-vertical' : 'sf-btn-horizontal',
            className,
            dir === 'rtl' ? 'sf-rtl' : '',
            isActive ? 'sf-active' : '',
            isLink ? 'sf-btn-link' + (!props.color ? ' sf-btn-info' : '') : '',
            !icon && children && `sf-btn sf-btn-${size.toLowerCase().substring(0, 2)}`,
            icon && !dropIcon && !children && `sf-icon-btn sf-icon-btn-${size.toLowerCase().substring(0, 2)}`,
            icon && children ? `sf-icon sf-icon-${size.toLowerCase().substring(0, 2)}` : '',
            iconPosition && `sf-btn-${iconPosition.toLowerCase()}`,
            color && 'sf-btn-color',
            color && `sf-btn-${color.toLowerCase()}`,
            variant ? `sf-btn-${variant.toLowerCase() }` : '',
            size && `sf-btn-${size.toLowerCase().substring(0, 2)}`,
            disabled && 'sf-cursor-default'
        ].filter(Boolean).join(' ');

        return (
            <button
                ref={buttonRef}
                type='button'
                className={classNames}
                onClick={handleButtonClick}
                onMouseDown={rippleMouseDown}
                disabled={disabled}
                {...domProps}
            >
                {!children && icon && (
                    <span className={`sf-btn-icon ${typeof icon === 'string' ? icon : ''}`}>
                        {typeof icon !== 'string' && icon}
                    </span>
                )}
                {children && icon && (iconPosition === 'Left' || iconPosition === 'Top') && (
                    <span className={`sf-btn-icon ${typeof icon === 'string' ? icon : ''} sf-icon-${iconPosition.toLowerCase()}`}>
                        {typeof icon !== 'string' && icon}
                    </span>
                )}
                <>
                    {icon && children ? (
                        <span className='sf-btn-content'>{children}</span>
                    ) : (
                        children
                    )}
                </>
                {children && icon && (iconPosition === 'Right' || iconPosition === 'Bottom') && (
                    <span className={`sf-btn-icon ${typeof icon === 'string' ? icon : ''} sf-icon-${iconPosition.toLowerCase()}`}>
                        {typeof icon !== 'string' && icon}
                    </span>
                )}
                {dropIcon && (
                    <span className={'sf-btn-icon sf-icons sf-icon-right sf-caret sf-content-center'} ><ChevronDownFillIcon/></span>
                )}
                {ripple && <Ripple />}
            </button>
        );
    });

export default React.memo(Button);
