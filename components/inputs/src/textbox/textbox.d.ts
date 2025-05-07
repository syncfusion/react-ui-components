import { ReactNode } from 'react';
import { FloatLabelType } from '../common/inputbase';
import * as React from 'react';
/**
 * Represents the available size options for the textbox component.
 *
 * @enum {string}
 */
export declare enum Size {
    /** Small-sized textbox with reduced dimensions */
    Small = "Small",
    /** Medium-sized textbox with reduced dimensions */
    Medium = "Medium"
}
/**
 * Represents the available visual variants for the component.
 *
 * @enum {string}
 */
export declare enum Variant {
    /** Outlined appearance with border and transparent background */
    Outlined = "Outlined",
    /** Filled appearance with solid background color */
    Filled = "Filled",
    /** Standard appearance without border and background color */
    Standard = "Standard"
}
/**
 * Represents the available color schemes for the component.
 *
 * @enum {string}
 */
export declare enum Color {
    /** Success color scheme (typically green) for positive actions or status */
    Success = "Success",
    /** Warning color scheme (typically yellow/amber) for cautionary actions or status */
    Warning = "Warning",
    /** Error color scheme (typically red) for negative actions or status */
    Error = "Error"
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
export declare const TextBox: React.ForwardRefExoticComponent<ITextBoxProps & React.RefAttributes<ITextBox>>;
export {};
