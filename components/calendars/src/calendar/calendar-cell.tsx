import * as React from 'react';
import { forwardRef } from 'react';
import { CalendarView } from './calendar';

/**
 * Defines the props for the CalendarCell component.
 */
export interface CalendarCellProps extends Omit<React.TdHTMLAttributes<HTMLTableCellElement>, ''> {
    /**
     * When `true`, the calendar cell is disabled and non-interactive.
     *
     * @default false
     */
    isDisabled?: boolean;

    /**
     * When `true`, indicates that the cell's date is outside the primary range of the current view
     * (e.g., a date from a previous or next month).
     *
     * @default false
     */
    isOutOfRange?: boolean;

    /**
     * When `true`, indicates that the cell represents today's date.
     *
     * @default false
     */
    isToday?: boolean;

    /**
     * When `true`, indicates that the cell's date is currently selected.
     *
     * @default false
     */
    isSelected?: boolean;

    /**
     * When `true`, indicates that the cell has keyboard focus.
     *
     * @default false
     */
    isFocused?: boolean;

    /**
     * When `true`, indicates that the cell represents a weekend day.
     *
     * @default false
     */
    isWeekend?: boolean;

    /**
     * When `true`, marks the cell as a week number header, typically found at the start of a row in the month view.
     *
     * @default false
     */
    weekNumber?: boolean;

    /**
     * When `true`, marks the cell as a day-of-the-week header, typically found at the top of a column in the month view.
     *
     * @default false
     */
    weekHeader?: boolean;

    /**
     * The `Date` object that the cell represents.
     *
     */
    date: Date;

    /**
     * A callback function triggered when the cell is clicked.
     *
     * @default -
     */
    onClick?: (event: React.SyntheticEvent) => void;

    /**
     * Specifies the calendar view (`Month`, `Year`, or `Decade`) in which the cell is rendered.
     * This is useful for applying view-specific logic or styling.
     *
     * @default -
     */
    view?: CalendarView;
}

/**
 * The CalendarCell component is internally used for rendering the items in the current view.
 * It can also be used as a custom cell of the Calendar.
 */
export const CalendarCell: React.ForwardRefExoticComponent<CalendarCellProps & React.RefAttributes<HTMLTableCellElement>> =
forwardRef<HTMLTableCellElement, CalendarCellProps>((props: CalendarCellProps, ref:  React.ForwardedRef<HTMLTableCellElement>) => {
    const {
        className,
        isDisabled = false,
        isOutOfRange = false,
        isToday = false,
        isSelected = false,
        isFocused = false,
        isWeekend = false,
        weekNumber,
        view,
        role,
        date,
        children,
        weekHeader,
        onClick,
        ...domProps
    } = props;

    const baseClasses: string[] = [
        'sf-cell',
        className || '',
        isOutOfRange ? 'sf-other-month' : '',
        isWeekend ? 'sf-weekend' : '',
        (isDisabled) ? 'sf-disabled' : '',
        isToday ? 'sf-today' : '',
        (isToday && isFocused) ? 'sf-focused-date' : '',
        (isFocused) ? 'sf-focused-date' : '',
        isSelected ? 'sf-selected' : ''
    ].filter(Boolean);

    const handleClick: (e: React.MouseEvent<HTMLTableCellElement>) => void = (e: React.MouseEvent<HTMLTableCellElement>) => {
        if (!isDisabled && onClick) {
            onClick(e);
        }
    };

    return weekHeader ? (
        <th className="sf-week-header"
            ref={ref}
            {...domProps}
        >
            {children}
        </th>
    ) : (
        <td ref={ref}
            role={role || 'gridcell'}
            className={baseClasses.join(' ')}
            onClick={handleClick}
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            data-date={date ? date.getTime().toString() : ''}
            {...domProps}
        >
            {children}
        </td>
    );
});

export default CalendarCell;
