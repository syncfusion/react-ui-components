import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { ViewSpecificProps } from '../types/schedule-types';

export const WorkWeekView: FC<ViewSpecificProps> = () => {
    return <VerticalView viewType={'WorkWeek'} />;
};
WorkWeekView.displayName = 'WorkWeekView';
