import { RefObject } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { SchedulerEventClickEvent, EventModel, TimeScaleProps, SchedulerScrollToProps } from '../types/scheduler-types';
import { ScrollToMode } from '../types/enums';
import { isNullOrUndefined } from '@syncfusion/react-base';

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

export const setScroll: (root: HTMLElement, target: HTMLElement | null, offset?: number) =>
void = (root: HTMLElement, target: HTMLElement | null, offset?: number) => {
    if (!root || !target) { return; }
    const scrollElement: HTMLElement | null = getScrollContainer(root);
    if (!scrollElement) { return; }
    scrollElement.scrollTop = Math.max(0, target.offsetTop - (offset ?? 10));
};

export const scrollToWorkHour: (scrollTo: SchedulerScrollToProps, schedulerElementRef: RefObject<HTMLDivElement>) =>
void = (scrollTo: SchedulerScrollToProps, schedulerElementRef: RefObject<HTMLDivElement>): void => {
    const root: HTMLElement | null = schedulerElementRef.current ?? null;
    if (!root || !scrollTo?.enable) { return; }
    let targetEl: HTMLElement | null = null;
    if (scrollTo.mode === ScrollToMode.WorkHour) {
        targetEl = root.querySelector(`.${CSS_CLASSES.WORK_HOURS}`);
    } else {
        targetEl = root.querySelector(`.${CSS_CLASSES.CURRENT_TIMELINE}`) || root.querySelector(`.${CSS_CLASSES.WORK_HOURS}`);
    }
    if (!targetEl) {
        const scrollElement: HTMLElement | null = getScrollContainer(root);
        if (scrollElement) { scrollElement.scrollTop = 0; }
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
        const scrollElement: HTMLElement | null = getScrollContainer(root);
        if (scrollElement) { scrollElement.scrollTop = 0; }
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
