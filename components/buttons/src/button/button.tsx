import { useEffect, useRef, useState, useImperativeHandle, forwardRef, ButtonHTMLAttributes, Ref } from 'react';
import { preRender, SvgIcon, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import * as React from 'react';

/**
 * Defines the label position of the component.
 * ```props
 * After :- When the label is positioned After, it appears to the right of the component.
 * Before :- When the label is positioned Before, it appears to the left of the component.
 * ```
 */
export type LabelPlacement = 'After' | 'Before' | 'Bottom';

/**
 * Specifies the position of an icon relative to text content in a button component.
 */
export enum IconPosition {
    /**
     * Positions the icon to the left of text content in a button.
     */
    Left = 'Left',

    /**
     * Positions the icon to the right of text content in a button.
     */
    Right = 'Right',

    /**
     * Positions the icon above text content in a button.
     */
    Top = 'Top',

    /**
     * Positions the icon below text content in a button.
     */
    Bottom = 'Bottom',
}

/**
 * Specifies the type of Color to display the Button with distinctive colors.
 */
export enum Color {
    /**
     * The button is displayed with colors that indicate success.
     */
    Success = 'Success',
    /**
     * The button is displayed with colors that indicate information.
     */
    Info = 'Info',
    /**
     * The button is displayed with colors that indicate a warning.
     */
    Warning = 'Warning',
    /**
     * The button is displayed with colors that indicate danger.
     */
    Danger = 'Danger',
    /**
     * The button is displayed with colors that indicate it is a primary button.
     */
    Primary = 'Primary',
    /**
     * The button is displayed with colors that indicate it is a secondary button.
     */
    Secondary = 'Secondary'
}

/**
 * Defines the visual style variants for a button component, controlling background, border, and text appearance.
 */
export enum Variant {
    /**
     * Displays a solid background color with contrasting text.
     */
    Filled = 'Filled',

    /**
     * Displays a border with a transparent background and colored text.
     */
    Outlined = 'Outlined',

    /**
     * Displays only colored text without background and border.
     */
    Flat = 'Flat'
}

/**
 * Specifies the size of the Button for layout purposes.
 */
export enum Size {
    /**
     * The button is displayed in a smaller size.
     */
    Small = 'Small',

    /**
     * The button is displayed in a medium size.
     */
    Medium = 'Medium',

    /**
     * The button is displayed in a larger size.
     */
    Large = 'Large'
}

/**
 * Button component properties interface.
 * Extends standard HTMLButtonElement attributes.
 */
export interface ButtonProps {
    /**
     * Specifies the position of the icon relative to the button text. Options include placing the icon at the left, right, top, or bottom of the button content.
     *
     * @default IconPosition.Left
     */
    iconPosition?: IconPosition;

    /**
     * Defines an icon for the button, which can either be a CSS class name for custom styling or an SVG element for rendering.
     *
     * @default -
     */
    icon?: string | React.ReactNode;

    /**
     * Indicates whether the button functions as a toggle button. If true, the button can switch between active and inactive states each time it is clicked.
     *
     * @default false
     */
    togglable?: boolean;

    /**
     * Sets the initial selected state for a toggle button. When true, the button is initially rendered in a 'selected' or 'active' state, otherwise it's inactive.
     *
     * @default false
     */
    selected?: boolean;

    /**
     * Specifies the Color style of the button. Options include 'Primary', 'Secondary', 'Warning', 'Success', 'Danger', and 'Info'.
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the variant style of the button. Options include 'Outlined', 'Filled', and 'Flat'.
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
 * <Button color={Color.Success}>Submit</Button>
 * ```
 */
export const Button: React.ForwardRefExoticComponent<IButtonProps & React.RefAttributes<IButton>> =
    forwardRef<IButton, IButtonProps>((props: IButtonProps, ref: Ref<IButton>) => {
        const buttonRef: React.RefObject<HTMLButtonElement | null> = useRef<HTMLButtonElement>(null);
        const {
            disabled = false,
            iconPosition = IconPosition.Left,
            icon,
            className = '',
            dropIcon = false,
            togglable = false,
            selected,
            color = Color.Primary,
            variant = Variant.Filled,
            size,
            isLink = false,
            onClick,
            children,
            ...domProps
        } = props;

        const [isActive, setIsActive] = useState<boolean>(selected ?? false);
        const { dir, ripple } = useProviderContext();
        const { rippleMouseDown, Ripple} = useRippleEffect(ripple, { duration: 500 });
        const caretIcon: string = 'M5 8.5L12 15.5L19 8.5';
        const publicAPI: Partial<IButton> = {
            iconPosition,
            icon,
            togglable,
            selected,
            color,
            variant,
            size,
            isLink
        };

        const handleButtonClick: React.MouseEventHandler<HTMLButtonElement> = (event: React.MouseEvent<HTMLButtonElement>) => {
            if (togglable && selected === undefined) {
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

        const classNames: string = [
            'sf-btn',
            className,
            dir === 'rtl' ? 'sf-rtl' : '',
            isActive ? 'sf-active' : '',
            isLink ? 'sf-link' : '',
            icon && !children ? 'sf-icon-btn' : '',
            iconPosition && `sf-${iconPosition.toLowerCase()}`,
            color && color.toLowerCase() !== 'secondary' ? `sf-${color.toLowerCase()}` : '',
            variant ? `sf-${variant.toLowerCase() }` : '',
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : ''
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
                        <span className='sf-content'>{children}</span>
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
                    <span className={'sf-btn-icon sf-icons sf-icon-right sf-caret'} ><SvgIcon fill='currentColor' width='16' height='16' viewBox='0 0 23 23' d={caretIcon}></SvgIcon></span>
                )}
                {ripple && <Ripple />}
            </button>
        );
    });

export default React.memo(Button);
