import { useCallback, ReactNode, MouseEvent } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { EventModel, SchedulerEventClickEvent } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerLocalization } from '../common/locale';
import { clearAndSelectAppointment } from '../utils/actions';
import {
    getEventContent,
    getTimeSlotEventContent,
    getTimelineTimeSlotEventContent
} from '../components/event-render';

// ─── Day Event ───────────────────────────────────────────────────────────────

/**
 * Interface for useEventRendering hook parameters (day-event variant).
 */
interface DayEventRenderingProps {
    /** Discriminator to select day-event rendering logic. */
    variant: 'day';
    /** The event model to render. */
    event: EventModel;
    /** Number of segments if the event is spanned. */
    totalSegments?: number;
    /** Whether the event overflows to the left. */
    isOverflowLeft?: boolean;
    /** Whether the event overflows to the right. */
    isOverflowRight?: boolean;
}

// ─── Time-Slot Event ─────────────────────────────────────────────────────────

/**
 * Interface for useEventRendering hook parameters (time-slot variant).
 * Does not accept per-event data — the returned functions accept eventInfo
 * as a parameter, allowing a single hook call to serve all events in a loop.
 * Also exposes timeline-specific content getters bound from the same context.
 */
interface TimeSlotEventRenderingProps {
    /** Discriminator to select time-slot rendering logic. */
    variant: 'timeSlot';
}

// ─── Union ───────────────────────────────────────────────────────────────────

type UseEventRenderingProps = DayEventRenderingProps | TimeSlotEventRenderingProps;

interface UseEventRenderingHook {
    (props: DayEventRenderingProps): DayEventRenderingResult;
    (props: TimeSlotEventRenderingProps): TimeSlotEventRenderingResult;
    (): CommonEventHandlers;
}

// ─── Shared Event Handlers ───────────────────────────────────────────────────

/**
 * Common click/double-click handler signatures shared by both variants.
 * Accepts a flat `event` model and an `isBlocked` flag so the same
 * handler works for day-events (where `isBlockedEvent` is a prop) and
 * time-slot events (where `event.isBlock` is the flag).
 */
interface CommonEventHandlers {
    /**
     * Handles a click on an event element.
     * Early-exits for blocked events; calls `clearAndSelectAppointment`
     * and fires the `onEventClick` callback otherwise.
     */
    handleClick: (e: MouseEvent<HTMLDivElement>, event: EventModel, isBlocked: boolean) => void;
    /**
     * Handles a double-click on an event element.
     * Early-exits for readonly / blocked events; hides the quick popup
     * and fires the `onEventDoubleClick` callback otherwise.
     */
    handleDoubleClick: (e: MouseEvent<HTMLDivElement>, event: EventModel, isBlocked: boolean) => void;
}

/**
 * Result shape for the 'day' variant — rendering functions are zero-argument
 * because event data is bound at hook-call time.
 * Handlers accept the event and isBlocked flag per call.
 */
interface DayEventRenderingResult extends CommonEventHandlers {
    /**
     * Returns the resolved day/all-day event content based on event type.
     */
    getEventContent: () => ReactNode;
}

/**
 * Result shape for the 'timeSlot' variant — all rendering functions accept
 * eventInfo as a parameter so a single hook call serves all events in a loop.
 * Handlers accept the event and isBlocked flag per call.
 */
interface TimeSlotEventRenderingResult extends CommonEventHandlers {
    /** Returns the resolved vertical time-slot content for the given event. */
    getEventContent: (eventInfo: ProcessedEventsData) => ReactNode;
    /**
     * Returns timeline (horizontal) time-slot content for the given event.
     * Bound with the same locale/timeFormat/template/renderDates context.
     */
    getTimelineTimeSlotEventContent: (eventInfo: ProcessedEventsData) => ReactNode;
}

/**
 * Custom hook that provides memoized rendering methods for scheduler events.
 *
 * Supports two variants via the `variant` discriminator:
 * - `'day'`      → DayEvent / DayEventClone: zero-arg functions, event bound at hook-call time.
 * - `'timeSlot'` → Appointment / TimeSlotEventClone: functions accept `eventInfo` per call.
 *                  Exposes getEventContent (vertical) and getTimelineTimeSlotEventContent (timeline).
 * - `undefined`  → Only returns event handlers (handleClick, handleDoubleClick).
 *
 * Internally reads locale, timeFormat, eventTemplate and timescale settings once from context,
 * and delegates to pure utility functions in event-render. Callers should not re-read those
 * props just to build event content — use the bound getters returned by this hook.
 *
 * @param {UseEventRenderingProps} [props] - Rendering parameters for the selected variant.
 * @returns {DayEventRenderingResult|TimeSlotEventRenderingResult|CommonEventHandlers} Memoized rendering functions or handlers.
 * @private
 */
