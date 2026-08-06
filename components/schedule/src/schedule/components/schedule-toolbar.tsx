import { FC, ReactElement, useRef, RefObject } from 'react';
import { Button, Variant, Color, Position, IButton } from '@syncfusion/react-buttons';
import { Toolbar, ToolbarItem, ToolbarSpacer } from '@syncfusion/react-navigations';
import { ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon } from '@syncfusion/react-icons';
import { ViewsInfo } from '../types/internal-interface';
import { Popup, CollisionType, ActionOnScrollType } from '@syncfusion/react-popups';
import { Calendar, CalendarChangeEvent, CalendarView } from '@syncfusion/react-calendars';
import { CSS_CLASSES } from '../common/constants';
import { ItemModel, DropDownButton } from '@syncfusion/react-splitbuttons';
import { useProviderContext } from '@syncfusion/react-base';
import { useScheduleLocalization } from '../common/locale';

/**
 * Props interface for ScheduleToolbar component
 */
interface ScheduleToolbarProps {
    /**
     * The currently active view
     */
    currentView: string;

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
 * Schedule toolbar component for navigation and view switching
 *
 * @param {ScheduleToolbarProps} props - Component props
 * @returns {ReactElement} Rendered toolbar component
 */
export const ScheduleToolbar: FC<ScheduleToolbarProps> = ({
    currentView,
    availableViews,
    onViewButtonClick,
    onPreviousClick,
    onNextClick,
    onTodayClick,
    onDateDropdownClick,
    dateRangeText = 'Select date',
    showCalendar = false,
    selectedDate = new Date(),
    firstDayOfWeek = 0,
    calendarView = CalendarView.Month,
    handleCalendarChange
}: ScheduleToolbarProps): ReactElement => {
    const popupAnchorRef: RefObject<IButton> = useRef<IButton | null>(null);
    const toolbarElementRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement | null>(null);

    const { locale } = useProviderContext();
    const { getString } = useScheduleLocalization(locale || 'en-US');

    const items: ItemModel[] = (availableViews || []).map((view: ViewsInfo) => ({
        id: view.name,
        text: view.displayName
    }));

    const itemsKey: string = items.map((v: ItemModel) => `${v.id}:${v.text}`).join('|');

    return (
        <div ref={toolbarElementRef} className={CSS_CLASSES.SCHEDULE_TOOLBAR_CONTAINER}>
            <Toolbar style={{ width: 'auto' }}>
                <ToolbarItem>
                    <Button
                        variant={Variant.Outlined}
                        color={Color.Secondary}
                        className={CSS_CLASSES.TODAY_BUTTON}
                        onClick={onTodayClick}
                    >
                        {getString('today')}
                    </Button>
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
                <ToolbarItem>
                    <Button ref={popupAnchorRef}
                        onClick={onDateDropdownClick}
                        aria-haspopup="dialog"
                        aria-label={dateRangeText}
                        aria-expanded={showCalendar}
                        className={CSS_CLASSES.DATEPICKER_BUTTON}
                        color={Color.Secondary}
                        variant={Variant.Standard}
                        iconPosition={Position.Right}
                        icon={<ChevronDownIcon viewBox="0 0 24 24" focusable="false" aria-hidden="true" />}>
                        {dateRangeText}
                    </Button>
                </ToolbarItem>
                <ToolbarSpacer />
                <ToolbarItem>
                    <DropDownButton
                        key={itemsKey}
                        items={items}
                        variant={Variant.Outlined}
                        color={Color.Secondary}
                        onSelect={(args: any) => {
                            const id: string = args?.item?.id as string | undefined;
                            if (id) {
                                onViewButtonClick(id);
                            }
                        }}
                    >
                        {availableViews?.find((v: ViewsInfo) => v.name === currentView)?.displayName ?? currentView}
                    </DropDownButton>
                </ToolbarItem>
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
                >
                    <Calendar
                        className={CSS_CLASSES.SCHEDULE_CALENDAR}
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
