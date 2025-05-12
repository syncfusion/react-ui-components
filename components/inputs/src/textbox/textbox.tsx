
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef, ReactNode, useMemo} from 'react';
import { getUniqueID, IL10n, L10n, preRender, useProviderContext } from '@syncfusion/react-base';
import { CLASS_NAMES, FloatLabelType, InputBase, renderClearButton, renderFloatLabelElement } from '../common/inputbase';
import * as React from 'react';


/**
 * Represents the available size options for the textbox component.
 *
 * @enum {string}
 */
export enum Size {
    /** Small-sized textbox with reduced dimensions */
    Small = 'Small',
    /** Medium-sized textbox with reduced dimensions */
    Medium = 'Medium',
}

/**
 * Represents the available visual variants for the component.
 *
 * @enum {string}
 */
export enum Variant {
    /** Outlined appearance with border and transparent background */
    Outlined = 'Outlined',
    /** Filled appearance with solid background color */
    Filled = 'Filled',
    /** Standard appearance without border and background color */
    Standard = 'Standard'
}

/**
 * Represents the available color schemes for the component.
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
     * Sets the value of the component. When provided, the component will be controlled.
     *
     * @default -
     */
    value?: string;

    /**
     * Sets the default value of the component. Used for uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: string;

    /**
     * Defines the floating label type for the component.
     *
     * @default 'Never'
     */
    labelMode?: FloatLabelType;

    /**
     * Sets the placeholder text for the component.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies whether to display a clear button within the textbox.
     * When enabled, a clear icon appears in the textbox that allows users
     * to clear the input value with a single click.
     *
     * @default false
     */
    clearButton?: boolean;

    /**
     * Callback fired when the input value is changed.
     *
     * @event onChange
     * @param {React.ChangeEvent<HTMLInputElement>} event - The change event object containing the new value.
     * @returns {void}
     */
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;

    /**
     * The visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

    /**
     * Specifies the size style of the textbox. Options include 'Small' and 'Medium'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the Color style of the textbox. Options include 'Warning', 'Success' and 'Error'.
     *
     * @default -
     */
    color?: Color;

    /**
     * Use this to add an icon at the beginning of the input.
     *
     * @default -
     */
    prefix?: string | ReactNode;

    /**
     * Use this to add an icon at the end of the input.
     *
     * @default -
     */
    suffix?: string | ReactNode;
}

export interface ITextBox extends TextBoxProps {
    /**
     * This is Textbox component element.
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
        size,
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
            size && size.toLowerCase() !== 'medium' ? `sf-${size.toLowerCase()}` : '',
            color ? `sf-${color.toLowerCase()}` : ''
        );
    };

    const classNames: (...classes: string[]) => string = (...classes: string[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const containerClassNames: string = getContainerClassNames();

    const setPlaceholder: string = useMemo(() => {
        const l10n: IL10n = L10n('textbox', { placeholder: placeholder }, locale);
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
             onChange(event as React.ChangeEvent<HTMLInputElement>);
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
        if (!isControlled) {
            setValue('');
        }
        if (onChange) {
            onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
        }
    }, [isControlled, onChange, inputValue]);

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
                placeholder={labelMode === 'Never' ? setPlaceholder : undefined}
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
                setPlaceholder,
                stableId
            )}
            {clearButton && renderClearButton((displayValue as string), clearInput)}
            {suffix}
        </div>
    );
});
