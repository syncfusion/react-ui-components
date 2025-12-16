import { useEffect, useRef, useState, useImperativeHandle, forwardRef, Ref, useCallback, useMemo } from 'react';
import { formatDate, IL10n, L10n, Orientation, useProviderContext, preRender } from '@syncfusion/react-base';
import * as React from 'react';
import { CalendarProps, CalendarView, WeekDaysFormats, WeekRule } from './types';
import { createCalendarSystem, CalendarSystem } from '../calendar-core';
import { WEEK_LENGTH } from '../calendar-core/engine/gregorian';
import { DecadeView } from './components/decade-view';
import { YearView } from './components/year-view';
import { MonthView } from './components/month-view';
import { CalendarHeader } from './components/calendar-header';
import { CalendarFooter } from './components/calendar-footer';
import { clampDate, findFirstFocusableInView, findLastFocusableInView, getSelectedDateFromValue, getViewNumber, isDateDisabledByRule, isInViewRange, stepByCell, stepByView, getVisibleDates } from './utils';
import { CalendarCellProps } from './calendar-cell';

export { CalendarView, WeekDaysFormats, WeekRule };
type ICalendarProps = ICalendar & Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'value' | 'onChange'>;

export interface ICalendar extends CalendarProps {
    /**
     * A reference to the root `div` element of the Calendar component.
     *
     * @private
     * @default -
     */
    element?: HTMLDivElement | null;

    /**
     * A reference to the `grid` element of the Calendar component.
     *
     * @private
     * @default -
     */
    focusGrid?(): void;
}

/**
 * The Calendar component renders a month/year/decade view for date selection, with features like min/max date,
 * multi-select, custom cell templates, keyboard navigation, and localization.
 *
 * ```typescript
 * import { Calendar } from '@syncfusion/react-calendars';
 *
 * export default function App() {
 *   return <Calendar />;
 * }
 * ```
 */
