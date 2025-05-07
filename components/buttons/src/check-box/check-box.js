import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useImperativeHandle, useRef, forwardRef } from 'react';
import { preRender, useProviderContext, SvgIcon, useRippleEffect } from '@syncfusion/react-base';
const CHECK = 'sf-check';
const DISABLED = 'sf-checkbox-disabled';
const FRAME = 'sf-frame';
const INDETERMINATE = 'sf-stop';
const LABEL = 'sf-label';
const WRAPPER = 'sf-checkbox-wrapper';
const CheckBoxClass = 'sf-control sf-checkbox sf-lib';
/**
 * The CheckBox component allows users to select one or multiple options from a list, providing a visual representation of a binary choice with states like checked, unchecked, or indeterminate.
 *
 * ```typescript
 * <CheckBox checked={true} label="Accept Terms and Conditions" />
 * ```
 */
export const CheckBox = forwardRef((props, ref) => {
    const { onChange, checked, className = '', disabled = false, indeterminate = false, labelPlacement = 'After', name = '', value = '', ...domProps } = props;
    const isControlled = checked !== undefined;
    const [checkedState, setCheckedState] = useState(() => {
        if (isControlled) {
            return checked;
        }
        return domProps.defaultChecked || false;
    });
    const [isIndeterminate, setIsIndeterminate] = useState(indeterminate);
    const [isFocused, setIsFocused] = useState(false);
    const [storedLabel, setStoredLabel] = useState(props.label ?? '');
    const [storedLabelPosition, setStoredLabelPosition] = useState(labelPlacement ?? 'After');
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const rippleContainerRef = useRef(null);
    const { dir, ripple } = useProviderContext();
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { isCenterRipple: true });
    const checkIcon = 'M23.8284 3.75L8.5 19.0784L0.17157 10.75L3 7.92157L8.5 13.4216L21 0.92157L23.8284 3.75Z';
    const indeterminateIcon = 'M0.5 0.5H17.5V3.5H0.5V0.5Z';
    const publicAPI = {
        checked,
        indeterminate,
        value
    };
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: inputRef.current
    }), [publicAPI]);
    useEffect(() => {
        if (isControlled) {
            setCheckedState(!!checked);
        }
    }, [checked, isControlled]);
    useEffect(() => {
        setStoredLabel(props.label ?? '');
        setStoredLabelPosition(labelPlacement ?? 'After');
    }, [props.label, labelPlacement]);
    useEffect(() => {
        preRender('checkbox');
    }, []);
    useEffect(() => {
        setIsIndeterminate(indeterminate);
    }, [indeterminate]);
    const handleStateChange = useCallback((event) => {
        const newChecked = event.target.checked;
        setIsIndeterminate(false);
        if (!isControlled) {
            setCheckedState(newChecked);
        }
        onChange?.(event);
    }, [onChange, isControlled]);
    const handleFocus = () => {
        setIsFocused(true);
    };
    const handleBlur = () => {
        setIsFocused(false);
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
    const wrapperClass = [
        WRAPPER,
        className,
        disabled ? DISABLED : '',
        isFocused ? 'sf-focus' : '',
        !disabled && dir === 'rtl' ? 'sf-rtl' : ''
    ].filter(Boolean).join(' ');
    const renderIcons = () => (_jsxs("span", { className: `sf-icons ${FRAME} ${isIndeterminate ? INDETERMINATE : checkedState ? CHECK : ''}`, children: [isIndeterminate && (_jsx(SvgIcon, { width: "12", height: "12", viewBox: "2 0 16 4", d: indeterminateIcon, fill: "currentColor" })), checkedState && !isIndeterminate && (_jsx(SvgIcon, { width: "14", height: "14", viewBox: "0 0 25 20", d: checkIcon, fill: "currentColor" }))] }));
    const renderRipple = () => (_jsx("span", { ref: rippleContainerRef, className: `sf-ripple-container ${checkedState ? 'sf-ripple-check' : ''}`, children: ripple && _jsx(Ripple, {}) }));
    const renderLabel = (label) => (_jsx("span", { className: LABEL, children: label }));
    return (_jsx("div", { ref: wrapperRef, className: wrapperClass, "aria-disabled": disabled ? 'true' : 'false', onMouseDown: handleMouseDown, children: _jsxs("label", { children: [_jsx("input", { ref: inputRef, className: `${CheckBoxClass} ${className}`, type: "checkbox", name: name, value: value, checked: isControlled ? checked : checkedState, disabled: disabled, onFocus: handleFocus, onBlur: handleBlur, onChange: handleStateChange, ...domProps }), storedLabelPosition === 'Before' && renderLabel(storedLabel), storedLabelPosition === 'After' && renderRipple(), renderIcons(), storedLabelPosition === 'Before' && renderRipple(), storedLabelPosition === 'After' && renderLabel(storedLabel)] }) }));
});
CheckBox.displayName = 'CheckBox';
export default CheckBox;
const createCSSCheckBox = (props) => {
    const { className = '', checked = false, label = '', ...domProps } = props;
    const { dir, ripple } = useProviderContext();
    const checkIcon = 'M23.8284 3.75L8.5 19.0784L0.17157 10.75L3 7.92157L8.5 13.4216L21 0.92157L23.8284 3.75Z';
    const rippleContainerRef = useRef(null);
    const { rippleMouseDown, Ripple } = useRippleEffect(ripple, { isCenterRipple: true });
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
    return (_jsxs("div", { className: `sf-checkbox-wrapper sf-css ${className} ${(dir === 'rtl') ? 'sf-rtl' : ''}`, onMouseDown: handleMouseDown, ...domProps, children: [_jsx("span", { ref: rippleContainerRef, className: `sf-ripple-container ${checked ? 'sf-ripple-check' : ''}`, children: ripple && _jsx(Ripple, {}) }), _jsx("span", { className: `sf-frame e-icons ${checked ? 'sf-check' : ''}`, children: checked && (_jsx(SvgIcon, { width: '10', height: '10', viewBox: '0 0 20 26', d: checkIcon, fill: "currentColor" })) }), label && (_jsx("span", { className: LABEL, children: label }))] }));
};
// Component definition for CheckBox using create function
export const CSSCheckBox = (props) => {
    return createCSSCheckBox(props);
};
