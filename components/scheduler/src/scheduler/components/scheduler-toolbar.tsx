import * as React from 'react';
import { FC, ReactElement, useRef, useMemo, RefObject, ReactNode, forwardRef, ForwardRefRenderFunction, isValidElement, useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { Button, Variant, Color, Position, IButton } from '@syncfusion/react-buttons';
import { IToolbar, OverflowMode, Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, TimelineTodayIcon } from '@syncfusion/react-icons';
import { ViewsInfo } from '../types/internal-interface';
import { Popup, CollisionType, ActionOnScrollType } from '@syncfusion/react-popups';
import { Calendar, CalendarChangeEvent, CalendarView } from '@syncfusion/react-calendars';
import { CSS_CLASSES } from '../common/constants';
import { ItemModel, DropDownButton, ButtonSelectEvent } from '@syncfusion/react-splitbuttons';
import { Browser, useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { useOutsideClick } from '../hooks/useScheduler';
import { SchedulerHeaderProps, ToolbarButtonProps, DateRangeButtonProps, ViewButtonProps } from '../types/scheduler-types';

/**
 * Props interface for SchedulerToolbar component
 */
interface SchedulerToolbarProps {
    /**
     * The currently active view
     */
    view: string;

    /**
     * Available views for view switching
     */
    availableViews: ViewsInfo[];

    /**
     * Handler for view button click
     */
    onViewButtonClick: (name: string) => void;

    /**
     * Handler for previous button click
     */
    onPreviousClick?: () => void;

    /**
     * Handler for next button click
     */
    onNextClick?: () => void;

    /**
     * Handler for today button click
     */
    onTodayClick?: () => void;

    /**
     * Handler for date dropdown click
     */
    onDateDropdownClick?: () => void;

    /**
     * The date range text to display
     */
    dateRangeText?: string;

    /**
     * Whether the calendar popup is showing
     */
    isCalendarOpen?: boolean;

    /**
     * Specifies the view of the Calendar when it is opened.
     *
     * @default Month
     */
    calendarView?: CalendarView;

    /**
     * Currently selected date for the calendar
     */
    selectedDate?: Date;

    /**
     * First day of week for the calendar
     */
    firstDayOfWeek?: number;

    /**
     * Handler for calendar date change
     */
    onCalendarChange?: (event: CalendarChangeEvent) => void;

    /**
     * Custom header configuration props
     */
    customizeHeader?: (props: SchedulerHeaderProps) => ReactNode;

    /**
     * The render dates for date range calculation
     */
    renderDates?: Date[];

    /**
     * Reference to the scheduler element for positioning dropdowns/popups
     */
    schedulerElementRef?: RefObject<HTMLDivElement>;
}

/**
 * Today button component
 *
 * @param {ToolbarButtonProps} props - The button props
 * @returns {ReactElement} The rendered today button
 */
export const TodayButton: FC<ToolbarButtonProps> = (props: ToolbarButtonProps): ReactElement => {
    const {
        onClick,
        ariaLabel,
        title,
        disabled = false,
        icon = <TimelineTodayIcon />,
        text,
        color,
        variant,
        className
    }: ToolbarButtonProps = props;

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    return Browser.isDevice ? (
        <Button
            icon={icon}
            color={color ?? Color.Secondary}
            variant={variant ?? Variant.Standard}
            className={className ?? CSS_CLASSES.TODAY_BUTTON}
            onClick={onClick}
            aria-label={ariaLabel ?? getString('today')}
            title={title ?? getString('today')}
            disabled={disabled}
        />
    ) : (
        <Button
            icon={icon}
            variant={variant ?? Variant.Outlined}
            color={color ?? Color.Secondary}
            className={className ?? CSS_CLASSES.TODAY_BUTTON}
            onClick={onClick}
            aria-label={ariaLabel ?? getString('today')}
            title={title}
            disabled={disabled}
        >
            {text ?? getString('today')}
        </Button>
    );
};

/**
 * Previous button component
 *
 * @param {ToolbarButtonProps} props - The button props
 * @returns {ReactElement} The rendered previous button
 */
export const PreviousButton: FC<ToolbarButtonProps> = (props: ToolbarButtonProps): ReactElement => {
    const {
        onClick,
        ariaLabel,
        title,
        disabled = false,
        icon = <ChevronLeftIcon />,
        color,
        variant,
        className
    }: ToolbarButtonProps = props;

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale ?? 'en-US');

    return (
        <Button
            className={className ?? CSS_CLASSES.PREVIOUS_ICON}
            icon={icon}
            color={color ?? Color.Secondary}
            variant={variant ?? Variant.Standard}
            onClick={onClick}
            aria-label={ariaLabel ?? getString('previous')}
            title={title}
            disabled={disabled}
        />
    );
};

/**
 * Next button component
 *
 * @param {ToolbarButtonProps} props - The button props
 * @returns {ReactElement} The rendered next button
 */
export const NextButton: FC<ToolbarButtonProps> = (props: ToolbarButtonProps): ReactElement => {
    const {
        onClick,
        ariaLabel,
        title,
        disabled = false,
        icon = <ChevronRightIcon />,
        color,
        variant,
        className
    }: ToolbarButtonProps = props;

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale ?? 'en-US');

    return (
        <Button
            className={className ?? CSS_CLASSES.NEXT_ICON}
            icon={icon}
            color={color ?? Color.Secondary}
            variant={variant ?? Variant.Standard}
            onClick={onClick}
            aria-label={ariaLabel ?? getString('next')}
            title={title}
            disabled={disabled}
        />
    );
};

