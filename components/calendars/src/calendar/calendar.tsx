import { useEffect, useRef, useState, useImperativeHandle, forwardRef, isValidElement, JSX, Ref, useCallback } from 'react';
import { IL10n, L10n, formatDate, parseDate, useProviderContext } from '@syncfusion/react-base';
import { getValue, getDefaultDateObject, isNullOrUndefined, cldrData, preRender } from '@syncfusion/react-base';
import * as React from 'react';
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { addMonths, addYears, getWeekNumber } from '../../src/utils/calendar-util';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@syncfusion/react-icons';
import { CalendarCell, CalendarCellProps } from './calendar-cell';

/**
 * Specifies the view options for the calendar.
 *
 * @enum {string}
 */
export enum CalendarView {
    /**
     * Displays the calendar by month.
     *
     */
    Month = 'Month',

    /**
     * Displays the calendar by year.
     *
     */
    Year = 'Year',

    /**
     * Displays the calendar by decade.
     *
     */
    Decade = 'Decade'
}

/**
 * Defines the event arguments for the Change event.
 */
export interface ChangeEvent {
    /**
     * The selected time value.
     *
     */
    value: Date| Date[] | null;
    /**
     * The original event object.
     *
     */
    event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>;
}

/**
 * Specifies the Type of the calendar.
 *
 */
export type CalendarType = 'Gregorian';

/**
 * Specifies the format of the day to be displayed in the header.
 *
 * @enum {string}
 */
export enum WeekDaysFormats {
    /**
     * Short format, typically a single letter.
     *
     */
    Short = 'Short',

    /**
     * Narrow format, usually a minimal abbreviation.
     *
     */
    Narrow = 'Narrow',

    /**
     * Abbreviated format, a shortened form of the day name.
     *
     */
    Abbreviated = 'Abbreviated',

    /**
     * Wide format, the full name of the day.
     *
     */
    Wide = 'Wide'
}

/**
 * Specifies the rules used to determine which week is considered
 * the first week of a calendar year.
 *
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

export interface ViewChangeEvent {
    /**
     * Specifies the current view of the Calendar.
     *
     * @default null
     */
    view?: string

    /**
     * Specifies the focused date in a view.
     *
     * @default null
     */
    date?: Date

    /**
     * Specifies the original event arguments.
     *
     * @default null
     */
    event?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
}

export interface CalendarProps {
    /**
     * Specifies the selected date of the Calendar.
     *
     * @default null
     */
    value?: Date | Date[] | null;

    /**
     * Specifies the default selected date of the Calendar for uncontrolled mode.
     *
     * @default null
     */
    defaultValue?: Date | Date[] | null;

    /**
     * Specifies the option to enable the multiple dates selection of the calendar.
     *
     * @default false
     */
    multiSelect?: boolean;

    /**
     * Specifies the minimum date that can be selected in the Calendar.
     *
     * @default new Date(1900, 00, 01)
     */
    minDate?: Date;

    /**
     * Specifies the maximum date that can be selected in the Calendar.
     *
     * @default new Date(2099, 11, 31)
     */
    maxDate?: Date;

    /**
     * Specifies the first day of the week for the calendar. By default, the first day of the week will be determined by the current culture.
     *
     * @default 0
     */
    firstDayOfWeek?: number;

    /**
     * Specifies the initial view of the Calendar when it is opened.
     *
     * @default Month
     */
    start?: CalendarView;

    /**
     * Sets the maximum level of view such as month, year, and decade in the Calendar.
     * Depth view should be smaller than the start view to restrict its view navigation.
     *
     * @default Month
     */
    depth?: CalendarView;

    /**
     * Specifies whether the week number of the year is to be displayed in the calendar or not.
     *
     * @default false
     */
    weekNumber?: boolean;

    /**
     * Specifies the component to be disabled or not.
     *
     * @default true
     */
    disabled?: boolean;

    /**
     * Specifies whether the Calendar should be in read-only mode.
     *
     * @default false
     */
    readOnly?: boolean;

    /**
     * Specifies the rule for defining the first week of the year.
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
     * Specifies the format of the day that to be displayed in header. By default, the format is 'short'.
     * Possible formats are:
     * * `Short` - Sets the short format of day name (like Su ) in day header.
     * * `Narrow` - Sets the single character of day name (like S ) in day header.
     * * `Abbreviated` - Sets the min format of day name (like Sun ) in day header.
     * * `Wide` - Sets the long format of day name (like Sunday ) in day header.
     *
     * @default Short
     */
    weekDaysFormat?: WeekDaysFormats;

    /**
     * Provides a template for rendering custom content for each day cell in the calendar.
     * Can be a function that accepts CalendarCellProps, a function that accepts date parameters,
     * or a React element.
     *
     * @default null
     */
    cellTemplate?: Function | React.ReactNode;

    /**
     * Specifies whether the calendar is displayed in full screen mode.
     * Used by DatePicker for mobile view.
     *
     * @default false
     */
    fullScreenMode?: boolean;

    /**
     * Triggers when the Calendar value is changed.
     *
     * @event onChange
     */
    onChange?: ((args: ChangeEvent) => void);

