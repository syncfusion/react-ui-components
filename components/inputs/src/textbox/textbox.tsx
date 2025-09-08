
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { getUniqueID, preRender, useProviderContext, Variant } from '@syncfusion/react-base';
import { CLASS_NAMES, LabelMode, InputBase, renderClearButton, renderFloatLabelElement } from '../common/inputbase';
import * as React from 'react';
export { LabelMode, Variant };

export interface TextBoxChangeEvent {
    /**
     * Specifies the initial event object received from the input element.
     */
    event?: React.ChangeEvent<HTMLInputElement>;

    /**
     * Specifies the current value of the TextBox.
     */
    value?: string;
}


/**
 * Specifies the available size options for the TextBox component.
 *
 * @enum {string}
 */
export enum Size {
    /** Specifies the small-sized TextBox with reduced dimensions */
    Small = 'Small',
    /** Specifies the medium-sized TextBox with reduced dimensions */
    Medium = 'Medium',
}

/**
 * Specifies the available color schemes for the component.
 *
 * @enum {string}
 */
export enum Color {
    /** Success color scheme (typically green) for positive actions or status */
    Success = 'Success',
    /** Warning color scheme (typically yellow/amber) for cautionary actions or status */
    Warning = 'Warning',
    /** Error color scheme (typically red) for negative actions or status */
    Error = 'Error'
}

export interface TextBoxProps {
    /**
     * Specifies the value of the component. When provided, the component will be controlled.
     *
     * @default -
     */
    value?: string;

    /**
     * Specifies the default value of the component. Used for uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: string;

    /**
     * Specifies the floating label type for the component.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies the placeholder text for the component.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies whether to display a clear button within the TextBox.
     * When enabled, a clear icon appears in the TextBox that allows users
     * to clear the input value with a single click.
     *
     * @default false
     */
    clearButton?: React.ReactNode;

    /**
     * Specifies the Callback that fired when the input value is changed.
     *
     * @event onChange
     * @returns {void}
     */
    onChange?: (event: TextBoxChangeEvent) => void;

    /**
     * Specifies the visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

    /**
     * Specifies the size style of the TextBox. Options include 'Small' and 'Medium'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the Color style of the TextBox. Options include 'Warning', 'Success' and 'Error'.
     *
     * @default -
     */
    color?: Color;

    /**
     * Specifies the icon to display at the beginning of the input.
     *
     * @default -
     */
    prefix?: React.ReactNode;

    /**
     * Specifies the icon to display at the end of the input.
     *
     * @default -
     */
    suffix?: React.ReactNode;
}

