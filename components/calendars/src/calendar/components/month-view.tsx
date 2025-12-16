import * as React from 'react';
import { formatDate } from '@syncfusion/react-base';
import { CalendarCell, CalendarCellProps } from '../calendar-cell';
import { CalendarCellData, CalendarSystem } from '../../calendar-core';
import { WEEK_LENGTH } from '../../calendar-core/engine/gregorian';
import { WeekDaysFormats, CalendarView, WeekRule } from '../types';
import { buildCellState, CellState, isDateDisabledByRule } from '../utils';

export interface MonthViewProps {
    currentDate: Date;
    minDate: Date;
    maxDate: Date;
    focusedDate: Date;
    locale: string;
    firstDayOfWeek: number;
    weekNumber: boolean;
    weekRule: WeekRule;
    weekDaysFormat: WeekDaysFormats;
    disabled: boolean;
    multiSelect: boolean;
    normalizedDates: Date[];
    calendarSystem: CalendarSystem;
    cellTemplate?: (props: CalendarCellProps & { cellRef?: (el: HTMLTableCellElement | null) => void }) => React.ReactNode;
    onCellClick: (e: React.MouseEvent<HTMLElement>, value: Date) => void;
    focusedElementRef: React.MutableRefObject<HTMLTableCellElement | null>;
    selectedElementRef: React.MutableRefObject<HTMLTableCellElement | null>;
    currentView: CalendarView;
    showDaysOutsideCurrentMonth?: boolean;
    animate?: boolean;
    disablePastDays: boolean;
    disableFutureDays: boolean;
}

interface WeekHeaderProps {
    shortNames: string[];
    weekNumber: boolean;
}

export const WeekHeader: (
    props: WeekHeaderProps & { cellTemplate?: (props: CalendarCellProps) => React.ReactNode }
) => React.JSX.Element = (
    { shortNames, weekNumber, cellTemplate }: WeekHeaderProps & {
        cellTemplate?: (props: CalendarCellProps) => React.ReactNode;
    }
): React.JSX.Element => {
    return (
        <thead>
            <tr>
                {weekNumber && <th className="sf-week-number" aria-hidden="true" />}
                {shortNames.slice(0, WEEK_LENGTH).map((day: string, index: number) => {
                    const props: CalendarCellProps = {
                        weekHeader: true,
                        title: day,
                        date: new Date()
                    };

                    const custom: React.ReactNode =
                        typeof cellTemplate === 'function' ? cellTemplate(props) : undefined;

                    return (
                        <CalendarCell key={index} {...props}>
                            {custom ? custom : day}
                        </CalendarCell>
                    );
                })}
            </tr>
        </thead>
    );
};

