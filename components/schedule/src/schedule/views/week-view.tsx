import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { ViewSpecificProps } from '../types/schedule-types';

export const WeekView: FC<ViewSpecificProps> = () => {
    return <VerticalView viewType={'Week'} />;
};
WeekView.displayName = 'WeekView';
