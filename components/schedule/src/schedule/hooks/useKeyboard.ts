import { KeyboardEvent } from 'react';
import { ActiveViewProps, ViewsInfo } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { closest } from '@syncfusion/react-base';
import { getSelectedEvents, clearAndSelectAppointment } from '../utils/actions';
import { EventModel } from '../types/schedule-types';

/**
 * Hook to add keyboard interactions for the Schedule component.
 * with the React schedule refs (scheduleRef, quickPopupRef, morePopupRef).
 *
 * @param {ActiveViewProps} context - Active view context and helper refs used by the schedule
 * @param {EventModel[]} eventsData - Array of events from the schedule
 * @returns {void}
 */
export const useKeyboard: (context: ActiveViewProps, eventsData: EventModel[]) => (event: KeyboardEvent<HTMLDivElement>) => void = (
    context: ActiveViewProps,
    eventsData: EventModel[]
): ((event: KeyboardEvent<HTMLDivElement>) => void) => {
    const { scheduleRef, allowKeyboardInteraction, handleTodayClick, eventSettings, readOnly, showDeleteAlert, showQuickInfoPopup,
        getAvailableViews, handleCurrentViewChange, handlePreviousClick, handleNextClick } = context;

    const focusCell: (targetCell: HTMLElement, event: KeyboardEvent<HTMLDivElement>) => void =
        (targetCell: HTMLElement, event: KeyboardEvent<HTMLDivElement>): void => {
            if (targetCell.getAttribute('tabindex') !== '0') {
                targetCell.setAttribute('tabindex', '0');
            }
            targetCell.focus();
            event.preventDefault();
        };

    const processHome: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>) => {
        const scheduleRootElement: HTMLElement = scheduleRef.current?.element;
        const targetCell: HTMLElement = scheduleRootElement?.querySelector(`.${CSS_CLASSES.CONTENT_TABLE} .${CSS_CLASSES.WORK_CELLS}`) as HTMLElement | null;
        if (targetCell) {
            focusCell(targetCell, event);
            targetCell.classList.add(CSS_CLASSES.SELECTED_CELL);
        }
    };

    const processToday: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>) => {
        if (handleTodayClick) {
            handleTodayClick(event as unknown as Event);
            event.preventDefault();
        }
    };

    const processPreviousView: (event: KeyboardEvent<HTMLDivElement>) => void =
        (event: KeyboardEvent<HTMLDivElement>): void => {
            if (handlePreviousClick) {
                handlePreviousClick(event as unknown as Event);
                event.preventDefault();
                event.stopPropagation();
            }
        };

    const processNextView: (event: KeyboardEvent<HTMLDivElement>) => void =
        (event: KeyboardEvent<HTMLDivElement>): void => {
            if (handleNextClick) {
                handleNextClick(event as unknown as Event);
                event.preventDefault();
                event.stopPropagation();
            }
        };

    const processViewNavigation: (event: KeyboardEvent<HTMLDivElement>) => void =
        (event: KeyboardEvent<HTMLDivElement>): void => {
            const digit: string = event.code.replace('Digit', '');
            const index: number = parseInt(digit, 10) - 1;
            if (isNaN(index) || index < 0) {
                return;
            }
            const availableViews: ViewsInfo[] = getAvailableViews?.();
            if (!availableViews || availableViews.length === 0) {
                return;
            }
            if (index < availableViews.length) {
                const targetView: ViewsInfo = availableViews[parseInt(index.toString(), 10)];
                if (handleCurrentViewChange) {
                    handleCurrentViewChange(targetView.name);
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };

    const processDelete: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>): void => {
        let activeEle: Element = document?.activeElement;
        const scheduleRootElement: HTMLElement = scheduleRef.current?.element;
        if ((!(activeEle) || !(activeEle as HTMLElement).classList?.contains(CSS_CLASSES.APPOINTMENT) || closest(activeEle, '.' + CSS_CLASSES.POPUP_WRAPPER))) {
            const selectedEle: HTMLElement[] = getSelectedEvents(eventsData || [], scheduleRootElement).element as HTMLElement[];
            activeEle = <Element>((selectedEle && (selectedEle.length)) ? selectedEle[0] : selectedEle);
        }
        if (activeEle && activeEle.classList.contains(CSS_CLASSES.APPOINTMENT)) {
            clearAndSelectAppointment(activeEle as HTMLElement);
            if (readOnly || (eventSettings && !eventSettings.allowDeleting)) {
                return;
            }
            if (showQuickInfoPopup && context.quickPopupRef?.current?.element) {
                context.quickPopupRef?.current.handleDelete();
            } else if (showDeleteAlert) {
                const selectedEvent: Record<string, any> = getSelectedEvents(eventsData || [], scheduleRootElement).data;
                const items: Record<string, any>[] = Array.isArray(selectedEvent) ? selectedEvent : [selectedEvent];
                const performDelete: () => void = (): void => {
                    items.forEach((item: Record<string, any>) => {
                        scheduleRef?.current?.deleteEvent?.(item);
                    });
                };
                showDeleteAlert(performDelete);
            }
            event.preventDefault();
        }
    };

    const handleKey: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (!allowKeyboardInteraction) { return; }

        const targetElement: HTMLElement = event.target as HTMLElement;

        if (targetElement && ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(targetElement.tagName) > -1 && targetElement.closest(`.${CSS_CLASSES.POPUP_WRAPPER}`)) {
            return;
        }

        if (event.shiftKey && event.altKey && event.code === 'KeyY') {
            processToday(event);
            return;
        }

        if (event.altKey && event.code >= 'Digit1' && event.code <= 'Digit6') {
            processViewNavigation(event);
            return;
        }

        switch (event.key) {
        case 'Home': {
            processHome(event);
            break;
        }
        case 'Delete': {
            processDelete(event);
            break;
        }
        case 'ArrowLeft': {
            if (event.ctrlKey || event.metaKey) {
                processPreviousView(event);
            }
            break;
        }
        case 'ArrowRight': {
            if (event.ctrlKey || event.metaKey) {
                processNextView(event);
            }
            break;
        }
        default:
            break;
        }
    };

    return handleKey;
};

export default useKeyboard;
