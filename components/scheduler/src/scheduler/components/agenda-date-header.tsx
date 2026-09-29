import { FC, ReactNode, MouseEvent } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { DateService } from '../services/DateService';
import { useNavigate } from '../hooks/useDateHeader';
import { ViewService } from '../services/ViewService';
import { ResourceGroupingContextType, useResourceGroupingContext } from '../context/resource-grouping-context';
import { SchedulerGroup } from '../types/scheduler-types';

export interface AgendaDateHeaderProps {
    date: Date;
}

export const AgendaDateHeader: FC<AgendaDateHeaderProps> = ({ date }: AgendaDateHeaderProps): ReactNode => {
    const { locale } = useProviderContext();
    const { dateHeader, getAvailableViews } = useSchedulerPropsContext();
    const resourceGroupingContext: ResourceGroupingContextType = useResourceGroupingContext();
    const groupConfig: SchedulerGroup = resourceGroupingContext?.groupConfig;
    const { handleDateClick } = useNavigate();
    const dayNumber: string = DateService.formatDateRange(locale, date, undefined, 'd');
    const dayName: string = DateService.formatDateRange(locale, date, undefined, 'E');
    const isToday: boolean = DateService.isToday(date);
    const isDayViewAvailable: boolean = ViewService.isDayViewAvailable(getAvailableViews);
    const byDate: boolean = groupConfig?.byDate;

    return (
        <div className={`${CSS_CLASSES.AGENDA_DATE_LABEL} ${isToday ? CSS_CLASSES.CURRENT_DATE : ''} ${byDate ? CSS_CLASSES.AGENDA_RESOURCE_GROUP_BY_DATE : ''}`}>
            {dateHeader ? (
                dateHeader({ date })
            ) : (
                <>
                    <div
                        className={`${CSS_CLASSES.AGENDA_DATE_NUMBER} ${isDayViewAvailable ? CSS_CLASSES.LINK : ''}`}
                        onClick={(e: MouseEvent<HTMLElement>) => handleDateClick(e, date)}
                    >
                        {dayNumber}
                    </div>
                    <div className={CSS_CLASSES.AGENDA_DATE_NAME}>{dayName}</div>
                </>
            )}
        </div>
    );
};

AgendaDateHeader.displayName = 'AgendaDateHeader';
