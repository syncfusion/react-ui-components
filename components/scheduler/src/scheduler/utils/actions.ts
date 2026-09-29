import { RefObject } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { DateService, MINUTES_PER_DAY, MINUTES_PER_HOUR } from '../services/DateService';
import { EVENT_GAP, EventService, SLOT_ROW_HEIGHT } from '../services/EventService';
import { SchedulerEventClickEvent, EventModel, TimeScaleProps, SchedulerScrollToProps } from '../types/scheduler-types';
import { TimelineProcessedEvent } from '../types/internal-interface';
import { ScrollToMode } from '../types/enums';
import { CloneBase } from './clone-manager';
import { addClass, isNullOrUndefined, removeClass } from '@syncfusion/react-base';

type EventVisibilityBounds = {
    isOverflowLeft: boolean; isOverflowRight: boolean; visibleStart: number; visibleEnd: number; isVisibleOnDate: boolean;
};

export function parseHourStringToMinutes(hour?: string): number {
    if (!hour) { return 0; }
    const [h, m]: number[] = hour.split(':').map(Number);
    return (h || 0) * MINUTES_PER_HOUR + (m || 0);
}

// Ensures only one cell is selected at any time per Scheduler instance.
export const clearAndSelect: (target: HTMLElement) => void = (target: HTMLElement): void => {
    const scheduler: HTMLElement = target.closest('.sf-scheduler');
    if (scheduler) {
        const oldElement: HTMLElement = scheduler.querySelector('.' + CSS_CLASSES.SELECTED_CELL);
        if (oldElement) {
            oldElement.classList.remove(CSS_CLASSES.SELECTED_CELL);
            oldElement.removeAttribute('tabindex');
        }
    }
    target.classList.add(CSS_CLASSES.SELECTED_CELL);
    target.tabIndex = 0;
    target.focus();
};

export const getCellFromIndex: (root: HTMLElement | null | undefined, rowIndex: number, colIndex: number) => HTMLElement | null =
(root: HTMLElement | null | undefined, rowIndex: number, colIndex: number): HTMLElement | null => {
    if (!root || rowIndex < 0 || colIndex < 0) { return null; }

    // Get all rows in the work cells container
    const rows: NodeListOf<HTMLElement> = root.querySelectorAll<HTMLElement>(`.${CSS_CLASSES.WORK_CELLS_ROW}`);
    const row: HTMLElement | null = rows.item(rowIndex);
    if (!row) { return null; }

    // Get all cells in the selected row (work cells or all-day cells)
    const cells: NodeListOf<HTMLElement> = row.querySelectorAll<HTMLElement>(`.${CSS_CLASSES.WORK_CELLS}`);
    const cell: HTMLElement | null = cells.item(colIndex);
    return cell ?? null;
};

// Clears all active appointments and selects only the target appointment.
export const clearAndSelectAppointment: (target: HTMLElement) => void = (target: HTMLElement): void => {
    const scheduler: HTMLElement = target.closest('.' + CSS_CLASSES.SCHEDULER);
    if (scheduler) {
        const activeAppointments: NodeListOf<Element> = scheduler.querySelectorAll('.' + CSS_CLASSES.APPOINTMENT + '.' + CSS_CLASSES.APPOINTMENT_ACTIVE);
        activeAppointments.forEach((element: Element) => {
            element.classList.remove(CSS_CLASSES.APPOINTMENT_ACTIVE);
        });
        clearAndSelect(scheduler);
    }
    target.classList.add(CSS_CLASSES.APPOINTMENT_ACTIVE);
};

export const getSelectedEvents: (eventsData: EventModel[], schedulerElement?: HTMLElement) => SchedulerEventClickEvent =
    (eventsData: EventModel[], schedulerElement: HTMLElement) => {
        const selectedAppointment: HTMLElement = schedulerElement.querySelector('.' + CSS_CLASSES.APPOINTMENT + '.' + CSS_CLASSES.APPOINTMENT_ACTIVE);
        const guid: string = selectedAppointment?.getAttribute('data-guid');
        const eventDetails: EventModel | undefined = EventService.getEventByGuid(eventsData, guid);
        return {
            data: eventDetails,
            element: selectedAppointment
        };
    };