export const Calendar: React.ForwardRefExoticComponent<ICalendarProps & React.RefAttributes<ICalendar>> =
    forwardRef<ICalendar, ICalendarProps>((props: ICalendarProps, ref: Ref<ICalendar>) => {
        const {
            className = '',
            calendarType = 'gregorian',
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
            cellTemplate,
            onChange,
            showDaysOutsideCurrentMonth = true,
            disablePastDays = false,
            disableFutureDays = false,
            footerTemplate,
            headerTemplate,
            showToolBar = false,
            orientation = Orientation.Vertical,
            ...otherProps
        } = props;

        const { locale, dir } = useProviderContext();
        const l10n: IL10n = useMemo<IL10n>(() => L10n('calendar', { today: 'Today' }, locale || 'en-US'), [locale]);
        const todayLabel: string = useMemo(() => l10n.getConstant('today'), [l10n]);
        const [currentView, setCurrentView] = useState<CalendarView>(start);
        const isImproperDateRange: boolean = useMemo(() => minDate > maxDate, [minDate, maxDate]);
        const isTodayDisabled: boolean = useMemo(() => {
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);
            const min0: Date = new Date(minDate); min0.setHours(0, 0, 0, 0);
            const max0: Date = new Date(maxDate); max0.setHours(23, 59, 59, 999);
            return today < min0 || today > max0;
        }, [minDate, maxDate]);
        const firstDayOfWeek: number = firstDayOfWeekProp !== null ? (firstDayOfWeekProp > 6 ? 0 : firstDayOfWeekProp) : 0;
        const calendarElement: React.RefObject<HTMLDivElement | null> = useRef<HTMLDivElement>(null);
        const gridRef: React.RefObject<HTMLTableElement | null> = useRef<HTMLTableElement>(null);
        const focusedElementRef: React.RefObject<HTMLTableCellElement | null> = useRef<HTMLTableCellElement | null>(null);
        const selectedElementRef: React.RefObject<HTMLTableCellElement | null> = useRef<HTMLTableCellElement | null>(null);
        const calendarSystem: CalendarSystem = React.useMemo(() => createCalendarSystem(calendarType), [calendarType]);
        const lastViewRef: React.RefObject<CalendarView> = useRef<CalendarView>(start);
        const isAnimate: boolean = lastViewRef.current !== currentView;
        lastViewRef.current = currentView;
        const isValidDate: (d: unknown) => d is Date = (d: unknown): d is Date =>
            d instanceof Date && !isNaN(d.valueOf());
        const hasValidControlledValue: boolean =
            value !== undefined &&
            (!Array.isArray(value)
                ? isValidDate(value as Date)
                : (value as Date[]).every(isValidDate));

        const isControlled: boolean = hasValidControlledValue;
        const [internalValue, setInternalValue] = useState<Date | Date[] | null>(
            () => (isControlled ? null : defaultValue ?? (multiSelect ? [] : null))
        );
        const currentValue: Date | Date[] | null = isControlled ? (value as Date | Date[] | null) : internalValue;
        const normalizedDates: Date[] = useMemo(() => {
            const inRange: (d: Date) => boolean = (d: Date) => d >= minDate && d <= maxDate;
            if (multiSelect && Array.isArray(currentValue)) {
                const byKey: Map<string, Date> = new Map<string, Date>();
                for (const d of currentValue) {
                    if (isValidDate(d) && inRange(d)) {
                        byKey.set(d.toDateString(), d);
                    }
                }
                return Array.from(byKey.values());
            }

            if (!multiSelect && isValidDate(currentValue as Date)) {
                const d0: Date = currentValue as Date;
                const d: Date = d0 < minDate ? minDate : d0 > maxDate ? maxDate : d0;
                return [d];
            }
            return [];
        }, [currentValue, multiSelect, minDate, maxDate]);

        const setValue: (
            newValue: Date | Date[] | null, event?: React.SyntheticEvent<Element>
        ) => void = useCallback((newValue: Date | Date[] | null, event?: React.SyntheticEvent<Element>): void => {
            if (!isControlled) {
                setInternalValue(newValue);
            }
            onChange?.({ value: newValue, event });
        }, [isControlled, onChange]);

        const [currentDate, setCurrentDate] = useState<Date>(() => {
            if (normalizedDates.length > 0 && isValidDate(normalizedDates[normalizedDates.length - 1])) {
                return multiSelect ? normalizedDates[normalizedDates.length - 1] : normalizedDates[0];
            }
            if (!isControlled && defaultValue) {
                if (Array.isArray(defaultValue)) {
                    const last: Date | undefined = defaultValue.slice().reverse().find(isValidDate);
                    if (last) {
                        return last;
                    }
                } else if (isValidDate(defaultValue)) {
                    return defaultValue;
                }
            }
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);
            if (today >= minDate && today <= maxDate) {
                return today;
            }
            if (isInViewRange(today, CalendarView.Year, minDate, maxDate, calendarSystem)) {
                return findFirstFocusableInView(today, CalendarView.Month, minDate, maxDate, calendarSystem);
            }
            return new Date(maxDate);
        });

        const setCurrentDateSafe: (next: Date) => void = useCallback((next: Date) => {
            setCurrentDate((prev: Date) => (prev.valueOf() === next.valueOf() ? prev : next));
        }, []);

        useEffect(() => {
            setCurrentView(start);
        }, [start]);

        const updateValue: (
            newValue: Date | Date[] | null,
            event?: React.SyntheticEvent
        ) => void = useCallback((
            newValue: Date | Date[] | null,
            event?: React.SyntheticEvent
        ): void => {
            setValue(newValue, event);
        }, [setValue]);

        const toggleDate: (date: Date, event?: React.SyntheticEvent<Element>) => void = useCallback(
            (date: Date, event?: React.SyntheticEvent<Element>): void => {
                if (multiSelect) {
                    const list: Date[] = Array.isArray(currentValue) ? (currentValue as Date[]) : [];
                    const exists: boolean = list.some((d: Date): boolean => d.toDateString() === date.toDateString());
                    const next: Date[] = exists
                        ? list.filter((d: Date): boolean => d.toDateString() !== date.toDateString())
                        : [...list, date];
                    updateValue(next, event);
                } else {
                    updateValue(date, event);
                }
            },
            [multiSelect, currentValue, updateValue]
        );

        const selectDate: (
            e: React.SyntheticEvent,
            date: Date
        ) => void = useCallback((
            e: React.SyntheticEvent,
            date: Date
        ): void => {
            toggleDate(date, e);
            setCurrentDateSafe(date);
            setFocusedDateSafe(date);
        }, [toggleDate]);

        const publicAPI: Partial<ICalendar> = {
            value: currentValue as Date | Date[] | null,
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
            cellTemplate,
            showDaysOutsideCurrentMonth,
            showToolBar,
            footerTemplate,
            headerTemplate,
            disableFutureDays,
            disablePastDays
        };

        useEffect(() => {
            preRender('calendar');
        }, []);

        const handleCellClick: (
            e: React.SyntheticEvent,
            date: Date,
            view: string
        ) => void = useCallback((
            e: React.SyntheticEvent,
            date: Date,
            view: string
        ): void => {
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
                    toggleDate(firstValidDay, e);
                } else {
                    navigateTo(e, CalendarView.Month, firstValidDay);
                }
                return;
            }
            if (depth === CalendarView.Decade) {
                toggleDate(date, e);
            } else {
                navigateTo(e, CalendarView.Year, date);
            }
        }, [minDate, maxDate, depth, toggleDate]);

        const clickHandler: (e: React.MouseEvent<HTMLElement>, value: Date) => void = (
            e: React.MouseEvent<HTMLElement>,
            value: Date
        ): void => {
            if (readOnly || disabled || isImproperDateRange) {
                return;
            }
            const isOtherMonth: boolean = currentView === CalendarView.Month && value.getMonth() !== currentDate.getMonth();
            if (isOtherMonth) {
                const outOfRange: boolean = !isInViewRange(value, CalendarView.Month, minDate, maxDate, calendarSystem);
                const ruleDisabled: boolean = isDateDisabledByRule(value, disablePastDays, disableFutureDays, CalendarView.Month);
                if (outOfRange || ruleDisabled) {
                    return;
                }
            }
            const selectedDate: Date = isOtherMonth ? new Date(value) : value;
            selectDate(e, selectedDate);
            if (multiSelect) {
                setFocusedDate(selectedDate);
            }
        };

        useImperativeHandle(ref, () => ({
            ...publicAPI as ICalendar,
            element: calendarElement.current,
            focusGrid
        }), [publicAPI]);

        const navigateTo: (
            e: React.SyntheticEvent,
            view: CalendarView,
            date?: Date
        ) => void = React.useCallback((
            e: React.SyntheticEvent,
            view: CalendarView,
            date?: Date
        ): void => {
            if ((e as React.SyntheticEvent)?.preventDefault) {
                (e as React.SyntheticEvent).preventDefault();
            }
            if (date) {
                const nextDate: Date = clampDate(date, minDate, maxDate);
                if (nextDate.valueOf() !== currentDate.valueOf()) {
                    setCurrentDateSafe(nextDate);
                }
            }
            onViewChange?.({ event: e, view, date: date ?? currentDate });
            setCurrentView(view);
        }, [currentDate, minDate, maxDate, onViewChange]);

        const onSelectDate: (
            e: React.SyntheticEvent<Element>, date: Date
        ) => void = React.useCallback((e: React.SyntheticEvent<Element>, date: Date): void => {
            selectDate(e, date);
        }, [selectDate]);

        const selectedAnchor: Date | undefined = useMemo(() => {
            if (multiSelect) {
                return normalizedDates.length ? normalizedDates[normalizedDates.length - 1] : undefined;
            }
            return normalizedDates.length ? normalizedDates[0] : undefined;
        }, [multiSelect, normalizedDates]);

        const prevAnchorRef: React.RefObject<number | null> = useRef<number | null>(null);

        const getInitialFocus: () => Date = useCallback((): Date => {
            if (selectedAnchor && isInViewRange(selectedAnchor, currentView, minDate, maxDate, calendarSystem)) {
                prevAnchorRef.current = selectedAnchor.valueOf();
                return selectedAnchor;
            }
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);
            if (today >= minDate && today <= maxDate) {
                if (isInViewRange(today, currentView, minDate, maxDate, calendarSystem)) {
                    return today;
                }
                return findFirstFocusableInView(today, currentView, minDate, maxDate, calendarSystem);
            }
            if (isInViewRange(today, CalendarView.Year, minDate, maxDate, calendarSystem)) {
                const inMonth: Date = findFirstFocusableInView(today, CalendarView.Month, minDate, maxDate, calendarSystem);
                if (isInViewRange(inMonth, currentView, minDate, maxDate, calendarSystem)) {
                    return inMonth;
                }
                return findFirstFocusableInView(inMonth, currentView, minDate, maxDate, calendarSystem);
            }
            const fallback: Date = new Date(maxDate);
            if (isInViewRange(fallback, currentView, minDate, maxDate, calendarSystem)) {
                return fallback;
            }
            return findFirstFocusableInView(fallback, currentView, minDate, maxDate, calendarSystem);
        }, [selectedAnchor, currentView, minDate, maxDate, calendarSystem]);

        const [focusedDate, setFocusedDate] = useState<Date>(getInitialFocus);

        const setFocusedDateSafe: (next: Date) => void = useCallback((next: Date) => {
            setFocusedDate((prev: Date) => (prev.valueOf() === next.valueOf() ? prev : next));
        }, []);

        useEffect(() => {
            if (minDate > maxDate) {
                return;
            }
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);
            const candidate: Date =
                today >= minDate && today <= maxDate
                    ? today
                    : new Date(maxDate);
            if (!isInViewRange(focusedDate, currentView, minDate, maxDate, calendarSystem)) {
                const preferred: Date = isInViewRange(candidate, currentView, minDate, maxDate, calendarSystem)
                    ? candidate
                    : findFirstFocusableInView(candidate, currentView, minDate, maxDate, calendarSystem);

                if (preferred && focusedDate.valueOf() !== preferred.valueOf()) {
                    setFocusedDate(preferred);
                }
            }
        }, [
            currentView,
            minDate,
            maxDate,
            focusedDate,
            calendarSystem
        ]);

        const activeDescendantId: string = useMemo(() => {
            const d: Date = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate());
            return String(d.valueOf());
        }, [focusedDate]);

        const tryMoveFocus: (delta: number, view: CalendarView) => void = useCallback((delta: number, view: CalendarView): void => {
            const candidate: Date = stepByCell(focusedDate, view, delta, calendarSystem);
            if (
                !isInViewRange(candidate, view, minDate, maxDate, calendarSystem) ||
                isDateDisabledByRule(candidate, disablePastDays, disableFutureDays)
            ) {
                return;
            }
            setFocusedDateSafe(candidate);
            if (view === CalendarView.Month) {
                const monthChanged: boolean =
                    candidate.getFullYear() !== currentDate.getFullYear() ||
                    candidate.getMonth() !== currentDate.getMonth();

                if (monthChanged) {
                    setCurrentDateSafe(candidate);
                }
            } else if (view === CalendarView.Year) {
                const yearChanged: boolean = candidate.getFullYear() !== currentDate.getFullYear();
                if (yearChanged) {
                    setCurrentDateSafe(candidate);
                }
            } else if (view === CalendarView.Decade) {
                const curDecadeStart: number = calendarSystem.startOfDecade(currentDate).getFullYear();
                const candDecadeStart: number = calendarSystem.startOfDecade(candidate).getFullYear();
                if (curDecadeStart !== candDecadeStart) {
                    setCurrentDateSafe(candidate);
                }
            }
        }, [focusedDate, minDate, maxDate, currentDate, calendarSystem]);

        const goHome: (view: CalendarView) => void = useCallback((view: CalendarView): void => {
            const d: Date = findFirstFocusableInView(currentDate, view, minDate, maxDate, calendarSystem);
            setFocusedDateSafe(d);
        }, [currentDate, minDate, maxDate, calendarSystem]);

        const goEnd: (view: CalendarView) => void = useCallback((view: CalendarView): void => {
            const d: Date = findLastFocusableInView(currentDate, view, minDate, maxDate, calendarSystem);
            setFocusedDateSafe(d);
        }, [currentDate, minDate, maxDate, calendarSystem]);

        const onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void = useCallback((e: React.KeyboardEvent<HTMLElement>): void => {
            if (disabled || isImproperDateRange) {
                return;
            }
            const target: HTMLElement = e.target as HTMLElement;
            if (target.closest('.sf-calendar-header') || target.closest('.sf-calendar-footer')) {
                return;
            }
            if (e.key === 'Escape') {
                return;
            }

            const viewNum: number = getViewNumber(currentView);
            const depthNum: number = getViewNumber(depth);
            const levelRestrict: boolean = viewNum === depthNum && getViewNumber(start) >= depthNum;

            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                case 'ArrowUp': {
                    if (viewNum < 2 && viewNum >= depthNum) {
                        const nextView: CalendarView = currentView === CalendarView.Month ? CalendarView.Year : CalendarView.Decade;
                        navigateTo(e, nextView);
                        e.preventDefault();
                    }
                    return;
                }
                case 'ArrowDown': {
                    if (viewNum > 0 && viewNum > depthNum) {
                        const nextView: CalendarView = currentView === CalendarView.Decade ? CalendarView.Year : CalendarView.Month;
                        navigateTo(e, nextView, focusedDate);
                        e.preventDefault();
                    }
                    return;
                }
                case 'Home': {
                    const yStart: Date = calendarSystem.startOfYear(focusedDate);
                    navigateTo(e, CalendarView.Month, yStart);
                    e.preventDefault();
                    return;
                }
                case 'End': {
                    const yEnd: Date = calendarSystem.endOfYear(focusedDate);
                    navigateTo(e, CalendarView.Month, yEnd);
                    e.preventDefault();
                    return;
                }
                }
            }

            switch (e.key) {
            case 'ArrowLeft':
                tryMoveFocus(-1, currentView);
                e.preventDefault();
                return;
            case 'ArrowRight':
                tryMoveFocus(1, currentView);
                e.preventDefault();
                return;
            case 'ArrowUp':
                tryMoveFocus(currentView === CalendarView.Month ? -WEEK_LENGTH : -3, currentView);
                e.preventDefault();
                return;
            case 'ArrowDown':
                tryMoveFocus(currentView === CalendarView.Month ? WEEK_LENGTH : 3, currentView);
                e.preventDefault();
                return;
            case 'Home':
                goHome(currentView);
                e.preventDefault();
                return;
            case 'End':
                goEnd(currentView);
                e.preventDefault();
                return;
            case 'PageUp': {
                const next: Date = e.shiftKey
                    ? calendarSystem.addYears(focusedDate, -1)
                    : calendarSystem.addMonths(focusedDate, -1);
                if (isInViewRange(next, currentView, minDate, maxDate, calendarSystem)) {
                    setFocusedDateSafe(next);
                    setCurrentDateSafe(next);
                }
                e.preventDefault();
                return;
            }
            case 'PageDown': {
                const next: Date = e.shiftKey
                    ? calendarSystem.addYears(focusedDate, 1)
                    : calendarSystem.addMonths(focusedDate, 1);
                if (isInViewRange(next, currentView, minDate, maxDate, calendarSystem)) {
                    setFocusedDateSafe(next);
                    setCurrentDateSafe(next);
                }
                e.preventDefault();
                return;
            }
            case 'Enter': {
                if (levelRestrict) {
                    if (!readOnly) {
                        onSelectDate(e, focusedDate);
                    }
                } else {
                    const nextView: CalendarView =
                        currentView === CalendarView.Decade ? CalendarView.Year : CalendarView.Month;
                    navigateTo(e, nextView, focusedDate);
                }
                e.preventDefault();
                return;
            }
            }
        }, [disabled, isImproperDateRange, calendarSystem, currentView, depth, focusedDate, goEnd, goHome,
            onSelectDate,
            setCurrentDate,
            start,
            tryMoveFocus,
            readOnly,
            navigateTo]);

        const viewToRender: React.ReactNode =
            currentView === CalendarView.Month ? (
                <MonthView
                    currentDate={currentDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    firstDayOfWeek={firstDayOfWeek}
                    locale={locale as string}
                    weekNumber={weekNumber}
                    weekRule={weekRule}
                    weekDaysFormat={weekDaysFormat}
                    disabled={disabled}
                    multiSelect={multiSelect}
                    focusedDate={focusedDate}
                    normalizedDates={normalizedDates}
                    calendarSystem={calendarSystem}
                    cellTemplate={cellTemplate as (props: CalendarCellProps) => React.ReactNode}
                    onCellClick={clickHandler}
                    focusedElementRef={focusedElementRef}
                    selectedElementRef={selectedElementRef}
                    currentView={currentView}
                    showDaysOutsideCurrentMonth={showDaysOutsideCurrentMonth}
                    animate={isAnimate}
                    disablePastDays={disablePastDays}
                    disableFutureDays={disableFutureDays}
                />
            ) : currentView === CalendarView.Year ? (
                <YearView
                    currentDate={currentDate}
                    currentValue={currentValue}
                    minDate={minDate}
                    maxDate={maxDate}
                    locale={locale as string}
                    multiSelect={multiSelect}
                    onCellClick={handleCellClick}
                    currentView={currentView}
                    focusedDate={focusedDate}
                    calendarSystem={calendarSystem}
                    cellTemplate={cellTemplate as (props: CalendarCellProps) => React.ReactNode}
                    focusedElementRef={focusedElementRef}
                    selectedElementRef={selectedElementRef}
                    animate={isAnimate}
                    disablePastDays={disablePastDays}
                    disableFutureDays={disableFutureDays}
                />
            ) : (
                <DecadeView
                    currentDate={currentDate}
                    currentValue={currentValue}
                    minDate={minDate}
                    maxDate={maxDate}
                    multiSelect={multiSelect}
                    onCellClick={handleCellClick}
                    currentView={currentView}
                    focusedDate={focusedDate}
                    calendarSystem={calendarSystem}
                    locale={locale as string}
                    cellTemplate={cellTemplate as (props: CalendarCellProps) => React.ReactNode}
                    focusedElementRef={focusedElementRef}
                    selectedElementRef={selectedElementRef}
                    animate={isAnimate}
                    disablePastDays={disablePastDays}
                    disableFutureDays={disableFutureDays}
                />
            );

        const headerTitleText: string = useMemo(() => {
            const lc: string = locale || 'en-US';
            if (currentView === CalendarView.Month) {
                const formattedDate: string = formatDate(currentDate, {
                    format: 'MMMM yyyy',
                    locale: lc,
                    calendar: 'gregorian'
                });
                return formattedDate;
            }
            if (currentView === CalendarView.Year) {
                return String(calendarSystem.getYear(currentDate));
            }
            const start: Date = calendarSystem.startOfDecade(currentDate);
            const end: Date = new Date(start.getFullYear() + 9, 0, 1);
            const startYear: number = calendarSystem.getYear(start);
            const endYear: number = calendarSystem.getYear(end);
            return `${startYear} - ${endYear}`;
        }, [currentDate, currentView, locale]);

        const { prevDisabled, nextDisabled }: { prevDisabled: boolean; nextDisabled: boolean } = useMemo(() => {
            const canNavigateTo: (target: Date) => boolean = (target: Date) => {
                const dates: Date[] = getVisibleDates(target, currentView);
                for (const d of dates) {
                    if (!isInViewRange(d, currentView, minDate, maxDate, calendarSystem)) {
                        continue;
                    }
                    if (!isDateDisabledByRule(d, disablePastDays, disableFutureDays, currentView)) {
                        return true;
                    }
                }
                return false;
            };

            const prevTarget: Date = stepByView(currentDate, currentView, -1, calendarSystem);
            const nextTarget: Date = stepByView(currentDate, currentView, 1, calendarSystem);

            return {
                prevDisabled: !canNavigateTo(prevTarget),
                nextDisabled: !canNavigateTo(nextTarget)
            };
        }, [
            currentDate,
            currentView,
            minDate,
            maxDate,
            calendarSystem,
            disablePastDays,
            disableFutureDays
        ]);

        const focusWrapper: () => void = () => requestAnimationFrame(() => calendarElement.current?.focus());

        const refocusAfterNav: (
            e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
        ) => void = useCallback((e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
            if (e && e.currentTarget) {
                const btn: HTMLButtonElement = e.currentTarget as HTMLButtonElement;
                requestAnimationFrame(() => btn.focus());
            } else {
                focusWrapper();
            }
        }, []);

        const onNavigate: (step: number) => (
            e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
        ) => void = useCallback((step: number) => (e?: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
            if (readOnly) {
                return;
            }
            setCurrentDate((prev: Date) => stepByView(prev, currentView, step, calendarSystem));
            refocusAfterNav(e);
        }, [currentView, refocusAfterNav]);

        const onTitleClick: (
            e: React.SyntheticEvent
        ) => void = useCallback((
            e: React.SyntheticEvent
        ): void => {
            if (disabled || isImproperDateRange || readOnly) {
                return;
            }
            if (currentView === CalendarView.Month) {
                navigateTo(e, CalendarView.Year);
            } else if (currentView === CalendarView.Year) {
                navigateTo(e, CalendarView.Decade);
            }
            focusWrapper();
        }, [disabled, isImproperDateRange, currentView, navigateTo]);

        const onTodayClick: (
            e: React.SyntheticEvent
        ) => void = useCallback((e: React.SyntheticEvent): void => {
            if (readOnly) {
                return;
            }
            const today: Date = new Date();
            today.setHours(0, 0, 0, 0);

            if (isControlled) {
                const newValue: Date | Date[] = multiSelect ? [today] : today;
                onChange?.({ value: newValue, event: e });
            } else {
                if (multiSelect) {
                    const list: Date[] = Array.isArray(currentValue) ? (currentValue as Date[]) : [];
                    const next: Date[] = [...list, today];
                    updateValue(next, e);
                } else {
                    updateValue(today, e);
                }
            }

            const startNo: number = getViewNumber(start);
            const depthNo: number = getViewNumber(depth);
            const targetView: CalendarView =
                depth !== CalendarView.Month
                    ? depth
                    : (startNo >= depthNo ? depth : CalendarView.Month);

            navigateTo(e, targetView, new Date(today));
        }, [isControlled, currentValue, multiSelect, updateValue, onChange, depth, start, navigateTo]);

        const onNext: (() => void) | undefined = useMemo(
            () => (nextDisabled ? undefined : onNavigate(1)),
            [nextDisabled, onNavigate]
        );

        const onPrev: (() => void) | undefined = useMemo(
            () => (prevDisabled ? undefined : onNavigate(-1)),
            [prevDisabled, onNavigate]
        );

        const focusGrid: () => void = useCallback((): void => {
            if (gridRef.current) {
                gridRef.current.focus({ preventScroll: true });
            }
        }, []);

        const classNames: string = [
            'sf-calendar',
            className,
            'sf-control',
            dir === 'rtl' ? 'sf-rtl' : '',
            (isImproperDateRange || disabled) ? 'sf-disabled' : '',
            weekDaysFormat === WeekDaysFormats.Wide ? 'sf-calendar-header-lg' : '',
            orientation === Orientation.Horizontal ? 'sf-orientation' : '',
            weekNumber ? 'sf-week-number' : '',
            readOnly ? 'sf-readonly' : ''
        ].filter(Boolean).join(' ');

        const contentClass: string =
            currentView === CalendarView.Decade
                ? 'sf-calendar-decade'
                : currentView === CalendarView.Year
                    ? 'sf-calendar-year'
                    : 'sf-calendar-month';

        const tabIndex: number = disabled || isImproperDateRange ? -1 : 0;
        const dayText: string = useMemo(() => {
            const baseDate: Date = getSelectedDateFromValue(currentValue, Array.isArray(currentValue)) ?? new Date();
            return formatDate(baseDate, {
                locale: locale || 'en-US',
                type: 'date',
                format: 'EEE, dd MMM',
                calendar: 'gregorian'
            });
        }, [currentValue, locale]);

        return (
            <div
                ref={calendarElement}
                className={classNames}
                onKeyDown={onKeyDown}
                data-role='calendar'
                tabIndex={-1}
                {...otherProps}>
                {(showToolBar && (
                    <div className="sf-calendar-toolbar">
                        <span className="sf-toolbar-day">{dayText}</span>
                    </div>
                ))}
                <div>
                    {headerTemplate
                        ? (typeof headerTemplate === 'function'
                            ? headerTemplate({
                                headerTitle: headerTitleText,
                                currentView,
                                disabled: disabled || isImproperDateRange,
                                onPrevClick: onPrev,
                                onNextClick: onNext,
                                onTitleClick
                            })
                            : headerTemplate)
                        : (
                            <CalendarHeader
                                currentView={currentView}
                                headerTitle={headerTitleText}
                                disabled={disabled || isImproperDateRange}
                                onTitleClick={onTitleClick}
                                className={contentClass}
                                onPrevClick={onPrev}
                                onNextClick={onNext}
                            />
                        )
                    }
                    <div className={`sf-calendar-content ${contentClass}`}>
                        <table
                            className="sf-calendar-content-table"
                            ref={gridRef}
                            role="grid"
                            aria-readonly={!!readOnly}
                            aria-disabled={disabled || isImproperDateRange}
                            aria-multiselectable={!!multiSelect}
                            aria-activedescendant={activeDescendantId}
                            aria-labelledby={headerTitleText}
                            tabIndex={tabIndex}
                            onKeyDown={onKeyDown}
                        >
                            {viewToRender}
                        </table>
                    </div>
                    {showTodayButton && (
                        footerTemplate
                            ? typeof footerTemplate === 'function'
                                ? footerTemplate({
                                    disabled: disabled || isImproperDateRange || isTodayDisabled,
                                    onTodayClick: onTodayClick,
                                    todayLabel
                                })
                                : footerTemplate
                            : (
                                <CalendarFooter
                                    disabled={disabled || isImproperDateRange || isTodayDisabled}
                                    onTodayClick={onTodayClick}
                                />
                            )
                    )}
                </div>
            </div>
        );
    });
export default React.memo(Calendar);
