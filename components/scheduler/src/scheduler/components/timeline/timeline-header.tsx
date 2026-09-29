import { FC, useMemo, memo, ReactNode, CSSProperties, MouseEvent } from 'react';
import { useNavigate } from '../../hooks/useDateHeader';
import { CSS_CLASSES } from '../../common/constants';
import { HeaderRowConfig, TimelineViewProps, TimeScaleProps, SchedulerDateHeaderProps, HeaderRowRenderProps, HeaderRowOption, TimeSlotProps } from '../../types/scheduler-types';
import { HeaderRowGroup, TimelineSlot, TimeSlot } from '../../types/internal-interface';
import { useSchedulerPropsContext } from '../../context/scheduler-context';
import { DateService } from '../../services/DateService';
import { HeaderService } from '../../services/HeaderService';
import { ViewService } from '../../services/ViewService';
import { SchedulerHeaderRowsType, useSchedulerHeaderRowsContext } from '../../context/scheduler-header-rows-context';
import { useSchedulerRenderDatesContext } from '../../context/scheduler-render-dates-context';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { useTimeIndicator } from '../../hooks/useTimeIndicator';
import { useResourceGroupingContext } from '../../context/resource-grouping-context';

type DateRowItem = { date: Date; isWeekend: boolean; isToday: boolean; label: string };
type DateClickHandler = (e: MouseEvent<HTMLElement>, date: Date) => void;
type DateHeaderTemplate = ((props: SchedulerDateHeaderProps) => ReactNode) | undefined;
type HeaderRowTemplate = ((props: HeaderRowRenderProps) => ReactNode) | undefined;

const OPTION_CLASS: Record<HeaderRowOption, string> = {
    'Year': `${CSS_CLASSES.TIMELINE_HEADER_YEAR} ${CSS_CLASSES.TIMELINE_HEADER_CELL}`,
    'Month': `${CSS_CLASSES.TIMELINE_HEADER_MONTH} ${CSS_CLASSES.TIMELINE_HEADER_CELL}`,
    'Week': `${CSS_CLASSES.TIMELINE_HEADER_WEEK} ${CSS_CLASSES.TIMELINE_HEADER_CELL}`,
    'Date': `${CSS_CLASSES.TIMELINE_DATE_LABEL_CELL} ${CSS_CLASSES.TIMELINE_HEADER_CELL}`,
    'Hour': CSS_CLASSES.TIME_SLOTS
};

/**
 * TimelineHeader component — date label row and/or time scale row.
 *
 * @private
 * @returns {ReactElement | null} Date row, time row, or both
 */
