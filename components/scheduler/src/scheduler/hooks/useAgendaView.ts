import { useMemo } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';

/**
 * Represents a grouped collection of events for a specific date
 */
export interface AgendaDateGroup {
    date: Date;
    events: ProcessedEventsData[];
}

/**
 * Result of the useAgendaView hook
 */
interface UseAgendaViewResult {
    dateGroups: AgendaDateGroup[];
}

/**
 * Custom hook to process and group events for Agenda View
 * Groups events by date, sorts by start time, and optionally filters empty dates
 *
 * @returns {UseAgendaViewResult} Grouped and sorted events for display
 * @private
 */
export function useAgendaView(): UseAgendaViewResult {
    const {
        agendaDaysCount,
        hideEmptyAgendaDays,
        showWeekend,
        workDays,
        interval
    } = useSchedulerPropsContext();
    const { eventsData = [] } = useSchedulerEventsContext();
    const { renderDates = [] } = useSchedulerRenderDatesContext();

    const dateGroups: AgendaDateGroup[] = useMemo<AgendaDateGroup[]>((): AgendaDateGroup[] => {
        if (!eventsData || !renderDates || renderDates.length === 0) {
            return [];
        }

        try {
            const eventsByDateMap: Map<string, ProcessedEventsData[]> = EventService.processAgendaEvents(eventsData, renderDates);
            const groups: AgendaDateGroup[] = [];
            let daysAdded: number = 0;
            const totalDaysToShow: number = agendaDaysCount * interval;

            for (const renderedDate of renderDates) {
                if (daysAdded >= totalDaysToShow) {
                    break;
                }

                if (!renderedDate || (!showWeekend && !DateService.isWorkDay(renderedDate, workDays))) {
                    continue;
                }

                const dateKey: string = DateService.generateDateKey(renderedDate);
                const events: ProcessedEventsData[] = eventsByDateMap.get(dateKey) || [];

                if (hideEmptyAgendaDays && events.length === 0) {
                    continue;
                }

                groups.push({
                    date: renderedDate,
                    events
                });

                daysAdded++;
            }

            return groups;
        } catch (error: unknown) {
            console.error('Error processing agenda view events:', error);
            return [];
        }
    }, [eventsData, renderDates, agendaDaysCount, hideEmptyAgendaDays, showWeekend, workDays, interval]);

    return {
        dateGroups
    };
}
