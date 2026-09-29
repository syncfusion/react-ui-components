import { EventDragProps } from '../types/scheduler-types';
import { CSS_CLASSES } from '../common/constants';
import { getZindexPartial } from '@syncfusion/react-popups';
import { Point } from '../types/internal-interface';
import { MS_PER_MINUTE, DateService, MS_PER_DAY, MINUTES_PER_HOUR, MINUTES_PER_DAY } from '../services/DateService';
import { parseHourStringToMinutes } from './actions';

export class CloneBase {
    public static currentActionName: string = '';
    public isActionPerformed: boolean = false;
    public removeDocListenersRef: () => void = undefined;
    public cellWidth: number = 0;
    public scrollInterval: number = null;
    public slotInterval: number = null;
    public isMonthView: boolean = false;
    public isAllDaySource: boolean = false;
    public isTimelineView: boolean = false;
    public direction: string = null;
    public cloneRef: HTMLElement = null;
    public minScrollSpeed: number = 10;
    public minScrollThreshold: number = 100;
    public enableScroll: boolean = true;
    public currentCell: HTMLElement = null;
    public startHour: string = '0:00';
    public endHour: string = '24:00';
    public isSpannedCell: boolean = false;
    public dayWidth: number = 0;
    public sourceTopPx: number = 0;

    public getDateFromPointer(nativeEvent: MouseEvent | TouchEvent, currentCell?: HTMLElement | null): Date | null {
        const cell: HTMLElement | null = currentCell ?? this.currentCell;
        if (!cell) { return null; }
        const span: number = CloneBase.getColSpan(cell);
        const startDateAttr: string | null = cell.getAttribute('data-date');
        if (!startDateAttr) { return null; }
        if (span > 1) {
            const startDate: Date = DateService.normalizeDate(new Date(Number(startDateAttr)));
            const cellRect: DOMRect = cell.getBoundingClientRect();
            if (cellRect.width <= 0) { return null; }
            const dayWidth: number = cellRect.width / span;
            const { clientX } = this.getPointerCoordinates(nativeEvent);
            if (clientX == null) { return null; }
            const pxIntoCell: number = Math.max(0, Math.min(
                this.direction === 'rtl' ? cellRect.right - clientX : clientX - cellRect.left,
                cellRect.width
            ));
            const dayOffset: number = Math.min(span - 1, Math.floor(pxIntoCell / dayWidth));
            return DateService.addDays(startDate, dayOffset);
        } else {
            return new Date(Number(startDateAttr));
        }
    }

    public static getColSpan(cell: HTMLElement | null): number {
        if (!cell) { return 1; }
        const raw: string = (cell.style.getPropertyValue('--sf-scheduler-col-span') || '').trim();
        const parsed: number = parseInt(raw, 10);
        return Math.max(1, parsed || 1);
    }

