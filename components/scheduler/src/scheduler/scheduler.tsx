import {
    forwardRef, useRef, useImperativeHandle, useMemo, useEffect, Ref,
    ForwardRefExoticComponent, RefAttributes, RefObject, useState, JSX, FC
} from 'react';
import { SchedulerContext } from './context/scheduler-context';
import { SchedulerRenderDatesContext } from './context/scheduler-render-dates-context';
import { SchedulerEventsContext } from './context/scheduler-events-context';
import {
    EventModel, SchedulerCellClickEvent, SchedulerCellDetails, SchedulerProps, SchedulerTooltipProps,
    SchedulerEditorProps
} from './types/scheduler-types';
import { CrudAction, AlertAction, EditAction } from './types/enums';
import { defaultSchedulerProps } from './utils/default-props';
import { mergeSchedulerProps } from './utils/merge-utils';
import { ViewService } from './services/ViewService';
import { useScheduler } from './hooks/useScheduler';
import { SchedulerToolbar } from './components/scheduler-toolbar';
import { ActiveViewProps, ViewsInfo } from './types/internal-interface';
import { usePopup } from './hooks/useQuickInfoPopup';
import { useData } from './hooks/useData';
import { QuickInfoPopup } from './components/popup/quick-info-popup';
import { MorePopup, IMorePopup } from './components/popup/more-popup';
import { CSS_CLASSES } from './common/constants';
import { useSchedulerLocalization } from './common/locale';
import { useProviderContext, preRender } from '@syncfusion/react-base';
import useKeyboard from './hooks/useKeyboard';
import { CloneEventProvider } from './context/clone-event-context';
import { CloneEvent } from './components/clone-event';
import ConfirmationDialog from './components/popup/confirmation-dialog';
import SchedulerEditorPopup from './components/popup/editor-popup';
import { useEditorPopup, UseEditorPopupResult } from './hooks/useEditorPopup';
import { ConfirmationDialogState, useConfirmationDialog } from './hooks/useConfirmationDialog';
import { SchedulerTooltip } from './components/scheduler-tooltip';
import { getCellDetails, scrollToHour, scrollToWorkHour } from './utils/actions';
import { EventService } from './services/EventService';
import { EditorProvider } from './context/scheduler-editor-popup-context';
import { showRecurrenceAlert } from './utils/event-base';
import { SchedulerPopupStateProvider } from './context/scheduler-popup-state-context';
import { ResourceGroupingProvider } from './context/resource-grouping-context';

export interface IScheduler extends SchedulerProps {
    /**
     * Adds the newly created event into the Scheduler dataSource.
     *
     * @param {Object | Object[]} data Single or collection of event objects to be added into Scheduler.
     * @returns {void}
     */
    addEvent(data: Record<string, any> | Record<string, any>[]): void;

    /**
     * Deletes the events based on the provided ID or event collection in the argument list.
     *
     * @param {string | number | Object | Object[]} id Accepts the ID as string or number type or single or collection of the event object
     *  which needs to be removed from the Scheduler.
     * @param {CrudAction?} action Optional action type for handling recurrence event deletion (DeleteOccurrence, DeleteSeries).
     * @returns {void}
     */
    deleteEvent(id: string | number | Record<string, any> | Record<string, any>[], action?: CrudAction): void;

    /**
     * Updates the changes made in the event object by passing it as an parameter into the dataSource.
     *
     * @param {Object | Object[]} data Single or collection of event objects to be saved into Scheduler.
     * @param {CrudAction?} action Optional action type for handling recurrence event edits (Edit, EditSeries, EditOccurrence).
     * @returns {void}
     */
    saveEvent(data: Record<string, any> | Record<string, any>[], action?: CrudAction): void;

    /**
     * The Scheduler component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Gets the details of the currently selected event.
     * Returns null if no event is selected.
     */
    getEventDetails(appointmentEl?: Element | RefObject<HTMLElement> | null): EventModel | null;

