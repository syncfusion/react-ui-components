import { FC } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { ProcessedEventsData } from '../types/internal-interface';
import { useEventRendering } from '../hooks/useEventRendering';
import { useSchedulerPropsContext } from '../context/scheduler-context';

export const TimeSlotEventClone: FC<ProcessedEventsData> = (eventInfo: ProcessedEventsData) => {
    const { isTimelineView } = useSchedulerPropsContext();
    const { getEventContent, getTimelineTimeSlotEventContent } = useEventRendering({ variant: 'timeSlot' });

    return (
        <div
            className={`${CSS_CLASSES.APPOINTMENT} ${CSS_CLASSES.EVENT_CLONE}`}
            style={eventInfo.eventStyle}
        >
            {isTimelineView ? getTimelineTimeSlotEventContent(eventInfo) : getEventContent(eventInfo)}
        </div>
    );
};

export default TimeSlotEventClone;
