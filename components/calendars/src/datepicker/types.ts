import { CalendarCellProps, CalendarFooterProps, CalendarHeaderProps, CalendarView, ViewChangeEvent, WeekDaysFormats, WeekRule } from '../calendar';
import { LabelMode, Orientation, Variant } from '@syncfusion/react-base';
export { Variant };

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

export interface DatePickerProps {
    /**
     * Specifies the placeholder text to display in the input box when no value is set.
     *
     * @default -
     */
    placeholder?: string;

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
     * Specifies the visual style variant of the component.
     *
     * @default Variant.Standard
     */
    variant?: Variant;

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
     * Specifies the minimum date that can be selected in the DatePicker.
     *
     * @default new Date(1900, 0, 1)
     */
    minDate?: Date;

    /**
     * Specifies the maximum date that can be selected in the DatePicker.
     *
     * @default new Date(2099, 11, 31)
     */
    maxDate?: Date;

    /**
     * Specifies the initial view of the Calendar when it is opened.
     *
     * @default Month
     */
    start?: CalendarView;

    /**
     * Sets the maximum level of view such as month, year, and decade.
     * Depth view should be smaller than the start view to restrict its view navigation.
     *
     * @default Month
     */
    depth?: CalendarView;

    /**
     * Specifies whether the calendar popup is open or closed.
     *
     * @default false
     */
    open?: boolean;

    /**
     * Specifies the first day of the week for the calendar.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * Specifies whether the week number of the year is to be displayed in the calendar or not.
     *
     * @default false
     */
    weekNumber?: boolean;

    /**
     * Specifies the rule for defining the first week of the year.
     * Used only if `weekNumber` is enabled.
     *
     * @default FirstDay
     */
    weekRule?: WeekRule;

    /**
     * Specifies whether the today button is to be displayed or not.
     *
     * @default true
     */
    showTodayButton?: boolean;

    /**
     * Specifies whether the toolbar should be displayed.
     *
     * @default false
     */
    showToolBar?: boolean;

    /**
     * When set, defines the calendar's layout orientation.
     *
     * @default Orientation.Vertical
     */
    orientation?: Orientation;

    /**
     * Specifies the format of the day that to be displayed in header.
     * Possible formats are:
     * * `Short` - Sets the short format of day name (like Su) in day header.
     * * `Narrow` - Sets the single character of day name (like S) in day header.
     * * `Abbreviated` - Sets the min format of day name (like Sun) in day header.
     * * `Wide` - Sets the long format of day name (like Sunday) in day header.
     *
     * @default Short
     */
    weekDaysFormat?: WeekDaysFormats;

    /**
     * Specifies whether the input field can be edited directly.
     * When false, only allows selection via calendar.
     *
     * @default true
     */
    editable?: boolean;

    /**
     * Sets the z-index value for the dropdown popup, controlling its stacking order relative to other elements on the page.
     *
     * @default 1000
     */
    zIndex?: number;

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
     * Specifies the display variant of the calendar popup.
     * - Inline: anchored popup near the input (both desktop and mobile)
     * - Dialog: centered dialog overlay (both desktop and mobile)
     * - Auto: desktop = Inline, mobile = Dialog
     *
     * @default PickerVariant.Auto
     */
    pickerVariant?: PickerVariant;

    /**
     * Specifies whether to show dates from the previous and next months in the current month's view.
     *
     * @default true
     */
    showDaysOutsideCurrentMonth?: boolean;

    /**
     * Specifies whether to disable all dates in the past relative to the current day.
     *
     * @default false
     */
    disablePastDays?: boolean;

    /**
     * Specifies whether to disable all dates in the future relative to the current day.
     *
     * @default false
     */
    disableFutureDays?: boolean;

    /**
     * Specifies a template for rendering custom content in each day cell of the calendar.
     * Can be a React node or a function that returns a React node using calendar cell context.
     *
     * @default -
     */
    cellTemplate?: ((props: CalendarCellProps) => React.ReactNode);

    /**
     * Specifies a template for rendering custom content in the footer of the calendar.
     * If not specified, the default footer with the "Today" button is rendered.
     *
     * @default -
     */
    footerTemplate?: ((props: CalendarFooterProps) => React.ReactNode);

    /**
     * Specifies a custom template for the calendar header.
     * Accepts either a React node or a function that returns a React node.
     * If not specified, the default header is rendered.
     *
     * @default -
     */
    headerTemplate?: ((props: CalendarHeaderProps) => React.ReactNode);

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

    /**
     * Triggers when the Calendar is navigated to another level or within the same level of view.
     *
     * @event onViewChange
     */
    onViewChange?: (event: ViewChangeEvent) => void;
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
