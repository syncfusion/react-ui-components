import { ChangeEvent } from 'react';
import * as React from 'react';
import { Size } from '../button/button';
/**
 * Interface representing Switch component properties.
 *
 */
export interface SwitchProps {
    /**
     * Specifies a value that indicates whether the Switch is `checked` or not. When set to `true`, the Switch will be in `checked` state.
     *
     *
     * @default false
     */
    checked?: boolean;
    /**
     * Defines `name` attribute for the Switch. It is used to reference form data (Switch value) after a form is submitted.
     *
     * @default -
     */
    name?: string;
    /**
     * Specifies a text that indicates the Switch is in checked state.
     *
     * @default -
     */
    onLabel?: string;
    /**
     * Specifies a text that indicates the Switch is in unchecked state.
     *
     * @default -
     */
    offLabel?: string;
    /**
     * Defines `value` attribute for the Switch. It is a form data passed to the server when submitting the form.
     *
     * @default -
     */
    value?: string;
    /**
     * Specifies the size style of the switch button. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;
    /**
     * Callback fired on change event.
     *
     *  @event change
     */
    onChange?: (args: ChangeEvent<HTMLInputElement>) => void;
}
/**
 * Interface for exposing imperative methods for the Switch component.
 */
export interface ISwitch extends SwitchProps {
    /**
     * This is Switch component element.
     *
     * @private
     * @default null
     */
    element?: HTMLElement | null;
}
type ISwitchProps = ISwitch & React.InputHTMLAttributes<HTMLInputElement>;
/**
 * The Switch component is a toggle switch offering a binary decision interface, visually indicating the state between on and off with optional label customization for clear communication.
 *
 * ```typescript
 * <Switch checked={true} onLabel="Enabled" offLabel="Disabled" />
 * ```
 */
export declare const Switch: React.ForwardRefExoticComponent<ISwitchProps & React.RefAttributes<ISwitch>>;
export default Switch;