const getDate: (el: HTMLElement) => Date | undefined =
    (el: HTMLElement): Date | undefined => {
        let date: Date | undefined = undefined;
        const dateData: string | undefined = el?.getAttribute?.('data-date') ?? (el as HTMLElement).dataset?.date ?? undefined;
        if (dateData) {
            const dateInMS: number = parseInt(dateData, 10);
            date = new Date(dateInMS);
        }
        return date;
    };

export const getCellDetails: (
    input?: Element | Element[], timeScale?: TimeScaleProps
) => {
    startTime?: Date;
    endTime?: Date;
    isAllDay: boolean;
    element: HTMLElement;
} | null = (input?: Element | Element[], timeScale?: TimeScaleProps) => {

    const cell: HTMLElement = Array.isArray(input)
        ? (input?.[0] as HTMLElement | undefined)
        : (input as HTMLElement);
    const baseAllDay: boolean =
        cell.classList.contains(CSS_CLASSES.ALL_DAY_CELL) ||
        cell.classList.contains(CSS_CLASSES.WORK_DAYS) ||
        cell.classList.contains(CSS_CLASSES.HEADER_CELLS);
    const effectiveAllDay: boolean = baseAllDay || !(timeScale?.enable ?? true);
    const startTime: Date | undefined = getDate(cell);
    let endTime: Date | undefined = undefined;
    if (effectiveAllDay) {
        if (startTime) {
            endTime = DateService.addDays(startTime, 1);
        }
    } else if (startTime && timeScale) {
        const interval: number = timeScale.interval / timeScale.slotCount;
        const date: Date = new Date(startTime);
        date.setMinutes(date.getMinutes() + interval);
        endTime = date;
    }
    return {
        startTime: startTime,
        endTime: endTime ?? startTime,
        isAllDay: effectiveAllDay,
        element: cell
    };
};

export const getScrollContainer: (root: HTMLElement) => HTMLElement = (root: HTMLElement | null): HTMLElement | null => {
    if (!root) { return null; }
    const scrollElement: HTMLElement | null = root.querySelector('.' + CSS_CLASSES.MAIN_SCROLL_CONTAINER);
    return scrollElement;
};

function isTimelineView(root: HTMLElement | null): boolean {
    if (!root) { return false; }
    return !!root.querySelector(`.${CSS_CLASSES.TIMELINE_VIEW}`);
}

function resetScrollPosition(root: HTMLElement): void {
    const scrollElement: HTMLElement | null = getScrollContainer(root);
    if (!scrollElement) { return; }
    if (isTimelineView(root)) {
        scrollElement.scrollLeft = 0;
    } else {
        scrollElement.scrollTop = 0;
    }
}

export const setScroll: (root: HTMLElement, target: HTMLElement | null, offset?: number) =>
void = (root: HTMLElement, target: HTMLElement | null, offset?: number) => {
    if (!root || !target) { return; }
    const scrollElement: HTMLElement | null = getScrollContainer(root);
    if (!scrollElement) { return; }
    const safeOffset: number = offset ?? 10;
    if (isTimelineView(root)) {
        scrollElement.scrollLeft = Math.max(0, target.offsetLeft - safeOffset);
    } else {
        scrollElement.scrollTop = Math.max(0, target.offsetTop - safeOffset);
    }
};