export const TimelineHeader: FC<TimelineViewProps> = memo(() => {
    const { timeScale, dateHeader, viewType, selectedDate, workDays, startHour, endHour, timeFormat, getAvailableViews,
        showTimeIndicator, timezone } = useSchedulerPropsContext();
    const { handleDateClick } = useNavigate();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { dir, locale: providerLocale } = useProviderContext();
    const locale: string = dir || 'en-US';
    const { isGroupingEnabled, isCompact } = useResourceGroupingContext();
    const resourceColumnWidth: string | number = isGroupingEnabled && !isCompact ? 'var(--sf-timeline-resource-column-width)' : 0;
    const { timeSlots, slotCount } = useMemo(
        () => DateService.getTimelineSlots(viewType, startHour, endHour, timeScale, timeFormat, providerLocale),
        [viewType, startHour, endHour, timeScale, timeFormat, providerLocale]
    );
    const dateRows: { date: Date; isWeekend: boolean; isToday: boolean; label: string; }[] =
        HeaderService.buildDateRows(renderDates, selectedDate, viewType, locale, workDays, timezone);
    const headerRowsInfo: SchedulerHeaderRowsType = useSchedulerHeaderRowsContext();

    const { position, currentTime, isVisible, isWithinBounds, multiDayViewInfo } = useTimeIndicator({
        showTimeIndicator, startHour, endHour, renderDates, timezone, viewMode: 'timeline'
    });
    const currentTimeString: string = showTimeIndicator && isVisible && isWithinBounds && multiDayViewInfo.isCurrentDayRendered
        ? formatDate(currentTime, { type: 'time', skeleton: 'short', format: timeFormat, locale: providerLocale })
        : '';
    const currentTimeLabelStyle: CSSProperties | undefined = useMemo((): CSSProperties | undefined => {
        if (!currentTimeString) { return undefined; }
        return { '--sf-timeline-indicator-position': `${position}%` } as CSSProperties;
    }, [currentTimeString, position]);

    const onDateClick: DateClickHandler = (e: MouseEvent<HTMLElement>, date: Date): void => { handleDateClick(e, date, true); };
    const isAgendaViewAvailable: boolean = ViewService.isAgendaViewAvailable(getAvailableViews);

    const renderDateCells: (
        dateRows: DateRowItem[], cellClass: string, onDateClick: DateClickHandler, keyPrefix: string, dateHeader?: DateHeaderTemplate
    ) => ReactNode = (
        dateRows: DateRowItem[], cellClass: string, onDateClick: DateClickHandler, keyPrefix: string, dateHeader?: DateHeaderTemplate
    ): ReactNode => dateRows.map((row: DateRowItem, dateIdx: number): ReactNode => {
        const content: ReactNode = dateHeader ? dateHeader({ date: row.date }) : row.label;
        const fullCellClass: string = row.isToday ? `${cellClass} ${CSS_CLASSES.CURRENT_DATE}` : cellClass;
        return (
            <div
                key={`${keyPrefix}-${dateIdx}`}
                className={fullCellClass}
            >
                <span
                    className={isAgendaViewAvailable ? CSS_CLASSES.LINK : ''}
                    onClick={(e: MouseEvent<HTMLSpanElement>) => onDateClick(e, row.date)}
                    style={{ insetInlineStart: resourceColumnWidth }}
                >
                    {content}
                </span>
            </div>
        );
    });

    const renderHourCells: (
        dateRows: DateRowItem[], timeSlots: TimelineSlot[], slotCount: number,
        cellClass: string, keyPrefix: string, timeScale?: TimeScaleProps
    ) => ReactNode = (
        dateRows: DateRowItem[], timeSlots: TimelineSlot[],
        slotCount: number, cellClass: string, keyPrefix: string, timeScale?: TimeScaleProps
    ): ReactNode => dateRows.map((dateIdx: DateRowItem): ReactNode =>
        timeSlots.map((slot: TimelineSlot, slotIdx: number): ReactNode => {
            const isMajorStart: boolean = slotIdx % slotCount === 0;
            const timeScaleProps: TimeSlotProps = (slot as TimeSlot).templateProps;
            const content: ReactNode = isMajorStart
                ? ((timeScaleProps && timeScale?.majorSlot?.(timeScaleProps)) ?? (slot.label ? <span>{slot.label}</span> : null))
                : ((timeScaleProps && timeScale?.minorSlot?.(timeScaleProps)) ?? null);
            return (
                <div
                    key={`${keyPrefix}-${dateIdx}-${slotIdx}`}
                    className={`${cellClass}${slot.isMajorBoundary ? ` ${CSS_CLASSES.TIME_CELLS}` : ''}`}
                >
                    {content}
                </div>
            );
        })
    );

    const renderGroupHeaderCells: (
        groups: HeaderRowGroup[], option: HeaderRowOption, configIdx: number, headerClass: string,
        template: HeaderRowTemplate
    ) => ReactNode = (
        groups: HeaderRowGroup[], option: HeaderRowOption, configIdx: number, headerClass: string,
        template: HeaderRowTemplate
    ): ReactNode => groups.map((group: HeaderRowGroup, groupIdx: number): ReactNode => {
        const colSpan: number = group.endIndex - group.startIndex + 1;
        const renderProps: HeaderRowRenderProps = { date: group.startDate, text: group.label, option, weekNumber: group.weekNumber };
        return (
            <div
                key={`${option}-${configIdx}-${groupIdx}`}
                className={headerClass}
                style={{ '--sf-scheduler-col-span': colSpan } as CSSProperties}
            >
                <span style={{ insetInlineStart: resourceColumnWidth }}>{template ? template(renderProps) : group.label}</span>
            </div>
        );
    });

    const renderCustomHeaderRow: (config: HeaderRowConfig, configIdx: number) => ReactNode =
        (config: HeaderRowConfig, configIdx: number): ReactNode => {
            const headerClass: string = OPTION_CLASS[config.option];

            if (config.option === 'Date') {
                return (
                    <div key={`header-row-${configIdx}-Date`} className={CSS_CLASSES.HEADER_ROW}>
                        {renderDateCells(dateRows, headerClass, onDateClick, `Date-${configIdx}`, dateHeader)}
                    </div>
                );
            }
            if (timeScale?.enable && config.option === 'Hour' && viewType !== 'TimelineMonth') {
                return (
                    <div key={`header-row-${configIdx}-Hour`} className={CSS_CLASSES.HEADER_ROW}>
                        {renderHourCells(dateRows, timeSlots, slotCount, headerClass, `Hour-${configIdx}`, timeScale)}
                        {currentTimeLabelStyle && (
                            <div className={CSS_CLASSES.CURRENT_TIME} style={currentTimeLabelStyle}>
                                <span>{currentTimeString}</span>
                            </div>
                        )}
                    </div>
                );
            }

            const groups: HeaderRowGroup[] | undefined = headerRowsInfo.allHeaderGroups
                ? headerRowsInfo.allHeaderGroups[config.option as 'Year' | 'Month' | 'Week']
                : undefined;
            if (!groups || groups.length === 0) {
                return null;
            }
            return (
                <div key={`header-row-${configIdx}-${config.option}`} className={CSS_CLASSES.HEADER_ROW}>
                    {renderGroupHeaderCells(groups, config.option, configIdx, headerClass, config.template)}
                </div>
            );
        };

    return (
        <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
            {headerRowsInfo.actualHeaderRows?.map(
                (config: HeaderRowConfig, configIdx: number) => renderCustomHeaderRow(config, configIdx)
            )}
        </div>
    );
});

TimelineHeader.displayName = 'TimelineHeader';

export default TimelineHeader;
