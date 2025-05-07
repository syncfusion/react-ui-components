import { InputHTMLAttributes, ChangeEvent } from 'react';
import { LabelPlacement } from '../button/button';
/**
 * Properties interface for the CheckBox component
 *
 */
export interface CheckBoxProps {
    /**
     * Specifies if the CheckBox is in an `indeterminate` state, which visually presents it as neither checked nor unchecked; setting this to `true` will make the CheckBox appear in an indeterminate state.
     *
     * @default false
     */
    indeterminate?: boolean;
    /**
     * Defines the text label for the Checkbox component, helping users understand its purpose.
     *
     * @default -
     */
    label?: string;
    /**
     * Specifies the position of the label relative to the CheckBox. It determines whether the label appears before or after the checkbox element in the UI.
     *
     * @default 'After'
     */
    labelPlacement?: LabelPlacement;
    /**
     * Specifies a value that indicates whether the CheckBox is `checked` or not. When set to `true`, the CheckBox will be in `checked` state.
     *
     * @default false
     */
    checked?: boolean;
    /**
     * Defines `value` attribute for the CheckBox. It is a form data passed to the server when submitting the form.
     *
     *
     * @default -
     */
    value?: string;
    /**
     * Triggers when the CheckBox state has been changed by user interaction, allowing custom logic to be executed in response to the state change.
     *
     * @event change
     */
    onChange?: (args: ChangeEvent) => void;
}
/**
 * Interface to define the structure of the CheckBox component reference instance
 *
 */
export interface ICheckBox extends CheckBoxProps {
    /**
     * This is checkbox component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}
type ICheckBoxProps = ICheckBox & InputHTMLAttributes<HTMLInputElement>;
/**
 * The CheckBox component allows users to select one or multiple options from a list, providing a visual representation of a binary choice with states like checked, unchecked, or indeterminate.
 *
 * ```typescript
 * <CheckBox checked={true} label="Accept Terms and Conditions" />
 * ```
 */
export declare const CheckBox: React.ForwardRefExoticComponent<ICheckBoxProps & React.RefAttributes<ICheckBox>>;
export default CheckBox;
interface CSSCheckBoxProps {
    className?: string;
    checked?: boolean;
    label?: string;
}
export declare const CSSCheckBox: React.FC<CSSCheckBoxProps>;
