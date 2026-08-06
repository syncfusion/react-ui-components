import {
    forwardRef, useRef, useImperativeHandle, useMemo, useEffect, Ref,
    ForwardRefExoticComponent, RefAttributes, RefObject, useState
} from 'react';
import { ScheduleContext } from './context/schedule-context';
import { ScheduleRenderDatesContext } from './context/schedule-render-dates-context';
import { ScheduleEventsContext } from './context/schedule-events-context';
import { ScheduleProps } from './types/schedule-types';
import { defaultScheduleProps } from './utils/default-props';
import { mergeScheduleProps } from './utils/merge-utils';
import { ViewService } from './services/ViewService';
import { useSchedule } from './hooks/useSchedule';
import { ScheduleToolbar } from './components/schedule-toolbar';
import { ActiveViewProps, ViewsInfo } from './types/internal-interface';
import { usePopup } from './hooks/useQuickInfoPopup';
import { useData } from './hooks/useData';
import { QuickInfoPopup } from './components/popup/quick-info-popup';
import { MorePopup, IMorePopup } from './components/popup/more-popup';
import { CSS_CLASSES } from './common/constants';
import { useScheduleLocalization } from './common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import useKeyboard from './hooks/useKeyboard';
import { CloneEventProvider } from './context/clone-event-context';
import { CloneEvent } from './components/clone-event';
import ConfirmationDialog from './components/popup/confirmation-dialog';
import { EditorPopup } from './components/popup/editor-popup';
import { useEditorPopup, UseEditorPopupResult } from './hooks/useEditorPopup';

export interface ISchedule extends ScheduleProps {
    /**
     * The Schedule component element.
     *
     * @private
     * @default null
     */
    element?: HTMLDivElement | null;

    /**
     * Adds an event to the Schedule.
     *
     * @param data
     */
    addEvent?: (data: Record<string, any> | Record<string, any>[]) => void;

    /**
     * Deletes an event from the Schedule.
     *
     * @param id
     */
    deleteEvent?: (id: string | number | Record<string, any> | Record<string, any>[]) => void;

    /**
     * Saves an event in the Schedule.
     *
     * @param data
     */
    saveEvent?: (data: Record<string, any> | Record<string, any>[]) => void;
}

/**
 * The Schedule component displays a calendar-like interface for scheduling and managing events.
 *
 * ```typescript
 * import { Schedule, DayView, WeekView, WorkWeekView, MonthView } from '@syncfusion/react-schedule';
 *
 * <Schedule height='650px' width="100%">
 *   <DayView />
 *   <WeekView />
 *   <WorkWeekView />
 *   <MonthView />
 * </Schedule>
 * ```
 */
export const Schedule: ForwardRefExoticComponent<ScheduleProps & RefAttributes<ISchedule>> =
    forwardRef<ISchedule, ScheduleProps>((props: ScheduleProps, ref: Ref<ISchedule>) => {
        const {
            height,
            width,
            selectedDate,
            currentView,
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
            dateHeaderTemplate,
            cellTemplate,
            allowOverlap,
            rowAutoHeight,
            readOnly,
            calendarMode,
            showQuickInfoPopup,
            showHeaderBar,
            allowKeyboardInteraction,
            onDataBinding,
            onSelectedDateChange,
            onCurrentViewChange,
            onCellClick,
            onCellDoubleClick,
            onEventClick,
            onEventDoubleClick,
            onActionBegin,
            onNavigating,
            onActionComplete,
            onEventRendered,
            allowDragAndDrop,
            allowResizing,
            onResizeStart,
            onResizing,
            onResizeStop,
            onDragStart,
            onDrag,
            onDragStop,
            onActionFailure,
            onMoreEventsClick,
            children,
            className,
            ...rest
        } = mergeScheduleProps(defaultScheduleProps, props) as ScheduleProps;

        const scheduleElementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
        const scheduleRef: RefObject<ISchedule> = useRef<ISchedule>(null);
        const morePopupRef: RefObject<IMorePopup> = useRef<IMorePopup>(null);

        const [showDeleteDialog, setShowDeleteDialog] = useState(false);
        const [pendingDelete, setPendingDelete] = useState<(() => void) | null>(null);

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
        const { getString } = useScheduleLocalization(locale || 'en-US');

        const viewComponents: ViewsInfo[] = useMemo((): ViewsInfo[] => {
            return ViewService.getViewsInfo(children, getString);
        }, [children]);

        const {
            classNames,
            selectedDate: internalSelectedDate,
            currentView: internalCurrentView,
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
        } = useSchedule({
            className,
            selectedDate,
            currentView,
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
            dateHeaderTemplate,
            cellTemplate,
            allowOverlap,
            showQuickInfoPopup,
            showHeaderBar,
            allowKeyboardInteraction,
            rowAutoHeight,
            readOnly,
            onDataBinding,
            onSelectedDateChange,
            onCurrentViewChange,
            onCellClick: onCellClickHandler,
            onCellDoubleClick: onCellDoubleClickHandler,
            onEventClick: onEventClickHandler,
            onEventDoubleClick: onEventDoubleClickHandler,
            onMoreEventsClick,
            onActionBegin,
            onNavigating,
            onActionComplete,
            onEventRendered,
            allowDragAndDrop,
            allowResizing,
            onResizeStart,
            onResizing,
            onResizeStop,
            onDragStart,
            onDrag,
            onDragStop,
            onActionFailure,
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

        const handleConfirmDelete: () => void = () => {
            pendingDelete();
            setShowDeleteDialog(false);
            setPendingDelete(null);
        };

        const handleCancelDelete: () => void = () => {
            setShowDeleteDialog(false);
            setPendingDelete(null);
        };

        const APIs: ISchedule = useMemo(() => ({
            element: scheduleElementRef.current,
            addEvent: addEvent,
            deleteEvent: deleteEvent,
            saveEvent: saveEvent
        }), [addEvent, deleteEvent, saveEvent, scheduleElementRef.current]);

        useEffect(() => {
            scheduleRef.current = APIs;
        }, [APIs]);

        useImperativeHandle(ref, () => APIs, [APIs]);

        const contextValue: ActiveViewProps = {
            ...activeViewProps,
            handleCalendarChange,
            handleViewButtonClick,
            handlePreviousClick,
            handleNextClick,
            handleTodayClick,
            scheduleRef,
            morePopupRef,
            quickPopupRef: cellEditRef,
            allowKeyboardInteraction,
            showDeleteAlert: (callback: () => void) => {
                setPendingDelete(() => callback);
                setShowDeleteDialog(true);
            }
        };

        return (
            <div
                ref={scheduleElementRef}
                className={classNames}
                style={{ height, width }}
                tabIndex={0}
                aria-label="Schedule"
                onKeyDown={useKeyboard(contextValue, eventsData)}
                {...rest}
            >
                <ScheduleContext.Provider value={contextValue}>
                    <ScheduleRenderDatesContext.Provider value={{ renderDates }}>
                        <ScheduleEventsContext.Provider value={{eventsData}}>
                            {activeViewProps.showHeaderBar &&
                                <ScheduleToolbar
                                    currentView={internalCurrentView}
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
                                visible={showDeleteDialog}
                                onConfirm={handleConfirmDelete}
                                onCancel={handleCancelDelete}
                            />
                        </ScheduleEventsContext.Provider>
                    </ScheduleRenderDatesContext.Provider>
                </ScheduleContext.Provider>
            </div>
        );
    });

Schedule.displayName = 'Schedule';
export default Schedule;
