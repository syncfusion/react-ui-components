import { ScheduleProps } from '../types/schedule-types';

export const defaultScheduleProps: Partial<ScheduleProps> = {
    height: 'auto',
    width: 'auto',
    selectedDate: new Date(),
    currentView: 'Week',
    eventSettings: {
        dataSource: [],
        fields: {
            id: 'Id',
            subject: 'Subject',
            startTime: 'StartTime',
            endTime: 'EndTime',
            isAllDay: 'IsAllDay',
            location: 'Location',
            description: 'Description',
            isReadonly: 'IsReadonly',
            isBlock: 'IsBlock'
        },
        spannedEventPlacement: 'AllDayRow',
        enableMaxHeight: false,
        enableIndicator: false,
        allowAdding: true,
        allowDeleting: true,
        allowEditing: true,
        ignoreWhitespace: false
    },
    timeScale: { enable: true, interval: 60, slotCount: 2 },
    workHours: { highlight: true, start: '09:00', end: '18:00' },
    startHour: '00:00',
    endHour: '24:00',
    showWeekend: true,
    firstDayOfWeek: 0,
    workDays: [1, 2, 3, 4, 5],
    showTimeIndicator: true,
    showWeekNumber: false,
    allowOverlap: true,
    allowKeyboardInteraction: true,
    showQuickInfoPopup: true,
    showHeaderBar: true,
    rowAutoHeight: false,
    calendarMode: 'Gregorian',
    readOnly: false,
    allowDragAndDrop: true,
    allowResizing: true
};
