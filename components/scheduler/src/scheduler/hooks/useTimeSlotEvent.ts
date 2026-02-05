import { useMemo, useCallback, CSSProperties } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventService } from '../services/EventService';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { SpannedEventPlacement } from '../types/enums';
import { EventModel } from '../types/scheduler-types';
import { PositioningService } from '../services/PositioningService';

const DISABLED_TIME_SCALE_EVENT_HEIGHT: number = 118; // px
const DISABLED_TIME_SCALE_GAP: number = 2; // px gap between stacked items in disabled mode

/**
 * Interface for a day's events wrapper
 *
 * @private
 */
export interface DayEventsWrapper {
    /**
     * Unique key for the wrapper
     */
    key: string;

    /**
     * Date timestamp for the wrapper
     */
    dateTimestamp: number;

    /**
     * Events for this day
     */
    events: ProcessedEventsData[];

    /**
     * Inline top position (in px) for the More indicator when timeScale is disabled
     */
    moreIndicatorTopPx?: number;
}

/**
 * Interface for the result of useTimeSlotEvent hook
 */
interface UseTimeSlotEventResult {
    /**
     * Array of day wrapper elements with events
     */
    dayWrappers: DayEventsWrapper[] | null;
}

/**
 * Custom hook to process and render events for the scheduler
 *
 * @returns {UseTimeSlotEventResult} - Processed events data with rendered content
 * @private
 */
