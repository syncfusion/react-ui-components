import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { TimelineWorkWeekViewProps } from '../types/scheduler-types';
import { TimelineView } from './timeline-view';

/**
 * TimelineWorkWeekView - displays horizontal timeline layout for working days (Mon-Fri).
 *
 * @param {TimelineWorkWeekViewProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const TimelineWorkWeekView: FC<TimelineWorkWeekViewProps> = (props: TimelineWorkWeekViewProps) => {
    useEffect(() => {
        initializeTelemetryFeature('TimelineWorkWeekView', 'Scheduler');
    }, []);

    return <TimelineView {...props} />;
};

TimelineWorkWeekView.displayName = 'TimelineWorkWeekView';

export default TimelineWorkWeekView;

