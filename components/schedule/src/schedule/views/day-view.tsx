import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { ViewSpecificProps } from '../types/schedule-types';

export const DayView: FC<ViewSpecificProps> = () => {
    return <VerticalView viewType={'Day'} />;
};
DayView.displayName = 'DayView';