export const useTimeSlotEvent: () => UseTimeSlotEventResult = (): UseTimeSlotEventResult => {

    const {
        eventSettings,
        eventOverlap,
        timeFormat,
        timeScale,
        startHour,
        endHour,
        maxEventsPerRow = 3,
        startHourTuple, endHourTuple
    } = useSchedulerPropsContext();

    const { renderDates } = useSchedulerRenderDatesContext();
    const { eventsData } = useSchedulerEventsContext();
    const { locale, dir } = useProviderContext();

    /**
     * Process events for time slot rendering
     */
    const processTimeSlotEvents: (date: Date, eventsData: EventModel[]) => ProcessedEventsData[] =
    useCallback((date: Date, eventsData: EventModel[]): ProcessedEventsData[] => {

        const occursWithinSchedulerHours: (start: Date, end: Date) => boolean = (start: Date, end: Date): boolean => {
            if (startHourTuple && endHourTuple) {
                const startTime: Date = DateService.normalizeDate(start);
                const endTime: Date = DateService.normalizeDate(DateService.isMidnight(end) ? DateService.addDays(end, -1) : end);
                startTime?.setHours(startHourTuple[0], startHourTuple[1], 0, 0);
                endTime?.setHours(endHourTuple[0], endHourTuple[1], 0, 0);
                return end > startTime && start < endTime;
            } else {
                return true;
            }
        };
        if (timeScale?.enable) {
            const spannedEventPlacement: SpannedEventPlacement = eventSettings.spannedEventPlacement || 'AllDayRow';
            const eventsToRender: ProcessedEventsData[] = [];
            let multiDayEvents: EventModel[] = eventsData.filter((event: EventModel) =>
                !event.isAllDay && !event.isBlock && EventService.isMultiDayEvent(event));

            if (spannedEventPlacement === 'AllDayRow') {
                multiDayEvents = multiDayEvents.filter((event: EventModel) =>
                    DateService.isLessthan24Hours(event.startTime, event.endTime)
                );
            }

            multiDayEvents.forEach((event: EventModel) => {
                const eventSegments: ProcessedEventsData[] = EventService.splitEventByDay(event, [date]);
                eventsToRender.push(
                    ...eventSegments.filter((seg: ProcessedEventsData) => occursWithinSchedulerHours(seg.startDate, seg.endDate))
                );
            });

            const singleDayEvents: EventModel[] = eventsData.filter((event: EventModel) =>
                !event.isAllDay && !event.isBlock && !EventService.isMultiDayEvent(event) &&
                DateService.isSameDay(new Date(event.startTime), date) &&
                occursWithinSchedulerHours(event.startTime, event.endTime)
            );

            // Convert EventModel[] to ProcessedEventsData[]
            const processedEvents: ProcessedEventsData[] = singleDayEvents.map((event: EventModel) => ({
                event: event,
                startDate: event.startTime,
                endDate: event.endTime
            }));
            eventsToRender.push(...processedEvents);

            const eventGroups: ProcessedEventsData[][] = EventService.calculateOverlappingEvents(eventsToRender, eventOverlap);

            // Block events- filtered separately
            const blockEvents: EventModel[] = eventsData.filter((event: EventModel) =>
                event.isBlock && DateService.isSameDay(new Date(event.startTime), date));

            const processedData: ProcessedEventsData[] = [];

            const prepareEventForRender: (segment: ProcessedEventsData, props?: Partial<ProcessedEventsData>) => void
                = (segment: ProcessedEventsData, props: Partial<ProcessedEventsData> = {}): void => {
                    const { event } = segment;
                    if (!event.startTime || !event.endTime) {
                        return;
                    }
                    const eventPosition: CSSProperties = PositioningService.calculateEventPosition(
                        segment,
                        timeScale,
                        startHour,
                        endHour
                    );
                    const eventKey: string = `${date.toISOString()}-${event.id}`;
                    const timeDisplay: string = DateService.formatTimeDisplay(event, locale, timeFormat);
                    const eventClasses: string[] = EventService.getEventClassNames(event);
                    const eventStyle: CSSProperties = {
                        width: eventPosition.width || '96%',
                        height: `${eventPosition.height}`,
                        top: (eventPosition.top || '0px')
                    };
                    if (dir === 'rtl') {
                        eventStyle.right = eventPosition.left || '0%';
                    }
                    else {
                        eventStyle.left = eventPosition.left || '0%';
                    }
                    processedData.push({
                        event,
                        timeDisplay,
                        eventKey,
                        eventClasses,
                        eventStyle,
                        ...props
                    });
                };

            // Process normal events
            eventGroups.forEach((group: ProcessedEventsData[]) => {
                group.forEach((overlapEvent: ProcessedEventsData) => {
                    prepareEventForRender(overlapEvent, {
                        totalOverlapping: overlapEvent.totalOverlapping,
                        totalSegments: overlapEvent.totalSegments,
                        isFirstDay: overlapEvent.isFirstDay,
                        isLastDay: overlapEvent.isLastDay,
                        positionIndex: overlapEvent.positionIndex,
                        segmentIndex: overlapEvent.segmentIndex
                    });
                });
            });

            // Process block events individually
            blockEvents.forEach((event: EventModel) => {
                const blockSegment: ProcessedEventsData = {
                    event,
                    startDate: event.startTime,
                    endDate: event.endTime
                };
                prepareEventForRender(blockSegment);
            });

            return processedData;
        }

        const processedEvents: ProcessedEventsData[] = EventService.processDayEvents(renderDates, eventsData);

        const events: ProcessedEventsData[] = [];
        processedEvents.forEach((seg: ProcessedEventsData) => {
            if (!DateService.isSameDay(seg.startDate, date) || !occursWithinSchedulerHours(seg.startDate, seg.endDate)) { return; }

            const eventKey: string = `${seg.startDate.toISOString()}-${seg.event.id}`;
            const timeDisplay: string = DateService.formatTimeDisplay(seg.event, locale, timeFormat);
            const width: string = PositioningService.calculatePositionStyles(seg, renderDates).width as string;
            const topIndex: number = seg.positionIndex ?? 0;
            const eventStyle: CSSProperties = {
                height: `${DISABLED_TIME_SCALE_EVENT_HEIGHT}px`,
                top: `${topIndex * (DISABLED_TIME_SCALE_EVENT_HEIGHT + DISABLED_TIME_SCALE_GAP)}px`,
                width: width || '96%'
            };
            if (dir === 'rtl') {
                eventStyle.right = '0%';
            } else {
                eventStyle.left = '0%';
            }

            events.push({
                ...seg,
                timeDisplay,
                eventKey,
                eventStyle
            });
        });

        return events;
    }, [eventSettings, eventOverlap, timeScale, startHour, endHour, renderDates, dir, locale, timeFormat]);

    // Process events for each day
    const dayWrappers: DayEventsWrapper[] | null = useMemo(() => {
        if (!renderDates || renderDates.length === 0 || !eventsData || eventsData.length === 0) {
            return null;
        }

        return renderDates.map((date: Date) => {
            const dateKey: string = DateService.generateDateKey(date);
            const timeSlotEvents: ProcessedEventsData[] = processTimeSlotEvents(date, eventsData);

            // Calculate inline top position for More indicator when timeScale is disabled
            let moreIndicatorTopPx: number | undefined = undefined;
            if (!timeScale.enable) {
                moreIndicatorTopPx = maxEventsPerRow * (DISABLED_TIME_SCALE_EVENT_HEIGHT + DISABLED_TIME_SCALE_GAP); // 118px per spec
            }

            return {
                key: dateKey,
                dateTimestamp: date.getTime(),
                events: timeSlotEvents,
                moreIndicatorTopPx
            } as DayEventsWrapper;
        });
    }, [
        renderDates,
        eventSettings,
        eventOverlap,
        timeScale,
        timeFormat,
        startHour,
        endHour,
        locale,
        eventsData
    ]);

    return {
        dayWrappers
    };
};

export default useTimeSlotEvent;
