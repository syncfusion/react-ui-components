import { FC, ReactNode } from 'react';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { ProcessedEventsData } from '../types/internal-interface';
import { AgendaEventItem } from './agenda-event-item';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { AgendaEmptyState } from './agenda-empty-state';

interface AgendaResourceRowByDateProps {
    resourceLevel: ResourceLevel;
    dateKey: string;
    dateResourceMap: Map<string, Map<string, ProcessedEventsData[]>>;
}

export const AgendaResourceRowByDate: FC<AgendaResourceRowByDateProps> = ({
    resourceLevel,
    dateKey,
    dateResourceMap
}: AgendaResourceRowByDateProps): ReactNode => {
    const { hideEmptyAgendaDays, resourceHeader } = useSchedulerPropsContext();
    const isLeaf: boolean = resourceLevel.children.length === 0;
    const textField: string = resourceLevel.resource.textField || '';
    const resourceName: string = resourceLevel.resourceData?.[`${textField}`] || '';

    const hasEventsForNode: (resourceNode: ResourceLevel) => boolean = (resourceNode: ResourceLevel): boolean => {
        const dateMap: Map<string, ProcessedEventsData[]> = dateResourceMap.get(dateKey);
        const resourceKey: string = resourceNode.groupOrder.join('-');
        const events: ProcessedEventsData[] = dateMap?.get(resourceKey) ?? [];
        if (events.length > 0) {
            return true;
        }
        return resourceNode.children.some((child: ResourceLevel) => hasEventsForNode(child));
    };

    if (hideEmptyAgendaDays && !hasEventsForNode(resourceLevel)) {
        return null;
    }

    if (isLeaf) {
        const resourceKey: string = resourceLevel.groupOrder.join('-');
        const events: ProcessedEventsData[] = dateResourceMap.get(dateKey)?.get(resourceKey) ?? [];

        return (
            <div className={`${CSS_CLASSES.AGENDA_RESOURCE_ROW} ${CSS_CLASSES.AGENDA_RESOURCE_ROW_LEAF} ${resourceLevel.cssClass || ''}`}>
                <div className={CSS_CLASSES.AGENDA_RESOURCE_NAME} title={resourceName}>
                    {resourceHeader ? resourceHeader({ resourceData: resourceLevel.resourceData, resource: resourceLevel.resource }) : (
                        <div className={CSS_CLASSES.ELLIPSIS}>{resourceName}</div>
                    )}
                </div>
                <div className={CSS_CLASSES.AGENDA_EVENTS_CONTAINER}>
                    {events.length > 0 ? (
                        <ul className={CSS_CLASSES.AGENDA_EVENT_LIST}>
                            {events.map((eventData: ProcessedEventsData) => (
                                <AgendaEventItem
                                    key={eventData.event.guid ?? eventData.event.id}
                                    eventData={eventData}
                                    groupIndex={resourceLevel.groupIndex}
                                    groupOrder={resourceLevel.groupOrder}
                                />
                            ))}
                        </ul>
                    ) : (
                        <AgendaEmptyState />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${CSS_CLASSES.AGENDA_RESOURCE_ROW} ${CSS_CLASSES.AGENDA_RESOURCE_ROW_BRANCH} ${resourceLevel.cssClass || ''}`}>
            <div className={CSS_CLASSES.AGENDA_RESOURCE_NAME} title={resourceName}>
                {resourceHeader ? resourceHeader({ resourceData: resourceLevel.resourceData, resource: resourceLevel.resource }) : (
                    <div className={CSS_CLASSES.ELLIPSIS}>{resourceName}</div>
                )}
            </div>
            <div className={CSS_CLASSES.AGENDA_RESOURCE_CHILDREN}>
                {resourceLevel.children.map((child: ResourceLevel) => (
                    <AgendaResourceRowByDate
                        key={child.groupOrder.join('-')}
                        resourceLevel={child}
                        dateKey={dateKey}
                        dateResourceMap={dateResourceMap}
                    />
                ))}
            </div>
        </div>
    );
};

AgendaResourceRowByDate.displayName = 'AgendaResourceRowByDate';