    /**
     * Gets the details of the currently selected cell (time range, all-day state, etc.).
     * Returns null if no cell is selected.
     */
    getCellDetails(cells?: Element | Element[] | null): SchedulerCellDetails | null;

    /**
     * Opens the event editor.
     *
     * @param action - Specifies whether to add a new event or edit the selected event.
     * @param element - Optional context for the editor (cell to create new from a cell, or event to edit an event).
     */
    openEditor(action: CrudAction, data?: SchedulerCellDetails | EventModel): void;

    /** Closes the Editor popup */
    closeEditor(): void;

    /** Opens the Quick Info popup for a cell or event */
    openQuickInfoPopup(data: SchedulerCellDetails | EventModel, element: HTMLElement | null): void;

    /** Closes the Quick Info popup if open */
    closeQuickInfoPopup(): void;

    /**
     * Programmatically scrolls the current view to the specified date and hour.
     * - If the date is not in the currently rendered range, the scheduler navigates to it, then scrolls.
     * - Works in time-based views (Day/Week/WorkWeek). In Month view, it navigates to the date and waits for a time-based view to be active.
     *
     * @param date - The target date to ensure is visible.
     * @param hour - The hour within the day to scrollTo (0-23).
     */
    scrollTo(hour: string, date?: Date): void;
}

/**
 * The React Scheduler component that displays a list of events scheduled at specific dates and times, helping users plan and manage their schedule effectively.
 *
 * ```typescript
 * import { Scheduler, DayView, WeekView, WorkWeekView, MonthView, AgendaView } from '@syncfusion/react-scheduler';
 *
 * <Scheduler>
 *   <DayView />
 *   <WeekView />
 *   <WorkWeekView />
 *   <MonthView />
 *   <AgendaView />
 * </Scheduler>
 * ```
 */
