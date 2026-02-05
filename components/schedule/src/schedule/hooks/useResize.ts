import { useCallback, useRef, useEffect } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulePropsContext } from '../context/schedule-context';
import { EventModel, ResizeEventArgs } from '../types/schedule-types';
import { useProviderContext, Position, EventHandler, extend } from '@syncfusion/react-base';
import { useScheduleEventsContext } from '../context/schedule-events-context';
import { DateService, MINUTES_PER_HOUR } from '../services/DateService';
import { Point, ProcessedEventsData } from '../types/internal-interface';
import { CloneBase } from '../utils/clone-manager';
import { useScheduleRenderDatesContext } from '../context/schedule-render-dates-context';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { EventService } from '../services/EventService';

type UseResizeResult = {
    resizeStart: (direction: Position, e: React.MouseEvent | React.TouchEvent) => void;
    onClick: (e: MouseEvent) => void;
};

/**
 * Process and organize events for month view rendering
 *
 * @param {EventModel} data - The event model data to be used for resizing.
 * @returns {UseResizeResult} The resize handlers and state
 */
export function useResize(data: EventModel):
UseResizeResult {
    const { onResizeStart, onResizing, onResizeStop, timeScale, startHour, endHour, scheduleRef, eventSettings, showWeekend, workDays } =
        useSchedulePropsContext();
    const { eventsData } = useScheduleEventsContext();
    const { renderDates: scheduleRenderDates } = useScheduleRenderDatesContext();
    const cloneEventState: CloneEventContextValue = useCloneEventContext();
    const { dir } = useProviderContext();
    const elementRef: React.RefObject<HTMLElement> = useRef<HTMLElement | null>(null);
    const resizeInfo: React.RefObject<CloneBase> = useRef<CloneBase | null>(null);
    const minMoveDistance: number = 10;
    const requiredTimeRef: React.RefObject<Date> = useRef<Date>(new Date());
    const startXValueRef: React.RefObject<number> = useRef<number>(0);
    const startYValueRef: React.RefObject<number> = useRef<number>(0);
    const startTopRef: React.RefObject<number> = useRef<number>(0);
    const startHeightRef: React.RefObject<number> = useRef<number>(0);
    const directionRef: React.RefObject<Position> = useRef<Position>(Position.Right);
    const currentStartTimeRef: React.RefObject<Date | undefined> = useRef<Date | undefined>(undefined);
    const currentEndTimeRef: React.RefObject<Date | undefined> = useRef<Date | undefined>(undefined);
    const scrollAnimationRef: React.RefObject<number | null> = useRef<number | null>(null);
    const resizeInfoRef: React.RefObject<MouseEvent | TouchEvent | undefined> = useRef<MouseEvent | TouchEvent | undefined>(undefined);

    useEffect(() => {
        return () => {
            clearScrollRef();
            unWireEvents();
            resizeInfo.current = null;
            elementRef.current = null;
        };
    }, []);

    const wireEvents: () => void = (): void => {
        EventHandler.add(document, 'mousemove', resizing, true);
        EventHandler.add(document, 'touchmove', resizing, { capture: true, passive: false });
        EventHandler.add(document, 'mouseup', resizeStop, true);
        EventHandler.add(document, 'touchend', resizeStop, { capture: true });
    };

    const unWireEvents: () => void = (): void => {
        EventHandler.remove(document, 'mousemove', resizing);
        EventHandler.remove(document, 'touchmove', resizing);
        EventHandler.remove(document, 'mouseup', resizeStop);
        EventHandler.remove(document, 'touchend', resizeStop);
    };

    const setResizeCursorIcon: () => void = (): void => {
        document.body.style.userSelect = 'none';
        document.body.style.cursor =
            (directionRef.current === Position.Left || directionRef.current === Position.Right) ? 'ew-resize' : 'ns-resize';
    };

    const setDefaultCursorIcon: () => void = (): void => {
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    };

    const setupResizeInfo: (target: HTMLElement, workCell: HTMLElement) => void = (target: HTMLElement, workCell: HTMLElement): void => {
        const cellWidth: number = workCell?.offsetWidth || 0;
        const isAllDaySource: boolean = target.classList.contains(CSS_CLASSES.ALL_DAY_APPOINTMENT);
        const isMonthView: boolean = !!target.closest(`.${CSS_CLASSES.MONTH_VIEW}`);
        const slotInterval: number = resizeInfo.current.slotInterval;
        currentStartTimeRef.current = data?.startTime ? new Date(data.startTime as Date) : undefined;
        currentEndTimeRef.current = data?.endTime ? new Date(data.endTime as Date) : undefined;
        extend(resizeInfo.current, {
            cellWidth,
            isAllDaySource,
            isMonthView,
            slotInterval,
            interval: slotInterval
        }, null, true);
    };

    const createClone: () => void = (): void => {
        if (!elementRef.current) { return; }
        const parent: HTMLElement | null = (elementRef.current.offsetParent as HTMLElement) ||
            (elementRef.current.parentElement as HTMLElement);
        if (!parent) { return; }
        const clone: HTMLElement = resizeInfo.current.cloneFromSource(elementRef.current);
        resizeInfo.current.cloneRef = clone;
    };

    const resizeStart: (direction: Position, e: React.MouseEvent | React.TouchEvent) => void =
    useCallback((direction: Position, e: React.MouseEvent | React.TouchEvent) => {
        const nativeEvent: MouseEvent | TouchEvent = e.nativeEvent;
        const target: HTMLElement = (e.target as HTMLElement)?.closest(`.${CSS_CLASSES.APPOINTMENT}`);
        if (!target) { return; }
        resizeInfo.current = new CloneBase();
        resizeInfo.current.slotInterval = (timeScale?.interval && timeScale?.slotCount)
            ? timeScale.interval / timeScale.slotCount : 30;
        resizeInfo.current.eventSettings = eventSettings;
        resizeInfo.current.eventsData = eventsData;
        resizeInfo.current.isActionPerformed = false;
        directionRef.current = direction;
        resizeInfo.current.direction = dir;
        elementRef.current = target as HTMLDivElement;
        startTopRef.current = target.offsetTop;
        startHeightRef.current = target.offsetHeight;
        const workCell: HTMLElement = resizeInfo.current.getCellUnderPointer(e.nativeEvent);
        setupResizeInfo(target, workCell);
        if (directionRef.current === Position.Top) { requiredTimeRef.current = currentStartTimeRef.current; }
        else if (directionRef.current === Position.Bottom) { requiredTimeRef.current = currentEndTimeRef.current; }
        const args: ResizeEventArgs = getResizeInfoArgs(nativeEvent);
        const coords: Point = resizeInfo.current.getPointerCoordinates(nativeEvent);
        if (coords.clientX != null) { startXValueRef.current = coords.clientX; }
        if (coords.clientY != null) { startYValueRef.current = coords.clientY; }
        resizeInfoRef.current = nativeEvent;
        onResizeStart?.(args);
        if (args.cancel) { return; }
        if (args.interval) {
            resizeInfo.current.slotInterval = args.interval;
        }
        wireEvents();
    }, [onResizeStart, scheduleRenderDates, data]);

    const getResizeInfoArgs: (evt: MouseEvent | TouchEvent) => ResizeEventArgs = (evt: MouseEvent | TouchEvent): ResizeEventArgs => {
        return {
            element: elementRef.current as HTMLElement,
            event: evt,
            cancel: false,
            startTime: currentStartTimeRef.current,
            endTime: currentEndTimeRef.current,
            data: elementRef.current ? data : undefined,
            interval: resizeInfo.current.slotInterval,
            scroll: { enable: true, scrollBy: 30, timeDelay: 100 }
        };
    };

    const performAutoScroll: (evt: MouseEvent | TouchEvent) => boolean =
        (evt: MouseEvent | TouchEvent): boolean => {
            resizeInfo.current.performAutoScrolling(
                evt, elementRef.current);
            if (resizeInfo.current.scrollInterval !== null && scrollAnimationRef.current === null) {
                scrollAnimationRef.current = requestAnimationFrame(getSyncResizeClone);
            }
            return false;
        };

    const initializeResizeAction: (deltaX: number, deltaY: number) => void =
        (deltaX: number, deltaY: number) => {
            if (!resizeInfo.current.isActionPerformed) {
                const moved: number = Math.hypot(deltaX, deltaY);
                if (moved < minMoveDistance) { return; }
                const target: HTMLElement = elementRef.current;
                if (!target) { return; }
                resizeInfo.current.isActionPerformed = true;
                resizeInfo.current.addDocSuppressors();
                target.classList.add(CSS_CLASSES.RESIZING);
                createClone();
                if (document?.body) { setResizeCursorIcon(); }
            }
        };

    const clearScrollRef: () => void = (): void => {
        if (scrollAnimationRef.current != null) {
            cancelAnimationFrame(scrollAnimationRef.current);
            scrollAnimationRef.current = null;
        }
    };

    const resizing: (evt: MouseEvent | TouchEvent) => void = useCallback((evt: MouseEvent | TouchEvent): void => {
        if (!resizeInfo.current) { return; }
        const point: Point = resizeInfo.current.getPointerCoordinates(evt);
        const deltaX: number = point.clientX - startXValueRef.current;
        const deltaY: number = point.clientY - startYValueRef.current;
        initializeResizeAction(deltaX, deltaY);
        if (!resizeInfo.current.isActionPerformed) { return; }
        resizeInfoRef.current = evt;
        const args: ResizeEventArgs = getResizeInfoArgs(evt);
        onResizing?.(args);
        if (args.cancel) { return; }
        if (args.startTime) {
            currentStartTimeRef.current = args.startTime;
        }
        if (args.endTime) {
            currentEndTimeRef.current = args.endTime;
        }
        const target: HTMLElement = elementRef.current as HTMLElement;
        if (!resizeInfo.current.isAllDaySource) {
            performAutoScroll(evt);
        }
        const currentTargetCell: HTMLElement | null = resizeInfo.current.getCellUnderPointer(evt);
        if (resizeInfo.current.cloneRef && target && !(resizeInfo.current.isAllDaySource || resizeInfo.current.isMonthView)) {
            setCorrectResizeTime(currentTargetCell);
        }
        updateResizeCloneSegments(currentTargetCell);
        evt.preventDefault?.();
        evt?.stopPropagation?.();
    }, [resizeInfo.current?.isActionPerformed, elementRef.current, scheduleRenderDates, data,
        startXValueRef.current, startYValueRef.current, directionRef.current, resizeInfo.current?.cloneRef, onResizing]);

    const resizeStop: (evt: MouseEvent | TouchEvent) => void = useCallback((evt: MouseEvent | TouchEvent): void => {
        elementRef.current?.classList.remove(CSS_CLASSES.RESIZING);
        if (resizeInfo.current.scrollInterval) {
            cancelAnimationFrame(resizeInfo.current.scrollInterval);
        }
        resizeInfo.current.scrollInterval = null;
        clearScrollRef();
        unWireEvents();
        if (document?.body) { setDefaultCursorIcon(); }
        CloneBase.currentActionName = 'resize';
        resizeInfo.current.cloneRef = null;
        cloneEventState?.hide?.();
        if (!resizeInfo.current.isActionPerformed) {
            resizeInfo.current.isActionPerformed = false;
            return;
        }
        resizeInfo.current.isActionPerformed = false;
        const args: ResizeEventArgs = getResizeInfoArgs(evt);
        onResizeStop?.(args);
        if (args.cancel) {
            const originalEvent: EventModel = args.data;
            if (originalEvent) {
                currentStartTimeRef.current = originalEvent.startTime;
                currentEndTimeRef.current = originalEvent.endTime;
            }
            return;
        }
        const original: EventModel = Array.isArray(data) ? (data[0] as EventModel) : (data as EventModel);
        if (directionRef.current === Position.Top) {
            DateService.setHours(original.startTime, requiredTimeRef.current);
        } else if (directionRef.current === Position.Bottom) {
            const isOriginalMidNight: boolean = DateService.isMidnight(original.endTime);
            const isCurrentMidNight: boolean = DateService.isMidnight(requiredTimeRef.current);
            DateService.setHours(original.endTime, requiredTimeRef.current);
            const days: number = isOriginalMidNight && !isCurrentMidNight ? -1
                : !isOriginalMidNight && isCurrentMidNight ? 1
                    : 0;
            original.endTime = DateService.addDays(original.endTime, days);
        }
        if (resizeInfo.current.isAllDaySource || resizeInfo.current.isMonthView) {
            const cell: HTMLElement = resizeInfo.current.getCellUnderPointer(evt);
            const cellDateAttr: string | number = cell?.getAttribute('data-date') ?? resizeInfo.current.getCurrentTargetDate(evt.target as HTMLElement, cell);
            const cellDate: Date = new Date(Number(cellDateAttr));
            let targetDate: Date = cellDate;
            if (directionRef.current === Position.Right) {
                const startDateOnly: Date = DateService.normalizeDate(original.startTime);
                if (targetDate.getTime() < startDateOnly.getTime()) {
                    targetDate = startDateOnly;
                }
                DateService.setYear(original.endTime, targetDate);
                if (DateService.isMidnight(original.endTime)) {
                    original.endTime = DateService.addDays(original.endTime, 1);
                }
            } else if (directionRef.current === Position.Left) {
                const endDateOnly: Date = DateService.normalizeDate(original.endTime);
                if (targetDate.getTime() > endDateOnly.getTime()) {
                    targetDate = endDateOnly;
                    if (resizeInfo.current.isAllDaySource) {
                        targetDate = DateService.addDays(targetDate, -1);
                    }
                }
                DateService.setYear(original.startTime, targetDate);
            }
        }
        resizeInfo.current.updateDatasource(original, original.startTime, original.endTime, scheduleRef);
        resizeInfo.current = null;
    }, [resizeInfo.current?.isActionPerformed, elementRef.current, resizeInfo, resizeInfo.current?.cloneRef, resizing, onResizeStop]);

    const setCorrectResizeTime: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        const cellDateAttr: string | null = cell?.getAttribute('data-date');
        if (!cellDateAttr) { return; }
        const cellDate: Date = new Date(Number(cellDateAttr));
        let cellMinutes: number = cellDate.getHours() * MINUTES_PER_HOUR + cellDate.getMinutes();
        const startTime: Date | undefined = currentStartTimeRef.current ? new Date(currentStartTimeRef.current) : undefined;
        const endTime: Date | undefined = currentEndTimeRef.current ? new Date(currentEndTimeRef.current) : undefined;
        let isOverFlowTop: boolean = false;
        let isOverFlowBottom: boolean = false;

        if (elementRef.current.querySelector('.sf-indicator')) {
            isOverFlowTop = elementRef.current.querySelector('.sf-indicator').classList.contains('sf-up-icon');
            isOverFlowBottom = elementRef.current.querySelector('.sf-indicator').classList.contains('sf-down-icon');
        }
        if (directionRef.current === Position.Top) {
            const originalCellMinutes: number = endTime.getHours() * MINUTES_PER_HOUR + endTime.getMinutes();
            if (isOverFlowBottom || (originalCellMinutes > cellMinutes) || originalCellMinutes === 0) {
                startTime.setHours(cellDate.getHours(), cellDate.getMinutes());
                requiredTimeRef.current = startTime;
            }
        } else if (directionRef.current === Position.Bottom) {
            cellMinutes = cellMinutes + resizeInfo.current.slotInterval;
            const originalCellMinutes: number = startTime.getHours() * MINUTES_PER_HOUR + startTime.getMinutes();
            if (isOverFlowTop || (originalCellMinutes < cellMinutes)) {
                endTime.setHours(cellDate.getHours(), cellDate.getMinutes() + resizeInfo.current.slotInterval);
                requiredTimeRef.current = endTime;
            }
        }
    };

    const updateResizeCloneSegments: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        if (!data.guid) { return; }
        const original: EventModel = EventService.getEventByGuid(eventsData, data.guid);
        if (!original) { return; }

        if (!(resizeInfo.current?.isMonthView || resizeInfo.current?.isAllDaySource)) {
            const tempEvent: EventModel =
                { ...original, startTime: new Date(original.startTime), endTime: new Date(original.endTime) } as EventModel;
            if (directionRef.current === Position.Top) {
                DateService.setHours((tempEvent).startTime, requiredTimeRef.current);
            } else if (directionRef.current === Position.Bottom) {
                const isOriginalMidNight: boolean = DateService.isMidnight(tempEvent.endTime);
                const isCurrentMidNight: boolean = DateService.isMidnight(requiredTimeRef.current);
                DateService.setHours((tempEvent).endTime, requiredTimeRef.current);
                const days: number = isOriginalMidNight && !isCurrentMidNight ? -1
                    : !isOriginalMidNight && isCurrentMidNight ? 1
                        : 0;
                tempEvent.endTime = DateService.addDays(tempEvent.endTime, days);
            }
            const segments: ProcessedEventsData[] = EventService.processTimeSlotCloneEvent(scheduleRef, scheduleRenderDates, tempEvent,
                                                                                           timeScale, startHour, endHour,
                                                                                           resizeInfo.current.cellWidth, dir === 'rtl');
            cloneEventState?.show({ guid: data.guid, segments, isDayEvent: false });
            return;
        }

        let targetDate: Date | null = null;
        if (cell) {
            const attr: string | null = cell.getAttribute('data-date');
            targetDate = attr ? new Date(Number(attr)) : null;
        }
        if (!targetDate && cell) {
            const ts: number | null = resizeInfo.current.getCurrentTargetDate(cell, cell);
            targetDate = ts != null ? new Date(ts) : null;
        }
        if (targetDate) {
            const startDateOnly: Date = DateService.normalizeDate(original.startTime);
            const endDateOnly: Date = DateService.normalizeDate(original.endTime);
            if (directionRef.current === Position.Right) {
                if (targetDate.getTime() < startDateOnly.getTime()) { targetDate = startDateOnly; }
                DateService.setYear(original.endTime, targetDate);
                if (DateService.isMidnight(original.endTime)) {
                    original.endTime = DateService.addDays(original.endTime, 1);
                }
            } else if (directionRef.current === Position.Left) {
                if (targetDate.getTime() > endDateOnly.getTime()) {
                    targetDate = new Date(endDateOnly);
                    if (resizeInfo.current.isAllDaySource) {
                        targetDate = DateService.addDays(targetDate, -1);
                    }
                }
                DateService.setYear(original.startTime, targetDate);
            }
        }
        const segments: ProcessedEventsData[] = EventService.processCloneEvent(scheduleRef, scheduleRenderDates, original,
                                                                               showWeekend, workDays,
                                                                               resizeInfo.current.cellWidth,
                                                                               resizeInfo.current.isAllDaySource, dir === 'rtl'
        );
        cloneEventState?.show({ guid: data.guid, segments, isDayEvent: true });
    };

    const getSyncResizeClone: () => void = (): void => {
        scrollAnimationRef.current = null;
        if (!resizeInfo.current || resizeInfo.current.scrollInterval == null) { return; }
        const lastEvt: MouseEvent | TouchEvent | undefined = resizeInfoRef.current;
        if (lastEvt) {
            let cell: HTMLElement | null = resizeInfo.current.getCellUnderPointer(lastEvt);
            if (!cell) {
                const target: HTMLElement | null = (lastEvt as any).target || null;
                cell = target?.closest(`.${CSS_CLASSES.WORK_CELLS}, .${CSS_CLASSES.DAY_WRAPPER}, .${CSS_CLASSES.ALL_DAY_CELL}`) as HTMLElement | null;
            }
            if (cell) {
                if (resizeInfo.current.cloneRef && !(resizeInfo.current.isAllDaySource || resizeInfo.current.isMonthView)) {
                    setCorrectResizeTime(cell);
                }
                updateResizeCloneSegments(cell);
            }
        }
        if (resizeInfo.current && resizeInfo.current.scrollInterval != null) {
            scrollAnimationRef.current = requestAnimationFrame(getSyncResizeClone);
        }
    };

    return {
        resizeStart,
        onClick: (e: MouseEvent) => {
            if (resizeInfo.current?.suppressEvent) {
                resizeInfo.current.suppressEvent(e);
            }
        }
    };
}
