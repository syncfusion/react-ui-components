import { FC, ReactNode } from 'react';
import { useSchedulerLocalization } from '../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CSS_CLASSES } from '../common/constants';

interface AgendaEmptyStateProps {
    /**
     * Custom CSS class name to apply to the empty state container.
     *
     * @default 'sf-empty-state'
     */
    className?: string;
}

/**
 * AgendaEmptyState component displays messaging when no events are scheduled
 * Supports customization via the noEventsTemplate prop
 *
 * @example
 * ```tsx
 * <AgendaEmptyState />
 * <AgendaEmptyState className="custom-class" />
 * ```
 *
 * @param {AgendaEmptyStateProps} props - Component props
 * @returns {ReactNode} The rendered empty state component
 */
export const AgendaEmptyState: FC<AgendaEmptyStateProps> = (
    { className = CSS_CLASSES.AGENDA_EMPTY_STATE }: AgendaEmptyStateProps
): ReactNode => {
    const { noEventsTemplate } = useSchedulerPropsContext();
    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');
    const noEventsMessage: string = getString('noEvents');

    const renderTemplate: () => ReactNode = (): ReactNode => {
        if (noEventsTemplate) {
            return noEventsTemplate();
        }
        return noEventsMessage;
    };

    return (
        <div
            className={className}
        >
            {renderTemplate()}
        </div>
    );
};

AgendaEmptyState.displayName = 'AgendaEmptyState';
