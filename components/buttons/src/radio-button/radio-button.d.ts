import * as React from 'react';
import { ChangeEvent, InputHTMLAttributes } from 'react';
import { LabelPlacement } from '../button/button';
/**
 * Defines the properties for the RadioButton component.
 */
export interface RadioButtonProps {
    /**
     * Specifies a value that indicates whether the RadioButton is `checked` or not. When set to `true`, the RadioButton will be in `checked` state.
     *
     * @default false
     */
    checked?: boolean;
    /**
     * Defines the caption for the RadioButton, that describes the purpose of the RadioButton.
     *
     * @default -
     */
    label?: string;
    /**
     * Specifies the position of the label relative to the RadioButton. It determines whether the label appears before or after the radio button element in the UI.
     *
     * @default LabelPlacement.After
     */
    labelPlacement?: LabelPlacement;
    /**
     * Defines `value` attribute for the RadioButton. It is a form data passed to the server when submitting the form.
     *
     * @default -
     */
    value?: string;
    /**
     * Event trigger when the RadioButton state has been changed by user interaction.
     *
     * @event change
     */
    onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}
export interface IRadioButton extends RadioButtonProps {
    /**
     * This is RadioButton component input element.
     *
     * @private
     * @default null
     */
    element?: HTMLInputElement | null;
}
type IRadioButtonProps = IRadioButton & InputHTMLAttributes<HTMLInputElement>;
/**
 * The RadioButton component allows users to select a single option from a group, utilizing a circular input field that provides a clear user selection interface.
 *
 * ```typescript
 * <RadioButton checked={true} label="Choose this option" name="choices" />
 * ```
 */
export declare const RadioButton: React.ForwardRefExoticComponent<IRadioButtonProps & React.RefAttributes<IRadioButton>>;
declare const _default: React.NamedExoticComponent<IRadioButton & React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<IRadioButton>>;
export default _default;
