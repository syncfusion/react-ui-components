import { EventModel, EventSettings } from '../types/schedule-types';
import { CSS_CLASSES } from '../common/constants';
import { ISchedule } from '../schedule';

export type scrollProp = (scrollInfo: { clientX: number; clientY: number; cell: HTMLElement | null }) => void;
export type snapProp = (cell: HTMLElement) => { left?: string | number; top?: string | number };
export type scrollUpdateProp = (cell: HTMLElement | null, clientX: number, clientY: number) => void;

export class CloneBase {
    public static currentActionName: string = '';
    public isActionPerformed: boolean = false;
    public removeDocListenersRef: () => void = undefined;
    public cellWidth: number = 0;
    public scrollInterval: number = null;
    public slotInterval: number = null;
    public isMonthView: boolean = false;
    public isAllDaySource: boolean = false;
    public direction: string = null;
    public cloneRef: HTMLElement = null;
    public eventsData: EventModel[] = null;
    public eventSettings: EventSettings = null;
    public minScrollSpeed: number = 10;
    public minScrollThreshold: number = 100;
    public enableScroll: boolean = true;

    public performAutoScrolling(e: MouseEvent | TouchEvent, elementEl: HTMLElement): void {
        const { clientX, clientY } = this.getPointerCoordinates(e);
        if (clientX == null || clientY == null) { return; }

        const nearestContentWrap: HTMLElement = elementEl?.closest(
            `.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_CONTAINER}`);
        const mainContainer: HTMLElement = elementEl?.closest(`.${CSS_CLASSES.SCHEDULE}`)?.querySelector(
            `.${CSS_CLASSES.MAIN_SCROLL_CONTAINER}`);
        const candidates: HTMLElement[] = [nearestContentWrap, mainContainer].filter(Boolean) as HTMLElement[];
        if (candidates.length === 0) { return; }

        const verticalArea: HTMLElement | null = candidates.find((el: HTMLElement) => el.scrollHeight > el.clientHeight) || null;
        const horizontalArea: HTMLElement | null = candidates.find((el: HTMLElement) => el.scrollWidth > el.clientWidth) || null;
        if (!verticalArea && !horizontalArea) { return; }

        const scheduleRoot: HTMLElement | null = (verticalArea || horizontalArea)?.closest(`.${CSS_CLASSES.SCHEDULE}`) ||
            elementEl?.closest(`.${CSS_CLASSES.SCHEDULE}`) as HTMLElement | null;
        const headerEl: HTMLElement | null = scheduleRoot?.querySelector(
            `.${CSS_CLASSES.STICKY_HEADER}, .${CSS_CLASSES.HEADER_SECTION}, .${CSS_CLASSES.HEADER_ROW}`
        ) as HTMLElement | null;
        const vRect: DOMRect | null = verticalArea ? verticalArea.getBoundingClientRect() : null;
        const hRect: DOMRect | null = horizontalArea ? horizontalArea.getBoundingClientRect() : null;
        const topThresholdY: number = headerEl?.getBoundingClientRect().bottom ?? (vRect ? vRect.top : (hRect ? hRect.top : 0));

        if (this.scrollInterval != null) {
            cancelAnimationFrame(this.scrollInterval);
            this.scrollInterval = null;
        }

        const getScrollSpeed: (distance: number) => number = (distance: number): number => {
            if (distance > this.minScrollThreshold || distance < 0) { return 0; }
            const result: number = Math.floor((1 - distance / this.minScrollThreshold) * this.minScrollSpeed);
            return isFinite(result) ? result : 0;
        };

        const getVerticalSpeed: () => number = (): number => {
            let verticalSpeed: number = 0;
            if (verticalArea && vRect) {
                const maxScrollTop: number = Math.max(0, verticalArea.scrollHeight - verticalArea.clientHeight);
                const distanceTop: number = Math.max(0, clientY - topThresholdY);
                const distanceBottom: number = Math.max(0, vRect.bottom - clientY);
                const isAtTop: boolean = verticalArea.scrollTop <= 0;
                const isAtBottom: boolean = verticalArea.scrollTop >= maxScrollTop;
                if (distanceTop < this.minScrollThreshold && !isAtTop) {
                    verticalSpeed = -getScrollSpeed(distanceTop);
                } else if (distanceBottom < this.minScrollThreshold && !isAtBottom) {
                    verticalSpeed = getScrollSpeed(distanceBottom);
                }
            }
            return verticalSpeed;
        };

        const getHorizontalSpeed: () => number = (): number => {
            let horizontalSpeed: number = 0;
            if (horizontalArea && hRect) {
                const maxScrollLeft: number = Math.max(0, horizontalArea.scrollWidth - horizontalArea.clientWidth);
                const distanceLeft: number = Math.max(0, clientX - hRect.left);
                const distanceRight: number = Math.max(0, hRect.right - clientX);
                const isAtLeft: boolean = horizontalArea.scrollLeft <= 0;
                const isAtRight: boolean = horizontalArea.scrollLeft >= maxScrollLeft;
                if (distanceLeft < this.minScrollThreshold && !isAtLeft) {
                    horizontalSpeed = -getScrollSpeed(distanceLeft);
                } else if (distanceRight < this.minScrollThreshold && !isAtRight) {
                    horizontalSpeed = getScrollSpeed(distanceRight);
                }
            }
            return horizontalSpeed;
        };

        const verticalSpeed: number = getVerticalSpeed();
        const horizontalSpeed: number = getHorizontalSpeed();

        if (verticalSpeed !== 0 || horizontalSpeed !== 0) {
            const tick: () => void = (): void => {
                let canScroll: boolean = false;
                if (verticalArea && verticalSpeed !== 0) {
                    const maxScrollTop: number = Math.max(0, verticalArea.scrollHeight - verticalArea.clientHeight);
                    const nextTop: number = Math.max(0, Math.min(maxScrollTop, verticalArea.scrollTop + verticalSpeed));
                    if (nextTop !== verticalArea.scrollTop) {
                        verticalArea.scrollTop = nextTop;
                        canScroll = true;
                    }
                }
                if (horizontalArea && horizontalSpeed !== 0) {
                    const maxScrollLeft: number = Math.max(0, horizontalArea.scrollWidth - horizontalArea.clientWidth);
                    const nextLeft: number = Math.max(0, Math.min(maxScrollLeft, horizontalArea.scrollLeft + horizontalSpeed));
                    if (nextLeft !== horizontalArea.scrollLeft) {
                        horizontalArea.scrollLeft = nextLeft;
                        canScroll = true;
                    }
                }
                if (!canScroll) {
                    if (this.scrollInterval != null) {
                        cancelAnimationFrame(this.scrollInterval);
                        this.scrollInterval = null;
                    }
                    return;
                }
                this.scrollInterval = requestAnimationFrame(tick);
            };
            this.scrollInterval = requestAnimationFrame(tick);
        }
    }