export const scrollToWorkHour: (scrollTo: SchedulerScrollToProps, schedulerElementRef: RefObject<HTMLDivElement>, selectedDate?: Date) =>
void = (scrollTo: SchedulerScrollToProps, schedulerElementRef: RefObject<HTMLDivElement>, selectedDate?: Date): void => {
    const root: HTMLElement | null = schedulerElementRef.current ?? null;
    if (!root || !scrollTo?.enable) { return; }
    let targetEl: HTMLElement | null = null;

    const getCellForSelectedDate: () => HTMLElement | null = (): HTMLElement | null => {
        if (!selectedDate) { return null; }
        const dateKey: string = `[data-date-key="${DateService.generateDateKey(selectedDate)}"]`;
        return root.querySelector(`.${CSS_CLASSES.WORK_HOURS}${dateKey}, .${CSS_CLASSES.WORK_DAYS}${dateKey},
            .${CSS_CLASSES.WEEKEND}${dateKey}`);
    };

    if (scrollTo.mode === ScrollToMode.WorkHour) {
        targetEl = getCellForSelectedDate() ?? root.querySelector(`.${CSS_CLASSES.WORK_HOURS}`);
    }
    if (!targetEl && selectedDate && DateService.isToday(selectedDate)) {
        targetEl = root.querySelector(`.${CSS_CLASSES.CURRENT_TIMELINE}`);
    }
    if (!targetEl && selectedDate && isTimelineView(root)) {
        targetEl = getCellForSelectedDate();
    }
    else if (!targetEl) {
        targetEl = root.querySelector(`.${CSS_CLASSES.CURRENT_TIMELINE}`)
            || root.querySelector(`.${CSS_CLASSES.WORK_HOURS}`)
            || root.querySelector(`.${CSS_CLASSES.CURRENT_DATE}`);
    }
    if (!targetEl) {
        resetScrollPosition(root);
        return;
    }
    setScroll(root, targetEl, scrollTo.offset);
};

export const scrollToHour: (hour: string, date: Date | undefined, schedulerElementRef: RefObject<HTMLDivElement>) => void = (
    hour: string,
    date: Date | undefined,
    schedulerElementRef: RefObject<HTMLDivElement>
): void => {
    const root: HTMLElement | null = schedulerElementRef.current ?? null;
    if (!hour || !root) { return; }
    let targetDateTime: Date | undefined;
    if (date instanceof Date && !isNaN(date.getTime())) {
        const selectedDate: Date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const selectedHour: string = DateService.normalizeTime(hour);
        targetDateTime = DateService.createDateWithTime(selectedDate, selectedHour);
    } else {
        const firstCell: HTMLElement | null = root.querySelector(`.${CSS_CLASSES.WORK_CELLS}[data-date]`);
        if (firstCell) {
            const dateValue: string | null = firstCell.getAttribute('data-date');
            const cellTs: number = dateValue ? parseInt(dateValue, 10) : NaN;
            if (!Number.isNaN(cellTs)) {
                const workCellDate: Date = new Date(cellTs);
                const baseDate: Date = new Date(workCellDate.getFullYear(), workCellDate.getMonth(), workCellDate.getDate());
                const time: string = DateService.normalizeTime(hour);
                targetDateTime = DateService.createDateWithTime(baseDate, time);
            }
        }
    }
    if (!targetDateTime) { return; }
    const dateValue: number = targetDateTime.getTime();
    const targetElement: HTMLElement | null = root.querySelector(`.${CSS_CLASSES.WORK_CELLS}[data-date="${dateValue}"]`);
    if (!targetElement) {
        resetScrollPosition(root);
        return;
    }
    setScroll(root, targetElement);
};

export function focusElement(root: HTMLElement, selector: string): void {
    if (!root) { return; }
    const element: HTMLElement = root.querySelector<HTMLElement>(selector);
    element?.focus();
}

export function getEventIDType(eventsData?: EventModel[]): string {
    if (eventsData && eventsData.length > 0) {
        return typeof eventsData[0].id;
    }
    return 'string';
}

export function getEventMaxID(eventsData?: EventModel[], resourceId?: number): string | number {
    if (!eventsData || eventsData.length === 0) {
        return EventService.generateEventGuid();
    }
    let eventId: string | number;
    const idType: string = getEventIDType(eventsData);

    if (idType === 'string') {
        eventId = EventService.generateEventGuid();
    } else if (idType === 'number') {
        const numericIds: number[] = eventsData
            .map((event: EventModel) => event.id as number)
            .filter((id: number) => typeof id === 'number');

        if (numericIds.length === 0) {
            eventId = 1;
        } else {
            let maxId: number = Math.max(...numericIds);
            maxId = !isNullOrUndefined(resourceId) ? maxId + resourceId : maxId;
            eventId = maxId + 1;
        }
    } else {
        eventId = EventService.generateEventGuid();
    }
    return eventId;
}

