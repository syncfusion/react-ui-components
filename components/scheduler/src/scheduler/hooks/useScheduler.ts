import { useState, useEffect, ReactNode, useCallback, useMemo, useRef, RefObject } from 'react';
import { SchedulerProps, ViewSpecificProps, SchedulerViewChangeEvent, SchedulerDateChangeEvent } from '../types/scheduler-types';
import { ViewsInfo, ActiveViewProps } from '../types/internal-interface';
import { defaultSchedulerProps } from '../utils/default-props';
import { mergeSchedulerProps } from '../utils/merge-utils';
import { useProviderContext } from '@syncfusion/react-base';
import { ViewService } from '../services/ViewService';
import { DateService } from '../services/DateService';
import { NavigationService, NavigationOptions  } from '../services/NavigationService';
import { CalendarView, CalendarChangeEvent } from '@syncfusion/react-calendars';
import { CSS_CLASSES } from '../common/constants';

/**
 * Props interface for useScheduler hook
 */
interface UseSchedulerProps extends SchedulerProps {
    /**
     * Array of view components
     */
    viewComponents: ViewsInfo[];
}

/**
 * Result interface for useScheduler hook
 */
interface UseSchedulerResult {
    /**
     * The class names for the scheduler
     */
    classNames: string;

    /**
     * The current selected date
     */
    selectedDate: Date;

    /**
     * The current active view
     */
    view: string;

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
    handleCalendarChange: (args: CalendarChangeEvent) => void;

    /**
     * Render the current view component
     */
    renderCurrentView: () => ReactNode;
}

/**
 * Hook for managing scheduler state and functionality
 *
 * @param {UseSchedulerProps} props - Scheduler component props
 * @returns {UseSchedulerResult} Scheduler state and handlers
 * @private
 */
