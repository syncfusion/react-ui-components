import { ReactNode, Fragment } from 'react';
import { ChevronLeftDoubleIcon, ChevronRightDoubleIcon, ChevronUpDoubleIcon, ChevronDownDoubleIcon } from '@syncfusion/react-icons';
import { formatDate, getDatePattern } from '@syncfusion/react-base';
import { EventModel } from '../types/scheduler-types';
import { ProcessedEventsData } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { RecurrenceIcon } from '../components/recurrence-icon';
import { PositioningService } from '../services/PositioningService';

/**
 * Formats a Date object to a time string using the given locale and format.
 *
 * @param {Date} time - The time to format.
 * @param {string} timeFormat - The time format string.
 * @param {string} locale - The locale string.
 * @returns {string} Formatted time string.
 * @private
 */
export const formatEventTime: (time: Date, timeFormat: string, locale: string) => string =
    (time: Date, timeFormat: string, locale: string): string => {
        return formatDate(
            time ?? new Date(),
            { type: 'time', skeleton: 'short', format: timeFormat, locale }
        );
    };

/**
 * Renders an overflow indicator arrow for spanned events.
 *
 * @param {'left' | 'right'} direction - The overflow direction.
 * @returns {ReactNode} The overflow indicator element.
 * @private
 */
export const renderOverflowIndicator: (direction: 'left' | 'right') => ReactNode =
    (direction: 'left' | 'right'): ReactNode => (
        <div className={`sf-indicator sf-icons sf-${direction}-icon`}>
            {direction === 'left' ? <ChevronLeftDoubleIcon /> : <ChevronRightDoubleIcon />}
        </div>
    );

/**
 * Renders a time label element.
 *
 * @param {string} time - The formatted time string to display.
 * @returns {ReactNode} The time element.
 * @private
 */
export const renderTimeNode: (time: string) => ReactNode =
    (time: string): ReactNode => <div className={CSS_CLASSES.TIME}>{time}</div>;

/**
 * Renders the inner appointment details with optional overflow indicators and recurrence icon.
 *
 * @param {ReactNode} content - The main content (subject, time, or template).
 * @param {boolean} isOverflowLeft - Whether to show the left overflow indicator.
 * @param {boolean} isOverflowRight - Whether to show the right overflow indicator.
 * @param {EventModel} event - The event model (for recurrence icon).
 * @returns {ReactNode} The composed appointment node.
 * @private
 */
const renderInnerAppointment: (content: ReactNode, isOverflowLeft: boolean, isOverflowRight: boolean, event: EventModel) => ReactNode = (
    content: ReactNode,
    isOverflowLeft: boolean,
    isOverflowRight: boolean,
    event: EventModel
): ReactNode => (
    <div className={CSS_CLASSES.INNER_APPOINTMENT}>
        <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
            {isOverflowLeft && renderOverflowIndicator('left')}
            {content}
            {isOverflowRight && renderOverflowIndicator('right')}
            <RecurrenceIcon event={event} />
        </div>
    </div>
);

/**
 * Renders the content for a spanned (multi-day or overflowing) event.
 *
 * @param {EventModel} event - The event model to render.
 * @param {boolean} isOverflowLeft - Whether the event overflows to the left.
 * @param {boolean} isOverflowRight - Whether the event overflows to the right.
 * @param {string} locale - The locale string.
 * @param {string} timeFormat - The time format string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @returns {ReactNode} The spanned event content.
 * @private
 */
