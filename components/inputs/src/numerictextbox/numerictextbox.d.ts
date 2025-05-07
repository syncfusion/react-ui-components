import { FloatLabelType } from '../common/inputbase';
import { Size } from '../textbox/textbox';
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
    onChange?: (args: React.ChangeEvent<HTMLInputElement>, value: number | null) => void;
    /**
     * The size configuration of the component.
     *
     * @default Size.Medium
     */
    size?: Size;
}
export interface INumericTextBox extends NumericTextBoxProps {
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
export declare const NumericTextBox: React.ForwardRefExoticComponent<INumericTextBoxProps & React.RefAttributes<INumericTextBox>>;
export default NumericTextBox;
