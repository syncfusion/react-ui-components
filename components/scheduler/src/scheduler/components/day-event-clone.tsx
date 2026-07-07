import { FC, ReactNode } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { useEventRendering } from '../hooks/useEventRendering';

export const DayEventClone: FC<ProcessedEventsData> = (props: ProcessedEventsData) => {
    const { event, eventStyle, totalSegments, isOverflowLeft = false, isOverflowRight = false } = props;

    const { getEventContent } = useEventRendering({
        variant: 'day',
        event,
        totalSegments,
        isOverflowLeft,
        isOverflowRight
    });

    const content: ReactNode = getEventContent();

    return (
        <div
            className={`${CSS_CLASSES.APPOINTMENT} ${CSS_CLASSES.EVENT_CLONE}`}
            style={eventStyle}
        >
            {content}
        </div>
    );
};

export default DayEventClone;
