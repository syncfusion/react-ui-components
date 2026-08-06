import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { VerticalView } from './vertical-view';
import { DayViewProps } from '../types/scheduler-types';

export const DayView: FC<DayViewProps> = () => {
    useEffect(() => {
        initializeTelemetryFeature('DayView', 'schedule');
    }, []);

    return <VerticalView viewType={'Day'} />;
};
DayView.displayName = 'DayView';
