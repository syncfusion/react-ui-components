import { useRef, useState, useCallback, useEffect, forwardRef, Ref, useImperativeHandle, useMemo } from 'react';
import { InputBase, renderFloatLabelElement, renderClearButton, FloatLabelType, CLASS_NAMES } from '../common/inputbase';
import { IL10n, isNullOrUndefined, L10n, preRender, RippleEffect, SvgIcon, useProviderContext, useRippleEffect } from '@syncfusion/react-base';
import { formatUnit } from '@syncfusion/react-base';
import { getNumberFormat, getNumberParser } from '@syncfusion/react-base';
import { getUniqueID } from '@syncfusion/react-base';
import { Size } from '../textbox/textbox';


const ROOT: string = 'sf-numeric';
const SPINICON: string = 'sf-input-group-icon';
const SPINUP: string = 'sf-spin-up';
const SPINDOWN: string = 'sf-spin-down';

export interface NumericTextBoxProps {

    /**
     * Sets the value of the NumericTextBox. When provided, component becomes controlled.
     *
     * @default null
     */
    value?: number | null;

    /**
     * Sets the default value of the NumericTextBox for uncontrolled mode.
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
     * Gets or sets the string shown as a hint/placeholder when the NumericTextBox is empty.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Determines whether to show increment and decrement buttons (spin buttons) within the input field.
     * When enabled, up/down buttons appear that allow users to increment or decrement
     * the numeric value in the input by a predefined step
     *
     * @default true
     */
    spinButton?: boolean;

    /**
     * Determines whether to show a clear button within the input field.
     * When enabled, a clear button (×) appears when the field has a value,
     * allowing users to quickly clear the input with a single click.
     *
     * @default false
     */
    clearButton?: boolean;

    /**
     * Specifies the number format that indicates the display format for the value of the NumericTextBox.
     *
     * @default 'n2'
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
     * Specifies the currency code to use in currency formatting.
     * Possible values are the ISO 4217 currency codes, such as 'USD' for the US dollar,'EUR' for the euro.
     *
     * @default -
     * @private
     */
    currencyCode?: string;

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
     * Defines the floating label type for the component.
     *
     * @default 'Never'
     */
    labelMode?: FloatLabelType;

    /**
     * Triggers when the value of the NumericTextBox changes.
     * The change event of the NumericTextBox component will be triggered in the following scenarios:
     * * Changing the previous value using keyboard interaction and then focusing out of the component.
     * * Focusing on the component and scrolling within the input.
     * * Changing the value using the spin buttons.
     * * Programmatically changing the value using the value property.
     *
     * @event onChange
     */
    onChange?: (args : React.ChangeEvent<HTMLInputElement>, value: number | null) => void;

    /**
     * The size configuration of the component.
     *
     * @default Size.Medium
     */
    size?: Size;
}

export interface INumericTextBox extends NumericTextBoxProps{

