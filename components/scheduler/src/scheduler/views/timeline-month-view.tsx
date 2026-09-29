import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { TimelineMonthViewProps } from '../types/scheduler-types';
import { TimelineView } from './timeline-view';

/**
 * TimelineMonthView - displays horizontal timeline layout for month dates.
 *
 * @param {TimelineMonthViewProps} props - The component props.
 * @returns {JSX.Element} The rendered component.
 */
export const TimelineMonthView: FC<TimelineMonthViewProps> = (props: TimelineMonthViewProps) => {
    useEffect(() => {
        initializeTelemetryFeature('TimelineMonthView', 'Scheduler');
    }, []);
    return <TimelineView {...props} />;
};

TimelineMonthView.displayName = 'TimelineMonthView';

export default TimelineMonthView;