/**
 * DateRange button component with ref support
 *
 * @param {DateRangeButtonProps} props - The button props
 * @param {React.Ref<IButton>} ref - The ref to the button element
 * @returns {ReactElement} The rendered date range button
 */
const dateRangeButton: ForwardRefRenderFunction<IButton, DateRangeButtonProps> = (
    props: DateRangeButtonProps,
    ref: React.Ref<IButton>
): ReactElement => {
    const {
        onClick,
        ariaLabel,
        title,
        disabled = false,
        dateRangeContent,
        isCalendarOpen = false,
        ariaExpanded,
        color,
        variant,
        icon = <ChevronDownIcon viewBox="0 0 24 24" focusable="false" aria-hidden="true" />,
        onKeyDown,
        className
    }: DateRangeButtonProps = props;

    const handleClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void =
        useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
            event.stopPropagation();
            onClick?.(event);
        }, [onClick]);

    return (
        <Button
            ref={ref}
            onClick={handleClick}
            aria-haspopup="dialog"
            aria-label={ariaLabel}
            aria-expanded={ariaExpanded !== undefined ? ariaExpanded : isCalendarOpen}
            className={className ?? CSS_CLASSES.DATEPICKER_BUTTON}
            color={color ?? Color.Secondary}
            variant={variant ?? Variant.Standard}
            iconPosition={Position.Right}
            title={title}
            disabled={disabled}
            onKeyDown={onKeyDown}
            icon={icon}
        >
            {dateRangeContent}
        </Button>
    );
};

/**
 * DateRange button component
 */
export const DateRangeButton: React.ForwardRefExoticComponent<DateRangeButtonProps & React.RefAttributes<IButton>> =
    forwardRef<IButton, DateRangeButtonProps>(dateRangeButton);

DateRangeButton.displayName = 'DateRangeButton';

/**
 * View switcher button component
 *
 * @param {ViewButtonProps} props - The button props
 * @returns {ReactElement} The rendered view button
 */
export const ViewButton: FC<ViewButtonProps> = (props: ViewButtonProps): ReactElement => {
    const {
        items,
        currentView,
        onSelect,
        ariaLabel,
        title,
        disabled = false,
        className,
        variant = Variant.Outlined,
        color = Color.Secondary,
        viewPortElementRef
    }: ViewButtonProps = props;

    const displayText: string | undefined = items.find((item: ItemModel): boolean => item.id === currentView)?.text || currentView;
    const stopPropagation: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
        = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>): void => event.stopPropagation(), []);

    return (
        <div onClick={stopPropagation}>
            <DropDownButton
                items={items}
                variant={variant}
                className={className ?? CSS_CLASSES.VIEW_BUTTON}
                color={color}
                onSelect={onSelect}
                aria-label={ariaLabel}
                title={title}
                disabled={disabled}
                popupSettings={{ viewPortElementRef: viewPortElementRef }}
            >
                {displayText}
            </DropDownButton>
        </div>
    );
};

TodayButton.displayName = 'TodayButton';
PreviousButton.displayName = 'PreviousButton';
NextButton.displayName = 'NextButton';
ViewButton.displayName = 'ViewButton';

/**
 * Scheduler toolbar component for navigation and view switching
 *
 * @param {SchedulerToolbarProps} props - Component props
 * @returns {ReactElement} Rendered toolbar component
 */
