import { LabelMode, Size, Variant } from '@syncfusion/react-base';
import { PickerVariant } from '../datepicker/types';

/**
 * Interface for TimePicker component props.
 *
 */
export interface TimePickerProps {
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
     * Specifies the placeholder text to be displayed in the input element.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies the visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

    /**
     * Specifies the size style of the Timepicker. Options include 'Small', 'Medium' and 'Large'.
     *
     * @default Size.Medium
     */
    size?: Size;

    /**
     * Specifies whether the TimePicker component is in read-only mode.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Specifies whether the TimePicker component is disabled.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies whether to show the clear button in the TimePicker.
     *
     * @default true
     */
    clearButton?: boolean;

    /**
     * Specifies the z-index value of the TimePicker popup element.
     *
     * @default 1000
     */
    zIndex?: number;

    /**
     * Specifies whether the TimePicker should act as a strict time selector.
     * When enabled, the component allows selection of valid time values only.
     *
     * @default false
     */
    strictMode?: boolean;

    /**
     * Specifies whether the TimePicker popup is open or not.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies whether the TimePicker allows users to edit the time value.
     *
     * @default true
     */
    editable?: boolean;

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
     * Specifies whether the TimePicker popup should open when the input is focused.
     *
     * @default false
     */
    openOnFocus?: boolean;

    /**
     * Specifies whether the component value is valid.
     *
     * @default true
     */
    valid?: boolean;

    /**
     * Specifies the validation message to display when the component is valid.
     *
     * @default -
     */
    validMessage?: string;

    /**
     * Specifies whether to apply validation styles.
     *
     * @default false
     */
    validityStyles?: boolean;

    /**
     * Specifies whether the component is required.
     *
     * @default false
     */
    required?: boolean;

    /**
     * Specifies the behavior of the floating label.
     *
     * @default 'Auto'
     */
    labelMode?: LabelMode;

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
