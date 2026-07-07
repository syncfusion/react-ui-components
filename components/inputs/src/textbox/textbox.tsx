
import { useState, useCallback, useEffect, forwardRef, useImperativeHandle, useRef, useMemo, ReactNode, InputHTMLAttributes,
    ForwardRefExoticComponent, RefAttributes, ForwardedRef, RefObject, type ChangeEvent, type FocusEvent
} from 'react';
import { preRender, useProviderContext, Variant, Size, useStableId } from '@syncfusion/react-base';
import { CLASS_NAMES, LabelMode, InputBase, renderClearButton, renderFloatLabelElement, inputBaseProps, renderAdornmentElement } from '../common/inputbase';
import { HelperText } from '../common/helper-text';
export { LabelMode, Variant, Size };

export interface TextBoxChangeEvent {
    /**
     * Specifies the initial event object received from the input element.
     */
    event?: ChangeEvent<HTMLInputElement>;

    /**
     * Specifies the current value of the TextBox.
     */
    value?: string;
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

export interface TextBoxProps extends inputBaseProps {
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
    clearButton?: ReactNode;

    /**
     * Specifies the Callback that fired when the input value is changed.
     *
     * @event onChange
     * @returns {void}
     */
    onChange?: (event: TextBoxChangeEvent) => void;

    /**
     * Specifies the Color style of the TextBox. Options include 'Warning', 'Success' and 'Error'.
     *
     * @default -
     */
    color?: Color;

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

type ITextBoxProps = TextBoxProps & Omit<InputHTMLAttributes<HTMLInputElement>, keyof TextBoxProps>;

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
export const TextBox: ForwardRefExoticComponent<ITextBoxProps & RefAttributes<ITextBox>> =
forwardRef<ITextBox, ITextBoxProps>((props: ITextBoxProps, ref: ForwardedRef<ITextBox>) => {
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
        helperText,
        helperTextOnFocus = false,
        helperTextDirection = 'Left',
        ...rest
    } = props;
    const reactId: string = useStableId('sf-textbox');
    const textboxId: string = id ?? reactId;
    const isControlled: boolean = value !== undefined;
    const [inputValue, setValue] = useState<string | undefined>(
        isControlled ? value : (defaultValue || '')
    );

    const [isFocused, setIsFocused] = useState(false);
    const inputRef: RefObject<HTMLInputElement | null> = useRef<HTMLInputElement>(null);
    const { locale, dir } = useProviderContext();
    const publicAPI: Partial<ITextBoxProps> = {
        clearButton,
        labelMode,
        disabled,
        readOnly,
        variant,
        size,
        color,
        value,
        helperText,
        helperTextOnFocus,
        helperTextDirection
    };

    const classNames: (...classes: string[]) => string = (...classes: string[]) => {
        return classes.filter(Boolean).join(' ');
    };

    const containerClassNames: string = useMemo(() => classNames(
        CLASS_NAMES.INPUTGROUP,
        CLASS_NAMES.WRAPPER,
        labelMode !== 'Never' ? CLASS_NAMES.FLOATINPUT : '',
        className,
        (dir === 'rtl') ? CLASS_NAMES.RTL : '',
        disabled ? CLASS_NAMES.DISABLE : '',
        readOnly ? CLASS_NAMES.READONLY : '',
        isFocused ? CLASS_NAMES.TEXTBOX_FOCUS : '',
        ((inputValue) !== '') ? CLASS_NAMES.VALIDINPUT : '',
        variant && variant.toLowerCase() !== 'standard' ? variant.toLowerCase() === 'outlined' ? 'sf-outline' : `sf-${variant.toLowerCase()}` : '',
        size && size.toLowerCase() !== 'small' ? `sf-${size.toLowerCase()}` : '',
        color ? `sf-${color.toLowerCase()}` : '',
        prefix ? 'sf-has-prefix' : '',
        suffix ? 'sf-has-suffix' : '',
        'sf-control'
    ), [labelMode, className, dir, disabled, readOnly, isFocused, inputValue, variant, size, color, prefix, suffix]);

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

    const updateValue: (newValue: string, event?: ChangeEvent<HTMLInputElement>) => void =
    useCallback((newValue: string, event?: ChangeEvent<HTMLInputElement>) => {
        if (!isControlled) {
            setValue(newValue);
        }
        if (onChange) {
            onChange({ event: event, value: newValue });
        }
    }, [onChange, isControlled]);

    const changeHandler: (event: ChangeEvent<HTMLInputElement>) => void =
    useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const newValue: string = event.target.value;
        updateValue(newValue, event);
    }, [updateValue]);

    const handleFocus: (event: FocusEvent<HTMLInputElement>) => void =
    useCallback((event: FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        if (onFocus) {
            onFocus(event);
        }
    }, [onFocus]);

    const clearInput: () => void = useCallback(() => {
        const newValue: string = '';
        if (!isControlled) {
            setValue(newValue);
            if (inputRef.current) {
                inputRef.current.value = newValue;
            }
        }
        if (onChange) {
            onChange({ value: newValue, event: undefined });
        }
    }, [isControlled, onChange]);

    const handleBlur: (event: FocusEvent<HTMLInputElement>) => void =
    useCallback((event: FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        if (onBlur) {
            onBlur(event);
        }
    }, [onBlur]);

    const displayValue: string | undefined = isControlled ? value : inputValue;

    return (
        <>
            <div
                className={containerClassNames}
                style={{ width: width || '100%' }}
            >
                {renderAdornmentElement(prefix)}
                <InputBase
                    id={textboxId}
                    floatLabelType={labelMode}
                    ref={inputRef as RefObject<HTMLInputElement>}
                    {...rest}
                    readOnly={readOnly}
                    value={isControlled ? (displayValue) : undefined}
                    defaultValue={!isControlled ? (inputValue || '') : undefined}
                    disabled={disabled}
                    placeholder={labelMode === 'Never' ? placeholder : undefined}
                    className={'sf-textbox sf-lib sf-ellipsis'}
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
                    textboxId
                )}
                {clearButton && renderClearButton((isFocused ? displayValue as string : ''), clearInput, clearButton, 'textbox', locale)}
                {renderAdornmentElement(suffix)}
            </div>
            <HelperText
                helperText={helperText}
                helperTextOnFocus={helperTextOnFocus}
                isFocused={isFocused}
                helperTextDirection={helperTextDirection}
            />
        </>

    );
});
