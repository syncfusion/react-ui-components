import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { CLASS_NAMES, renderClearButton, renderFloatLabelElement } from '../common/inputbase';
import { getUniqueID, L10n, preRender, useProviderContext } from '@syncfusion/react-base';
/**
 * Constant for horizontal resize mode
 */
const RESIZE_X = 'sf-resize-x';
/**
 * Constant for vertical resize mode
 */
const RESIZE_Y = 'sf-resize-y';
/**
 * Constant for both horizontal and vertical resize mode
 */
const RESIZE_XY = 'sf-resize-xy';
/**
 * Constant for no resize mode
 */
const RESIZE_NONE = 'sf-resize-none';
/**
 * Constant for multi-line input class
 */
const MULTILINE = 'sf-multi-line-input';
/**
 * Constant for auto-width class
 */
const AUTOWIDTH = 'sf-auto-width';
/**
 * Defines the available resize modes for components that support resizing.
 *
 * @enum {string}
 */
export var ResizeMode;
(function (ResizeMode) {
    /**
     * Disables resizing functionality.
     */
    ResizeMode["None"] = "None";
    /**
     * Enables resizing in both horizontal and vertical directions.
     */
    ResizeMode["Both"] = "Both";
    /**
     * Enables resizing only in the horizontal direction.
     */
    ResizeMode["Horizontal"] = "Horizontal";
    /**
     * Enables resizing only in the vertical direction.
     */
    ResizeMode["Vertical"] = "Vertical";
})(ResizeMode || (ResizeMode = {}));
/**
 * TextArea component that provides a multi-line text input field with enhanced functionality.
 * Supports both controlled and uncontrolled modes based on presence of value or defaultValue prop.
 *
 * ```typescript
 * <TextArea defaultValue="Initial text" placeholder="Enter text" rows={5} cols={40} />
 * ```
 */
export const TextArea = forwardRef((props, ref) => {
    const { readOnly = false, value, defaultValue, labelMode = 'Never', placeholder = '', disabled = false, width, resizeMode = ResizeMode.Both, maxLength, cols = null, rows = null, clearButton = false, className = '', variant, onChange, onBlur, onFocus, ...rest } = props;
    const isControlled = value !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '');
    const displayValue = isControlled ? value : uncontrolledValue;
    const [isFocused, setIsFocused] = useState(false);
    const id = useMemo(() => rest.id || getUniqueID('textArea_'), [rest.id]);
    const elementRef = useRef(null);
    const { locale, dir } = useProviderContext();
    const publicAPI = {
        clearButton,
        labelMode,
        disabled,
        readOnly,
        resizeMode
    };
    useEffect(() => {
        preRender('textarea');
    }, []);
    useEffect(() => {
        if (isControlled) {
            setUncontrolledValue(value || '');
        }
    }, [isControlled, value]);
    const getContainerClassNames = () => {
        return classNames(CLASS_NAMES.INPUTGROUP, CLASS_NAMES.WRAPPER, labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '', MULTILINE, className, (dir === 'rtl') ? CLASS_NAMES.RTL : '', disabled ? CLASS_NAMES.DISABLE : '', isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '', ((displayValue) !== '') ? CLASS_NAMES.VALIDINPUT : '', variant && variant.toLowerCase() !== 'standard' ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '', AUTOWIDTH);
    };
    const setPlaceholder = useMemo(() => {
        const l10n = L10n('textarea', { placeholder: placeholder }, locale);
        l10n.setLocale(locale);
        return l10n.getConstant('placeholder');
    }, [locale, placeholder]);
    const classNames = (...classes) => {
        return classes.filter(Boolean).join(' ');
    };
    const containerClassNames = getContainerClassNames();
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: elementRef.current
    }));
    const handleChange = useCallback((event) => {
        const newValue = event.target.value;
        if (!isControlled) {
            setUncontrolledValue(newValue);
        }
        if (onChange) {
            onChange(event);
        }
    }, [isControlled, onChange, uncontrolledValue, value]);
    const handleFocus = useCallback((event) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);
    const handleBlur = useCallback((event) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);
    const clearValue = useCallback(() => {
        if (!isControlled) {
            setUncontrolledValue('');
        }
        if (onChange) {
            onChange(event);
        }
    }, [onChange, isControlled, uncontrolledValue, value]);
    const getCurrentResizeClass = (resizeMode) => {
        return resizeMode === 'None' ? RESIZE_NONE : (resizeMode === 'Both' ? RESIZE_XY : resizeMode === 'Horizontal' ? RESIZE_X : RESIZE_Y);
    };
    return (_jsxs("div", { className: containerClassNames, children: [_jsx("textarea", { ref: elementRef, id: id, value: isControlled ? (value) : undefined, defaultValue: !isControlled ? (defaultValue) : undefined, onChange: handleChange, onFocus: handleFocus, onBlur: handleBlur, readOnly: readOnly, placeholder: labelMode === 'Never' ? setPlaceholder : undefined, disabled: disabled, maxLength: maxLength, cols: cols ?? undefined, rows: rows ?? undefined, ...rest, style: {
                    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
                    resize: resizeMode === 'None' ? 'none' : undefined
                }, className: `sf-control sf-textarea sf-lib sf-input ${getCurrentResizeClass(resizeMode)}`, "aria-multiline": "true", "aria-labelledby": `label_${id}` }), renderFloatLabelElement(labelMode, isFocused || (displayValue) !== '', displayValue, setPlaceholder, id), clearButton && renderClearButton((displayValue) ? (displayValue).toString() : '', clearValue)] }));
});
export default TextArea;
