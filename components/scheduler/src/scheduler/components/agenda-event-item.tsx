import { FC, useCallback, ReactNode, MouseEvent, KeyboardEvent } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { ProcessedEventsData } from '../types/internal-interface';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { EventService } from '../services/EventService';
import { DateService, MS_PER_DAY } from '../services/DateService';
import { RecurrenceIcon } from './recurrence-icon';
import { useEventRendering } from '../hooks/useEventRendering';

/**
 * Props for AgendaEventItem component
 */
interface AgendaEventItemProps {
    /**
     * The processed event information
     */
    eventData: ProcessedEventsData;

    /**
     * Unique key for this event (includes date context for proper React reconciliation)
     * Format: ${date.toISOString()}-${event.id}
     */
    eventKey?: string;
}

/**
 * AgendaEventItem component displays a single event in the agenda list.
 * Supports custom event templates via `eventTemplate` prop in the Agenda View configuration.
 * Falls back to default rendering if no template is provided.
 * Supports keyboard and mouse interactions:
 * - Tab: Navigate through appointments
 * - Single Click/Enter: Opens quick popup for quick preview/actions
 * - Double Click: Opens full editor popup for editing/deleting
 * - Escape: Blur from focused element
 * Uses existing sf-appointment-* classes for consistency.
 *
 * Wrapped in React.memo for performance optimization. Re-renders only when event data actually changes.
 *
 * @example
 * ```tsx
 * <AgendaEventItem eventData={eventDataObject} eventKey="2026-04-15T00:00:00.000Z-123" />
 * ```
 *
 * @param {AgendaEventItemProps} props - AgendaEventItemProps
 * @returns {ReactNode} The rendered event item component
 */
export const AgendaEventItem: FC<AgendaEventItemProps> = ({ eventData }: AgendaEventItemProps): ReactNode => {
    const { eventTemplate, timeFormat, readOnly } = useSchedulerPropsContext();
    const { event, startDate, endDate, segmentIndex = 0, totalSegments = 1 } = eventData;
    const { subject, location } = event;
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const { handleClick: onHandleClick, handleDoubleClick: onHandleDoubleClick } = useEventRendering();
    const allDayLabel: string = getString('allDay');
    const dayLabel: string = getString('day');
    const addTitleLabel: string = getString('addTitle');
    const ariaLabel: string = EventService.getAriaLabel(event);

    const getTimeString: () => string = (): string => {
        if (!startDate || !endDate) {
            return '';
        }

        const timezoneDiff: number = (endDate.getTimezoneOffset() !== startDate.getTimezoneOffset()) ? 3600000 : 0;
        const duration: number = endDate.getTime() - startDate.getTime() + timezoneDiff;
        const isEntireDay: boolean = event.isAllDay || (duration / MS_PER_DAY) >= 1;
        let timeString: string = isEntireDay ? allDayLabel :
            DateService.formatTimeDisplay({ ...event, startTime: startDate, endTime: endDate }, locale, timeFormat);

        if (totalSegments > 1) {
            const currentIndex: number = segmentIndex + 1;
            const displayIndex: number = currentIndex > totalSegments ? totalSegments : currentIndex;
            timeString += ` (${dayLabel} ${displayIndex}/${totalSegments})`;
        }

        return timeString;
    };

    const timeString: string = getTimeString();

    const handleClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback(
        (e: MouseEvent<HTMLLIElement>): void => {
            onHandleClick(e as unknown as MouseEvent<HTMLDivElement>, event, !!event.isBlock);
        },
        [event, onHandleClick]
    );

    const handleDoubleClick: (e: MouseEvent<HTMLLIElement>) => void = useCallback(
        (e: MouseEvent<HTMLLIElement>): void => {
            onHandleDoubleClick(e as unknown as MouseEvent<HTMLDivElement>, event, !!event.isBlock);
        },
        [event, onHandleDoubleClick]
    );

    const handleKeyDown: (e: KeyboardEvent<HTMLLIElement>) => void = useCallback(
        (e: KeyboardEvent<HTMLLIElement>): void => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleClick(e as unknown as MouseEvent<HTMLLIElement>);
            } else if (e.key === 'Escape') {
                (e.currentTarget as HTMLElement).blur();
            }
        },
        [handleClick]
    );

    const renderContent: () => ReactNode = (): ReactNode => {
        if (eventTemplate) {
            return (
                <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                    {eventTemplate(event)}
                    <RecurrenceIcon event={event} />
                </div>
            );
        }

        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                <div className={CSS_CLASSES.AGENDA_EVENT_SUBJECT_WRAP}>
                    <div className={CSS_CLASSES.SUBJECT}>
                        {subject || addTitleLabel}{location ? ', ' : ''}
                    </div>
                    {location && (
                        <div className={CSS_CLASSES.LOCATION}>{location}</div>
                    )}
                    <RecurrenceIcon event={event} />
                </div>
                {timeString && (
                    <div className={CSS_CLASSES.TIME}>{timeString}</div>
                )}
            </div>
        );
    };

    return (
        <li
            className={CSS_CLASSES.APPOINTMENT}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            data-id={event.id}
            data-guid={event.guid}
            tabIndex={0}
            aria-label={ariaLabel}
            aria-disabled={event.isReadonly || readOnly ? 'true' : 'false'}
        >
            {renderContent()}
        </li>
    );
};

AgendaEventItem.displayName = 'AgendaEventItem';

export default AgendaEventItem;
