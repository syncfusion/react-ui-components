import { ForwardedRef, RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDraggable, useProviderContext, Touch, HelperEvent, isNullOrUndefined } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CSS_CLASSES } from '../common/constants';
import { DateService, MINUTES_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '../services/DateService';
import { EventModel, SchedulerDragEvent, SchedulerNavigateProps } from '../types/scheduler-types';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { CloneBase } from '../utils/clone-manager';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { EventService } from '../services/EventService';
import { ActiveViewProps, AlertDialog, ProcessedEventsData } from '../types/internal-interface';
import { useSchedulerLocalization } from '../common/locale';
import { IScheduler } from '../scheduler';
import { View, AlertType } from '../types/enums';
import { getRecurrenceStringFromDate } from '../../recurrence-editor/util';
import { editOccurrenceValidation, updateDatasource } from '../utils/event-base';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { useSetResourceValues } from './useResourceGrouping';
import { getGroupIndexFromElement } from '../utils/actions';

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
    const activeViewProps: ActiveViewProps = useSchedulerPropsContext();
    const { timeScale, startHour, endHour, schedulerRef, eventSettings, showWeekend, workDays,
        onDragStart, onDrag, onDragStop, eventOverlap, confirmationDialog, eventDrag, enableRecurrenceValidation,
        handleNextClick, handlePreviousClick, timezone, resources } = activeViewProps;
    const eventData: EventModel = useMemo(() => {
        return {
            ...data,
            startTime: new Date(data?.startTime),
            endTime: new Date(data?.endTime)
        };
    }, [data]);

    const { getString } = useSchedulerLocalization();
    const { dir } = useProviderContext();
    const { eventsData, eventsProcessed } = useSchedulerEventsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { metadata } = useResourceGroupingContext();
    const cloneEventState: CloneEventContextValue = useCloneEventContext();
    const setResourceValues: (groupIndex: number) => Record<string, any> = useSetResourceValues();
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
    const currentTarget: RefObject<HTMLElement | RefObject<IScheduler>> = useRef<HTMLElement | RefObject<IScheduler>>(null);
    const currenView: RefObject<View> = useRef<View>(null);
    const isAllDayEvent: RefObject<boolean> = useRef<boolean>(false);
    const navigationIntervalRef: RefObject<number | null> = useRef<number | null>(null);
    const clientXRef: RefObject<number | null> = useRef<number | null>(null);
    const targetGroupIndex: RefObject<number | undefined> = useRef<number | undefined>(undefined);

    Touch(elementRef, {
        tapHold: () => { isScrollingRef.current = false; }
    });

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

    // This function used for day view autoscroll
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

    const endDragCleanup: () => void = useCallback(() => {
        cellHeightRef.current = 0;
        durationRef.current = 0;
        dragStateRef.current = {};
        excludedArea.current = null;
        isStepDragging.current = false;
        if (dragInfo.current) {
            dragInfo.current.setCursorClass('default');
            dragInfo.current.isActionPerformed = false;
            dragInfo.current.enableScroll = true;
            if (dragInfo.current.scrollInterval != null) {
                cancelAnimationFrame(dragInfo.current.scrollInterval);
                dragInfo.current.scrollInterval = null;
            }
            dragInfo.current?.removeDocListenersRef?.();
        }
        if (navigationIntervalRef.current != null) {
            window.clearInterval(navigationIntervalRef.current as number);
            navigationIntervalRef.current = null;
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
    }, []);

    useEffect(() => {
        return () => { endDragCleanup(); };
    }, [endDragCleanup]);

    const getSyncClone: () => void = (): void => {
        (scrollAnimationRef).current = null;
        if (!dragInfo.current || dragInfo.current.scrollInterval == null) { return; }
        const lastEvt: MouseEvent | TouchEvent | undefined = dragStateRef.current.lastDragEvent;
        if (lastEvt) {
            let cell: HTMLElement | null = dragInfo.current.getCellUnderPointer(lastEvt);
            if (!cell) {
                const target: HTMLElement | null = (lastEvt.target as HTMLElement | null) || null;
                cell = dragInfo.current.getCurrentTargetCell(target);
            }
            if (cell && dragInfo.current.currentCell) {
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
        const element: HTMLElement = eventDrag.externalDragAndDrop ?
            dragInfo.current.getCellUnderPointer(e) || elementRef.current : elementRef.current || dragInfo.current.currentCell;
        dragInfo.current.performAutoScrolling(e, element);
        if (dragInfo.current.scrollInterval !== null && scrollAnimationRef.current === null && !dragInfo.current.isMonthView) {
            (scrollAnimationRef).current = requestAnimationFrame(getSyncClone);
        }
    }, [getSnapPosition]);

    const initDragSource: (source: HTMLElement) => HTMLElement | null = (source: HTMLElement): HTMLElement | null => {
        const contentWrap: HTMLElement | null = dragInfo.current.getContentWrap(source);
        dragInfo.current.isAllDaySource = isAllDayEvent.current = source.classList.contains(`${CSS_CLASSES.ALL_DAY_APPOINTMENT}`);
        if (dragInfo.current.isAllDaySource) {
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            eventInfo.endTime =
                new Date(DateService.normalizeDate(eventInfo.endTime).getTime() + dragInfo.current.slotInterval * MS_PER_MINUTE);
        }
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
            if (eventDrag?.externalDragAndDrop) {
                if (dragInfo.current.isMonthView) {
                    clone.classList.add(`${CSS_CLASSES.MONTH_EVENT}`);
                }
                const isDayEvent: boolean = dragInfo.current.isMonthView || dragInfo.current.isAllDaySource;
                if (!isDayEvent) {
                    clone.style.height = elementRef.current.style.height;
                }
                clone.style.width = `${isDayEvent ? elementRef.current.clientWidth : dragInfo.current.cellWidth}px`;
            } else {
                clone.style.width = '1px';
                clone.style.height = '1px';
            }
            ((eventDrag.externalDragAndDrop && document?.querySelector(eventDrag.eventDragArea))
                || contentWrap || document?.body)?.appendChild(clone);
        };

    const getTargetSchedulerHost: () => HTMLElement | null = (): HTMLElement | null => {
        const wrap: HTMLElement | null = dragInfo.current?.getContentWrap(dragInfo.current?.currentCell);
        const node: HTMLElement | RefObject<IScheduler> | null = (wrap?.closest?.(`.${CSS_CLASSES.TABLE_WRAP}`) as HTMLElement)
            || currentTarget.current || schedulerRef.current?.element || null;
        return node as HTMLElement;
    };

    const dispatchCloneShow: (segments: ProcessedEventsData[], isDayEvent: boolean) => void =
        (segments: ProcessedEventsData[], isDayEvent: boolean): void => {
            const node: HTMLElement | null = getTargetSchedulerHost();
            if (!node) { return; }
            const detail: { container?: HTMLElement; payload?: { guid?: string; segments?: ProcessedEventsData[]; isDayEvent?: boolean; }; }
                = { container: node, payload: { guid: data.guid, segments, isDayEvent } };
            window?.dispatchEvent(new CustomEvent('showCloneEvent', { detail }));
        };

    const dispatchCloneHide: () => void = (): void => {
        dragInfo.current.currentCell = currentTarget.current = null;
        const schedulers: NodeListOf<Element> = document?.querySelectorAll(`.${CSS_CLASSES.SCHEDULER}`);
        if (!schedulers.length) { return; }
        schedulers.forEach((scheduler: Element) =>
            window?.dispatchEvent(new CustomEvent('hideCloneEvent', { detail: { container: scheduler } })));
    };

    const getDuration: (eventInfo: EventModel) => number = (eventInfo: EventModel): number => {
        if (!eventInfo) { return 0; }
        let durationMs: number = 0;
        if (isAllDayEvent.current && !dragInfo.current.isAllDaySource && eventInfo?.isAllDay && !dragInfo.current.isMonthView) {
            durationMs = dragInfo.current.slotInterval * MS_PER_MINUTE;
        } else if (isAllDayEvent.current && dragInfo.current.isAllDaySource) {
            durationMs = Math.max(0, eventData.endTime.getTime() - eventData.startTime.getTime());
        } else {
            durationMs = Math.max(0, eventInfo.endTime.getTime() - eventInfo.startTime.getTime());
        }
        if (durationMs === 0 && (eventInfo.startTime.getTime() === eventInfo.endTime.getTime())) {
            durationMs = dragInfo.current.slotInterval * MS_PER_MINUTE;
        }
        return durationMs;
    };

    const updateStartandEndTime: (newStartDate?: Date, currentCellDate?: Date, lastCellDate?: Date) => void =
    (newStartDate?: Date, currentCellDate?: Date, lastCellDate?: Date): void => {
        const isExternal: boolean = eventDrag.externalDragAndDrop;
        const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
        if (!eventInfo || !dragInfo.current) { return; }
        let currentRenderDates: Date[] = renderDates;
        if (newStartDate) {
            const durationMs: number = getDuration(eventInfo);
            eventInfo.startTime = new Date(newStartDate);
            eventInfo.endTime = new Date(eventInfo.startTime.getTime() + durationMs);
        }
        if ((isExternal || eventDrag?.navigation?.enable) && newStartDate) {
            const normalizedCurrentDate: number = DateService.normalizeDate(currentCellDate ?? newStartDate).getTime();
            const existsInRender: boolean = currentRenderDates.some((d: Date) =>
                DateService.normalizeDate(d).getTime() === normalizedCurrentDate
            );
            if (!existsInRender || activeViewProps.view !== currenView.current) {
                activeViewProps.selectedDate = currentCellDate ?? newStartDate;
                currentRenderDates = DateService.getRenderDates(
                    currenView.current,
                    activeViewProps.selectedDate,
                    activeViewProps, currentCellDate, lastCellDate
                );
            }
        }
        const isDayEvent: boolean = dragInfo.current.isMonthView || dragInfo.current.isAllDaySource;
        if (isDayEvent || !timeScale.enable) {
            const segments: ProcessedEventsData[] = EventService.processCloneEvent(isExternal ?
                currentTarget.current as HTMLDivElement : schedulerRef.current?.element, currentRenderDates,
                                                                                   eventInfo, showWeekend, workDays,
                                                                                   dragInfo.current.cellWidth,
                                                                                   dragInfo.current.isAllDaySource, dir === 'rtl',
                                                                                   dragInfo.current.isMonthView, elementRef.current,
                                                                                   resources, targetGroupIndex.current, metadata,
                                                                                   eventSettings?.resourceColorField
            );
            if (isExternal) {
                dispatchCloneShow(segments, isDayEvent);
            } else {
                cloneEventState?.show({ guid: data.guid, segments, isDayEvent: isDayEvent });
            }
            return;
        }

        const segments: ProcessedEventsData[] = EventService.processTimeSlotCloneEvent(isExternal ?
            currentTarget.current as HTMLDivElement : schedulerRef.current?.element, currentRenderDates,
                                                                                       eventInfo, timeScale, startHour, endHour,
                                                                                       dragInfo.current.cellWidth, dir === 'rtl', cellHeightRef.current || undefined,
                                                                                       resources, targetGroupIndex.current, metadata,
                                                                                       eventSettings?.resourceColorField);
        if (isExternal) {
            dispatchCloneShow(segments, false);
        } else {
            cloneEventState?.show({ guid: data.guid, segments, isDayEvent: false });
        }
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
        dragInfo.current.direction = dir;
        dragInfo.current.slotInterval = timeScale?.interval / timeScale?.slotCount;
        currenView.current = activeViewProps.view as View;
        const source: HTMLElement = elementRef.current;
        const contentWrap: HTMLElement | null = initDragSource(source);
        const clone: HTMLElement = dragInfo.current.cloneFromSource(source, eventDrag);
        finalizeClone(clone, contentWrap);
        return clone;
    };

    const handleDragStart: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent) => {
        if (!dragInfo.current) { return; }
        dragStateRef.current = {};
        const info: CloneBase = dragInfo.current;
        info.isActionPerformed = true;
        getDiffDuration(args);
        info.addDocSuppressors();
        elementRef.current?.classList.add(CSS_CLASSES.DRAGGING);
        dragInfo.current.setCursorClass('move');
        dragStateRef.current.lastDragEvent = args.event;
        getUpdateDragOffsets(args);
        const startArgs: SchedulerDragEvent = { ...args, data };
        onDragStart?.(startArgs);
        if (startArgs.cancel) {
            args.cancel = true;
            resetElementDragState();
            endDragCleanup();
            dragInfo.current = null;
            return;
        }
        if (eventDrag) {
            if (eventDrag.interval) {
                isStepDragging.current = info.slotInterval !== eventDrag.interval;
                info.slotInterval = eventDrag.interval;
            }
            info.enableScroll = eventDrag.scroll?.enable ?? true;
            info.minScrollSpeed = eventDrag.scroll?.scrollBy ?? info.minScrollSpeed;
            info.minScrollThreshold = eventDrag.scroll?.timeDelay ?? info.minScrollThreshold;
            excludedArea.current = eventDrag.excludeSelectors ?? null;
        }
    };

    const getUpdateDragOffsets: (args: SchedulerDragEvent) => void = (args: SchedulerDragEvent): void => {
        try {
            const src: HTMLElement | null = elementRef.current;
            if (!src) { return; }
            const container: HTMLElement | null = dragInfo.current.getContentWrap(src);
            const containerRect: DOMRect | undefined = container?.getBoundingClientRect();
            const { clientY, clientX }: { clientY: number | null; clientX: number | null } =
                dragInfo.current.getPointerCoordinates(args.event);
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
            handleAutoScroll(args.event);
        }
    };

    const updateTimeLabel: (cell: HTMLElement | null) => void = (cell: HTMLElement | null): void => {
        if (!(dragInfo.current?.cloneRef && cell && dragInfo.current)) { return; }
        const info: CloneBase = dragInfo.current;
        const containerEl: HTMLElement | null = info.getContentWrap(cell);
        const containerRect: DOMRect | undefined = containerEl?.getBoundingClientRect();
        if (containerRect) {
            targetGroupIndex.current = getGroupIndexFromElement(cell);
            if (data) {
                let cellDateAttr: number | null = Number(cell.getAttribute('data-date'));
                if (!cellDateAttr || isNaN(cellDateAttr)) { return; }
                if (info.isAllDaySource) {
                    cellDateAttr = Number(DateService.normalizeDate(new Date(cellDateAttr)));
                }
                let cellDate: Date = new Date();
                if (activeViewProps.view === currenView.current) {
                    if (isAllDayEvent.current && !info.isAllDaySource) {
                        cellDate = new Date(cellDateAttr);
                    } else if (isStepDragging.current && !info.isAllDaySource && !info.isMonthView) {
                        const { schedulerStartMinutes } = DateService.getSchedulerStartAndEndMinutes(startHour, endHour);
                        cellDate = dragInfo.current.getSteppedCellDate(schedulerStartMinutes, dragStateRef.current.lastDragEvent,
                                                                       durationRef.current, dragStateValuesRef.current.minutesPerPixel,
                                                                       cellDateAttr, containerEl);
                    } else {
                        if (info.isAllDaySource === isAllDayEvent.current) {
                            cellDateAttr = (cellDateAttr - durationRef.current);
                        }
                        cellDate = new Date(cellDateAttr);
                    }
                } else {
                    cellDate = new Date(cellDateAttr);
                    if (eventDrag.externalDragAndDrop && currenView.current === 'Month') {
                        DateService.setHours(cellDate, eventData.startTime);
                    }
                }
                if (isNaN(cellDate.getTime())) { return; }
                dragStateValuesRef.current.finalDragStartTime = new Date(cellDate);
                const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
                const duration: number = getDuration(eventInfo);
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
        let cell: HTMLElement | null = dragInfo.current.getCellUnderPointer(args.event);
        if (!cell) {
            cell = dragInfo.current.getCurrentTargetCell(args.target);
        }
        if (eventDrag.externalDragAndDrop) {
            dispatchCloneHide();
            if (activeViewProps.view !== currenView.current) {
                dragInfo.current.cellWidth = args.target.closest(`.${CSS_CLASSES.SCHEDULER}`)?.
                    querySelector(`.${CSS_CLASSES.WORK_CELLS}[data-date], .${CSS_CLASSES.ALL_DAY_CELL}`)?.clientWidth ??
                    elementRef.current.clientWidth;
            }
            dragInfo.current.isMonthView = !!(cell || args.target)?.closest(`.${CSS_CLASSES.MONTH_VIEW}`);
            if ((cell || args.target)?.closest(`.${CSS_CLASSES.DAY_VIEW}`)) {
                currenView.current = 'Day';
            } else if ((cell || args.target)?.closest(`.${CSS_CLASSES.WEEK_VIEW}`)) {
                currenView.current = 'Week';
            } else if ((cell || args.target)?.closest(`.${CSS_CLASSES.WORK_WEEK_VIEW}`)) {
                currenView.current = 'WorkWeek';
            } else if (dragInfo.current.isMonthView) {
                currenView.current = 'Month';
            }
        }
        dragInfo.current.currentCell = cell;
        if (!dragInfo.current.isMonthView) {
            dragInfo.current.isAllDaySource = data.isAllDay = (cell || args.target)?.classList.contains(CSS_CLASSES.ALL_DAY_CELL) ||
                !!args.target?.closest(`.${CSS_CLASSES.DATE_HEADER_CONTAINER}`);
        }
        if (cell) {
            dragInfo.current.setCursorClass('move');
            clientXRef.current = (args.event as MouseEvent).clientX;
            updateNavigatingPosition();
            getAutoScroll(args);
            if (eventDrag.externalDragAndDrop) {
                currentTarget.current = cell.closest(`.${CSS_CLASSES.SCHEDULER}`) as HTMLElement;
                dragInfo.current.cloneRef.classList.add(CSS_CLASSES.DRAG_CLONE);
            }
            const targetCellHeight: number = cell.offsetHeight ?? 0;
            if (targetCellHeight > 0) {
                cellHeightRef.current = targetCellHeight;
            }
            let currentCellDate: Date = new Date(Number(cell.getAttribute('data-date')));
            let newStartDate: Date = currentCellDate;
            let lastCellDate: Date = currentCellDate;
            if (dragInfo.current.isMonthView) {
                const workCells: NodeListOf<Element> = cell.closest(`.${CSS_CLASSES.CONTENT_TABLE}`)?.
                    querySelectorAll(`.${CSS_CLASSES.WORK_CELLS}`);
                currentCellDate = new Date(Number(workCells[0]?.getAttribute('data-date')));
                lastCellDate = new Date(Number(workCells[workCells?.length - 1]?.getAttribute('data-date')));
            }
            dragStateRef.current.lastDragEvent = args.event;
            updateTimeLabel(cell);
            if (dragStateValuesRef.current.finalDragStartTime) {
                newStartDate = dragStateValuesRef.current.finalDragStartTime;
            }
            updateStartandEndTime(newStartDate, currentCellDate, lastCellDate);
        }
        else if (eventDrag.externalDragAndDrop) {
            if ((args.target?.closest?.(
                `.${CSS_CLASSES.SCHEDULER_TOOLBAR_CONTAINER}, .${CSS_CLASSES.STICKY_HEADER}, .${CSS_CLASSES.HEADER_SECTION},
                .${CSS_CLASSES.HEADER_ROW}, .${CSS_CLASSES.LEFT_INDENT}`
            )) && document?.body) {
                dragInfo.current.setCursorClass('notAllowed');
            }
            else if (document?.body) {
                dragInfo.current.setCursorClass('default');
            }
            dragInfo.current.cloneRef.classList.remove(CSS_CLASSES.DRAG_CLONE);
        }
        onDrag?.({ ...args, data });
    };

    const resetElementDragState: () => void = (): void => {
        elementRef.current?.removeAttribute('aria-grabbed');
        elementRef.current?.classList.remove(CSS_CLASSES.DRAGGING);
        dragInfo.current.setCursorClass('default');
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
                cell = dragInfo.current?.getCellUnderClone(dragInfo.current?.cloneRef) ||
                    dragInfo.current?.getCellUnderPointer(args.event);
            } else {
                cell = dragInfo.current?.getCellUnderPointer(args.event);
            }
            if (!cell) {
                cell = dragInfo.current?.getCurrentTargetCell(args.target);
            }

            if (cell) {
                const dropDate: string | null = cell.getAttribute('data-date');
                finalDropTimestamp = dropDate ? Number(dropDate) : dragInfo.current?.getCurrentTargetDate(args.target, cell);
            }

            return { cell, finalDropTimestamp };
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
            const resourceFields: Record<string, any> = (!isNullOrUndefined(targetGroupIndex.current))
                ? setResourceValues(targetGroupIndex.current) :
                {};
            const updatedEvent: EventModel =
                updateDatasource(original, newStartTime, newEndTime, schedulerRef, eventSettings.fields, eventsData, timezone,
                                 resourceFields);
            endDragCleanup();
            args.cancel = true;
            onDragStop?.({ ...args, data: updatedEvent });
        };

    const isAllowDrop: (cell: HTMLElement | null) => boolean = useCallback((cell: HTMLElement | null): boolean => {
        if (!excludedArea.current) { return true; }
        const excludeSelectors: string[] = excludedArea.current.split(',');
        for (const selector of excludeSelectors) {
            if (cell?.classList.contains(selector.trim())) { return false; }
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
        if (eventDrag.externalDragAndDrop) {
            dispatchCloneHide();
        } else {
            cloneEventState?.hide();
        }
        const original: EventModel = Array.isArray(data) ? data[0] : data;

        const revertAndAlert: (titleKey?: string, messageKey?: string) => void = (titleKey?: string, messageKey?: string): void => {
            const eventInfo: EventModel = EventService.getEventByGuid(eventsData, data.guid);
            if (eventInfo) {
                eventInfo.startTime = eventData.startTime;
                eventInfo.endTime = eventData.endTime;
                eventInfo.isAllDay = eventData.isAllDay;
            }
            endDragCleanup();
            args.cancel = true;
            if (titleKey !== null && messageKey !== null) {
                confirmationDialog?.show({
                    title: getString(titleKey),
                    message: getString(messageKey),
                    confirmText: getString('ok'),
                    showCancel: false,
                    onConfirm: () => confirmationDialog.hide()
                });
            }
            onDragStop?.({ ...args, data: original });
            dragInfo.current = null;
        };

        if (!cell) {
            revertAndAlert(null, null);
            return;
        }

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

                if (!eventOverlap && EventService.checkEventOverlap(updatedEvent, eventsData)) {
                    revertAndAlert('eventOverlap', 'overlapAlert');
                    return;
                }

                if (EventService.isBlockRange(updatedEvent, eventsData)) {
                    revertAndAlert('alert', 'blockAlert');
                    return;
                }
                if (isAllDayEvent.current && dragInfo.current.isMonthView) {
                    data.isAllDay = true;
                }
                if (original.recurrenceID && original.recurrenceRule) {
                    original.startTime = eventData.startTime;
                    original.endTime = eventData.endTime;
                    const recurrenceValidation: AlertDialog = enableRecurrenceValidation ?
                        editOccurrenceValidation(original, newStartTime, newEndTime, eventsProcessed, eventsData) :
                        { isValid: true, shouldAlert: false };
                    if (!recurrenceValidation.isValid) {
                        const messageKey: string = recurrenceValidation.messageKey || AlertType.SameDayAlert;
                        revertAndAlert('alert', messageKey);
                        return;
                    } else {
                        original.recurrenceException = original.recurrenceException ?? getRecurrenceStringFromDate(eventData.startTime);
                    }
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
        cursorAt: eventDrag?.externalDragAndDrop ? { left: -20, top: -20 } : { left: -5, top: -5 },
        dragArea: eventDrag?.eventDragArea ?? `.${CSS_CLASSES.CONTENT_WRAP}, .${CSS_CLASSES.CONTENT_TABLE}`,
        abort: `.${CSS_CLASSES.EVENT_RESIZE_CLASS}, .${CSS_CLASSES.LEFT_RESIZE_HANDLER}, .${CSS_CLASSES.RIGHT_RESIZE_HANDLER}, .${CSS_CLASSES.TOP_RESIZE_HANDLER}, .${CSS_CLASSES.BOTTOM_RESIZE_HANDLER}, .${CSS_CLASSES.BLOCK_APPOINTMENT}`,
        distance: 5,
        helper: (args: HelperEvent) => createHelperClone(args),
        onDragStart: (args: SchedulerDragEvent) => handleDragStart(args),
        onDrag: (args: SchedulerDragEvent) => handleDrag(args),
        onDragStop: (args: SchedulerDragEvent) => handleDragStop(args),
        enableTailMode: eventDrag?.externalDragAndDrop
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

    const viewNavigation: () => void = useCallback((): void => {
        if (!dragInfo.current) { return; }
        const container: HTMLElement | null = dragInfo.current.getContentWrap(elementRef.current || dragInfo.current.currentCell);
        if (!container) { return; }
        const rect: DOMRect = container.getBoundingClientRect();
        if (clientXRef.current == null) { return; }
        if (container.scrollLeft === 0 &&
            Math.round(clientXRef.current) <= Math.round(rect.left + dragInfo.current.cellWidth + window.pageXOffset)) {
            if (handlePreviousClick && dir !== 'rtl') {
                handlePreviousClick();
            } else {
                handleNextClick?.();
            }
        } else if (Math.round(container.scrollLeft + container.clientWidth) === container.scrollWidth &&
            Math.round(clientXRef.current) >= Math.round(rect.right - dragInfo.current.cellWidth + window.pageXOffset)) {
            if (handleNextClick && dir !== 'rtl') {
                handleNextClick();
            } else {
                handlePreviousClick?.();
            }
        }
    }, [dragInfo, dir, handlePreviousClick, handleNextClick]);

    const updateNavigatingPosition: () => void = useCallback((): void => {
        const navigation: SchedulerNavigateProps = eventDrag?.navigation;
        if (!navigation?.enable) { return; }
        navigation.timeDelay = navigation.timeDelay ?? 2000;
        if (navigationIntervalRef.current == null) {
            let currentDate: Date = new Date();
            navigationIntervalRef.current = window.setInterval(() => {
                if (currentDate) {
                    const now: Date = new Date();
                    const end: number = now.getSeconds();
                    let start: number = currentDate.getSeconds() + (navigation.timeDelay / MS_PER_SECOND);
                    start = (start >= MINUTES_PER_HOUR) ? start - MINUTES_PER_HOUR : start;
                    if (start === end) {
                        currentDate = new Date();
                        viewNavigation();
                    }
                }
            }, navigation.timeDelay);
        }
    }, [eventDrag, viewNavigation]);

    return { mergedRef, composedProps };
}
