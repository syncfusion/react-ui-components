import { useState, useEffect, ReactNode, useCallback, useMemo, useRef, RefObject } from 'react';
import { ActionEventArgs, NavigatingEventArgs, ScheduleProps, ViewSpecificProps } from '../types/schedule-types';
import { View } from '../types/enums';
import { ViewsInfo, ActiveViewProps } from '../types/internal-interface';
import { defaultScheduleProps } from '../utils/default-props';
import { mergeScheduleProps } from '../utils/merge-utils';
import { useProviderContext } from '@syncfusion/react-base';
import { ViewService } from '../services/ViewService';
import { DateService } from '../services/DateService';
import { NavigationService } from '../services/NavigationService';
import { CalendarView, CalendarChangeEvent } from '@syncfusion/react-calendars';
import { CSS_CLASSES } from '../common/constants';

/**
 * Props interface for useSchedule hook
 */
interface UseScheduleProps extends ScheduleProps {
    /**
     * Array of view components
     */
    viewComponents: ViewsInfo[];
}

/**
 * Result interface for useSchedule hook
 */
interface UseScheduleResult {
    /**
     * The class names for the schedule
     */
    classNames: string;

    /**
     * The current selected date
     */
    selectedDate: Date;

    /**
     * The current active view
     */
    currentView: string;

    /**
     * The dates to render in the current view
     */
    renderDates: Date[];

    /**
     * The merged props for the current active view
     */
    activeViewProps: ActiveViewProps;

    /**
     * The formatted date range text
     */
    dateRangeText: string;

    /**
     * Whether the calendar popup is showing
     */
    showCalendar: boolean;

    /**
     * Specifies the view of the Calendar.
     *
     * @default 'Month'
     */
    calendarView?: CalendarView;

    /**
     * Handle selected date change
     */
    handleSelectedDateChange: (date: Date) => void;

    /**
     * Handle current view change
     */
    handleCurrentViewChange: (view: string) => void;

    /**
     * Get available views from view components
     */
    getAvailableViews: () => ViewsInfo[];

    /**
     * Handle view button click
     */
    handleViewButtonClick: (name: string) => void;

    /**
     * Handle navigation to previous time period
     */
    handlePreviousClick: () => void;

    /**
     * Handle navigation to next time period
     */
    handleNextClick: () => void;

    /**
     * Handle navigation to today
     */
    handleTodayClick: () => void;

    /**
     * Handle date dropdown click
     */
    handleDateDropdownClick: () => void;

    /**
     * Handle calendar date change
     */
    handleCalendarChange: (args: any) => void;

    /**
     * Render the current view component
     */
    renderCurrentView: () => ReactNode;
}

/**
 * Hook for managing schedule state and functionality
 *
 * @param {UseScheduleProps} props - Schedule component props
 * @returns {UseScheduleResult} Schedule state and handlers
 */
