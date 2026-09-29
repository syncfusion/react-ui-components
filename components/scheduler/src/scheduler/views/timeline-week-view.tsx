import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { TimelineWeekViewProps } from '../types/scheduler-types';
import { TimelineView } from './timeline-view';

/**
 * TimelineWeekView - displays horizontal timeline view of a seven-day period.
 *
 * @param {TimelineWeekViewProps} props - The component props
 * @returns {JSX.Element} The rendered component.
 */
export const TimelineWeekView: FC<TimelineWeekViewProps> = (props: TimelineWeekViewProps) => {
    useEffect(() => {
        initializeTelemetryFeature('TimelineWeekView', 'Scheduler');
    }, []);

    return <TimelineView {...props} />;
};

TimelineWeekView.displayName = 'TimelineWeekView';

export default TimelineWeekView;