    /**
     * Triggers when the Calendar is navigated to another level or within the same level of view.
     *
     * @event onViewChange
     */
    onViewChange?: (args: ViewChangeEvent) => void;
}
export interface ICalendar extends CalendarProps {
    /**
     * The content to be rendered inside the component.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

type ICalendarProps = ICalendar & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value' | 'onChange'>;

export const Calendar: React.ForwardRefExoticComponent<ICalendarProps & React.RefAttributes<ICalendar>> =
    forwardRef<ICalendar, ICalendarProps>((props: ICalendarProps, ref: Ref<ICalendar>) => {
        const {
            className = '',
            minDate = new Date(1900, 0, 1),
            maxDate = new Date(2099, 11, 31),
            depth = CalendarView.Month,
            start = CalendarView.Month,
            firstDayOfWeek: firstDayOfWeekProp = 0,
            value,
            defaultValue,
            readOnly = false,
            weekNumber = false,
            weekRule = WeekRule.FirstDay,
            showTodayButton = true,
            weekDaysFormat = WeekDaysFormats.Short,
            disabled = false,
            multiSelect = false,
            onViewChange,
            cellTemplate = null,
            onChange,
            fullScreenMode = false,
            ...otherProps
        } = props;
        const isControlled: boolean = value !== undefined;
        const { locale } = useProviderContext();
        const localeStrings: object = {
            today: 'Today'
        };
        const [currentView, setCurrentView] = useState<CalendarView>(start);
        const [isImproperDateRange, setIsImproperDateRange] = useState<boolean>(false);
        const [isTodayDisabled, setIsTodayDisabled] = useState<boolean>(false);
        const [isPreviousDisabled, setIsPreviousDisabled] = useState<boolean>(false);
        const [isNextDisabled, setIsNextDisabled] = useState<boolean>(false);
        const [focusedActiveDecendent, setFocusedActiveDecendent] = useState<string>('');
        const [onSelection, setOnSelection] = useState<boolean>(false);
        const [headerTitle, setheaderTitle] = useState<string>('');
        const firstDayOfWeek: number = firstDayOfWeekProp !== null ? (firstDayOfWeekProp > 6 ? 0 : firstDayOfWeekProp) : 0;
        const calendarElement: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const headerTitleElement: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const focusedElementRef: React.RefObject<HTMLTableCellElement | null> = useRef<HTMLTableCellElement | null>(null);
        const selectedElementRef: React.RefObject<HTMLTableCellElement | null> = useRef<HTMLTableCellElement | null>(null);
        const l10nInstance: IL10n = L10n('calendar', localeStrings, locale || 'en-US');
        const [isHeaderFocused, setIsHeaderFocused] = useState<boolean>(false);
        let startDecadeHdYr: string = '';
        let endDecadeHdYr: string = '';
        const { dir } = useProviderContext();
        const [internalValue, setInternalValue] = useState<Date | Date[] | null>(() => {
            if (isControlled) {
                return null;
            }
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            if (multiSelect) {
                return [];
            }
            return null;
        });
        const currentValue: Date | Date[] | null | undefined = isControlled ? value : internalValue;
        const normalizedDates: Date[] = React.useMemo(() => {
            if (multiSelect && Array.isArray(currentValue)) {
                return currentValue.filter(
                    (d: Date) =>
                        (!minDate || d >= minDate) &&
                        (!maxDate || d <= maxDate)
                );
            }
            if (!multiSelect && currentValue && !Array.isArray(currentValue)) {
                if (minDate && currentValue < minDate) {
                    return [minDate];
                }
                if (maxDate && currentValue > maxDate) {
                    return [maxDate];
                }
                if (
                    (!minDate || currentValue >= minDate) &&
                    (!maxDate || currentValue <= maxDate)
                ) {
                    return [currentValue];
                }
            }
            return [];
        }, [currentValue, minDate, maxDate, multiSelect]);

        const [currentDate, setCurrentDate] = useState<Date>(() => {
            if (normalizedDates.length > 0) {
                if (multiSelect) {
                    return normalizedDates[normalizedDates.length - 1];
                } else {
                    return normalizedDates[0];
                }
            }
            if (!isControlled && defaultValue) {
                if (Array.isArray(defaultValue) && defaultValue.length > 0) {
                    return defaultValue[defaultValue.length - 1];
                } else if (!Array.isArray(defaultValue)) {
                    return defaultValue;
                }
            }
            const today: Date = new Date();
            return today < minDate ? new Date(minDate) : today > maxDate ? new Date(maxDate) : today;
        });

        useEffect(() => {
            setCurrentView(start);
        }, [start]);

        const updateValue: (
            newValue: Date | Date[] | null,
            event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>
        ) => void = useCallback((
            newValue: Date | Date[] | null,
            event?: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>
        ): void => {
            if (!isControlled) {
                setInternalValue(newValue);
            }
            if (onChange) {
                onChange({ value: newValue, event });
            }
        }, [isControlled, onChange]);

        const publicAPI: Partial<ICalendar> = {
            value: currentValue,
            multiSelect,
            minDate,
            maxDate,
            firstDayOfWeek,
            start,
            depth,
            weekNumber,
            disabled,
            weekRule,
            showTodayButton,
            weekDaysFormat,
            cellTemplate
        };

        useEffect(() => {
            preRender('calendar');
        }, []);

        useEffect(() => {
            if (currentView === CalendarView.Month) {
                titleUpdate(currentDate, 'days');
            } else if (currentView === CalendarView.Year) {
                titleUpdate(currentDate, 'months');
            } else {
                setheaderTitle(`${startDecadeHdYr} - ${endDecadeHdYr}`);
            }
            setIsImproperDateRange(minDate > maxDate);
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);
            setIsTodayDisabled(today < minDate || today > maxDate);
            iconHandler();
        }, [currentDate, currentView, minDate, maxDate, onSelection]);

        useEffect(() => {
            if (focusedElementRef.current) {
                setFocusedActiveDecendent(focusedElementRef.current.id);
            }
        }, [focusedElementRef.current]);

        const iconHandler: () => void = (): void => {
            const current: Date = new Date(currentDate);
            current.setDate(1);
            switch (currentView) {
            case CalendarView.Month:
                setIsPreviousDisabled(compareMonth(currentDate, minDate) < 1);
                setIsNextDisabled(compareMonth(currentDate, maxDate) > -1);
                break;
            case CalendarView.Year:
                setIsPreviousDisabled(compare(currentDate, minDate, 0) < 1);
                setIsNextDisabled(compare(currentDate, maxDate, 0) > -1);
                break;
            case CalendarView.Decade:
                setIsPreviousDisabled(compare(currentDate, minDate, 10) < 1);
                setIsNextDisabled(compare(currentDate, maxDate, 10) > -1);
            }
        };

        const previous: () => void = (): void => {
            switch (currentView) {
            case CalendarView.Month:
                setCurrentDate(addMonths(currentDate, -1));
                break;
            case CalendarView.Year:
                setCurrentDate(addYears(currentDate, -1));
                break;
            case CalendarView.Decade:
                setCurrentDate(addYears(currentDate, -10));
                break;
            }
        };

        const next: () => void = (): void => {
            switch (currentView) {
            case CalendarView.Month:
                setCurrentDate(addMonths(currentDate, 1));
                break;
            case CalendarView.Year:
                setCurrentDate(addYears(currentDate, 1));
                break;
            case CalendarView.Decade:
                setCurrentDate(addYears(currentDate, 10));
                break;
            }
        };

        const compareMonth: (start: Date, end: Date) => number = (start: Date, end: Date): number => {
            let result: number;
            if (start.getFullYear() > end.getFullYear()) {
                result = 1;
            } else if (start.getFullYear() < end.getFullYear()) {
                result = -1;
            } else {
                result = start.getMonth() === end.getMonth() ? 0 : start.getMonth() > end.getMonth() ? 1 : -1;
            }
            return result;
        };

        const compare: (
            startDate: Date, endDate: Date, modifier: number
        ) => number = (startDate: Date, endDate: Date, modifier: number): number => {
            let start: number = endDate.getFullYear();
            let end: number = start;
            let result: number = 0;
            if (modifier) {
                start = start - (start % modifier);
                end = start - (start % modifier) + modifier - 1;
            }
            if (startDate.getFullYear() > end) {
                result = 1;
            } else if (startDate.getFullYear() < start) {
                result = -1;
            }
            return result;
        };

        const addContentFocus: () => void = (): void => {
            if (selectedElementRef.current) {
                selectedElementRef.current.classList.add('sf-focused-cell');
            } else if (focusedElementRef.current) {
                focusedElementRef.current.classList.add('sf-focused-cell');
            }
        };

        const removeContentFocus: () => void = (): void => {
            if (selectedElementRef.current) {
                selectedElementRef.current.classList.remove('sf-focused-cell');
            } else if (focusedElementRef.current) {
                focusedElementRef.current.classList.remove('sf-focused-cell');
            }
        };

        const navigatedTo: (
            e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
            view: CalendarView, date?: Date
        ) => void = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>, view: CalendarView, date?: Date): void => {
            e.preventDefault();
            if (date && +date >= +minDate && +date <= +maxDate) {
                setCurrentDate(date);
            }
            if (date && +date <= +minDate) {
                setCurrentDate(new Date(minDate));
            }
            if (date && +date >= +maxDate) {
                setCurrentDate(new Date(maxDate));
            }
            if (onViewChange) {
                onViewChange({
                    event: e,
                    view: view,
                    date: currentDate || date
                });
            }
            setCurrentView(view);
        };

        const minMaxDate: (localDate: Date) => Date = (localDate: Date): Date => {
            const currentDate: Date = new Date(new Date(+localDate).setHours(0, 0, 0, 0));
            const min: Date = new Date(new Date(+minDate).setHours(0, 0, 0, 0));
            const max: Date = new Date(new Date(+maxDate).setHours(0, 0, 0, 0));
            if (+currentDate === +min || +currentDate === +max) {
                if (+localDate < +minDate) {
                    return new Date(+minDate);
                }
                if (+localDate > +maxDate) {
                    return new Date(+maxDate);
                }
            }
            return localDate;
        };

        const renderMonths: (date: Date) => JSX.Element = (date: Date): JSX.Element => {
            const monthPerRow: number = weekNumber ? 8 : 7;
            const tdEles: React.ReactNode[] = renderDays(date);
            return (
                <>
                    {createContentHeader()}
                    {renderTemplate(tdEles, monthPerRow, 'sf-month')}
                </>
            );
        };

        const todayButtonClick: (
            e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
        ) => void = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>): void => {
            if (showTodayButton) {
                e.preventDefault();
                const tempValue: Date = new Date(new Date().setHours(0, 0, 0, 0));
                const dateValue: Date = new Date(+tempValue.getTime());
                if (isControlled) {
                    if (onChange) {
                        onChange({ value: multiSelect ? [tempValue] : tempValue, ...e });
                    }
                } else {
                    if (multiSelect) {
                        const currentValues: Date[] = Array.isArray(currentValue) ? currentValue : [];
                        const newValues: Date[] = [...currentValues, tempValue];
                        updateValue(newValues, e);
                    } else {
                        updateValue(tempValue, e);
                    }
                }
                if (depth !== CalendarView.Month) {
                    navigatedTo(e, depth, new Date(dateValue));
                } else {
                    if (getViewNumber(start) >= getViewNumber(depth)) {
                        navigatedTo(e, depth, new Date(dateValue));
                    } else {
                        navigatedTo(e, CalendarView.Month, new Date(dateValue));
                    }
                }
            }
        };

        const renderDays: (currentDate: Date, isTodayDate?: boolean) => React.ReactNode[] = (currentDate: Date, isTodayDate?: boolean) => {
            const tdEles: React.ReactNode[] = [];
            const totalDaysInGrid: number = 42;
            const todayDate: Date = isTodayDate ? new Date(+currentDate) : new Date();
            let localDate: Date = new Date(currentDate);
            const currentMonth: number = localDate.getMonth();
            let minMaxDates: Date;
            localDate = new Date(
                localDate.getFullYear(),
                localDate.getMonth(),
                0,
                localDate.getHours(),
                localDate.getMinutes(),
                localDate.getSeconds(),
                localDate.getMilliseconds()
            );
            while (localDate.getDay() !== firstDayOfWeek) {
                setStartDate(localDate, -1 * 86400000);
            }
            for (let day: number = 0; day < totalDaysInGrid; ++day) {
                const isWeekNumber: boolean | null = day % 7 === 0 && weekNumber;
                minMaxDates = new Date(+localDate);
                localDate = minMaxDate(localDate);
                const dateFormatOptions: object = {locale: locale as string, type: 'dateTime', skeleton: 'full' };
                const date: Date = parseDate(
                    formatDate( localDate, dateFormatOptions),
                    dateFormatOptions
                );
                const isOtherMonth: boolean = date.getMonth() !== currentMonth;
                const isToday: boolean = date && todayDate &&
                    date.getFullYear() === todayDate.getFullYear() &&
                    date.getMonth() === todayDate.getMonth() &&
                    date.getDate() === todayDate.getDate();
                const isSelected: boolean = multiSelect
                    ? normalizedDates.some((selectedDate: Date) => selectedDate && date.toDateString() === selectedDate.toDateString())
                    : normalizedDates.length > 0 && date.toDateString() === normalizedDates[0].toDateString();
                const isDisabled: boolean = (minDate > date) || (maxDate < date);
                const isWeekend: boolean = date.getDay() === 0 || date.getDay() === 6;
                let isFocused: boolean = false;
                if (currentDate.getDate() === localDate.getDate() && !isOtherMonth && !isDisabled) {
                    isFocused = true;
                } else {
                    if (currentDate >= maxDate && parseInt(`${date.valueOf()}`, 10) === +maxDate && !isOtherMonth && !isDisabled) {
                        isFocused = true;
                    }
                    if (currentDate <= minDate && parseInt(`${date.valueOf()}`, 10) === +minDate && !isOtherMonth && !isDisabled) {
                        isFocused = true;
                    }
                }

                const baseClasses: string = `${isOtherMonth ? 'sf-other-month' : ''} ${isWeekend ? 'sf-weekend' : ''} ${isDisabled ? 'sf-disabled sf-overlay' : ''}`;
                const disabledClass: string = disabled ? 'sf-disabled sf-overlay' : '';
                const className: string = `sf-cell ${baseClasses} ${disabledClass} ${isToday ? 'sf-today' : ''} ${isToday && isFocused && !disabled ? 'sf-focused-date' : ''} ${isFocused && !onSelection && !disabled ? 'sf-focused-date' : ''} ${isSelected ? 'sf-selected' : ''}`.trim();

                if (isWeekNumber) {
                    tdEles.push(
                        <td key={`week-${day}`} className={'sf-cell sf-week-number'} style={{ cursor: 'default' }}>
                            <span>
                                {(() => {
                                    const numberOfDays: number = weekRule === 'FirstDay' ? 6 : (weekRule === 'FirstFourDayWeek' ? 3 : 0);
                                    const finalDate: Date = new Date(
                                        localDate.getFullYear(),
                                        localDate.getMonth(),
                                        (localDate.getDate() + numberOfDays)
                                    );
                                    return getWeekNumber(finalDate);
                                })()}
                            </span>
                        </td>
                    );
                }

                const cellProps: CalendarCellProps = {
                    id: `${localDate.valueOf()}`,
                    className: className,
                    isDisabled: isDisabled || (disabled ? true : false),
                    isOutOfRange: isOtherMonth,
                    isToday: isToday,
                    isSelected: isSelected,
                    isFocused: isFocused && !onSelection,
                    isWeekend: isWeekend,
                    date: new Date(date),
                    onClick: (e: React.MouseEvent<HTMLTableCellElement>) => {
                        if (disabled) {
                            return;
                        }
                        clickHandler(e, date);
                    },
                    title: formatDate(date, {locale: locale as string, type: 'date', skeleton: 'full' })
                };
                if (typeof cellTemplate === 'function') {
                    try {
                        const wrappedCellProps: CalendarCellProps & { ref: (el: HTMLTableCellElement | null) => void } = {
                            ...cellProps,
                            ref: (el: HTMLTableCellElement | null) => {
                                if (isFocused && el) { focusedElementRef.current = el; }
                                if (isSelected && el) { selectedElementRef.current = el; }
                            }
                        };
                        const CustomCell: (
                            props: CalendarCellProps
                        ) => React.ReactNode = cellTemplate as (props: CalendarCellProps) => React.ReactNode;
                        tdEles.push(CustomCell(wrappedCellProps));
                    } catch (error) {
                        tdEles.push(
                            <CalendarCell
                                {...cellProps}
                                ref={(el: HTMLTableCellElement | null) => {
                                    if (isFocused && el) { focusedElementRef.current = el; }
                                    if (isSelected && el) { selectedElementRef.current = el; }
                                }}
                            >
                                {renderDayCells(localDate, isDisabled, isOtherMonth)}
                            </CalendarCell>
                        );
                    }
                } else {
                    tdEles.push(
                        <CalendarCell
                            {...cellProps}
                            ref={(el: HTMLTableCellElement | null) => {
                                if (isFocused && el) { focusedElementRef.current = el; }
                                if (isSelected && el) { selectedElementRef.current = el; }
                            }}
                        >
                            {renderDayCells(localDate, isDisabled, isOtherMonth)}
                        </CalendarCell>
                    );
                }
                localDate = new Date(+minMaxDates);
                localDate.setDate(localDate.getDate() + 1);
            }
            return tdEles;
        };

        const setStartDate: (date: Date, time: number) => void = (date: Date, time: number) => {
            const tzOffset: number = date.getTimezoneOffset();
            const d: Date = new Date(date.getTime() + time);
            const tzOffsetDiff: number = d.getTimezoneOffset() - tzOffset;
            const minutesMilliSeconds: number = 60000;
            date.setTime(d.getTime() + tzOffsetDiff * minutesMilliSeconds);
        };

        const renderDayCells: (
            date: Date, isDisabled: boolean, isOtherMonth: boolean) => React.ReactNode = (
            date: Date, isDisabled: boolean, isOtherMonth: boolean
        ) => {
            const title: string = formatDate(date, {locale: locale as string, type: 'date', skeleton: 'full' });
            const dayText: string = formatDate(date, {locale: locale as string, format: 'd', type: 'date', skeleton: 'yMd' });
            const isWeekend: boolean = date.getDay() === 0 || date.getDay() === 6;
            if (isValidElement(cellTemplate)) {
                return cellTemplate;
            } else if (typeof cellTemplate === 'function') {
                const isCalendarCellComponent: boolean = (cellTemplate).length === 1;
                if (isCalendarCellComponent) {
                    return null;
                } else {
                    const customContent: React.ReactNode = cellTemplate(date, isWeekend, currentView, currentDate);
                    if (customContent) {
                        return customContent;
                    }
                }
            }
            return (
                <span
                    className="sf-day"
                    title={title}
                    aria-disabled={isDisabled || isOtherMonth}
                >
                    {dayText}
                </span>
            );
        };

        const createContentHeader: () => JSX.Element = () => {
            const effectiveFirstDayOfWeek: number = firstDayOfWeek;
            const shortNames: string[] = !isNullOrUndefined(weekDaysFormat) ? getCultureValues().length > 0
                ? shiftArray(getCultureValues(), effectiveFirstDayOfWeek)
                : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : [];
            return (
                <thead className={'sf-week-header'}>
                    <tr>
                        {weekNumber && <th className={'sf-week-number'} aria-hidden='true'></th>}
                        {shortNames.slice(0, 7).map((day: string, index: number) => (
                            <th key={index} className=''>{toCapitalize(day)}</th>
                        ))}
                    </tr>
                </thead>
            );
        };

        const getCultureValues: () => string[] = () => {
            const culShortNames: string[] = [];
            let cldrObj: string[];
            const dayFormat: string = 'days.stand-alone.' + weekDaysFormat?.toLowerCase();
            if ((locale === 'en' || locale === 'en-US') && !isNullOrUndefined(dayFormat)) {
                cldrObj = getValue(dayFormat, getDefaultDateObject()) as string[];
            } else {
                cldrObj = getCultureObjects(cldrData, (locale || 'en-US')) as string[];
            }
            if (!isNullOrUndefined(cldrObj)) {
                for (const obj of Object.keys(cldrObj)) {
                    culShortNames.push(getValue(obj, cldrObj));
                }
            }
            return culShortNames;
        };

        const getCultureObjects: (ld: object, c: string) => object = (ld: object, c: string) => {
            const gregorianFormat: string = weekDaysFormat
                ? `.dates.calendars.gregorian.days.format.${weekDaysFormat.toLowerCase()}`
                : '';
            const mainVal: string = 'main.';
            return getValue(`${mainVal}${c}${gregorianFormat}`, ld);
        };

        const shiftArray: (array: string[], places: number) => string[] = (array: string[], places: number) => {
            return array.slice(places).concat(array.slice(0, places));
        };

        const renderTemplate: (
            elements: React.ReactNode[], count: number, classNm: string
        ) => React.ReactNode = (elements: React.ReactNode[], count: number, classNm: string) => {
            const rows: React.ReactNode[] = [];
            for (let i: number = 0; i < elements.length; i += count) {
                const trElements: React.ReactNode[] = elements.slice(i, i + count);
                const hasOtherMonth: boolean = trElements.some((element: React.ReactNode) =>
                    isValidElement<React.ReactElement<{ className?: string }>>(element) &&
                    'className' in element.props &&
                    typeof element.props.className === 'string' &&
                    element.props.className.includes('sf-other-month')
                );
                const isOtherMonthRow: boolean = hasOtherMonth && trElements.every((element: React.ReactNode) =>
                    isValidElement<React.ReactElement<{ className?: string }>>(element) &&
                    'className' in element.props &&
                    typeof element.props.className === 'string' &&
                    (
                        element.props.className.includes('sf-other-month') ||
                        element.props.className.includes('sf-week-number')
                    )
                );
                rows.push(
                    <tr key={i} className={isOtherMonthRow && i === 0 ? 'sf-month-hide' : ''}>
                        {trElements}
                    </tr>
                );
            }
            return (
                <tbody className={classNm}>
                    {rows}
                </tbody>
            );
        };

        const renderYears: () => React.ReactNode = () => {
            const monthPerRow: number = 3;
            const tdEles: React.ReactNode[] = [];
            const curDate: Date = new Date(currentDate);
            const curYear: number = curDate.getFullYear();
            const curMonth: number = curDate.getMonth();
            const min: Date = new Date(minDate);
            const max: Date = new Date(maxDate);
            const minYear: number = min.getFullYear();
            const minMonth: number = min.getMonth();
            const maxYear: number = max.getFullYear();
            const maxMonth: number = max.getMonth();
            const selectedDate: Date | null = multiSelect
                ? (Array.isArray(currentValue) && currentValue.length > 0 ? currentValue[currentValue.length - 1] : null)
                : (currentValue && !Array.isArray(currentValue) ? currentValue : null);
            const selectedMonth: number | undefined = selectedDate?.getMonth();
            const selectedYear: number | undefined = selectedDate?.getFullYear();
            for (let month: number = 0; month < 12; ++month) {
                const monthDate: Date = new Date(curYear, month, 1);
                const isFocusedDate: boolean = month === curMonth;
                const isSelected: boolean =
                    selectedMonth === month && selectedYear === curYear;
                const isDisabled: boolean =
                    (minDate && (curYear < minYear || (curYear === minYear && month < minMonth))) ||
                    (maxDate && (curYear > maxYear || (curYear === maxYear && month > maxMonth)));
                const className: string =
                    'sf-cell' +
                    (isSelected ? ' sf-selected' : isFocusedDate ? ' sf-focused-date' : '') +
                    (isDisabled ? ' sf-disabled' : '');
                tdEles.push(
                    <td
                        key={month}
                        className={className}
                        id={`${monthDate.valueOf()}`}
                        onClick={(e: React.MouseEvent<HTMLTableCellElement>) => handleCellClick(e, monthDate, currentView)}
                        ref={(el: HTMLTableCellElement | null) => {
                            if (isFocusedDate && el) { focusedElementRef.current = el; }
                            if (isSelected && el) { selectedElementRef.current = el; }
                        }}
                        aria-selected={isSelected || false}
                    >
                        {renderYearCell(monthDate)}
                    </td>
                );
            }

            return <>{renderTemplate(tdEles, monthPerRow, 'sf-zoomin')}</>;
        };

        const renderYearCell: (localDate: Date) => React.ReactNode = (localDate: Date) => {
            const title: string = formatDate(localDate, {locale: locale as string, type: 'date', format: 'MMM y' });
            const content: string = toCapitalize(
                formatDate(localDate, {locale: locale as string,
                    format: undefined,
                    type: 'dateTime',
                    skeleton: 'MMM'
                })
            );
            return (
                <span className={'sf-day'} title={title}>
                    {content}
                </span>
            );
        };

        const renderDecades: () => JSX.Element = () => {
            const yearPerRow: number = 3;
            const yearCell: number = 12;
            const tdEles: React.ReactNode[] = [];
            const curDate: Date = new Date(currentDate);
            const curYear: number = curDate.getFullYear();
            const localDate: Date = new Date(curDate);
            localDate.setMonth(0);
            const baseDecadeStartYear: number = curYear - (curYear % 10);
            const startYr: Date = new Date(localDate.setFullYear(baseDecadeStartYear));
            const endYr: Date = new Date(localDate.setFullYear(baseDecadeStartYear + 9));
            const startFullYr: number = startYr.getFullYear();
            const endFullYr: number = endYr.getFullYear();
            startDecadeHdYr = formatDate(startYr, {locale: locale as string,
                format: undefined, type: 'dateTime', skeleton: 'y'
            });
            endDecadeHdYr = formatDate(endYr, {locale: locale as string,
                format: undefined, type: 'dateTime', skeleton: 'y'
            });
            const minYear: number = new Date(minDate).getFullYear();
            const maxYear: number = new Date(maxDate).getFullYear();
            const selectedDate: Date | null = multiSelect
                ? (Array.isArray(currentValue) && currentValue.length > 0 ? currentValue[currentValue.length - 1] : null)
                : (currentValue && !Array.isArray(currentValue) ? currentValue : null);
            const startYear: number = baseDecadeStartYear - 1;
            const selectedYear: number | null = selectedDate?.getFullYear() || null;
            for (let i: number = 0; i < yearCell; ++i) {
                const year: number = startYear + i;
                localDate.setFullYear(year);
                const fullYear: number = localDate.getFullYear();
                const isOutOfRange: boolean = fullYear < minYear || fullYear > maxYear;
                const isOtherDecade: boolean = fullYear < startFullYr || fullYear > endFullYr;
                let className: string = 'sf-cell';
                let isSelected: boolean = false;
                let isFocused: boolean = false;
                if (isOutOfRange) {
                    className += ' sf-disabled';
                }
                if (isOtherDecade) {
                    className += ' sf-other-year';
                }
                if (selectedYear === fullYear) {
                    className += ' sf-selected';
                    isSelected = true;
                } else if (fullYear === curYear) {
                    className += ' sf-focused-date';
                    isFocused = true;
                }
                const decadeDate: Date = new Date(localDate);
                tdEles.push(
                    <td
                        key={year}
                        className={className}
                        id={`${decadeDate.valueOf()}`}
                        onClick={(e: React.MouseEvent<HTMLTableCellElement>) => handleCellClick(e, decadeDate, currentView)}
                        ref={(el: HTMLTableCellElement | null) => {
                            if (isFocused && el) { focusedElementRef.current = el; }
                            if (isSelected && el) { selectedElementRef.current = el; }
                        }}
                        aria-selected={isSelected || false}
                    >
                        {renderDecadeCell(decadeDate)}
                    </td>
                );
            }

            return <>{renderTemplate(tdEles, yearPerRow, 'sf-zoomin')}</>;
        };

        const renderDecadeCell: (localDate: Date) => React.ReactNode = (localDate: Date) => {
            const content: string = formatDate( localDate, {locale: locale as string,
                format: undefined, type: 'dateTime', skeleton: 'y'
            });
            return (
                <span className={'sf-day'}>
                    {content}
                </span>
            );
        };

        const handleCellClick: (
            e: React.MouseEvent<HTMLTableCellElement> | React.KeyboardEvent<HTMLElement>, date: Date,
            view: string) => void = useCallback((
            e: React.MouseEvent<HTMLTableCellElement> | React.KeyboardEvent<HTMLElement>, date: Date, view: string):
        void => {
            setCurrentDate(date);
            if (view === CalendarView.Year) {
                const year: number = date.getFullYear();
                const month: number = date.getMonth();
                const firstDay: Date = new Date(year, month, 1);
                const lastDay: Date = new Date(year, month + 1, 0);
                const firstValidDay: Date = new Date(firstDay);
                while (firstValidDay <= lastDay) {
                    if (firstValidDay >= minDate && firstValidDay <= maxDate) {
                        break;
                    }
                    firstValidDay.setDate(firstValidDay.getDate() + 1);
                }
                if (firstValidDay > lastDay) {
                    return;
                }
                if (depth === CalendarView.Year) {
                    updateValue(firstValidDay, e);
                } else {
                    navigatedTo(e, CalendarView.Month, firstValidDay);
                }
                return;
            }
            if (depth === CalendarView.Decade) {
                updateValue(date, e);
            } else {
                navigatedTo(e, CalendarView.Year, date);
            }
        }, [minDate, maxDate, depth, updateValue, navigatedTo]);

        const titleUpdate: (date: Date, view: string) => void = (date: Date, view: string) => {
            const dayFormatOptions: string = formatDate(date, {locale: locale as string,
                type: 'dateTime', skeleton: 'yMMMM', calendar: 'gregorian'
            });
            const monthFormatOptions: string = formatDate( date, {locale: locale as string,
                format: undefined, type: 'dateTime', skeleton: 'y', calendar: 'gregorian'
            });
            switch (view) {
            case 'days':
                if (headerTitleElement.current) {
                    setheaderTitle(toCapitalize(dayFormatOptions));
                }
                break;
            case 'months':
                if (headerTitleElement.current) {
                    setheaderTitle(monthFormatOptions);
                }
                break;
            }
        };

        const clickHandler: (
            e: React.MouseEvent<HTMLElement>, value: Date
        ) => void = (e: React.MouseEvent<HTMLElement>, value: Date) => {
            if (readOnly || disabled || isImproperDateRange) {
                return;
            }
            const isOtherMonth: boolean = currentView === CalendarView.Month &&
                value.getMonth() !== currentDate.getMonth();
            if (isOtherMonth) {
                const newDate: Date = new Date(value);
                setCurrentDate(newDate);
                return;
            }
            const storeView: CalendarView = currentView;
            selectDate(e, getIdValue(e, null));
            if (multiSelect && currentDate !== value && (storeView === CalendarView.Year || storeView === CalendarView.Month)) {
                if (focusedElementRef.current) {
                    focusedElementRef.current.classList.remove('sf-focused-date');
                }
            }
            if (calendarElement.current) {
                calendarElement.current.focus();
            }
        };

        const selectDate: (
            e: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>,
            date: Date) => void = (
            e: React.MouseEvent<Element> | React.FocusEvent<Element> | React.KeyboardEvent<Element>, date: Date
        ) => {
            if (isControlled) {
                if (onChange) {
                    let newValue: Date | Date[];
                    if (multiSelect) {
                        const currentValues: Date[] = Array.isArray(currentValue) ? currentValue : [];
                        const dateExists: boolean = currentValues.some((v: Date) => v.toDateString() === date.toDateString());
                        if (dateExists) {
                            newValue = currentValues.filter((v: Date) => v.toDateString() !== date.toDateString());
                        } else {
                            newValue = [...currentValues, date];
                        }
                    } else {
                        newValue = date;
                    }
                    onChange({ value: newValue, ...e });
                }
            } else {
                if (multiSelect) {
                    const currentValues: Date[] = Array.isArray(currentValue) ? currentValue : [];
                    const dateExists: boolean = currentValues.some((v: Date) => v.toDateString() === date.toDateString());
                    let newValues: Date[];
                    if (dateExists) {
                        newValues = currentValues.filter((v: Date) => v.toDateString() !== date.toDateString());
                    } else {
                        newValues = [...currentValues, date];
                    }
                    updateValue(newValues, e);
                } else {
                    updateValue(date, e);
                }
            }
            setOnSelection(true);
            setCurrentDate(date);
        };

        const getIdValue: (
            e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | null,
            element: Element | null) => Date = (
            e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement> | React.KeyboardEvent<HTMLElement> | null,
            element: Element | null
        ): Date => {
            let eve: Element;
            if (e) {
                eve = e.currentTarget;
            } else {
                eve = element!;
            }
            const dateFormatOptions: object = { locale: locale as string, type: 'dateTime', skeleton: 'full', calendar: 'gregorian' };
            const dateString: string = formatDate(
                new Date(parseInt('' + eve.getAttribute('id'), 10)),
                dateFormatOptions
            );
            const date: Date = parseDate(dateString, dateFormatOptions);
            const value: number = date.valueOf() - date.valueOf() % 1000;
            return new Date(value);
        };

        const handleHeaderTitleClick: (
            e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
            view: string
        ) => void = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>, view: string) => {
            switch (view) {
            case CalendarView.Month:
                navigatedTo(e, CalendarView.Year);
                break;
            case CalendarView.Year:
                navigatedTo(e, CalendarView.Decade);
                break;
            default:
                break;
            }
        };

        const toCapitalize: (text: string) => string = (text: string) => {
            return text.charAt(0).toUpperCase() + text.slice(1);
        };

        const getViewNumber: (view: CalendarView) => number = (view: CalendarView): number => {
            switch (view) {
            case CalendarView.Month:
                return 0;
            case CalendarView.Year:
                return 1;
            case CalendarView.Decade:
                return 2;
            default:
                return 0;
            }
        };

        const keyActionHandle: (e: React.KeyboardEvent<HTMLElement>) => void = (e: React.KeyboardEvent<HTMLElement>) => {
            if (calendarElement.current === null || e.key === 'Escape' || readOnly || disabled || isImproperDateRange || isHeaderFocused) {
                return;
            }
            e.stopPropagation();
            setOnSelection(false);
            const selectedDate: Element | null = multiSelect ? selectedElementRef.current : focusedElementRef.current;
            const view: number = getViewNumber(currentView as CalendarView);
            const depthValue: number = getViewNumber(depth);
            const levelRestrict: boolean = (view === depthValue && getViewNumber(start) >= depthValue);
            const element: Element | null = focusedElementRef.current || selectedDate;
            switch (e.key) {
            case 'ArrowLeft':
                keyboardNavigate(-1, view);
                e.preventDefault();
                break;
            case 'ArrowRight':
                keyboardNavigate(1, view);
                e.preventDefault();
                break;
            case 'ArrowUp':
                keyboardNavigate(view === 0 ? -7 : -4, view);
                e.preventDefault();
                break;
            case 'ArrowDown':
                keyboardNavigate(view === 0 ? 7 : 4, view);
                e.preventDefault();
                break;
            case 'Enter':
                if (element) {
                    if (levelRestrict) {
                        const d: Date = new Date(parseInt(element.id, 10));
                        selectDate(e, d);
                    } else if (!(e.currentTarget as HTMLElement).className.includes('sf-disabled')) {
                        handleCellClick(e, currentDate, currentView);
                    }
                }
                break;
            case 'Home':
                setCurrentDate(firstDay(currentDate));
                e.preventDefault();
                break;
            case 'End':
                setCurrentDate(lastDay(currentDate, view));
                e.preventDefault();
                break;
            case 'PageUp':
                if (e.shiftKey) {
                    setCurrentDate(addYears(currentDate, -1));
                } else {
                    setCurrentDate(addMonths(currentDate, -1));
                }
                e.preventDefault();
                break;
            case 'PageDown':
                if (e.shiftKey) {
                    setCurrentDate(addYears(currentDate, 1));
                } else {
                    setCurrentDate(addMonths(currentDate, 1));
                }
                e.preventDefault();
                break;
            }
            if (e.ctrlKey) {
                switch (e.key) {
                case 'ArrowUp':
                    if (view < 2 && view >= getViewNumber(depth)) {
                        const nextView: CalendarView = view === 0 ? CalendarView.Year : CalendarView.Decade;
                        navigatedTo(e, nextView);
                    }
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    if (view > 0 && view > depthValue) {
                        const nextView: CalendarView = view === 2 ? CalendarView.Year : CalendarView.Month;
                        navigatedTo(e, nextView, currentDate);
                    }
                    e.preventDefault();
                    break;
                case 'Home':
                    navigatedTo(e, CalendarView.Month, new Date(currentDate.getFullYear(), 0, 1));
                    e.preventDefault();
                    break;
                case 'End':
                    navigatedTo(e, CalendarView.Month, new Date(currentDate.getFullYear(), 11, 31));
                    e.preventDefault();
                    break;
                }
            }
        };

        const firstDay: (date: Date) => Date = (date: Date) => {
            const view: number = getViewNumber(currentView as CalendarView);
            const visibleDates: Date[] = getVisibleDates(date, view);
            for (const d of visibleDates) {
                if (!isDateDisabled(d)) {
                    return d;
                }
            }
            return date;
        };

        const lastDay: (date: Date, view: number) => Date = (date: Date, view: number) => {
            const lastDate: Date = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            if (view !== 2) {
                const timeOffset: number = Math.abs(lastDate.getTimezoneOffset() - firstDay(date).getTimezoneOffset());
                if (timeOffset) {
                    lastDate.setHours(firstDay(date).getHours() + (timeOffset / 60));
                }
                return findLastDay(lastDate, view);
            } else {
                return findLastDay(firstDay(lastDate), view);
            }
        };

        const findLastDay: (date: Date, view: number) => Date = (date: Date, view: number) => {
            const visibleDates: Date[] = getVisibleDates(date, view).reverse();
            for (const d of visibleDates) {
                if (!isDateDisabled(d)) {
                    return d;
                }
            }
            return date;
        };

        const isDateDisabled: (date: Date) => boolean = (date: Date) => {
            return (minDate && date < minDate) || (maxDate && date > maxDate);
        };

        const getVisibleDates: (baseDate: Date, view: number) => Date[] = (baseDate: Date, view: number) => {
            const result: Date[] = [];
            if (view === 0) {
                const start: Date = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                const end: Date = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
                for (let d: Date = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    result.push(new Date(d));
                }
            } else if (view === 1) {
                for (let m: number = 0; m < 12; m++) {
                    result.push(new Date(baseDate.getFullYear(), m, 1));
                }
            } else if (view === 2) {
                const decadeStart: number = baseDate.getFullYear() - (baseDate.getFullYear() % 10) - 1;
                for (let y: number = decadeStart; y < decadeStart + 12; y++) {
                    result.push(new Date(y, 0, 1));
                }
            }
            return result;
        };

        const keyboardNavigate: (num: number, view: number) => void = (num: number, view: number) => {
            const date: Date = new Date(currentDate);
            switch (view) {
            case 2:
                if (isMonthYearRange(date)) {
                    setCurrentDate(addYears(currentDate, num));
                } else {
                    setCurrentDate(currentDate);
                }
                break;
            case 1:
                if (isMonthYearRange(date)) {
                    setCurrentDate(addMonths(currentDate, num));
                } else {
                    setCurrentDate(currentDate);
                }
                break;
            case 0:
                date.setDate(date.getDate() + num);
                if (+date >= +minDate && +date <= +maxDate) {
                    setCurrentDate(date);
                } else {
                    setCurrentDate(currentDate);
                }
                break;
            }
        };

        const isMonthYearRange: (date: Date) => boolean = (date: Date) => {
            return date.getMonth() >= minDate.getMonth()
                && date.getFullYear() >= minDate.getFullYear()
                && date.getMonth() <= maxDate.getMonth()
                && date.getFullYear() <= maxDate.getFullYear();
        };

        const renderModelHeader: () => React.ReactNode | null = () => {
            if (!fullScreenMode) {
                return null;
            }
            return (
                <div className="sf-model-header">
                    <div className="sf-popup-close" role="button" aria-label="close">
                        <CloseIcon width={14} height={14} />
                    </div>
                    {showTodayButton && (
                        <Button
                            tabIndex={disabled || isImproperDateRange ? -1 : 0}
                            className={`sf-today sf-primary  ${isTodayDisabled || disabled || isImproperDateRange ? 'sf-disabled' : ''}`}
                            variant={Variant.Standard}
                            disabled={isTodayDisabled || disabled || isImproperDateRange}
                            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => todayButtonClick(e)}
                            aria-label='Today'
                        >
                            {l10nInstance.getConstant('today')}
                        </Button>
                    )}
                    <div className="sf-day-wrapper">
                        <span className="sf-model-day">
                            {formatDate(currentValue && !Array.isArray(currentValue) ? currentValue : new Date(), {locale: locale || 'en-US', format: 'E', type: 'date' })}
                        </span>
                        <span className="sf-model-month">
                            {formatDate(currentValue && !Array.isArray(currentValue) ? currentValue : new Date(), { locale: locale || 'en-US', format: 'MMM d', type: 'date' })}
                        </span>
                    </div>
                </div>
            );
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ICalendar,
            element: calendarElement.current
        }), [publicAPI]);

        const classNames: string = [
            'sf-calendar',
            className,
            'sf-control',
            dir === 'rtl' ? 'sf-rtl' : '',
            (isImproperDateRange || disabled) ? 'sf-overlay' : '',
            weekDaysFormat === WeekDaysFormats.Wide ? 'sf-calendar-day-header-lg' : '',
            weekNumber ? 'sf-week-number' : '',
            readOnly ? 'sf-readonly' : ''
        ].filter(Boolean).join(' ');

        return (
            <div
                ref={calendarElement}
                className={classNames}
                tabIndex={0}
                data-role='calendar'
                onKeyDown={keyActionHandle}
                onClick={() => {
                    if (calendarElement.current) {
                        calendarElement.current.focus();
                    }
                }}
                {...otherProps}>
                {fullScreenMode && renderModelHeader()}
                <div className={`sf-header ${currentView === CalendarView.Decade ? 'sf-decade' : currentView === CalendarView.Year ? 'sf-year' : 'sf-month'}`}>
                    <div
                        ref={headerTitleElement}
                        className="sf-day sf-title"
                        onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            if (!disabled && !isImproperDateRange) {
                                handleHeaderTitleClick(e, currentView);
                            }
                        }}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!disabled && !isImproperDateRange) {
                                    handleHeaderTitleClick(e, currentView);
                                }
                            }
                        }}
                        aria-atomic="true"
                        aria-live="assertive"
                        aria-label="title"
                        tabIndex={disabled || isImproperDateRange ? -1 : 0}
                        onFocus={() => setIsHeaderFocused(true)}
                        onMouseUp={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            (e.currentTarget as HTMLElement).blur();
                        }}
                        onBlur={() => {
                            setIsHeaderFocused(false);
                            if (focusedElementRef.current) {
                                focusedElementRef.current.focus();
                            }
                        }}
                    >
                        {
                            (() => {
                                if (typeof cellTemplate === 'function') {
                                    const customTitle: React.ReactNode = cellTemplate(currentView, true);
                                    if (customTitle) {
                                        return customTitle;
                                    }
                                }
                                return headerTitle;
                            })()
                        }
                    </div>
                    <div className={'sf-icon-container'}>
                        <Button
                            className={`sf-prev sf-round ${isPreviousDisabled || disabled || isImproperDateRange ? 'sf-overlay' : ''}`}
                            disabled={isPreviousDisabled || disabled || isImproperDateRange}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={() => {
                                setOnSelection(false);
                                previous();
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setOnSelection(false);
                                    previous();
                                }
                            }}
                            aria-label='previous month'
                            title={currentView === CalendarView.Month ? 'Previous Month' :
                                currentView === CalendarView.Year ? 'Previous Year' : 'Previous Decade'}
                            aria-disabled={isPreviousDisabled}
                            icon={<ChevronLeftIcon viewBox='0 0 26 24'/>}
                            onMouseUp={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                                (e.currentTarget as HTMLElement).blur();
                            }}
                            onFocus={() => setIsHeaderFocused(true)}
                            onBlur={() => {
                                setIsHeaderFocused(false);
                            }}
                        >
                        </Button>
                        <Button
                            className={`sf-next sf-round ${isNextDisabled || disabled || isImproperDateRange ? 'sf-overlay' : ''}`}
                            disabled={isNextDisabled || disabled || isImproperDateRange}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            onClick={() => {
                                setOnSelection(false);
                                next();
                            }}
                            aria-label='next month'
                            title={currentView === CalendarView.Month ? 'Next Month' :
                                currentView === CalendarView.Year ? 'Next Year' : 'Next Decade'}
                            aria-disabled={isNextDisabled}
                            icon={<ChevronRightIcon viewBox='0 0 20 26'/>}
                            onMouseUp={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                                (e.currentTarget as HTMLElement).blur();
                            }}
                            onFocus={() => setIsHeaderFocused(true)}
                            onBlur={() => {
                                setIsHeaderFocused(false);
                            }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    setOnSelection(false);
                                    next();
                                }
                            }}
                        >
                        </Button>
                    </div>
                </div>
                <div className={`sf-content ${currentView === CalendarView.Decade ? 'sf-decade' : currentView === CalendarView.Year ? 'sf-year' : 'sf-month'}`}>
                    <table className={'sf-calendar-content-table'} onFocus={addContentFocus} onBlur={removeContentFocus}
                        tabIndex={disabled || isImproperDateRange ? -1 : 0} aria-activedescendant={focusedActiveDecendent} aria-labelledby='element'>
                        {(() => {
                            switch (getViewNumber(currentView)) {
                            case 0:
                                return renderMonths(currentDate);
                            case 1:
                                return renderYears();
                            case 2:
                                return renderDecades();
                            default:
                                return null;
                            }
                        })() || null}
                    </table>
                </div>
                {showTodayButton && (
                    <div className={'sf-footer-container'}>
                        <Button
                            tabIndex={disabled || isImproperDateRange ? -1 : 0}
                            className={`sf-today sf-primary sf-css ${isTodayDisabled || disabled || isImproperDateRange ? 'sf-disabled' : ''}`}
                            variant={Variant.Standard}
                            disabled={isTodayDisabled || disabled || isImproperDateRange}
                            onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => todayButtonClick(e)}
                            aria-label='Today'>
                            {l10nInstance.getConstant('today')}
                        </Button>
                    </div>
                )}
            </div>
        );
    });
export default React.memo(Calendar);
