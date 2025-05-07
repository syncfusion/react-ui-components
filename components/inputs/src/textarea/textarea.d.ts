import * as React from 'react';
import { FloatLabelType } from '../common/inputbase';
import { Variant } from '../textbox/textbox';
/**
 * Defines the available resize modes for components that support resizing.
 *
 * @enum {string}
 */
export declare enum ResizeMode {
    /**
     * Disables resizing functionality.
     */
    None = "None",
    /**
     * Enables resizing in both horizontal and vertical directions.
     */
    Both = "Both",
    /**
     * Enables resizing only in the horizontal direction.
     */
    Horizontal = "Horizontal",
    /**
     * Enables resizing only in the vertical direction.
     */
    Vertical = "Vertical"
}
export interface TextAreaProps {
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
     * Resize mode for the textarea
     *
     * @default 'Both'
     */
    resizeMode?: ResizeMode;
    /**
     * Number of columns for the textarea
     *
     * @default -
     */
    cols?: number;
    /**
     * Determines whether to show a clear button within the input field.
     * When enabled, a clear button (×) appears when the field has a value,
     * allowing users to quickly clear the input with a single click.
     *
     * @default false
     */
    clearButton?: boolean;
    /**
     * Number of rows for the textarea
     *
     * @default 2
     */
    rows?: number;
    /**
     * Callback fired when the input value is changed.
     *
     * @event onChange
     * @param {React.ChangeEvent<HTMLTextAreaElement>} event - The change event object containing the new value.
     * @returns {void}
     */
    onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    /**
     * The visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;
}
export interface ITextArea extends TextAreaProps {
    /**
     * This is TextArea component element.
     *
     * @private
     * @default null
     */
    element?: HTMLTextAreaElement | null;
}
type ITextAreaProps = TextAreaProps & Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, keyof TextAreaProps>;
/**
 * TextArea component that provides a multi-line text input field with enhanced functionality.
 * Supports both controlled and uncontrolled modes based on presence of value or defaultValue prop.
 *
 * ```typescript
 * <TextArea defaultValue="Initial text" placeholder="Enter text" rows={5} cols={40} />
 * ```
 */
export declare const TextArea: React.ForwardRefExoticComponent<ITextAreaProps & React.RefAttributes<ITextArea>>;
export default TextArea;