export const renderSpannedContent: (
    event: EventModel,
    isOverflowLeft: boolean,
    isOverflowRight: boolean,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
) => ReactNode = (
    event: EventModel,
    isOverflowLeft: boolean,
    isOverflowRight: boolean,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
): ReactNode => {
    const { subject, isAllDay, startTime, endTime } = event;

    const left: ReactNode = isOverflowLeft
        ? renderOverflowIndicator('left')
        : !isAllDay && renderTimeNode(formatEventTime(startTime, timeFormat, locale));

    const right: ReactNode = isOverflowRight
        ? renderOverflowIndicator('right')
        : !isAllDay && renderTimeNode(formatEventTime(endTime, timeFormat, locale));

    return (
        <div className={`${CSS_CLASSES.INNER_APPOINTMENT}`}>
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {left}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.TEXT_CENTER} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || addTitleLabel}
                </div>
                {right}
                <RecurrenceIcon event={event} />
            </div>
        </div>
    );
};

/**
 * Renders the content for a standard (non-spanned) event.
 *
 * @param {EventModel} event - The event model to render.
 * @param {string} locale - The locale string.
 * @param {string} timeFormat - The time format string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @returns {ReactNode} The standard event content.
 * @private
 */
export const renderStandardEventContent: (
    event: EventModel,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
) => ReactNode = (
    event: EventModel,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
): ReactNode => {
    const { subject, startTime, isAllDay } = event;
    return (
        <div className={`${CSS_CLASSES.INNER_APPOINTMENT}`}>
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                {!isAllDay && renderTimeNode(formatEventTime(startTime, timeFormat, locale))}
                <div className={`${CSS_CLASSES.SUBJECT} ${CSS_CLASSES.ELLIPSIS}`}>
                    {subject || addTitleLabel}
                </div>
                <RecurrenceIcon event={event} />
            </div>
        </div>
    );
};

/**
 * Determines and returns the appropriate event content based on type.
 *
 * @param {Function | undefined} eventTemplate - Optional custom event template.
 * @param {EventModel} event - The event model.
 * @param {number | undefined} totalSegments - Number of segments if the event is spanned.
 * @param {boolean} isOverflowLeft - Whether the event overflows to the left.
 * @param {boolean} isOverflowRight - Whether the event overflows to the right.
 * @param {string} locale - The locale string.
 * @param {string} timeFormat - The time format string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @returns {ReactNode} The resolved event content.
 * @private
 */
export const getEventContent: (
    eventTemplate: ((event: EventModel) => ReactNode) | undefined,
    event: EventModel,
    totalSegments: number | undefined,
    isOverflowLeft: boolean,
    isOverflowRight: boolean,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
) => ReactNode = (
    eventTemplate: ((event: EventModel) => ReactNode) | undefined,
    event: EventModel,
    totalSegments: number | undefined,
    isOverflowLeft: boolean,
    isOverflowRight: boolean,
    locale: string,
    timeFormat: string,
    addTitleLabel: string
): ReactNode => {
    if (totalSegments) {
        if (eventTemplate) {
            return renderInnerAppointment(eventTemplate(event), isOverflowLeft, isOverflowRight, event);
        }
        return renderSpannedContent(event, isOverflowLeft, isOverflowRight, locale, timeFormat, addTitleLabel);
    }
    if (eventTemplate) {
        return renderInnerAppointment(eventTemplate(event), false, false, event);
    }
    return renderStandardEventContent(event, locale, timeFormat, addTitleLabel);
};

// ─── Time-Slot Event Rendering Utilities ────────────────────────────────────

/**
 * Formats a start and end Date into a time range string (e.g. "9:00 AM - 10:00 AM").
 * Resolves the format pattern automatically when no explicit format is provided.
 *
 * @param {Date} start - The start time.
 * @param {Date} end - The end time.
 * @param {string} timeFormat - The explicit time format string (may be empty).
 * @param {string} locale - The locale string.
 * @returns {string} Formatted time range string.
 * @private
 */
export const getTimeRangeString: (start: Date, end: Date, timeFormat: string, locale: string) => string =
    (start: Date, end: Date, timeFormat: string, locale: string): string => {
        const resolvedFormat: string = timeFormat ||
            getDatePattern({ type: 'time', skeleton: 'short', format: timeFormat }, false);
        const startStr: string = formatDate(start, { type: 'time', format: resolvedFormat, locale });
        const endStr: string = formatDate(end, { type: 'time', format: resolvedFormat, locale });
        return `${startStr} - ${endStr}`;
    };

