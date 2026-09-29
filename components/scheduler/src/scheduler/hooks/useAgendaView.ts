import { useMemo } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { DateService } from '../services/DateService';
import { EventService } from '../services/EventService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { ResourceLevel } from '../services/ResourceGroupingService';

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
    leafAgendaMap: Map<string, AgendaDateGroup[]>;
    dateResourceMap: Map<string, Map<string, ProcessedEventsData[]>>;
}

/**
 * Custom hook to process and group events for Agenda View
 * Groups events by date, sorts by start time, and optionally filters empty dates
 *
 * @returns {UseAgendaViewResult} Grouped and sorted events for display
 * @private
 */
export function useAgendaView(): UseAgendaViewResult {
    const { agendaDaysCount, hideEmptyAgendaDays, showWeekend, workDays, interval, resources } = useSchedulerPropsContext();
    const { isGroupingEnabled, leafResources, groupConfig, isCompact, selectedLeaf } = useResourceGroupingContext();
    const { eventsData = [] } = useSchedulerEventsContext();
    const { renderDates = [] } = useSchedulerRenderDatesContext();
    const byDate: boolean = groupConfig?.byDate;
    const activeLeaf: ResourceLevel | undefined = isCompact ? selectedLeaf : undefined;

    const dateGroups: AgendaDateGroup[] = useMemo<AgendaDateGroup[]>((): AgendaDateGroup[] => {
        if (!eventsData || !renderDates || renderDates.length === 0) {
            return [];
        }

        try {
            const eventsByDateMap: Map<string, ProcessedEventsData[]> =
                EventService.processAgendaEvents(eventsData, renderDates, resources, activeLeaf);
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
    }, [eventsData, renderDates, agendaDaysCount, hideEmptyAgendaDays, showWeekend, workDays, interval, activeLeaf]);

    const leafAgendaMap: Map<string, AgendaDateGroup[]> = useMemo(() => {
        const map: Map<string, AgendaDateGroup[]> = new Map<string, AgendaDateGroup[]>();
        if (!isGroupingEnabled || byDate) {
            return map;
        }
        leafResources.forEach((resourceLeaf: ResourceLevel) => {
            const groupedDates: { events: ProcessedEventsData[]; date: Date; }[] =
            dateGroups.map((group: AgendaDateGroup) => ({
                ...group,
                events: group.events.filter((eventData: ProcessedEventsData) => {
                    const matches: boolean = EventService.matchesResource(eventData.event, resourceLeaf, resources);
                    return matches;
                })
            })).filter((group: AgendaDateGroup) => hideEmptyAgendaDays ? group.events.length > 0 : true);
            map.set(resourceLeaf.groupOrder.join('-'), groupedDates);
        });
        return map;
    }, [dateGroups, leafResources, isGroupingEnabled, byDate, hideEmptyAgendaDays]);

    const dateResourceMap: Map<string, Map<string, ProcessedEventsData[]>> = useMemo(() => {
        const result: Map<string, Map<string, ProcessedEventsData[]>> = new Map<string, Map<string, ProcessedEventsData[]>>();
        if (!isGroupingEnabled || !byDate) {
            return result;
        }
        dateGroups.forEach((group: AgendaDateGroup) => {
            const resourceEventsMap: Map<string, ProcessedEventsData[]> = new Map<string, ProcessedEventsData[]>();
            leafResources.forEach((resourceLeaf: ResourceLevel) => {
                const events: ProcessedEventsData[] = group.events.filter((eventData: ProcessedEventsData) =>
                    EventService.matchesResource(eventData.event, resourceLeaf, resources)
                );
                if (events.length > 0) {
                    resourceEventsMap.set(resourceLeaf.groupOrder.join('-'), events);
                }
            });
            result.set(DateService.generateDateKey(group.date), resourceEventsMap);
        });
        return result;
    }, [dateGroups, leafResources, isGroupingEnabled, byDate]);

    return {
        dateGroups,
        leafAgendaMap,
        dateResourceMap
    };
}
