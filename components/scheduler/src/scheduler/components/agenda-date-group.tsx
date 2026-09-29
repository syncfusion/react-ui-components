import { FC, ReactNode } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { ProcessedEventsData } from '../types/internal-interface';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { AgendaEventItem } from './agenda-event-item';
import { AgendaEmptyState } from './agenda-empty-state';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerLocalization } from '../common/locale';
import { AgendaDateHeader } from './agenda-date-header';

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

    /**
     * Optional group index for resource grouping
     * Set when rendering within a resource-grouped agenda view
     */
    groupIndex?: number;

    /**
     * Optional group order (resource hierarchy path) for resource grouping
     * Set when rendering within a resource-grouped agenda view
     * Used to retrieve resource color
     */
    groupOrder?: (number | string)[];
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
 *   groupIndex={0}
 *   groupOrder={[1]}
 * />
 * ```
 *
 * @param {AgendaDateGroupProps} props - AgendaDateGroupProps
 * @returns {ReactNode} The rendered date group component
 */
export const AgendaDateGroup: FC<AgendaDateGroupProps> = ({
    date,
    events,
    groupIndex,
    groupOrder
}: AgendaDateGroupProps): ReactNode => {
    const { locale } = useProviderContext();
    const { dateFormat } = useSchedulerPropsContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const eventsFor: string = getString('eventsFor');
    const formattedDate: string = formatDate(date, {
        format: dateFormat || 'EEEE, MMMM dd, yyyy',
        locale
    }) || '';

    return (
        <div className={CSS_CLASSES.AGENDA_DATE_GROUP} role="region" aria-label={`${eventsFor} ${formattedDate}`}>
            <div className={CSS_CLASSES.DATE_HEADER}>
                <AgendaDateHeader date={date} />
                <div className={CSS_CLASSES.AGENDA_EVENTS_CONTAINER}>
                    {events && events.length > 0 ? (
                        <ul className={CSS_CLASSES.AGENDA_EVENT_LIST}>
                            {events.map((eventData: ProcessedEventsData) => (
                                <AgendaEventItem key={`event-${eventData.event.id}-${eventData.startDate?.getTime()}`} eventData={eventData} groupIndex={groupIndex} groupOrder={groupOrder} />
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