export const useScheduler: (props: UseSchedulerProps) => UseSchedulerResult = (props: UseSchedulerProps): UseSchedulerResult => {
    const {
        className,
        selectedDate: propSelectedDate,
        view: propCurrentView,
        onSelectedDateChange,
        onViewChange,
        viewComponents,
        defaultSelectedDate,
        defaultView
    } = props;

    const isSelectedDateControlled: boolean = props.selectedDate !== undefined;
    const isViewControlled: boolean = props.view !== undefined;

    const validatedSelectedDate: Date = useMemo(() => {
        const base: Date = isSelectedDateControlled ? propSelectedDate : defaultSelectedDate;
        const date: Date = base ? new Date(base) : new Date();
        return isNaN(date.getTime()) ? new Date() : date;
    }, [propSelectedDate, defaultSelectedDate, isSelectedDateControlled]);

    const validatedView: string = useMemo(() => {
        return isViewControlled ? propCurrentView : defaultView;
    }, [isViewControlled, propCurrentView, defaultView]);

    const [internalSelectedDate, setInternalSelectedDate] = useState<Date>(validatedSelectedDate);
    const [internalCurrentView, setInternalCurrentView] = useState<string>(validatedView);
    const prevPropCurrentViewRef: RefObject<string> = useRef<string>(validatedView);
    const [renderDates, setRenderDates] = useState<Date[]>([]);
    const [showCalendar, setShowCalendar] = useState<boolean>(false);
    const [calendarView, setCalendarView] = useState<CalendarView>(CalendarView.Month);

    useEffect(() => {
        if (isSelectedDateControlled) {
            setInternalSelectedDate(validatedSelectedDate);
        }
    }, [validatedSelectedDate, isSelectedDateControlled]);

    useEffect(() => {
        if (isViewControlled) {
            setInternalCurrentView(validatedView);
        }
    }, [validatedView, isViewControlled]);

    const handleCurrentViewChange: (view: string) => void = useCallback((view: string): void => {
        if (!isViewControlled) {
            setInternalCurrentView(view);
        }
        const viewChangeEvent: SchedulerViewChangeEvent = {
            value: view
        };
        if (onViewChange) {
            onViewChange(viewChangeEvent);
        }
    }, [onViewChange, isViewControlled]);

    useEffect(() => {
        const prevPropCurrentView: string = prevPropCurrentViewRef.current;
        if (prevPropCurrentView !== propCurrentView && propCurrentView !== internalCurrentView && propCurrentView) {
            const viewExists: boolean = viewComponents.some((v: ViewsInfo) => v.name === propCurrentView);
            if (viewExists) {
                setInternalCurrentView(propCurrentView);
            }
        }
        prevPropCurrentViewRef.current = propCurrentView || validatedView;
    }, [propCurrentView, internalCurrentView, viewComponents, validatedView]);

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

    const dateRangeText: string = useMemo(() => {
        if (!renderDates || renderDates.length === 0) { return ''; }

        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );
        if (!viewComponent) { return ''; }

        const viewProps: ViewSpecificProps = viewComponent.component.props;
        if (viewComponent.viewType === 'Month') {
            return DateService.getMonthRangeText(
                internalSelectedDate,
                viewComponent.interval,
                viewProps.displayDate,
                viewProps.numberOfWeeks,
                viewProps.dateFormat || props.dateFormat,
                renderDates,
                locale
            );
        }
        return DateService.formatDateRange(locale, renderDates[0], renderDates[renderDates.length - 1]);
    }, [renderDates, viewComponents, internalCurrentView, internalSelectedDate, locale, props.dateFormat]);

    const handleSelectedDateChange: (date: Date) => void = (date: Date): void => {
        if (!isSelectedDateControlled) {
            setInternalSelectedDate(date);
        }
        if (onSelectedDateChange) {
            const dateChangeEvent: SchedulerDateChangeEvent = {
                value: date
            };
            onSelectedDateChange(dateChangeEvent);
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

    const getSchedulerProps: () => SchedulerProps = (): SchedulerProps => {
        return {
            height: props.height,
            width: props.width,
            selectedDate: internalSelectedDate,
            view: internalCurrentView,
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
            showWeekNumber: props.showWeekNumber,
            eventOverlap: props.eventOverlap,
            rowAutoHeight: props.rowAutoHeight,
            readOnly: props.readOnly,
            cell: props.cell,
            dateHeader: props.dateHeader,
            showQuickInfoPopup: props.showQuickInfoPopup,
            showHeaderBar: props.showHeaderBar,
            keyboardNavigation: props.keyboardNavigation,
            onDataRequest: props.onDataRequest,
            onSelectedDateChange: (event: SchedulerDateChangeEvent) => handleSelectedDateChange(event.value),
            onViewChange: (event: SchedulerViewChangeEvent) => handleCurrentViewChange(event.value),
            onCellClick: props.onCellClick,
            onCellDoubleClick: props.onCellDoubleClick,
            onEventClick: props.onEventClick,
            onEventDoubleClick: props.onEventDoubleClick,
            onDataChangeStart: props.onDataChangeStart,
            onDataChangeComplete: props.onDataChangeComplete,
            eventDrag: props.eventDrag,
            eventResize: props.eventResize,
            onResizeStart: props.onResizeStart,
            onResizing: props.onResizing,
            onResizeStop: props.onResizeStop,
            onDragStart: props.onDragStart,
            onDrag: props.onDrag,
            onDragStop: props.onDragStop,
            onMoreEventsClick: props.onMoreEventsClick
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
        const rootProps: SchedulerProps = mergeSchedulerProps(defaultSchedulerProps, getSchedulerProps()) as SchedulerProps;

        const mergedProps: ActiveViewProps = {
            height: rootProps.height,
            width: rootProps.width,
            selectedDate: DateService.setValidDate(rootProps.selectedDate),
            view: rootProps.view,
            eventSettings: rootProps.eventSettings,
            workHours: rootProps.workHours,
            showTimeIndicator: rootProps.showTimeIndicator,
            rowAutoHeight: rootProps.rowAutoHeight,
            eventTemplate: viewProps.eventTemplate,
            readOnly: viewProps.readOnly ?? rootProps.readOnly,
            showHeaderBar: rootProps.showHeaderBar,
            showQuickInfoPopup: rootProps.showQuickInfoPopup,
            displayDate: DateService.setValidDate(viewProps.displayDate),
            numberOfWeeks: viewProps.numberOfWeeks,
            weekDay: viewProps.weekDay,
            showTrailingAndLeadingDates: viewProps.showTrailingAndLeadingDates,
            cellHeader: viewProps.cellHeader,
            interval: viewProps.interval ?? viewComponent.interval,
            displayName: viewProps.displayName ?? viewComponent.displayName,
            maxEventsPerRow: viewProps.maxEventsPerRow,
            dateHeader: viewProps.dateHeader ?? rootProps.dateHeader,
            cell: viewProps.cell ?? rootProps.cell,
            timeScale: viewProps.timeScale ?? rootProps.timeScale,
            startHour: viewProps.startHour ?? rootProps.startHour,
            endHour: viewProps.endHour ?? rootProps.endHour,
            showWeekend: viewProps.showWeekend ?? rootProps.showWeekend,
            firstDayOfWeek: DateService.setValidFirstDayOfWeek(viewProps.firstDayOfWeek, rootProps.firstDayOfWeek),
            workDays: viewProps.workDays ?? rootProps.workDays,
            dateFormat: viewProps.dateFormat ?? rootProps.dateFormat,
            timeFormat: viewProps.timeFormat ?? rootProps.timeFormat,
            showWeekNumber: viewProps.showWeekNumber ?? rootProps.showWeekNumber,
            eventOverlap: viewProps.eventOverlap ?? rootProps.eventOverlap,
            onDataRequest: rootProps.onDataRequest,
            onSelectedDateChange: rootProps.onSelectedDateChange,
            onViewChange: rootProps.onViewChange,
            onCellClick: rootProps.onCellClick,
            onCellDoubleClick: rootProps.onCellDoubleClick,
            onEventClick: rootProps.onEventClick,
            onEventDoubleClick: rootProps.onEventDoubleClick,
            onDataChangeStart: rootProps.onDataChangeStart,
            onDataChangeComplete: rootProps.onDataChangeComplete,
            keyboardNavigation: rootProps.keyboardNavigation,
            eventDrag: rootProps.eventDrag,
            eventResize: rootProps.eventResize,
            onResizeStart: rootProps.onResizeStart,
            onResizing: rootProps.onResizing,
            onResizeStop: rootProps.onResizeStop,
            onDragStart: rootProps.onDragStart,
            onDrag: rootProps.onDrag,
            onDragStop: rootProps.onDragStop,
            onMoreEventsClick: rootProps.onMoreEventsClick,
            handleCurrentViewChange,
            getAvailableViews
        };
        if (mergedProps.startHour !== '00:00' || mergedProps.endHour !== '24:00') {
            mergedProps.startHourTuple = [Number(mergedProps.startHour?.split(':')[0]), Number(mergedProps.startHour?.split(':')[1])];
            mergedProps.endHourTuple = [Number(mergedProps.endHour?.split(':')[0]), Number(mergedProps.endHour?.split(':')[1])];
        }
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

    const handleNavigation: (flow: 'next' | 'previous') => void = (flow: 'next' | 'previous'): void => {
        const viewComponent: ViewsInfo | undefined = ViewService.findViewByNameOrType(
            viewComponents,
            internalCurrentView
        );

        if (!viewComponent) { return; }

        const navOptions: NavigationOptions  = {
            currentDate: internalSelectedDate,
            viewType: viewComponent.viewType,
            interval: viewComponent.interval,
            showWeekend: activeViewProps.showWeekend,
            workDays: activeViewProps.workDays
        };
        const newDate: Date = flow === 'next'
            ? NavigationService.navigateToNext(navOptions)
            : NavigationService.navigateToPrevious(navOptions);

        handleSelectedDateChange(newDate);
    };

    const handleNextClick: () => void = (): void => {
        handleNavigation('next');
    };

    const handlePreviousClick: () => void = (): void => {
        handleNavigation('previous');
    };

    const handleTodayClick: () => void = (): void => {
        const today: Date = NavigationService.navigateToToday();
        handleSelectedDateChange(today);
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
     * Compute CSS class names for the scheduler
     */
    const classNames: string = useMemo<string>(() => {
        const classArray: string[] = [
            CSS_CLASSES.CONTROL,
            CSS_CLASSES.SCHEDULER
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
        view: internalCurrentView,
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
 * @private
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
            if (isOpen && elementRef.current && !elementRef.current.contains(e.target as Node) &&
                !(e.target as HTMLElement)?.closest(`.${CSS_CLASSES.POPUP_WRAPPER}`)) {
                onOutsideClick();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen, elementRef]);
};