export const SchedulerToolbar: FC<SchedulerToolbarProps> = ({
    view,
    availableViews,
    onViewButtonClick,
    onPreviousClick,
    onNextClick,
    onTodayClick,
    onDateDropdownClick,
    dateRangeText,
    isCalendarOpen = false,
    selectedDate = new Date(),
    firstDayOfWeek = 0,
    calendarView = CalendarView.Month,
    onCalendarChange,
    renderDates,
    customizeHeader,
    schedulerElementRef
}: SchedulerToolbarProps): ReactElement => {
    const popupAnchorRef: RefObject<IButton> = useRef<IButton | null>(null);
    const toolbarElementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement | null>(null);
    const [isAnchorReady, setIsAnchorReady] = useState(false);
    const popupContainerRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement | null>(null);
    const toolbarRef: RefObject<IToolbar> = useRef<IToolbar | null>(null);
    const prevIsCalendarOpen: React.RefObject<boolean> = useRef(isCalendarOpen);

    useEffect((): void => {
        if (Browser.isDevice && dateRangeText && toolbarRef.current) {
            toolbarRef.current.refreshOverflow();
        }
    });

    useLayoutEffect(() => {
        if (isCalendarOpen && popupAnchorRef?.current?.element) {
            setIsAnchorReady(true);
        } else {
            setIsAnchorReady(false);
        }
        if (!isCalendarOpen && prevIsCalendarOpen.current && popupAnchorRef.current && popupAnchorRef.current?.element) {
            popupAnchorRef.current.element.focus();
        }
        prevIsCalendarOpen.current = isCalendarOpen;
    }, [isCalendarOpen, popupAnchorRef?.current]);

    useOutsideClick(
        popupContainerRef as RefObject<HTMLElement>,
        !!isCalendarOpen,
        () => {
            if (isCalendarOpen && onDateDropdownClick) {
                onDateDropdownClick();
            }
        }
    );

    const items: ItemModel[] = useMemo(() => (availableViews || []).map((v: ViewsInfo) => ({
        id: v.name,
        text: v.displayName
    })), [availableViews]);

    const handleViewSelect: (event: ButtonSelectEvent & React.SyntheticEvent<HTMLButtonElement>) => void
        = useCallback((event: ButtonSelectEvent & React.SyntheticEvent<HTMLButtonElement>) => {
            const id: string = event.item?.id as string | undefined;
            if (id) { onViewButtonClick(id); }
        }, [onViewButtonClick]);

    const shouldShowCustomDateRange: boolean = !!renderDates && renderDates.length >= 2;
    const dateRangeTextForLabel: string | undefined = shouldShowCustomDateRange
        ? `${renderDates[0]?.toDateString()} - ${renderDates[renderDates.length - 1]?.toDateString()}`
        : dateRangeText;
    let dateRangeContent: ReactNode = dateRangeText;

    const getDefaultToolbarOrder: (defaultButtons: DefaultButtons) => ReactNode[] = (defaultButtons: DefaultButtons): ReactNode[] => {
        return [
            defaultButtons.today,
            defaultButtons.previous,
            defaultButtons.next,
            defaultButtons.dateRange,
            <ToolbarSpacer key="spacer" />,
            defaultButtons.viewSwitcher
        ].filter(Boolean);
    };

    const createDefaultButtons: (customProps?: SchedulerHeaderProps) => {
        today: ReactNode;
        previous: ReactNode;
        next: ReactNode;
        dateRange: ReactNode;
        viewSwitcher: ReactNode;
    } = (customProps?: SchedulerHeaderProps) => ({
        today: customProps?.todayProps !== null && (
            <ToolbarItem key='today'>
                <TodayButton
                    onClick={onTodayClick}
                    {...(customProps?.todayProps || {})}
                />
            </ToolbarItem>
        ),
        previous: customProps?.previousProps !== null && (
            <ToolbarItem key='previous'>
                <PreviousButton
                    onClick={onPreviousClick}
                    {...(customProps?.previousProps || {})}
                />
            </ToolbarItem>
        ),
        next: customProps?.nextProps !== null && (
            <ToolbarItem key='next'>
                <NextButton
                    onClick={onNextClick}
                    {...(customProps?.nextProps || {})}
                />
            </ToolbarItem>
        ),
        dateRange: customProps?.dateRangeProps !== null && (
            <ToolbarItem key='dateRange'>
                <DateRangeButton
                    ref={popupAnchorRef}
                    onClick={onDateDropdownClick}
                    ariaLabel={dateRangeTextForLabel}
                    dateRangeContent={dateRangeContent}
                    isCalendarOpen={isCalendarOpen}
                    onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>): void => {
                        if (event.key === 'Escape' && isCalendarOpen) {
                            onDateDropdownClick?.();
                        }
                    }}
                    {...(customProps?.dateRangeProps || {})}
                />
            </ToolbarItem>
        ),
        viewSwitcher: customProps?.viewSwitcherProps !== null && (availableViews?.length ?? 0) > 1 && (
            <ToolbarItem key='viewSwitcher'>
                <ViewButton
                    items={items}
                    currentView={view}
                    onSelect={handleViewSelect}
                    ariaLabel={availableViews?.find((v: ViewsInfo) => v.name === view)?.displayName ?? view}
                    viewPortElementRef={schedulerElementRef}
                    {...(customProps?.viewSwitcherProps || {})}
                />
            </ToolbarItem>
        )
    });

    let toolbarChildren: ReactNode;
    let overflowMode: OverflowMode = OverflowMode.Popup;
    type DefaultButtons = {
        today: ReactNode;
        previous: ReactNode;
        next: ReactNode;
        dateRange: ReactNode;
        viewSwitcher: ReactNode;
    };
    const defaultButtons: DefaultButtons = createDefaultButtons();
    if (customizeHeader) {
        const initialHeaderElement: ReactNode = customizeHeader({} as SchedulerHeaderProps);
        const userProvidedProps: SchedulerHeaderProps = isValidElement(initialHeaderElement)
            ? (initialHeaderElement.props as SchedulerHeaderProps)
            : {};

        const customizedButtons: DefaultButtons = createDefaultButtons(userProvidedProps);
        const headerPropsForUser: SchedulerHeaderProps = {
            overflowMode: userProvidedProps?.overflowMode ?? OverflowMode.Popup,
            today: customizedButtons.today,
            previous: customizedButtons.previous,
            next: customizedButtons.next,
            dateRange: customizedButtons.dateRange,
            viewSwitcher: customizedButtons.viewSwitcher,
            children: getDefaultToolbarOrder(customizedButtons)
        };

        const headerElement: ReactNode = customizeHeader(headerPropsForUser);

        if (headerElement && isValidElement(headerElement)) {
            const customHeaderProps: SchedulerHeaderProps = headerElement.props as SchedulerHeaderProps;
            overflowMode = customHeaderProps?.overflowMode ?? OverflowMode.Popup;
            if (customHeaderProps?.dateRangeTemplate && renderDates && renderDates.length >= 2) {
                dateRangeContent = customHeaderProps.dateRangeTemplate({
                    startDate: renderDates[0], endDate: renderDates[renderDates.length - 1], view
                });
            }
            if (customHeaderProps?.children) {
                if (customHeaderProps.children === headerPropsForUser.children) {
                    toolbarChildren = getDefaultToolbarOrder(createDefaultButtons(customHeaderProps));
                } else {
                    toolbarChildren = customHeaderProps.children;
                }
            } else {
                const customDefaultButtons: DefaultButtons = createDefaultButtons(customHeaderProps);
                toolbarChildren = getDefaultToolbarOrder(customDefaultButtons);
            }
        } else {
            toolbarChildren = getDefaultToolbarOrder(defaultButtons);
        }
    } else {
        toolbarChildren = getDefaultToolbarOrder(defaultButtons);
    }

    return (
        <div ref={toolbarElementRef} className={CSS_CLASSES.SCHEDULER_TOOLBAR_CONTAINER} >
            <Toolbar ref={toolbarRef} overflowMode={overflowMode} style={{ width: 'auto' }}>
                {toolbarChildren}
            </Toolbar>
            {isCalendarOpen && popupAnchorRef.current && isAnchorReady && (
                <div ref={popupContainerRef}>
                    <Popup
                        open={true}
                        relateTo={popupAnchorRef.current.element}
                        position={{ X: 'left', Y: 'bottom' }}
                        collision={{
                            X: CollisionType.Fit,
                            Y: CollisionType.None
                        }}
                        actionOnScroll={ActionOnScrollType.Hide}
                        onClose={onDateDropdownClick}
                        className={CSS_CLASSES.CALENDAR_POPUP_CONTAINER}
                        viewPortElementRef={toolbarElementRef}
                        onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>): void => {
                            if (event.key === 'Escape') {
                                onDateDropdownClick?.();
                            }
                        }}
                    >
                        <Calendar
                            className={CSS_CLASSES.SCHEDULER_CALENDAR}
                            value={selectedDate}
                            onChange={onCalendarChange}
                            showTodayButton={true}
                            firstDayOfWeek={firstDayOfWeek}
                            start={calendarView}
                            depth={calendarView}
                        />
                    </Popup>
                </div>
            )}
        </div>
    );
};