export function findIndexInData(data: Record<string, any>[], field: string, value: string | number): number {
    for (let i: number = 0, length: number = data?.length; i < length; i++) {
        if (data[parseInt(i.toString(), 10)][`${field}`] === value) {
            return i;
        }
    }
    return -1;
}

export function getGroupIndexFromElement(element: HTMLElement | null): number | undefined {
    if (!element) { return undefined; }
    const groupIndexAttr: string | null = element.getAttribute('data-group-index');
    const index: number | undefined = !isNullOrUndefined(groupIndexAttr) ? parseInt(groupIndexAttr, 10) : undefined;
    return Number.isFinite(index) ? index : undefined;
}

export function getCloneTop(element: HTMLElement | null, groupIndex: number | null | undefined, cloneInfo: CloneBase): number {
    if (!cloneInfo.isTimelineView || isNullOrUndefined(groupIndex)) {
        return cloneInfo.sourceTopPx;
    }
    const targetResourceSelector: string = `.${CSS_CLASSES.TIMELINE_EVENT_ROW}[data-group-index="${groupIndex}"]`;
    const destinationRow: HTMLElement | null = element?.querySelector(targetResourceSelector) ?? null;
    return destinationRow ? destinationRow.offsetTop : cloneInfo.sourceTopPx;
}

export const applyClassToElements: (element: HTMLElement | null, selector: string, className: string) => void =
    (element: HTMLElement | null, selector: string, className: string): void => {
        if (!element) { return; }
        const elements: NodeListOf<Element> = element.querySelectorAll(selector);
        addClass(elements, className);
    };

export const removeClassFromElements: (element: HTMLElement | null, selector: string, className: string) => void =
    (element: HTMLElement | null, selector: string, className: string): void => {
        if (!element) { return; }
        const elements: NodeListOf<Element> = element.querySelectorAll(selector);
        removeClass(elements, className);
    };

export function getEventVisibilityBounds(
    startMins: number, endMins: number, schedulerStartMinutes: number, schedulerEndMinutes: number
): EventVisibilityBounds {
    return {
        isOverflowLeft: startMins < schedulerStartMinutes, isOverflowRight: endMins > schedulerEndMinutes,
        visibleStart: Math.max(startMins, schedulerStartMinutes), visibleEnd: Math.min(endMins, schedulerEndMinutes),
        isVisibleOnDate: endMins > schedulerStartMinutes && startMins < schedulerEndMinutes
    };
}

export function getDayBounds(date: Date): { dayStart: Date; dayEnd: Date } {
    const dayStart: Date = DateService.normalizeDate(date);
    const dayEnd: Date = DateService.normalizeDate(date);
    dayEnd.setDate(dayEnd.getDate() + 1);
    return { dayStart, dayEnd };
}

export function getClampedEventMinutesInRange(
    eventStart: Date, eventEnd: Date, rangeStart: Date, rangeEnd: Date
): { startMins: number; endMins: number } {
    return {
        startMins: eventStart.getTime() <= rangeStart.getTime() ? 0 : DateService.getTimeOfDayInMinutes(eventStart),
        endMins: eventEnd.getTime() >= rangeEnd.getTime() ? MINUTES_PER_DAY : DateService.getTimeOfDayInMinutes(eventEnd)
    };
}

export function isBlockEventIndicator(event: EventModel, startDate: Date, endDate: Date): boolean {
    return Boolean(event.isBlock && !event.isAllDay && !DateService.isFullDayEvent(startDate, endDate));
}

