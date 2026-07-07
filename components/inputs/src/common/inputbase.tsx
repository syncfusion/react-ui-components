import { ChangeEvent, useCallback, JSX, FocusEvent, KeyboardEvent as ReactKeyboardEvent, forwardRef, ReactNode,
    useMemo, InputHTMLAttributes, ForwardRefExoticComponent, RefAttributes, ForwardedRef, ReactElement,
    type MouseEvent
} from 'react';
import { LabelMode, IL10n, L10n, Variant, Size } from '@syncfusion/react-base';
import { CloseIcon } from '@syncfusion/react-icons';
import { HelperTextProps } from './helper-text';
export { LabelMode, Variant, Size };
/**
 * Constant object containing CSS class names used throughout the component.
 */

export const CLASS_NAMES: {
    RTL: string;
    DISABLE: string;
    READONLY: string;
    WRAPPER: string;
    INPUT: string;
    INPUTGROUP: string;
    FLOATINPUT: string;
    FLOATTEXT: string;
    CLEARICON: string;
    CLEARICONHIDE: string;
    LABELTOP: string;
    LABELBOTTOM: string;
    VALIDINPUT: string;
    TEXTBOX_FOCUS: string;
} = {
    RTL: 'sf-rtl',
    DISABLE: 'sf-disabled',
    READONLY: 'sf-readonly',
    WRAPPER: 'sf-control-wrapper',
    INPUT: 'sf-input',
    INPUTGROUP: 'sf-input-group',
    FLOATINPUT: 'sf-float-input',
    FLOATTEXT: 'sf-float-text',
    CLEARICON: 'sf-clear-icon',
    CLEARICONHIDE: 'sf-clear-icon-hide',
    LABELTOP: 'sf-label-top',
    LABELBOTTOM: 'sf-label-bottom',
    VALIDINPUT: 'sf-valid-input',
    TEXTBOX_FOCUS: 'sf-input-focus'
};

export interface IInput {
    placeholder: string;
    className: string;
    disabled?: boolean;
    readOnly?: boolean;
    floatLabelType?: LabelMode;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface validationProps {
    /**
     * Specifies whether the component is a required field in a form. When set to true,
     * the component will be marked as required.
     *
     * @default -
     */
    required?: boolean;

    /**
     * Specifies whether to override the validity state of the component. If valid is set, the required property will be ignored.
     *
     * @default -
     */
    valid?: boolean;

    /**
     * Specifies the form error message of the component.
     *
     * @default -
     */
    validationMessage?: string;

    /**
     * Specifies whether to apply visual representation of the invalid state of the component.
     * If set to false, no visual representation of the invalid state of the component will be applied.
     *
     * @default true
     */
    validityStyles?: boolean;
}

export interface inputBaseProps extends HelperTextProps {
    /**
     * Specifies the visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

    /**
     * Specifies the size of the component. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the icon or element to display at the beginning of the input.
     *
     * @default -
     */
    prefix?: ReactNode;

