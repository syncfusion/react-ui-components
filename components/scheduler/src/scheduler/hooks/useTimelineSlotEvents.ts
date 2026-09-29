import { EventModel } from '../types/scheduler-types';
import { DateService, MINUTES_PER_HOUR, MS_PER_MINUTE } from '../services/DateService';
import { TimelineEventRow, TimelineProcessedEvent } from '../types/internal-interface';
import { EventService } from '../services/EventService';
import {
    assignTimelineEventPositions, buildPositionedTimelineEvent, calculateTimelineEventRowHeight, collectTimelineEventsForDate,
    getEventOverlappingInfo, TimelineEventBuilders, TimelineEventMetadata, TimelineEventsByDateMap, getDayBounds
} from '../utils/actions';

const createTimelineDateOverlapChecker: (
    date: Date, startMinutes: number, endMinutes: number
) => (eventA: EventModel, eventB: EventModel) => boolean = (
    date: Date, startMinutes: number, endMinutes: number
): ((eventA: EventModel, eventB: EventModel) => boolean) => {
    const eventTrimmedTimes: Map<string, { trimStart: number; trimEnd: number }> = new Map();
    const { dayStart, dayEnd } = getDayBounds(date);
    const getTrimmedStartTime: (event: EventModel) => number = (event: EventModel): number => {
        if (event.isAllDay || !event.startTime || event.startTime.getTime() < dayStart.getTime()) {
            return startMinutes * MS_PER_MINUTE;
        }
        const eventStartMins: number = DateService.getTimeOfDayInMinutes(event.startTime);
        return Math.max(eventStartMins, startMinutes) * MS_PER_MINUTE;
    };
    const getTrimmedEndTime: (event: EventModel) => number = (event: EventModel): number => {
        if (event.isAllDay || !event.endTime || event.endTime.getTime() >= dayEnd.getTime()) {
            return endMinutes * MS_PER_MINUTE;
        }
        const eventEndMins: number = DateService.getTimeOfDayInMinutes(event.endTime);
        return Math.min(eventEndMins, endMinutes) * MS_PER_MINUTE;
    };
    const getTrimmedTimes: (event: EventModel) => { trimStart: number; trimEnd: number } = (
        event: EventModel
    ): { trimStart: number; trimEnd: number } => {
        const key: string = event.id?.toString() ?? event.guid ?? '';
        let trimmed: { trimStart: number; trimEnd: number } | undefined = eventTrimmedTimes.get(key);
        if (!trimmed) {
            trimmed = {
                trimStart: getTrimmedStartTime(event),
                trimEnd: getTrimmedEndTime(event)
            };
            eventTrimmedTimes.set(key, trimmed);
        }
        return trimmed;
    };
    return (eventA: EventModel, eventB: EventModel): boolean => {
        const trimmedA: { trimStart: number; trimEnd: number } = getTrimmedTimes(eventA);
        const trimmedB: { trimStart: number; trimEnd: number } = getTrimmedTimes(eventB);
        const aStart: number = trimmedA.trimStart;
        const aEnd: number = trimmedA.trimEnd;
        const bStart: number = trimmedB.trimStart;
        const bEnd: number = trimmedB.trimEnd;
        return (aStart <= bStart && bStart < aEnd) || (bStart <= aStart && aStart < bEnd);
    };
};

/**
 * Build timeline rows with time-slot based more indicator calculation.
 *
 * @param {Date[]} allDates - All render dates
 * @param {Object} eventsByDateMap - Pre-organized events grouped by date
 * @param {Map} eventsByDateMap.multiDayEventMap - Multi-day events by key
 * @param {Map} eventsByDateMap.singleDayEventsPerDate - Single-day events per date
 * @param {Map} eventsByDateMap.allDayEventsPerDate - All-day events per date
 * @param {Array} slots - Minor time slots with minutesFromStart property
 * @param {number} maxVisible - Maximum visible events per slot
 * @param {Object} eventBuilders - Functions to build positioned events
 * @param {Function} eventBuilders.buildMultiDayEventForRender - Build multi-day event renderer
 * @param {Function} eventBuilders.buildAllDayEventForRender - Build all-day event renderer
 * @param {Function} eventBuilders.buildMultiDayAllDayEventForRender - Build multi-day all-day renderer
 * @param {Function} eventBuilders.buildSingleDayEventForRender - Build single-day event renderer
 * @param {Object} config - Configuration object
 * @param {number} config.startMinutes - Start time in minutes
 * @param {number} config.endMinutes - End time in minutes
 * @param {number} config.intervalMinutes - Slot interval in minutes (for EJ2 slot-boundary snapping)
 * @param {number} eventHeight - Rendered event bar height in pixels, read from the DOM via
 * @param {boolean} rowAutoHeight - When `true`, row height auto-expands to fit all events in the densest timeslot of the current view
 * @param {boolean} ignoreWhitespace - When `true`, do not reserve additional whitespace in the calculated row height
 * @returns {TimelineEventRow[]} Built rows with slot-based overflow info
 * @private
 */
