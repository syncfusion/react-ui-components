import { useRef, useState, useCallback, useEffect, forwardRef, Ref, useImperativeHandle, useMemo, useId } from 'react';
import { InputBase, renderFloatLabelElement, renderClearButton, LabelMode, CLASS_NAMES, inputBaseProps } from '../common/inputbase';
import { IL10n, isNullOrUndefined, L10n, preRender, RippleEffect, SvgIcon, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { formatUnit } from '@syncfusion/react-base';
import { getNumberFormat, getNumberParser } from '@syncfusion/react-base';
import { getValue, getNumericObject, Variant, Size } from '@syncfusion/react-base';
export { LabelMode, Variant, Size };

const ROOT: string = 'sf-numeric';
const SPINICON: string = 'sf-input-icon sf-spin-icon';
const SPINUP: string = 'sf-spin-up';
const SPINDOWN: string = 'sf-spin-down';
const SPINUP_PATH: string = 'M20.7929 17H3.20712C2.76167 17 2.53858 16.4615 2.85356 16.1465L11.6465 7.3536C11.8417 7.15834 12.1583 7.15834 12.3536 7.3536L21.1465 16.1465C21.4614 16.4615 21.2384 17 20.7929 17Z';
const SPINDOWN_PATH: string = 'M20.7929 7H3.20712C2.76167 7 2.53858 7.53857 2.85356 7.85355L11.6465 16.6464C11.8417 16.8417 12.1583 16.8417 12.3536 16.6464L21.1465 7.85355C21.4614 7.53857 21.2384 7 20.7929 7Z';

export interface NumericChangeEvent {
    /**
     * Specifies the initial event object received from the input element.
     */
    event?: React.ChangeEvent<HTMLInputElement>;

    /**
     * Specifies the current value of the NumericTextBox.
     */
    value?: number | null;
}

export interface NumericTextBoxProps extends inputBaseProps {

    /**
     * Specifies the value of the NumericTextBox. When provided, component becomes controlled.
     *
     * @default null
     */
    value?: number | null;

    /**
     * Specifies the default value of the NumericTextBox for uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: number | null;

    /**
     * Specifies a minimum value that is allowed a user can enter.
     *
     * @default -
     */
    min?: number;

    /**
     * Specifies a maximum value that is allowed a user can enter.
     *
     * @default -
     */
    max?: number;

    /**
     * Specifies the incremental or decremental step size for the NumericTextBox.
     *
     * @default 1
     */
    step?: number;

    /**
     * Specifies the string shown as a hint/placeholder when the NumericTextBox is empty.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies whether to show increment and decrement buttons (spin buttons) within the input field.
     * When enabled, up/down buttons appear that allow users to increment or decrement
     * the numeric value in the input by a predefined step
     *
     * @default true
     */
    spinButton?: boolean;

    /**
     * Specifies whether to show a clear button within the input field.
     * When enabled, a clear button (×) appears when the field has a value,
     * allowing users to quickly clear the input with a single click.
     *
     * @default false
     */
    clearButton?: React.ReactNode;

    /**
     * Specifies the number format that indicates the display format for the value of the NumericTextBox.
     *
     * @default -
     */
    format?: string;

    /**
     * Specifies the number precision applied to the textbox value when the NumericTextBox is focused.
     *
     * @default -
     */
    decimals?: number;

    /**
     * Specifies the currency code to use in currency formatting.
     * Possible values are the ISO 4217 currency codes, such as 'USD' for the US dollar,'EUR' for the euro.
     *
     * @default -
     */
    currency?: string;

    /**
     * Specifies a value that indicates whether the NumericTextBox control allows the value for the specified range.
     * If it is true, the input value will be restricted between the min and max range.
     * The typed value gets modified to fit the range on focused out state.
     * Else, it allows any value even out of range value,
     *
     * @default true
     */
    strictMode?: boolean;

    /**
     * Specifies whether the decimals length should be restricted during typing.
     *
     * @default false
     */
    validateOnType?: boolean;

    /**
     * Specifies the floating label type for the component.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies the callback function that triggers when the value of the NumericTextBox changes.
     * The change event of the NumericTextBox component will be triggered in the following scenarios:
     * * Changing the previous value using keyboard interaction and then focusing out of the component.
     * * Focusing on the component and scrolling within the input.
     * * Changing the value using the spin buttons.
     * * Programmatically changing the value using the value property.
     *
     * @event onChange
     */
    onChange?: (event: NumericChangeEvent) => void;
}

export interface INumericTextBox extends NumericTextBoxProps {

    /**
     * Specifies the DOM element NumericTextBox component.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type INumericTextBoxProps = NumericTextBoxProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof NumericTextBoxProps>;

const classNames: (...classes: string[]) => string = (...classes: string[]) => {
    return classes.filter(Boolean).join(' ');
};

/**
 * NumericTextBox component that provides a specialized input for numeric values with validation,
 * formatting, and increment/decrement capabilities. Supports both controlled and uncontrolled modes.
 *
 * ```typescript
 * import { NumericTextBox } from "@syncfusion/react-inputs";
 *
 * <NumericTextBox defaultValue={100} min={0} max={1000} />
 * ```
 */
export const NumericTextBox: React.ForwardRefExoticComponent<INumericTextBoxProps & React.RefAttributes<INumericTextBox>> =
forwardRef<INumericTextBox, INumericTextBoxProps>((props: INumericTextBoxProps, ref: Ref<INumericTextBox>) => {
    const {
        min = -(Number.MAX_VALUE),
        max = Number.MAX_VALUE,
        step = 1,
        value,
        defaultValue = null,
        id = `numeric_${useId()}`,
        placeholder = '',
        spinButton = true,
        clearButton = false,
        format,
        decimals = null,
        strictMode = true,
        validateOnType = false,
        labelMode = 'Never',
        disabled = false,
        readOnly = false,
        currency = null,
        width = null,
        className = '',
        autoComplete = 'off',
        size = Size.Medium,
        variant,
        onChange,
        onFocus,
        onBlur,
        onKeyDown,
        ...otherProps
    } = props;

    const isControlled: boolean = value !== undefined;
    const uniqueId: string = useRef(id).current;
    const currentValueRef: React.RefObject<number | null> = useRef<number | null>(defaultValue);

    const [isFocused, setIsFocused] = useState(false);
    const [inputString, setInputString] = useState<string>('');
    const [arrowKeyPressed, setIsArrowKeyPressed] = useState<boolean>(false);

    const { locale, dir, ripple } = useProviderContext();
    const rippleRef1: RippleEffect = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const rippleRef2: RippleEffect = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

    const decimalSeparator: string = useMemo(() => getValue('decimal', getNumericObject(locale)), [locale]);

    const publicAPI: Partial<INumericTextBoxProps> = {
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

    const { effectiveMin, effectiveMax } = useMemo(() => {
        const low: number = Math.min(min, max);
        const high: number = Math.max(min, max);
        return { effectiveMin: low, effectiveMax: high };
    }, [min, max]);

    const getInitialValue: (initialValue: number | null | undefined) => number | null =
    useCallback((initialValue: number | null | undefined): number | null => {
        if (initialValue === null || initialValue === undefined) {
            return null;
        }
        return strictMode ? Math.min(Math.max(initialValue, effectiveMin), effectiveMax) : initialValue;
    }, [strictMode, effectiveMin, effectiveMax]);

    const [inputValue, setInputValue] = useState<number | null>(() => {
        const initial: number | null | undefined = isControlled ? value : defaultValue;
        const clampedValue: number | null = getInitialValue(initial);
        currentValueRef.current = clampedValue;
        return clampedValue;
    });

    const containerClassNames: string = useMemo(() => {
        return classNames(
            ROOT,
            CLASS_NAMES.INPUTGROUP,
            CLASS_NAMES.WRAPPER,
            labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
            className,
            (dir === 'rtl') ? CLASS_NAMES.RTL : '',
            disabled ? CLASS_NAMES.DISABLE : '',
            isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '',
            (!isNullOrUndefined(currentValueRef.current) && labelMode !== 'Always') ? CLASS_NAMES.VALIDINPUT : '',
            size && size.toLowerCase() !== 'small' ? `sf-${size.toLowerCase()}` : '',
            'sf-control',
            variant && variant.toLowerCase() !== 'standard'  ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : ''
        );
    }, [
        labelMode,
        className,
        dir,
        disabled,
        isFocused,
        currentValueRef.current,
        size
    ]);

    const { incrementText, decrementText } = useMemo(() => {
        const l10n: IL10n = L10n('numericTextbox', {
            increment: 'Increment value',
            decrement: 'Decrement value'
        }, locale);
        return {
            incrementText: l10n.getConstant('increment'),
            decrementText: l10n.getConstant('decrement')
        };
    }, [locale]);

    const formatValue: (value: number) => string = ( value: number): string => {
        const numberOfDecimals: number = getNumberOfDecimals(value);
        const formattedValue: string = getNumberFormat({
            locale,
            format,
            maximumFractionDigits: numberOfDecimals,
            minimumFractionDigits: numberOfDecimals,
            useGrouping: format?.toLowerCase().includes('n'),
            currency: currency
        })(value);
        return formattedValue;
    };

    useEffect(() => {
        preRender('numerictextbox');
    }, []);

    useEffect(() => {
        if (isControlled) {
            const clampedValue: number | null = getInitialValue(value);
            setInputValue(value as number | null);
            currentValueRef.current = clampedValue as number | null;

            if (!isFocused) {
                if (clampedValue) {
                    const formattedValue: string = formatValue(clampedValue);
                    setInputString(formattedValue);
                } else {
                    setInputString('');
                }
            }
        }
    }, [value, isControlled, isFocused, getInitialValue]);

    useEffect(() => {
        if (strictMode && currentValueRef.current !== null) {
            const clampedValue: number = trimValue(currentValueRef.current);
            if (clampedValue !== currentValueRef.current) {
                updateValue(clampedValue);
            }
        }
    }, [effectiveMin, effectiveMax, strictMode]);

    useEffect(() => {
        if (!isControlled && defaultValue !== null) {
            currentValueRef.current = defaultValue;
        }
    }, [isControlled, defaultValue]);

    useImperativeHandle(ref, () => ({
        ...publicAPI as INumericTextBox,
        element: inputRef.current
    }), [publicAPI]);

    const trimValue: (value: number) => number = useCallback((value: number): number => {
        return Math.min(Math.max(value, effectiveMin), effectiveMax);
    }, [effectiveMin, effectiveMax]);

    const roundNumber: (value: number, precision: number) => number = useCallback((value: number, precision: number): number => {
        if (precision < 0) { return value; }
        const multiplier: number = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }, []);

    const getNumberOfDecimals: (value: number) => number = useCallback((value: number): number => {
        if (decimals !== null) {
            return decimals > 0 ? decimals : 0;
        }
        if (format) {
            const match: RegExpMatchArray | null = format && typeof format === 'string' ? format.match(/\D(\d+)/) : null;
            const formatDecimals: number | null = match ? Number(match[1]) : null;
            if (formatDecimals !== null) { return formatDecimals; }
        }
        const valueString: string = value.toString();
        const decimalPart: string | undefined = valueString.split('.')[1];
        return decimalPart ? Math.min(decimalPart.length, 20) : 0;
    }, [decimals, format]);

    const formatNumber: (value: number | null) => string = useCallback((value: number | null): string => {
        if (value === null || value === undefined) {
            return isFocused ? inputString || '' : '';
        }
        if (inputString.endsWith(decimalSeparator)) {
            return inputString;
        }
        try {
            if (isFocused) {
                if (format && format.toLowerCase().includes('p')) {
                    return inputString.replace('%', '');
                }
                else {
                    const numberOfDecimals: number = getNumberOfDecimals(value);
                    const roundedValue: number = roundNumber(value, numberOfDecimals);
                    const rounded: string = numberOfDecimals > 0 ? roundedValue.toFixed(numberOfDecimals) : roundedValue.toString();
                    if (arrowKeyPressed) {
                        if (rounded !== inputString) {
                            setInputString(rounded);
                        }
                        return rounded;
                    }
                    else {
                        const hasDecimal: boolean = inputString.includes(decimalSeparator);
                        if (hasDecimal && validateOnType) {
                            const parts: string[] = inputString.split(decimalSeparator);
                            if (parts[1].length > numberOfDecimals) {
                                const validInput: string = inputString.slice(
                                    0, inputString.indexOf(decimalSeparator) + numberOfDecimals + 1
                                );
                                setInputString(validInput);
                                return validInput;
                            }
                        }
                        return inputString === '' || inputString === 'NaN' ? rounded : inputString;
                    }
                }
            }
            const formattedValue: string = formatValue(value);
            if (inputString === '' && !isFocused) { setInputString(formattedValue); }
            return formattedValue;
        } catch (error) {
            return value.toFixed(2);
        }
    }, [format, currency, isFocused, inputString, arrowKeyPressed, getNumberOfDecimals, locale, decimalSeparator]);

    const updateValue: (newValue: number | null, e?: React.ChangeEvent<HTMLInputElement> | Event) => void =
     useCallback((newValue: number | null, e?: React.ChangeEvent<HTMLInputElement> | Event) => {
         if (newValue === null || isNaN(newValue)) {
             currentValueRef.current = null;
             newValue = null;
         } else { currentValueRef.current = newValue; }
         if (!isControlled) {
             setInputValue(newValue);
         }

         if (onChange) {
             onChange({ event: e as React.ChangeEvent<HTMLInputElement>, value: newValue });
         }

     }, [inputValue, onChange, isControlled, formatNumber]);

    const parseNumericInput: (text: string) => number = useCallback((text: string): number => {
        let str: string = text;
        if (format && format.toLowerCase().includes('p') && text && !text.includes('%')) {
            str = `${text}%`;
        }
        return getNumberParser({ locale: locale, format: format })(str);
    }, [locale, format]);

    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void =
    useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let rawStringValue: string = e.target.value;
        if (rawStringValue !== null) {
            if (rawStringValue.includes('e') || rawStringValue.includes('E')) {
                const parsedValue: number = parseNumericInput(rawStringValue);
                updateValue(parsedValue, e);
                setInputString(parsedValue.toString());
                return;
            }
            const minusCount: number = (rawStringValue.match(/-/g) || []).length;
            if (minusCount > 1) {
                rawStringValue = rawStringValue.replace(/-/g, '');
            } else if (minusCount === 1) {
                rawStringValue = '-' + rawStringValue.replace(/-/g, '');
            }

            if (validateOnType && decimals !== null) {
                const decimalIndex: number = rawStringValue.indexOf(decimalSeparator);
                if (decimalIndex !== -1) {
                    const decimalPart: string = rawStringValue.substring(decimalIndex + 1);
                    if (decimalPart.length > decimals) {
                        rawStringValue = rawStringValue.substring(0, decimalIndex + 1 + decimals);
                    }
                }
            }
            setInputString(rawStringValue);
        }

        if (rawStringValue === '') {
            updateValue(null, e);
            return;
        }
        if (rawStringValue.startsWith(decimalSeparator) && rawStringValue.length > 1) {
            rawStringValue = '0' + rawStringValue;
            setInputString(rawStringValue);
        }
        if (rawStringValue.startsWith(`-${decimalSeparator}`) && rawStringValue.length > 2) {
            rawStringValue = `-0${decimalSeparator}` + rawStringValue.substring(2);
            setInputString(rawStringValue);
        }
        if (rawStringValue.endsWith(decimalSeparator) || rawStringValue === '-') {
            return;
        }

        let newValue: number | null = null;
        if (rawStringValue !== '' && rawStringValue.trim() !== '') {
            newValue = parseNumericInput(rawStringValue);
            if (newValue !== null && isFinite(newValue)) {
                if (strictMode) {
                    newValue = trimValue(newValue);
                }
                if (validateOnType && decimals !== null) {
                    newValue = roundNumber(newValue, decimals);
                }
            }
            setInputString(rawStringValue);
        }
        updateValue(newValue as number, e);
    }, [strictMode, validateOnType, decimals, format, trimValue, roundNumber, inputValue, updateValue, decimalSeparator,
        parseNumericInput]);

    const handleSpinClick: (increments: boolean) => void = (increments: boolean) => {
        if (disabled || readOnly) {
            return;
        }
        setIsArrowKeyPressed(true);
        if (increments) {
            increment();
        } else {
            decrement();
        }
    };

    const handleFocus: (e: React.FocusEvent<HTMLInputElement>) => void = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(e);
        }
    }, [onFocus, formatNumber]);

    const handleBlur: (e: React.FocusEvent<HTMLInputElement>) => void = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        setIsArrowKeyPressed(false);
        let newValue: number | null | undefined;
        if (e.currentTarget.value === '') {
            newValue = null;
        } else {
            newValue = parseNumericInput(e.currentTarget.value);
            if (isNaN(newValue as number)) {
                newValue = currentValueRef.current;
            }
            if (validateOnType && decimals !== null && newValue !== null) {
                newValue = roundNumber(newValue as number, decimals);
            }
            if (strictMode && newValue !== null) {
                newValue = trimValue(newValue as number);
            }
        }
        const updatedValue: number = isControlled ? value as number : newValue as number;
        if (updatedValue) {
            const formattedValue: string = formatValue(updatedValue);
            setInputString(formattedValue);
        } else { setInputString(''); }
        updateValue(updatedValue, e);

        if (onBlur) {
            onBlur(e);
        }
    }, [format, decimals, validateOnType, strictMode, roundNumber, updateValue, onBlur, parseNumericInput]);

    const adjustValue: (isIncrement: boolean) => void = useCallback((isIncrement: boolean) => {
        const adjustment: number = isIncrement ? step : -step;
        let newValue: number = ((currentValueRef.current === null ||
            currentValueRef.current === undefined) ? 0 : currentValueRef.current) + adjustment;
        let precision: number = 10;
        if (format && format.toLowerCase().includes('p')) {
            const match: RegExpMatchArray | null = format.match(/p(\d+)/i);
            if (match && match[1]) {
                precision = parseInt(match[1], 10) + 2;
            }
        } else {
            const stepStr: string = step.toString();
            const decimalIndex: number = stepStr.indexOf('.');
            if (decimalIndex !== -1) {
                precision = stepStr.length - decimalIndex - 1;
            }
        }
        newValue = parseFloat(newValue.toFixed(precision));
        if (strictMode) {
            newValue = trimValue(newValue);
        }
        if (newValue) {
            const formattedValue: string = formatValue(newValue);
            setInputString(formattedValue);
        }
        if (currentValueRef.current !== newValue) {
            updateValue(newValue);
        }

    }, [step, effectiveMax, effectiveMin, strictMode, updateValue, trimValue, format]);

    const increment: () => void = useCallback(() => {
        adjustValue(true);
    }, [adjustValue]);

    const decrement: () => void = useCallback(() => {
        adjustValue(false);
    }, [adjustValue]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!readOnly) {
            const hasModifierKey: boolean = e.ctrlKey || e.altKey || e.metaKey;
            if (hasModifierKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                setIsArrowKeyPressed(false);
                if (onKeyDown) { onKeyDown(e); }
                return;
            }
            switch (e.key) {
            case 'ArrowUp':
                setIsArrowKeyPressed(true);
                e.preventDefault();
                increment();
                break;
            case 'ArrowDown':
                setIsArrowKeyPressed(true);
                e.preventDefault();
                decrement();
                break;
            case 'Enter': {
                e.preventDefault();
                const parsedValue: number = parseNumericInput(e.currentTarget.value);
                let newValue: number | null = Number.isNaN(parsedValue) ? currentValueRef.current : parsedValue;
                if (strictMode && newValue !== null) {
                    newValue = trimValue(newValue);
                }
                updateValue(newValue);
            }
                break;
            default: {
                const isNavigationKey: boolean = [
                    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home',
                    'End', 'ArrowLeft', 'ArrowRight'
                ].includes(e.key);
                if (hasModifierKey || isNavigationKey) {
                    setIsArrowKeyPressed(false);
                    return;
                }
                if (validateOnType && decimals !== null && /^\d$/.test(e.key)) {
                    const currentValue: string = e.currentTarget.value;
                    const selectionStart: number = e.currentTarget.selectionStart || 0;
                    const decimalIndex: number = currentValue.indexOf(decimalSeparator);
                    if (decimalIndex !== -1 && selectionStart > decimalIndex) {
                        const currentDecimalPlaces: number = currentValue.length - decimalIndex - 1;
                        if (currentDecimalPlaces >= decimals) {
                            e.preventDefault();
                            return;
                        }
                    }
                }
                const allowedChars: RegExp = /^[0-9.\-+eE]$/;
                if (!allowedChars.test(e.key) && e.key !== decimalSeparator) {
                    e.preventDefault();
                    return;
                }

                setIsArrowKeyPressed(false);
                let currentChar: string = e.currentTarget.value;
                const isAlterNumPadDecimalChar: boolean = e.code === 'NumpadDecimal' && e.key !== decimalSeparator;
                if (isAlterNumPadDecimalChar) {
                    currentChar = decimalSeparator;
                }

                if (e.key === decimalSeparator && currentChar.split(decimalSeparator).length > 1) {
                    e.preventDefault();
                    return;
                }

                if (e.key === '-') {
                    const selectionStart: number = e.currentTarget.selectionStart || 0;
                    if (selectionStart !== 0 || currentChar.includes('-')) {
                        e.preventDefault();
                        return;
                    }
                }
            } break;
            }
        }
        if (onKeyDown) {
            onKeyDown(e);
        }
    }, [increment, decrement, strictMode, trimValue, updateValue, readOnly, format, onKeyDown, parseNumericInput]);

    const clearValue: () => void = useCallback(() => {
        updateValue(null);
        setInputString('');
    }, [updateValue]);

    const displayValue: string = useMemo(() => {
        return formatNumber(isControlled ? value as number : inputValue);
    }, [
        isControlled,
        value,
        inputValue,
        formatNumber,
        isFocused,
        inputString,
        arrowKeyPressed
    ]);

    return (
        <span className={containerClassNames} style={{ width: width ? formatUnit(width) : undefined }}>
            <InputBase
                id={uniqueId}
                type="text"
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className={'sf-numerictextbox sf-lib sf-input'}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...otherProps}
                role="spinbutton"
                onKeyDown={handleKeyDown}
                floatLabelType={labelMode}
                placeholder={placeholder}
                aria-valuemin={effectiveMin}
                aria-valuemax={effectiveMax}
                value={displayValue}
                aria-valuenow={currentValueRef.current || undefined}
                autoComplete={autoComplete}
                tabIndex={0}
                disabled={disabled}
                readOnly={readOnly}
            />
            {renderFloatLabelElement(
                labelMode,
                isFocused,
                displayValue || '',
                placeholder,
                uniqueId
            )}
            {clearButton && renderClearButton(
                currentValueRef.current && isFocused ? currentValueRef.current.toString() : '',
                clearValue, clearButton, 'numericTextbox', locale
            )}
            {spinButton && (
                <>
                    <button
                        className={`${SPINICON} ${SPINDOWN}`}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
                            rippleRef1.rippleMouseDown(e);
                            e.preventDefault();
                        }}
                        type='button'
                        aria-label={decrementText}
                        onClick={() => handleSpinClick(false)}
                        title={decrementText}
                        tabIndex={-1}
                    >
                        <SvgIcon d={SPINDOWN_PATH}></SvgIcon>
                        {ripple && <rippleRef1.Ripple />}
                    </button>
                    <button
                        className={`${SPINICON} ${SPINUP}`}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
                            rippleRef2.rippleMouseDown(e);
                            e.preventDefault();
                        }}
                        type='button'
                        aria-label={incrementText}
                        onClick={() => handleSpinClick(true)}
                        title={incrementText}
                        tabIndex={-1}
                    >
                        <SvgIcon d={SPINUP_PATH}></SvgIcon>
                        {ripple && <rippleRef2.Ripple />}
                    </button>
                </>
            )}
        </span>
    );
});

export default NumericTextBox;