    /**
     * This is NumericTextBox component element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type INumericTextBoxProps = NumericTextBoxProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof NumericTextBoxProps>;

/**
 * NumericTextBox component that provides a specialized input for numeric values with validation,
 * formatting, and increment/decrement capabilities. Supports both controlled and uncontrolled modes.
 *
 * ```typescript
 * <NumericTextBox defaultValue={100} min={0} max={1000} step={10} format="n2"
 * />
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
        id = getUniqueID('numeric_'),
        placeholder = '',
        spinButton = true,
        clearButton = false,
        format = 'n2',
        decimals = null,
        strictMode = true,
        validateOnType = false,
        labelMode = 'Never',
        disabled = false,
        readOnly = false,
        currency = null,
        width = null,
        className = '',
        size,
        onChange,
        onFocus,
        onBlur,
        ...otherProps
    } = props;

    const isControlled: boolean = value !== undefined;
    const uniqueId: string = useRef(id).current;
    const currentValueRef: React.RefObject<number | null> = useRef<number | null>(defaultValue);
    const [inputValue, setInputValue] = useState<number | null>(
        isControlled ? (value ?? null) : (defaultValue ?? null)
    );
    const [isFocused, setIsFocused] = useState(false);
    const [previousValue, setPreviousValue] = useState<number | null>(isControlled ? (value ?? null) : (defaultValue ?? null));

    const { locale, dir, ripple } = useProviderContext();
    const rippleRef1: RippleEffect = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const rippleRef2: RippleEffect = useRippleEffect(ripple, { duration: 500, isCenterRipple: true });
    const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);

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
    const spinUp: string = 'M20.7929 17H3.20712C2.76167 17 2.53858 16.4615 2.85356 16.1465L11.6465 7.3536C11.8417 7.15834 12.1583 7.15834 12.3536 7.3536L21.1465 16.1465C21.4614 16.4615 21.2384 17 20.7929 17Z';
    const spinDown: string = 'M20.7929 7H3.20712C2.76167 7 2.53858 7.53857 2.85356 7.85355L11.6465 16.6464C11.8417 16.8417 12.1583 16.8417 12.3536 16.6464L21.1465 7.85355C21.4614 7.53857 21.2384 7 20.7929 7Z';
    const getContainerClassNames: () => string = () => {
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
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : ''
        );
    };

    const spinSize: string = size?.toLocaleLowerCase() === 'small' ? '12' : '14';

    const setPlaceholder: string = useMemo(() => {
        const l10n: IL10n = L10n('numerictextbox', { placeholder: placeholder }, locale);
        l10n.setLocale(locale);
        return l10n.getConstant('placeholder');
    }, [locale, placeholder]);

    useEffect(() => {
        preRender('numerictextbox');
    }, []);

    useEffect(() => {
        if (isControlled) {
            setInputValue(value as number | null);
            setPreviousValue(inputValue);
            currentValueRef.current = value as number | null;
        }
    }, [value, isControlled, inputValue]);

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
        if (value > max) {
            return max;
        }
        if (value < min) {
            return min;
        }
        return value;
    }, [min, max]);

    const roundNumber: (value: number, precision: number) => number = useCallback((value: number, precision: number): number => {
        const multiplier: number = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }, []);

    const classNames: (...classes: string[]) => string = (...classes: string[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const containerClassNames: string = getContainerClassNames();

    const getNumberOfDecimals: (value: number) => number = useCallback((value: number): number => {
        if (decimals !== null) {
            return decimals;
        }
        let numberOfDecimals: number;
        const EXPREGEXP: RegExp = new RegExp('[eE][\\-+]?([0-9]+)');
        let valueString: string = value.toString();
        if (EXPREGEXP.test(valueString)) {
            const result: RegExpExecArray | null = EXPREGEXP.exec(valueString);
            if (result) {
                valueString = value.toFixed(Math.min(parseInt(result[1], 10), 20));
            }
        }
        const decimalPart: string | undefined = valueString.split('.')[1];
        numberOfDecimals = !decimalPart || !decimalPart.length ? 0 : decimalPart.length;
        if (decimals !== null) {
            numberOfDecimals = Math.min(numberOfDecimals, decimals);
        }
        return Math.min(numberOfDecimals, 20);
    }, [decimals]);

    const formatNumber: (value: number | null) => string = useCallback((value: number | null): string => {
        if (value === null || value === undefined) { return ''; }
        try {
            if (isFocused && format.toLowerCase().includes('p')) {
                const percentValue: number = Math.round((value * 100) * 1e12) / 1e12;
                const numberOfDecimals: number = getNumberOfDecimals(percentValue);
                return percentValue.toFixed(numberOfDecimals);
            }
            else if (isFocused) {
                if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        return value.toString();
                    }
                    const strValue: string = value.toString();
                    return strValue.replace(/\.?0+$/, '');
                }
                return String(value);
            }

            const numberOfDecimals: number = getNumberOfDecimals(value);
            return getNumberFormat(locale, {
                format: format,
                maximumFractionDigits: numberOfDecimals,
                minimumFractionDigits: numberOfDecimals,
                useGrouping: format.toLowerCase().includes('n'),
                currency: currency
            })(value);
        } catch (error) {
            return value.toFixed(2);
        }
    }, [format, currency, isFocused, getNumberOfDecimals]);

    const updateValue: (newValue: number | null, e?: React.ChangeEvent<HTMLInputElement> | Event) => void =
     useCallback((newValue: number | null, e?: React.ChangeEvent<HTMLInputElement> | Event) => {
         currentValueRef.current = newValue;
         if (!isControlled) {
             setInputValue(newValue);
         }
         if (previousValue !== newValue) {
             setPreviousValue(inputValue);
         }

         if (onChange) {
             onChange(e as React.ChangeEvent<HTMLInputElement>, newValue);
         }

     }, [inputValue, onChange, isControlled, formatNumber]);

    const handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void =
    useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const parsedValue: number | null = getNumberParser(locale, { format: format })(e.target.value);
        let newValue: number | null | undefined = Number.isNaN(parsedValue) ? 0 : parsedValue;
        if (strictMode && newValue !== null) {
            newValue = trimValue(newValue as number);
        }
        if (validateOnType && decimals !== null && newValue !== null) {
            newValue = roundNumber(newValue as number, decimals);
        }
        updateValue(newValue as number, e);
    }, [strictMode, validateOnType, decimals, format, trimValue, roundNumber, inputValue, updateValue]);

    const handleSpinClick: (increments: boolean) => void = (increments: boolean) => {
        if (disabled || readOnly) {
            return;
        }
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
        let newValue: number | null | undefined;
        if (e.currentTarget.value === '') {
            newValue = null;
        } else {
            newValue = getNumberParser(locale, { format: format })(e.currentTarget.value);
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

        updateValue(newValue as number, e);

        if (onBlur) {
            onBlur(e);
        }
    }, [format, decimals, validateOnType, strictMode, roundNumber, updateValue, onBlur]);

    const adjustValue: (isIncrement: boolean) => void = useCallback((isIncrement: boolean) => {
        const adjustment: number = isIncrement ? step : -step;
        let newValue: number = ((currentValueRef.current === null ||
            currentValueRef.current === undefined) ? 0 : currentValueRef.current) + adjustment;
        let precision: number = 10;
        if (format.toLowerCase().includes('p')) {
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
            if (isIncrement) {
                newValue = Math.min(newValue, max);
                newValue = newValue > min ? newValue : min;
            } else {
                newValue = Math.max(newValue, min);
            }
        }
        updateValue(newValue);
    }, [step, max, min, strictMode, updateValue, format]);

    const increment: () => void = useCallback(() => {
        adjustValue(true);
    }, [adjustValue]);

    const decrement: () => void = useCallback(() => {
        adjustValue(false);
    }, [adjustValue]);

    const handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (
            !/[0-9.-]/.test(e.key) &&
            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown'].includes(e.key)
        ) {
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
            case 'Enter': {
                e.preventDefault();
                const parsedValue: number = getNumberParser(locale, { format: format })(e.currentTarget.value);
                let newValue: number | null = Number.isNaN(parsedValue) ? currentValueRef.current : parsedValue;

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

    const clearValue: () => void = useCallback(() => {
        updateValue(null);
    }, [updateValue]);

    const displayValue: string = formatNumber(
        isControlled ? value as number : inputValue
    );

    return (
        <span className={containerClassNames} style={{ width: width ? formatUnit(width) : undefined }}>
            <InputBase
                id={uniqueId}
                type="text"
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className={'sf-control sf-numerictextbox sf-lib sf-input'}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...otherProps}
                role="spinbutton"
                aria-label="numerictextbox"
                onKeyDown={handleKeyDown}
                floatLabelType={labelMode}
                placeholder={setPlaceholder}
                aria-valuemin={min}
                aria-valuemax={max}
                value={displayValue}
                aria-valuenow={currentValueRef.current || undefined}
                tabIndex={0}
                disabled={disabled}
                readOnly={readOnly}
            />
            {renderFloatLabelElement(
                labelMode,
                isFocused,
                displayValue || '',
                setPlaceholder,
                uniqueId
            )}
            {clearButton && renderClearButton(
                currentValueRef.current ? currentValueRef.current.toString() : '',
                clearValue
            )}
            {spinButton && (
                <>
                    <span
                        className={`${SPINICON} ${SPINDOWN}`}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
                            rippleRef1.rippleMouseDown(e);
                            e.preventDefault();
                        }}
                        onClick={() => handleSpinClick(false)}
                        title="Decrement value"
                    >
                        <SvgIcon height={spinSize} width={spinSize} d={spinDown}></SvgIcon>
                        {ripple && <rippleRef1.Ripple />}
                    </span>
                    <span
                        className={`${SPINICON} ${SPINUP}`}
                        onMouseDown={(e: React.MouseEvent<HTMLSpanElement>) => {
                            rippleRef2.rippleMouseDown(e);
                            e.preventDefault();
                        }}
                        onClick={() => handleSpinClick(true)}
                        title="Increment value"
                    >
                        <SvgIcon height={spinSize} width={spinSize} d={spinUp}></SvgIcon>
                        {ripple && <rippleRef2.Ripple />}
                    </span>
                </>
            )}
        </span>
    );
});

export default NumericTextBox;