export function buildRowsByTimeSlot(
    allDates: Date[],
    eventsByDateMap: TimelineEventsByDateMap,
    slots: Array<{ minutesFromStart: number }>,
    maxVisible: number,
    eventBuilders: TimelineEventBuilders,
    config: {
        startMinutes: number;
        endMinutes: number;
        intervalMinutes?: number;
    },
    eventHeight: number,
    rowAutoHeight: boolean = false,
    ignoreWhitespace: boolean = false
): TimelineEventRow[] {
    const rows: TimelineEventRow[] = [];
    const intervalMinutes: number = config.intervalMinutes ?? MINUTES_PER_HOUR;
    const viewStartMinutes: number = config.startMinutes;
    const multiDayPositionCache: Map<string, number> = new Map();
    const multiDayPositionedCache: Map<string, TimelineProcessedEvent> = new Map();
    for (let dateIdx: number = 0; dateIdx < allDates.length; dateIdx++) {
        const date: Date = allDates[dateIdx as number];
        const { eventsOnThisDate, eventMetadata } = collectTimelineEventsForDate(dateIdx, eventsByDateMap);
        const eventsBySlot: Map<number, TimelineProcessedEvent[]> = new Map();
        for (let slotIdx: number = 0; slotIdx < slots.length; slotIdx++) {
            eventsBySlot.set(slotIdx, []);
        }
        // Slot path: time-trimmed overlap decides shared stack lanes.
        const eventsOverlap: (eventA: EventModel, eventB: EventModel) => boolean =
            createTimelineDateOverlapChecker(date, config.startMinutes, config.endMinutes);
        if (eventsOnThisDate.length > 0) {
            const sortedEvents: EventModel[] = DateService.sortByTimeAndSpan([...eventsOnThisDate]);
            const eventPositionMap: Map<string, number> = assignTimelineEventPositions(
                sortedEvents, eventMetadata, multiDayPositionCache, eventsOverlap
            );
            const addEventToSlot: (slotIndex: number, positionedEvent: TimelineProcessedEvent) => void = (
                slotIndex: number, positionedEvent: TimelineProcessedEvent
            ): void => {
                const slotEvents: TimelineProcessedEvent[] = eventsBySlot.get(slotIndex) ?? [];
                slotEvents.push(positionedEvent);
                eventsBySlot.set(slotIndex, slotEvents);
            };
            for (const event of sortedEvents) {
                const { isAllDay, eventKey } = EventService.getEventIdentityKeys(event);
                const meta: TimelineEventMetadata | undefined = eventMetadata.get(eventKey);
                if (!meta) { continue; }
                const positionIndex: number = eventPositionMap.get(eventKey) ?? 0;
                const positioned: TimelineProcessedEvent | null = buildPositionedTimelineEvent(
                    event, meta, positionIndex, dateIdx, date, eventBuilders, multiDayPositionedCache
                );
                if (!positioned) { continue; }
                if (isAllDay || meta.isMultiDay) {
                    addEventToSlot(0, positioned);
                } else {
                    const eventStartMins: number = DateService.getTimeOfDayInMinutes(event.startTime);
                    const relativeStartMins: number = eventStartMins - viewStartMinutes;
                    let snappedStartMins: number;
                    if (intervalMinutes < 60) {
                        const minutesPart: number = event.startTime.getMinutes();
                        const snappedMinutesPart: number = Math.floor(minutesPart / intervalMinutes) * intervalMinutes;
                        snappedStartMins = event.startTime.getHours() * 60 + snappedMinutesPart - viewStartMinutes;
                    } else {
                        snappedStartMins = Math.floor(relativeStartMins / intervalMinutes) * intervalMinutes;
                    }
                    const slotIdx: number =
                        slots.findIndex((s: { minutesFromStart: number; }) => s.minutesFromStart === snappedStartMins);
                    addEventToSlot(slotIdx >= 0 ? slotIdx : 0, positioned);
                }
            }
        }
        let maxStackCount: number = 0;
        const allSlotHiddenInfo: Map<number, { count: number; }> = new Map();
        const allVisibleEvents: TimelineProcessedEvent[] = [];
        const allEventsForDate: TimelineProcessedEvent[] = [];
        for (const slotEvents of eventsBySlot.values()) {
            allEventsForDate.push(...slotEvents);
        }
        const allEventsByPositionIndex: Map<number, TimelineProcessedEvent[]> = new Map();
        for (const evt of allEventsForDate) {
            const posIdx: number = evt.positionIndex ?? 0;
            if (!allEventsByPositionIndex.has(posIdx)) {
                allEventsByPositionIndex.set(posIdx, []);
            }
            const posEvents: TimelineProcessedEvent[] = allEventsByPositionIndex.get(posIdx)!;
            posEvents.push(evt);
        }
        const maxPositionIndex: number = rowAutoHeight
            ? Math.max(...Array.from(allEventsByPositionIndex.keys()), -1) + 1
            : maxVisible;
        for (let posIdx: number = 0; posIdx < maxPositionIndex; posIdx++) {
            const eventsAtPos: TimelineProcessedEvent[] = allEventsByPositionIndex.get(posIdx) ?? [];
            allVisibleEvents.push(...eventsAtPos);
        }
        const hiddenEvents: TimelineProcessedEvent[] = rowAutoHeight
            ? []
            : allEventsForDate.filter(
                (evt: TimelineProcessedEvent) => (evt.positionIndex ?? 0) >= maxVisible
            );
        let densestSlotEventCount: number = 0;
        const dayStartMs: number = DateService.normalizeDate(date).getTime();
        for (let slotIdx: number = 0; slotIdx < slots.length; slotIdx++) {
            const slotStartRelative: number = slots[slotIdx as number]?.minutesFromStart ?? (slotIdx * intervalMinutes);
            const slotEndRelative: number = slots[slotIdx + 1]?.minutesFromStart ?? (slotStartRelative + intervalMinutes);
            const rangeStart: number = dayStartMs + ((viewStartMinutes + slotStartRelative) * MS_PER_MINUTE);
            const rangeEnd: number = dayStartMs + ((viewStartMinutes + slotEndRelative) * MS_PER_MINUTE);
            const overlappingEvents: TimelineProcessedEvent[] = allEventsForDate.filter(
                (evt: TimelineProcessedEvent) => {
                    const { start, end } = DateService.getEventRange(evt);
                    return getEventOverlappingInfo(start, end, rangeStart, rangeEnd);
                }
            );
            densestSlotEventCount = Math.max(densestSlotEventCount, overlappingEvents.length);
            const hiddenInSlot: TimelineProcessedEvent[] = hiddenEvents.filter(
                (evt: TimelineProcessedEvent) => {
                    const { start, end } = DateService.getEventRange(evt);
                    return getEventOverlappingInfo(start, end, rangeStart, rangeEnd);
                }
            );
            if (hiddenInSlot.length > 0) {
                allSlotHiddenInfo.set(slotIdx, { count: hiddenInSlot.length });
            }
        }
        for (const evt of allVisibleEvents) {
            if (evt.positionIndex !== undefined) {
                maxStackCount = Math.max(maxStackCount, evt.positionIndex + 1);
            }
        }
        let hiddenEventsInfo: { count: number; } | undefined;
        for (let slotIdx: number = 0; slotIdx < slots.length; slotIdx++) {
            const overflow: { count: number; } | undefined = allSlotHiddenInfo.get(slotIdx);
            if (overflow) {
                hiddenEventsInfo = overflow;
                break;
            }
        }
        const visibleStackCount: number = rowAutoHeight
            ? Math.max(0, densestSlotEventCount, maxStackCount)
            : Math.max(0, Math.min(maxStackCount, maxVisible));
        const hasMoreIndicator: boolean = !rowAutoHeight && allSlotHiddenInfo.size > 0;
        const rowHeight: number = calculateTimelineEventRowHeight(
            visibleStackCount, eventHeight, hasMoreIndicator, ignoreWhitespace
        );
        rows.push({
            key: DateService.generateDateKey(date),
            date,
            dateTimestamp: date.getTime(),
            dateIndex: dateIdx,
            rowHeight,
            stackCount: visibleStackCount,
            events: allEventsForDate,
            hiddenEventsInfo,
            hiddenEventsInfoBySlot: allSlotHiddenInfo.size > 0 ? allSlotHiddenInfo : undefined,
            eventsBySlot: eventsBySlot.size > 0 ? eventsBySlot : undefined
        });
    }
    return rows;
}

export default buildRowsByTimeSlot;