    public getPointerCoordinates(nativeEvent: MouseEvent | TouchEvent | undefined): { clientX: number | null; clientY: number | null } {
        if (!nativeEvent) { return { clientX: null, clientY: null }; }
        let clientX: number | null = null;
        let clientY: number | null = null;
        if ((nativeEvent as TouchEvent).touches && (nativeEvent as TouchEvent).touches.length > 0) {
            clientX = (nativeEvent as TouchEvent).touches[0].clientX;
            clientY = (nativeEvent as TouchEvent).touches[0].clientY;
        } else if ((nativeEvent as TouchEvent).changedTouches && (nativeEvent as TouchEvent).changedTouches.length > 0) {
            clientX = (nativeEvent as TouchEvent).changedTouches[0].clientX;
            clientY = (nativeEvent as TouchEvent).changedTouches[0].clientY;
        } else if ((nativeEvent as MouseEvent).clientX != null && (nativeEvent as MouseEvent).clientY != null) {
            clientX = (nativeEvent as MouseEvent).clientX;
            clientY = (nativeEvent as MouseEvent).clientY;
        }
        return { clientX, clientY };
    }

    public getContentWrap(from: HTMLElement | null): HTMLElement | null {
        if (!from) { return null; }
        return from.closest(`.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_CONTAINER}, .${CSS_CLASSES.DATE_HEADER_CONTAINER}`) as HTMLElement | null;
    }

    public getCurrentTargetDate(target: HTMLElement | null, cell: HTMLElement | null): number | null {
        if (!target && !cell) { return null; }
        let timeStamp: number = null;
        const root: HTMLElement | null = (target || cell)?.closest(`.${CSS_CLASSES.SCHEDULE}`) as HTMLElement | null;
        const allDayRow: HTMLElement | null = cell?.closest(`.${CSS_CLASSES.ALL_DAY_ROW}`) as HTMLElement | null;
        if (root && allDayRow && cell) {
            const cells: HTMLElement[] = Array.from(allDayRow.querySelectorAll(`.${CSS_CLASSES.ALL_DAY_CELL}`)) as HTMLElement[];
            const currentIndex: number = cells.indexOf(cell as HTMLElement);
            const firstRow: HTMLElement | null = root.querySelector(`.${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_ROW}`) as HTMLElement | null;
            const workCells: HTMLElement[] = firstRow ? (Array.from(firstRow.querySelectorAll(`.${CSS_CLASSES.WORK_CELLS}`)) as HTMLElement[]) : [];
            const currentDate: string | null | undefined = workCells[currentIndex as number]?.getAttribute('data-date');
            if (currentDate) { timeStamp = Number(currentDate); }
        }
        return timeStamp;
    }

