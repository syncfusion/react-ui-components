import { Orientation } from '@syncfusion/react-base';
import { CalendarType } from '../calendar-core';
import { CalendarCellProps } from './calendar-cell';
import * as React from 'react';

/**
 * Defines the context passed to a custom Calendar header template.
 */
export interface CalendarHeaderProps {
    /**
     * Specifies an optional CSS class to apply to the header container.
     * This is useful for reusing styling in a custom template.
     *
     * @default -
     */
    className?: string;

    /**
     * Specifies the current view level of the calendar (`Month`, `Year`, or `Decade`).
     *
     * @default CalendarView.Month
     */
    currentView?: CalendarView;

    /**
     * When `true`, all header interactions are disabled.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the computed header title for the current view.
     *
     * @default -
     */
    headerTitle?: string | React.ReactNode;

    /**
     * Specifies the handler to navigate to the previous period (month, year, or decade).
     * The handler is `undefined` when navigation to the previous period is not allowed.
     *
     * @default -
     */
    onPrevClick?: (e?: React.SyntheticEvent) => void;

    /**
     * Specifies the handler to navigate to the next period (month, year, or decade).
     * The handler is `undefined` when navigation to the next period is not allowed.
     *
     * @default -
     */
    onNextClick?: (e?: React.SyntheticEvent) => void;

    /**
     * Specifies the handler that is invoked when the header title is clicked.
     * This is typically used to navigate to a less granular view (for example, from `Month` to `Year`).
     *
     * @default -
     */
    onTitleClick?: (e: React.SyntheticEvent) => void;
}

/**
 * Defines the context passed to a custom Calendar footer template.
 */
export interface CalendarFooterProps {

    /**
     * Specifies an optional CSS class to apply to the footer container.
     * This is useful for reusing styling in a custom template.
     *
     * @default -
     */
    className?: string;

    /**
     * When `true`, all footer interactions are disabled.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * Specifies the label used for the button that selects the current date.
     *
     * @default "Today"
     */
    todayLabel?: string;

    /**
     * Specifies the handler invoked when the 'Today' button is clicked.
     *
     * @default -
     */
    onTodayClick?: (e: React.SyntheticEvent) => void;
}

/**
 * Specifies the view options for the calendar.
 *
 * @enum {string}
 */
export enum CalendarView {
    /**
     * Displays the calendar with a day-by-day view of a single month.
     */
    Month = 'Month',

    /**
     * Displays the calendar with a month-by-month view of a single year.
     */
    Year = 'Year',

    /**
     * Displays the calendar with a year-by-year view of a single decade.
     */
    Decade = 'Decade'
}

/**
 * Specifies the rules used to determine which week is considered
 * the first week of a calendar year.
 *
 * @enum {string}
 */
export enum WeekRule {
    /**
     * The first week begins on January first, regardless of
     * which day of the week it falls on.
     *
     */
    FirstDay = 'FirstDay',

    /**
     * The first week begins on the first occurrence of the
     * designated weekday on or after January first.
     *
     */
    FirstFullWeek = 'FirstFullWeek',

    /**
     * The first week must contain at least four days of the new year,
     * following the ISO standard definition.
     *
     */
    FirstFourDayWeek = 'FirstFourDayWeek'
}

/**
 * Defines the event arguments for the `onChange` event of the Calendar.
 */
export interface CalendarChangeEvent {
    /**
     * The selected date value. Can be a single `Date`, an array of `Date` objects, or `null`.
     */
    value: Date | Date[] | null;

    /**
     * The original browser event that triggered the change.
     *
     */
    event?: React.SyntheticEvent;
}

/**
 * Specifies the format of the day names in the week header.
 *
 * @enum {string}
 */
export enum WeekDaysFormats {
    /**
     * A short format, typically 2–3 letters (for example, 'Su').
     */
    Short = 'Short',

    /**
     * A narrow format, typically a single letter (for example, 'S').
     */
    Narrow = 'Narrow',

    /**
     * An abbreviated format (for example, 'Sun').
     */
    Abbreviated = 'Abbreviated',

    /**
     * The full-length day name (for example, 'Sunday').
     */
    Wide = 'Wide'
}

/**
 * Defines the event arguments for the `onViewChange` event of the Calendar.
 */
