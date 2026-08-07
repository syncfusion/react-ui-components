import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { VerticalView } from './vertical-view';
import { WorkWeekViewProps } from '../types/scheduler-types';

export const WorkWeekView: FC<WorkWeekViewProps> = () => {
    useEffect(() => {
        initializeTelemetryFeature('WorkWeekView', 'schedule');
    }, []);

    return <VerticalView viewType={'WorkWeek'} />;
};
WorkWeekView.displayName = 'WorkWeekView';
