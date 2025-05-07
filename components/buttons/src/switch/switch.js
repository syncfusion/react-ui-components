import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useState, useEffect, useImperativeHandle, useCallback } from 'react';
import * as React from 'react';
import { preRender, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { Size } from '../button/button';
/**
 * The Switch component is a toggle switch offering a binary decision interface, visually indicating the state between on and off with optional label customization for clear communication.
 *
 * ```typescript
 * <Switch checked={true} onLabel="Enabled" offLabel="Disabled" />
 * ```
 */
export const Switch = forwardRef((props, ref) => {
    const { checked, className = '', disabled = false, name = '', onLabel = '', offLabel = '', value = '', size = Size.Medium, onChange, ...domProps } = props;
    const isControlled = checked !== undefined;
    const [isChecked, setIsChecked] = useState(() => isControlled ? !!checked : !!domProps.defaultChecked);
    const switchRef = React.useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const { dir, ripple } = useProviderContext();
    const rippleContainerRef = React.useRef(null);
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { duration: 400, isCenterRipple: true });
    const publicAPI = {
        checked,
        onLabel,
        offLabel,
        name,
        value,
        size
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: switchRef.current
    }), [isChecked, disabled, publicAPI]);
    useEffect(() => {
        if (isControlled) {
            setIsChecked(!!checked);
        }
    }, [checked, isControlled]);
    useEffect(() => {
        preRender('switch');
    }, []);
    const togglable = useCallback(() => {
        if (disabled) {
            return;
        }
        const newCheckedState = !isChecked;
        if (!isControlled) {
            setIsChecked(newCheckedState);
        }
        if (onChange) {
            const syntheticEvent = {
                ...new Event('change', { bubbles: true }),
                target: { ...switchRef.current, checked: newCheckedState, value },
                currentTarget: switchRef.current
            };
            onChange(syntheticEvent);
        }
    }, [isChecked, isControlled, onChange, disabled]);
    const handleChange = (event) => {
        if (disabled) {
            return;
        }
        const newChecked = event.target.checked;
        if (!isControlled) {
            setIsChecked(newChecked);
        }
        onChange?.(event);
    };
    const handleBlur = () => setIsFocused(false);
    const handleFocus = () => setIsFocused(true);
    const handleKeyUp = (event) => {
        if ((event.key === ' ' || event.key === 'Space') && event.target === switchRef.current) {
            event.preventDefault();
            togglable();
        }
    };
    const handleMouseDown = useCallback((e) => {
        if (ripple && rippleContainerRef.current && rippleMouseDown) {
            const syntheticEvent = {
                ...e,
                currentTarget: rippleContainerRef.current,
                target: rippleContainerRef.current,
                preventDefault: e.preventDefault,
                stopPropagation: e.stopPropagation
            };
            rippleMouseDown(syntheticEvent);
        }
    }, [ripple, rippleMouseDown]);
    const switchClasses = [
        'sf-control',
        'sf-switch',
        'sf-lib',
        isFocused ? 'sf-focus' : '',
        typeof size === 'string' ? (size.toLowerCase() === 'medium' ? '' : `sf-${size.toLowerCase() === 'large' ? 'bigger' : size.toLowerCase()}`) : '',
        className
    ].join(' ');
    return (_jsxs("div", { className: `sf-switch-wrapper ${isFocused ? 'sf-focus' : ''} ${typeof size === 'string' ? `sf-${size.toLowerCase() === 'large' ? 'bigger' : size.toLowerCase()}` : ''} ${className} ${disabled ? 'sf-switch-disabled' : ''} ${(dir === 'rtl') ? 'sf-rtl' : ''}`, onClick: () => togglable(), onMouseDown: handleMouseDown, children: [_jsx("input", { ref: switchRef, type: "checkbox", className: switchClasses, name: name, value: value, checked: isControlled ? !!checked : isChecked, disabled: disabled, onKeyUp: handleKeyUp, onFocus: handleFocus, onBlur: handleBlur, onChange: handleChange, ...domProps }), _jsxs("span", { className: `sf-switch-inner ${isChecked ? 'sf-switch-active' : ''}`, children: [_jsx("span", { className: "sf-switch-on", children: onLabel }), _jsx("span", { className: "sf-switch-off", children: offLabel })] }), _jsx("span", { className: `sf-switch-handle ${isChecked ? 'sf-switch-active' : ''}`, children: _jsx("span", { ref: rippleContainerRef, className: `sf-ripple-container ${isChecked ? 'sf-ripple-check' : ''}`, children: ripple && _jsx(Ripple, {}) }) })] }));
});
export default Switch;
