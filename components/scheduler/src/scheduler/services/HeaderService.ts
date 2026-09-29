import { formatDate } from '@syncfusion/react-base';
import { CellData, HeaderRowGroup, TimeSlot } from '../types/internal-interface';
import { HeaderRowConfig, HeaderRowOption, TimeScaleProps } from '../types/scheduler-types';
import { DateService } from './DateService';
import { useSchedulerLocalization } from '../common/locale';
import { WeekRule } from '../types/enums';

/** @private */
export class HeaderService {

    /**
     * Resolves whether timeline body/header column units are hour-slots or dates.
     * Mirrors last-level grain of SchedulerHeaderRowsProvider without coupling
     * to that context (avoids circular dependency with isMonthView).
     *
     * @param {HeaderRowConfig[] | undefined} headerRows - Custom header rows.
     * @param {string} [view] - Active view type string.
     * @param {boolean} [isTimeScaleEnabled] - Indicates timescale enable or disable.
     * @returns {boolean} True when column count uses time-scale minor slots.
     */
    static isTimeHeaderVisible(
        headerRows: HeaderRowConfig[] | undefined, view?: string, isTimeScaleEnabled?: boolean
    ): boolean {
        if (view === 'TimelineMonth' || !isTimeScaleEnabled) { return false; }
        if (!headerRows || headerRows?.length === 0) { return true; }
        return headerRows[headerRows.length - 1].option === 'Hour';
    }

    /**
     * Computes the display label for a single date in the header last row.
     *
     * @param {Date} date - The date to label.
     * @param {string} view - Active timeline view type.
     * @param {string} locale - Locale string for formatting.
     * @returns {string} Formatted label.
     */
    static computeHeaderCellLabel(date: Date, view: string, locale: string): string {
        if (view === 'TimelineMonth') {
            const dayNumber: number = date.getDate();
            if (dayNumber === 1) {
                const monthShort: string = formatDate(date, { format: 'MMM', locale });
                return `${monthShort} ${dayNumber}`;
            }
            return `${dayNumber}`;
        }
        return formatDate(date, { format: 'MMMM dd, EEEE', locale });
    }

    /**
     * Builds the lightweight per-date rows consumed by the timeline header
     * (date + isWeekend + display label) from a render-date range.
     *
     * Falls back to `[selectedDate]` (or `new Date()`) when `renderDates` is empty,
     * matching the `useHeaderRows` fallback contract.
     *
     * @param {Date[]} renderDates - Active render dates.
     * @param {Date} selectedDate - Selected date fallback when no render dates exist.
     * @param {string} view - Active timeline view type.
     * @param {string} locale - Locale string for formatting.
     * @param {number[]} workDays - Holds workDays numbers.
     * @param {string} [timezone] - timezone used to determine the current date.
     * @returns {Object} Per-date header rows.
     */
    static buildDateRows(
        renderDates: Date[],
        selectedDate: Date | undefined,
        view: string,
        locale: string,
        workDays: number[],
        timezone?: string
    ): { date: Date; isWeekend: boolean; isToday: boolean; label: string }[] {
        const dates: Date[] = (renderDates && renderDates.length > 0)
            ? renderDates
            : [selectedDate ? new Date(selectedDate) : new Date()];

        return dates.map((date: Date) => {
            const isWeekend: boolean = DateService.isWeekend(date, workDays);
            const isToday: boolean = DateService.isSameDay(date, DateService.getCurrentTime(timezone));
            return {
                date,
                isWeekend,
                isToday,
                label: HeaderService.computeHeaderCellLabel(date, view, locale)
            };
        });
    }

    /**
     * Weekend / base class metadata for a date-header CellData entry.
     *
     * @param {Date} date - Calendar date of the cell.
     * @param {number[]} workDays - Holds workDays numbers.
     * @returns {Object} Class metadata.
     */
    static getDateHeaderClassMeta(date: Date, workDays: number[]): { className: string[]; cssClass: string | undefined } {
        const isWeekend: boolean = DateService.isWeekend(date, workDays);
        const className: string[] = ['sf-date-header'];
        if (isWeekend) {
            className.push('sf-weekend');
        }
        return {
            className,
            cssClass: isWeekend ? 'sf-weekend' : undefined
        };
    }

