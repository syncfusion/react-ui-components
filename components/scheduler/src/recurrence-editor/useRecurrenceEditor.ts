import { useCallback, useMemo, useReducer, useState } from 'react';
import {
    FreqType,
    DayWeekType,
    RecurrenceState,
    EndType,
    RecurrenceItems,
    RecurrenceHandlers,
    DropdownData
} from './types';
import { isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { DateService } from '../scheduler/services/DateService';
import { ChangeEvent } from '@syncfusion/react-dropdowns';
import { NumericChangeEvent } from '@syncfusion/react-inputs';
import { RadioButtonChangeEvent } from '@syncfusion/react-buttons';
import { DatePickerChangeEvent } from '@syncfusion/react-calendars';
import { useRecurrenceEditorLocalization } from './locale';
import { getMonthData, getDayData, getRecurrenceStateFromRule, getByDayFromDate, getBySetPosFromDate, getRecurrenceStringFromDate } from './util';

/**
 * Public API returned by the `useRecurrenceEditor` hook.
 *
 * Extends `RecurrenceState` and supplies derived data sources, helper
 * functions and event handlers intended for use by a recurrence editor UI.
 *
 * @public
 * @property {Date} startingDate - The initial date used to calculate rule parts.
 * @property {DropdownData[]} monthDataSource - Localized list of months for a month dropdown.
 * @property {DropdownData[]} monthPosDataSource - Positions in month (first, second, last, etc.).
 * @property {{ text: string; value: FreqType }[]} freqDataSource - Localized frequency labels.
 * @property {{ text: string; value: EndType }[]} endDataSource - Localized end-type labels.
 * @property {RecurrenceItems[]} dayDataSource - Localized day labels for full-width display.
 * @property {RecurrenceItems[]} weekDayDataSource - Localized day labels for compact/week display.
 * @property {number|null} maxDate - Number of days in the selected month (or `null`).
 * @property {(state: RecurrenceState) => string} generateRule - Generates an RRULE string for an arbitrary state.
 * @property {() => string} buildRecurrenceRule - Builds an RRULE string from the current state.
 * @property {(monthName: string) => void} updateMaxDate - Updates `maxDate` given a localized month name.
 * @property {RecurrenceHandlers} handlers - Collection of UI event handlers for editor controls.
 *
 * @example
 * const editor = useRecurrenceEditor('FREQ=DAILY;', new Date(), ['DAILY','WEEKLY'], ['Count','Until'], 0);
 * const rrule = editor.buildRecurrenceRule();
 */
export interface RecurrenceEditorResult extends RecurrenceState {
    startingDate: Date;
    monthDataSource: DropdownData[];
    monthPosDataSource: DropdownData[];
    freqDataSource: Array<{ text: string; value: FreqType }>;
    endDataSource: Array<{ text: string; value: EndType }>;
    dayDataSource: RecurrenceItems[];
    weekDayDataSource: RecurrenceItems[];
    maxDate: number | null;
    generateRule: (state: RecurrenceState) => string;
    buildRecurrenceRule: () => string;
    updateMaxDate: (monthName: string) => void;
    handlers: RecurrenceHandlers;
    alertDialogOpen: boolean;
    setAlertDialogOpen: (open: boolean) => void;
}

type RecurrenceFieldKey = keyof RecurrenceState;

type RecurrenceAction =
    | {
        type: 'setField';
        key: RecurrenceFieldKey;
        value: RecurrenceState[RecurrenceFieldKey];
    }
    | { type: 'setMany'; payload: Partial<RecurrenceState> }
    | { type: 'toggleWeekDay'; code: string };

const recurrenceReducer: (
    state: RecurrenceState,
    action: RecurrenceAction,
) => RecurrenceState = (
    state: RecurrenceState,
    action: RecurrenceAction
): RecurrenceState => {
    switch (action.type) {
    case 'setField':
        return { ...state, [action.key]: action.value } as RecurrenceState;
    case 'setMany':
        return { ...state, ...action.payload } as RecurrenceState;
    case 'toggleWeekDay': {
        const exists: boolean = state.weekDays.includes(action.code);
        const next: string[] = exists
            ? state.weekDays.filter((d: string) => d !== action.code)
            : [...state.weekDays, action.code];
        return { ...state, weekDays: next };
    }
    default:
        return state;
    }
};

/**
 * Hook that prepares state, localized data sources and helper functions
 * for a recurrence editor UI.
 *
 * The hook centralizes conversion between the UI-friendly form state and
 * RFC-style recurrence rules (RRULE strings). It returns the current
 * `RecurrenceState` extended by additional helpers and localized dropdown
 * data needed by input controls.
 *
 * @param {string} value - Initial recurrence rule string (RRULE). May be empty.
 * @param {Date} startDate - The event start date used when computing rule parts.
 * @param {FreqType[]} frequencies - Allowed frequency values (e.g. ['DAILY','WEEKLY']).
 * @param {EndType[]} endTypes - Allowed end types (e.g. ['Count','Until']).
 * @param {number} firstDayOfWeek - Locale-specific index of first day (0 = Sunday).
 * @returns {RecurrenceEditorResult} Returns a `RecurrenceEditorResult` object containing the state,
 * localized data sources, helpers to build RRULE strings and UI handlers.
 *
 * @example
 * const editor = useRecurrenceEditor('FREQ=WEEKLY;BYDAY=MO,WE;', new Date(), ['WEEKLY','MONTHLY'], ['Count','Until'], 1, 'Alert', 'Until date cannot be earlier than start date');
 * // use editor.handlers.onFreqChange as the dropdown change handler
 */
export function useRecurrenceEditor(
    value: string, startDate: Date, frequencies: FreqType[], endTypes: EndType[], firstDayOfWeek: number
): RecurrenceEditorResult {
    const locale: string = useProviderContext()?.locale ?? 'en-US';
    const calendarMode: string = 'gregorian';
    const { getString } = useRecurrenceEditorLocalization(locale);
    const [alertDialogOpen, setAlertDialogOpen] = useState<boolean>(false);
    const startingDate: Date = useMemo((): Date => {
        return startDate ? new Date(startDate) : new Date();
    }, [startDate]);

    const initialRecurrenceState: RecurrenceState = {
        freq: 'DAILY',
        endType: 'Count',
        interval: 1,
        count: 10,
        monthDate: 1,
        dayWeekMode: 'day',
        weekDays: [],
        until: new Date(),
        maxDate: 31,
        month: 1,
        weekDay: 'SU',
        weekNumber: 1
    };
    const monthDataSource: DropdownData[] = useMemo(
        () => getMonthData(locale, calendarMode),
        [locale]
    );

    const monthPosDataSource: DropdownData[] = useMemo(() => {
        const data: DropdownData[] = [
            { text: getString('first'), value: 1 },
            { text: getString('second'), value: 2 },
            { text: getString('third'), value: 3 },
            { text: getString('fourth'), value: 4 },
            { text: getString('last'), value: -1 }
        ];
        return data;
    }, [getString]);

    const dayDataSource: RecurrenceItems[] = useMemo(
        () =>
            getDayData(locale, calendarMode, firstDayOfWeek, 'wide'),
        [locale, firstDayOfWeek]
    );

    const initFromProp: (ruleStr?: string, initDate?: Date) => RecurrenceState = (ruleStr?: string, initDate?: Date): RecurrenceState => {
        const baseDate: Date = initDate ? new Date(initDate) : startingDate;
        const weekdays: string[] = [getByDayFromDate(baseDate)];

        const statesFromStart: Partial<RecurrenceState> = {
            'monthDate': baseDate.getDate(),
            'until': DateService.addDays(baseDate, 60),
            'month': baseDate.getMonth() + 1,
            'weekDay': weekdays[0],
            'weekNumber': getBySetPosFromDate(baseDate),
            'weekDays': weekdays
        };
        if (!ruleStr) {
            return { ...initialRecurrenceState, ...statesFromStart } as RecurrenceState;
        }
        const state: RecurrenceState = { ...initialRecurrenceState, ...statesFromStart };
        const parsed: RecurrenceState = getRecurrenceStateFromRule(ruleStr, state);
        return parsed;
    };

    const [state, dispatch] = useReducer(
        recurrenceReducer,
        { rule: value, startDate },
        (arg: { rule?: string; startDate?: Date }) => initFromProp(arg?.rule, arg?.startDate)
    );

    const setField: <K extends RecurrenceFieldKey>(
        key: K,
        value: RecurrenceState[K],
    ) => void = useCallback(
        <K extends RecurrenceFieldKey>(key: K, value: RecurrenceState[K]): void => {
            dispatch({ type: 'setField', key, value });
        },
        [dispatch]
    );

    const {
        freq,
        endType,
        interval,
        count,
        monthDate,
        dayWeekMode,
        weekDays,
        until,
        maxDate,
        month,
        weekDay,
        weekNumber
    } = state;

    const freqMap: { [key: string]: string } = {
        daily: 'day',
        weekly: 'week',
        monthly: 'month',
        yearly: 'year'
    };
    const freqDataSource: Array<{ text: string; value: FreqType }> = useMemo(
        () => {
            const data: { text: string; value: FreqType }[] = [];
            for (const e of frequencies) {
                const freqText: string = freqMap[e.toLowerCase()];
                const key: string = state.interval > 1 ? freqText + 's' : freqText;
                data.push({ text: getString(key), value: e });
            }
            return data;
        },
        [frequencies, locale, getString, interval]
    );

    const endDataSource: Array<{ text: string; value: EndType }> = useMemo(
        () => {
            const endData: Array<{ text: string; value: EndType }> = [];
            for (const type of endTypes) {
                const localizedText: string = getString(type.toLowerCase());
                endData.push({ text: localizedText, value: type });
            }
            return endData;
        },
        [endTypes, getString]
    );

    const weekDayDataSource: RecurrenceItems[] = useMemo(
        () =>
            getDayData(locale, calendarMode, firstDayOfWeek, 'narrow'),
        [locale, firstDayOfWeek]
    );

    const updateMaxDate: (monthName: string) => void = useCallback(
        (monthName: string): void => {
            const monthIndex: number = monthDataSource.findIndex(
                (m: DropdownData) => m.text.toLowerCase() === monthName.toLowerCase()
            );
            const safeMonthIndex: number = monthIndex >= 0 ? monthIndex : 0;
            setField(
                'maxDate',
                DateService.getDaysInMonth(safeMonthIndex, startingDate.getFullYear())
            );
        },
        [monthDataSource, startingDate, setField]
    );

    const formatUntil: (until?: Date | null, start?: Date) => string | undefined =
        useCallback((until?: Date | null, start?: Date): string | undefined => {
            const date: Date = new Date(until);
            if (start) {
                date.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
            } else {
                date.setHours(0, 0, 0, 0);
            }
            return getRecurrenceStringFromDate(date);
        }, []);

    const getSelectedDaysData: (weekDays?: string[]) => string = useCallback(
        (weekDays?: string[]): string => {
            return !weekDays || weekDays.length === 0
                ? ''
                : `BYDAY=${weekDays.join(',')};`;
        },
        []
    );

    const getSelectedMonthData: (state: RecurrenceState) => string = useCallback(
        (state: RecurrenceState): string => {
            if (state.dayWeekMode === 'day' && state.monthDate && state.monthDate > 0) {
                return `BYMONTHDAY=${state.monthDate};`;
            }
            if (state.weekNumber && state.weekDay) {
                return `BYDAY=${state.weekDay};BYSETPOS=${state.weekNumber};`;
            }
            return '';
        },
        [monthPosDataSource, dayDataSource]
    );

    const getYearMonthRuleData: (month?: number) => string = useCallback(
        (month?: number): string => {
            return !isNullOrUndefined(month) ? `BYMONTH=${month};` : '';
        },
        [monthDataSource]
    );

    const getIntervalData: (interval: number) => string = useCallback(
        (interval: number): string => {
            return `INTERVAL=${Math.max(1, interval || 1)};`;
        },
        []
    );

    const getUntilData: (until?: Date, startTime?: Date) => string = useCallback(
        (until?: Date, startTime?: Date): string => {
            if (!until || isNaN(until.getTime())) {
                return '';
            }
            const untilStr: string | undefined = typeof formatUntil === 'function' ? formatUntil(until, startTime) : undefined;
            return untilStr ? `UNTIL=${untilStr};` : '';
        },
        [formatUntil]
    );

    const getEndOnCount: (count: number) => string = useCallback(
        (count: number): string => {
            return `COUNT=${count};`;
        },
        []
    );

    const handleUntilDateChange: (value: Date) => void = useCallback(
        (value: Date): void => {
            const selected: Date = new Date(value);
            const start: Date = new Date(startingDate);
            const selectedDay: number = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()).getTime();
            const startDay: number = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
            if (selectedDay < startDay) {
                setAlertDialogOpen(true);
                return;
            }
            setField('until', value);
        },
        [startingDate, setAlertDialogOpen, setField]
    );

    const buildRuleParts: {
        DAILY: (s: RecurrenceState) => string[];
        WEEKLY: (s: RecurrenceState) => string[];
        MONTHLY: (s: RecurrenceState) => string[];
        YEARLY: (s: RecurrenceState) => string[];
    } = useMemo(
        () => ({
            DAILY: (s: RecurrenceState): string[] => {
                void s; // reference parameter to satisfy linter when unused
                return [];
            },
            WEEKLY: (s: RecurrenceState): string[] => {
                const weekDaysPart: string = getSelectedDaysData(s.weekDays);
                return weekDaysPart ? [weekDaysPart] : [];
            },
            MONTHLY: (s: RecurrenceState): string[] => {
                const monthPart: string = getSelectedMonthData(s);
                return monthPart ? [monthPart] : [];
            },
            YEARLY: (s: RecurrenceState): string[] => {
                const parts: string[] = [];
                const yearMonthPart: string = getYearMonthRuleData(s.month);
                if (yearMonthPart) {
                    parts.push(yearMonthPart);
                }
                const monthPart: string = getSelectedMonthData(s);
                if (monthPart) {
                    parts.push(monthPart);
                }
                return parts;
            }
        }),
        [getSelectedDaysData, getSelectedMonthData, getYearMonthRuleData]
    );

    const generateRule: (stateArg: RecurrenceState) => string = useCallback(
        (stateArg: RecurrenceState): string => {
            const frequencyParts: string[] =
                buildRuleParts[freq as keyof typeof buildRuleParts]?.(stateArg);

            const parts: string[] = [
                `FREQ=${freq};`,
                ...frequencyParts,
                getIntervalData(stateArg.interval)
            ];

            if (stateArg.endType === 'Until' && stateArg.until) {
                const untilPart: string = getUntilData(stateArg.until, startingDate);
                if (untilPart) {
                    parts.push(untilPart);
                }
            } else if (stateArg.endType === 'Count' && stateArg.count && stateArg.count > 0) {
                parts.push(getEndOnCount(stateArg.count));
            }

            return parts.filter((p: string): boolean => p.length > 0).join('');
        },
        [
            buildRuleParts,
            getIntervalData,
            getUntilData,
            getEndOnCount,
            startingDate
        ]
    );

    const buildRecurrenceRule: () => string = useCallback((): string => {
        return generateRule(state);
    }, [state, generateRule]);

    const handlers: RecurrenceHandlers = useMemo(
        () => ({
            onFreqChange: (e?: ChangeEvent): void => {
                if (e?.value) {
                    setField('freq', e.value as FreqType);
                }
            },
            onEndTypeChange: (e?: ChangeEvent): void => {
                if (e?.value) {
                    setField('endType', e.value as EndType);
                }
            },
            onIntervalChange: (e?: NumericChangeEvent): void => {
                if (e?.value !== undefined) {
                    setField('interval', e.value);
                }
            },
            onCountChange: (e?: NumericChangeEvent): void => {
                if (e?.value !== undefined) {
                    setField('count', e.value);
                }
            },
            onMonthChange: (e?: ChangeEvent): void => {
                if (e?.value) {
                    const monthName: string = String(e.value);
                    setField('month', e.value as number);
                    updateMaxDate(monthName);
                }
            },
            onWeekDayChange: (e?: ChangeEvent): void => {
                if (e?.value) {
                    dispatch({
                        type: 'setMany',
                        payload: {
                            weekDay: String(e.value),
                            dayWeekMode: 'week'
                        }
                    });
                }
            },
            onMonthDateChange: (e?: NumericChangeEvent): void => {
                if (e?.value !== undefined) {
                    dispatch({
                        type: 'setMany',
                        payload: {
                            monthDate: e.value,
                            dayWeekMode: 'day'
                        }
                    });
                }
            },
            onDayWeekChange: (e?: RadioButtonChangeEvent): void => {
                if (e?.value) {
                    setField('dayWeekMode', e.value as DayWeekType);
                }
            },
            onWeekNumber: (e?: ChangeEvent): void => {
                if (e?.value) {
                    dispatch({
                        type: 'setMany',
                        payload: {
                            weekNumber: e.value as number,
                            dayWeekMode: 'week'
                        }
                    });
                }
            },
            onUntilChange: (e?: DatePickerChangeEvent): void => {
                if (e?.value) {
                    handleUntilDateChange(e.value);
                }
            },
            onToggleSelectedWeekDay: (code: string): void => {
                dispatch({ type: 'toggleWeekDay', code });
            }
        }),
        [setField, updateMaxDate, dispatch, handleUntilDateChange]
    );

    return {
        startingDate,
        monthDataSource,
        monthPosDataSource,
        freqDataSource,
        endDataSource,
        dayDataSource,
        weekDayDataSource,
        month,
        weekDay,
        weekNumber,
        freq,
        endType,
        interval,
        count,
        monthDate,
        dayWeekMode,
        weekDays,
        until,
        maxDate,
        generateRule,
        buildRecurrenceRule,
        updateMaxDate,
        handlers,
        alertDialogOpen,
        setAlertDialogOpen
    };
}
