import { IL10n, L10n, parseDate} from '@syncfusion/react-base';
import { CalendarSystem, CalendarType, createCalendarSystem } from '../calendar-core';
import { CalendarCellProps } from '../calendar';

export const getPlaceholderL10n: (
    componentKey: string,
    placeholder: string,
    locale: string
) => string = (componentKey: string, placeholder: string, locale: string) => {
    const l10n: IL10n = L10n(componentKey, { placeholder }, locale);
    l10n.setLocale(locale as string);
    const localized: string = l10n.getConstant('placeholder') as string;
    return localized || placeholder || '';
};

const normalizeTwoDigitYear: (raw: string) => string = (raw: string): string => {
    const twoDigitYearPattern: RegExp = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})$/;
    const m: RegExpExecArray | null = twoDigitYearPattern.exec(raw.trim());
    if (!m) {
        return raw;
    }
    const [, p1, p2, yy] = m;
    const fullYear: number = 2000 + parseInt(yy, 10);
    return `${p1}/${p2}/${fullYear}`;
};

export const parseInputValueDate: (
    inputVal: string,
    opts: {
        locale?: string;
        format?: string;
        inputFormatsString: string[];
        calendarType?: string;
    }
) => Date | null = (inputVal: string, opts: {
    locale?: string;
    format?: string;
    inputFormatsString: string[];
    calendarType?: string;
}): Date | null => {
    const { locale, format, inputFormatsString, calendarType } = opts;

    if (!inputVal || !inputVal.trim()) {
        return null;
    }
    const normalizedAMPM: string = inputVal.replace(/(am|pm)/gi, (s: string): string => s.toUpperCase());
    const normalized: string = format && format.includes('yy') && !format.includes('yyyy')
        ? normalizedAMPM : normalizeTwoDigitYear(normalizedAMPM);

    if (inputFormatsString && inputFormatsString.length) {
        for (const fmt of inputFormatsString) {
            try {
                const d: Date = parseDate(normalized, { locale: locale || 'en-US', format: fmt, type: 'date', calendar: calendarType });
                if (d && !isNaN(d.getTime())) {
                    return d;
                }
            } catch {
                continue;
            }
        }
    } else {
        const d: Date = parseDate(normalized, { locale: locale || 'en-US', format, type: 'date', calendar: calendarType });
        if (d && !isNaN(d.getTime())) {
            return d;
        }
    }
    return null;
};

export const createIsDateDisabledByCellTemplate: (
    cellTemplate: ((props: CalendarCellProps) => React.ReactNode) | undefined,
    currentValue: Date | null,
    minDate: Date,
    maxDate: Date,
    calendarSystem?: CalendarSystem,
    calendarType?: CalendarType
) => (date: Date) => boolean = (
    cellTemplate: ((props: CalendarCellProps) => React.ReactNode) | undefined,
    currentValue: Date | null,
    minDate: Date,
    maxDate: Date,
    calendarSystem?: CalendarSystem,
    calendarType: CalendarType = 'gregorian'
) => {
    if (typeof cellTemplate !== 'function') {
        return (): boolean => false;
    }
    const system: CalendarSystem = calendarSystem ?? createCalendarSystem(calendarType);
    return (date: Date): boolean => {
        try {
            const today: Date = new Date();
            const referenceDate: Date = currentValue && !Array.isArray(currentValue) ? currentValue : today;
            const isWeekend: boolean = date.getDay() === 0 || date.getDay() === 6;
            const isOtherMonth: boolean = system.getMonth(date) !== system.getMonth(referenceDate);
            const isToday: boolean = system.isSameDate(date, today);
            const isSelected: boolean = !!(currentValue &&
                !Array.isArray(currentValue) && calendarSystem?.isSameDate(date, currentValue));

            const cellProps: CalendarCellProps = {
                date,
                isWeekend,
                isDisabled: (minDate > date) || (maxDate < date),
                isOutOfRange: isOtherMonth,
                isToday,
                isSelected: isSelected || false,
                isFocused: false,
                className: '',
                id: `${date.valueOf()}`
            };
            const result: React.ReactNode = (cellTemplate as Function)(cellProps);
            if (result && typeof result === 'object' && 'props' in result) {
                return Boolean((result as { props?: { isDisabled?: boolean } }).props?.isDisabled);
            }
            return false;
        } catch {
            return false;
        }
    };
};

export const getFocusableElementsInRoot: (root?: Element | null) => HTMLElement[] = (root: Element | null | undefined) => {
    let currentElements: HTMLElement[] = [];
    if (root) {
        const selector: string = ['a[href]:not([tabindex="-1"])', 'button:not([disabled]):not([tabindex="-1"])', 'input:not([disabled]):not([tabindex="-1"])', 'select:not([disabled]):not([tabindex="-1"])', 'textarea:not([disabled]):not([tabindex="-1"])', 'details:not([tabindex="-1"])', '[contenteditable]:not([tabindex="-1"])', '[tabindex]:not([tabindex="-1"])'
        ].join(',');
        const elements: NodeListOf<HTMLElement> = (root as Element).querySelectorAll<HTMLElement>(selector);
        currentElements = Array.from(elements).filter((el: HTMLElement) => !el.hasAttribute('disabled')) as HTMLElement[];
    }
    return currentElements;
};
