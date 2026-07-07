import { RadioButtonChangeEvent } from '@syncfusion/react-buttons';
import { DatePickerChangeEvent } from '@syncfusion/react-calendars';
import { ChangeEvent } from '@syncfusion/react-dropdowns';
import { NumericChangeEvent } from '@syncfusion/react-inputs';

/**
 * Allowed types for the recurrence end behavior.
 * - `Count` — repeat a fixed number of occurrences
 * - `Until` — repeat until a specific date
 * - `Never` — no end (infinite)
 */
export type EndType = 'Count' | 'Until' | 'Never';

/**
 * Frequency values used by the editor and RRULE generation.
 */
export type FreqType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Formats used when rendering day names from CLDR data.
 */
export type DayFormatType = 'narrow' | 'wide' | 'short';

/**
 * Mode for monthly/yearly selection: by day-of-month or by weekday/week-index.
 */
export type DayWeekType = 'day' | 'week';

/**
 * Simple typed item for dropdowns used by the editor.
 */
export type DropdownData = { text: string; value: number };

/**
 * Localized day item used for weekday lists and dropdowns.
 */
export interface RecurrenceItems {
    /** Human-readable label for the day (localized) */
    text: string;
    /** Two-letter weekday code used in RRULE (e.g. 'MO', 'TU') */
    value: string;
}

/**
 * Props for the top-level `RecurrenceEditor` component.
 * These props are intentionally minimal — the editor consumes an RRULE
 * string (`value`) and reports changes via `onChange` with a
 * `{ value: string }` payload to match the rest of the scheduling API.
 *
 */
export interface RecurrenceEditorProps {
    /** RRULE string value representing the recurrence rule. Optional for uncontrolled usage. */
    value?: string;
    /** Array of frequency options for the repeat-mode dropdown (e.g. ['DAILY','WEEKLY']). */
    frequencies?: FreqType[];
    /** End type options (Never, Count, Until). */
    endTypes?: EndType[];
    /** First day of week index (0=Sunday, 1=Monday, etc.). Defaults to 0. */
    firstDayOfWeek?: number;
    /** Start date used for initial state and RRULE calculations. Defaults to `new Date()`. */
    startDate?: Date;
    /** Callback fired when recurrence rule changes. Receives `{ value: string }`. */
    onChange?: (e: RecurrenceChangeEvent) => void;
}

/**
 * Public shape of the change event emitted by the `RecurrenceEditor`.
 */
export interface RecurrenceChangeEvent {
    /** The new RRULE string. */
    value: string;
}

/**
 * Internal editor state (serializable / mappable to an RRULE).
 */
export interface RecurrenceState {
    freq: FreqType;
    endType: EndType;
    interval: number;
    count: number;
    month: number;
    weekDay: string;
    monthDate: number;
    dayWeekMode: DayWeekType;
    weekNumber: number;
    weekDays: string[];
    until: Date | null;
    maxDate: number | null;
}

/**
 * Collection of UI handlers returned by the `useRecurrenceEditor` hook.
 * These handlers are typed to match the Syncfusion control change events.
 */
export interface RecurrenceHandlers {
    onFreqChange: (e?: ChangeEvent) => void;
    onEndTypeChange: (e?: ChangeEvent) => void;
    onIntervalChange: (e?: NumericChangeEvent) => void;
    onCountChange: (e?: NumericChangeEvent) => void;
    onMonthChange: (e?: ChangeEvent) => void;
    onWeekDayChange: (e?: ChangeEvent) => void;
    onMonthDateChange: (e?: NumericChangeEvent) => void;
    onDayWeekChange: (e?: RadioButtonChangeEvent) => void;
    onWeekNumber: (e?: ChangeEvent) => void;
    onUntilChange: (e?: DatePickerChangeEvent) => void;
    onToggleSelectedWeekDay: (code: string) => void;
}
