import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef, useState, useCallback, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import { InputBase, renderFloatLabelElement, renderClearButton, CLASS_NAMES } from '../common/inputbase';
import { isNullOrUndefined, L10n, preRender, SvgIcon, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { formatUnit } from '@syncfusion/react-base';
import { getNumberFormat, getNumberParser } from '@syncfusion/react-base';
import { getUniqueID } from '@syncfusion/react-base';
const ROOT = 'sf-numeric';
const SPINICON = 'sf-input-group-icon';
const SPINUP = 'sf-spin-up';
const SPINDOWN = 'sf-spin-down';
/**
 * NumericTextBox component that provides a specialized input for numeric values with validation,
 * formatting, and increment/decrement capabilities. Supports both controlled and uncontrolled modes.
 *
 * ```typescript
 * <NumericTextBox defaultValue={100} min={0} max={1000} step={10} format="n2"
 * />
 * ```
 */
export const NumericTextBox = forwardRef((props, ref) => {
    const { min = -(Number.MAX_VALUE), max = Number.MAX_VALUE, step = 1, value, defaultValue = null, id = getUniqueID('numeric_'), placeholder = '', spinButton = true, clearButton = false, format = 'n2', decimals = null, strictMode = true, validateOnType = false, labelMode = 'Never', disabled = false, readOnly = false, currency = null, width = null, className = '', size, onChange, onFocus, onBlur, ...otherProps } = props;
    const isControlled = value !== undefined;
    const uniqueId = useRef(id).current;
    const currentValueRef = useRef(defaultValue);
    const [inputValue, setInputValue] = useState(isControlled ? (value ?? null) : (defaultValue ?? null));
    const [isFocused, setIsFocused] = useState(false);
    const [previousValue, setPreviousValue] = useState(isControlled ? (value ?? null) : (defaultValue ?? null));
    const { locale, dir, ripple } = useProviderContext();
    const rippleRef1 = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const rippleRef2 = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const inputRef = useRef(null);
    const publicAPI = {
        min,
        max,
        step,
        clearButton,
        spinButton,
        format,
        strictMode,
        validateOnType,
        labelMode,
        disabled,
        readOnly
    };
    const spinUp = 'M20.7929 17H3.20712C2.76167 17 2.53858 16.4615 2.85356 16.1465L11.6465 7.3536C11.8417 7.15834 12.1583 7.15834 12.3536 7.3536L21.1465 16.1465C21.4614 16.4615 21.2384 17 20.7929 17Z';
    const spinDown = 'M20.7929 7H3.20712C2.76167 7 2.53858 7.53857 2.85356 7.85355L11.6465 16.6464C11.8417 16.8417 12.1583 16.8417 12.3536 16.6464L21.1465 7.85355C21.4614 7.53857 21.2384 7 20.7929 7Z';
    const getContainerClassNames = () => {
        return classNames(ROOT, CLASS_NAMES.INPUTGROUP, CLASS_NAMES.WRAPPER, labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '', className, (dir === 'rtl') ? CLASS_NAMES.RTL : '', disabled ? CLASS_NAMES.DISABLE : '', isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '', (!isNullOrUndefined(currentValueRef.current) && labelMode !== 'Always') ? CLASS_NAMES.VALIDINPUT : '', size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : '');
    };
    const spinSize = size?.toLocaleLowerCase() === 'small' ? '14px' : '16px';
    const setPlaceholder = useMemo(() => {
        const l10n = L10n('numerictextbox', { placeholder: placeholder }, locale);
        l10n.setLocale(locale);
        return l10n.getConstant('placeholder');
    }, [locale, placeholder]);
    useEffect(() => {
        preRender('numerictextbox');
    }, []);
    useEffect(() => {
        if (isControlled) {
            setInputValue(value);
            setPreviousValue(inputValue);
            currentValueRef.current = value;
        }
    }, [value, isControlled, inputValue]);
    useEffect(() => {
        if (!isControlled && defaultValue !== null) {
            currentValueRef.current = defaultValue;
        }
    }, [isControlled, defaultValue]);
    useImperativeHandle(ref, () => ({
        ...publicAPI,
        element: inputRef.current
    }), [publicAPI]);
    const trimValue = useCallback((value) => {
        if (value > max) {
            return max;
        }
        if (value < min) {
            return min;
        }
        return value;
    }, [min, max]);
    const roundNumber = useCallback((value, precision) => {
        const multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }, []);
    const classNames = (...classes) => {
        return classes.filter(Boolean).join(' ');
    };
    const containerClassNames = getContainerClassNames();
    const getNumberOfDecimals = useCallback((value) => {
        if (decimals !== null) {
            return decimals;
        }
        let numberOfDecimals;
        const EXPREGEXP = new RegExp('[eE][\\-+]?([0-9]+)');
        let valueString = value.toString();
        if (EXPREGEXP.test(valueString)) {
            const result = EXPREGEXP.exec(valueString);
            if (result) {
                valueString = value.toFixed(Math.min(parseInt(result[1], 10), 20));
            }
        }
        const decimalPart = valueString.split('.')[1];
        numberOfDecimals = !decimalPart || !decimalPart.length ? 0 : decimalPart.length;
        if (decimals !== null) {
            numberOfDecimals = Math.min(numberOfDecimals, decimals);
        }
        return Math.min(numberOfDecimals, 20);
    }, [decimals]);
    const formatNumber = useCallback((value) => {
        if (value === null || value === undefined) {
            return '';
        }
        try {
            if (isFocused && format.toLowerCase().includes('p')) {
                const percentValue = Math.round((value * 100) * 1e12) / 1e12;
                const numberOfDecimals = getNumberOfDecimals(percentValue);
                return percentValue.toFixed(numberOfDecimals);
            }
            else if (isFocused) {
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        return value.toString();
                    }
                    const strValue = value.toString();
                    return strValue.replace(/\.?0+$/, '');
                }
                return String(value);
            }
            const numberOfDecimals = getNumberOfDecimals(value);
            return getNumberFormat(locale, {
                format: format,
                maximumFractionDigits: numberOfDecimals,
                minimumFractionDigits: numberOfDecimals,
                useGrouping: format.toLowerCase().includes('n'),
                currency: currency
            })(value);
        }
        catch (error) {
            return value.toFixed(2);
        }
    }, [format, currency, isFocused, getNumberOfDecimals]);
    const updateValue = useCallback((newValue, e) => {
        currentValueRef.current = newValue;
        if (!isControlled) {
            setInputValue(newValue);
        }
        if (previousValue !== newValue) {
            setPreviousValue(inputValue);
        }
        if (onChange) {
            onChange(e, newValue);
        }
    }, [inputValue, onChange, isControlled, formatNumber]);
    const handleChange = useCallback((e) => {
        const parsedValue = getNumberParser(locale, { format: format })(e.target.value);
        let newValue = Number.isNaN(parsedValue) ? 0 : parsedValue;
        if (strictMode && newValue !== null) {
            newValue = trimValue(newValue);
        }
        if (validateOnType && decimals !== null && newValue !== null) {
            newValue = roundNumber(newValue, decimals);
        }
        updateValue(newValue, e);
    }, [strictMode, validateOnType, decimals, format, trimValue, roundNumber, inputValue, updateValue]);
    const handleSpinClick = (increments) => {
        if (disabled || readOnly) {
            return;
        }
        if (increments) {
            increment();
        }
        else {
            decrement();
        }
    };
    const handleFocus = useCallback((e) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(e);
        }
    }, [onFocus, formatNumber]);
    const handleBlur = useCallback((e) => {
        setIsFocused(false);
        let newValue;
        if (e.currentTarget.value === '') {
            newValue = null;
        }
        else {
            newValue = getNumberParser(locale, { format: format })(e.currentTarget.value);
            if (isNaN(newValue)) {
                newValue = currentValueRef.current;
            }
            if (validateOnType && decimals !== null && newValue !== null) {
                newValue = roundNumber(newValue, decimals);
            }
            if (strictMode && newValue !== null) {
                newValue = trimValue(newValue);
            }
        }
        updateValue(newValue, e);
        if (onBlur) {
            onBlur(e);
        }
    }, [format, decimals, validateOnType, strictMode, roundNumber, updateValue, onBlur]);
    const adjustValue = useCallback((isIncrement) => {
        const adjustment = isIncrement ? step : -step;
        let newValue = ((currentValueRef.current === null ||
            currentValueRef.current === undefined) ? 0 : currentValueRef.current) + adjustment;
        let precision = 10;
        if (format.toLowerCase().includes('p')) {
            const match = format.match(/p(\d+)/i);
            if (match && match[1]) {
                precision = parseInt(match[1], 10) + 2;
            }
        }
        else {
            const stepStr = step.toString();
            const decimalIndex = stepStr.indexOf('.');
            if (decimalIndex !== -1) {
                precision = stepStr.length - decimalIndex - 1;
            }
        }
        newValue = parseFloat(newValue.toFixed(precision));
        if (strictMode) {
            if (isIncrement) {
                newValue = Math.min(newValue, max);
                newValue = newValue > min ? newValue : min;
            }
            else {
                newValue = Math.max(newValue, min);
            }
        }
        updateValue(newValue);
    }, [step, max, min, strictMode, updateValue, format]);
    const increment = useCallback(() => {
        adjustValue(true);
    }, [adjustValue]);
    const decrement = useCallback(() => {
        adjustValue(false);
    }, [adjustValue]);
    const handleKeyDown = useCallback((e) => {
        if (!/[0-9.-]/.test(e.key) &&
            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
        }
        if (!readOnly) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    increment();
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    decrement();
                    break;
                case 'Enter':
                    {
                        e.preventDefault();
                        const parsedValue = getNumberParser(locale, { format: format })(e.currentTarget.value);
                        let newValue = Number.isNaN(parsedValue) ? currentValueRef.current : parsedValue;
                        if (strictMode && newValue !== null) {
                            newValue = trimValue(newValue);
                        }
                        updateValue(newValue);
                    }
                    break;
                default: break;
            }
        }
    }, [increment, decrement, strictMode, trimValue, updateValue, readOnly, format]);
    const clearValue = useCallback(() => {
        updateValue(null);
    }, [updateValue]);
    const displayValue = formatNumber(isControlled ? value : inputValue);
    return (_jsxs("span", { className: containerClassNames, style: { width: width ? formatUnit(width) : undefined }, children: [_jsx(InputBase, { id: uniqueId, type: "text", ref: inputRef, className: 'sf-control sf-numerictextbox sf-lib sf-input', onChange: handleChange, onFocus: handleFocus, onBlur: handleBlur, ...otherProps, role: "spinbutton", "aria-label": "numerictextbox", onKeyDown: handleKeyDown, floatLabelType: labelMode, placeholder: setPlaceholder, "aria-valuemin": min, "aria-valuemax": max, value: displayValue, "aria-valuenow": currentValueRef.current || undefined, tabIndex: 0, disabled: disabled, readOnly: readOnly }), renderFloatLabelElement(labelMode, isFocused, displayValue || '', setPlaceholder, uniqueId), clearButton && renderClearButton(currentValueRef.current ? currentValueRef.current.toString() : '', clearValue), spinButton && (_jsxs(_Fragment, { children: [_jsxs("span", { className: `${SPINICON} ${SPINDOWN}`, onMouseDown: (e) => {
                            rippleRef1.rippleMouseDown(e);
                            e.preventDefault();
                        }, onClick: () => handleSpinClick(false), title: "Decrement value", children: [_jsx(SvgIcon, { height: spinSize, width: spinSize, d: spinDown }), ripple && _jsx(rippleRef1.Ripple, {})] }), _jsxs("span", { className: `${SPINICON} ${SPINUP}`, onMouseDown: (e) => {
                            rippleRef2.rippleMouseDown(e);
                            e.preventDefault();
                        }, onClick: () => handleSpinClick(true), title: "Increment value", children: [_jsx(SvgIcon, { height: spinSize, width: spinSize, d: spinUp }), ripple && _jsx(rippleRef2.Ripple, {})] })] }))] }));
});
export default NumericTextBox;
