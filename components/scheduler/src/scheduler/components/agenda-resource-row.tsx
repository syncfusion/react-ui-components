import { FC, ReactNode } from 'react';
import { ResourceLevel } from '../services/ResourceGroupingService';
import { AgendaDateGroup } from './agenda-date-group';
import { AgendaEmptyState } from './agenda-empty-state';
import { AgendaDateGroup as AgendaDateGroupType } from '../hooks/useAgendaView';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';

export interface AgendaResourceRowProps {
    resourceLevel: ResourceLevel;
    leafAgendaMap: Map<string, AgendaDateGroupType[]>;
}

export const AgendaResourceRow: FC<AgendaResourceRowProps> = ({
    resourceLevel,
    leafAgendaMap
}: AgendaResourceRowProps): ReactNode => {
    const { resourceHeader, hideEmptyAgendaDays } = useSchedulerPropsContext();
    const { isCompact } = useResourceGroupingContext();
    const textField: string = resourceLevel.resource.textField || '';
    const resourceName: string = resourceLevel.resourceData?.[`${textField}`] || '';
    const isLastLevelResource: boolean = resourceLevel.children.length === 0;

    const hasEventsInSubtree: (resourceNode: ResourceLevel) => boolean = (resourceNode: ResourceLevel): boolean => {
        if (resourceNode.children.length === 0) {
            const nodeKey: string = resourceNode.groupOrder.join('-');
            const dateGroups: AgendaDateGroupType[] = leafAgendaMap.get(nodeKey) || [];
            return dateGroups.length > 0;
        }
        return resourceNode.children.some((child: ResourceLevel) => hasEventsInSubtree(child));
    };

    const renderResourceLabel: () => ReactNode = (): ReactNode => {
        if (isCompact) {
            return null;
        }
        return (
            <div
                className={CSS_CLASSES.AGENDA_RESOURCE_NAME}
                title={resourceName}
            >
                {resourceHeader ? resourceHeader({
                    resourceData: resourceLevel.resourceData,
                    resource: resourceLevel.resource
                }) : (
                    <div className={CSS_CLASSES.ELLIPSIS}>
                        {resourceName}
                    </div>
                )}
            </div>
        );
    };

    if (hideEmptyAgendaDays && !hasEventsInSubtree(resourceLevel)) {
        return null;
    }

    if (isLastLevelResource) {
        const nodeKey: string = resourceLevel.groupOrder.join('-');
        const dateGroups: AgendaDateGroupType[] = leafAgendaMap.get(nodeKey) || [];

        return (
            <div className={`${CSS_CLASSES.AGENDA_RESOURCE_ROW} ${CSS_CLASSES.AGENDA_RESOURCE_ROW_LEAF} ${resourceLevel.cssClass || ''}`}>
                {renderResourceLabel()}
                <div className={CSS_CLASSES.AGENDA_RESOURCE_CONTENT}>
                    {dateGroups.length > 0 ? (
                        dateGroups.map((group: AgendaDateGroupType) => (
                            <AgendaDateGroup
                                key={group.date.getTime()}
                                date={group.date}
                                events={group.events}
                                groupIndex={resourceLevel.groupIndex}
                                groupOrder={resourceLevel.groupOrder}
                            />
                        ))
                    ) : (
                        <AgendaEmptyState />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`${CSS_CLASSES.AGENDA_RESOURCE_ROW} ${CSS_CLASSES.AGENDA_RESOURCE_ROW_BRANCH} ${resourceLevel.cssClass || ''}`}>
            {renderResourceLabel()}
            <div className={CSS_CLASSES.AGENDA_RESOURCE_CHILDREN}>
                {resourceLevel.children.map((child: ResourceLevel) => (
                    <AgendaResourceRow key={child.groupOrder.join('|')} resourceLevel={child} leafAgendaMap={leafAgendaMap} />
                ))}
            </div>
        </div>
    );
};

AgendaResourceRow.displayName = 'AgendaResourceRow';
