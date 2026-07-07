/**
 * Defines the view options for the Scheduler component.
 */
export type View = 'Day' | 'Week' | 'WorkWeek' | 'Month' | 'Agenda';

/**
 * An enum that holds the options to render the spanned events in all day row or time slot.
 * ```props
 * AllDayRow :- Denotes the rendering of spanned events in an all-day row.
 * TimeSlot :- Denotes the rendering of spanned events in an time slot row.
 * ```
 */
export type SpannedEventPlacement = 'AllDayRow' | 'TimeSlot';
/**
 * An enum that holds the options to render the week number based on different rules.
 * ```props
 * FirstDay :- Denotes that the first week of the year starts on the first day of the year and ends before the following designated first day of the week.
 * FirstFourDayWeek :- Denotes that the first week of the year is the first week with four or more days before the designated first day of the week.
 * FirstFullWeek :- Denotes that the first week of the year begins on the first occurrence of the designated first day of the week on or after the first day of the year.
 * ```
 */
export type WeekRule = 'FirstDay' | 'FirstFourDayWeek' | 'FirstFullWeek';

/**
 * A type representing the action performed when opening the editor.
 * ```props
 * Add :- Opens the editor to create a new event.
 * Edit :- Opens the editor to modify an existing event.
 * EditSeries :- Opens the editor to modify an entire recurring event series.
 * EditCurrentSeries :- Opens the editor to modify the current occurrence of a recurring event.
 * EditOccurrence :- Opens the editor to modify a specific occurrence of a recurring event.
 * Delete :- Opens an editor to delete a specific occurrence of a recurring event.
 * DeleteOccurrence :- Opens a confirmation dialog to delete a specific occurrence of a recurring event.
 * DeleteSeries :- Opens a confirmation dialog to delete an entire recurring event series.
 * EditFollowingEvents :- Opens the editor to modify the current and following occurrences of a recurring event.
 * DeleteFollowingEvents :- Opens a confirmation dialog to delete the current and following occurrences of a recurring event.
 * ```
 */
export type CrudAction = 'Add' | 'Edit' | 'EditSeries' | 'EditCurrentSeries' | 'EditOccurrence' | 'Delete' | 'DeleteOccurrence' | 'DeleteSeries' | 'EditFollowingEvents' | 'EditCurrentFollowingEvents' | 'DeleteFollowingEvents';

/**
 * An enum that represents the context type used to open the editor.
 * ```props
 * Add :- Opens the editor to create a new event.
 * Edit :- Opens the editor to modify an existing event.
 * EditSeries :- Opens the editor to modify an entire recurring event series.
 * EditOccurrence :- Opens the editor to modify a specific occurrence of a recurring event.
 * ```
 */
export type EditAction = 'Add' | 'Edit' | 'EditSeries' | 'EditOccurrence' | 'EditFollowingEvents';

/**
 * Represents keyboard navigation directions used within the Scheduler.
 *
 * Left: Move focus to the previous work cell (or wrap to the end of the previous row).
 * Right: Move focus to the next work cell (or wrap to the start of the next row).
 * Up: Move focus to the work cell in the previous row, same column when possible.
 * Down: Move focus to the work cell in the next row, same column when possible.
 *
 * @private
 */
export enum Direction {
    /** Move focus to the previous work cell */
    Left = 'left',
    /** Move focus to the next work cell */
    Right = 'right',
    /** Move focus to the work cell above */
    Up = 'up',
    /** Move focus to the work cell below */
    Down = 'down'
}

/**
 * Represents the types of alert dialogs that can be shown in the Scheduler.
 *
 * RecurrenceEdit: Alert dialog for editing recurring events, with options to edit this occurrence or the entire series.
 * RecurrenceDelete: Alert dialog for deleting recurring events, with options to delete this occurrence or the entire series.
 * SeriesChange: Alert dialog for confirming changes to specific instances of a series, with options to confirm or cancel the changes.
 *
 * @private
 */
export enum AlertAction {
    /** Alert dialog for editing recurring events */
    RecurrenceEdit = 'recurrenceEdit',
    /** Alert dialog for deleting recurring events */
    RecurrenceDelete = 'recurrenceDelete',
    /** Alert dialog for confirming changes to series instances */
    SeriesChange = 'seriesChange'
}

/**
 * Represents alert types for validation messages related to recurring events.
 *
 * OccurrenceAlert: Alert when a recurring event occurrence is rescheduled to skip over another occurrence.
 * SameDayAlert: Alert when multiple occurrences of the same event occur on the same day.
 *
 * @private
 */
export enum AlertType {
    /** Cannot reschedule occurrence if it skips over another */
    OccurrenceAlert = 'occurenceAlert',
    /** Two occurrences cannot occur on the same day */
    SameDayAlert = 'sameDayAlert'
}

/**
 * Determines how the Scheduler chooses the vertical scroll target when a view is first rendered.
 * ```props
 * CurrentTime:- Scroll to the current time indicator if it is visible in the rendered view.
 * WorkHour:- Scroll to the configured start of the work hours.
 * Auto:- Prefer the current time indicator when present; otherwise scroll to the work hour start.
 * ```
 */
export enum ScrollToMode {
    /** Scroll to the current time indicator when present. */
    CurrentTime = 'currentTime',
    /** Scroll to the start of the defined work hours. */
    WorkHour = 'workHour',
    /** Prefer current time when available, otherwise use work hour start. */
    Auto = 'auto'
}
