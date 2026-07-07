import { EventFields, SchedulerProps, AgendaViewProps } from '../types/scheduler-types';
import { Timezone } from '../services/Timezone';

/**
 * All EventModel property names in field-mapped format.
 *
 * @private
 */
export const DEFAULT_FIELDS: { [key: string]: string } = {
    id: 'Id',
    subject: 'Subject',
    startTime: 'StartTime',
    endTime: 'EndTime',
    isAllDay: 'IsAllDay',
    location: 'Location',
    description: 'Description',
    isReadonly: 'IsReadonly',
    isBlock: 'IsBlock',
    recurrenceRule: 'RecurrenceRule',
    recurrenceID: 'RecurrenceID',
    recurrenceException: 'RecurrenceException',
    guid: 'Guid',
    followingId: 'FollowingId',
    startTimezone: 'StartTimezone',
    endTimezone: 'EndTimezone'
} as const;

export const defaultSchedulerProps: Partial<SchedulerProps> = {
    height: 'auto',
    width: 'auto',
    defaultSelectedDate: new Date(),
    defaultView: 'Week',
    eventSettings: {
        dataSource: [],
        fields: DEFAULT_FIELDS,
        spannedEventPlacement: 'AllDayRow',
        enableIndicator: false,
        allowAdding: true,
        allowDeleting: true,
        allowEditing: true,
        ignoreWhitespace: false,
        editFollowingEvents: false
    },
    timeScale: { enable: true, interval: 60, slotCount: 2 },
    workHours: { highlight: true, start: '09:00', end: '18:00' },
    resources: [],
    group: { resources: [], byDate: false, byGroupID: true },
    startHour: '00:00',
    endHour: '24:00',
    showWeekend: true,
    firstDayOfWeek: 0,
    workDays: [1, 2, 3, 4, 5],
    showTimeIndicator: true,
    showWeekNumber: false,
    eventOverlap: true,
    keyboardNavigation: true,
    showQuickInfoPopup: true,
    header: true,
    rowAutoHeight: false,
    readOnly: false,
    eventDrag: true,
    eventResize: true,
    enableRecurrenceValidation: true,
    weekRule: 'FirstDay',
    timezoneDataSource: Timezone.timezoneData
};

export const defaultAgendaViewProps: AgendaViewProps = {
    hideEmptyAgendaDays: true,
    agendaDaysCount: 7
};

/**
 * All EventModel property names in camelCase.
 * Single source of truth for canonical internal field names.
 *
 * @private
 */
export const EVENT_MODEL_KEYS: readonly string[] = [
    'id', 'subject', 'startTime', 'endTime', 'isAllDay', 'location', 'description', 'isReadonly', 'isBlock', 'recurrenceRule',
    'recurrenceID', 'recurrenceException', 'guid', 'startTimezone', 'endTimezone'
] as const;

/**
 * Provides a mapping between custom field names and the standard event model property names, enabling flexible configuration of event data structures within the scheduler component.
 *
 * @param {EventFields} fields - Specifies the custom field names used in the event data, allowing the scheduler to correctly map and interpret the properties of event objects based on user-defined or external data schemas.
 * @returns {Readonly<Record<string, string>>} A read-only map from custom field names to canonical event model keys.
 * @private
 */
export const getEventModelFields: (fields: EventFields) => Readonly<Record<string, string>> =
    (fields: EventFields) => ({
        [fields.id]: 'id',
        [fields.subject]: 'subject',
        [fields.startTime]: 'startTime',
        [fields.endTime]: 'endTime',
        [fields.isAllDay]: 'isAllDay',
        [fields.location]: 'location',
        [fields.description]: 'description',
        [fields.isReadonly]: 'isReadonly',
        [fields.isBlock]: 'isBlock',
        [fields.recurrenceRule]: 'recurrenceRule',
        [fields.recurrenceID]: 'recurrenceID',
        [fields.recurrenceException]: 'recurrenceException',
        [fields.guid]: 'guid',
        [fields.startTimezone]: 'startTimezone',
        [fields.endTimezone]: 'endTimezone'
    } as const);
