import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, forwardRef } from 'react';
import { SvgIcon } from '@syncfusion/react-base';
/**
 * Constant object containing CSS class names used throughout the component.
 */
export const CLASS_NAMES = {
    RTL: 'sf-rtl',
    DISABLE: 'sf-disabled',
    WRAPPER: 'sf-control-wrapper',
    INPUT: 'sf-input',
    INPUTGROUP: 'sf-input-group',
    FLOATINPUT: 'sf-float-input',
    FLOATLINE: 'sf-float-line',
    FLOATTEXT: 'sf-float-text',
    CLEARICON: 'sf-clear-icon',
    CLEARICONHIDE: 'sf-clear-icon-hide',
    LABELTOP: 'sf-label-top',
    LABELBOTTOM: 'sf-label-bottom',
    VALIDINPUT: 'sf-valid-input',
    TEXTBOX_FOCUS: 'sf-input-focus'
};
/**
 * Represents the behavior options for floating labels in form fields.
 *
 * @enum {string}
 */
export var FloatLabel;
(function (FloatLabel) {
    /**
     * Label never floats, remains in its default position regardless of field state.
     */
    FloatLabel["Never"] = "Never";
    /**
     * Label always appears in the floating position, regardless of field state.
     */
    FloatLabel["Always"] = "Always";
    /**
     * Label automatically floats when the field has content or is focused,
     * and returns to default position when empty and not focused.
     */
    FloatLabel["Auto"] = "Auto";
})(FloatLabel || (FloatLabel = {}));
export const InputBase = forwardRef(({ type, readOnly = false, disabled = false, floatLabelType = 'Never', onFocus, className = '', onBlur, placeholder, onKeyDown, value, defaultValue, onChange, ...rest }, ref) => {
    const inputClassNames = () => {
        return classArray.join(' ');
    };
    const classArray = [CLASS_NAMES.INPUT, className];
    const handleFocus = useCallback((event) => {
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);
    const handleBlur = useCallback((event) => {
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);
    const handleKeyDown = (event) => {
        if (onKeyDown) {
            onKeyDown(event);
        }
    };
    const handleChange = useCallback((event) => {
        if (onChange) {
            onChange(event);
        }
    }, [onChange]);
    const isControlled = value !== undefined;
    const inputValue = isControlled ? { value } : { defaultValue };
    return (_jsx("input", { ref: ref, type: type || 'text', className: inputClassNames(), readOnly: readOnly, disabled: disabled, placeholder: floatLabelType === 'Never' ? placeholder : '', onFocus: handleFocus, onBlur: handleBlur, onKeyDown: handleKeyDown, onChange: handleChange, ...inputValue, ...rest }));
});
/**
 * Renders the float label element.
 *
 * @param {FloatLabelType} floatLabelType - The type of float label.
 * @param {boolean} isFocused - Whether the input is focused.
 * @param {string} inputValue - The current input value.
 * @param {string} placeholder - The placeholder text.
 * @param {any} id - The reference to the input element.
 * @returns {React.ReactElement | null} A React element representing the float label, or null if not applicable.
 */
export const renderFloatLabelElement = (floatLabelType, isFocused, inputValue, placeholder = '', id) => {
    if (floatLabelType === 'Never') {
        return null;
    }
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: CLASS_NAMES.FLOATLINE }), _jsx("label", { className: `${CLASS_NAMES.FLOATTEXT} ${(floatLabelType === 'Always' || (floatLabelType === 'Auto' && (isFocused || inputValue))) ? CLASS_NAMES.LABELTOP : CLASS_NAMES.LABELBOTTOM}`, htmlFor: (id) || '', children: placeholder })] }));
};
export const renderClearButton = (inputValue, clearInput) => (_jsx("span", { className: `${CLASS_NAMES.CLEARICON} ${inputValue === '' ? CLASS_NAMES.CLEARICONHIDE : ''}`, "aria-label": "clear", role: "button", onClick: clearInput, children: _jsx(SvgIcon, { height: '14', width: '14', d: 'M8.58578 10.0001L0.585754 2.00003L1.99997 0.585815L10 8.58584L18 0.585815L19.4142 2.00003L11.4142 10.0001L19.4142 18L18 19.4142L10 11.4143L2.00003 19.4142L0.585812 18L8.58578 10.0001Z' }) }));
