import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { getUniqueID, L10n, preRender, useProviderContext } from '@syncfusion/react-base';
import { CLASS_NAMES, InputBase, renderClearButton, renderFloatLabelElement } from '../common/inputbase';
/**
 * Represents the available size options for the textbox component.
 *
 * @enum {string}
 */
export var Size;
(function (Size) {
    /** Small-sized textbox with reduced dimensions */
    Size["Small"] = "Small";
    /** Medium-sized textbox with reduced dimensions */
    Size["Medium"] = "Medium";
})(Size || (Size = {}));
/**
 * Represents the available visual variants for the component.
 *
 * @enum {string}
 */
export var Variant;
(function (Variant) {
    /** Outlined appearance with border and transparent background */
    Variant["Outlined"] = "Outlined";
    /** Filled appearance with solid background color */
    Variant["Filled"] = "Filled";
    /** Standard appearance without border and background color */
    Variant["Standard"] = "Standard";
})(Variant || (Variant = {}));
/**
 * Represents the available color schemes for the component.
 *
 * @enum {string}
 */
export var Color;
(function (Color) {
    /** Success color scheme (typically green) for positive actions or status */
    Color["Success"] = "Success";
    /** Warning color scheme (typically yellow/amber) for cautionary actions or status */
    Color["Warning"] = "Warning";
    /** Error color scheme (typically red) for negative actions or status */
    Color["Error"] = "Error";
})(Color || (Color = {}));
/**
 * TextBox component that provides a standard text input with extended functionality.
 * Supports both controlled and uncontrolled modes based on presence of value or defaultValue prop.
 *
 * ```typescript
 * <TextBox defaultValue="Initial text" placeholder="Enter text" />
 * ```
 */
export const TextBox = forwardRef((props, ref) => {
    const { disabled = false, onChange, onBlur, onFocus, clearButton = false, labelMode = 'Never', className = '', id, readOnly = false, value, defaultValue, width, placeholder = '', variant, size, color, prefix, suffix, ...rest } = props;
    const stableIdRef = useRef(id || getUniqueID('default_'));
    const stableId = stableIdRef.current;
    const isControlled = value !== undefined;
    const [inputValue, setValue] = useState(isControlled ? value : (defaultValue || ''));
    const [isFocused, setIsFocused] = useState(false);
    const [previousValue, setPreviousValue] = useState(isControlled ? value : (defaultValue || ''));
    const inputRef = useRef(null);
    const { locale, dir } = useProviderContext();
    const publicAPI = {
        clearButton,
        labelMode,
        disabled,
        readOnly,
        variant,
        size,
        color,
        value
    };
    const getContainerClassNames = () => {
        return classNames(CLASS_NAMES.INPUTGROUP, CLASS_NAMES.WRAPPER, labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '', className, (dir === 'rtl') ? CLASS_NAMES.RTL : '', disabled ? CLASS_NAMES.DISABLE : '', isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '', ((inputValue) !== '') ? CLASS_NAMES.VALIDINPUT : '', variant && variant.toLowerCase() !== 'standard' ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '', size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : '', color ? `sf-${color.toLowerCase()}` : '');
    };
    const classNames = (...classes) => {
        return classes.filter(Boolean).join(' ');
    };
    const containerClassNames = getContainerClassNames();
    const setPlaceholder = useMemo(() => {
        const l10n = L10n('textbox', { placeholder: placeholder }, locale);
        l10n.setLocale(locale);
        return l10n.getConstant('placeholder');
    }, [locale, placeholder]);
    useEffect(() => {
        preRender('textbox');
    }, []);
    useEffect(() => {
        if (isControlled) {
            setValue(value || '');
        }
    }, [value, isControlled]);
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: inputRef.current
    }));
    const updateValue = useCallback((newValue, event) => {
        if (!isControlled) {
            setValue(newValue);
            setPreviousValue(newValue);
        }
        if (onChange) {
            onChange(event);
        }
    }, [previousValue, onChange, isControlled]);
    const changeHandler = useCallback((event) => {
        const newValue = event.target.value;
        if (previousValue !== newValue) {
            updateValue(newValue, event);
        }
        setPreviousValue(newValue);
    }, [previousValue, updateValue]);
    const handleFocus = useCallback((event) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);
    const clearInput = useCallback(() => {
        if (!isControlled) {
            setValue('');
        }
        if (onChange) {
            onChange(event);
        }
    }, [isControlled, onChange, inputValue]);
    const handleBlur = useCallback((event) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);
    const displayValue = isControlled ? value : inputValue;
    const defaultInputValue = !isControlled ? defaultValue : undefined;
    return (_jsxs("div", { className: containerClassNames, style: { width: width || '100%' }, children: [prefix, _jsx(InputBase, { id: stableId, floatLabelType: labelMode, ref: inputRef, ...rest, readOnly: readOnly, value: isControlled ? (displayValue) : undefined, defaultValue: !isControlled ? (defaultInputValue) : undefined, disabled: disabled, placeholder: labelMode === 'Never' ? setPlaceholder : undefined, className: 'sf-control sf-textbox sf-lib sf-input', onChange: changeHandler, "aria-label": labelMode === 'Never' ? 'textbox' : undefined, onFocus: handleFocus, onBlur: handleBlur }), renderFloatLabelElement(labelMode || 'Never', isFocused || (displayValue) !== '', displayValue, setPlaceholder, stableId), clearButton && renderClearButton(displayValue, clearInput), suffix] }));
});
