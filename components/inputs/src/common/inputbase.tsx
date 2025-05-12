import { ChangeEvent, useCallback, JSX, FocusEvent, KeyboardEvent as ReactKeyboardEvent, forwardRef } from 'react';
import { SvgIcon } from '@syncfusion/react-base';

/**
 * Constant object containing CSS class names used throughout the component.
 */

export const CLASS_NAMES: {
    RTL: string;
    DISABLE: string;
    WRAPPER: string;
    INPUT: string;
    INPUTGROUP: string;
    FLOATINPUT: string;
    FLOATLINE: string;
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

export interface IInput {
    placeholder: string;
    className: string;
    disabled?: boolean;
    readOnly?: boolean;
    floatLabelType?: FloatLabelType;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Represents the behavior options for floating labels in form fields.
 *
 * @enum {string}
 */
export enum FloatLabel {
    /**
     * Label never floats, remains in its default position regardless of field state.
     */
    Never = 'Never',

    /**
     * Label always appears in the floating position, regardless of field state.
     */
    Always = 'Always',

    /**
     * Label automatically floats when the field has content or is focused,
     * and returns to default position when empty and not focused.
     */
    Auto = 'Auto'
}

/**
 * Type definition for float label type.
 */
export type FloatLabelType = FloatLabel | string;

/**
 * Interface for input arguments.
 */
export interface IInputArgs {
    customTag?: string;
    floatLabelType?: FloatLabelType;
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

export type InputArgs = IInputArgs & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof IInputArgs>;

export const InputBase: React.ForwardRefExoticComponent<InputArgs & React.RefAttributes<HTMLInputElement>> =
 forwardRef<HTMLInputElement, InputArgs>(({
     type, readOnly = false, disabled = false, floatLabelType = 'Never', onFocus, className = '',
     onBlur, placeholder, onKeyDown, value, defaultValue, onChange, ...rest
 }: InputArgs, ref: React.ForwardedRef<HTMLInputElement>) => {
     const inputClassNames: () => string = () => {
         return classArray.join(' ');
     };

     const classArray: string[] = [CLASS_NAMES.INPUT, className];

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

     const handleKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void = (event: ReactKeyboardEvent<HTMLInputElement>) => {
         if (onKeyDown) {
             onKeyDown(event);
         }
     };

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
             className={inputClassNames()}
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
 * @param {FloatLabelType} floatLabelType - The type of float label.
 * @param {boolean} isFocused - Whether the input is focused.
 * @param {string} inputValue - The current input value.
 * @param {string} placeholder - The placeholder text.
 * @param {any} id - The reference to the input element.
 * @returns {React.ReactElement | null} A React element representing the float label, or null if not applicable.
 */
export const renderFloatLabelElement: (floatLabelType: FloatLabelType,
    isFocused: boolean, inputValue: string | number, placeholder: string | undefined,
    id: string) => React.ReactElement | null = (
    floatLabelType: FloatLabelType,
    isFocused: boolean,
    inputValue: string | number,
    placeholder: string = '',
    id: string
): React.ReactElement | null => {
    if (floatLabelType === 'Never') {return null; }
    return (
        <>
            <span className={CLASS_NAMES.FLOATLINE}></span>
            <label
                className={`${CLASS_NAMES.FLOATTEXT} ${(floatLabelType === 'Always' || (floatLabelType === 'Auto' && (isFocused || inputValue))) ? CLASS_NAMES.LABELTOP : CLASS_NAMES.LABELBOTTOM}`}
                htmlFor={(id) || ''}
            >
                {placeholder}
            </label>
        </>
    );
};

export const renderClearButton: (inputValue: string, clearInput: () => void) => JSX.Element =
(inputValue: string, clearInput: () => void) => (
    <span
        className={`${CLASS_NAMES.CLEARICON} ${inputValue === '' ? CLASS_NAMES.CLEARICONHIDE : ''}`}
        aria-label="clear"
        role="button"
        onClick={clearInput}
    >
        <SvgIcon height='14' width='14' d='M8.58578 10.0001L0.585754 2.00003L1.99997 0.585815L10 8.58584L18 0.585815L19.4142 2.00003L11.4142 10.0001L19.4142 18L18 19.4142L10 11.4143L2.00003 19.4142L0.585812 18L8.58578 10.0001Z'></SvgIcon>
    </span>
);
