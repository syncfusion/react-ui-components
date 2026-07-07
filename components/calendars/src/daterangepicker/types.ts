import { CalendarBaseProps, CalendarHeaderProps } from '../../calendar';
import { InputProps, PickerVariant } from '../datepicker';


export interface DateRangePreset {
    /** Text shown for the preset option (e.g., "Last 7 days") */
    label: string;

    /** Preset start date (inclusive) */
    start: Date;

    /** Preset end date (inclusive) */
    end: Date;
}

export interface DateRangePickerProps  extends CalendarBaseProps , InputProps {
    /**
     * Specifies the selected date range in controlled mode.
     *
     * @default null
     */
    value?: [Date | null, Date | null];

    /**
     * Specifies the initial date range in uncontrolled mode.
     *
     * @default null
     */
    defaultValue?: [Date | null, Date | null];

    /**
     * Specifies the callback fired when the value (selected date range) changes.
     *
     * @event onChange
     */
    onChange?: (value: [Date | null, Date | null]) => void;

    /**
     * Specifies the display format used in the input(s).
     *
     * @default 'MM/dd/yyyy'
     */
    format?: string;

    /**
     * Specifies acceptable input parse formats for free typing.
     *
     * @default []
     */
    inputFormats?: string[];

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
     * Specifies preset shortcut ranges rendered in the popup.
     *
     * @default []
     */
    presets?: DateRangePreset[];

    /**
     * Specifies the string separator used between start and end in single-input mode.
     *
     * @default ' - '
     */
    separator?: string;

    /**
     * Specifies the minimum span (in days) allowed for the range.
     *
     * @default -
     */
    minRangeDays?: number | null;

    /**
     * Specifies the maximum span (in days) allowed for the range.
     *
     * @default -
     */
    maxRangeDays?: number | null;

    /**
     * Specifies a custom template for the calendar header.
     * If not provided, a default header with navigation controls is rendered.
     *
     * @default -
     */
    headerTemplate?: ((props: CalendarHeaderProps) => React.ReactNode);

    /**
     * Specifies the callback fired when the popup opens.
     *
     * @event onOpen
     */
    onOpen?: () => void;

    /**
     * Specifies the callback fired when the popup closes.
     *
     * @event onClose
     */
    onClose?: () => void;
}

/**
 * Defines the event arguments for the `onChange` event of the DateRangepicker.
 */
export interface DateRangePickerChangeEvent {
    /**
     * The original browser event that triggered the change.
     *
     */
    event?: React.SyntheticEvent;

    /**
     * The selected date value.
     */
    value: [Date | null, Date | null];
}
