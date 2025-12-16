import { FC, ReactElement, useRef, RefObject, useCallback } from 'react';
import { Button, Variant, Color, Position, IButton } from '@syncfusion/react-buttons';
import { OverflowMode, Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, TimelineTodayIcon } from '@syncfusion/react-icons';
import { ViewsInfo } from '../types/internal-interface';
import { Popup, CollisionType, ActionOnScrollType } from '@syncfusion/react-popups';
import { Calendar, CalendarChangeEvent, CalendarView } from '@syncfusion/react-calendars';
import { CSS_CLASSES } from '../common/constants';
import { ItemModel, DropDownButton, ButtonSelectEvent } from '@syncfusion/react-splitbuttons';
import { Browser, useProviderContext } from '@syncfusion/react-base';
import { useSchedulerLocalization } from '../common/locale';
import { useOutsideClick } from '../hooks/useScheduler';

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
    showCalendar?: boolean;

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
    handleCalendarChange?: (args: CalendarChangeEvent) => void;
}

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
    showCalendar = false,
    selectedDate = new Date(),
    firstDayOfWeek = 0,
    calendarView = CalendarView.Month,
    handleCalendarChange
}: SchedulerToolbarProps): ReactElement => {
    const popupAnchorRef: RefObject<IButton> = useRef<IButton | null>(null);
    const toolbarElementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement | null>(null);

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    useOutsideClick(
        toolbarElementRef as RefObject<HTMLElement>,
        !!showCalendar,
        () => {
            if (showCalendar && onDateDropdownClick) {
                onDateDropdownClick();
            }
        }
    );

    const items: ItemModel[] = (availableViews || []).map((view: ViewsInfo) => ({
        id: view.name,
        text: view.displayName
    }));

    const handleViewSelect: (args: ButtonSelectEvent & React.SyntheticEvent<HTMLButtonElement>) => void
        = useCallback((args: ButtonSelectEvent & React.SyntheticEvent<HTMLButtonElement>) => {
            const id: string = args.item?.id as string | undefined;
            if (id) { onViewButtonClick(id); }
        }, [onViewButtonClick]);

    const itemsKey: string = items.map((v: ItemModel) => `${v.id}:${v.text}`).join('|');

    return (
        <div ref={toolbarElementRef} className={CSS_CLASSES.SCHEDULER_TOOLBAR_CONTAINER}>
            <Toolbar overflowMode={OverflowMode.Popup} key={`tb-${itemsKey}-${dateRangeText}`} style={{ width: 'auto' }}>
                <ToolbarItem>
                    {Browser.isDevice ? (
                        <Button
                            icon={<TimelineTodayIcon />}
                            variant={Variant.Standard}
                            color={Color.Secondary}
                            className={CSS_CLASSES.TODAY_BUTTON}
                            onClick={onTodayClick}
                            aria-label={getString('today')}
                            title={getString('today')}
                        />
                    ) : (
                        <Button
                            icon={<TimelineTodayIcon />}
                            variant={Variant.Outlined}
                            color={Color.Secondary}
                            className={CSS_CLASSES.TODAY_BUTTON}
                            onClick={onTodayClick}
                        >
                            {getString('today')}
                        </Button>
                    )}
                </ToolbarItem>
                <ToolbarItem>
                    <Button
                        className={CSS_CLASSES.PREVIOUS_ICON}
                        icon={<ChevronLeftIcon />}
                        color={Color.Secondary}
                        variant={Variant.Standard}
                        onClick={onPreviousClick}
                        aria-label="previous"
                    />
                </ToolbarItem>
                <ToolbarItem>
                    <Button
                        className={CSS_CLASSES.NEXT_ICON}
                        icon={<ChevronRightIcon />}
                        color={Color.Secondary}
                        variant={Variant.Standard}
                        onClick={onNextClick}
                        aria-label="next"
                    />
                </ToolbarItem>
                <ToolbarItem key={`tb-${dateRangeText}`}>
                    <Button ref={popupAnchorRef}
                        key={dateRangeText}
                        onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                            e.stopPropagation();
                            onDateDropdownClick?.();
                        }}
                        aria-haspopup="dialog"
                        aria-label={dateRangeText}
                        aria-expanded={showCalendar}
                        className={CSS_CLASSES.DATEPICKER_BUTTON}
                        color={Color.Secondary}
                        variant={Variant.Standard}
                        iconPosition={Position.Right}
                        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
                            if (e.key === 'Escape' && showCalendar) {
                                onDateDropdownClick();
                            }
                        }}
                        icon={<ChevronDownIcon viewBox="0 0 24 24" focusable="false" aria-hidden="true" />}>
                        {dateRangeText}
                    </Button>
                </ToolbarItem>
                <ToolbarSpacer />
                {(availableViews?.length ?? 0) > 1 && (
                    <ToolbarItem>
                        <div onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation()}>
                            <DropDownButton
                                key={itemsKey}
                                items={items}
                                variant={Variant.Outlined}
                                className={CSS_CLASSES.VIEW_BUTTON}
                                color={Color.Secondary}
                                onSelect={handleViewSelect}
                            >
                                {availableViews?.find((v: ViewsInfo) => v.name === view)?.displayName ?? view}
                            </DropDownButton>
                        </div>
                    </ToolbarItem>
                )}
            </Toolbar>
            {showCalendar && popupAnchorRef.current && (
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
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Escape') {
                            onDateDropdownClick();
                        }
                    }}
                >
                    <Calendar
                        className={CSS_CLASSES.SCHEDULER_CALENDAR}
                        value={selectedDate}
                        onChange={handleCalendarChange}
                        showTodayButton={true}
                        firstDayOfWeek={firstDayOfWeek}
                        start={calendarView}
                        depth={calendarView}
                    />
                </Popup>
            )}
        </div>
    );
};
