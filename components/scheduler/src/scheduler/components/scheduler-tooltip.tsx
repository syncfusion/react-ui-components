import * as React from 'react';
import { CSS_CLASSES } from '../common/constants';
import { EventService } from '../services/EventService';
import { EventModel, SchedulerTooltipOpenEvent, SchedulerTooltipProps as SchedulerTooltipInputProps } from '../types/scheduler-types';
import { useSchedulerLocalization } from '../common/locale';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { Tooltip } from '@syncfusion/react-popups';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useProviderContext } from '@syncfusion/react-base';
import { useSchedulerEventsContext } from '../context/scheduler-events-context';

type SchedulerTooltipProps = SchedulerTooltipInputProps & {
    children: React.ReactNode;
    onTooltipOpen?: (args: SchedulerTooltipOpenEvent) => void;
    containerRef?: RefObject<HTMLDivElement>;
};

/**
 * Scheduler tooltip component that renders contextual event information when hovering on appointments.
 *
 * @param {SchedulerTooltipProps} props - The props for the tooltip component.
 * @returns {React.ReactElement} A Tooltip wrapping the provided children.
 */
export const SchedulerTooltip: React.FC<SchedulerTooltipProps> = ({
    children,
    onTooltipOpen,
    content: contentProp,
    arrow,
    containerRef,
    ...props
}: SchedulerTooltipProps): React.ReactElement => {
    const [content, setContent] = useState<React.ReactNode>(null);
    const [currentEventGuid, setCurrentEventGuid] = useState<string | null>(null);
    const [isTooltipOpen, setIsTooltipOpen] = useState<boolean>(false);

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale);
    const { timeFormat } = useSchedulerPropsContext();
    const { eventsData } = useSchedulerEventsContext();
    const eventsDataRef: RefObject<EventModel[]> = useRef<EventModel[]>(eventsData);

    useEffect(() => {
        eventsDataRef.current = eventsData;
    }, [eventsData]);

    useEffect(() => {
        if (currentEventGuid) {
            const eventStillExists: boolean = eventsDataRef.current.some((e: EventModel) => e.guid === currentEventGuid);
            if (!eventStillExists) {
                setCurrentEventGuid(null);
                setIsTooltipOpen(false);
            }
        }
    }, [eventsData, currentEventGuid]);

    const onFilterTarget: (target: HTMLElement) => HTMLElement | null = (target: HTMLElement): HTMLElement | null => {
        const appointmentEl: HTMLElement | null = target.closest('.' + CSS_CLASSES.APPOINTMENT) as HTMLElement | null;
        if (!appointmentEl) {
            return null;
        }

        const guid: string = appointmentEl?.getAttribute('data-guid');
        const record: EventModel = EventService.getEventByGuid(eventsDataRef.current, guid);

        // Allow host to cancel tooltip open
        const args: SchedulerTooltipOpenEvent = { cancel: false, data: record as Record<string, any> | undefined };
        onTooltipOpen?.(args);
        if (args.cancel) {
            return null;
        }

        setCurrentEventGuid(guid);
        if (typeof contentProp === 'function') {
            // Invoke user template function with a simple payload
            const templateResult: SchedulerTooltipProps = contentProp({ data: record });
            setContent(templateResult as React.ReactNode);
        } else if (contentProp !== undefined && contentProp !== null) {
            setContent(contentProp as React.ReactNode);
        } else {
            const node: React.ReactNode = buildEventTooltipContent(record);
            setContent(node);
        }
        return target.closest('.' + CSS_CLASSES.APPOINTMENT);
    };

    const buildEventTooltipContent: (record?: EventModel) => React.ReactNode = useCallback((
        record?: EventModel
    ): React.ReactNode => {

        const subject: string = record.subject ?? record.description ?? getString('addTitle');
        const dateText: string = DateService.formatStartAndEndDateRange(
            record.startTime,
            record.endTime,
            locale
        );
        const timeText: string = DateService.formatTimeDisplay(
            record,
            locale,
            timeFormat
        );

        return (
            <>
                <div className={CSS_CLASSES.SCHEDULER_TOOLTIP_SUBJECT}>{subject}</div>
                <div className={CSS_CLASSES.SCHEDULER_TOOLTIP_TEXT}>
                    {dateText ? <div>{dateText}</div> : null}
                    {(!record.isAllDay && timeText) ? <div>{timeText}</div> : null}
                </div>
            </>
        );
    }, [getString, timeFormat, locale]);

    return (
        <Tooltip
            className={CSS_CLASSES.SCHEDULER_TOOLTIP}
            open={isTooltipOpen}
            onOpen={() => setIsTooltipOpen(true)}
            onClose={() => setIsTooltipOpen(false)}
            onFilterTarget={onFilterTarget}
            arrow={arrow ?? false}
            content={<>{content}</>}
            container={containerRef}
            {...props}
            closeDelay={100}>
            {children}
        </Tooltip>
    );
};
