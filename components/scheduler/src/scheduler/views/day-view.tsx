import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { DayViewProps } from '../types/scheduler-types';

export const DayView: FC<DayViewProps> = () => {
    return <VerticalView viewType={'Day'} />;
};
DayView.displayName = 'DayView';
