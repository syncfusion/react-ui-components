import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { preRender, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import * as React from 'react';
/**
 * Specifies the position of an icon relative to text content in a button component.
 */
export var IconPosition;
(function (IconPosition) {
    /**
     * Positions the icon to the left of text content in a button.
     */
    IconPosition["Left"] = "Left";
    /**
     * Positions the icon to the right of text content in a button.
     */
    IconPosition["Right"] = "Right";
    /**
     * Positions the icon above text content in a button.
     */
    IconPosition["Top"] = "Top";
    /**
     * Positions the icon below text content in a button.
     */
    IconPosition["Bottom"] = "Bottom";
})(IconPosition || (IconPosition = {}));
/**
 * Specifies the type of Color to display the Button with distinctive colors.
 */
export var Color;
(function (Color) {
    /**
     * The button is displayed with colors that indicate success.
     */
    Color["Success"] = "Success";
    /**
     * The button is displayed with colors that indicate information.
     */
    Color["Info"] = "Info";
    /**
     * The button is displayed with colors that indicate a warning.
     */
    Color["Warning"] = "Warning";
    /**
     * The button is displayed with colors that indicate danger.
     */
    Color["Danger"] = "Danger";
    /**
     * The button is displayed with colors that indicate it is a primary button.
     */
    Color["Primary"] = "Primary";
    /**
     * The button is displayed with colors that indicate it is a secondary button.
     */
    Color["Secondary"] = "Secondary";
})(Color || (Color = {}));
/**
 * Defines the visual style variants for a button component, controlling background, border, and text appearance.
 */
export var Variant;
(function (Variant) {
    /**
     * Displays a solid background color with contrasting text.
     */
    Variant["Filled"] = "Filled";
    /**
     * Displays a border with a transparent background and colored text.
     */
    Variant["Outlined"] = "Outlined";
    /**
     * Displays only colored text without background and border.
     */
    Variant["Flat"] = "Flat";
})(Variant || (Variant = {}));
/**
 * Specifies the size of the Button for layout purposes.
 */
export var Size;
(function (Size) {
    /**
     * The button is displayed in a smaller size.
     */
    Size["Small"] = "Small";
    /**
     * The button is displayed in a medium size.
     */
    Size["Medium"] = "Medium";
    /**
     * The button is displayed in a larger size.
     */
    Size["Large"] = "Large";
})(Size || (Size = {}));
/**
 * The Button component is a versatile element for creating styled buttons with functionalities like toggling, icon positioning, and HTML attribute support, enhancing interaction based on its configuration and state.
 *
 * ```typescript
 * <Button color={Color.Success}>Submit</Button>
 * ```
 */
export const Button = forwardRef((props, ref) => {
    const buttonRef = useRef(null);
    const { disabled = false, iconPosition = IconPosition.Left, icon, className = '', togglable = false, selected, color = Color.Primary, variant = Variant.Filled, size, isLink = false, onClick, children, ...domProps } = props;
    const [isActive, setIsActive] = useState(selected ?? false);
    const { dir, ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { duration: 500 });
    const publicAPI = {
        iconPosition,
        icon,
        togglable,
        selected,
        color,
        variant,
        size,
        isLink
    };
    const handleButtonClick = (event) => {
        if (togglable && selected === undefined) {
            setIsActive((prevState) => !prevState);
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
        ...publicAPI,
        element: buttonRef.current
    }), [publicAPI]);
    const classNames = [
        'sf-btn',
        className,
        dir === 'rtl' ? 'sf-rtl' : '',
        isActive ? 'sf-active' : '',
        isLink ? 'sf-link' : '',
        color && color.toLowerCase() !== 'secondary' ? `sf-${color.toLowerCase()}` : '',
        variant && color.toLowerCase() !== 'secondary' ? `sf-${variant.toLowerCase()}` : '',
        size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : ''
    ].filter(Boolean).join(' ');
    return (_jsxs("button", { ref: buttonRef, type: 'button', className: classNames, onClick: handleButtonClick, onMouseDown: rippleMouseDown, disabled: disabled, ...domProps, children: [!children && (_jsx("span", { className: `sf-btn-icon ${typeof icon === 'string' ? icon : ''}`, children: typeof icon !== 'string' && icon })), children && icon && (iconPosition === 'Left' || iconPosition === 'Top') && (_jsx("span", { className: `sf-btn-icon ${typeof icon === 'string' ? icon : ''} sf-icon-${iconPosition.toLowerCase()}`, children: typeof icon !== 'string' && icon })), children, children && icon && (iconPosition === 'Right' || iconPosition === 'Bottom') && (_jsx("span", { className: `sf-btn-icon ${typeof icon === 'string' ? icon : ''} sf-icon-${iconPosition.toLowerCase()}`, children: typeof icon !== 'string' && icon })), ripple && _jsx(Ripple, {})] }));
});
export default React.memo(Button);
