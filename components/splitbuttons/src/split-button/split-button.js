import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { Button, IconPosition } from '@syncfusion/react-buttons';
import { preRender, useProviderContext } from '@syncfusion/react-base';
import { DropDownButton } from '../dropdown-button/dropdown-button';
/**
 * The SplitButton component provides a combination of a default button action and a dropdown menu, enabling users to quickly access additional options or actions in a compact interface.
 *
 * ```typescript
 * <SplitButton items={menuItems} icon={profileIcon} iconPosition={IconPosition.Right}>Default Action</SplitButton>
 * ```
 */
export const SplitButton = forwardRef((props, ref) => {
    const { className = '', icon, iconPosition = IconPosition.Left, items = [], popupWidth = 'auto', disabled = false, target, lazyOpen = false, children, itemTemplate, color, variant, size, onOpen, onClose, onSelect, ...domProps } = props;
    const buttonRef = useRef(null);
    const dropDownRef = useRef(null);
    const wrapperRef = useRef(null);
    const [targetElement, setTargetElement] = useState(null);
    const { dir } = useProviderContext();
    useEffect(() => {
        if (wrapperRef.current) {
            setTargetElement(wrapperRef);
        }
    }, []);
    const publicAPI = {
        iconPosition,
        icon,
        target,
        popupWidth,
        items,
        lazyOpen,
        itemTemplate,
        color,
        variant,
        size
    };
    useEffect(() => {
        preRender('splitButton');
    }, []);
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        toggle: () => {
            if (dropDownRef.current && dropDownRef.current.toggle) {
                dropDownRef.current.toggle();
            }
        },
        element: buttonRef.current?.element
    }), [publicAPI]);
    const wrapperClassName = [
        'sf-split-btn-wrapper',
        variant ? `sf-${variant.toLowerCase()}` : '',
        className,
        dir === 'rtl' ? 'sf-rtl' : ''
    ].filter(Boolean).join(' ');
    return (_jsx(_Fragment, { children: _jsxs("div", { ref: wrapperRef, className: wrapperClassName, children: [_jsx(Button, { ref: buttonRef, className: `${className} ${(dir === 'rtl') ? 'sf-rtl' : ''} sf-control sf-lib sf-btn sf-split-btn sf-keyboard`, icon: icon, color: color, variant: variant, size: size, iconPosition: iconPosition, disabled: disabled, ...domProps, children: children }), _jsx(DropDownButton, { ref: dropDownRef, relateTo: targetElement?.current, target: target || targetElement || undefined, className: `${className} ${(dir === 'rtl') ? 'sf-rtl' : ''} sf-icon-btn sf-control sf-dropdown-btn sf-lib sf-btn`, items: items, color: color, variant: variant, size: size, itemTemplate: itemTemplate, disabled: disabled, popupWidth: popupWidth, lazyOpen: lazyOpen, onOpen: onOpen, onClose: onClose, onSelect: onSelect })] }) }));
});
export default SplitButton;