    /**
     * Resolves last header-row option and builds true last-level `CellData[]`.
     *
     * Defaults (no custom `headerRows`): TimelineMonth / month layout → Date;
     * otherwise Hour (finest work axis). Custom last option follows that option's
     * grain (Hour expands slots; Date per day; Year/Month/Week from groups).
     *
     * @param {Date[]} renderDates - Active render dates.
     * @param {HeaderRowConfig[]} headerRows - User header row configs.
     * @param {string} view - Active view type.
     * @param {string} locale - Locale string.
     * @param {string} startHour - Day start.
     * @param {string} endHour - Day end.
     * @param {TimeScaleProps | undefined} timeScale - Time scale props.
     * @param {Object} allHeaderGroups - Holds the custom group values.
     * @param {number[]} workDays - Holds workDays numbers.
     * @returns {CellData[]} Last-level track cells.
     */
    static buildHeaderLastLevelCells(
        renderDates: Date[], headerRows: HeaderRowConfig[], view: string, locale: string,
        startHour: string, endHour: string, timeScale: TimeScaleProps | undefined,
        allHeaderGroups?: { Year?: HeaderRowGroup[]; Month?: HeaderRowGroup[]; Week?: HeaderRowGroup[] },
        workDays: number[] = []
    ): CellData[] {
        if (!renderDates.length || !view?.startsWith('Timeline')) { return []; }
        let lastOption: HeaderRowOption | undefined = headerRows && headerRows.length > 0
            ? headerRows[headerRows.length - 1]?.option : undefined;
        if (view === 'TimelineMonth' && lastOption === 'Hour') {
            lastOption = [...(headerRows ?? [])]
                .reverse()
                .find((h: HeaderRowConfig) => h.option !== 'Hour')?.option;
        }
        const resolvedOption: HeaderRowOption = lastOption
            ?? ((view === 'TimelineMonth' || !timeScale?.enable) ? 'Date' : 'Hour');

        if (resolvedOption === 'Hour') {
            return HeaderService.buildHourLevelCells(renderDates, startHour, endHour, timeScale, workDays);
        }
        if (resolvedOption === 'Date') {
            return HeaderService.buildDateLevelCells(renderDates, view, locale, workDays);
        }
        return HeaderService.buildGroupLevelCells(allHeaderGroups[resolvedOption as string], workDays);
    }

    /**
     * One `dateHeader` CellData per render date (Date-row / TimelineMonth last track).
     *
     * @param {Date[]} renderDates - Active render dates.
     * @param {string} view - Active timeline view type.
     * @param {string} locale - Locale for labels.
     * @param {number[]} workDays - Holds workDays numbers.
     * @returns {CellData[]} Date-grained last-level cells.
     */
    private static buildDateLevelCells(renderDates: Date[], view: string, locale: string, workDays: number[]): CellData[] {
        return renderDates.map((date: Date): CellData => {
            const { className, cssClass } = HeaderService.getDateHeaderClassMeta(date, workDays);
            return {
                type: 'dateHeader',
                date,
                colSpan: 1,
                displayName: HeaderService.computeHeaderCellLabel(date, view, locale),
                className,
                cssClass
            };
        });
    }

    /**
     * Finest hour/slot last track: one cell per date × `getSlotMetadata` minor slot.
     *
     * @param {Date[]} renderDates - Active render dates.
     * @param {string} startHour - Day start (HH:mm).
     * @param {string} endHour - Day end (HH:mm).
     * @param {TimeScaleProps | undefined} timeScale - Active time scale (interval / slotCount).
     * @param {number[]} workDays - Holds workDays numbers.
     * @returns {CellData[]} Slot-expanded last-level cells.
     */
    private static buildHourLevelCells(
        renderDates: Date[], startHour: string, endHour: string, timeScale: TimeScaleProps | undefined,
        workDays: number[]
    ): CellData[] {
        const slots: TimeSlot[] = DateService.getSlotMetadata(
            startHour || '00:00', endHour || '24:00', timeScale?.interval ?? 60, timeScale?.slotCount ?? 2
        );
        const cells: CellData[] = [];

        renderDates.forEach((date: Date): void => {
            const { className, cssClass } = HeaderService.getDateHeaderClassMeta(date, workDays);
            slots.forEach((slot: TimeSlot): void => {
                const slotDate: Date = new Date(date);
                slotDate.setHours(slot.hour ?? 0, slot.minute ?? 0, 0, 0);
                cells.push({
                    type: 'hourHeader', date: slotDate, colSpan: 1, className: [...className], cssClass,
                    isMajorSlot: !slot.isMajorSlot
                });
            });
        });

        return cells;
    }

