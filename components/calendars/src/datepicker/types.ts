import { inputBaseProps, HorizontalAlignment } from '@syncfusion/react-inputs';
import { CalendarBaseProps, CalendarUiProps } from '../calendar';
import { LabelMode, Variant, Size } from '@syncfusion/react-base';
import { PopupSettings, CollisionAxis, CollisionType } from '@syncfusion/react-popups';
export { Variant, Size, HorizontalAlignment };
export { PopupSettings, CollisionAxis, CollisionType };

/**
 * Specifies the variant behavior for picker components, determining how the popup is displayed across devices.
 */
export enum PickerVariant {
    /**
     * Specifies that the picker is always displayed as an anchored popup, suitable for both desktop and mobile.
     */
    Inline = 'Inline',

    /**
     * Specifies that the picker is always displayed as a centered dialog overlay, suitable for both desktop and mobile.
     */
    Popup = 'Popup',

    /**
     * Specifies that the picker automatically chooses the display mode based on device type:
     * desktop uses Inline, mobile uses Popup.
     */
    Auto = 'Auto'
}

/**
 * Specifies placeholder overrides for date/time segments
 * in masked input. Applicable only when `inputMask` is true.
 *
 */
export interface MaskPlaceholder {
    /**
     * Specifies the placeholder for the day segment (e.g., "dd").
     */
    day?: string;
    /**
     * Specifies the placeholder for the month segment (e.g., "mm" or localized month).
     */
    month?: string;
    /**
     * Specifies the placeholder for the year segment (e.g., "yyyy").
     */
    year?: string;
    /**
     * Specifies the placeholder for the hour segment (e.g., "hh" or "HH").
     */
    hour?: string;
    /**
     * Specifies the placeholder for the minute segment (e.g., "mm").
     */
    minute?: string;
    /**
     * Specifies the placeholder for the second segment (e.g., "ss").
     */
    second?: string;
    /**
     * Specifies the placeholder for the meridiem segment (e.g., "AM/PM").
     */
    meridiem?: string;
}

export interface InputProps extends inputBaseProps {
    /**
     * Specifies the placeholder text to display in the input box when no value is set.
     *
     * @default -
     */
    placeholder?: string;

    /**
     * Specifies the float label behavior.
     * Possible values:
     * * `Never` - The label will never float.
     * * `Auto` - The label floats when the input has focus, value, or placeholder.
     * * `Always` - The label always floats.
     *
     * @default 'Never'
     */
    labelMode?: LabelMode;

    /**
     * Specifies the calendar/datepicker icon rendered in the input.
     *
     * @default undefined
     */
    pickerIcon?: React.ReactNode;

    /**
     * Specifies whether the component is disabled or not.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies whether the component is in read-only mode.
     * When enabled, users cannot change input value or open the picker.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Specifies whether the input field can be edited directly.
     * When false, only allows selection via calendar.
     *
     * @default true
     */
    editable?: boolean;

    /**
     * Specifies whether the DatePicker is a required field in a form.
     * When set to true, the component will be marked as required.
     *
     * @default false
     */
    required?: boolean;

    /**
     * Overrides the validity state of the component.
     * If valid is set, the required property will be ignored.
     *
     * @default false
     */
    valid?: boolean;

    /**
     * Controls the form error message of the component.
     *
     * @default -
     */
    validationMessage?: string;

    /**
     * If set to false, no visual representation of the invalid state of the component will be applied.
     *
     * @default true
     */
    validityStyles?: boolean;

    /**
     * Specifies whether to show the clear button within the input field.
     *
     * @default true
     */
    clearButton?: boolean;

    /**
     * Enables strict date validation mode.
     * When enabled, invalid values are prevented or auto-corrected.
     *
     * @default false
     */
    strictMode?: boolean;

    /**
     * When true, should open the calendar popup on input focus.
     *
     * @default false
     */
    openOnFocus?: boolean;

    /**
     * Specifies whether the calendar popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies additional HTML attributes to apply to the underlying input element. Values provided here can override default aria-* attributes set by the component.
     *
     */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue'>;

    /**
     * Specifies configuration for the popup, including positioning,
     * collision handling, sizing, and layering behavior.
     *
     * @default -
     */
    popupSettings?: PopupSettings;

    /**
     * Specifies whether to enable a segment-based masked input driven by the
     * current `format` instead of a free-text input.
     *
     * @default false
     */
    inputMask?: boolean;

    /**
     * Per-segment placeholder overrides for the mask input.
     * Only relevant when `inputMask=true`.
     *
     * @default -
     */
    maskPlaceholder?: MaskPlaceholder;
}

export interface DatePickerProps extends CalendarBaseProps , InputProps, CalendarUiProps {
    /**
     * Specifies the date format string for displaying and parsing date values.
     * Examples: 'MM/dd/yyyy', 'yyyy-MM-dd', etc.
     *
     * @default 'M/d/yyyy'
     */
    format?: string;

    /**
     * Specifies an array of acceptable date input formats for parsing user input.
     * Can be an array of strings or FormatObject.
     *
     * @default -
     */
    inputFormats?: string[];

    /**
     * Specifies the selected date of the DatePicker for controlled usage.
     *
     * @default -
     *
     */
    value?: Date | null;

    /**
     * Specifies the default selected date of the DatePicker for uncontrolled mode.
     *
     * @default -
     *
     */
    defaultValue?: Date;

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
     * Triggers when the DatePicker value is changed.
     *
     * @event onChange
     */
    onChange?: (event: DatePickerChangeEvent) => void;

    /**
     * Triggers when the calendar popup opens.
     *
     * @event onOpen
     */
    onOpen?: () => void;

    /**
     * Triggers when the calendar popup closes.
     *
     * @event onClose
     */
    onClose?: () => void;
}

/**
 * Defines the event arguments for the `onChange` event of the Datepicker.
 */
export interface DatePickerChangeEvent {
    /**
     * The selected date value. A single `Date` or `null`.
     */
    value: Date | null;

    /**
     * The original browser event that triggered the change.
     *
     */
    event?: React.SyntheticEvent;
}
