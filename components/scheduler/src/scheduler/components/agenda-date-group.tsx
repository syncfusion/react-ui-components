import { FC, ReactNode, MouseEvent } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { ProcessedEventsData } from '../types/internal-interface';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { AgendaEventItem } from './agenda-event-item';
import { AgendaEmptyState } from './agenda-empty-state';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { DateService } from '../services/DateService';
import { useNavigate } from '../hooks/useDateHeader';
import { ViewService } from '../services/ViewService';
import { useSchedulerLocalization } from '../common/locale';

/**
 * Props for AgendaDateGroup component
 */
interface AgendaDateGroupProps {
    /**
     * Date object for this group
     */
    date: Date;

    /**
     * Events for this date, sorted by start time
     */
    events: ProcessedEventsData[];
}

/**
 * AgendaDateGroup component displays a single date's events as a grouped list
 * Includes a semantic date header and event list
 *
 * @example
 * ```tsx
 * <AgendaDateGroup
 *   date={new Date()}
 *   events={[...]}
 * />
 * ```
 *
 * @param {AgendaDateGroupProps} props - AgendaDateGroupProps
 * @returns {ReactNode} The rendered date group component
 */
export const AgendaDateGroup: FC<AgendaDateGroupProps> = ({
    date,
    events
}: AgendaDateGroupProps): ReactNode => {
    const { locale } = useProviderContext();
    const { dateHeader, dateFormat, getAvailableViews } = useSchedulerPropsContext();
    const { handleDateClick } = useNavigate();
    const dayNumber: string = DateService.formatDateRange(locale, date, undefined, 'd');
    const dayName: string = DateService.formatDateRange(locale, date, undefined, 'E');
    const isToday: boolean = DateService.isToday(date);
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const eventsFor: string = getString('eventsFor');
    const formattedDate: string = formatDate(date, {
        format: dateFormat || 'EEEE, MMMM dd, yyyy',
        locale
    }) || '';
    const isDayViewAvailable: boolean = ViewService.isDayViewAvailable(getAvailableViews);

    return (
        <div className={CSS_CLASSES.AGENDA_DATE_GROUP} role="region" aria-label={`${eventsFor} ${formattedDate}`}>
            <div className={CSS_CLASSES.DATE_HEADER}>
                <div className={`${CSS_CLASSES.AGENDA_DATE_LABEL} ${isToday ? CSS_CLASSES.CURRENT_DATE : ''}`}>
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
                <div className={CSS_CLASSES.AGENDA_EVENTS_CONTAINER}>
                    {events && events.length > 0 ? (
                        <ul className={CSS_CLASSES.AGENDA_EVENT_LIST}>
                            {events.map((eventData: ProcessedEventsData) => (
                                <AgendaEventItem key={`event-${eventData.event.id}-${eventData.startDate?.getTime()}`} eventData={eventData} />
                            ))}
                        </ul>
                    ) : (
                        <AgendaEmptyState className={CSS_CLASSES.AGENDA_NO_EVENTS} />
                    )}
                </div>
            </div>
        </div>
    );
};

AgendaDateGroup.displayName = 'AgendaDateGroup';
