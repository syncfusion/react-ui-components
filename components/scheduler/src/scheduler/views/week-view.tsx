import { FC, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { VerticalView } from './vertical-view';
import { WeekViewProps } from '../types/scheduler-types';

export const WeekView: FC<WeekViewProps> = () => {
    useEffect(() => {
        initializeTelemetryFeature('WeekView', 'schedule');
    }, []);

    return <VerticalView viewType={'Week'} />;
};
WeekView.displayName = 'WeekView';
