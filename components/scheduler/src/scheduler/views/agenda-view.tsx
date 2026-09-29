import { FC, ReactNode, useEffect } from 'react';
import { initializeTelemetryFeature } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import { AgendaViewProps } from '../types/scheduler-types';
import { useAgendaView, AgendaDateGroup as AgendaDateGroupType } from '../hooks/useAgendaView';
import { AgendaDateGroup } from '../components/agenda-date-group';
import { AgendaEmptyState } from '../components/agenda-empty-state';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { DateService } from '../services/DateService';
import { AgendaResourceRow } from '../components/agenda-resource-row';
import { AgendaResourceRowByDate } from '../components/agenda-resource-row-by-date';
import { AgendaDateHeader } from '../components/agenda-date-header';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { useOnScroll } from '../hooks/useOnScroll';

/**
 * AgendaView component displays events in a chronological, date-grouped list format.
 * Events are sorted by date and then by start time within each date.
 * Drag-drop and resize interactions are not applicable to this list-based view.
 *
 * @example
 * ```tsx
 * <Scheduler>
 *   <AgendaView agendaDaysCount={7} />
 * </Scheduler>
 * ```
 *
 * @param {AgendaViewProps} props - AgendaViewProps configuration
 * @returns {ReactNode} The rendered Agenda View component
 */
export const AgendaView: FC<AgendaViewProps> = (): ReactNode => {
    const { dateGroups, leafAgendaMap, dateResourceMap } = useAgendaView();
    const { isGroupingEnabled, resourceTree, groupConfig, isCompact, selectedLeaf } = useResourceGroupingContext();
    const byDate: boolean = groupConfig?.byDate;
    const { onScroll } = useOnScroll();

    useEffect(() => {
        initializeTelemetryFeature('AgendaView', 'Scheduler');
    }, []);

    return (
        <div className={CSS_CLASSES.AGENDA_VIEW}>
            <div className={CSS_CLASSES.MAIN_SCROLL_CONTAINER} onScroll={onScroll}>
                <div className={CSS_CLASSES.CONTENT_SECTION}>
                    {(!dateGroups || dateGroups.length === 0) ? (
                        <AgendaEmptyState />
                    ) : isGroupingEnabled && !isCompact ? (
                        byDate ? (
                            dateGroups.map((group: AgendaDateGroupType) => {
                                const dateKey: string = DateService.generateDateKey(group.date);
                                return (
                                    <div className={CSS_CLASSES.AGENDA_DATE_GROUP} key={group.date.getTime()}>
                                        <AgendaDateHeader date={group.date} />
                                        <div className={CSS_CLASSES.AGENDA_RESOURCE_ROWS}>
                                            {resourceTree.map((resourceLevel: ResourceLevel) => (
                                                <AgendaResourceRowByDate
                                                    key={resourceLevel.groupOrder.join('-')}
                                                    resourceLevel={resourceLevel}
                                                    dateKey={dateKey}
                                                    dateResourceMap={dateResourceMap}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={CSS_CLASSES.AGENDA_RESOURCE_ROWS}>
                                {resourceTree.map((resourceLevel: ResourceLevel) => (
                                    <AgendaResourceRow
                                        key={resourceLevel.groupOrder.join('-')}
                                        resourceLevel={resourceLevel}
                                        leafAgendaMap={leafAgendaMap}
                                    />
                                ))}
                            </div>
                        )
                    ) : (
                        dateGroups.map((group: AgendaDateGroupType) => (
                            <AgendaDateGroup
                                key={group.date.getTime()}
                                date={group.date}
                                events={group.events}
                                groupIndex={selectedLeaf?.groupIndex}
                                groupOrder={selectedLeaf?.groupOrder}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

AgendaView.displayName = 'AgendaView';
