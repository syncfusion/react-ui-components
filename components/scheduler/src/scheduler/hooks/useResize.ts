import { useCallback, useRef, useEffect, RefObject } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { EventModel, SchedulerResizeEvent } from '../types/scheduler-types';
import {
    useProviderContext, Position, EventHandler, extend, isNullOrUndefined, initializeTelemetryFeature
} from '@syncfusion/react-base';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { DateService, MINUTES_PER_HOUR } from '../services/DateService';
import { Point, ProcessedEventsData } from '../types/internal-interface';
import { CloneBase } from '../utils/clone-manager';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { EventService } from '../services/EventService';
import { useSchedulerLocalization } from '../common/locale';
import { getRecurrenceStringFromDate } from '../../recurrence-editor/util';
import { updateDatasource } from '../utils/event-base';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { applyClassToElements, getGroupIndexFromElement, removeClassFromElements, getCloneTop } from '../utils/actions';

type UseResizeResult = {
    resizeStart: (direction: Position, e: React.MouseEvent | React.TouchEvent) => void;
    onClick: (e: MouseEvent) => void;
};

type WiredHandlers = {
    resizing: (evt: MouseEvent | TouchEvent) => void;
    resizeStop: (evt: MouseEvent | TouchEvent) => void;
};

/**
 * Process and organize events for month view rendering
 *
 * @param {EventModel} data - The event model data to be used for resizing.
 * @returns {UseResizeResult} The resize handlers and state
 * @private
 */