    /**
     * Year / Month / Week last-row groups as col-spanned `dateHeader` cells.
     *
     * @param {HeaderRowGroup[]} groups - Precomputed groups for the last option.
     * @param {number[]} workDays - Holds workDays numbers.
     * @returns {CellData[]} Group-grained last-level cells.
     */
    private static buildGroupLevelCells(groups: HeaderRowGroup[], workDays: number[]): CellData[] {
        return groups.map((group: HeaderRowGroup): CellData => {
            const date: Date = group.startDate;
            const { className, cssClass } = HeaderService.getDateHeaderClassMeta(date, workDays);
            const startIndex: number = group.startIndex ?? 0;
            const endIndex: number = group.endIndex ?? startIndex;
            return {
                type: 'customRowsHeader', date, colSpan: Math.max(1, endIndex - startIndex + 1),
                displayName: group.label, className, cssClass, endDate: group.endDate
            };
        });
    }

    /**
     * Builds the Year/Month/Week group map for the active header-row options.
     * Only options present in `headerRows` are populated; absent options are omitted.
     *
     * @param {HeaderRowConfig[]} headerRows - User header row configs.
     * @param {Date[]} renderDates - Active render dates.
     * @param {string} locale - Locale string.
     * @param {WeekRule} weekRule - Week numbering rule.
     * @param {number} firstDayOfWeek - First day of the week (0-6).
     * @returns {Object} Map keyed by option name.
     */
    static buildAllHeaderGroups(
        headerRows: HeaderRowConfig[], renderDates: Date[], locale: string, weekRule: WeekRule, firstDayOfWeek: number
    ): { Year?: HeaderRowGroup[]; Month?: HeaderRowGroup[]; Week?: HeaderRowGroup[] } {
        const groups: { Year?: HeaderRowGroup[]; Month?: HeaderRowGroup[]; Week?: HeaderRowGroup[] } = {};
        const options: string[] = headerRows.map((h: HeaderRowConfig) => h.option);
        if (options.includes('Year')) {
            groups.Year = HeaderService.generateHeaderRowGroups(
                renderDates, 'Year', locale, weekRule, firstDayOfWeek);
        }
        if (options.includes('Month')) {
            groups.Month = HeaderService.generateHeaderRowGroups(
                renderDates, 'Month', locale, weekRule, firstDayOfWeek);
        }
        if (options.includes('Week')) {
            groups.Week = HeaderService.generateHeaderRowGroups(
                renderDates, 'Week', locale, weekRule, firstDayOfWeek);
        }
        return groups;
    }

    static generateHeaderRowGroups(
        renderDates: Date[], option: HeaderRowOption, locale: string = 'en-US', weekRule: WeekRule = 'FirstDay', firstDayOfWeek: number = 0
    ): HeaderRowGroup[] {
        if (option === 'Date' || option === 'Hour' || renderDates.length === 0) { return []; }
        const groups: HeaderRowGroup[] = [];
        const { getString } = useSchedulerLocalization(locale);
        let currentGroup: HeaderRowGroup | null = null;

        renderDates.forEach((date: Date, index: number) => {
            let label: string;
            let sameGroup: boolean;
            if (option === 'Year') {
                label = formatDate(date, { format: 'yyyy', locale });
                sameGroup = currentGroup
                    ? date.getFullYear() === currentGroup.startDate.getFullYear()
                    : false;
            } else if (option === 'Month') {
                label = formatDate(date, { format: 'MMMM', locale });
                sameGroup = currentGroup
                    ? date.getFullYear() === currentGroup.startDate.getFullYear() &&
                    date.getMonth() === currentGroup.startDate.getMonth()
                    : false;
            } else if (option === 'Week') {
                const weekNum: number = DateService.getWeekNumber(date, weekRule, firstDayOfWeek);
                label = `${getString('week')} ${weekNum}`;
                const currentWeekNum: number = currentGroup
                    ? DateService.getWeekNumber(currentGroup.startDate, weekRule, firstDayOfWeek)
                    : -1;
                sameGroup = currentGroup
                    ? weekNum === currentWeekNum && date.getFullYear() === currentGroup.startDate.getFullYear()
                    : false;
            } else {
                sameGroup = false;
            }

            if (sameGroup && currentGroup) {
                currentGroup.endDate = date;
                currentGroup.endIndex = index;
            } else {
                if (currentGroup) { groups.push(currentGroup); }
                const weekNum: number | undefined = option === 'Week' ? DateService.getWeekNumber(date, weekRule, firstDayOfWeek) : undefined;
                currentGroup = { startDate: date, endDate: date, startIndex: index, endIndex: index, label, weekNumber: weekNum };
            }
        });

        if (currentGroup) { groups.push(currentGroup); }
        return groups;
    }
}

export default HeaderService;
