import { FC, ReactNode } from 'react';
import { formatDate, useProviderContext } from '@syncfusion/react-base';
import { ChevronLeftDoubleIcon, ChevronRightDoubleIcon } from '@syncfusion/react-icons';
import { ProcessedEventsData } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulePropsContext } from '../context/schedule-context';

export const DayEventClone: FC<ProcessedEventsData> = (props: ProcessedEventsData) => {
    const { event, eventStyle, totalSegments, isOverflowLeft = false, isOverflowRight = false } = props;
    const { timeFormat } = useSchedulePropsContext();
    const { locale } = useProviderContext();

    const formattedTime: (time: Date) => string = (time: Date) => {
        return formatDate(time ?? new Date(), { type: 'time', skeleton: 'short', format: timeFormat, locale });
    };

    const renderOverflowIndicator: (direction: 'left' | 'right') => ReactNode = (direction: 'left' | 'right') => (
        <div className={`sf-indicator sf-icons sf-${direction}-icon`}>
            {direction === 'left' ? <ChevronLeftDoubleIcon /> : <ChevronRightDoubleIcon />}
        </div>
    );

    const renderTime: (time: string) => ReactNode = (time: string) => <div className={CSS_CLASSES.TIME}>{time}</div>;

    const renderSpannedContent: () => ReactNode = (): ReactNode => {
        const { subject, isAllDay, startTime, endTime } = event;

        const left: ReactNode = isOverflowLeft ? renderOverflowIndicator('left') : !isAllDay && renderTime(formattedTime(startTime));
        const right: ReactNode = isOverflowRight ? renderOverflowIndicator('right') : !isAllDay && renderTime(formattedTime(endTime));

        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {left}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.TEXT_CENTER} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || 'Add title'}
                </div>
                {right}
            </div>
        );
    };

    const renderStandardEventContent: () => ReactNode = (): ReactNode => {
        const { subject, startTime, isAllDay } = event;
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {!isAllDay && renderTime(formattedTime(startTime))}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || 'Add title'}
                </div>
            </div>
        );
    };

    const content: ReactNode = totalSegments
        ? renderSpannedContent()
        : renderStandardEventContent();

    return (
        <div
            className={`${CSS_CLASSES.APPOINTMENT} ${CSS_CLASSES.EVENT_CLONE}`}
            style={eventStyle}
        >
            {content}
        </div>
    );
};

export default DayEventClone;
