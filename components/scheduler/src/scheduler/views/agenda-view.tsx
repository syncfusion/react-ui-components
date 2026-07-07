import { FC, ReactNode } from 'react';
import { CSS_CLASSES } from '../common/constants';
import { AgendaViewProps } from '../types/scheduler-types';
import { useAgendaView, AgendaDateGroup as AgendaDateGroupType } from '../hooks/useAgendaView';
import { AgendaDateGroup } from '../components/agenda-date-group';
import { AgendaEmptyState } from '../components/agenda-empty-state';

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
    const { dateGroups } = useAgendaView();

    return (
        <div className={`${CSS_CLASSES.AGENDA_VIEW}`}>
            <div className={CSS_CLASSES.MAIN_SCROLL_CONTAINER}>
                <div className={CSS_CLASSES.CONTENT_SECTION}>
                    {dateGroups && dateGroups.length > 0 ? (
                        dateGroups.map((group: AgendaDateGroupType) => (
                            <AgendaDateGroup
                                key={group.date.getTime()}
                                date={group.date}
                                events={group.events}
                            />
                        ))
                    ) : (
                        <AgendaEmptyState />
                    )}
                </div>
            </div>
        </div>
    );
};

AgendaView.displayName = 'AgendaView';