export const useSchedule: (props: UseScheduleProps) => UseScheduleResult = (props: UseScheduleProps): UseScheduleResult => {
    const {
        className,
        selectedDate: propSelectedDate,
        currentView: propCurrentView = 'Week',
        onSelectedDateChange,
        onCurrentViewChange,
        viewComponents,
        onActionBegin,
        onActionComplete,
        onNavigating
    } = props;

    const validatedSelectedDate: Date = useMemo(() => {
        const date: Date = propSelectedDate ? new Date(propSelectedDate) : new Date();
        return isNaN(date.getTime()) ? new Date() : date;
    }, [propSelectedDate]);

    const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(validatedSelectedDate);
    const [internalCurrentView, setInternalCurrentView] = useState<string>(propCurrentView);
    const prevPropCurrentViewRef: RefObject<string> = useRef<string>(propCurrentView);
    const [renderDates, setRenderDates] = useState<Date[]>([]);
    const [dateRangeText, setDateRangeText] = useState<string>('Select a date');
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [calendarView, setCalendarView] = useState<CalendarView>(CalendarView.Month);

    useEffect(() => {
        setInternalSelectedDate(validatedSelectedDate);
    }, [validatedSelectedDate]);

    const handleCurrentViewChange: (view: string) => void = useCallback((view: string): void => {
        setInternalCurrentView(view);
        if (onCurrentViewChange) {
            onCurrentViewChange(view as View);
        }
    }, [onCurrentViewChange]);

    useEffect(() => {
        const prevPropCurrentView: string = prevPropCurrentViewRef.current;
        if (prevPropCurrentView !== propCurrentView && propCurrentView !== internalCurrentView) {
            const viewExists: boolean = viewComponents.some((v: ViewsInfo) => v.name === propCurrentView);
            if (viewExists) {
                setInternalCurrentView(propCurrentView);
            }
        }
        prevPropCurrentViewRef.current = propCurrentView;
    }, [propCurrentView, internalCurrentView, viewComponents]);

    useEffect(() => {
        if (internalCurrentView === 'Week' && viewComponents.length > 0) {
            const weekViewExists: boolean = viewComponents.some((comp: ViewsInfo) => comp.viewType === 'Week');
            if (!weekViewExists) {
                handleCurrentViewChange(viewComponents[0].name);
                return;
            }
        }
    }, [internalCurrentView, viewComponents, handleCurrentViewChange]);

    useEffect(() => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );
        if (viewComponent) {
            const view: CalendarView = viewComponent.viewType === 'Month' ? CalendarView.Year : CalendarView.Month;
            setCalendarView(view);
        }
    }, [viewComponents, internalCurrentView]);

    const { locale, dir }: { locale: string, dir: string } = useProviderContext();

    useEffect(() => {
        if (renderDates && renderDates.length > 0) {
            const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
                viewComponents,
                internalCurrentView
            );

            if (viewComponent) {
                const viewProps: ViewSpecificProps = viewComponent.component.props;
                let formattedDate: string;
                if (viewComponent.viewType === 'Month') {
                    formattedDate = DateService.getMonthRangeText(
                        internalSelectedDate,
                        viewComponent.interval,
                        viewProps.displayDate,
                        viewProps.numberOfWeeks,
                        viewProps.dateFormat || props.dateFormat,
                        props.calendarMode || defaultScheduleProps.calendarMode,
                        renderDates,
                        locale
                    );
                } else {
                    formattedDate = DateService.formatDateRange(locale, renderDates[0], renderDates[renderDates.length - 1]);
                }
                setDateRangeText(formattedDate);
            }
        }
    }, [renderDates, locale]);

    const handleSelectedDateChange: (date: Date) => void = (date: Date): void => {
        setInternalSelectedDate(date);
        if (onSelectedDateChange) {
            onSelectedDateChange(date);
        }
    };

    const getAvailableViews: () => ViewsInfo[] = useCallback((): ViewsInfo[] => {
        const views: ViewsInfo[] = [];

        viewComponents.forEach((component: ViewsInfo) => {
            views.push({
                viewType: component.viewType,
                name: component.name,
                displayName: component.displayName,
                component: component.component,
                interval: component.interval
            });
        });

        return views;
    }, [viewComponents]);

    const handleViewButtonClick: (name: string) => void = (name: string): void => {
        handleCurrentViewChange(name);
    };

    const getScheduleProps: () => ScheduleProps = (): ScheduleProps => {
        return {
            height: props.height,
            width: props.width,
            selectedDate: internalSelectedDate,
            currentView: internalCurrentView,
            eventSettings: props.eventSettings,
            timeScale: props.timeScale,
            workHours: props.workHours,
            startHour: props.startHour,
            endHour: props.endHour,
            showWeekend: props.showWeekend,
            firstDayOfWeek: props.firstDayOfWeek,
            workDays: props.workDays,
            showTimeIndicator: props.showTimeIndicator,
            dateFormat: props.dateFormat,
            timeFormat: props.timeFormat,
            calendarMode: props.calendarMode,
            showWeekNumber: props.showWeekNumber,
            allowOverlap: props.allowOverlap,
            rowAutoHeight: props.rowAutoHeight,
            readOnly: props.readOnly,
            cellTemplate: props.cellTemplate,
            dateHeaderTemplate: props.dateHeaderTemplate,
            showQuickInfoPopup: props.showQuickInfoPopup,
            showHeaderBar: props.showHeaderBar,
            allowKeyboardInteraction: props.allowKeyboardInteraction,
            onDataBinding: props.onDataBinding,
            onSelectedDateChange: handleSelectedDateChange,
            onCurrentViewChange: handleCurrentViewChange,
            onCellClick: props.onCellClick,
            onCellDoubleClick: props.onCellDoubleClick,
            onEventClick: props.onEventClick,
            onEventDoubleClick: props.onEventDoubleClick,
            onActionBegin: props.onActionBegin,
            onActionComplete: props.onActionComplete,
            onEventRendered: props.onEventRendered,
            allowDragAndDrop: props.allowDragAndDrop,
            allowResizing: props.allowResizing,
            onResizeStart: props.onResizeStart,
            onResizing: props.onResizing,
            onResizeStop: props.onResizeStop,
            onDragStart: props.onDragStart,
            onDrag: props.onDrag,
            onDragStop: props.onDragStop,
            onMoreEventsClick: props.onMoreEventsClick,
            onNavigating: props.onNavigating
        };
    };

    const getCurrentViewProps: () => ActiveViewProps = (): ActiveViewProps => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );

        if (!viewComponent) {
            return {} as ActiveViewProps;
        }

        const viewProps: ViewSpecificProps = viewComponent.component.props || {};
        const rootProps: ScheduleProps = mergeScheduleProps(defaultScheduleProps, getScheduleProps()) as ScheduleProps;

        const mergedProps: ActiveViewProps = {
            height: rootProps.height,
            width: rootProps.width,
            selectedDate: DateService.setValidDate(rootProps.selectedDate),
            currentView: rootProps.currentView,
            eventSettings: rootProps.eventSettings,
            workHours: rootProps.workHours,
            showTimeIndicator: rootProps.showTimeIndicator,
            rowAutoHeight: rootProps.rowAutoHeight,
            eventTemplate: viewProps.eventTemplate,
            readOnly: rootProps.readOnly,
            showHeaderBar: rootProps.showHeaderBar,
            displayDate: DateService.setValidDate(viewProps.displayDate),
            numberOfWeeks: viewProps.numberOfWeeks,
            weekDayTemplate: viewProps.weekDayTemplate,
            showTrailingAndLeadingDates: viewProps.showTrailingAndLeadingDates,
            cellHeaderTemplate: viewProps.cellHeaderTemplate,
            interval: viewProps.interval ?? viewComponent.interval,
            displayName: viewProps.displayName ?? viewComponent.displayName,
            maxEventsPerRow: viewProps.maxEventsPerRow,
            dateHeaderTemplate: viewProps.dateHeaderTemplate ?? rootProps.dateHeaderTemplate,
            cellTemplate: viewProps.cellTemplate ?? rootProps.cellTemplate,
            timeScale: viewProps.timeScale ?? rootProps.timeScale,
            startHour: viewProps.startHour ?? rootProps.startHour,
            endHour: viewProps.endHour ?? rootProps.endHour,
            showWeekend: viewProps.showWeekend ?? rootProps.showWeekend,
            firstDayOfWeek: DateService.setValidFirstDayOfWeek(viewProps.firstDayOfWeek, rootProps.firstDayOfWeek),
            workDays: viewProps.workDays ?? rootProps.workDays,
            dateFormat: viewProps.dateFormat ?? rootProps.dateFormat,
            timeFormat: viewProps.timeFormat ?? rootProps.timeFormat,
            showWeekNumber: viewProps.showWeekNumber ?? rootProps.showWeekNumber,
            allowOverlap: viewProps.allowOverlap ?? rootProps.allowOverlap,
            showQuickInfoPopup: viewProps.showQuickInfoPopup ?? rootProps.showQuickInfoPopup,
            onDataBinding: rootProps.onDataBinding,
            onSelectedDateChange: rootProps.onSelectedDateChange,
            onCurrentViewChange: rootProps.onCurrentViewChange,
            onCellClick: rootProps.onCellClick,
            onCellDoubleClick: rootProps.onCellDoubleClick,
            onEventClick: rootProps.onEventClick,
            onEventDoubleClick: rootProps.onEventDoubleClick,
            onActionBegin: rootProps.onActionBegin,
            onActionComplete: rootProps.onActionComplete,
            onEventRendered: rootProps.onEventRendered,
            allowKeyboardInteraction: rootProps.allowKeyboardInteraction,
            allowDragAndDrop: rootProps.allowDragAndDrop,
            allowResizing: rootProps.allowResizing,
            onResizeStart: rootProps.onResizeStart,
            onResizing: rootProps.onResizing,
            onResizeStop: rootProps.onResizeStop,
            onDragStart: rootProps.onDragStart,
            onDrag: rootProps.onDrag,
            onDragStop: rootProps.onDragStop,
            onMoreEventsClick: rootProps.onMoreEventsClick,
            onNavigating: rootProps.onNavigating,
            handleCurrentViewChange,
            getAvailableViews
        };
        return mergedProps;
    };

    const activeViewProps: ActiveViewProps = getCurrentViewProps();

    useEffect(() => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );

        if (viewComponent) {
            const dates: Date[] = DateService.getRenderDates(
                viewComponent.viewType,
                internalSelectedDate,
                activeViewProps
            );
            setRenderDates(dates);
        }
    }, [internalSelectedDate, internalCurrentView, viewComponents]);

    useEffect(() => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );

        if (!viewComponent) {
            const availableViews: ViewsInfo[] = getAvailableViews();
            if (availableViews.length > 0) {
                const defaultView: ViewsInfo =
                    availableViews.find((v: ViewsInfo) => v.viewType === 'Week') || availableViews[0];
                handleCurrentViewChange(defaultView.name);
            }
        }
    }, [internalCurrentView, viewComponents, handleCurrentViewChange]);

    const renderCurrentView: () => ReactNode = (): ReactNode => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );

        if (!viewComponent) {
            return null;
        }

        return viewComponent.component;
    };

    const navigateWithEvents: (getNewDate: () => Date, event?: Event) => void = useCallback(
        (getNewDate: () => Date, event?: Event): void => {
            const previousDate: Date = new Date(internalSelectedDate);
            const navigationBeginArgs: ActionEventArgs = { requestType: 'dateNavigate', cancel: false, event: event };
            onActionBegin?.(navigationBeginArgs);
            if (navigationBeginArgs.cancel) { return; }

            const newDate: Date = getNewDate();
            const navigatingArgs: NavigatingEventArgs = { action: 'date', cancel: false, previousDate, currentDate: newDate };
            onNavigating?.(navigatingArgs);
            if (navigatingArgs.cancel) { return; }

            handleSelectedDateChange(newDate);
            const navigationCompleteArgs: ActionEventArgs = { requestType: 'dateNavigate', cancel: false, event: event };
            onActionComplete?.(navigationCompleteArgs);
        },
        [internalSelectedDate, onActionBegin, onNavigating, onActionComplete]
    );

    const handleNavigation: (flow: 'next' | 'previous', event?: Event) => void =
        (flow: 'next' | 'previous', event?: Event): void => {
            const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
                viewComponents,
                internalCurrentView
            );

            if (!viewComponent) { return; }

            const getNewDate: () => Date = flow === 'next'
                ? () => NavigationService.navigateToNext(internalSelectedDate, viewComponent.viewType, viewComponent.interval)
                : () => NavigationService.navigateToPrevious(internalSelectedDate, viewComponent.viewType, viewComponent.interval);

            navigateWithEvents(getNewDate, event);
        };

    const handleNextClick: (event?: Event) => void = (event?: Event): void => {
        handleNavigation('next', event);
    };

    const handlePreviousClick: (event?: Event) => void = (event?: Event): void => {
        handleNavigation('previous', event);
    };

    const handleTodayClick: (event?: Event) => void = (event?: Event): void => {
        navigateWithEvents(
            () => NavigationService.navigateToToday(),
            event
        );
    };

    const handleCalendarChange: (args: CalendarChangeEvent) => void = useCallback((args: CalendarChangeEvent): void => {
        if (args.value) {
            const calendarSelectedDate: Date = Array.isArray(args.value) ? args.value[0] : args.value;
            if (handleSelectedDateChange) {
                handleSelectedDateChange(calendarSelectedDate);
            }
            setShowCalendar(false);
        }
    }, [handleSelectedDateChange]);

    // Handle date dropdown click
    const handleDateDropdownClick: () => void = (): void => {
        setShowCalendar(!showCalendar);
    };

    /**
     * Compute CSS class names for the schedule
     */
    const classNames: string = useMemo<string>(() => {
        const classArray: string[] = [
            CSS_CLASSES.CONTROL,
            CSS_CLASSES.SCHEDULE
        ];

        if (dir === 'rtl') {
            classArray.push(CSS_CLASSES.RTL);
        }

        if (className) {
            classArray.push(className);
        }
        return classArray.join(' ');

    }, [dir, className]);

    return {
        classNames,
        selectedDate: internalSelectedDate,
        currentView: internalCurrentView,
        renderDates,
        activeViewProps,
        dateRangeText,
        showCalendar,
        calendarView,
        handleSelectedDateChange,
        handleCurrentViewChange,
        getAvailableViews,
        handleViewButtonClick,
        handlePreviousClick,
        handleNextClick,
        handleTodayClick,
        handleDateDropdownClick,
        handleCalendarChange,
        renderCurrentView
    };
};

/**
 * Hook to handle clicks outside a specific element.
 * Sets up a document-level click listener that checks if clicks occur outside the specified element.
 *
 * @param {RefObject<HTMLElement>} elementRef - Reference to the element to check clicks against
 * @param {boolean} isOpen - Whether the element is currently open/visible
 * @param {Function} onOutsideClick Callback to execute when we click outside the popup
 * @returns {void}
 */
export const useOutsideClick: (
    elementRef: RefObject<HTMLElement>,
    isOpen: boolean,
    onOutsideClick: () => void
) => void = (
    elementRef: RefObject<HTMLElement>,
    isOpen: boolean,
    onOutsideClick: () => void
): void => {
    useEffect(() => {
        const handleOutsideClick: (e: MouseEvent) => void = (e: MouseEvent): void => {
            if (isOpen && elementRef.current && !elementRef.current.contains(e.target as Node)) {
                onOutsideClick();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, elementRef]);
};
