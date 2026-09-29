import { useCallback, useMemo } from 'react';
import { isNullOrUndefined, useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { BASE_COLUMN_WIDTH, EVENT_GAP, EVENTS_GAP, EventService, SLOT_ROW_HEIGHT } from '../services/EventService';
import { DateService, MINUTES_PER_HOUR, MINUTES_PER_DAY } from '../services/DateService';
import { EventModel } from '../types/scheduler-types';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { buildRowsByTimeSlot } from './useTimelineSlotEvents';
import { TimelineProcessedEvent, TimelineEventRow } from '../types/internal-interface';
import { HeaderService } from '../services/HeaderService';
import {
    assignTimelineEventPositions, buildPositionedTimelineEvent, calculateTimelineEventRowHeight,
    collectTimelineEventsForDate, getClampedEventMinutesInRange, getDayBounds, getEventOverlappingInfo, getEventVisibilityBounds,
    isBlockEventIndicator, TimelineEventBuilders, TimelineEventMetadata, TimelineEventsByDateMap
} from '../utils/actions';
import { useSchedulerHeaderRowsContext } from '../context/scheduler-header-rows-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';

interface UseTimelineEventsResult {
    rows: TimelineEventRow[];
    allEvents: TimelineProcessedEvent[];
    globalRowHeight: number;
    hiddenEventsInfoByDate: Map<string, {
        hiddenEventsInfo?: { count: number; };
        hiddenEventsInfoBySlot?: Map<number, { count: number; }>;
        date: Date;
    }>;
    getAllEventsForDate: (
        dateKey: string, _resourceLeaf?: ResourceLevel, startDate?: Date, endDate?: Date
    ) => TimelineProcessedEvent[];
    dateWidthPx: number;
    totalTimelineWidthPx: number;
}

function addBlockEventSegmentsToMap(
    event: EventModel, targetDates: Date[], targetMap: Map<number, EventModel[]>,
    multiDayMap: Map<string, { event: EventModel; firstIdx: number; lastIdx: number }>
): void {
    const startDate: Date = DateService.normalizeDate(event.startTime);
    let endDate: Date = DateService.normalizeDate(event.endTime);
    if (DateService.isMidnight(event.endTime) && endDate.getTime() > startDate.getTime()) {
        endDate = DateService.addDays(endDate, -1);
    }
    const fullDayIndexes: number[] = [];
    targetDates.forEach((date: Date, index: number) => {
        const normalizedDate: Date = DateService.normalizeDate(date);
        if (normalizedDate >= startDate && normalizedDate <= endDate) {
            const segmentStartDate: Date = normalizedDate.getTime() === startDate.getTime()
                ? event.startTime : normalizedDate;
            const segmentEndDate: Date = normalizedDate.getTime() === endDate.getTime() && !DateService.isMidnight(event.endTime)
                ? event.endTime : DateService.addDays(normalizedDate, 1);
            if (isBlockEventIndicator(event, segmentStartDate, segmentEndDate)) {
                const eventsForDate: EventModel[] = targetMap.get(index) ?? [];
                eventsForDate.push(event);
                targetMap.set(index, eventsForDate);
            } else {
                fullDayIndexes.push(index);
            }
        }
    });
    if (fullDayIndexes.length === 0) { return; }
    const firstIdx: number = fullDayIndexes[0];
    const lastIdx: number = fullDayIndexes[fullDayIndexes.length - 1];
    const fullDayEvent: EventModel = {
        ...event,
        startTime: DateService.normalizeDate(targetDates[firstIdx as number]),
        endTime: DateService.addDays(DateService.normalizeDate(targetDates[lastIdx as number]), 1)
    };
    const { eventID } = EventService.getEventIdentityKeys(fullDayEvent);
    multiDayMap.set(eventID, { event: fullDayEvent, firstIdx, lastIdx });
}

type EventGeometry = { leftPx: number; widthPx: number; isOverflowLeft?: boolean; isOverflowRight?: boolean; };

/**
 * Groups timeline events by their date spans and categorizes them as multi-day, single-day, or all-day events.
 * Used only in the date-based timeline rendering path.
 *
 * @param {EventModel[]} events - The events to group
 * @param {Date[]} dates - The render date array
 * @param {boolean} isMonthView - Whether the current view is a month view or not
 * @returns {TimelineEventsByDateMap} Events organized by date span and type
 *
 * @private
 */
function groupTimelineEventsByDate(events: EventModel[], dates: Date[], isMonthView: boolean): TimelineEventsByDateMap {
    const multiDayEventMap: Map<string, { event: EventModel; firstIdx: number; lastIdx: number }> = new Map();
    const singleDayEventsPerDate: Map<number, EventModel[]> = new Map();
    const allDayEventsPerDate: Map<number, EventModel[]> = new Map();

    const addMultiDayEventToMap: (
        event: EventModel, targetDates: Date[], targetMap: Map<string, { event: EventModel; firstIdx: number; lastIdx: number }>
    ) => void = (
        event: EventModel, targetDates: Date[], targetMap: Map<string, { event: EventModel; firstIdx: number; lastIdx: number }>
    ): void => {
        const normalizedStart: Date = DateService.normalizeDate(event.startTime);
        const normalizedEnd: Date = DateService.normalizeDate(event.endTime);
        const isMidnightEnd: boolean =  !event.isAllDay && DateService.isMidnight(event.endTime);
        let firstIdx: number = -1;
        let lastIdx: number = -1;
        for (let i: number = 0; i < targetDates.length; i++) {
            const normalizedDate: Date = DateService.normalizeDate(targetDates[i as number]);
            if (firstIdx === -1 && normalizedDate.getTime() >= normalizedStart.getTime()) {
                firstIdx = i;
            }
            if (isMidnightEnd ? normalizedDate.getTime() < normalizedEnd.getTime() :
                normalizedDate.getTime() <= normalizedEnd.getTime()) {
                lastIdx = i;
            }
        }
        if (firstIdx !== -1 && lastIdx !== -1) {
            const { eventID } = EventService.getEventIdentityKeys(event);
            targetMap.set(eventID, { event, firstIdx, lastIdx });
        }
    };

    const addSingleDayEventToMap: (event: EventModel, targetDates: Date[], targetMap: Map<number, EventModel[]>) => void = (
        event: EventModel, targetDates: Date[], targetMap: Map<number, EventModel[]>
    ): void => {
        for (let i: number = 0; i < targetDates.length; i++) {
            if (DateService.isSameDay(event.startTime, targetDates[i as number])) {
                if (!targetMap.has(i)) {
                    targetMap.set(i, []);
                }
                targetMap.get(i)?.push(event);
                break;
            }
        }
    };

    for (const event of events) {
        if (!event.startTime || !event.endTime) { continue; }
        if (event.isAllDay) {
            if (EventService.isMultiDayEvent(event)) {
                addMultiDayEventToMap(event, dates, multiDayEventMap);
            } else {
                addSingleDayEventToMap(event, dates, allDayEventsPerDate);
            }
            continue;
        }
        if (EventService.isMultiDayEvent(event)) {
            if (isMonthView && event.isBlock) {
                addBlockEventSegmentsToMap(event, dates, singleDayEventsPerDate, multiDayEventMap);
            } else {
                addMultiDayEventToMap(event, dates, multiDayEventMap);
            }
        } else {
            addSingleDayEventToMap(event, dates, singleDayEventsPerDate);
        }
    }
    return { multiDayEventMap, singleDayEventsPerDate, allDayEventsPerDate };
}

/**
 * Processes appointments for the horizontal timeline view and produces one
 *
 * @param {number} [eventHeight=38] - Rendered event bar height in pixels, read from the DOM via `getTimelineEventHeight()`.
 * @param {EventModel[]} [eventsDataOverride] - Optional override for the events data. When provided, drag and resize.
 * @param {number} [sourceTopPxOverride] - When provided drag and resize clone top value.
 * @returns {UseTimelineEventsResult} One entry per date, plus pixel-per-minute metadata.
 *
 * @private
 */
export function useTimelineEvents(
    eventHeight: number = 38, eventsDataOverride?: EventModel[], sourceTopPxOverride?: number
): UseTimelineEventsResult {
    const {
        timeFormat, startHour, endHour, maxEventsStack, viewType, rowAutoHeight, timeScale, headerRows,
        eventSettings, resources, isMonthView
    } = useSchedulerPropsContext();
    const { schedulerContentHeight } = useSchedulerHeaderRowsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { isGroupingEnabled, visibleResourceHeaders } = useResourceGroupingContext();
    const contextEventsData: EventModel[] = useSchedulerEventsContext().eventsData ?? [];
    const eventsData: EventModel[] = eventsDataOverride ?? contextEventsData;
    const { locale, dir } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { timeSlots } = useMemo(
        () => DateService.getTimelineSlots(viewType, startHour, endHour, timeScale, timeFormat, locale),
        [viewType, startHour, endHour, timeScale, timeFormat, locale]
    );
    const dynamicMaxEventsStack: (availableHeight: number, eventHeight: number) => number =
        (availableHeight: number, eventHeight: number): number => {
            if (availableHeight <= 0 || eventHeight <= 0) { return 0; }
            const remainingHeight: number = availableHeight - EVENTS_GAP - eventHeight;
            if (remainingHeight < 0) { return 0; }
            return Math.floor(remainingHeight / (eventHeight + EVENT_GAP));
        };
    const isResourceGrouped: boolean = isGroupingEnabled && (visibleResourceHeaders?.length ?? 0) > 0;
    let effectiveMaxEventsStack: number;
    const totalContentHeight: number = schedulerContentHeight.current ?? 0;
    if (!isNullOrUndefined(maxEventsStack)) {
        effectiveMaxEventsStack = Math.max(0, maxEventsStack);
    } else if (isResourceGrouped) {
        const perResourceContentHeight: number = totalContentHeight / visibleResourceHeaders.length;
        const resourceRowHeight: number = Math.max(perResourceContentHeight, SLOT_ROW_HEIGHT);
        effectiveMaxEventsStack = Math.max(1, dynamicMaxEventsStack(resourceRowHeight, eventHeight));
    } else {
        effectiveMaxEventsStack = dynamicMaxEventsStack(totalContentHeight, eventHeight);
    }
    const isRtl: boolean = dir === 'rtl';
    const useTimeSlotBasedLogic: boolean = HeaderService.isTimeHeaderVisible(headerRows, viewType, timeScale?.enable);
    const effectiveIgnoreWhitespace: boolean = Boolean(rowAutoHeight && eventSettings?.ignoreWhitespace);

    const { rows, allEvents, globalRowHeight, hiddenEventsInfoByDate, dateWidthPx, totalTimelineWidthPx } = useMemo(() => {
        const { schedulerStartMinutes: startMinutes, schedulerEndMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
        const endMinutes: number = schedulerEndMinutes > startMinutes ? schedulerEndMinutes : startMinutes + MINUTES_PER_HOUR;
        const minorStepMinutes: number = timeSlots.length > 1
            ? Math.max(1, timeSlots[1].minutesFromStart - timeSlots[0].minutesFromStart)
            : Math.max(1, (endMinutes - startMinutes) / Math.max(1, timeSlots.length));
        const columnWidth: number = BASE_COLUMN_WIDTH;
        const pixelsPerMinute: number = useTimeSlotBasedLogic ? columnWidth / minorStepMinutes : 0;
        const dateWidthPx: number = useTimeSlotBasedLogic ? timeSlots.length * columnWidth : columnWidth;
        const globallySortedEvents: EventModel[] = DateService.sortByTimeAndSpan([...eventsData]);
        const dates: Date[] = (renderDates && renderDates.length > 0) ? renderDates : [];
        const totalTimelineWidthPx: number = dates.length * dateWidthPx;
        if (dates.length === 0 || eventsData.length === 0) {
            return {
                rows: dates.map((date: Date, idx: number): TimelineEventRow => ({
                    key: DateService.generateDateKey(date), date, dateTimestamp: date.getTime(),
                    dateIndex: idx, rowHeight: SLOT_ROW_HEIGHT, stackCount: 0, events: []
                })),
                allEvents: [], globalRowHeight: SLOT_ROW_HEIGHT, hiddenEventsInfoByDate: new Map(),
                dateWidthPx, totalTimelineWidthPx
            };
        }

        const calculateMultiDayGeometry: (
            firstDateIndex: number, lastDateIndex: number, startMins?: number, endMins?: number
        ) => EventGeometry = (
            firstDateIndex: number, lastDateIndex: number, startMins: number = 0, endMins: number = MINUTES_PER_DAY
        ): EventGeometry => {
            const numSpannedDates: number = lastDateIndex - firstDateIndex + 1;
            const { isOverflowLeft, isOverflowRight, visibleStart, visibleEnd } =
                getEventVisibilityBounds(startMins, endMins, startMinutes, endMinutes);
            if (!useTimeSlotBasedLogic) {
                const fullWidthPx: number = numSpannedDates * dateWidthPx;
                return {
                    leftPx: firstDateIndex * dateWidthPx, widthPx: Math.max(BASE_COLUMN_WIDTH, fullWidthPx),
                    isOverflowLeft, isOverflowRight
                };
            }
            const leftPx: number = (firstDateIndex * dateWidthPx) + (visibleStart - startMinutes) * pixelsPerMinute;
            let widthPx: number = 0;
            if (numSpannedDates === 1) {
                widthPx = (visibleEnd - visibleStart) * pixelsPerMinute;
            } else {
                const firstDateWidth: number = Math.max(0, endMinutes - visibleStart) * pixelsPerMinute;
                const intermediateDatesWidth: number = (numSpannedDates - 2) * dateWidthPx;
                const lastDateWidth: number = Math.max(0, visibleEnd - startMinutes) * pixelsPerMinute;
                widthPx = firstDateWidth + intermediateDatesWidth + lastDateWidth;
            }
            return {
                leftPx: Math.max(firstDateIndex * dateWidthPx, leftPx), widthPx: Math.max(0, widthPx),
                isOverflowLeft, isOverflowRight
            };
        };

        const calculateSingleDayGeometry: (
            dateIndex: number, startMins: number, endMins: number
        ) => EventGeometry & { isVisibleOnDate: boolean } = (
            dateIndex: number, startMins: number, endMins: number
        ): EventGeometry & { isVisibleOnDate: boolean } => {
            const { isOverflowLeft, isOverflowRight, visibleStart, visibleEnd, isVisibleOnDate } =
                getEventVisibilityBounds(startMins, endMins, startMinutes, endMinutes);
            if (!useTimeSlotBasedLogic) {
                return {
                    leftPx: dateIndex * dateWidthPx, widthPx: isVisibleOnDate ? Math.max(BASE_COLUMN_WIDTH, dateWidthPx) : 0,
                    isVisibleOnDate: true, isOverflowLeft, isOverflowRight
                };
            }
            const leftPx: number = (dateIndex * dateWidthPx) + (visibleStart - startMinutes) * pixelsPerMinute;
            const widthPx: number = isVisibleOnDate ? Math.max(0, (visibleEnd - visibleStart) * pixelsPerMinute) : 0;
            return {
                leftPx: Math.max(dateIndex * dateWidthPx, leftPx), widthPx, isVisibleOnDate, isOverflowLeft, isOverflowRight
            };
        };

        const buildProcessedEvent: (
            event: EventModel, positionIndex: number, eventKey: string, totalSegments: number,
            geometry: EventGeometry, options?: { timeDisplay?: string; isFirstDay?: boolean; isLastDay?: boolean;
                isBlockIndicator?: boolean }
        ) => TimelineProcessedEvent | null = (
            event: EventModel, positionIndex: number, eventKey: string, totalSegments: number,
            geometry: EventGeometry, options?: { timeDisplay?: string; isFirstDay?: boolean; isLastDay?: boolean;
                isBlockIndicator?: boolean }
        ): TimelineProcessedEvent | null => {
            const eventStart: Date = event.startTime;
            const eventEnd: Date = event.endTime;
            const { leftPx, widthPx, isOverflowLeft, isOverflowRight } = geometry;
            if (!eventStart || !eventEnd || widthPx <= 0) { return null; }
            const topPx: number = sourceTopPxOverride && sourceTopPxOverride > 0 ? sourceTopPxOverride
                : (event.isBlock ? 0 : EVENT_GAP + positionIndex * (eventHeight + EVENT_GAP));
            const timeDisplay: string = options?.timeDisplay ?? DateService.formatTimeDisplay(event, locale, timeFormat);
            const eventClasses: string[] = EventService.getEventClassNames(event);
            const processedEvent: TimelineProcessedEvent = {
                event, startDate: eventStart, endDate: eventEnd, positionIndex, totalSegments,
                ...(options?.isFirstDay !== undefined ? { isFirstDay: options.isFirstDay } : {}),
                ...(options?.isLastDay !== undefined ? { isLastDay: options.isLastDay } : {}),
                ...(options?.isBlockIndicator !== undefined ? { isBlockIndicator: options.isBlockIndicator } : {}),
                timeDisplay, eventKey, eventClasses,
                eventStyle: EventService.createEventStyle(leftPx, widthPx, topPx, isRtl, totalTimelineWidthPx),
                leftPx, widthPx, topPx, isOverflowLeft, isOverflowRight
            };
            if (resources) {
                const resourceColor: string | undefined = EventService.getResourceColor(
                    event, resources, eventSettings?.resourceColorField
                );
                if (resourceColor) { processedEvent.eventStyle.backgroundColor = resourceColor; }
            }
            return processedEvent;
        };

        const buildMultiDayEventForRender: (
            event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
        ) => TimelineProcessedEvent | null = (
            event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
        ): TimelineProcessedEvent | null => {
            const eventStart: Date = event.startTime;
            const eventEnd: Date = event.endTime;
            if (!eventStart || !eventEnd) { return null; }
            const { dayStart: firstDayMidnight } = getDayBounds(dates[firstDateIndex as number]);
            const { dayEnd: lastDayEnd } = getDayBounds(dates[lastDateIndex as number]);
            const { startMins, endMins } = getClampedEventMinutesInRange(
                eventStart, eventEnd, firstDayMidnight, lastDayEnd
            );
            const geometry: EventGeometry =
                calculateMultiDayGeometry(firstDateIndex, lastDateIndex, startMins, endMins);
            return buildProcessedEvent(
                event, positionIndex, `${event.id}-span-${firstDateIndex}-${lastDateIndex}`,
                lastDateIndex - firstDateIndex + 1, geometry
            );
        };

        const buildAllDayEventForRender: (
            dateIndex: number, date: Date, event: EventModel, positionIndex: number
        ) => TimelineProcessedEvent | null = (
            dateIndex: number, date: Date, event: EventModel, positionIndex: number
        ): TimelineProcessedEvent | null => {
            const eventKey: string = `${DateService.generateDateKey(date)}-${event.id}-allday`;
            const geometry: EventGeometry = calculateSingleDayGeometry(dateIndex, 0, MINUTES_PER_DAY);
            return buildProcessedEvent(
                event, positionIndex, eventKey, 1, geometry, { timeDisplay: getString('allDay') }
            );
        };

        const buildMultiDayAllDayEventForRender: (
            event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
        ) => TimelineProcessedEvent | null = (
            event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
        ): TimelineProcessedEvent | null => {
            const eventKey: string = `${event.id}-span-${firstDateIndex}-${lastDateIndex}-allday`;
            const totalSegments: number = lastDateIndex - firstDateIndex + 1;
            const geometry: EventGeometry = calculateMultiDayGeometry(firstDateIndex, lastDateIndex);
            return buildProcessedEvent(
                event, positionIndex, eventKey, totalSegments, geometry, { timeDisplay: getString('allDay') }
            );
        };

        const buildSingleDayEventForRender: (
            dateIndex: number, date: Date, event: EventModel, isFirstDay: boolean, isLastDay: boolean, positionIndex: number
        ) => TimelineProcessedEvent | null = (
            dateIndex: number, date: Date, event: EventModel, isFirstDay: boolean, isLastDay: boolean, positionIndex: number
        ): TimelineProcessedEvent | null => {
            const eventStart: Date = event.startTime;
            const eventEnd: Date = event.endTime;
            if (!eventStart || !eventEnd) { return null; }
            const { dayStart, dayEnd } = getDayBounds(date);
            const { startMins, endMins } = getClampedEventMinutesInRange(eventStart, eventEnd, dayStart, dayEnd);
            const { leftPx, widthPx, isVisibleOnDate, isOverflowLeft, isOverflowRight } =
                calculateSingleDayGeometry(dateIndex, startMins, endMins);
            if (!isVisibleOnDate) { return null; }
            const segmentStartDate: Date = eventStart.getTime() <= dayStart.getTime() ? dayStart : eventStart;
            const segmentEndDate: Date = eventEnd.getTime() >= dayEnd.getTime() ? dayEnd : eventEnd;
            return buildProcessedEvent(
                event, positionIndex,
                `${DateService.generateDateKey(date)}-${event.id ?? event.guid ?? ''}`,
                1,
                { leftPx, widthPx, isOverflowLeft, isOverflowRight },
                { isFirstDay, isLastDay, isBlockIndicator: isBlockEventIndicator(event, segmentStartDate, segmentEndDate) }
            );
        };
        const eventBuilders: TimelineEventBuilders = {
            buildMultiDayEventForRender, buildAllDayEventForRender, buildMultiDayAllDayEventForRender, buildSingleDayEventForRender
        };
        const { multiDayEventMap, singleDayEventsPerDate, allDayEventsPerDate } =
            groupTimelineEventsByDate(eventsData, dates, isMonthView);
        const multiDayPositionCache: Map<string, number> = new Map();
        const buildTimelineEventRow: (dateIndex: number, date: Date) =>
        TimelineEventRow = (dateIndex: number, date: Date): TimelineEventRow => {
            const { eventsOnThisDate, eventMetadata } = collectTimelineEventsForDate(
                dateIndex, { multiDayEventMap, singleDayEventsPerDate, allDayEventsPerDate }
            );
            let eventPositions: Map<string, number> = new Map();
            if (eventsOnThisDate.length > 0) {
                const sortedEvents: EventModel[] = globallySortedEvents.filter((e: EventModel) => eventsOnThisDate.includes(e));
                eventPositions = assignTimelineEventPositions(sortedEvents, eventMetadata, multiDayPositionCache);
            }
            const processedEvents: TimelineProcessedEvent[] = [];
            let maxPosition: number = -1;
            for (const event of eventsOnThisDate) {
                const { eventID, isAllDay, eventKey } = EventService.getEventIdentityKeys(event);
                const meta: TimelineEventMetadata | undefined = eventMetadata.get(isAllDay ? eventKey : eventID);
                if (!meta) { continue; }
                const positionIndex: number = eventPositions.get(eventKey) ?? 0;
                const positioned: TimelineProcessedEvent | null = buildPositionedTimelineEvent(
                    event, meta, positionIndex, dateIndex, date, eventBuilders
                );
                if (positioned) {
                    processedEvents.push(positioned);
                    if (positioned.positionIndex > maxPosition) {
                        maxPosition = positioned.positionIndex;
                    }
                }
            }
            let hiddenEventsInfo: { count: number; } | undefined;
            if (!rowAutoHeight && processedEvents.length > effectiveMaxEventsStack) {
                const hiddenCount: number = processedEvents.filter(
                    (event: TimelineProcessedEvent) => event.positionIndex >= effectiveMaxEventsStack
                ).length;
                hiddenEventsInfo = { count: hiddenCount };
            }
            const maxEventsPerRow: number = rowAutoHeight
                ? maxPosition + 1
                : Math.min(maxPosition + 1, effectiveMaxEventsStack);
            const visibleStackCount: number = Math.max(0, maxEventsPerRow);
            const hasMoreIndicator: boolean = !rowAutoHeight && Boolean(hiddenEventsInfo);
            const rowHeight: number = calculateTimelineEventRowHeight(
                visibleStackCount, eventHeight, hasMoreIndicator, effectiveIgnoreWhitespace
            );
            return {
                key: DateService.generateDateKey(date), date, dateTimestamp: date.getTime(),
                dateIndex, rowHeight, stackCount: visibleStackCount, events: processedEvents, hiddenEventsInfo
            };
        };
        const rows: TimelineEventRow[] = useTimeSlotBasedLogic
            ? buildRowsByTimeSlot(
                dates, { multiDayEventMap, singleDayEventsPerDate, allDayEventsPerDate },
                timeSlots, effectiveMaxEventsStack,
                eventBuilders,
                {
                    startMinutes, endMinutes, intervalMinutes: minorStepMinutes
                },
                eventHeight,
                rowAutoHeight,
                effectiveIgnoreWhitespace
            )
            : dates.map((date: Date, dateIndex: number): TimelineEventRow => buildTimelineEventRow(dateIndex, date));

        const allEvents: TimelineProcessedEvent[] = [];
        const seenEventKeys: Set<string> = new Set();
        let globalRowHeight: number = SLOT_ROW_HEIGHT;
        const hiddenEventsInfoByDate: Map<string, {
            hiddenEventsInfo?: { count: number; };
            hiddenEventsInfoBySlot?: Map<number, { count: number; }>;
            date: Date;
        }> = new Map();
        for (const row of rows) {
            for (const evt of row.events) {
                if (!rowAutoHeight && (evt.positionIndex ?? 0) >= effectiveMaxEventsStack) { continue; }
                if (!seenEventKeys.has(evt.eventKey)) {
                    seenEventKeys.add(evt.eventKey);
                    allEvents.push(evt);
                }
            }
            if (row.rowHeight > globalRowHeight) {
                globalRowHeight = row.rowHeight;
            }
            hiddenEventsInfoByDate.set(row.key, {
                hiddenEventsInfo: row.hiddenEventsInfo,
                hiddenEventsInfoBySlot: row.hiddenEventsInfoBySlot,
                date: row.date
            });
        }

        return {
            rows, allEvents, globalRowHeight, hiddenEventsInfoByDate, dateWidthPx, totalTimelineWidthPx
        };
    }, [
        renderDates, eventsData, startHour, endHour, timeFormat, locale,
        eventHeight, isRtl, rowAutoHeight, effectiveMaxEventsStack,
        viewType, timeScale, headerRows, timeSlots, getString, sourceTopPxOverride, effectiveIgnoreWhitespace
    ]);

    const getAllEventsForDate: (
        dateKey: string, _resourceLeaf?: ResourceLevel, startDate?: Date, endDate?: Date
    ) => TimelineProcessedEvent[] = useCallback((
        dateKey: string, _resourceLeaf?: ResourceLevel, startDate?: Date, endDate?: Date
    ): TimelineProcessedEvent[] => {
        const row: TimelineEventRow | undefined = rows.find((r: TimelineEventRow) => r.key === dateKey);
        if (!row) { return []; }
        const dateEvents: TimelineProcessedEvent[] = row.events ?? [];
        if (isNullOrUndefined(startDate) || isNullOrUndefined(endDate)) { return dateEvents; }
        return dateEvents.filter((evt: TimelineProcessedEvent) => {
            const { start, end } = DateService.getEventRange(evt);
            return getEventOverlappingInfo(start, end, startDate, endDate);
        });
    }, [rows]);

    return {
        rows, allEvents, globalRowHeight, hiddenEventsInfoByDate, getAllEventsForDate,
        dateWidthPx, totalTimelineWidthPx
    };
}

export default useTimelineEvents;
