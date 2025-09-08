import * as React from 'react';
import { forwardRef } from 'react';

/**
 * Defines the props for the CalendarCell component.
 *
 */
export interface CalendarCellProps {
    /**
     * Sets a custom CSS class to the calendar cell.
     *
     * @default string
     */
    className?: string;

    /**
     * Determines if the calendar cell is disabled and non-interactive.
     *
     * @default false
     */
    isDisabled?: boolean;

    /**
     * Specifies if the cell is out of current view range (like previous or next month dates in month view).
     *
     */
    isOutOfRange?: boolean;

    /**
     * Specifies if the current cell represents today's date.
     *
     * @default false
     */
    isToday?: boolean;

    /**
     * Specifies if the current cell is selected.
     *
     * @default false
     */
    isSelected?: boolean;

    /**
     * Specifies if the current cell has focus.
     *
     * @default false
     */
    isFocused?: boolean;

    /**
     * Specifies if the cell represents a weekend day.
     *
     * @default false
     */
    isWeekend?: boolean;

    /**
     * The date value represented by the cell.
     *
     */
    date: Date;

    /**
     * The content to be displayed inside the cell.
     *
     * @default null
     */
    children?: React.ReactNode;

    /**
     * Callback function triggered when a cell is clicked.
     *
     * @default null
     */
    onClick?: (event: React.MouseEvent<HTMLTableCellElement>, date: Date) => void;

    /**
     * The id attribute for the cell.
     *
     * @default -
     */
    id?: string;

    /**
     * Optional title attribute for the cell.
     *
     * @default -
     */
    title?: string;
}

/**
 * The CalendarCell component is internally used for rendering the items in the current view.
 * It can also be used as a custom cell of the Calendar.
 */
export const CalendarCell: React.ForwardRefExoticComponent<CalendarCellProps & React.RefAttributes<HTMLTableCellElement>> =
forwardRef<HTMLTableCellElement, CalendarCellProps>((props: CalendarCellProps, ref: React.Ref<HTMLTableCellElement>) => {
    const {
        className,
        isDisabled = false,
        isOutOfRange = false,
        isToday = false,
        isSelected = false,
        isFocused = false,
        isWeekend = false,
        date,
        children,
        onClick,
        id,
        title
    } = props;

    const baseClasses: string[] = [
        'sf-cell',
        className || '',
        isOutOfRange ? 'sf-other-month' : '',
        isWeekend ? 'sf-weekend' : '',
        (isDisabled) ? 'sf-disabled sf-overlay' : '',
        isToday ? 'sf-today' : '',
        (isToday && isFocused) ? 'sf-focused-date' : '',
        (isFocused) ? 'sf-focused-date' : '',
        isSelected ? 'sf-selected' : ''
    ].filter(Boolean);

    const handleClick: (e: React.MouseEvent<HTMLTableCellElement>) => void = (e: React.MouseEvent<HTMLTableCellElement>) => {
        if (!isDisabled && onClick) {
            onClick(e, date);
        }
    };

    return (
        <td
            id={id}
            ref={ref}
            className={baseClasses.join(' ')}
            onClick={handleClick}
            aria-selected={isSelected}
            aria-disabled={isDisabled}
            title={title}
            data-date={date ? date.getTime().toString() : ''}
        >
            {children}
        </td>
    );
});

export default CalendarCell;
