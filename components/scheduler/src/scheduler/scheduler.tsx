import {
    forwardRef, useRef, useImperativeHandle, useMemo, useEffect, Ref,
    ForwardRefExoticComponent, RefAttributes, RefObject, useState
} from 'react';
import { SchedulerContext } from './context/scheduler-context';
import { SchedulerRenderDatesContext } from './context/scheduler-render-dates-context';
import { SchedulerEventsContext } from './context/scheduler-events-context';
import { SchedulerProps } from './types/scheduler-types';
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
import { EditorPopup } from './components/popup/editor-popup';
import { useEditorPopup, UseEditorPopupResult } from './hooks/useEditorPopup';
import { ConfirmationDialogState, useConfirmationDialog } from './hooks/useConfirmationDialog';

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
     * @returns {void}
     */
    deleteEvent(id: string | number | Record<string, any> | Record<string, any>[]): void;

    /**
     * Updates the changes made in the event object by passing it as an parameter into the dataSource.
     *
     * @param {Object | Object[]} data Single or collection of event objects to be saved into Scheduler.
     * @returns {void}
     */
    saveEvent(data: Record<string, any> | Record<string, any>[]): void;

    /**
     * The Scheduler component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;
}

/**
 * The React Scheduler component that displays a list of events scheduled at specific dates and times, helping users plan and manage their schedule effectively.
 *
 * ```typescript
 * import { Scheduler, DayView, WeekView, WorkWeekView, MonthView } from '@syncfusion/react-scheduler';
 *
 * <Scheduler>
 *   <DayView />
 *   <WeekView />
 *   <WorkWeekView />
 *   <MonthView />
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
            eventOverlap,
            rowAutoHeight,
            readOnly,
            showQuickInfoPopup,
            showHeaderBar,
            keyboardNavigation,
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
            children,
            className,
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

        const {
            cellEditRef,
            handleClose,
            onCellClickHandler,
            onEventClickHandler
        } = usePopup(
            onCellClick,
            onEventClick
        );

        const editorState: UseEditorPopupResult = useEditorPopup(onCellDoubleClick, onEventDoubleClick, handleClose);
        const { open, onClose, onCellDoubleClickHandler, onEventDoubleClickHandler } = editorState;

        const { locale } = useProviderContext();
        const { getString } = useSchedulerLocalization(locale || 'en-US');

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
            selectedDate,
            defaultSelectedDate,
            view,
            defaultView,
            eventSettings,
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
            eventOverlap,
            showQuickInfoPopup,
            showHeaderBar,
            keyboardNavigation,
            rowAutoHeight,
            readOnly,
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
            viewComponents
        });

        const {
            eventsData,
            addEvent,
            deleteEvent,
            saveEvent
        } = useData({
            activeViewProps,
            renderDates
        });

        const APIs: IScheduler = useMemo(() => ({
            element: schedulerElementRef.current,
            addEvent: addEvent,
            deleteEvent: deleteEvent,
            saveEvent: saveEvent
        }), [addEvent, deleteEvent, saveEvent, schedulerElementRef.current]);

        useEffect(() => {
            schedulerRef.current = APIs;
        }, [APIs]);

        useEffect(() => {
            preRender('scheduler');
        }, []);

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
            }
        };

        return (
            <div
                ref={schedulerElementRef}
                className={classNames}
                style={{ height, width }}
                tabIndex={0}
                role='application'
                aria-label="Scheduler"
                onKeyDown={useKeyboard(contextValue, eventsData)}
                {...rest}
            >
                <SchedulerContext.Provider value={contextValue}>
                    <SchedulerRenderDatesContext.Provider value={{ renderDates }}>
                        <SchedulerEventsContext.Provider value={{eventsData}}>
                            {activeViewProps.showHeaderBar &&
                                <SchedulerToolbar
                                    view={internalCurrentView}
                                    availableViews={viewComponents}
                                    onViewButtonClick={handleViewButtonClick}
                                    onPreviousClick={handlePreviousClick}
                                    onNextClick={handleNextClick}
                                    onTodayClick={handleTodayClick}
                                    onDateDropdownClick={handleDateDropdownClick}
                                    dateRangeText={dateRangeText}
                                    showCalendar={showCalendar}
                                    calendarView={calendarView}
                                    selectedDate={internalSelectedDate}
                                    firstDayOfWeek={activeViewProps.firstDayOfWeek}
                                    handleCalendarChange={handleCalendarChange}
                                />
                            }

                            <div className={CSS_CLASSES.TABLE_CONTAINER}>
                                <div className={CSS_CLASSES.TABLE_WRAP}>
                                    <CloneEventProvider>
                                        <CloneEvent />
                                        {renderCurrentView()}
                                    </CloneEventProvider>
                                </div>
                            </div>

                            <QuickInfoPopup
                                ref={cellEditRef}
                                onClose={handleClose}
                                onEditEvent={editorState.onEditEvent}
                                onMoreDetails={editorState.onMoreDetails}
                            />
                            <MorePopup
                                ref={morePopupRef}
                            />
                            <EditorPopup
                                open={open}
                                onClose={onClose}
                                editor={editorState}
                            />
                            <ConfirmationDialog
                                visible={dialogState.visible}
                                title={dialogState.title}
                                message={dialogState.message}
                                confirmText={dialogState.confirmText}
                                showCancel={dialogState.showCancel}
                                onConfirm={dialogState.onConfirm || (() => confirmationDialog.hide())}
                                onCancel={confirmationDialog.hide}
                            />
                        </SchedulerEventsContext.Provider>
                    </SchedulerRenderDatesContext.Provider>
                </SchedulerContext.Provider>
            </div>
        );
    });

Scheduler.displayName = 'Scheduler';
export default Scheduler;