    /**
     * Specifies the icon or element to display at the end of the input.
     *
     * @default -
     */
    suffix?: ReactNode;
}

/**
 * Interface for input arguments.
 */
export interface IInputArgs {
    floatLabelType?: LabelMode;
    placeholder?: string;
    width?: number | string;
    value?: string;
    defaultValue?: string;
    type?: string;
    role?: string;
    name?: string;
    tabIndex?: number;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
    onFocus?: any;
    onBlur?: any;
    onKeyDown?: any;
}

export type InputArgs = IInputArgs & Omit<InputHTMLAttributes<HTMLInputElement>, keyof IInputArgs>;
export const InputBase: ForwardRefExoticComponent<InputArgs & RefAttributes<HTMLInputElement>> =
 forwardRef<HTMLInputElement, InputArgs>(({
     type, readOnly = false, disabled = false, floatLabelType = 'Never', onFocus, className = '',
     onBlur, placeholder, onKeyDown, value, defaultValue, onChange, ...rest
 }: InputArgs, ref: ForwardedRef<HTMLInputElement>) => {
     const inputClassNames: string = useMemo(
         () => [CLASS_NAMES.INPUT, className].filter(Boolean).join(' '),
         [className]
     );

     const handleFocus: (event: FocusEvent) => void = useCallback((event: FocusEvent<Element, Element>) => {
         if (onFocus) {
             onFocus(event);
         }
     }, [onFocus]);

     const handleBlur: (event: FocusEvent) => void = useCallback((event: FocusEvent<Element, Element>) => {
         if (onBlur) {
             onBlur(event);
         }
     }, [onBlur]);

     const handleKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = useCallback(
         (event: ReactKeyboardEvent<HTMLInputElement>) => {
             if (onKeyDown) { onKeyDown(event); }
         }, [onKeyDown]
     );

     const handleChange: (event: ChangeEvent<HTMLInputElement>) => void = useCallback((event: ChangeEvent<HTMLInputElement>) => {
         if (onChange) {
             onChange(event);
         }
     }, [onChange]);

     const isControlled: boolean = value !== undefined;
     const inputValue: {
         value: string | undefined;
         defaultValue?: undefined;
     } | {
         defaultValue: string | undefined;
         value?: undefined;
     } = isControlled ? { value } : { defaultValue };

     return (
         <input
             ref={ref}
             type={type || 'text'}
             className={inputClassNames}
             readOnly={readOnly}
             disabled={disabled}
             placeholder={floatLabelType === 'Never' ? placeholder : ''}
             onFocus={handleFocus}
             onBlur={handleBlur}
             onKeyDown={handleKeyDown}
             onChange={handleChange}
             {...inputValue}
             {...rest}
         />
     );
 });

/**
 * Renders the float label element.
 *
 * @param {LabelMode} floatLabelType - The type of float label.
 * @param {boolean} isFocused - Whether the input is focused.
 * @param {string} inputValue - The current input value.
 * @param {string} placeholder - The placeholder text.
 * @param {any} id - The reference to the input element.
 * @returns {ReactElement | null} A React element representing the float label, or null if not applicable.
 */
export const renderFloatLabelElement: (floatLabelType: LabelMode,
    isFocused: boolean, inputValue: string | number, placeholder: string | undefined,
    id: string) => ReactElement | null = (
    floatLabelType: LabelMode,
    isFocused: boolean,
    inputValue: string | number,
    placeholder: string = '',
    id: string
): ReactElement | null => {
    if (floatLabelType === 'Never') {return null; }
    return (
        <>
            <label
                className={`${CLASS_NAMES.FLOATTEXT} ${(floatLabelType === 'Always' || (floatLabelType === 'Auto' && (isFocused || inputValue))) ? CLASS_NAMES.LABELTOP : CLASS_NAMES.LABELBOTTOM}`}
                htmlFor={(id) || ''}
                id={id ? `label_${id}` : undefined}
            >
                {placeholder}
            </label>
        </>
    );
};

/**
 * Renders a adornment element inside the input.
 *
 * @param {ReactNode} adornment - The ReactNode to render as an input adornment.
 * @returns {JSX.Element | null} A span element wrapping the adornment, or null if adornment is null/undefined.
 */
export const renderAdornmentElement: (adornment: ReactNode) => JSX.Element | null = (
    adornment: ReactNode
): JSX.Element | null => {
    if (adornment == null) { return null; }
    return <span className="sf-no-hover sf-input-icon sf-input-adornment-icon">{adornment}</span>;
};

/**
 * Renders a clear button for an input field that allows the user to clear the input.
 *
 * @param {string} inputValue - The current value of the input field.
 * @param {Function} clearInput - The function to call when the clear button is clicked.
 * @param {boolean|ReactNode} [clearIcon] - If true shows default icon, if false renders nothing, if ReactNode renders the provided node.
 * @param {string} [componentName] - The name of the component for localization.
 * @param {string} [locale] - The locale to use for localization.
 * @returns {JSX.Element|null} The clear button element or null if clearIcon is false.
 */
export const renderClearButton: (
    inputValue: string,
    clearInput: (event: MouseEvent) => void,
    clearIcon?: boolean | ReactNode,
    componentName?: string,
    locale?: string
) => JSX.Element | null = (
    inputValue: string,
    clearInput: (event: MouseEvent) => void,
    clearIcon: boolean | ReactNode = true,
    componentName?: string,
    locale?: string
) => {
    if (clearIcon === false) {
        return null;
    }
    const l10n: IL10n = L10n(componentName as string, {
        clear: 'Clear'
    }, locale);
    const clear: string = l10n.getConstant('clear');
    return (
        <span
            className={`${CLASS_NAMES.CLEARICON} sf-input-icon sf-no-hover ${inputValue === '' ? CLASS_NAMES.CLEARICONHIDE : ''}`}
            aria-label={clear}
            title={clear}
            role="button"
            onMouseDown={clearInput}
        >
            {clearIcon === true ? (
                <CloseIcon></CloseIcon>
            ) : (
                clearIcon
            )}
        </span>
    );
};
