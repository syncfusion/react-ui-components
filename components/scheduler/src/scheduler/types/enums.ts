/**
 * Defines the view options for the Scheduler component.
 */
export type View = 'Day' | 'Week' | 'WorkWeek' | 'Month';

/**
 * An enum that holds the options to render the spanned events in all day row or time slot.
 * ```props
 * AllDayRow :- Denotes the rendering of spanned events in an all-day row.
 * TimeSlot :- Denotes the rendering of spanned events in an time slot row.
 * ```
 */
export type SpannedEventPlacement = 'AllDayRow' | 'TimeSlot';
