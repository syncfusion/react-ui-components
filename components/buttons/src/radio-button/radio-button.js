import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { useRef, useImperativeHandle, useState, useEffect, forwardRef } from 'react';
import { preRender, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
/**
 * The RadioButton component allows users to select a single option from a group, utilizing a circular input field that provides a clear user selection interface.
 *
 * ```typescript
 * <RadioButton checked={true} label="Choose this option" name="choices" />
 * ```
 */
export const RadioButton = forwardRef((props, ref) => {
    const { checked, className = '', disabled = false, label = '', labelPlacement = 'After', name = '', value = '', onChange, ...domProps } = props;
    const isControlled = checked !== undefined;
    const [isChecked, setIsChecked] = useState(() => isControlled ? !!checked : !!domProps.defaultChecked);
    const radioInputRef = useRef(null);
    const { dir, ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { duration: 400, isCenterRipple: true });
    useEffect(() => {
        if (isControlled) {
            setIsChecked(!!checked);
        }
    }, [checked, isControlled]);
    useEffect(() => {
        preRender('radio');
    }, []);
    const publicAPI = {
        checked: isChecked,
        label,
        labelPlacement,
        value
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: radioInputRef.current
    }), [publicAPI]);
    const onRadioChange = (event) => {
        if (!isControlled) {
            setIsChecked(event.target.checked);
        }
        if (onChange) {
            onChange(event);
        }
    };
    const classNames = [
        'sf-radio-wrapper',
        'sf-wrapper',
        className
    ].filter(Boolean).join(' ');
    const rtlClass = (dir === 'rtl') ? 'sf-rtl' : '';
    const labelBefore = labelPlacement === 'Before';
    return (_jsxs("div", { className: classNames, children: [_jsx("input", { ref: radioInputRef, type: "radio", id: `sf-${value}`, name: name, value: value, disabled: disabled, onChange: onRadioChange, className: `sf-control sf-radio sf-lib ${className}`, checked: isControlled ? !!checked : undefined, defaultChecked: !isControlled ? isChecked : undefined, ...domProps }), _jsxs("label", { className: `${labelBefore ? 'sf-right' : ''} ${rtlClass}`, htmlFor: `sf-${value}`, children: [_jsx("span", { className: "sf-ripple-container", onMouseDown: rippleMouseDown, children: ripple && _jsx(Ripple, {}) }), _jsx("span", { className: "sf-label", children: label })] })] }));
});
export default React.memo(RadioButton);
