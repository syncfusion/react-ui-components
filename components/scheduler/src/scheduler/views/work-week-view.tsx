import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { WorkWeekViewProps } from '../types/scheduler-types';

export const WorkWeekView: FC<WorkWeekViewProps> = () => {
    return <VerticalView viewType={'WorkWeek'} />;
};
WorkWeekView.displayName = 'WorkWeekView';