const renderAppointmentDetails: (eventInfo: ProcessedEventsData, timeFormat: string,
    locale: string, addTitleLabel: string) => ReactNode =
    (eventInfo: ProcessedEventsData, timeFormat: string, locale: string, addTitleLabel: string): ReactNode => {
        const { event, timeDisplay } = eventInfo;
        const timeText: string = timeDisplay ||
            (event.startTime && event.endTime
                ? getTimeRangeString(event.startTime, event.endTime, timeFormat, locale)
                : '');
        return (
            <div className={CSS_CLASSES.APPOINTMENT_DETAILS}>
                <div className={CSS_CLASSES.SUBJECT}>{event.subject || addTitleLabel}</div>
                {!event.isBlock && event.location && (
                    <div className={`${CSS_CLASSES.EVENT_LOCATION} ${CSS_CLASSES.ELLIPSIS}`}>{event.location}</div>
                )}
                {!event.isBlock && (
                    <div className={`${CSS_CLASSES.EVENT_TIME} ${CSS_CLASSES.ELLIPSIS}`}>{timeText}</div>
                )}
                <RecurrenceIcon event={event} />
            </div>
        );
    };

/**
 * Renders the standard content for a time-slot event.
 * Displays subject, optional location, time range and recurrence icon.
 *
 * @param {ProcessedEventsData} eventInfo - The processed event data.
 * @param {string} timeFormat - The time format string.
 * @param {string} locale - The locale string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @returns {ReactNode} The standard time-slot event content.
 * @private
 */
export const renderTimeSlotStandardContent: (
    eventInfo: ProcessedEventsData,
    timeFormat: string,
    locale: string,
    addTitleLabel: string
) => ReactNode = (
    eventInfo: ProcessedEventsData,
    timeFormat: string,
    locale: string,
    addTitleLabel: string
): ReactNode => {
    return (
        <div className={`${CSS_CLASSES.INNER_APPOINTMENT}`}>
            {renderAppointmentDetails(eventInfo, timeFormat, locale, addTitleLabel)}
        </div>
    );
};

/**
 * Renders the spanned content for a time-slot event, including top/bottom
 * overflow indicators when timescale is enabled, or left/right when disabled.
 *
 * @param {ProcessedEventsData} eventInfo - The processed event data.
 * @param {Date[]} renderDates - The dates currently rendered in the view.
 * @param {boolean} timeScaleEnabled - Whether timescale is enabled.
 * @param {string} timeFormat - The time format string.
 * @param {string} locale - The locale string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @param {[number, number]} [startHourTuple] - The scheduler start hour tuple.
 * @param {[number, number]} [endHourTuple] - The scheduler end hour tuple.
 * @param {Function} [eventTemplate] - Optional custom event template.
 * @returns {ReactNode} The spanned time-slot event content.
 * @private
 */