    private getCell(clientX: number, clientY: number, isPointer: boolean): HTMLElement | null {
        const elements: Element[] = document?.elementsFromPoint(clientX, clientY);
        for (const element of elements) {
            const cell: HTMLElement = element.classList.contains(`${CSS_CLASSES.WORK_CELLS}`) ||
                element.classList.contains(`${CSS_CLASSES.ALL_DAY_CELL}`) ? element as HTMLElement : null;
            if (cell && (isPointer || !this?.isAllDaySource || element.classList.contains(CSS_CLASSES.ALL_DAY_CELL))) {
                return cell;
            }
        }
        return null;
    }

    public getCellUnderPointer(nativeEvent: MouseEvent | TouchEvent): HTMLElement | null {
        const { clientX, clientY } = this.getPointerCoordinates(nativeEvent);
        if (clientX == null || clientY == null) { return null; }
        return this.getCell(clientX, clientY, true);
    }

    public getCellUnderClone(elementRef: HTMLElement | null): HTMLElement | null {
        if (!this.cloneRef || !elementRef) { return null; }
        const container: HTMLElement | null = this.getContentWrap(elementRef);
        const containerRect: DOMRect | undefined = container?.getBoundingClientRect();
        if (!container || !containerRect) { return null; }
        const sanitizeFloat: (value: number, fallback?: number) => number =
            (value: number, fallback: number = 0): number => isFinite(value) ? value : fallback;
        const scrollLeft: number = (container as HTMLElement).scrollLeft || 0;
        let centerClientX: number = 0;
        let centerClientY: number = 0;
        const allDayRow: HTMLElement | null = container.querySelector(`.${CSS_CLASSES.ALL_DAY_ROW}`) as HTMLElement | null;
        if (!allDayRow) { return null; }
        const cells: HTMLElement[] = Array.from(allDayRow.querySelectorAll(`.${CSS_CLASSES.ALL_DAY_CELL}`)) as HTMLElement[];
        if (cells.length === 0) { return null; }
        const firstCell: HTMLElement = cells[0];
        const cellDimension: number = Math.max(1, firstCell.offsetWidth || this.cellWidth || 1);
        const offset: number = sanitizeFloat(parseFloat(this.direction === 'rtl' ? this.cloneRef.style.right : this.cloneRef.style.left || '0'), 0);
        const widthFactor: number = Math.max(1, Math.ceil(this.cloneRef.offsetWidth / cellDimension));
        centerClientX = this.direction === 'rtl'
            ? containerRect.right - offset - (this.cloneRef.offsetWidth / widthFactor) + scrollLeft
            : containerRect.left + offset + (this.cloneRef.offsetWidth / widthFactor) - scrollLeft;
        const cellHeight: number = Math.max(0, firstCell.offsetHeight);
        centerClientY = containerRect.top + allDayRow.offsetTop + (cellHeight / 2);
        return this.getCell(centerClientX, centerClientY, false);
    }

    public cloneFromSource(source: HTMLElement): HTMLElement {
        const clone: HTMLElement = source.cloneNode(true) as HTMLElement;
        clone.classList.add(
            CSS_CLASSES.DRAG_CLONE,
            CSS_CLASSES.NO_POINTER,
            CSS_CLASSES.POSITION_ABSOLUTE
        );
        return clone;
    }

    public suppressEvent(e: Event): void {
        if (this.isActionPerformed || CloneBase.currentActionName === 'resize') {
            CloneBase.currentActionName = '';
            e?.preventDefault?.();
            e?.stopPropagation?.();
        }
    }

    public addDocSuppressors(): void {
        const events: string[] = ['click'];
        const handler: (e: Event) => void = (e: Event) => this.suppressEvent(e);
        events.forEach((eventType: string) =>
            document?.addEventListener(eventType, handler, true)
        );
        this.removeDocListenersRef = () => {
            if (this.removeDocListenersRef) {
                events.forEach((eventType: string) =>
                    document?.removeEventListener(eventType, handler, true)
                );
                this.removeDocListenersRef = undefined;
            }
        };
    }

    public updateDatasource(
        original: EventModel, newStartTime: Date, newEndTime: Date, scheduleRef: React.RefObject<ISchedule>
    ): EventModel {
        const updatedEvent: EventModel = {};
        if (Array.isArray(this.eventsData) || original || this.eventSettings) {
            const fields: {
                [key: string]: string; id?: string; subject?: string; startTime?: string;
                endTime?: string; isAllDay?: string;
            } = this.eventSettings.fields;
            updatedEvent[fields.id] = (original as any).id;
            updatedEvent[fields.subject] = (original as any).subject;
            updatedEvent[fields.startTime] = newStartTime as any;
            updatedEvent[fields.endTime] = newEndTime as any;
            updatedEvent[fields.isAllDay] = (original as any).isAllDay;
            if (scheduleRef?.current?.saveEvent) {
                scheduleRef.current.saveEvent(updatedEvent);
            }
        }
        return updatedEvent;
    }
}