export function getEventOverlappingInfo(
    eventStart?: Date | number | null, eventEnd?: Date | number | null, rangeStart?: Date | number | null, rangeEnd?: Date | number | null
): boolean {
    if (isNullOrUndefined(eventStart) || isNullOrUndefined(eventEnd) || isNullOrUndefined(rangeStart) || isNullOrUndefined(rangeEnd)) {
        return false;
    }
    const startMs: number = eventStart instanceof Date ? eventStart.getTime() : eventStart;
    const endMs: number = eventEnd instanceof Date ? eventEnd.getTime() : eventEnd;
    const rangeStartMs: number = rangeStart instanceof Date ? rangeStart.getTime() : rangeStart;
    const rangeEndMs: number = rangeEnd instanceof Date ? rangeEnd.getTime() : rangeEnd;
    if (!startMs || !endMs) { return false; }
    return (startMs >= rangeStartMs && endMs >= rangeStartMs && startMs < rangeEndMs)
        || (startMs <= rangeStartMs && endMs > rangeStartMs);
}

/** @private */
export type TimelineEventMetadata = {
    isMultiDay: boolean; isFirstDay: boolean; isLastDay: boolean; firstIdx?: number; lastIdx?: number; isAllDay?: boolean;
};

/** @private */
export type TimelineEventsByDateMap = {
    multiDayEventMap: Map<string, { event: EventModel; firstIdx: number; lastIdx: number }>;
    singleDayEventsPerDate: Map<number, EventModel[]>; allDayEventsPerDate: Map<number, EventModel[]>;
};

/** @private */
export type TimelineEventBuilders = {
    buildMultiDayEventForRender: (
        event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
    ) => TimelineProcessedEvent | null;
    buildAllDayEventForRender: (
        dateIndex: number, date: Date, event: EventModel, positionIndex: number
    ) => TimelineProcessedEvent | null;
    buildMultiDayAllDayEventForRender: (
        event: EventModel, firstDateIndex: number, lastDateIndex: number, positionIndex: number
    ) => TimelineProcessedEvent | null;
    buildSingleDayEventForRender: (
        dateIndex: number, date: Date, event: EventModel, isFirstDay: boolean, isLastDay: boolean, positionIndex: number
    ) => TimelineProcessedEvent | null;
};

export function collectTimelineEventsForDate(
    dateIndex: number, eventsByDateMap: TimelineEventsByDateMap
): { eventsOnThisDate: EventModel[]; eventMetadata: Map<string, TimelineEventMetadata> } {
    const eventsOnThisDate: EventModel[] = [];
    const eventMetadata: Map<string, TimelineEventMetadata> = new Map();
    const addEvent: (event: EventModel, meta: TimelineEventMetadata) => void = (
        event: EventModel, meta: TimelineEventMetadata
    ): void => {
        eventsOnThisDate.push(event);
        const lookupKey: string = meta.isAllDay
            ? EventService.getEventIdentityKeys(event).eventKey
            : EventService.getEventIdentityKeys(event).eventID;
        eventMetadata.set(lookupKey, meta);
    };
    for (const { event, firstIdx, lastIdx } of eventsByDateMap.multiDayEventMap.values()) {
        if (dateIndex >= firstIdx && dateIndex <= lastIdx) {
            const { isAllDay } = EventService.getEventIdentityKeys(event);
            addEvent(event, {
                isMultiDay: true, isFirstDay: dateIndex === firstIdx, isLastDay: dateIndex === lastIdx,
                firstIdx, lastIdx, isAllDay
            });
        }
    }
    for (const event of eventsByDateMap.singleDayEventsPerDate.get(dateIndex) ?? []) {
        addEvent(event, { isMultiDay: false, isFirstDay: true, isLastDay: true });
    }
    for (const event of eventsByDateMap.allDayEventsPerDate.get(dateIndex) ?? []) {
        addEvent(event, { isMultiDay: false, isFirstDay: true, isLastDay: true, isAllDay: true });
    }
    return { eventsOnThisDate, eventMetadata };
}

