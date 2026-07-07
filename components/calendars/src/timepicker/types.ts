import { InputProps, PickerVariant } from '../datepicker/types';

/**
 * Interface for TimePicker component props.
 *
 */
export interface TimePickerProps extends InputProps {
    /**
     * Specifies the selected time value of the component.
     *
     * @default -
     */
    value?: Date | null;

    /**
     * Specifies the default selected time value of the component.
     *
     * @default -
     */
    defaultValue?: Date | null;

    /**
     * Specifies the format string to display the time value.
     *
     * @default 'h:mm a'
     */
    format?: string;

    /**
     * Specifies the minimum time that can be selected.
     *
     * @default -
     */
    minTime?: Date | null;

    /**
     * Specifies the maximum time that can be selected.
     *
     * @default -
     */
    maxTime?: Date | null;

    /**
     * Specifies the time interval in minutes between two adjacent time values in the popup list.
     *
     * @default 30
     */
    step?: number;

    /**
     * Specifies whether the TimePicker should display in full screen mode on mobile devices.
     *
     * @default false
     */
    fullScreenMode?: boolean;

    /**
     * Specifies the display variant of the calendar popup.
     * - Inline: anchored popup near the input (both desktop and mobile)
     * - Dialog: centered dialog overlay (both desktop and mobile)
     * - Auto: desktop = Inline, mobile = Dialog
     *
     * @default PickerVariant.Auto
     */
    pickerVariant?: PickerVariant;

    /**
     * Provides a template for displaying content within the dropdown items.
     *
     * @default -
     */
    itemTemplate?: (time: Date) => React.ReactNode;

    /**
     * Triggered when the selected time value changes.
     *
     * @event change
     */
    onChange?: (event: TimePickerChangeEvent) => void;

    /**
     * Triggered when the TimePicker popup opens.
     *
     * @event open
     */
    onOpen?: () => void;

    /**
     * Triggered when the TimePicker popup closes.
     *
     * @event close
     */
    onClose?: () => void;
}

/**
 * Defines the event arguments for the `onChange` event of the Timepicker.
 */
export interface TimePickerChangeEvent {
    /**
     * The selected time value. Can be a single `Time` or `null`.
     */
    value: Date | null;

    /**
     * The original browser event that triggered the change.
     *
     */
    event?: React.SyntheticEvent;
}
