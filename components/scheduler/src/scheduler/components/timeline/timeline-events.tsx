import { FC, MouseEvent, ReactNode, memo, CSSProperties, useMemo, useEffect } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { ErrorTreeviewIcon } from '@syncfusion/react-icons';
import { CSS_CLASSES } from '../../common/constants';
import { useSchedulerPropsContext } from '../../context/scheduler-context';
import { useSchedulerEventsContext } from '../../context/scheduler-events-context';
import { useTimelineEvents } from '../../hooks/useTimelineEvents';
import { useMoreIndicator } from '../../hooks/useMoreIndicator';
import { TimelineProcessedEvent, TimelineSlot } from '../../types/internal-interface';
import { ResourceLevel, TimelineResourceRowMeta } from '../../services/ResourceGroupingService';
import { DateService, MS_PER_MINUTE } from '../../services/DateService';
import { BASE_COLUMN_WIDTH, BLOCKINDICATOR_WIDTH, EventService } from '../../services/EventService';
import { EventModel } from '../../types/scheduler-types';
import Appointment from '../appointment';
import MoreIndicator from '../more-indicator';
import { useResourceGroupingContext } from '../../context/resource-grouping-context';
import { getResourceRowHeightStyle } from '../../utils/dimension-util';

/**
 * Per-date hidden-event payload used by the more-indicator renderer.
 *
 * @private
 */
interface HiddenEventsByDateEntry {
    date: Date;
    hiddenEventsInfo?: { count: number };
    hiddenEventsInfoBySlot?: Map<number, { count: number }>;
}

/**
 * Renders more indicators for every date that has hidden events.
 *
 * @private
 * @param {Map<string, HiddenEventsByDateEntry>} hiddenEventsInfoByDate - Per-date info about hidden events
 * @param {number} dateColumnWidthPx - Width of a single slot column in pixels
 * @param {Function} onMoreClick - Click handler for the more indicator
 * @param {TimelineSlot[]} timeSlots - Timeline slot metadata for start/end calculation
 * @param {number} intervalMinutes - Slot duration in minutes
 * @param {number} schedulerStartMinutes - View start in minutes from midnight
 * @param {number} totalTimelineWidthPx - Holds total number of scheduler slot width
 * @param {boolean} isRtl - Indicates RTL mode or not.
 * @returns {ReactNode} All more indicator elements for the full view
 */
const renderAllMoreIndicators: (
    hiddenEventsInfoByDate: Map<string, HiddenEventsByDateEntry>, dateColumnWidthPx: number,
    onMoreClick: (
        e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date
    ) => void,
    timeSlots: TimelineSlot[], intervalMinutes: number, schedulerStartMinutes: number, totalTimelineWidthPx?: number, isRtl?: boolean
) => ReactNode = (
    hiddenEventsInfoByDate: Map<string, HiddenEventsByDateEntry>, dateColumnWidthPx: number,
    onMoreClick: (
        e: MouseEvent<HTMLElement>, startDate: Date, resource?: ResourceLevel, endDate?: Date
    ) => void,
    timeSlots: TimelineSlot[], intervalMinutes: number, schedulerStartMinutes: number, totalTimelineWidthPx: number = 0, isRtl: boolean
): ReactNode => {
    const indicators: ReactNode[] = [];
    let dateIndex: number = 0;

    for (const [dateKey, dateInfo] of hiddenEventsInfoByDate.entries()) {
        const { date, hiddenEventsInfoBySlot, hiddenEventsInfo } = dateInfo;
        const currentDateIndex: number = dateIndex++;
        if (hiddenEventsInfoBySlot && hiddenEventsInfoBySlot.size > 0) {
            const dayStartMs: number = DateService.normalizeDate(date).getTime();
            for (const [slotIdx, hiddenInfo] of hiddenEventsInfoBySlot.entries()) {
                if (hiddenInfo.count > 0) {
                    const rawLeftPx: number = currentDateIndex * dateColumnWidthPx + slotIdx * BASE_COLUMN_WIDTH;
                    const leftPx: number = Math.floor(rawLeftPx / BASE_COLUMN_WIDTH) * BASE_COLUMN_WIDTH;
                    const positionStyle: CSSProperties =
                        EventService.createEventStyle(leftPx, BASE_COLUMN_WIDTH, undefined, isRtl, totalTimelineWidthPx);
                    const slotStartRelative: number = timeSlots[slotIdx as number]?.minutesFromStart
                            ?? (slotIdx * intervalMinutes);
                    const slotEndRelative: number = timeSlots[slotIdx + 1]?.minutesFromStart
                            ?? (slotStartRelative + intervalMinutes);
                    const startDate: Date = new Date(dayStartMs + ((schedulerStartMinutes + slotStartRelative) * MS_PER_MINUTE));
                    const endDate: Date = new Date(dayStartMs + ((schedulerStartMinutes + slotEndRelative) * MS_PER_MINUTE));

                    indicators.push(
                        <MoreIndicator
                            key={`more-${dateKey}-slot-${slotIdx}`}
                            startDate={startDate}
                            count={hiddenInfo.count}
                            endDate={endDate}
                            onMoreClick={onMoreClick}
                            style={positionStyle}
                        />
                    );
                }
            }
        } else if (hiddenEventsInfo && hiddenEventsInfo.count > 0) {
            const rawLeftPx: number = currentDateIndex * BASE_COLUMN_WIDTH;
            const leftPx: number = Math.floor(rawLeftPx / BASE_COLUMN_WIDTH) * BASE_COLUMN_WIDTH;
            const positionStyle: CSSProperties =
                EventService.createEventStyle(leftPx, BASE_COLUMN_WIDTH, undefined, isRtl, totalTimelineWidthPx);

            indicators.push(
                <MoreIndicator
                    key={`more-${dateKey}`}
                    startDate={date}
                    count={hiddenEventsInfo.count}
                    onMoreClick={onMoreClick}
                    style={positionStyle}
                />
            );
        }
    }

    return indicators;
};