export function assignTimelineEventPositions(
    sortedEvents: EventModel[], eventMetadata: Map<string, TimelineEventMetadata>,
    multiDayPositionCache: Map<string, number>, eventsOverlap?: (eventA: EventModel, eventB: EventModel) => boolean
): Map<string, number> {
    const eventPositions: Map<string, number> = new Map();
    for (const event of sortedEvents) {
        const { eventID, eventKey } = EventService.getEventIdentityKeys(event);
        const meta: TimelineEventMetadata | undefined =
            eventMetadata.get(eventKey) ?? eventMetadata.get(eventID);
        if (event.isBlock) {
            eventPositions.set(eventKey, 0);
            if (meta?.isMultiDay) { multiDayPositionCache.set(eventID, 0); }
            continue;
        }
        if (meta?.isMultiDay && multiDayPositionCache.has(eventID)) {
            eventPositions.set(eventKey, multiDayPositionCache.get(eventID)!);
            continue;
        }
        const overlappingPositions: number[] = [];
        for (const otherEvent of sortedEvents) {
            if (event === otherEvent || otherEvent.isBlock) { continue; }
            if (eventsOverlap && !eventsOverlap(event, otherEvent)) { continue; }
            const { eventKey: otherEventKey } = EventService.getEventIdentityKeys(otherEvent);
            const otherPosition: number | undefined = eventPositions.get(otherEventKey);
            if (otherPosition !== undefined) {
                overlappingPositions.push(otherPosition);
            }
        }
        const assignedPosition: number = EventService.getSmallestMissingNumber(overlappingPositions);
        eventPositions.set(eventKey, assignedPosition);
        if (meta?.isMultiDay) {
            multiDayPositionCache.set(eventID, assignedPosition);
        }
    }
    return eventPositions;
}

export function buildPositionedTimelineEvent(
    event: EventModel, meta: TimelineEventMetadata, positionIndex: number, dateIndex: number, date: Date,
    eventBuilders: TimelineEventBuilders, multiDayPositionedCache?: Map<string, TimelineProcessedEvent>
): TimelineProcessedEvent | null {
    const { eventID, isAllDay, eventKey } = EventService.getEventIdentityKeys(event);
    if (isAllDay) {
        if (meta.isMultiDay) {
            if (multiDayPositionedCache?.has(eventKey)) {
                return multiDayPositionedCache.get(eventKey)!;
            }
            const positioned: TimelineProcessedEvent | null = eventBuilders.buildMultiDayAllDayEventForRender(
                event, meta.firstIdx!, meta.lastIdx!, positionIndex
            );
            if (positioned && multiDayPositionedCache) {
                multiDayPositionedCache.set(eventKey, positioned);
            }
            return positioned;
        }
        return eventBuilders.buildAllDayEventForRender(dateIndex, date, event, positionIndex);
    }
    if (meta.isMultiDay) {
        if (multiDayPositionedCache?.has(eventID)) {
            return multiDayPositionedCache.get(eventID)!;
        }
        const positioned: TimelineProcessedEvent | null = eventBuilders.buildMultiDayEventForRender(
            event, meta.firstIdx!, meta.lastIdx!, positionIndex
        );
        if (positioned && multiDayPositionedCache) {
            multiDayPositionedCache.set(eventID, positioned);
        }
        return positioned;
    }
    return eventBuilders.buildSingleDayEventForRender(
        dateIndex, date, event, meta.isFirstDay, meta.isLastDay, positionIndex
    );
}

export function calculateTimelineEventRowHeight(
    visibleStackCount: number, eventHeight: number, hasMoreIndicator: boolean, ignoreWhitespace: boolean = false
): number {
    if (visibleStackCount === 0) {
        return SLOT_ROW_HEIGHT;
    }
    const heightCalc: number = (EVENT_GAP * 2) + ((visibleStackCount + (ignoreWhitespace ? 0 : 1)) * eventHeight) +
        (Math.max(0, visibleStackCount - 1) * EVENT_GAP) + (hasMoreIndicator ? EVENT_GAP : 0);
    return Math.max(SLOT_ROW_HEIGHT, heightCalc);
}
