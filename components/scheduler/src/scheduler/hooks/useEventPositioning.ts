import { useMemo, CSSProperties } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { EventModel } from '../types/scheduler-types';
import { PositioningService } from '../services/PositioningService';

/**
 * Interface for the props accepted by useEventPositioning hook
 */
interface UseEventPositioningProps {
    /**
     * The event information
     */
    eventInfo: ProcessedEventsData;

    /**
     * The dates being rendered in the current view
     */
    renderDates: Date[];
}

/**
 * Interface for overflow directions
 */
interface OverflowDirection {
    /**
     * Whether the event overflows to the left
     */
    isOverflowLeft: boolean;

    /**
     * Whether the event overflows to the right
     */
    isOverflowRight: boolean;
}

/**
 * Interface for the result of useEventPositioning hook
 */
interface UseEventPositioningResult {
    /**
     * The processed event model
     */
    processedEvent: EventModel;

    /**
     * Overflow direction indicators for spanned events
     */
    overflowDirection: OverflowDirection;

    /**
     * CSS styles for positioning the event
     */
    positionStyle: CSSProperties;
}

/**
 * Custom hook to calculate positioning for event elements
 *
 * @param {UseEventPositioningProps} props - The props for event positioning
 * @returns {UseEventPositioningResult} - Positioning data for the event
 * @private
 */
export const useEventPositioning: (props: UseEventPositioningProps) => UseEventPositioningResult =
(props: UseEventPositioningProps): UseEventPositioningResult => {
    const { eventInfo, renderDates } = props;

    // Process event model
    const processedEvent: EventModel = useMemo(() => {
        return { ...eventInfo.event };
    }, [eventInfo]);

    // Calculate overflow direction
    const overflowDirection: OverflowDirection = useMemo(() => {
        return PositioningService.getOverflowDirection(eventInfo, renderDates);
    }, [eventInfo.event.startTime, eventInfo.event.endTime, renderDates, eventInfo]);

    // Calculate position style
    const positionStyle: CSSProperties = useMemo(() => {
        return PositioningService.calculatePositionStyles(eventInfo, renderDates);
    }, [eventInfo, renderDates]);

    return {
        processedEvent,
        overflowDirection,
        positionStyle
    };
};

export default useEventPositioning;