export interface ViewChangeEvent {
    /**
     * The name of the view to which the calendar has navigated.
     *
     * @default -
     */
    view?: string;

    /**
     * The date that the calendar is focused on or has navigated to.
     *
     * @default -
     */
    date?: Date;

    /**
     * The original browser event that triggered the navigation.
     *
     */
    event?: React.SyntheticEvent;
}

export interface CalendarProps {
    /**
     * Specifies the calendar system to use, such as 'gregorian' or 'islamic'.
     *
     * @private
     * @default 'gregorian'
     */
    calendarType?: CalendarType;

    /**
     * Specifies the selected date of the Calendar in controlled mode.
     *
     * @default -
     */
    value?: Date | Date[] | null;

    /**
     * Specifies the default selected date of the Calendar in uncontrolled mode.
     *
     * @default -
     */
    defaultValue?: Date | Date[] | null;

    /**
     * When `true`, enables the selection of multiple dates.
     *
     * @default false
     */
    multiSelect?: boolean;

    /**
     * Specifies the minimum date that can be selected in the Calendar.
     *
     * @default new Date(1900, 0, 1)
     */
    minDate?: Date;

    /**
     * Specifies the maximum date that can be selected in the Calendar.
     *
     * @default new Date(2099, 11, 31)
     */
    maxDate?: Date;

    /**
     * Specifies the first day of the week: `0` for Sunday, `1` for Monday, and so on.
     * If not set, the first day is determined by the locale.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * Specifies the initial view that the calendar renders.
     *
     * @default CalendarView.Month
     */
    start?: CalendarView;

    /**
     * Sets the most granular view the user can navigate down to.
     * For example, a `depth` of `Year` prevents navigation to the `Month` view.
     *
     * @default CalendarView.Month
     */
    depth?: CalendarView;

    /**
     * When `true`, displays the week number of the year in the month view.
     *
     * @default false
     */
    weekNumber?: boolean;

    /**
     * Specifies the rule for defining the first week of the year.
     *
     * @default WeekRule.FirstDay
     */
    weekRule?: WeekRule;

    /**
     * When `true`, displays the 'Today' button in the footer.
     *
     * @default true
     */
    showTodayButton?: boolean;

    /**
     * When `true`, an additional toolbar is displayed, typically for showing the full selected date.
     *
     * @default false
     */
    showToolBar?: boolean;

    /**
     * Specifies the format of the day names to be displayed in the week header.
     *
     * @default WeekDaysFormats.Short
     */
    weekDaysFormat?: WeekDaysFormats;

    /**
     * When `true`, shows dates from the previous and next months in the current month's view.
     *
     * @default true
     */
    showDaysOutsideCurrentMonth?: boolean;

    /**
     * When `true`, disables all dates in the past relative to the current day.
     *
     * @default false
     */
    disablePastDays?: boolean;

    /**
     * When `true`, disables all dates in the future relative to the current day.
     *
     * @default false
     */
    disableFutureDays?: boolean;

    /**
     * Defines the layout orientation of the calendar.
     *
     * @default Orientation.Vertical
     */
    orientation?: Orientation;

    /**
     * When `true`, the component is disabled and non-interactive.
     *
     * @default false
     */
    disabled?: boolean;

    /**
     * When `true`, the calendar value cannot be changed by user interaction.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Specifies a custom template for rendering the content of each calendar cell.
     * Can be a React node or a function that returns a React node.
     *
     * @default -
     */
    cellTemplate?: ((props: CalendarCellProps) => React.ReactNode);

    /**
     * Specifies a custom template for the calendar footer.
     * If not provided, a default footer with a 'Today' button is rendered.
     *
     * @default -
     */
    footerTemplate?: ((props: CalendarFooterProps) => React.ReactNode);

    /**
     * Specifies a custom template for the calendar header.
     * If not provided, a default header with navigation controls is rendered.
     *
     * @default -
     */
    headerTemplate?: ((props: CalendarHeaderProps) => React.ReactNode);

    /**
     * Triggers when the calendar's `value` is changed through user interaction.
     *
     * @event onChange
     */
    onChange?: (event: CalendarChangeEvent) => void;

    /**
     * Triggers when the calendar navigates to a new view or date range.
     *
     * @event onViewChange
     */
    onViewChange?: (event: ViewChangeEvent) => void;
}