export interface ITextBox extends TextBoxProps {
    /**
     * Specifies the TextBox component element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}

type ITextBoxProps = TextBoxProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof TextBoxProps>;

/**
 * TextBox component that provides a standard text input with extended functionality.
 * Supports both controlled and uncontrolled modes based on presence of value or defaultValue prop.
 *
 * ```typescript
 * import { TextBox } from "@syncfusion/react-inputs";
 *
 * <TextBox defaultValue="Initial text" placeholder="Enter text" />
 * ```
 */
export const TextBox: React.ForwardRefExoticComponent<ITextBoxProps & React.RefAttributes<ITextBox>> =
forwardRef<ITextBox, ITextBoxProps>((props: ITextBoxProps, ref: React.ForwardedRef<ITextBox>) => {
    const {
        disabled = false,
        onChange,
        onBlur,
        onFocus,
        clearButton = false,
        labelMode = 'Never',
        className = '',
        id,
        readOnly = false,
        value,
        defaultValue,
        width,
        placeholder = '',
        variant,
        size = Size.Medium,
        color,
        prefix,
        suffix,
        ...rest
    } = props;
    const stableIdRef: React.RefObject<string> = useRef(id || getUniqueID('default_'));
    const stableId: string = stableIdRef.current;
    const isControlled: boolean = value !== undefined;
    const [inputValue, setValue] = useState<string | undefined>(
        isControlled ? value : (defaultValue || '')
    );

    const [isFocused, setIsFocused] = useState(false);
    const [previousValue, setPreviousValue] = useState(
        isControlled ? value : (defaultValue || '')
    );

    const inputRef: React.RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
    const { locale, dir } = useProviderContext();
    const publicAPI: Partial<ITextBoxProps> = {
        clearButton,
        labelMode,
        disabled,
        readOnly,
        variant,
        size,
        color,
        value
    };

    const getContainerClassNames: () => string = () => {
        return classNames(
            CLASS_NAMES.INPUTGROUP,
            CLASS_NAMES.WRAPPER,
            labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
            className,
            (dir === 'rtl') ? CLASS_NAMES.RTL : '',
            disabled ? CLASS_NAMES.DISABLE : '',
            isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '',
            ((inputValue) !== '') ? CLASS_NAMES.VALIDINPUT : '',
            variant && variant.toLowerCase() !== 'standard'  ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '',
            size && size.toLowerCase() !== 'small' ? `sf-${size.toLowerCase()}` : '',
            color ? `sf-${color.toLowerCase()}` : ''
        );
    };

    const classNames: (...classes: string[]) => string = (...classes: string[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const containerClassNames: string = getContainerClassNames();

    useEffect(() => {
        preRender('textbox');
    }, []);

    useEffect(() => {
        if (isControlled) {
            setValue(value || '');
        }
    }, [value, isControlled]);

    useImperativeHandle(ref, () => ({
        ...publicAPI as ITextBox,
        element: inputRef.current
    }));

    const updateValue: (newValue: string, event?: React.ChangeEvent<HTMLInputElement>) => void =
     useCallback((newValue: string, event?: React.ChangeEvent<HTMLInputElement>) => {
         if (!isControlled) {
             setValue(newValue);
             setPreviousValue(newValue);
         }
         if (onChange) {
             onChange({ event: event, value: newValue });
         }
     }, [previousValue, onChange, isControlled]);

    const changeHandler: (event: React.ChangeEvent<HTMLInputElement>) => void =
    useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue: string = event.target.value;
        if (previousValue !== newValue) {
            updateValue(newValue, event);
        }
        setPreviousValue(newValue);
    }, [previousValue, updateValue]);

    const handleFocus: (event: React.FocusEvent<HTMLInputElement>) => void =
    useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);

    const clearInput: () => void = useCallback(() => {
        const newValue: string = '';
        if (!isControlled) {
            setValue(newValue);
        }
        if (onChange) {
            onChange({ value: newValue, event: undefined });
        }
    }, [isControlled, onChange]);

    const handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void =
    useCallback((event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);

    const displayValue: string | undefined = isControlled ? value : inputValue;
    const defaultInputValue: string | undefined = !isControlled ? defaultValue : undefined;

    return (
        <div
            className={containerClassNames}
            style={{ width: width || '100%' }}
        >
            {prefix}
            <InputBase
                id={stableId}
                floatLabelType={labelMode}
                ref={inputRef as React.RefObject<HTMLInputElement>}
                {...rest}
                readOnly={readOnly}
                value={isControlled ? (displayValue) : undefined}
                defaultValue={!isControlled ? (defaultInputValue) : undefined}
                disabled={disabled}
                placeholder={labelMode === 'Never' ? placeholder : undefined}
                className={'sf-control sf-textbox sf-lib sf-input'}
                onChange={changeHandler}
                aria-label={labelMode === 'Never' ? 'textbox' : undefined}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            {renderFloatLabelElement(
                labelMode || 'Never',
                isFocused || (displayValue) !== '',
                (displayValue as string),
                placeholder,
                stableId
            )}
            {clearButton && renderClearButton((displayValue as string), clearInput, clearButton, 'textbox', locale)}
            {suffix}
        </div>
    );
});
