import { ForwardedRef, RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDraggable, useProviderContext, Touch, HelperEvent } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CSS_CLASSES } from '../common/constants';
import { DateService } from '../services/DateService';
import { EventModel, SchedulerDragEvent } from '../types/scheduler-types';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { CloneBase } from '../utils/clone-manager';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { EventService } from '../services/EventService';
import { Point, ProcessedEventsData } from '../types/internal-interface';
import { useSchedulerLocalization } from '../common/locale';

type UseDragAndDropResult = { mergedRef: (node: HTMLDivElement) => void; composedProps: React.HTMLAttributes<HTMLDivElement>; };
type UseDragAndDropParams = { ref: ForwardedRef<HTMLDivElement>; data: EventModel;
    containerProps?: React.HTMLAttributes<HTMLDivElement>; }

/**
 * Hook that enables drag and drop functionality for scheduler events
 *
 * @param {UseDragAndDropParams} params The parameters for drag and drop functionality
 * @returns {UseDragAndDropResult} The ref and props needed for drag and drop
 * @private
 */
export function useDragAndDrop({ ref, data, containerProps }: UseDragAndDropParams): UseDragAndDropResult {
    const { timeScale, startHour, endHour, schedulerRef, eventSettings, showWeekend, workDays,
        onDragStart, onDrag, onDragStop, eventOverlap, confirmationDialog } = useSchedulerPropsContext();
    const eventData: EventModel = useMemo(() => {
        return {
            ...data,
            startTime: new Date(data?.startTime),
            endTime: new Date(data?.endTime)
        };
    }, [data]);

    const { getString } = useSchedulerLocalization();

    const { dir } = useProviderContext();
    const { eventsData } = useSchedulerEventsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const cloneEventState: CloneEventContextValue = useCloneEventContext();
    const elementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const dragTargetRef: RefObject<HTMLDivElement> = elementRef;
    const dragInfo: RefObject<CloneBase | null> = useRef<CloneBase | null>(null);
    const dragStateRef: RefObject<{ lastDragEvent?: MouseEvent | TouchEvent }> = useRef({});
    const dragStateValuesRef: RefObject<{ minutesPerPixel: number; dragAnchorOffsetPx: number | null; dragAnchorOffsetX: number | null;
        finalDragStartTime: Date | null; finalDragEndTime: Date | null; }> = useRef({ minutesPerPixel: 0,
        dragAnchorOffsetPx: null, dragAnchorOffsetX: null, finalDragStartTime: null, finalDragEndTime: null });
    const scrollAnimationRef: RefObject<number | null> = useRef<number | null>(null);
    const cellHeightRef: RefObject<number> = useRef<number>(0);
    const durationRef: RefObject<number> = useRef<number>(0);
    const isScrollingRef: RefObject<boolean> = useRef<boolean>(true);
    const excludedArea: RefObject<string | null> = useRef<string | null>(null);
    const isStepDragging: RefObject<boolean> = useRef<boolean>(false);

    Touch(elementRef, {
        tapHold: () => { isScrollingRef.current = false; }
    });

    useEffect(() => {
        return () => { endDragCleanup(); };
    }, []);

    useEffect(() => {
        if (timeScale && dragInfo.current) {
            dragInfo.current.slotInterval = timeScale.interval / timeScale.slotCount;
        }
    }, [timeScale]);

    const mergedRef: (node: HTMLDivElement) => void = useCallback(
        (node: HTMLDivElement) => {
            elementRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                (ref as { current: HTMLDivElement | null }).current = node;
            }
        },
        [ref, cloneEventState]
    );

    const getSnapPosition: (target: HTMLElement | null) => { left?: string | number; top?: string | number } = useCallback(
        (target: HTMLElement | null): { left?: string | number; top?: string | number } => {
            if (!target || !dragInfo.current) { return {}; }
            const container: HTMLElement | null = dragInfo.current.getContentWrap(target);
            const containerRect: DOMRect | null = container ? container.getBoundingClientRect() : null;
            const cellRect: DOMRect = target.getBoundingClientRect();
            const left: number = containerRect
                ? Math.round(cellRect.left - containerRect.left + (container?.scrollLeft || 0))
                : target.offsetLeft;
            const top: number = containerRect
                ? Math.round(cellRect.top - containerRect.top + (container?.scrollTop || 0))
                : target.offsetTop;
            return { left, top };
        }, [cloneEventState]);

    const endDragCleanup: () => void = () => {
        if (document?.body) { document.body.style.cursor = 'default'; }
        cellHeightRef.current = 0;
        durationRef.current = 0;
        dragStateRef.current = {};
        excludedArea.current = null;
        isStepDragging.current = false;
        if (dragInfo.current) {
            dragInfo.current.isActionPerformed = false;
            dragInfo.current.enableScroll = true;
            if (dragInfo.current.scrollInterval != null) {
                cancelAnimationFrame(dragInfo.current.scrollInterval);
                dragInfo.current.scrollInterval = null;
            }
            dragInfo.current?.removeDocListenersRef?.();
        }
        if (scrollAnimationRef.current != null) {
            cancelAnimationFrame(scrollAnimationRef.current);
            (scrollAnimationRef).current = null;
        }
        dragStateValuesRef.current = {
            minutesPerPixel: 0,
            dragAnchorOffsetPx: null,
            dragAnchorOffsetX: null,
            finalDragStartTime: null,
            finalDragEndTime: null
        };
    };

    const getSyncClone: () => void = (): void => {
        (scrollAnimationRef).current = null;
        if (!dragInfo.current || dragInfo.current.scrollInterval == null) { return; }
        const lastEvt: MouseEvent | TouchEvent | undefined = dragStateRef.current.lastDragEvent;
        if (lastEvt) {
            let cell: HTMLElement | null = dragInfo.current.getCellUnderPointer(lastEvt);
            if (!cell) {
                const target: HTMLElement | null = (lastEvt.target as HTMLElement | null) || null;
                cell = getCurrentTargetCell(target);
            }
            if (cell) {
                let newStartDate: Date = new Date(Number(cell.getAttribute('data-date')));
                if (dragInfo.current.isAllDaySource) {
                    newStartDate = DateService.normalizeDate(newStartDate);
                }
                if (!dragInfo.current.isMonthView && !dragInfo.current.isAllDaySource) {
                    updateTimeLabel(cell);
                    if (dragStateValuesRef.current.finalDragStartTime) {
                        newStartDate = dragStateValuesRef.current.finalDragStartTime;
                    }
                }
                updateStartandEndTime(newStartDate);
            }
        }
        if (dragInfo.current && dragInfo.current.scrollInterval != null) {
            (scrollAnimationRef).current = requestAnimationFrame(getSyncClone);
        }
    };

    const handleAutoScroll: (e: MouseEvent | TouchEvent) => void = useCallback((e: MouseEvent | TouchEvent): void => {
        if (!dragInfo.current) { return; }
        dragInfo.current.performAutoScrolling(e, elementRef.current);
        if (dragInfo.current.scrollInterval !== null && scrollAnimationRef.current === null && !dragInfo.current.isMonthView) {
            (scrollAnimationRef).current = requestAnimationFrame(getSyncClone);
        }
    }, [getSnapPosition]);

    const initDragSource: (source: HTMLElement) => HTMLElement | null = (source: HTMLElement): HTMLElement | null => {
        const contentWrap: HTMLElement | null = dragInfo.current.getContentWrap(source);
        dragInfo.current.isAllDaySource = source.classList.contains(`${CSS_CLASSES.ALL_DAY_APPOINTMENT}`);
        if (contentWrap) {
            const cell: HTMLElement = contentWrap.querySelector(`.${CSS_CLASSES.WORK_CELLS}[data-date], .${CSS_CLASSES.ALL_DAY_CELL}`);
            if (cell) {
                cellHeightRef.current = cell.offsetHeight ?? 0;
                dragInfo.current.cellWidth = cell.offsetWidth ?? 0;
            }
        }
        dragStateValuesRef.current.minutesPerPixel =
            cellHeightRef.current > 0 ? dragInfo.current.slotInterval / cellHeightRef.current : 0;
        dragInfo.current.isMonthView = !!(source as HTMLElement)?.closest(`.${CSS_CLASSES.MONTH_VIEW}`);
        (source as HTMLElement & { draggable?: boolean }).draggable = false;
        return contentWrap;
    };

    const finalizeClone: (clone: HTMLElement, contentWrap: HTMLElement | null) => void =
        (clone: HTMLElement, contentWrap: HTMLElement | null): void => {
            dragInfo.current.cloneRef = clone;
            clone.style.height = '1px';
            clone.style.width = '1px';
            (contentWrap || document?.body)?.appendChild(clone);
        };

    const updateStartandEndTime: (newStartDate?: Date) => void =
    (newStartDate?: Date): void => {
        const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
        if (!eventInfo || !dragInfo.current) { return; }

        if (dragInfo.current.isMonthView || dragInfo.current.isAllDaySource) {
            if (newStartDate) {
                const durationMs: number = Math.max(0, eventInfo.endTime.getTime() - eventInfo.startTime.getTime());
                eventInfo.startTime = new Date(newStartDate);
                eventInfo.endTime = new Date(eventInfo.startTime.getTime() + durationMs);
            }
            const segments: ProcessedEventsData[] = EventService.processCloneEvent(schedulerRef, renderDates, eventInfo,
                                                                                   showWeekend, workDays,
                                                                                   dragInfo.current.cellWidth,
                                                                                   dragInfo.current.isAllDaySource, dir === 'rtl'
            );
            cloneEventState?.show({ guid: data.guid, segments, isDayEvent: true });
            return;
        }

        if (newStartDate) {
            const durationMs: number = Math.max(0, eventInfo.endTime.getTime() - eventInfo.startTime.getTime());
            eventInfo.startTime = new Date(newStartDate);
            eventInfo.endTime = new Date(eventInfo.startTime.getTime() + durationMs);
        }
        const segments: ProcessedEventsData[] = EventService.processTimeSlotCloneEvent(schedulerRef, renderDates, eventInfo,
                                                                                       timeScale, startHour, endHour,
                                                                                       dragInfo.current.cellWidth, dir === 'rtl');
        cloneEventState?.show({ guid: data.guid, segments, isDayEvent: false });
        return;
    };

    const createHelperClone: (args: HelperEvent) => HTMLElement | null = (args: HelperEvent): HTMLElement | null => {
        if (!elementRef.current || (args.sender?.type === 'touchmove' && isScrollingRef.current)) {
            return null;
        }
        if (dragInfo.current?.cloneRef?.parentElement) {
            dragInfo.current.cloneRef.parentElement.removeChild(dragInfo.current.cloneRef);
        }
        dragInfo.current = new CloneBase();
        dragInfo.current.eventSettings = eventSettings;
        dragInfo.current.eventsData = eventsData;
        dragInfo.current.direction = dir;
        dragInfo.current.slotInterval = timeScale?.interval / timeScale?.slotCount;
        const source: HTMLElement = elementRef.current;
        const contentWrap: HTMLElement | null = initDragSource(source);
        const clone: HTMLElement = dragInfo.current.cloneFromSource(source);
        finalizeClone(clone, contentWrap);
        return clone;
    };

    const getDragInfoArgs: (evt: MouseEvent | TouchEvent) => SchedulerDragEvent = (evt: MouseEvent | TouchEvent): SchedulerDragEvent => {
        return {
            cancel: false,
            data: data,
            event: evt,
            excludeSelectors: null,
            element: elementRef.current,
            interval: dragInfo.current.slotInterval,
            scroll: { enable: true, scrollBy: 10, timeDelay: 100 }
        };
    };

    const handleDragStart: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent) => {
        if (!dragInfo.current) { return; }
        dragStateRef.current = {};
        const info: CloneBase = dragInfo.current;
        info.isActionPerformed = true;
        getDiffDuration(args);
        info.addDocSuppressors();
        elementRef.current?.classList.add(CSS_CLASSES.DRAGGING);
        if (document?.body) { document.body.style.cursor = 'move'; }
        dragStateRef.current.lastDragEvent = args.event;
        getUpdateDragOffsets(args); // Used to update pointer position
        const startArgs: SchedulerDragEvent = getDragInfoArgs(args.event);
        onDragStart?.(startArgs);
        if (startArgs.cancel) {
            args.cancel = true;
            resetElementDragState();
            endDragCleanup();
            dragInfo.current = null;
            return;
        }
        isStepDragging.current = info.slotInterval !== startArgs.interval;
        info.slotInterval = startArgs.interval;
        info.enableScroll = !!startArgs.scroll?.enable;
        info.minScrollSpeed = startArgs.scroll?.scrollBy;
        info.minScrollThreshold = startArgs.scroll?.timeDelay;
        excludedArea.current = startArgs.excludeSelectors;
    };

    const getUpdateDragOffsets: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent): void => {
        try {
            const src: HTMLElement | null = elementRef.current;
            if (!src) { return; }
            const container: HTMLElement | null = dragInfo.current.getContentWrap(src);
            const containerRect: DOMRect | undefined = container?.getBoundingClientRect();
            const { clientY, clientX }: { clientY: number | null; clientX: number | null } =
                dragInfo.current.getPointerCoordinates(args.event as MouseEvent | TouchEvent);
            if (!container || !containerRect || (clientY == null && clientX == null)) { return; }
            const srcRect: DOMRect = src.getBoundingClientRect();
            const scroll: { top: number; left: number } = { top: container.scrollTop || 0, left: container.scrollLeft || 0 };
            dragStateValuesRef.current.dragAnchorOffsetPx = clientY != null
                ? (clientY - containerRect.top + scroll.top) - (srcRect.top - containerRect.top + scroll.top)
                : null;
            dragStateValuesRef.current.dragAnchorOffsetX = clientX != null
                ? (clientX - containerRect.left + scroll.left) - (srcRect.left - containerRect.left + scroll.left)
                : null;
        } catch {
            dragStateValuesRef.current.dragAnchorOffsetPx = dragStateValuesRef.current.dragAnchorOffsetX = null;
        }
    };

    const getAutoScroll: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent): void => {
        if (!dragInfo.current?.isAllDaySource && dragInfo.current.enableScroll) {
            handleAutoScroll(args.event as MouseEvent | TouchEvent);
        }
    };

    const updateTimeLabel: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        if (!(dragInfo.current?.cloneRef && cell && dragInfo.current)) { return; }
        const info: CloneBase = dragInfo.current;
        const containerEl: HTMLElement | null = info.getContentWrap(cell);
        const containerRect: DOMRect | undefined = containerEl?.getBoundingClientRect();
        if (containerRect) {
            if (data) {
                let cellDateAttr: number | null = Number(cell.getAttribute('data-date'));
                if (!cellDateAttr || isNaN(cellDateAttr)) { return; }
                if (info.isAllDaySource) {
                    cellDateAttr = Number(DateService.normalizeDate(new Date(cellDateAttr)));
                }
                let cellDate: Date = new Date();
                if (isStepDragging.current && !info.isAllDaySource && !info.isMonthView) {
                    const lastEvt: MouseEvent | TouchEvent | undefined = dragStateRef.current.lastDragEvent;
                    const coordinates: Point = lastEvt ? info.getPointerCoordinates(lastEvt) : { clientY: null, clientX: null };
                    const containerRectSnap: DOMRect | undefined = containerEl?.getBoundingClientRect();
                    const minutesPerPixel: number = dragStateValuesRef.current.minutesPerPixel;
                    let computedMinutes: number = cellDateAttr;
                    if (containerRectSnap && coordinates.clientY != null && minutesPerPixel > 0) {
                        let minutesFromTop: number = Math.max(0, Math.round(((coordinates.clientY - containerRectSnap.top) +
                            containerEl.scrollTop) * minutesPerPixel));
                        const activeInterval: number = Math.max(0, info.slotInterval || 0);
                        if (activeInterval > 0) {
                            minutesFromTop = Math.floor(minutesFromTop / activeInterval) * activeInterval;
                        }
                        const { schedulerStartMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
                        const dayStart: Date = new Date(cellDateAttr);
                        dayStart.setHours(0, 0, 0, 0);
                        computedMinutes = dayStart.getTime() + (schedulerStartMinutes + minutesFromTop) * 60000;
                        computedMinutes = computedMinutes - durationRef.current;
                    } else {
                        computedMinutes = (cellDateAttr - durationRef.current);
                    }
                    cellDate = new Date(computedMinutes);
                } else {
                    cellDateAttr = (cellDateAttr - durationRef.current);
                    cellDate = new Date(cellDateAttr);
                }
                if (isNaN(cellDate.getTime())) { return; }
                dragStateValuesRef.current.finalDragStartTime = new Date(cellDate);
                const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
                const duration: number = Math.max(0, eventInfo?.endTime.getTime() - eventInfo?.startTime.getTime());
                dragStateValuesRef.current.finalDragEndTime = new Date(dragStateValuesRef.current.finalDragStartTime.getTime() + duration);
            }
        }
    };

    const getDiffDuration: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent): void => {
        const cell: HTMLElement | null = dragInfo.current.getCellUnderPointer(args.event);
        if (!(cell && dragInfo.current)) { return; }
        if (cell && data) {
            const cellDateAttr: string | null = cell.getAttribute('data-date');
            if (!cellDateAttr || isNaN(Number(cellDateAttr))) { return; }
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            if (!eventInfo) { return; }
            const originalStartTs: number = new Date(eventInfo.startTime).getTime();
            durationRef.current = Number(cellDateAttr) - originalStartTs;
        }
    };

    const handleDrag: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent) => {
        if (!dragInfo.current) { return; }
        getAutoScroll(args);
        let cell: HTMLElement | null = dragInfo.current.getCellUnderPointer(args.event);
        if (!cell) {
            cell = getCurrentTargetCell(args.target);
        }
        if (cell) {
            let newStartDate: Date = new Date(Number(cell.getAttribute('data-date')));
            dragStateRef.current.lastDragEvent = args.event;
            updateTimeLabel(cell);
            if (dragStateValuesRef.current.finalDragStartTime) {
                newStartDate = dragStateValuesRef.current.finalDragStartTime;
            }
            updateStartandEndTime(newStartDate);
        }
        onDrag?.({ ...args, data });
    };

    const resetElementDragState: () => void = (): void => {
        elementRef.current?.removeAttribute('aria-grabbed');
        elementRef.current?.classList.remove(CSS_CLASSES.DRAGGING);
        if (document?.body) { document.body.style.cursor = 'default'; }
        if (dragInfo.current?.cloneRef?.parentElement) {
            dragInfo.current.cloneRef.parentElement.removeChild(dragInfo.current.cloneRef);
        }
    };

    const removeDragCloneNode: () => void = (): void => {
        if (dragInfo.current) { dragInfo.current.cloneRef = null; }
    };

    const updateDropCellAndTimestamp: (args: SchedulerDragEvent) => { cell: HTMLElement | null; finalDropTimestamp: number | null; } =
        (args: SchedulerDragEvent): { cell: HTMLElement | null; finalDropTimestamp: number | null } => {
            let cell: HTMLElement | null = null;
            let finalDropTimestamp: number | null = null;
            if (dragInfo.current?.isAllDaySource) {
                cell = dragInfo.current?.getCellUnderClone(elementRef.current) ||
                    dragInfo.current?.getCellUnderPointer(args.event);
            } else {
                cell = dragInfo.current?.getCellUnderPointer(args.event);
            }

            if (cell) {
                const dropDate: string | null = cell.getAttribute('data-date');
                finalDropTimestamp = dropDate ? Number(dropDate) : dragInfo.current?.getCurrentTargetDate(args.target, cell);
            }

            return { cell, finalDropTimestamp };
        };

    const getCurrentTargetCell: (target: HTMLElement | null) => HTMLElement | null = (target: HTMLElement | null): HTMLElement | null => {
        if (!target) { return null; }
        return target.closest(`.${CSS_CLASSES.WORK_CELLS}, .${CSS_CLASSES.DAY_WRAPPER}, .${CSS_CLASSES.ALL_DAY_CELL}`) as HTMLElement | null;
    };

    const computeNewTimes: (original: EventModel , finalDropTimestamp: number) => {
        originalStart: Date; originalEnd: Date; durationMs: number; newStartTime: Date; newEndTime: Date;
    } = (original: EventModel, finalDropTimestamp: number): {
        originalStart: Date; originalEnd: Date; durationMs: number; newStartTime: Date; newEndTime: Date } => {
        const originalStart: Date = new Date(original.startTime);
        const originalEnd: Date = new Date(original.endTime);
        const durationMs: number = Math.max(0, originalEnd.getTime() - originalStart.getTime());
        let newStartTime: Date = new Date(finalDropTimestamp);
        if (dragInfo.current?.isAllDaySource) {
            DateService.setHours(newStartTime, originalStart);
        } else if (dragInfo.current?.isMonthView) {
            newStartTime = DateService.normalizeDate(newStartTime);
            DateService.setHours(newStartTime, originalStart);
        } else {
            finalDropTimestamp = (finalDropTimestamp - durationRef.current);
            newStartTime = new Date(finalDropTimestamp);
        }
        const newEndTime: Date = new Date(newStartTime.getTime() + durationMs);
        if (dragInfo.current?.isAllDaySource) {
            DateService.setHours(newEndTime, originalEnd);
        }
        return { originalStart, originalEnd, durationMs, newStartTime, newEndTime };
    };

    const getUpdateEvent: (original: EventModel, newStartTime: Date, newEndTime: Date, args: SchedulerDragEvent) => void =
        (original: EventModel, newStartTime: Date, newEndTime: Date, args: SchedulerDragEvent) => {
            if (!dragInfo.current) { return; }
            const updatedEvent: EventModel = dragInfo.current.updateDatasource(original, newStartTime, newEndTime, schedulerRef);
            endDragCleanup();
            args.cancel = true;
            onDragStop?.({ ...args, data: updatedEvent });
        };

    const isAllowDrop: (cell: HTMLElement | null) => boolean = useCallback((cell: HTMLElement | null): boolean => {
        if (!excludedArea.current) { return true; }
        const excludeSelectors: string[] = excludedArea.current.split(',');
        for (const selector of excludeSelectors) {
            if ((cell as HTMLElement)?.classList.contains(selector.trim())) { return false; }
        }
        return true;
    }, []);

    const handleDragStop: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent) => {
        if (!dragInfo.current) { return; }
        resetElementDragState();
        if (args.element) {
            const tableWrap: HTMLElement | null = args.element.closest(`.${CSS_CLASSES.TABLE_WRAP}`);
            if (tableWrap) {
                dragInfo.current.cloneRef = tableWrap.querySelector(`.${CSS_CLASSES.APPOINTMENT}.${CSS_CLASSES.EVENT_CLONE}`);
            }
        }
        const { cell, finalDropTimestamp } = updateDropCellAndTimestamp(args);
        removeDragCloneNode();
        cloneEventState?.hide();
        const original: EventModel = Array.isArray(data) ? (data[0] as EventModel) : data;

        const revertAndAlert: (titleKey: string, messageKey: string) => void = (titleKey: string, messageKey: string): void => {
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            if (eventInfo) {
                eventInfo.startTime = eventData.startTime;
                eventInfo.endTime = eventData.endTime;
            }
            endDragCleanup();
            args.cancel = true;
            confirmationDialog?.show({
                title: getString(titleKey),
                message: getString(messageKey),
                confirmText: getString('ok'),
                showCancel: false,
                onConfirm: () => confirmationDialog.hide()
            });
            onDragStop?.({ ...args, data: original });
            dragInfo.current = null;
        };

        if (isAllowDrop(cell)) {
            let newStartTime: Date;
            let newEndTime: Date;
            if (dragStateValuesRef.current.finalDragStartTime && dragStateValuesRef.current.finalDragEndTime) {
                newStartTime = dragStateValuesRef.current.finalDragStartTime;
                newEndTime = dragStateValuesRef.current.finalDragEndTime;
            } else if (cell && finalDropTimestamp) {
                const { newStartTime: start, newEndTime: end } = computeNewTimes(original, finalDropTimestamp);
                newStartTime = start;
                newEndTime = end;
            }
            if (newStartTime && newEndTime) {
                const updatedEvent: EventModel = { ...original, startTime: newStartTime, endTime: newEndTime };

                if (!eventOverlap && EventService.checkEventOverlap(updatedEvent, eventsData, true)) {
                    revertAndAlert('eventOverlap', 'overlapAlert');
                    return;
                }

                if (EventService.isBlockRange(updatedEvent, eventsData, true)) {
                    revertAndAlert('alert', 'blockAlert');
                    return;
                }
                getUpdateEvent(original, newStartTime, newEndTime, args);
                return;
            }
        } else {
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            eventInfo.startTime = original.startTime;
            eventInfo.endTime = original.endTime;
        }
        endDragCleanup();
        onDragStop?.({ ...args, data });
        dragInfo.current = null;
    };

    useDraggable(dragTargetRef, {
        clone: true,
        cursorAt: { left: -5, top: -5 },
        dragArea: `.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}`,
        abort: `.${CSS_CLASSES.EVENT_RESIZE_CLASS}, .${CSS_CLASSES.LEFT_RESIZE_HANDLER}, .${CSS_CLASSES.RIGHT_RESIZE_HANDLER}, .${CSS_CLASSES.TOP_RESIZE_HANDLER}, .${CSS_CLASSES.BOTTOM_RESIZE_HANDLER}, .${CSS_CLASSES.BLOCK_APPOINTMENT}`,
        distance: 5,
        helper: (args: HelperEvent) => createHelperClone(args),
        dragStart: (args: SchedulerDragEvent) => handleDragStart(args),
        drag: (args: SchedulerDragEvent) => handleDrag(args),
        dragStop: (args: SchedulerDragEvent) => handleDragStop(args)
    });

    const composedProps: React.HTMLAttributes<HTMLDivElement> = {
        ...(containerProps || {}),
        onClick: (e: React.MouseEvent<HTMLDivElement> | Event) => {
            dragInfo.current?.suppressEvent(e as Event);
            if (dragInfo.current?.isActionPerformed) {
                return;
            }
            (containerProps)?.onClick?.(e as React.MouseEvent<HTMLDivElement>);
        }
    } as React.HTMLAttributes<HTMLDivElement>;

    return { mergedRef, composedProps };
}
