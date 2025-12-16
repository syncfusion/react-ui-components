import { CSS_CLASSES } from '../common/constants';
import { EventService } from '../services/EventService';
import { SchedulerEventClickEvent, EventModel } from '../types/scheduler-types';

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