/**
 * Props for TimelineEvent component.
 *
 * @private
 */
interface TimelineEventProps {
    /**
     * Measured event height for stacking calculations.
     */
    eventHeight: number;

    /**
     * Optional resource row metadata. When provided, only events matching this
     * resource are rendered. When omitted, all events in the timeline are rendered.
     */
    resourceRow?: TimelineResourceRowMeta;
}

/**
 * TimelineEvent — renders event bars for the timeline view.
 * When `resourceRow` is provided, only events matching that resource are rendered.
 * When `resourceRow` is not provided, all events in the timeline are rendered.
 *
 * @private
 * @param {TimelineEventProps} props - Component props
 * @returns {JSX.Element} Single overlay container with event bars
 */
export const TimelineEvent: FC<TimelineEventProps> = memo((props: TimelineEventProps) => {
    const { eventHeight, resourceRow } = props;
    const { rowAutoHeight, timeScale, startHour, endHour, viewType, timeFormat, resources, maxEventsStack } = useSchedulerPropsContext();
    const { eventsData } = useSchedulerEventsContext();
    const { resourceRowHeights, updateResourceRowHeight } = useResourceGroupingContext();
    const { locale, dir } = useProviderContext();
    const isRtl: boolean = dir === 'rtl';
    const { timeSlots } = useMemo(
        () => DateService.getTimelineSlots(viewType, startHour, endHour, timeScale, timeFormat, locale),
        [viewType, startHour, endHour, timeScale, timeFormat, locale]
    );

    const filteredEvents: EventModel[] | undefined = useMemo(() => {
        if (!resourceRow) {
            return undefined;
        }
        if (!eventsData || eventsData.length === 0) {
            return [];
        }
        return eventsData.filter((event: EventModel) => EventService.matchesResource(event, resourceRow, resources));
    }, [eventsData, resourceRow, resources]);

    const { allEvents, globalRowHeight, hiddenEventsInfoByDate, getAllEventsForDate, dateWidthPx, totalTimelineWidthPx } =
        useTimelineEvents(eventHeight, filteredEvents);
    useEffect(() => {
        if (rowAutoHeight && resourceRow) {
            updateResourceRowHeight?.(resourceRow.groupIndex, globalRowHeight);
        }
    }, [rowAutoHeight, resourceRow, globalRowHeight, updateResourceRowHeight]);
    const dateColumnWidthPx: number = dateWidthPx > 0 ? dateWidthPx : BASE_COLUMN_WIDTH;
    const intervalMinutes: number = Math.max(1, (timeScale?.interval ?? 60) / (timeScale?.slotCount ?? 1));
    const { schedulerStartMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
    const { handleMoreClick } = useMoreIndicator(getAllEventsForDate);
    const rowHeightStyle: CSSProperties = getResourceRowHeightStyle(
        !!resourceRow, rowAutoHeight, resourceRowHeights, resourceRow?.groupIndex, maxEventsStack, eventHeight
    );

    return (
        <div className={CSS_CLASSES.TIMELINE_EVENT_ROW} data-group-index={resourceRow?.groupIndex} style={rowHeightStyle} >
            {allEvents.map((event: TimelineProcessedEvent) => event.isBlockIndicator ? (
                <div
                    key={event.eventKey}
                    className={`${CSS_CLASSES.ICONS} ${CSS_CLASSES.BLOCK_INDICATOR}`}
                    style={{ left: `${(event.leftPx + event.widthPx - BLOCKINDICATOR_WIDTH) / totalTimelineWidthPx * 100}%` }}
                >
                    <ErrorTreeviewIcon />
                </div>
            ) : (
                <Appointment
                    key={event.eventKey}
                    eventInfo={event}
                    isVertical={false}
                    hasPrevious={event.isOverflowLeft}
                    hasNext={event.isOverflowRight}
                    groupIndex={resourceRow?.groupIndex}
                />
            ))}
            {!rowAutoHeight && renderAllMoreIndicators(
                hiddenEventsInfoByDate, dateColumnWidthPx, handleMoreClick,
                timeSlots, intervalMinutes, schedulerStartMinutes, totalTimelineWidthPx, isRtl
            )}
        </div>
    );
});

TimelineEvent.displayName = 'TimelineEvent';

export default TimelineEvent;
