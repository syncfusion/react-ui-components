import { KeyboardEvent } from 'react';
import { ActiveViewProps, ViewsInfo } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { closest } from '@syncfusion/react-base';
import { getSelectedEvents, clearAndSelectAppointment, clearAndSelect, getCellFromIndex, focusElement } from '../utils/actions';
import { EventModel } from '../types/scheduler-types';
import { CrudAction, Direction, AlertAction } from '../types/enums';

/**
 * Hook to add keyboard interactions for the Scheduler component.
 * with the React scheduler refs (schedulerRef, quickPopupRef, morePopupRef).
 *
 * @param {ActiveViewProps} context - Active view context and helper refs used by the scheduler
 * @param {EventModel[]} eventsData - Array of events from the scheduler
 * @returns {void}
 * @private
 */
export const useKeyboard: (context: ActiveViewProps, eventsData: EventModel[], eventsprocessed?: EventModel[]) =>
(event: KeyboardEvent<HTMLDivElement>) => void = (
    context: ActiveViewProps,
    eventsData: EventModel[]
): ((event: KeyboardEvent<HTMLDivElement>) => void) => {
    const { schedulerRef, keyboardNavigation, handleTodayClick, eventSettings, readOnly, showDeleteAlert, showQuickInfoPopup,
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
        const scheduleRootElement: HTMLElement = schedulerRef.current?.element;
        const targetCell: HTMLElement = scheduleRootElement?.querySelector(`.${CSS_CLASSES.CONTENT_TABLE} .${CSS_CLASSES.WORK_CELLS}`) as HTMLElement | null;
        if (targetCell) {
            focusCell(targetCell, event);
            targetCell.classList.add(CSS_CLASSES.SELECTED_CELL);
        }
    };

    const processToday: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>) => {
        if (handleTodayClick) {
            handleTodayClick();
            event.preventDefault();
        }
    };

    const processPreviousView: (event: KeyboardEvent<HTMLDivElement>) => void =
        (event: KeyboardEvent<HTMLDivElement>): void => {
            if (handlePreviousClick) {
                handlePreviousClick();
                event.preventDefault();
                event.stopPropagation();
            }
        };

    const processNextView: (event: KeyboardEvent<HTMLDivElement>) => void =
        (event: KeyboardEvent<HTMLDivElement>): void => {
            if (handleNextClick) {
                handleNextClick();
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
        const scheduleRootElement: HTMLElement = schedulerRef.current?.element;
        if ((!(activeEle) || !(activeEle as HTMLElement).classList?.contains(CSS_CLASSES.APPOINTMENT) || closest(activeEle, '.' + CSS_CLASSES.POPUP_WRAPPER))) {
            activeEle = getSelectedEvents(eventsData || [], scheduleRootElement).element as HTMLElement;
        }
        if (activeEle && activeEle.classList.contains(CSS_CLASSES.APPOINTMENT)) {
            clearAndSelectAppointment(activeEle as HTMLElement);
            if (readOnly || (eventSettings && !eventSettings.allowDeleting)) {
                return;
            }
            if (showQuickInfoPopup && context.quickPopupRef?.current?.element) {
                context.quickPopupRef?.current.handleDelete();
            } else if (showDeleteAlert) {
                const selectedEvent: EventModel = getSelectedEvents(eventsData || [], scheduleRootElement).data;
                const items: EventModel[] = Array.isArray(selectedEvent) ? selectedEvent : [selectedEvent];
                const firstItem: EventModel = items[0];
                if (firstItem.isReadonly) {
                    return;
                }
                if (firstItem && firstItem.recurrenceID && context.showRecurrenceAlert) {
                    const handleRecurrenceDelete: (selectOption: string) => void = (selectOption: string): void => {
                        if (firstItem) {
                            schedulerRef?.current?.deleteEvent?.(firstItem, selectOption as CrudAction);
                        }
                    };
                    context.showRecurrenceAlert?.(AlertAction.RecurrenceDelete, handleRecurrenceDelete);
                } else {
                    const performDelete: () => void = (): void => {
                        items.forEach((item: EventModel) => {
                            schedulerRef?.current?.deleteEvent?.(item);
                        });
                    };
                    showDeleteAlert(performDelete);
                }
            }
            event.preventDefault();
        }
    };

    const getNextCellPosition: (direction: Direction, rowIndex: number, colIndex: number, rows: NodeListOf<HTMLElement>,
        fetchCells: (r: number) => NodeListOf<HTMLElement>, cellsInCurrentRow: NodeListOf<HTMLElement>) => {
        nextRow: number;
        nextCol: number;
    } | null = (
        direction: Direction,
        rowIndex: number,
        colIndex: number,
        rows: NodeListOf<HTMLElement>,
        fetchCells: (r: number) => NodeListOf<HTMLElement>,
        cellsInCurrentRow: NodeListOf<HTMLElement>
    ): { nextRow: number; nextCol: number } | null => {
        let nextRow: number = rowIndex;
        let nextCol: number = colIndex;

        switch (direction) {
        case Direction.Left: {
            if (colIndex > 0) {
                nextCol = colIndex - 1;
            } else if (rowIndex > 0) {
                nextRow = rowIndex - 1;
                const prevRowCells: NodeListOf<HTMLElement> = fetchCells(nextRow);
                nextCol = Math.max(0, (prevRowCells?.length ?? 1) - 1);
            }
            break;
        }
        case Direction.Right: {
            if (colIndex < (cellsInCurrentRow?.length ?? 0) - 1) {
                nextCol = colIndex + 1;
            } else if (rowIndex < rows.length - 1) {
                nextRow = rowIndex + 1;
                nextCol = 0;
            }
            break;
        }
        case Direction.Up: {
            if (rowIndex === 0) { return null; }
            nextRow = rowIndex - 1;
            const upperCells: NodeListOf<HTMLElement> = fetchCells(nextRow);
            nextCol = Math.min(colIndex, Math.max(0, (upperCells?.length ?? 1) - 1));
            break;
        }
        case Direction.Down: {
            if (rowIndex >= rows.length - 1) { return null; }
            nextRow = rowIndex + 1;
            const lowerCells: NodeListOf<HTMLElement> = fetchCells(nextRow);
            nextCol = Math.min(colIndex, Math.max(0, (lowerCells?.length ?? 1) - 1));
            break;
        }
        }

        return { nextRow: nextRow, nextCol: nextCol };
    };

    const processCellNavigation: (dir: Direction, event: KeyboardEvent<HTMLDivElement>) => void =
        (dir: Direction, event: KeyboardEvent<HTMLDivElement>): void => {
            const root: HTMLElement | null | undefined = schedulerRef.current?.element;
            const activeRowCell: HTMLElement | null = (event.target as HTMLElement).closest?.('.' + CSS_CLASSES.WORK_CELLS_ROW);
            const rowCells: NodeListOf<HTMLElement> = root.querySelectorAll(`.${CSS_CLASSES.WORK_CELLS_ROW}`);
            const rowIndex: number = Array.prototype.indexOf.call(rowCells, activeRowCell);

            const getCells: (r: number) => NodeListOf<HTMLElement> = (r: number): NodeListOf<HTMLElement> => rowCells.item(r)?.querySelectorAll(`.${CSS_CLASSES.WORK_CELLS}`);
            const cellsInRow: NodeListOf<HTMLElement> = getCells(rowIndex);
            const colIndex: number = Array.prototype.indexOf.call(cellsInRow, (event.target as HTMLElement));

            let nextRow: number = rowIndex;
            let nextCol: number = colIndex;

            const nextCellPosition: {
                nextRow: number;
                nextCol: number;
            } = getNextCellPosition(dir, rowIndex, colIndex, rowCells, getCells, cellsInRow);
            if (!nextCellPosition) { return; }
            nextRow = nextCellPosition.nextRow;
            nextCol = nextCellPosition.nextCol;

            const targetCell: HTMLElement | null = getCellFromIndex(root, nextRow, nextCol);
            if (targetCell) {
                clearAndSelect(targetCell);
                event.preventDefault();
                event.stopPropagation();
            }
        };

    const handleKey: (event: KeyboardEvent<HTMLDivElement>) => void = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (!keyboardNavigation) { return; }

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
        case 'ArrowUp': {
            if (!event.ctrlKey && !event.metaKey && (targetElement?.closest?.('.' + CSS_CLASSES.WORK_CELLS))) {
                processCellNavigation(Direction.Up, event);
            }
            break;
        }
        case 'ArrowDown': {
            if (!event.ctrlKey && !event.metaKey) {
                if (targetElement?.closest?.('.' + CSS_CLASSES.WORK_CELLS)) {
                    processCellNavigation(Direction.Down, event);
                }
            }
            break;
        }
        case 'Delete': {
            processDelete(event);
            break;
        }
        case 'ArrowLeft': {
            if (event.ctrlKey || event.metaKey) {
                processPreviousView(event);
                focusElement(schedulerRef?.current?.element, '.sf-previous-icon');
            } else {
                if (targetElement?.closest?.('.' + CSS_CLASSES.WORK_CELLS)) {
                    processCellNavigation(Direction.Left, event);
                }
            }
            break;
        }
        case 'ArrowRight': {
            if (event.ctrlKey || event.metaKey) {
                processNextView(event);
                focusElement(schedulerRef?.current?.element, '.sf-next-icon');
            } else {
                if (targetElement?.closest?.('.' + CSS_CLASSES.WORK_CELLS)) {
                    processCellNavigation(Direction.Right, event);
                }
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