export const MonthView: React.FC<MonthViewProps> = (props: MonthViewProps): React.JSX.Element => {
    const {
        currentDate,
        minDate,
        maxDate,
        locale,
        firstDayOfWeek,
        weekNumber,
        weekRule,
        weekDaysFormat,
        disabled,
        multiSelect,
        focusedDate,
        normalizedDates,
        calendarSystem,
        cellTemplate,
        onCellClick,
        focusedElementRef,
        selectedElementRef,
        currentView,
        showDaysOutsideCurrentMonth = true,
        animate = false,
        disablePastDays,
        disableFutureDays
    } = props;

    const shortNames: string[] = calendarSystem.getWeekDayNames(
        locale,
        firstDayOfWeek,
        weekDaysFormat as string
    );

    const year: number = currentDate.getFullYear();
    const month: number = currentDate.getMonth();

    const matrix: CalendarCellData[][] = React.useMemo(() => {
        return calendarSystem.getMonthMatrix(new Date(year, month, 1), {
            firstDayOfWeek,
            showDaysOutsideCurrentMonth
        });
    }, [calendarSystem, year, month, firstDayOfWeek, showDaysOutsideCurrentMonth]);

    return (
        <>
            <WeekHeader shortNames={shortNames} weekNumber={weekNumber} cellTemplate={cellTemplate} />
            <tbody
                key="month"
                className={`sf-calendar-month${animate ? ' sf-zoomin' : ''}`}
                role="rowgroup"
            >
                {matrix.map((week: CalendarCellData[], wIdx: number) => {
                    const tds: React.ReactNode[] = [];
                    if (weekNumber) {
                        const offset: number = weekRule === WeekRule.FirstDay ? 6 : weekRule === WeekRule.FirstFourDayWeek ? 3 : 0;
                        const base: Date = week[0].date;
                        const refDate: Date =
                            offset === 0
                                ? base
                                : calendarSystem.addDays
                                    ? calendarSystem.addDays(base, offset)
                                    : new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset);

                        const weekNumberProps: CalendarCellProps = {
                            weekNumber: true,
                            title: `${calendarSystem.getWeekNumber(refDate)}`,
                            isDisabled: true,
                            date: refDate
                        };

                        const customWeekNumberCell: React.ReactNode =
                            typeof cellTemplate === 'function' ? cellTemplate(weekNumberProps) : undefined;

                        tds.push(
                            customWeekNumberCell ? (
                                customWeekNumberCell
                            ) : (
                                <CalendarCell key={`week-${wIdx}`} className="sf-week-number" style={{ cursor: 'default' }} role={'gridcell'} aria-hidden="true" {...weekNumberProps}>
                                    <span>{calendarSystem.getWeekNumber(refDate)}</span>
                                </CalendarCell>
                            )
                        );
                    }

                    week.forEach((cell: CalendarCellData) => {
                        const date: Date = cell.date;

                        if (!showDaysOutsideCurrentMonth && !cell.inRange) {
                            tds.push(
                                <td
                                    key={`blank-${date.valueOf()}`}
                                    className="sf-cell sf-empty sf-outside-hidden"
                                    role="gridcell"
                                    aria-hidden="true"
                                    tabIndex={-1}
                                />
                            );
                            return;
                        }

                        const state: CellState = buildCellState(
                            'month',
                            cell,
                            {
                                minDate,
                                maxDate,
                                disabled,
                                focusedDate,
                                normalizedDates,
                                multiSelect
                            },
                            calendarSystem
                        );

                        const isdateDisabled: boolean = isDateDisabledByRule(date, disablePastDays, disableFutureDays, CalendarView.Month);

                        const baseProps: CalendarCellProps = {
                            id: `${date.valueOf()}`,
                            role: 'gridcell',
                            className: state.className,
                            isDisabled: !!state.ariaDisabled || isdateDisabled,
                            isOutOfRange: state.isOtherRange,
                            isToday: state.isToday,
                            isSelected: state.isSelected,
                            isFocused: state.isFocused,
                            isWeekend: state.isWeekend,
                            date: new Date(date),
                            title: formatDate(date, { locale, type: 'date', skeleton: 'full' }),
                            view: currentView,
                            onClick: (e: React.SyntheticEvent) => {
                                if (!disabled && !baseProps.isDisabled) {
                                    onCellClick(e as React.MouseEvent<HTMLElement>, date);
                                }
                            }
                        };

                        const setCellRef: (el: HTMLTableCellElement | null) => void = (el: HTMLTableCellElement | null) => {
                            if (state.isFocused && el) {
                                focusedElementRef.current = el;
                            }
                            if (state.isSelected && el) {
                                selectedElementRef.current = el;
                            }
                        };

                        const custom: React.ReactNode =
                            typeof cellTemplate === 'function'
                                ? cellTemplate({ ...(baseProps as CalendarCellProps), cellRef: setCellRef })
                                : undefined;

                        tds.push(
                            custom ? (
                                custom
                            ) : (
                                <CalendarCell key={baseProps.id} {...baseProps} ref={setCellRef}>
                                    <span
                                        className="sf-day"
                                        aria-disabled={!!state.ariaDisabled || isdateDisabled || state.isOtherRange}
                                    >
                                        {formatDate(date, { locale, format: 'd', type: 'date', skeleton: 'yMd' })}
                                    </span>
                                </CalendarCell>
                            )
                        );
                    });

                    return (
                        <tr key={`r-${wIdx}`} role="row">
                            {tds}
                        </tr>
                    );
                })}
            </tbody>
        </>
    );
};