    public performAutoScrolling(e: MouseEvent | TouchEvent, elementEl: HTMLElement): void {
        const { clientX, clientY } = this.getPointerCoordinates(e);
        if (clientX == null || clientY == null || !elementEl) { return; }

        const nearestContentWrap: HTMLElement = elementEl?.closest(
            `.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_CONTAINER}`);
        const mainContainer: HTMLElement = elementEl?.closest(`.${CSS_CLASSES.SCHEDULER}`)?.querySelector(
            `.${CSS_CLASSES.MAIN_SCROLL_CONTAINER}`);
        const directScrollEl: HTMLElement | null =
            !nearestContentWrap && elementEl &&
            (elementEl.classList.contains(CSS_CLASSES.MAIN_SCROLL_CONTAINER) ||
             elementEl.scrollWidth > elementEl.clientWidth ||
             elementEl.scrollHeight > elementEl.clientHeight)
                ? elementEl : null;
        const candidates: HTMLElement[] = [nearestContentWrap, mainContainer, directScrollEl].filter(Boolean);
        if (candidates.length === 0) { return; }

        const verticalArea: HTMLElement | null = candidates.find((el: HTMLElement) => el.scrollHeight > el.clientHeight) || null;
        const horizontalArea: HTMLElement | null = candidates.find((el: HTMLElement) => el.scrollWidth > el.clientWidth) || null;
        if (!verticalArea && !horizontalArea) { return; }

        const scheduleRoot: HTMLElement | null = (verticalArea || horizontalArea)?.closest(`.${CSS_CLASSES.SCHEDULER}`) ||
            elementEl?.closest(`.${CSS_CLASSES.SCHEDULER}`);
        const headerEl: HTMLElement | null = scheduleRoot?.querySelector(
            `.${CSS_CLASSES.STICKY_HEADER}, .${CSS_CLASSES.HEADER_SECTION}, .${CSS_CLASSES.HEADER_ROW}`
        );
        const vRect: DOMRect | null = verticalArea ? verticalArea.getBoundingClientRect() : null;
        const hRect: DOMRect | null = horizontalArea ? horizontalArea.getBoundingClientRect() : null;
        const topThresholdY: number = headerEl?.getBoundingClientRect().bottom ?? (vRect ? vRect.top : (hRect ? hRect.top : 0));

        if (this.scrollInterval != null) {
            cancelAnimationFrame(this.scrollInterval);
            this.scrollInterval = null;
        }

        const getScrollSpeed: (distance: number, threshold?: number) => number =
            (distance: number, threshold: number = this.minScrollThreshold): number => {
                if (distance > threshold || distance < 0) { return 0; }
                const result: number = Math.floor((1 - distance / threshold) * this.minScrollSpeed);
                return isFinite(result) ? result : 0;
            };

        const getVerticalSpeed: () => number = (): number => {
            let verticalSpeed: number = 0;
            if (verticalArea && vRect) {
                const maxScrollTop: number = Math.max(0, verticalArea.scrollHeight - verticalArea.clientHeight);
                const distanceTop: number = Math.max(0, clientY - topThresholdY);
                const scrollbarHeight: number = Math.max(
                    0, (horizontalArea ? (horizontalArea.offsetHeight - horizontalArea.clientHeight) : 0),
                    (verticalArea ? (verticalArea.offsetHeight - verticalArea.clientHeight) : 0)
                );
                const effectiveBottom: number = vRect.bottom - scrollbarHeight;
                const distanceBottom: number = Math.max(0, effectiveBottom - clientY);
                const bottomThreshold: number = this.minScrollThreshold + scrollbarHeight;
                const isAtTop: boolean = verticalArea.scrollTop <= 0;
                const isAtBottom: boolean = Math.ceil(verticalArea.scrollTop) >= maxScrollTop;
                if (distanceTop < this.minScrollThreshold && !isAtTop) {
                    verticalSpeed = -getScrollSpeed(distanceTop);
                } else if (distanceBottom < bottomThreshold && !isAtBottom) {
                    verticalSpeed = getScrollSpeed(distanceBottom, bottomThreshold);
                }
            }
            return verticalSpeed;
        };

        const getHorizontalSpeed: () => number = (): number => {
            let horizontalSpeed: number = 0;
            if (horizontalArea && hRect) {
                const isRtl: boolean = this.direction === 'rtl';
                const maxScrollLeft: number = Math.max(0, horizontalArea.scrollWidth - horizontalArea.clientWidth);
                const distanceLeft: number = Math.max(0, clientX - hRect.left);
                const distanceRight: number = Math.max(0, hRect.right - clientX);
                const normalizedScrollLeft: number = isRtl
                    ? Math.abs(horizontalArea.scrollLeft)
                    : horizontalArea.scrollLeft;
                const isAtLeft: boolean = isRtl
                    ? normalizedScrollLeft >= maxScrollLeft  // leftmost (end in RTL) → no more room to scroll left
                    : normalizedScrollLeft <= 0;
                const isAtRight: boolean = isRtl
                    ? normalizedScrollLeft <= 0             // rightmost (start in RTL) → no more room to scroll right
                    : normalizedScrollLeft >= maxScrollLeft;
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
                if (!this.currentCell && CloneBase.currentActionName !== 'resize') { return; }
                if (!this.isAllDaySource || this.isTimelineView) {
                    if (verticalArea && verticalSpeed !== 0) {
                        const maxScrollTop: number = Math.max(0, verticalArea.scrollHeight - verticalArea.clientHeight);
                        const nextTop: number = Math.max(0, Math.min(maxScrollTop, verticalArea.scrollTop + verticalSpeed));
                        if (nextTop !== verticalArea.scrollTop) {
                            verticalArea.scrollTop = nextTop;
                            canScroll = true;
                        }
                    }
                    if (horizontalArea && horizontalSpeed !== 0) {
                        const isRtl: boolean = this.direction === 'rtl';
                        const maxScrollLeft: number = Math.max(0, horizontalArea.scrollWidth - horizontalArea.clientWidth);
                        let nextLeft: number;
                        if (isRtl) {
                            nextLeft = Math.max(-maxScrollLeft, Math.min(0, horizontalArea.scrollLeft + horizontalSpeed));
                        } else {
                            nextLeft = Math.max(0, Math.min(maxScrollLeft, horizontalArea.scrollLeft + horizontalSpeed));
                        }
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
                }
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
        if (this.isTimelineView) { return from.closest(`.${CSS_CLASSES.MAIN_SCROLL_CONTAINER}`); }
        return from.closest(`.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_CONTAINER}, .${CSS_CLASSES.DATE_HEADER_CONTAINER}`);
    }

    public getCurrentTargetDate(target: HTMLElement | null, cell: HTMLElement | null): number | null {
        if (!target && !cell) { return null; }
        let timeStamp: number = null;
        const root: HTMLElement | null = (target || cell)?.closest(`.${CSS_CLASSES.SCHEDULER}`);
        const allDayRow: HTMLElement | null = cell?.closest(`.${CSS_CLASSES.ALL_DAY_ROW}`);
        if (root && allDayRow && cell) {
            const cells: HTMLElement[] = Array.from(allDayRow.querySelectorAll(`.${CSS_CLASSES.ALL_DAY_CELL}`));
            const currentIndex: number = cells.indexOf(cell);
            const firstRow: HTMLElement | null = root.querySelector(`.${CSS_CLASSES.CONTENT_TABLE}, .${CSS_CLASSES.WORK_CELLS_ROW}`);
            const workCells: HTMLElement[] = firstRow ? (Array.from(firstRow.querySelectorAll(`.${CSS_CLASSES.WORK_CELLS}`))) : [];
            const currentDate: string | null | undefined = workCells[currentIndex as number]?.getAttribute('data-date');
            if (currentDate) { timeStamp = Number(currentDate); }
        }
        return timeStamp;
    }

    private getCell(clientX: number, clientY: number, isPointer: boolean, nativeEvent?: MouseEvent | TouchEvent): HTMLElement | null {
        const elements: Element[] = document?.elementsFromPoint(clientX, clientY);
        for (const element of elements) {
            const cell: HTMLElement = element.classList.contains(`${CSS_CLASSES.WORK_CELLS}`) ||
                element.classList.contains(`${CSS_CLASSES.ALL_DAY_CELL}`) ? element as HTMLElement : null;
            if (cell && (isPointer || !this?.isAllDaySource || element.classList.contains(CSS_CLASSES.ALL_DAY_CELL))) {
                return cell;
            }
        }
        if (this.isTimelineView) { return (nativeEvent?.target as HTMLElement)?.closest(`.${CSS_CLASSES.WORK_CELLS}[data-date]`) || null; }
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
        const scrollLeft: number = container.scrollLeft || 0;
        let centerClientX: number = 0;
        let centerClientY: number = 0;
        const allDayRow: HTMLElement | null = container.querySelector(`.${CSS_CLASSES.ALL_DAY_ROW}`);
        if (!allDayRow) { return null; }
        const cells: HTMLElement[] = Array.from(allDayRow.querySelectorAll(`.${CSS_CLASSES.ALL_DAY_CELL}`));
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

    public cloneFromSource(source: HTMLElement, eventDrag?: EventDragProps): HTMLElement {
        const clone: HTMLElement = source.cloneNode(true) as HTMLElement;
        clone.classList.add(
            CSS_CLASSES.DRAG_CLONE,
            CSS_CLASSES.NO_POINTER,
            CSS_CLASSES.POSITION_ABSOLUTE
        );
        if (eventDrag?.externalDragAndDrop) {
            clone.classList.add(CSS_CLASSES.EXTERNAL_DRAG_CLONE, CSS_CLASSES.CONTROL);
            clone.style.zIndex = getZindexPartial(clone).toString();
        }
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

    public setCursorClass(cursorType: 'move' | 'notAllowed' | 'default') : void {
        if (!document?.body) { return; }
        document.body.classList.remove(CSS_CLASSES.SCHEDULER_CURSOR_MOVE,
                                       CSS_CLASSES.SCHEDULER_CURSOR_NOT_ALLOWED, CSS_CLASSES.SCHEDULER_CURSOR_DEFAULT);
        if (cursorType === 'move') {
            document.body.classList.add(CSS_CLASSES.SCHEDULER_CURSOR_MOVE);
        } else if (cursorType === 'notAllowed') {
            document.body.classList.add(CSS_CLASSES.SCHEDULER_CURSOR_NOT_ALLOWED);
        } else {
            document.body.classList.add(CSS_CLASSES.SCHEDULER_CURSOR_DEFAULT);
        }
    }

    public getCurrentTargetCell(target: HTMLElement | null): HTMLElement | null {
        if (!target) { return null; }
        const dateHeaderContainer: HTMLElement | null = target.closest(`.${CSS_CLASSES.DATE_HEADER_CONTAINER}`);
        if (dateHeaderContainer) {
            const headerCell: HTMLElement | null = target.closest(`.${CSS_CLASSES.HEADER_CELLS}`);
            const headerRow: HTMLElement | null = dateHeaderContainer.querySelector(`.${CSS_CLASSES.HEADER_ROW}`);
            const resourceHeaders: HTMLElement = dateHeaderContainer.querySelector(`.${CSS_CLASSES.RESOURCE_HEADER}`);
            const allDayRow: HTMLElement | null = dateHeaderContainer.querySelector(`.${CSS_CLASSES.ALL_DAY_ROW}`);
            const hasHeaderStructure: boolean = !!headerRow || !!resourceHeaders;
            if (hasHeaderStructure && allDayRow) {
                const allDayCells: HTMLElement[] = Array.from(allDayRow.querySelectorAll(`.${CSS_CLASSES.ALL_DAY_CELL}`));
                const resourceHeaderCell: HTMLElement | null = target.closest(`.${CSS_CLASSES.RESOURCE_HEADER_CELL}`);
                if (resourceHeaderCell) {
                    const lastLevelRow: HTMLElement | null = dateHeaderContainer.querySelector(`.${CSS_CLASSES.RESOURCE_HEADER_LAST_LEVEL}`);
                    if (lastLevelRow) {
                        const resourceCells: HTMLElement[] = Array.from(lastLevelRow.querySelectorAll(`.${CSS_CLASSES.RESOURCE_HEADER_CELL}`));
                        const resourceIndex: number = resourceCells.indexOf(resourceHeaderCell);
                        if (resourceIndex >= 0 && allDayCells[resourceIndex as number]) {
                            return allDayCells[resourceIndex as number];
                        }
                    }
                }

                const headerCells: HTMLElement[] = Array.from(dateHeaderContainer.querySelectorAll(`.${CSS_CLASSES.HEADER_CELLS}`));
                let index: number = -1;
                if (headerCell) {
                    index = headerCells.indexOf(headerCell);
                } else {
                    for (let i: number = 0; i < headerCells.length; i++) {
                        if (headerCells[i as number].contains(target)) { index = i; break; }
                    }
                }
                if (index >= 0 && allDayCells[index as number]) {
                    return allDayCells[index as number];
                }
                if (allDayCells.length) { return allDayCells[0]; }
            }
        }
        return target.closest(`.${CSS_CLASSES.WORK_CELLS}, .${CSS_CLASSES.DAY_WRAPPER}, .${CSS_CLASSES.ALL_DAY_CELL}`);
    }

    public getSteppedCellDate(startMinutes: number, lastDragEvent: MouseEvent | TouchEvent, durationRef: number, minutesPerPixel: number,
                              cellDateAttr: number, containerEl: HTMLElement,
                              opts?: { cell?: HTMLElement; direction?: string; isResize?: boolean }): Date {
        const lastEvt: MouseEvent | TouchEvent | undefined = lastDragEvent;
        const coordinates: Point = lastEvt ? this.getPointerCoordinates(lastEvt) : { clientY: null, clientX: null };
        if (coordinates.clientX != null && this.isTimelineView && opts?.isResize) {
            const cellRect: DOMRect = opts?.cell.getBoundingClientRect();
            const pxIntoCell: number = Math.max(0, Math.min(coordinates.clientX - cellRect.left, this.cellWidth));
            const minsIntoCell: number = pxIntoCell * minutesPerPixel;
            const steppedMinutes: number =
                Math.floor((new Date(cellDateAttr).getHours() * MINUTES_PER_HOUR +
                new Date(cellDateAttr).getMinutes() + minsIntoCell) / this.slotInterval) * this.slotInterval;
            const cellAttr: number = new Date(cellDateAttr).setHours(0, steppedMinutes, 0, 0);
            return new Date(cellAttr);
        }

        const containerRectSnap: DOMRect | undefined = containerEl?.getBoundingClientRect();
        const relevantCoord: number | null = this.isTimelineView ? coordinates.clientX : coordinates.clientY;
        let computedMinutes: number = cellDateAttr;
        if (containerRectSnap && relevantCoord != null && minutesPerPixel > 0) {
            let minutesFromTop: number;
            if (this.isTimelineView) {
                const targetCell: HTMLElement | undefined = opts?.cell;
                if (!targetCell) { return new Date(cellDateAttr - durationRef); }
                const cellRect: DOMRect = targetCell.getBoundingClientRect();
                const cellWidth: number = Math.max(0, this.cellWidth ?? targetCell.offsetWidth ?? 0);
                const pxIntoCell: number = Math.max(0, Math.min(
                    opts?.direction === 'rtl' ? cellRect.right - relevantCoord : relevantCoord - cellRect.left, cellWidth
                ));
                minutesFromTop = pxIntoCell * minutesPerPixel;
            } else {
                minutesFromTop = Math.max(0, Math.round(((relevantCoord - containerRectSnap.top) +
                    containerEl.scrollTop) * minutesPerPixel));
            }
            const activeInterval: number = Math.max(0, this.slotInterval || 0);
            if (activeInterval > 0) {
                minutesFromTop = Math.floor(minutesFromTop / activeInterval) * activeInterval;
            }
            const dayStart: Date = new Date(cellDateAttr);
            dayStart.setHours(0, 0, 0, 0);
            computedMinutes = dayStart.getTime() + (startMinutes + minutesFromTop) * MS_PER_MINUTE;
            computedMinutes = computedMinutes - durationRef;
        } else {
            computedMinutes = (cellDateAttr - durationRef);
        }
        return new Date(computedMinutes);
    }

    public getRenderedMinutesDelta(fromTime: Date, toTime: Date): number {
        const startHourMinutes: number = parseHourStringToMinutes(this.startHour);
        const endHourMinutes: number = this.endHour ? parseHourStringToMinutes(this.endHour) : MINUTES_PER_DAY;
        const renderedMinutesPerDay: number = endHourMinutes - startHourMinutes;
        const fromDay: Date = DateService.normalizeDate(fromTime);
        const toDay: Date = DateService.normalizeDate(toTime);
        const dayDiff: number = Math.round((toDay.getTime() - fromDay.getTime()) / MS_PER_DAY);
        const fromMinutes: number = fromTime.getHours() * MINUTES_PER_HOUR + fromTime.getMinutes();
        const toMinutes: number = toTime.getHours() * MINUTES_PER_HOUR + toTime.getMinutes();
        const clampedFrom: number = Math.min(endHourMinutes, Math.max(startHourMinutes, fromMinutes));
        const clampedTo: number = Math.min(endHourMinutes, Math.max(startHourMinutes, toMinutes));
        if (dayDiff === 0) { return clampedTo - clampedFrom; }
        const fullIntermediateDays: number = Math.abs(dayDiff) - 1;
        if (dayDiff > 0) {
            const part1: number = endHourMinutes - clampedFrom;
            const part3: number = clampedTo - startHourMinutes;
            return part1 + fullIntermediateDays * renderedMinutesPerDay + part3;
        } else {
            const part1: number = clampedFrom - startHourMinutes;
            const part3: number = endHourMinutes - clampedTo;
            return -(part1 + fullIntermediateDays * renderedMinutesPerDay + part3);
        }
    }

    public getAllDayTimedAnchors(sourceDate: Date): { timedStart: Date; timedEnd: Date } {
        const eventDate: Date = new Date(DateService.normalizeDate(sourceDate));
        const [startH, startM]: number[] = (this.startHour ?? '0:00').split(':').map(Number);
        const timedStart: Date = eventDate;
        timedStart.setHours(startH, startM, 0, 0);
        let timedEnd: Date;
        if (!this.endHour || this.endHour === '24:00') {
            timedEnd = DateService.addDays(eventDate, 1);
        } else {
            const [endH, endM]: number[] = this.endHour.split(':').map(Number);
            timedEnd = eventDate;
            timedEnd.setHours(endH, endM, 0, 0);
        }
        return { timedStart, timedEnd };
    }
}
