import { FC, JSX, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DayEventClone } from './day-event-clone';
import { TimeSlotEventClone } from './time-slot-event-clone';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { ProcessedEventsData, TimelineProcessedEvent } from '../types/internal-interface';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useTimelineEvents } from '../hooks/useTimelineEvents';
import { CSS_CLASSES } from '../common/constants';
import { DEFAULT_TIMELINE_EVENT_HEIGHT } from '../services/EventService';

export const CloneEvent: FC = () => {
    const state: CloneEventContextValue = useCloneEventContext();
    const { schedulerRef, isTimelineView } = useSchedulerPropsContext();
    const isInternalTimelineDrag: boolean = !!(isTimelineView && state.visible && state.draggedEvent);
    const overrideEventsData: TimelineProcessedEvent['event'][] | undefined = useMemo(() => (
        isInternalTimelineDrag && state.draggedEvent ? [state.draggedEvent] : undefined
    ), [isInternalTimelineDrag, state.draggedEvent]);
    const { allEvents: draggedCloneEvents } = useTimelineEvents(
        DEFAULT_TIMELINE_EVENT_HEIGHT, overrideEventsData, isInternalTimelineDrag ? (state.sourceTopPx ?? 0) : 0
    );

    useEffect(() => {
        const onShow: (e: Event) => void = (e: Event) => {
            const detail: { container?: HTMLElement; payload?: { guid?: string; segments?: ProcessedEventsData[]; isDayEvent?: boolean; }; }
                = ((e as CustomEvent)?.detail || {});
            const mainTarget: HTMLElement = schedulerRef.current?.element;
            if (mainTarget && detail?.container && (detail.container === mainTarget || mainTarget.contains(detail.container))) {
                state.show({ guid: detail.payload?.guid, segments: detail.payload?.segments, isDayEvent: detail.payload?.isDayEvent });
            }
        };
        const onHide: (e: Event) => void = (e: Event) => {
            const detail: { container?: HTMLElement } = ((e as CustomEvent)?.detail || {});
            const mainTarget: HTMLElement = schedulerRef.current?.element;
            if (mainTarget && detail?.container && (detail.container === mainTarget || mainTarget.contains(detail.container))) {
                state.hide();
            }
        };
        window?.addEventListener('showCloneEvent', onShow);
        window?.addEventListener('hideCloneEvent', onHide);
        return () => {
            window?.removeEventListener('showCloneEvent', onShow);
            window?.removeEventListener('hideCloneEvent', onHide);
        };
    }, [schedulerRef, state]);

    const useDayEventClone: boolean = !!(state.isDayEvent && !isTimelineView);
    const selector: string =
        useDayEventClone ? CSS_CLASSES.DAY_CLONE_CONTAINER : CSS_CLASSES.TIME_SLOT_CLONE_CONTAINER;
    const container: HTMLElement = schedulerRef.current?.element?.querySelector(`.${selector}`);

    const content: JSX.Element = isInternalTimelineDrag ? (
        <>
            {draggedCloneEvents.map((evt: TimelineProcessedEvent, index: number) => (
                <TimeSlotEventClone key={`${evt.eventKey ?? index}-${index}`} {...evt} />
            ))}
        </>
    ) : (
        <>
            {state.visible && state.segments.map((segment: ProcessedEventsData, index: number) => (
                useDayEventClone ? (
                    <DayEventClone key={`${segment?.guid}-${index}`}
                        {...segment}
                    />
                ) : (
                    <TimeSlotEventClone key={`${segment?.guid}-${index}`}
                        {...segment}
                    />
                )
            ))}
        </>
    );

    return container ? createPortal(content, container) : null;
};

export default CloneEvent;
