import { FC, Fragment, ReactNode } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { CSS_CLASSES } from '../common/constants';
import { ProcessedEventsData } from '../types/internal-interface';
import { PositioningService } from '../services/PositioningService';
import { formatDate, useProviderContext, getDatePattern } from '@syncfusion/react-base';
import { ChevronUpDoubleIcon, ChevronDownDoubleIcon } from '@syncfusion/react-icons';

export const TimeSlotEventClone: FC<ProcessedEventsData> = (eventInfo: ProcessedEventsData) => {
    const { timeFormat, startHourTuple, endHourTuple } = useSchedulerPropsContext();
    const { renderDates } = useSchedulerRenderDatesContext();
    const { locale } = useProviderContext();

    const getTimeString: (start: Date, end: Date) => string   = (start: Date, end: Date): string => {
        let resolvedFormat: string | null | undefined = timeFormat;
        if (!resolvedFormat) {
            resolvedFormat = getDatePattern({ type: 'time', skeleton: 'short', format: timeFormat }, false);
        }
        const startStr: string = formatDate(start, { type: 'time', format: resolvedFormat, locale });
        const endStr: string = formatDate(end, { type: 'time', format: resolvedFormat, locale });
        return `${startStr} - ${endStr}`;
    };

    const renderStandardEventContent: (info: ProcessedEventsData) => ReactNode  = (info: ProcessedEventsData): ReactNode => {
        const { event } = info;
        const timeText: string = event.startTime && event.endTime ? getTimeString(event.startTime, event.endTime) : '';
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                <div className={`${CSS_CLASSES.SUBJECT}`}>
                    {event.subject || 'Add title'}
                </div>
                {event.location && (
                    <div className={`${CSS_CLASSES.EVENT_LOCATION} ${CSS_CLASSES.ELLIPSIS}`} title={event.location}>
                        {event.location}
                    </div>
                )}
                <div className={`${CSS_CLASSES.EVENT_TIME} ${CSS_CLASSES.ELLIPSIS}`} title={timeText}>
                    {timeText}
                </div>
            </div>
        );
    };

    const renderSpannedContent: (info: ProcessedEventsData) => ReactNode = (info: ProcessedEventsData): ReactNode => {
        const { isOverflowTop, isOverflowBottom } =
            PositioningService.getOverflowDirection(info, renderDates, startHourTuple, endHourTuple);
        return (
            <Fragment>
                {isOverflowTop && (
                    <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.UP_ARROW_ICON}`}>
                        <ChevronUpDoubleIcon />
                    </div>
                )}
                {renderStandardEventContent(info)}
                {isOverflowBottom && (
                    <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.DOWN_ARROW_ICON}`}>
                        <ChevronDownDoubleIcon />
                    </div>
                )}
            </Fragment>
        );
    };

    const content: ReactNode = (eventInfo.totalSegments && eventInfo.totalSegments > 1) || startHourTuple || endHourTuple
        ? renderSpannedContent(eventInfo)
        : renderStandardEventContent(eventInfo);

    return (
        <div
            className={`${CSS_CLASSES.APPOINTMENT} ${CSS_CLASSES.EVENT_CLONE}`}
            style={eventInfo.eventStyle}
        >
            {content}
        </div>
    );
};

export default TimeSlotEventClone;