export const renderTimeSlotSpannedContent: (
    eventInfo: ProcessedEventsData,
    renderDates: Date[],
    timeScaleEnabled: boolean,
    timeFormat: string,
    locale: string,
    addTitleLabel: string,
    startHourTuple?: [number, number],
    endHourTuple?: [number, number],
    eventTemplate?: (event: EventModel) => ReactNode
) => ReactNode = (
    eventInfo: ProcessedEventsData,
    renderDates: Date[],
    timeScaleEnabled: boolean,
    timeFormat: string,
    locale: string,
    addTitleLabel: string,
    startHourTuple?: [number, number],
    endHourTuple?: [number, number],
    eventTemplate?: (event: EventModel) => ReactNode
): ReactNode => {
    const contentNode: ReactNode = eventTemplate
        ? eventTemplate(eventInfo.event)
        : renderAppointmentDetails(eventInfo, timeFormat, locale, addTitleLabel);

    if (timeScaleEnabled) {
        const { isOverflowTop, isOverflowBottom } =
            PositioningService.getOverflowDirection(eventInfo, renderDates, startHourTuple, endHourTuple);
        if (isOverflowTop || isOverflowBottom) {
            return (
                <Fragment>
                    <div className={CSS_CLASSES.INNER_APPOINTMENT}>
                        {isOverflowTop && (
                            <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.UP_ARROW_ICON}`}>
                                <ChevronUpDoubleIcon />
                            </div>
                        )}
                        {contentNode}
                        {eventTemplate && <RecurrenceIcon event={eventInfo.event} />}
                        {isOverflowBottom && (
                            <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.DOWN_ARROW_ICON}`}>
                                <ChevronDownDoubleIcon />
                            </div>
                        )}
                    </div>
                </Fragment>
            );
        }
    }

    const { isOverflowLeft, isOverflowRight } = PositioningService.getOverflowDirection(eventInfo, renderDates);
    return (
        <Fragment>
            <div className={CSS_CLASSES.INNER_APPOINTMENT}>
                {isOverflowLeft && (
                    <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.LEFT_ARROW_ICON}`}>
                        <ChevronLeftDoubleIcon />
                    </div>
                )}
                {contentNode}
                {eventTemplate && <RecurrenceIcon event={eventInfo.event} />}
                {isOverflowRight && (
                    <div className={`${CSS_CLASSES.INDICATOR} ${CSS_CLASSES.ICONS} ${CSS_CLASSES.RIGHT_ARROW_ICON}`}>
                        <ChevronRightDoubleIcon />
                    </div>
                )}
            </div>
        </Fragment>
    );
};

/**
 * Resolves and returns the appropriate content for a time-slot event.
 * Prioritizes the custom event template, then spanned, then standard content.
 *
 * @param {Function | undefined} eventTemplate - Optional custom template.
 * @param {ProcessedEventsData} eventInfo - The processed event data.
 * @param {Date[]} renderDates - The dates currently rendered.
 * @param {boolean} timeScaleEnabled - Whether timescale is enabled.
 * @param {string} timeFormat - The time format string.
 * @param {string} locale - The locale string.
 * @param {string} addTitleLabel - The localized label for 'Add title'.
 * @param {[number, number]} [startHourTuple] - The scheduler start hour tuple.
 * @param {[number, number]} [endHourTuple] - The scheduler end hour tuple.
 * @returns {ReactNode} The resolved event content.
 * @private
 */
export const getTimeSlotEventContent: (
    eventTemplate: ((event: EventModel) => ReactNode) | undefined,
    eventInfo: ProcessedEventsData,
    renderDates: Date[],
    timeScaleEnabled: boolean,
    timeFormat: string,
    locale: string,
    addTitleLabel: string,
    startHourTuple?: [number, number],
    endHourTuple?: [number, number]
) => ReactNode = (
    eventTemplate: ((event: EventModel) => ReactNode) | undefined,
    eventInfo: ProcessedEventsData,
    renderDates: Date[],
    timeScaleEnabled: boolean,
    timeFormat: string,
    locale: string,
    addTitleLabel: string,
    startHourTuple?: [number, number],
    endHourTuple?: [number, number]
): ReactNode => {
    const isSpanned: boolean = !!(eventInfo.totalSegments || startHourTuple || endHourTuple);
    if (isSpanned) {
        return renderTimeSlotSpannedContent(
            eventInfo,
            renderDates,
            timeScaleEnabled,
            timeFormat,
            locale,
            addTitleLabel,
            startHourTuple,
            endHourTuple,
            eventTemplate
        );
    }
    if (eventTemplate) {
        return renderInnerAppointment(eventTemplate(eventInfo.event), false, false, eventInfo.event);
    }
    return renderTimeSlotStandardContent(eventInfo, timeFormat, locale, addTitleLabel);
};
