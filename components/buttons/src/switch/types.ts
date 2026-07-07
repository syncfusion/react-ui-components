import { Color, Position, Size } from '@syncfusion/react-base';

/**
 * Interface for Switch change event arguments
 */
export interface SwitchChangeEvent {
    /**
     * The original DOM change event from the input element.
     */
    event: React.ChangeEvent<HTMLInputElement>;

    /**
     * The new checked state of the Switch after toggle.
     */
    value: boolean;
}

/**
 * Properties interface for the Switch component
 */
export interface SwitchProps {
    /**
     * Specifies a value that indicates whether the Switch is `checked` or not. Activates controlled mode.
     *
     * @default -
     */
    checked?: boolean;

    /**
     * Specifies the initial checked state of the Switch. Use for uncontrolled components.
     *
     * @default false
     */
    defaultChecked?: boolean;

    /**
     * Specifies the text label rendered adjacent to the switch track.
     *
     * @default -
     */
    label?: string;

    /**
     * Specifies the position of the label relative to the Switch track.
     *
     * @default Position.Right
     */
    labelPlacement?: Position;

    /**
     * Specifies a custom icon to render inside the handle when the switch is ON (checked).
     *
     * @default -
     */
    checkedIcon?: React.ReactNode;

    /**
     * Specifies a custom icon to render inside the handle when the switch is OFF (unchecked).
     *
     * @default -
     */
    uncheckedIcon?: React.ReactNode;

    /**
     * Specifies the React node rendered inside the track when the switch is ON. Can be text or icon.
     *
     * @default -
     */
    onTrackLabel?: React.ReactNode;

    /**
     * Specifies the React node rendered inside the track when the switch is OFF. Can be text or icon.
     *
     * @default -
     */
    offTrackLabel?: React.ReactNode;

    /**
     * Specifies the Color style applied to the ON state track and handle.
     * Options: 'Primary' | 'Secondary' | 'Warning' | 'Success' | 'Error' | 'Info'
     *
     * @default Color.Primary
     */
    color?: Color;

    /**
     * Specifies the Size preset controlling track and handle dimensions.
     * Options: 'Small' | 'Medium' | 'Large'
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies the HTML form value submitted when the switch is checked.
     *
     * @default -
     */
    value?: string;

    /**
     * Triggers when the user toggles the switch.
     * `event.value` is the new boolean state.
     *
     * @event onChange
     */
    onChange?: (event: SwitchChangeEvent) => void;
}
