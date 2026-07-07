import { CalendarBaseProps, CalendarHeaderProps } from '../calendar';
import { InputProps, PickerVariant } from '../datepicker';

export interface DateTimePickerProps extends CalendarBaseProps , InputProps {
    /**
     * Specifies the controlled date-time value of the picker. When provided, the component operates in controlled mode and relies on `onChange` to notify updates.
     *
     * @default -
     */
    value?: Date | null;

    /**
     * Specifies the initial date-time value when the component manages its own state (uncontrolled mode).
     *
     * @default -
     */
    defaultValue?: Date | null;

    /**
     * Specifies the display/parse format used for the text input combining both date and time tokens (e.g., 'MM/dd/yyyy h:mm a' or 'yyyy-MM-dd HH:mm').
     * Parsing is strict to supported tokens; locale-aware names/symbols are applied.
     *
     * @default 'MM/dd/yyyy h:mm a'
     */
    format?: string;

    /**
     * Specifies additional patterns accepted when parsing typed input. The first pattern that successfully parses wins; does not affect display formatting.
     *
     * @default []
     */
    inputFormats?: string[];

    /**
     * Specifies the lower boundary for selectable time on the active day; only the time portion is considered.
     *
     * @default null
     */
    minTime?: Date;

    /**
     * Specifies the upper boundary for selectable time on the active day; only the time portion is considered.
     *
     * @default -
     */
    maxTime?: Date;

    /**
     * Specifies the minutes between adjacent time options in the time list.
     *
     * @default 30
     */
    step?: number;

    /**
     * Specifies the popup presentation variant: inline, dialog, or auto (desktop → Inline, mobile → Dialog).
     *
     * @default 'Auto'
     */
    pickerVariant?: PickerVariant;

    /**
     * Specifies whether the DateTime picker shows the "Today" action for quick return to the current date.
     *
     * @default true
     */
    showTodayButton?: boolean;

    /**
     * Specifies a custom template for the calendar header.
     * If not provided, a default header with navigation controls is rendered.
     *
     * @default -
     */
    headerTemplate?: ((props: CalendarHeaderProps) => React.ReactNode);

    /**
     * Specifies a custom template renderer for time list items.
     *
     * @default -
     */
    itemTemplate?: (time: Date) => React.ReactNode;

    /**
     * Triggers when the DateTimePicker value is changed.
     *
     * @event onChange
     */
    onChange?: (event: DateTimePickerChangeEvent) => void;

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
 * Defines the event arguments for the `onChange` event of the DateTimepicker.
 */
export interface DateTimePickerChangeEvent {
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
