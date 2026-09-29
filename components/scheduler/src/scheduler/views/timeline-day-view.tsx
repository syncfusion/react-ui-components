import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { TimelineDayViewProps } from '../types/scheduler-types';
import { TimelineView } from './timeline-view';

/**
 * TimelineDayView - displays horizontal timeline view of one or more days.
 *
 * @param {TimelineDayViewProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const TimelineDayView: FC<TimelineDayViewProps> = (props: TimelineDayViewProps) => {
    useEffect(() => {
        initializeTelemetryFeature('TimelineDayView', 'Scheduler');
    }, []);

    return <TimelineView {...props} />;
};

TimelineDayView.displayName = 'TimelineDayView';

export default TimelineDayView;