export const Scheduler: ForwardRefExoticComponent<SchedulerProps & RefAttributes<IScheduler>> =
    forwardRef<IScheduler, SchedulerProps>((props: SchedulerProps, ref: Ref<IScheduler>) => {
        const {
            height,
            width,
            selectedDate,
            defaultSelectedDate,
            view,
            defaultView,
            eventSettings,
            resources,
            group,
            timeScale,
            workHours,
            startHour,
            endHour,
            showWeekend,
            firstDayOfWeek,
            workDays,
            showTimeIndicator,
            showWeekNumber,
            dateFormat,
            timeFormat,
            dateHeader,
            cell,
            headerIndent,
            eventOverlap,
            rowAutoHeight,
            readOnly,
            showQuickInfoPopup,
            header,
            resourceHeader,
            quickInfo,
            keyboardNavigation,
            onDataBind,
            onDataRequest,
            onSelectedDateChange,
            onViewChange,
            onCellClick,
            onCellDoubleClick,
            onEventClick,
            onEventDoubleClick,
            onDataChangeStart,
            onDataChangeComplete,
            eventDrag,
            eventResize,
            onResizeStart,
            onResizing,
            onResizeStop,
            onDragStart,
            onDrag,
            onDragStop,
            onError,
            onMoreEventsClick,
            eventTooltip,
            onTooltipOpen,
            onEditorSubmit,
            editor,
            children,
            className,
            weekRule,
            enableRecurrenceValidation,
            scrollToSettings,
            timezone,
            timezoneDataSource,
            ...rest
        } = mergeSchedulerProps(defaultSchedulerProps, props) as SchedulerProps;

        const schedulerElementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
        const schedulerRef: RefObject<IScheduler> = useRef<IScheduler>(null);
        const morePopupRef: RefObject<IMorePopup> = useRef<IMorePopup>(null);

        const confirmationDialog: {
            show: (config: Omit<ConfirmationDialogState, 'visible'>) => void;
            hide: () => void;
            setStateUpdater: (callback: (state: ConfirmationDialogState) => void) => void;
        } = useConfirmationDialog();

        const [dialogState, setDialogState] = useState<ConfirmationDialogState>({ visible: false });

        useEffect(() => {
            confirmationDialog.setStateUpdater(setDialogState);
        }, []);

        const { locale } = useProviderContext();
        const { getString } = useSchedulerLocalization(locale || 'en-US');

        const {
            cellEditRef,
            handleClose,
            onCellClickHandler,
            onEventClickHandler
        } = usePopup(
            onCellClick,
            onEventClick
        );

        const processedEventsRef: RefObject<EventModel[]> = useRef<EventModel[]>(null);
        const editorState: UseEditorPopupResult =
            useEditorPopup(
                onCellDoubleClick,
                onEventDoubleClick,
                handleClose,
                (action: AlertAction, onSelect: (selectOption: CrudAction) => void) =>
                    showRecurrenceAlert(action, confirmationDialog, getString, onSelect),
                processedEventsRef.current,
                timezone,
                resources,
                group,
                eventSettings?.fields
            );
        const { open, data, originalData, action, onClose, onCellDoubleClickHandler, onEventDoubleClickHandler,
            onMoreDetails, onEditEvent } = editorState;

        const viewComponents: ViewsInfo[] = useMemo((): ViewsInfo[] => {
            return ViewService.getViewsInfo(children, getString);
        }, [children]);

        const {
            classNames,
            selectedDate: internalSelectedDate,
            view: internalCurrentView,
            renderDates,
            activeViewProps,
            dateRangeText,
            showCalendar,
            calendarView,
            handleViewButtonClick,
            handlePreviousClick,
            handleNextClick,
            handleTodayClick,
            handleDateDropdownClick,
            handleCalendarChange,
            renderCurrentView
        } = useScheduler({
            className,
            height,
            width,
            selectedDate,
            defaultSelectedDate,
            view,
            defaultView,
            eventSettings,
            resources,
            group,
            timeScale,
            workHours,
            startHour,
            endHour,
            showWeekend,
            firstDayOfWeek,
            workDays,
            showTimeIndicator,
            showWeekNumber,
            dateFormat,
            timeFormat,
            dateHeader,
            resourceHeader,
            cell,
            headerIndent,
            editor,
            quickInfo,
            eventOverlap,
            showQuickInfoPopup,
            header,
            keyboardNavigation,
            rowAutoHeight,
            readOnly,
            onEditorSubmit,
            onDataBind,
            onDataRequest,
            onSelectedDateChange,
            onViewChange,
            onCellClick: onCellClickHandler,
            onCellDoubleClick: onCellDoubleClickHandler,
            onEventClick: onEventClickHandler,
            onEventDoubleClick: onEventDoubleClickHandler,
            onMoreEventsClick,
            onDataChangeStart,
            onDataChangeComplete,
            eventDrag,
            eventResize,
            onResizeStart,
            onResizing,
            onResizeStop,
            onDragStart,
            onDrag,
            onDragStop,
            onError,
            enableRecurrenceValidation,
            viewComponents,
            weekRule,
            timezone,
            timezoneDataSource
        });

        const {
            eventsData,
            eventsProcessed,
            addEvent,
            deleteEvent,
            saveEvent
        } = useData({
            activeViewProps,
            renderDates,
            confirmationDialog
        });

        processedEventsRef.current = eventsProcessed;
        const openQuickInfoPopup: (data: EventModel | SchedulerCellDetails, element?: HTMLElement | null) => void =
            (data: SchedulerCellDetails | EventModel, element?: HTMLElement | null) => {
                const isEvent: (d: EventModel | SchedulerCellDetails) => d is EventModel = (d: SchedulerCellDetails | EventModel): d is EventModel => !!d && ('guid' in d);
                if (isEvent(data)) {
                    if (element) {
                        cellEditRef.current?.handleEventClick(data, element);
                    }
                    return;
                }

                if (data && data?.element) {
                    cellEditRef.current?.handleCellClick(data as SchedulerCellClickEvent, data?.element);
                }
            };

        const openEditor: (action: EditAction, data: EventModel | SchedulerCellDetails) => void =
            (action: EditAction, data: SchedulerCellDetails | EventModel) => {
                if (action === 'Add') {
                    onMoreDetails(data as SchedulerCellClickEvent);
                } else if (action === 'Edit' || action === 'EditSeries' || action === 'EditOccurrence') {
                    onEditEvent(data as EventModel, action);
                }
            };

        const getEventDetails: (appointmentEl?: Element | RefObject<HTMLElement>) => EventModel =
            (appointmentEl?: Element | RefObject<HTMLElement> | null) => {
                const element: HTMLElement | null = (appointmentEl && 'current' in (appointmentEl))
                    ? ((appointmentEl as RefObject<HTMLElement>)?.current)
                    : (appointmentEl as HTMLElement | null);
                const guid: string | null = element?.getAttribute?.('data-guid');
                const record: EventModel | undefined = EventService.getEventByGuid(eventsData, guid);
                return record ?? null;
            };

        const getSelectedCellDetails: (cells?: Element | Element[]) => SchedulerCellDetails =
            (cells?: Element | Element[] | null): SchedulerCellDetails | null => {
                const details: {
                    startTime?: Date;
                    endTime?: Date;
                    isAllDay: boolean;
                    element: HTMLElement;
                } = getCellDetails(cells as any, timeScale);
                const evt: SchedulerCellDetails = {
                    startTime: details.startTime as Date,
                    endTime: details.endTime as Date,
                    isAllDay: details.isAllDay,
                    element: details.element
                };
                return evt;
            };

        const scrollToHours: (hour: string, date?: Date) => void = (hour: string, date?: Date) => {
            const root: HTMLDivElement = schedulerElementRef.current;
            if (date) {
                const dateOnly: number = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                const existingCell: Element = root?.querySelector(`.${CSS_CLASSES.WORK_CELLS}[data-date="${dateOnly}"]`);
                if (!existingCell) {
                    handleCalendarChange({ value: date });
                    requestAnimationFrame(() => scrollToHour(hour, date, schedulerElementRef));
                } else {
                    requestAnimationFrame(() => scrollToHour(hour, date, schedulerElementRef));
                }
            } else {
                requestAnimationFrame(() => scrollToHour(hour, undefined, schedulerElementRef));
            }
        };

        const EditorPopup: ((props: SchedulerEditorProps) => React.ReactNode) | FC<SchedulerEditorProps> =
            activeViewProps.editor ?? editor ?? SchedulerEditorPopup;

        const APIs: IScheduler = useMemo(() => ({
            element: schedulerElementRef.current,
            addEvent: addEvent,
            deleteEvent: deleteEvent,
            saveEvent: saveEvent,
            openEditor,
            closeEditor: () => {
                onClose();
            },
            getEventDetails,
            getCellDetails: getSelectedCellDetails,
            closeQuickInfoPopup: () => {
                cellEditRef.current?.hide();
            },
            openQuickInfoPopup,
            scrollTo: scrollToHours
        }), [addEvent, deleteEvent, saveEvent, schedulerElementRef.current, eventsData, onClose,
            renderDates, scrollToHour]);

        useEffect(() => {
            schedulerRef.current = APIs;
        }, [APIs]);

        useEffect(() => {
            preRender('schedule');
        }, []);

        useEffect(() => {
            requestAnimationFrame(() => scrollToWorkHour(scrollToSettings, schedulerElementRef));
        }, [internalCurrentView, internalSelectedDate, scrollToSettings?.enable, scrollToSettings?.mode, scrollToSettings?.offset]);

        useImperativeHandle(ref, () => APIs, [APIs]);

        const contextValue: ActiveViewProps = {
            ...activeViewProps,
            handleCalendarChange,
            handleViewButtonClick,
            handlePreviousClick,
            handleNextClick,
            handleTodayClick,
            schedulerRef,
            morePopupRef,
            quickPopupRef: cellEditRef,
            keyboardNavigation,
            confirmationDialog,
            showDeleteAlert: (callback: () => void) => {
                confirmationDialog?.show({
                    title: getString('deleteEvent'),
                    message: getString('confirmDeleteMessage'),
                    confirmText: getString('delete'),
                    showCancel: true,
                    onConfirm: () => {
                        callback();
                        confirmationDialog.hide();
                    }
                });
            },
            showRecurrenceAlert: (action: AlertAction, onSelect: (selectOption: CrudAction) => void) =>
                showRecurrenceAlert(action, confirmationDialog, getString, onSelect)
        };

        const isTooltipEnabled: boolean = eventTooltip === true || typeof eventTooltip === 'object';
        const tooltipProps: SchedulerTooltipProps | undefined =
            typeof eventTooltip === 'object' ? (eventTooltip as SchedulerTooltipProps) : undefined;

        const schedulerTable: JSX.Element = (
            <>
                <div className={CSS_CLASSES.TABLE_CONTAINER}>
                    <div className={CSS_CLASSES.TABLE_WRAP}>
                        <CloneEventProvider>
                            <CloneEvent />
                            {renderCurrentView()}
                        </CloneEventProvider>
                    </div>
                </div>

                <MorePopup
                    ref={morePopupRef}
                />
            </>
        );

        return (
            <div
                ref={schedulerElementRef}
                className={classNames}
                style={{ height, width }}
                tabIndex={0}
                role='application'
                aria-label="Scheduler"
                onKeyDown={useKeyboard(contextValue, eventsData, eventsProcessed)}
                {...rest}
            >
                <SchedulerContext.Provider value={contextValue}>
                    <SchedulerRenderDatesContext.Provider value={{ renderDates }}>
                        <SchedulerEventsContext.Provider value={{ eventsData, eventsProcessed }}>
                            <ResourceGroupingProvider>
                                <SchedulerPopupStateProvider>
                                    {header !== false &&
                                        <SchedulerToolbar
                                            view={internalCurrentView}
                                            availableViews={viewComponents}
                                            onViewButtonClick={handleViewButtonClick}
                                            onPreviousClick={handlePreviousClick}
                                            onNextClick={handleNextClick}
                                            onTodayClick={handleTodayClick}
                                            onDateDropdownClick={handleDateDropdownClick}
                                            dateRangeText={dateRangeText}
                                            isCalendarOpen={showCalendar}
                                            calendarView={calendarView}
                                            selectedDate={internalSelectedDate}
                                            firstDayOfWeek={activeViewProps.firstDayOfWeek}
                                            onCalendarChange={handleCalendarChange}
                                            renderDates={renderDates}
                                            customizeHeader={typeof header === 'function' ? header : undefined}
                                            schedulerElementRef={schedulerElementRef}
                                        />
                                    }

                                    {isTooltipEnabled ? (
                                        <SchedulerTooltip
                                            {...(tooltipProps || {})}
                                            onTooltipOpen={onTooltipOpen}
                                            containerRef={schedulerElementRef}
                                        >
                                            {schedulerTable}
                                        </SchedulerTooltip>
                                    ) : (
                                        schedulerTable
                                    )}

                                    <QuickInfoPopup
                                        ref={cellEditRef}
                                        onClose={handleClose}
                                        onEditEvent={onEditEvent}
                                        onMoreDetails={onMoreDetails}
                                    />

                                    <EditorProvider editorState={editorState}>
                                        <EditorPopup
                                            open={open}
                                            onClose={onClose}
                                            data={data}
                                            action={action}
                                            originalData={originalData}
                                        />
                                    </EditorProvider>

                                    <ConfirmationDialog
                                        visible={dialogState.visible}
                                        title={dialogState.title}
                                        message={dialogState.message}
                                        confirmText={dialogState.confirmText}
                                        showCancel={dialogState.showCancel}
                                        action={dialogState.action}
                                        onConfirm={dialogState.onConfirm || (() => confirmationDialog.hide())}
                                        onCancel={confirmationDialog.hide}
                                    />
                                </SchedulerPopupStateProvider>
                            </ResourceGroupingProvider>
                        </SchedulerEventsContext.Provider>
                    </SchedulerRenderDatesContext.Provider>
                </SchedulerContext.Provider>
            </div>
        );
    });

Scheduler.displayName = 'Scheduler';
export default Scheduler;
