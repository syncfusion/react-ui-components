import * as React from 'react';
import { CalendarView } from '../types';
import { CalendarCellData, CalendarSystem } from '../../calendar-core';
import { buildCellState, CellState, getSelectedDateFromValue, isDateDisabledByRule } from '../utils';
import { CalendarCell, CalendarCellProps } from '../calendar-cell';

export interface DecadeViewProps {
    currentDate: Date;
    currentValue: Date | Date[] | null | undefined;
    minDate: Date;
    maxDate: Date;
    locale: string;
    multiSelect: boolean;
    onCellClick: (e: React.SyntheticEvent, date: Date, view: CalendarView) => void;
    currentView: CalendarView;
    focusedDate: Date;
    calendarSystem: CalendarSystem;
    cellTemplate?: (props: CalendarCellProps & { cellRef?: (el: HTMLTableCellElement | null) => void }) => React.ReactNode;
    currentViewDate?: Date;
    focusedElementRef?: React.MutableRefObject<HTMLTableCellElement | null>;
    selectedElementRef?: React.MutableRefObject<HTMLTableCellElement | null>;
    animate?: boolean;
    disablePastDays?: boolean;
    disableFutureDays?: boolean;
}

export const DecadeView: React.FC<DecadeViewProps> = ({
    currentDate,
    currentValue,
    minDate,
    maxDate,
    multiSelect,
    onCellClick,
    currentView,
    focusedDate,
    calendarSystem,
    cellTemplate,
    focusedElementRef,
    selectedElementRef,
    animate = false,
    disablePastDays = false,
    disableFutureDays = false
}: DecadeViewProps): React.JSX.Element => {
    const curYear: number = currentDate.getFullYear();

    const selectedDate: Date | null = React.useMemo(() => {
        return getSelectedDateFromValue(currentValue, multiSelect);
    }, [multiSelect, currentValue]);

    const matrix: CalendarCellData[][] = React.useMemo(() => {
        return calendarSystem.getDecadeMatrix(new Date(curYear, 0, 1));
    }, [calendarSystem, curYear]);

    return (
        <tbody key="decade" className={animate ? 'sf-zoomin' : ''} role="rowgroup">
            {matrix.map((row: CalendarCellData[], rIdx: number) => {
                const tds: React.ReactNode[] = [];

                row.forEach((cell: CalendarCellData) => {
                    const decadeDate: Date = cell.date;
                    const label: string = cell.label as string;

                    const state: CellState = buildCellState(
                        'decade',
                        cell,
                        {
                            minDate,
                            maxDate,
                            disabled: false,
                            focusedDate,
                            selectedDate
                        },
                        calendarSystem
                    );

                    const isDateRuleDisabled: boolean = isDateDisabledByRule(
                        decadeDate, disablePastDays, disableFutureDays, CalendarView.Decade);

                    const baseProps: CalendarCellProps = {
                        id: `${decadeDate.valueOf()}`,
                        role: 'gridcell',
                        className: state.className,
                        isDisabled: !!state.ariaDisabled || isDateRuleDisabled,
                        isOutOfRange: state.isOtherRange,
                        isToday: state.isToday,
                        isSelected: state.isSelected,
                        isFocused: state.isFocused,
                        isWeekend: false,
                        view: currentView,
                        date: new Date(decadeDate),
                        title: label,
                        onClick: (e: React.SyntheticEvent) => {
                            if (!state.isOutOfBounds && !baseProps.isDisabled) {
                                onCellClick(e, decadeDate, currentView);
                            }
                        }
                    };

                    const setCellRef: (el: HTMLTableCellElement | null) => void = (el: HTMLTableCellElement | null) => {
                        if (state.isFocused && el && focusedElementRef) {
                            focusedElementRef.current = el;
                        }
                        if (state.isSelected && el && selectedElementRef) {
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
                                <span className="sf-day">{label}</span>
                            </CalendarCell>
                        )
                    );
                });

                return (
                    <tr key={`r-${rIdx}`} role="row">
                        {tds}
                    </tr>
                );
            })}
        </tbody>
    );
};
