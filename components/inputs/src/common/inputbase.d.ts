import { ChangeEvent, JSX } from 'react';
/**
 * Constant object containing CSS class names used throughout the component.
 */
export declare const CLASS_NAMES: {
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
export declare enum FloatLabel {
    /**
     * Label never floats, remains in its default position regardless of field state.
     */
    Never = "Never",
    /**
     * Label always appears in the floating position, regardless of field state.
     */
    Always = "Always",
    /**
     * Label automatically floats when the field has content or is focused,
     * and returns to default position when empty and not focused.
     */
    Auto = "Auto"
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
export declare const InputBase: React.ForwardRefExoticComponent<InputArgs & React.RefAttributes<HTMLInputElement>>;
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
export declare const renderFloatLabelElement: (floatLabelType: FloatLabelType, isFocused: boolean, inputValue: string | number, placeholder: string | undefined, id: string) => React.ReactElement | null;
export declare const renderClearButton: (inputValue: string, clearInput: () => void) => JSX.Element;