export function useResize(data: EventModel):
UseResizeResult {
    const { onResizeStart, onResizing, onResizeStop, timeScale, startHour, endHour, schedulerRef, showWeekend, workDays,
        eventOverlap, confirmationDialog, eventResize, eventSettings, timezone, resources,
        isTimelineView, isMonthView } = useSchedulerPropsContext();
    const { eventsData } = useSchedulerEventsContext();
    const { renderDates: scheduleRenderDates } = useSchedulerRenderDatesContext();
    const cloneEventState: CloneEventContextValue = useCloneEventContext();
    const { dir } = useProviderContext();
    const { metadata, isGroupingEnabled } = useResourceGroupingContext();
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
    const isStepDragging: React.RefObject<boolean> = useRef<boolean>(false);
    const cellHeightRef: React.RefObject<number> = useRef<number>(0);
    const targetGroupIndex: React.RefObject<number | undefined> = useRef<number | undefined>(undefined);
    const pixelsValueRef: React.RefObject<{ minutesPerPixel: number; pixelsPerSlot: number | null; }> =
        useRef({ minutesPerPixel: 0, pixelsPerSlot: 0 });
    const { getString } = useSchedulerLocalization();
    const eventData: React.RefObject<{
        startTime: Date;
        endTime: Date;
    }> = useRef<{ startTime: Date; endTime: Date } | null>(null);
    const wiredHandlersRef: RefObject<WiredHandlers> = useRef<WiredHandlers | null>(null);

    useEffect(() => {
        initializeTelemetryFeature('Resize', 'Scheduler');
        return () => {
            clearProperties();
            resizeInfo.current = null;
            elementRef.current = null;
        };
    }, []);

    const wireEvents: () => void = (): void => {
        wiredHandlersRef.current = { resizing, resizeStop };
        EventHandler.add(document, 'mousemove', resizing, true);
        EventHandler.add(document, 'touchmove', resizing, { capture: true, passive: false });
        EventHandler.add(document, 'mouseup', resizeStop, true);
        EventHandler.add(document, 'touchend', resizeStop, { capture: true });
    };

    const unWireEvents: () => void = (): void => {
        const wired: WiredHandlers = wiredHandlersRef.current;
        if (wired) {
            EventHandler.remove(document, 'mousemove', wired.resizing);
            EventHandler.remove(document, 'touchmove', wired.resizing);
            EventHandler.remove(document, 'mouseup', wired.resizeStop);
            EventHandler.remove(document, 'touchend', wired.resizeStop);
            wiredHandlersRef.current = null;
        }
    };

    const clearProperties: () => void = (): void => {
        clearScrollRef();
        unWireEvents();
        isStepDragging.current = false;
        cellHeightRef.current = 0;
        pixelsValueRef.current = { minutesPerPixel: 0, pixelsPerSlot: 0 };
        if (resizeInfo.current) { resizeInfo.current.sourceTopPx = 0; }
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
        const colSpan: number = CloneBase.getColSpan(workCell);
        const isSpannedCell: boolean = colSpan > 1;
        const effectiveIsTimelineView: boolean = isTimelineView && timeScale?.enable;
        const slotInterval: number = resizeInfo.current.slotInterval;
        let dayWidth: number = 0;
        if (isSpannedCell) { dayWidth = cellWidth > 0 ? cellWidth / colSpan : 0; }
        cellHeightRef.current = effectiveIsTimelineView ? target?.offsetHeight : workCell?.offsetHeight || 0;
        pixelsValueRef.current.minutesPerPixel = effectiveIsTimelineView && !isMonthView
            ? (cellWidth > 0 ? slotInterval / cellWidth : 0)
            : (cellHeightRef.current > 0 ? slotInterval / cellHeightRef.current : 0);
        pixelsValueRef.current.pixelsPerSlot = cellWidth > 0 ? cellWidth / slotInterval : 1;
        currentStartTimeRef.current = data?.startTime ? new Date(data.startTime) : undefined;
        currentEndTimeRef.current = data?.endTime ? new Date(data.endTime) : undefined;
        extend(resizeInfo.current, {
            cellWidth,
            isAllDaySource,
            isMonthView,
            dayWidth,
            isTimelineView: effectiveIsTimelineView,
            isSpannedCell,
            slotInterval,
            interval: slotInterval
        }, null, true);
    };

    const createClone: () => void = (): void => {
        if (!elementRef.current) { return; }
        const parent: HTMLElement | Element | null = (elementRef.current.offsetParent) ||
            (elementRef.current.parentElement);
        if (!parent) { return; }
        const clone: HTMLElement = resizeInfo.current.cloneFromSource(elementRef.current);
        resizeInfo.current.cloneRef = clone;
    };

    const resizeStart: (direction: Position, e: React.MouseEvent | React.TouchEvent) => void =
    useCallback((direction: Position, e: React.MouseEvent | React.TouchEvent) => {
        schedulerRef?.current?.closeQuickInfoPopup?.();
        const nativeEvent: MouseEvent | TouchEvent = e.nativeEvent;
        const target: HTMLElement = (e.target as HTMLElement)?.closest(`.${CSS_CLASSES.APPOINTMENT}`);
        if (!target) { return; }
        resizeInfo.current = new CloneBase();
        resizeInfo.current.slotInterval = (timeScale?.interval && timeScale?.slotCount)
            ? timeScale.interval / timeScale.slotCount : 30;
        resizeInfo.current.isActionPerformed = false;
        resizeInfo.current.startHour = startHour ?? '0:00';
        resizeInfo.current.endHour = endHour ?? '24:00';
        directionRef.current = direction;
        resizeInfo.current.direction = dir;
        elementRef.current = target;
        startTopRef.current = target.offsetTop;
        startHeightRef.current = target.offsetHeight;
        const workCell: HTMLElement = resizeInfo.current.getCellUnderPointer(e.nativeEvent);
        targetGroupIndex.current = isGroupingEnabled ? getGroupIndexFromElement(target) : undefined;
        resizeInfo.current.currentCell = workCell;
        setupResizeInfo(target, workCell);

        if (resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource) {
            const { timedStart, timedEnd } = resizeInfo.current.getAllDayTimedAnchors(data.startTime);
            if (directionRef.current === Position.Left) {
                currentEndTimeRef.current = timedEnd;
                currentStartTimeRef.current = timedStart;
                requiredTimeRef.current = timedStart;
            } else {
                currentStartTimeRef.current = timedStart;
                currentEndTimeRef.current = timedEnd;
                requiredTimeRef.current = timedEnd;
            }
        } else if (directionRef.current === Position.Top || directionRef.current === Position.Left) {
            requiredTimeRef.current = currentStartTimeRef.current;
        } else if (directionRef.current === Position.Bottom || directionRef.current === Position.Right) {
            requiredTimeRef.current = currentEndTimeRef.current;
        }

        const args: SchedulerResizeEvent = getResizeInfoArgs(nativeEvent);
        const coords: Point = resizeInfo.current.getPointerCoordinates(nativeEvent);
        if (coords.clientX != null) { startXValueRef.current = coords.clientX; }
        if (coords.clientY != null) { startYValueRef.current = coords.clientY; }
        resizeInfoRef.current = nativeEvent;
        onResizeStart?.(args);
        if (args.cancel) { return; }
        eventData.current = {
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime)
        };
        if (eventResize) {
            if (eventResize.interval > 0 && ((resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource) ||
                !resizeInfo.current.isAllDaySource) && !resizeInfo.current.isMonthView) {
                isStepDragging.current = resizeInfo.current.slotInterval !== eventResize.interval;
                if (isStepDragging.current) {
                    resizeInfo.current.slotInterval = eventResize.interval;
                }
            }
            resizeInfo.current.enableScroll = eventResize.scroll?.enable ?? true;
            resizeInfo.current.minScrollSpeed = eventResize.scroll?.scrollBy ?? resizeInfo.current.minScrollSpeed;
            resizeInfo.current.minScrollThreshold = eventResize.scroll?.timeDelay ?? resizeInfo.current.minScrollThreshold;
        }
        wireEvents();
    }, [onResizeStart, scheduleRenderDates, data]);

    const getResizeInfoArgs: (evt: MouseEvent | TouchEvent) => SchedulerResizeEvent =
    (evt: MouseEvent | TouchEvent): SchedulerResizeEvent => {
        return {
            event: evt,
            cancel: false,
            startTime: currentStartTimeRef.current,
            endTime: currentEndTimeRef.current,
            data: elementRef.current ? data : undefined
        };
    };

    const performAutoScroll: (evt: MouseEvent | TouchEvent) => boolean =
        (evt: MouseEvent | TouchEvent): boolean => {
            const scrollTarget: HTMLElement = resizeInfo.current?.isTimelineView
                ? (elementRef.current?.closest(`.${CSS_CLASSES.MAIN_SCROLL_CONTAINER}`) as HTMLElement) || elementRef.current
                : elementRef.current;
            resizeInfo.current.performAutoScrolling(evt, scrollTarget);
            if (resizeInfo.current.scrollInterval !== null && scrollAnimationRef.current === null) {
                scrollAnimationRef.current = requestAnimationFrame(getSyncResizeClone);
            }
            return false;
        };

    const initializeResizeAction: (deltaX: number, deltaY: number) => void =
        (deltaX: number, deltaY: number): void => {
            if (!resizeInfo.current.isActionPerformed) {
                const moved: number = Math.hypot(deltaX, deltaY);
                if (moved < minMoveDistance) { return; }
                const target: HTMLElement = elementRef.current;
                if (!target) { return; }
                resizeInfo.current.isActionPerformed = true;
                resizeInfo.current.sourceTopPx = (target.offsetTop ?? 0);
                resizeInfo.current.addDocSuppressors();
                if (metadata?.groupEdit) {
                    applyClassToElements(schedulerRef.current.element, `[data-guid="${data.guid}"]`, CSS_CLASSES.RESIZING);
                } else {
                    target.classList.add(CSS_CLASSES.RESIZING);
                }
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

    const getValidResizeCell: (cell: HTMLElement | null) => HTMLElement | null = (cell: HTMLElement | null): HTMLElement | null => {
        const isHorizontalResize: boolean = directionRef.current === Position.Left || directionRef.current === Position.Right;
        if (!isHorizontalResize || isNullOrUndefined(targetGroupIndex.current)) {
            return cell;
        }
        if (cell && getGroupIndexFromElement(cell) === targetGroupIndex.current) {
            resizeInfo.current.currentCell = cell;
        }
        return resizeInfo.current.currentCell;
    };

    const resizing: (evt: MouseEvent | TouchEvent) => void = useCallback((evt: MouseEvent | TouchEvent): void => {
        if (!resizeInfo.current) { return; }
        const point: Point = resizeInfo.current.getPointerCoordinates(evt);
        const deltaX: number = point.clientX - startXValueRef.current;
        const deltaY: number = point.clientY - startYValueRef.current;
        initializeResizeAction(deltaX, deltaY);
        if (!resizeInfo.current.isActionPerformed) { return; }
        resizeInfoRef.current = evt;
        const args: SchedulerResizeEvent = getResizeInfoArgs(evt);
        onResizing?.(args);
        if (args.cancel) { return; }
        CloneBase.currentActionName = 'resize';
        if (args.startTime) {
            currentStartTimeRef.current = args.startTime;
        }
        if (args.endTime) {
            currentEndTimeRef.current = args.endTime;
        }
        if (((resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource) ||
            !resizeInfo.current.isAllDaySource) && resizeInfo.current.enableScroll) {
            performAutoScroll(evt);
        }
        let currentTargetCell: HTMLElement | null = resizeInfo.current.getCellUnderPointer(evt);
        currentTargetCell = getValidResizeCell(currentTargetCell);
        if ((resizeInfo.current.cloneRef && elementRef.current && timeScale.enable &&
            !((!resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource) || resizeInfo.current.isMonthView)) ||
            resizeInfo.current.isSpannedCell) {
            setCorrectResizeTime(currentTargetCell);
        }
        updateResizeCloneSegments(currentTargetCell);
        evt.preventDefault?.();
        evt?.stopPropagation?.();
    }, [scheduleRenderDates, data, onResizing]);

    const cleanupResizeUI: () => void = (): void => {
        if (metadata?.groupEdit) {
            removeClassFromElements(schedulerRef.current.element, `[data-guid="${data.guid}"]`, CSS_CLASSES.RESIZING);
        } else {
            elementRef.current?.classList.remove(CSS_CLASSES.RESIZING);
        }
        if (resizeInfo.current.scrollInterval) {
            cancelAnimationFrame(resizeInfo.current.scrollInterval);
        }
        resizeInfo.current.scrollInterval = null;
        clearProperties();
        if (document?.body) { setDefaultCursorIcon(); }
        resizeInfo.current.cloneRef = null;
        cloneEventState?.hide?.();
    };

    const applyTimelineTimedResizeResult: (original: EventModel, currentData: EventModel) => void =
        (original: EventModel, currentData: EventModel): void => {
            if (directionRef.current === Position.Left && requiredTimeRef.current) {
                original.startTime = new Date(requiredTimeRef.current);
            } else if (directionRef.current === Position.Right && requiredTimeRef.current) {
                original.endTime = new Date(requiredTimeRef.current);
            }

            if (resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource && !resizeInfo.current.isSpannedCell) {
                original.isAllDay = false;
                const { timedStart, timedEnd } = resizeInfo.current.getAllDayTimedAnchors(currentData.startTime);
                if (directionRef.current === Position.Left) {
                    original.endTime = timedEnd;
                } else {
                    original.startTime = timedStart;
                }
                if (original.startTime.getTime() >= original.endTime.getTime()) {
                    original.endTime = new Date(original.startTime.getTime() + resizeInfo.current.slotInterval * 60 * 1000);
                }
            }
        };

    const applyVerticalViewResizeResult: (original: EventModel) => void =
        (original: EventModel): void => {
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
        };

    const applyResizeResult: (original: EventModel, currentData: EventModel) => void =
        (original: EventModel, currentData: EventModel): void => {
            if ((resizeInfo.current.isTimelineView && !resizeInfo.current.isMonthView)
                || resizeInfo.current.isSpannedCell) {
                applyTimelineTimedResizeResult(original, currentData);
            } else {
                applyVerticalViewResizeResult(original);
            }
        };

    const updateRightResizeEndDate: (event: EventModel, targetDate: Date) => void =
        (event: EventModel, targetDate: Date): void => {
            const isFullDayCell: boolean = resizeInfo.current.isMonthView || timeScale?.enable === false ||
                (!resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource);
            const isMidnightEnd: boolean = !event.isAllDay && DateService.isMidnight(event.endTime);
            DateService.setYear(event.endTime, targetDate);
            if (isFullDayCell && isMidnightEnd) {
                event.endTime = DateService.addDays(event.endTime, 1);
            }
        };

    const updateAllDayAndMonthViewDates: (evt: MouseEvent | TouchEvent, original: EventModel) => void =
        (evt: MouseEvent | TouchEvent, original: EventModel): void => {
            const cell: HTMLElement = resizeInfo.current.getCellUnderPointer(evt);
            const cellDate: Date | number = resizeInfo.current.getDateFromPointer(resizeInfoRef.current, cell) ??
                resizeInfo.current.getCurrentTargetDate(evt.target as HTMLElement, cell);
            if (!cellDate) { return; }
            let targetDate: Date = new Date(cellDate);
            if (directionRef.current === Position.Right) {
                const startDateOnly: Date = DateService.normalizeDate(original.startTime);
                if (targetDate.getTime() < startDateOnly.getTime()) {
                    targetDate = startDateOnly;
                }
                updateRightResizeEndDate(original, targetDate);
            } else if (directionRef.current === Position.Left) {
                const endDateOnly: Date = DateService.normalizeDate(original.endTime);
                if (targetDate.getTime() > endDateOnly.getTime()) {
                    targetDate = endDateOnly;
                }
                DateService.setYear(original.startTime, targetDate);
            }
        };

    const showValidationAlert: (titleKey: string, messageKey: string) => void =
        (titleKey: string, messageKey: string): void => {
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            if (eventInfo && eventData.current) {
                eventInfo.startTime = new Date(eventData.current.startTime);
                eventInfo.endTime = new Date(eventData.current.endTime);
            }

            confirmationDialog?.show({
                title: getString(titleKey),
                message: getString(messageKey),
                confirmText: getString('ok'),
                showCancel: false,
                onConfirm: () => confirmationDialog.hide()
            });
        };

    const validateResizeResult: (updatedEvent: EventModel) => boolean =
        (updatedEvent: EventModel): boolean => {
            if (!eventOverlap && EventService.checkEventOverlap(updatedEvent, eventsData)) {
                showValidationAlert('eventOverlap', 'overlapAlert');
                return false;
            }

            if (EventService.isBlockRange(updatedEvent, eventsData)) {
                showValidationAlert('alert', 'blockAlert');
                return false;
            }

            return true;
        };

    const finalizeEventUpdate: (original: EventModel) => void =
        (original: EventModel): void => {
            if (original.recurrenceRule && original.recurrenceID) {
                original.recurrenceException = original.recurrenceException ??
                    getRecurrenceStringFromDate(eventData.current.startTime);
            }
            updateDatasource(original, original.startTime, original.endTime, schedulerRef, eventSettings.fields, eventsData, timezone);
        };

    const resizeStop: (evt: MouseEvent | TouchEvent) => void = useCallback((evt: MouseEvent | TouchEvent): void => {
        cleanupResizeUI();
        if (!resizeInfo.current.isActionPerformed) {
            resizeInfo.current.isActionPerformed = false;
            return;
        }
        resizeInfo.current.isActionPerformed = false;
        const args: SchedulerResizeEvent = getResizeInfoArgs(evt);
        onResizeStop?.(args);
        if (args.cancel) {
            const originalEvent: EventModel = args.data;
            if (originalEvent) {
                currentStartTimeRef.current = originalEvent.startTime;
                currentEndTimeRef.current = originalEvent.endTime;
            }
            return;
        }
        const currentData: EventModel = Array.isArray(data) ? (data[0]) : (data);
        const original: EventModel =
            { ...currentData, startTime: new Date(currentData.startTime), endTime: new Date(currentData.endTime) };
        applyResizeResult(original, currentData);
        if ((!resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource) ||
            resizeInfo.current.isMonthView || !timeScale.enable) {
            updateAllDayAndMonthViewDates(evt, original);
        }
        const updatedEvent: EventModel = { ...original, startTime: original.startTime, endTime: original.endTime };
        if (!validateResizeResult(updatedEvent)) {
            return;
        }
        finalizeEventUpdate(original);
        resizeInfo.current = null;
    }, [resizeInfo.current?.isActionPerformed, elementRef.current, resizeInfo, resizeInfo.current?.cloneRef, resizing, onResizeStop]);

    const setSpanCellDate: (cellDate: Date, startTime: Date | undefined, endTime: Date | undefined) => boolean =
        (cellDate: Date, startTime: Date | undefined, endTime: Date | undefined): boolean => {
            if (!resizeInfo.current.isSpannedCell) { return false; }
            if (directionRef.current === Position.Left) {
                cellDate.setHours(startTime.getHours(), startTime.getMinutes(), startTime.getSeconds(), 0);
                if (!endTime || cellDate.getTime() < endTime.getTime()) {
                    currentStartTimeRef.current = cellDate;
                    requiredTimeRef.current = cellDate;
                }
            } else if (directionRef.current === Position.Right) {
                cellDate.setHours(endTime.getHours(), endTime.getMinutes(), endTime.getSeconds(), 0);
                if (!startTime || cellDate.getTime() > startTime.getTime()) {
                    currentEndTimeRef.current = cellDate;
                    requiredTimeRef.current = cellDate;
                }
            }
            return true;
        };

    const updateResizeTime: (cellDate: Date, cellMinutes: number, startTime: Date | undefined, endTime: Date | undefined,
        cell: HTMLElement) => void =
        (cellDate: Date, cellMinutes: number, startTime: Date | undefined, endTime: Date | undefined,
         cell: HTMLElement): void => {
            const info: CloneBase = resizeInfo.current;
            let isOverFlowTop: boolean = false;
            let isOverFlowBottom: boolean = false;
            let computedTime: Date = cellDate;

            if (!info.isTimelineView && elementRef.current.querySelector(`.${CSS_CLASSES.INDICATOR}`)) {
                isOverFlowTop = elementRef.current.querySelector(`.${CSS_CLASSES.INDICATOR}`).classList.contains(`${CSS_CLASSES.UP_ARROW_ICON}`);
                isOverFlowBottom = elementRef.current.querySelector(`.${CSS_CLASSES.INDICATOR}`).classList.contains(`${CSS_CLASSES.DOWN_ARROW_ICON}`);
            }
            if (isStepDragging.current) {
                const lastEvt: MouseEvent | TouchEvent | undefined = resizeInfoRef.current;
                const containerEl: HTMLElement | null = info?.getContentWrap(cell);
                if (containerEl && lastEvt && pixelsValueRef.current.minutesPerPixel > 0) {
                    const { schedulerStartMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
                    computedTime = info.getSteppedCellDate(
                        schedulerStartMinutes, lastEvt, 0, pixelsValueRef.current.minutesPerPixel, Number(cellDate), containerEl,
                        { cell, isResize: true }
                    );
                }
            } else if (info.isTimelineView) {
                const snappedMinutes: number = Math.round(cellMinutes / info.slotInterval) * info.slotInterval;
                computedTime.setHours(0, snappedMinutes, 0, 0);
            }

            if (directionRef.current === Position.Top || (info.isTimelineView && directionRef.current === Position.Left)) {
                const originalCellMinutes: number = endTime.getHours() * MINUTES_PER_HOUR + endTime.getMinutes();
                if (info.isTimelineView && (!endTime || computedTime.getTime() < endTime.getTime())) {
                    currentStartTimeRef.current = computedTime;
                    requiredTimeRef.current = computedTime;
                } else if (!info.isTimelineView && (isOverFlowBottom || (originalCellMinutes > cellMinutes) || originalCellMinutes === 0)) {
                    startTime.setTime(computedTime.getTime());
                    requiredTimeRef.current = startTime;
                } else if (eventResize.resizeToZero) {
                    requiredTimeRef.current = endTime;
                }
            } else if (directionRef.current === Position.Bottom || (info.isTimelineView && directionRef.current === Position.Right)) {
                const adjustedDate: Date = new Date(computedTime.getTime() + info.slotInterval * 60 * 1000);
                if (info.isTimelineView && (!startTime || adjustedDate.getTime() > startTime.getTime())) {
                    currentEndTimeRef.current = adjustedDate;
                    requiredTimeRef.current = adjustedDate;
                } else if (!info.isTimelineView) {
                    cellMinutes = cellMinutes + info.slotInterval;
                    const originalCellMinutes: number = startTime.getHours() * MINUTES_PER_HOUR + startTime.getMinutes();
                    if (isStepDragging.current) {
                        const computedMinutes: number = computedTime.getHours() * MINUTES_PER_HOUR + computedTime.getMinutes();
                        if (isOverFlowTop || (originalCellMinutes < computedMinutes)) {
                            endTime.setTime(computedTime.getTime());
                            requiredTimeRef.current = endTime;
                        } else if (eventResize.resizeToZero) {
                            requiredTimeRef.current = startTime;
                        }
                    } else {
                        if (isOverFlowTop || (originalCellMinutes < cellMinutes)) {
                            endTime.setHours(cellDate.getHours(), cellDate.getMinutes() + info.slotInterval);
                            requiredTimeRef.current = endTime;
                        } else if (eventResize.resizeToZero) {
                            requiredTimeRef.current = startTime;
                        }
                    }
                } else if (eventResize.resizeToZero) {
                    requiredTimeRef.current = startTime;
                }
            }
        };

    const setCorrectResizeTime: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        if (!cell) { return; }
        const cellDate: Date | null = resizeInfo.current.getDateFromPointer(resizeInfoRef.current, cell);
        if (!cellDate || isNaN(cellDate.getTime())) { return; }
        const cellMinutes: number = cellDate.getHours() * MINUTES_PER_HOUR + cellDate.getMinutes();
        const startTime: Date | undefined = currentStartTimeRef.current ? new Date(currentStartTimeRef.current) : undefined;
        const endTime: Date | undefined = currentEndTimeRef.current ? new Date(currentEndTimeRef.current) : undefined;

        if (setSpanCellDate(cellDate, startTime, endTime)) { return; }
        updateResizeTime(cellDate, cellMinutes, startTime, endTime, cell);
    };

    const processTimelineClone: (original: EventModel, dragOffsetPx: number | undefined) => void =
        (original: EventModel, _dragOffsetPx: number | undefined): void => {
            const draggedEvent: EventModel = { ...original };
            if (resizeInfo.current.isTimelineView && resizeInfo.current.isAllDaySource
                && !resizeInfo.current.isSpannedCell && !resizeInfo.current.isMonthView) {
                draggedEvent.isAllDay = false;
            }
            const cloneTop: number = getCloneTop(schedulerRef.current?.element, targetGroupIndex.current, resizeInfo.current);
            cloneEventState?.show({
                guid: data.guid,
                draggedEvent,
                sourceTopPx: cloneTop,
                isDayEvent: resizeInfo.current.isMonthView || resizeInfo.current.isAllDaySource
            });
        };

    const processDayClone: (cell: HTMLElement | null, original: EventModel, isDayEvent: boolean) => void =
        (cell: HTMLElement | null, original: EventModel, isDayEvent: boolean): void => {
            let targetDate: Date | null = null;
            if (cell) {
                const cellDateAttr: Date | null = resizeInfo.current.getDateFromPointer(resizeInfoRef.current, cell);
                targetDate = cellDateAttr ?? null;
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
                    updateRightResizeEndDate(original, targetDate);
                } else if (directionRef.current === Position.Left) {
                    if (targetDate.getTime() > endDateOnly.getTime()) {
                        targetDate = new Date(endDateOnly);
                    }
                    DateService.setYear(original.startTime, targetDate);
                }
            }
            if (!resizeInfo.current.isTimelineView && !resizeInfo.current.isSpannedCell) {
                const segments: ProcessedEventsData[] = EventService.processCloneEvent(
                    schedulerRef.current?.element, scheduleRenderDates, original,
                    showWeekend, workDays,
                    resizeInfo.current.cellWidth,
                    resizeInfo.current.isAllDaySource, dir === 'rtl',
                    resizeInfo.current.isMonthView,
                    elementRef.current, resources,
                    targetGroupIndex.current, metadata,
                    eventSettings?.resourceColorField
                );
                cloneEventState?.show({ guid: data.guid, segments, isDayEvent: isDayEvent });
            }
        };

    const updateResizeCloneSegments: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        if (!data.guid || !resizeInfo.current) { return; }
        const currentData: EventModel = EventService.getEventByGuid(eventsData, data.guid);
        if (!currentData) { return; }
        const original: EventModel = { ...currentData,
            startTime: new Date(currentStartTimeRef.current || currentData.startTime),
            endTime: new Date(currentEndTimeRef.current || currentData.endTime)
        };
        const isDayEvent: boolean = resizeInfo.current?.isMonthView ||
            (!resizeInfo.current.isTimelineView && resizeInfo.current?.isAllDaySource) ||
            resizeInfo.current?.isSpannedCell;
        let dragOffsetPx: number | undefined = undefined;
        if (resizeInfo.current.isTimelineView && !resizeInfo.current.isMonthView &&
            !resizeInfo.current.isSpannedCell && timeScale?.enable) {
            dragOffsetPx = resizeInfo.current.getRenderedMinutesDelta(new Date(data.startTime), original.startTime) *
                pixelsValueRef.current.pixelsPerSlot;
        }
        if (!isDayEvent && timeScale.enable) {
            const tempEvent: EventModel = { ...original };
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
            if (!resizeInfo.current.isTimelineView) {
                const segments: ProcessedEventsData[] = EventService.processTimeSlotCloneEvent(schedulerRef.current?.element,
                                                                                               scheduleRenderDates, tempEvent,
                                                                                               timeScale, startHour, endHour,
                                                                                               resizeInfo.current.cellWidth, dir === 'rtl',
                                                                                               cellHeightRef.current || undefined,
                                                                                               resources, targetGroupIndex.current,
                                                                                               metadata, eventSettings?.resourceColorField
                );
                cloneEventState?.show({ guid: data.guid, segments, isDayEvent: false });
                return;
            }
        } else {
            processDayClone(cell, original, isDayEvent);
        }

        if (resizeInfo.current.isTimelineView || resizeInfo.current.isSpannedCell) {
            processTimelineClone(original, dragOffsetPx);
            return;
        }
    };

    const getSyncResizeClone: () => void = (): void => {
        scrollAnimationRef.current = null;
        if (!resizeInfo.current || resizeInfo.current.scrollInterval == null) { return; }
        const lastEvt: MouseEvent | TouchEvent | undefined = resizeInfoRef.current;
        if (lastEvt) {
            let cell: HTMLElement | null = resizeInfo.current.getCellUnderPointer(lastEvt);
            if (!cell) {
                const target: HTMLElement | null = (lastEvt as unknown as {target: HTMLElement}).target || null;
                cell = target?.closest(`.${CSS_CLASSES.WORK_CELLS}, .${CSS_CLASSES.DAY_WRAPPER}, .${CSS_CLASSES.ALL_DAY_CELL}`);
            }
            cell = getValidResizeCell(cell);
            if (cell) {
                if (resizeInfo.current.cloneRef && (resizeInfo.current.isTimelineView ||
                    !(resizeInfo.current.isAllDaySource || resizeInfo.current.isMonthView))) {
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