export const useEventRendering: UseEventRenderingHook = ((props?: UseEventRenderingProps):
DayEventRenderingResult | TimeSlotEventRenderingResult | CommonEventHandlers => {

    const {
        timeFormat,
        eventTemplate,
        startHourTuple,
        endHourTuple,
        timeScale,
        onEventClick,
        onEventDoubleClick,
        readOnly,
        quickPopupRef
    } = useSchedulerPropsContext();

    // ─── Shared handlers (created once — used by both variants) ─────────────
    //
    // Both day-events and time-slot events share identical click/double-click
    // logic. Callers normalise their data to (event, isBlocked) before calling,
    // so there is no need to duplicate these inside each builder.

    const handleClick: CommonEventHandlers['handleClick'] =
        useCallback((e: MouseEvent<HTMLDivElement>, event: EventModel, isBlocked: boolean): void => {
            if (isBlocked) {
                e?.preventDefault();
                e?.stopPropagation();
                return;
            }
            clearAndSelectAppointment(e.currentTarget);
            e.stopPropagation();
            if (onEventClick) {
                const eventClickArgs: SchedulerEventClickEvent = {
                    event: e,
                    data: event,
                    element: e.currentTarget
                };
                onEventClick(eventClickArgs);
            }
        }, [onEventClick]);

    const handleDoubleClick: CommonEventHandlers['handleDoubleClick'] =
        useCallback((e: MouseEvent<HTMLDivElement>, event: EventModel, isBlocked: boolean): void => {
            if (event.isReadonly || readOnly || isBlocked) {
                e?.preventDefault();
                e?.stopPropagation();
                return;
            }
            e.stopPropagation();
            if (onEventDoubleClick) {
                quickPopupRef?.current?.hide();
                const eventClickArgs: SchedulerEventClickEvent = {
                    event: e,
                    data: event,
                    element: e.currentTarget
                };
                onEventDoubleClick(eventClickArgs);
            }
        }, [onEventDoubleClick, readOnly, quickPopupRef]);

    // ─── Early Return (Handlers Only) ────────────────────────────────────────

    if (!props) {
        return { handleClick, handleDoubleClick };
    }

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { renderDates } = useSchedulerRenderDatesContext();

    const addTitleLabel: string = getString('addTitle');

    // ─── Variant discriminator and bound values ──────────────────────────────
    const isDayVariant: boolean = props.variant === 'day';

    const dayProps: DayEventRenderingProps | undefined = isDayVariant ? (props as DayEventRenderingProps) : undefined;
    const boundEvent: EventModel = dayProps?.event ?? ({} as EventModel);
    const boundTotalSegments: number | undefined = dayProps?.totalSegments;
    const boundOverflowLeft: boolean = dayProps?.isOverflowLeft ?? false;
    const boundOverflowRight: boolean = dayProps?.isOverflowRight ?? false;

    const timeScaleEnabled: boolean = !!(timeScale && timeScale.enable);

    // ── Builders: define rendering callbacks inside helper builders and call both
    // Builders are called unconditionally so hooks inside them remain stable.
    const buildDayCallbacks: () => DayEventRenderingResult = (): DayEventRenderingResult => {
        const getContent: () => ReactNode =
            useCallback((): ReactNode =>
                getEventContent(
                    eventTemplate, boundEvent, boundTotalSegments, boundOverflowLeft,
                    boundOverflowRight, locale, timeFormat, addTitleLabel
                ),
                        [eventTemplate, boundEvent, boundTotalSegments, boundOverflowLeft,
                            boundOverflowRight, locale, timeFormat, addTitleLabel]);

        return {
            getEventContent: getContent,
            handleClick,
            handleDoubleClick
        };
    };

    const buildSlotCallbacks: () => TimeSlotEventRenderingResult = (): TimeSlotEventRenderingResult => {
        const getContent: (eventInfo: ProcessedEventsData) => ReactNode = useCallback(
            (eventInfo: ProcessedEventsData): ReactNode =>
                getTimeSlotEventContent(
                    eventTemplate, eventInfo, renderDates, timeScaleEnabled,
                    timeFormat, locale, addTitleLabel, startHourTuple, endHourTuple
                ),
            [
                eventTemplate, renderDates, timeScaleEnabled, timeFormat, locale, addTitleLabel,
                startHourTuple, endHourTuple
            ]
        );

        const getTimelineContent: (eventInfo: ProcessedEventsData) => ReactNode = useCallback(
            (eventInfo: ProcessedEventsData): ReactNode =>
                getTimelineTimeSlotEventContent(
                    eventTemplate,
                    eventInfo,
                    renderDates,
                    timeFormat,
                    locale,
                    addTitleLabel,
                    startHourTuple,
                    endHourTuple
                ),
            [
                eventTemplate, renderDates, timeFormat, locale, addTitleLabel,
                startHourTuple, endHourTuple
            ]
        );

        return {
            getEventContent: getContent,
            getTimelineTimeSlotEventContent: getTimelineContent,
            handleClick,
            handleDoubleClick
        };
    };

    // Call builders unconditionally to ensure hook order stability
    const dayCallbacks: DayEventRenderingResult = buildDayCallbacks();
    const slotCallbacks: TimeSlotEventRenderingResult = buildSlotCallbacks();

    return isDayVariant ? dayCallbacks : slotCallbacks;
}) as UseEventRenderingHook;

export default useEventRendering;
