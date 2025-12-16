import { FC } from 'react';
import { VerticalView } from './vertical-view';
import { WeekViewProps } from '../types/scheduler-types';

export const WeekView: FC<WeekViewProps> = () => {
    return <VerticalView viewType={'Week'} />;
};
WeekView.displayName = 'WeekView';
