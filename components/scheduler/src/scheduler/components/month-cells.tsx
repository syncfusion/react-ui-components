import { FC, ReactNode, MouseEvent, useLayoutEffect } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { MonthCellsProps, ProcessedEventsData } from '../types/internal-interface';
import { useMonthCells, MonthCell } from '../hooks/useMonthCells';
import { useMonthEvents } from '../hooks/useMonthEvents';
import { useNavigate } from '../hooks/useDateHeader';
import { DayEvent } from './day-event';
import { DateService } from '../services/DateService';
import { ViewService } from '../services/ViewService';
import { ErrorTreeviewIcon } from '@syncfusion/react-icons';
import { CSS_CLASSES } from '../common/constants';
import { MoreIndicator } from './more-indicator';
import useCellInteraction from '../hooks/useCellInteraction';
import { ResourceLevel } from '../services/ResourceGroupingService';

export const MonthCells: FC<MonthCellsProps> = (props: MonthCellsProps) => {
    const { weekRenderDates, hideOtherMonths, rowIndex, onHeightCalculated, resourceWorkCells } = props;

    const {
        maxEventsPerRow = 2,
        cellHeader,
        cell,
        rowAutoHeight,
        getAvailableViews
    } = useSchedulerPropsContext();

    const {
        workCells: defaultCells,
        handleMoreClick
    } = useMonthCells(props);

    const workCells: MonthCell[] = resourceWorkCells || defaultCells;
    const { handleCellClick, handleCellDoubleClick, handleKeyDown } = useCellInteraction();
    const { handleDateClick } = useNavigate();
    const {
        getVisibleEvents,
        getAlldayBlockEvent,
        getHiddenEventCount,
        hasMoreIndicator,
        hasBlockIndicator,
        hasAllDayBlock,
        calculatedRowHeight
    } = useMonthEvents(weekRenderDates, maxEventsPerRow);

    const renderMoreIndicator: (date: Date, resourceLeaf: ResourceLevel) => ReactNode =
        (date: Date, resourceLeaf: ResourceLevel): ReactNode => {
            return (
                <MoreIndicator
                    date={date}
                    count={getHiddenEventCount(DateService.generateDateKey(date), resourceLeaf)}
                    onMoreClick={handleMoreClick}
                    resource={resourceLeaf}
                />
            );
        };

    const renderEvents: (date: Date, resourceLeaf?: ResourceLevel, groupIndex?: number) => ReactNode =
        (date: Date, resourceLeaf?: ResourceLevel, groupIndex?: number): ReactNode => {
            const dateKey: string = DateService.generateDateKey(date);
            const visibleEvents: ProcessedEventsData[] = getVisibleEvents(dateKey, resourceLeaf);

            if (hasAllDayBlock(dateKey, resourceLeaf)) {
                const event: ProcessedEventsData = getAlldayBlockEvent(dateKey, resourceLeaf);
                if (event && ((event.totalSegments && event.totalSegments > 1 && event.isFirstSegmentInRenderRange) ||
                    (!event.totalSegments || event.totalSegments <= 1))) {
                    return (
                        <DayEvent
                            key={event.eventKey || event.event.guid}
                            {...event}
                            weekRenderDates={weekRenderDates}
                            isBlockedEvent={true}
                            groupIndex={groupIndex}
                        />
                    );
                }
            }

            return visibleEvents.map((eventInfo: ProcessedEventsData) => {
                const { totalSegments, isFirstSegmentInRenderRange, event, eventKey } = eventInfo;

                if (!event.isBlock && ((totalSegments && totalSegments > 1 && isFirstSegmentInRenderRange) ||
                    (!totalSegments || totalSegments <= 1))) {
                    return (
                        <DayEvent
                            key={eventKey || eventInfo.event.guid}
                            {...eventInfo}
                            weekRenderDates={weekRenderDates}
                            groupIndex={groupIndex}
                        />
                    );
                }
                return null;
            });
        };

    const renderBlockIndicator: () => ReactNode = (): ReactNode => {
        return (
            <div className={`${CSS_CLASSES.ICONS} ${CSS_CLASSES.BLOCK_INDICATOR}`}>
                <ErrorTreeviewIcon />
            </div>
        );
    };

    useLayoutEffect(() => {
        onHeightCalculated(rowIndex, calculatedRowHeight);
    }, [calculatedRowHeight]);

    return (
        <div className={CSS_CLASSES.WORK_CELLS_ROW} style={{ height: (rowAutoHeight || maxEventsPerRow >= 3) ? calculatedRowHeight : '' }}>
            {workCells.map((monthCell: MonthCell): ReactNode => {
                if (hideOtherMonths && monthCell.className.includes('sf-other-month')) {
                    return (
                        <div key={monthCell.key} className={monthCell.className} />
                    );
                }
                const dateKey: string = DateService.generateDateKey(monthCell.date);
                const resourceLeaf: ResourceLevel | undefined = monthCell?.resource;
                const isDayViewAvailable: boolean = ViewService.isDayViewAvailable(getAvailableViews);
                return (
                    <div
                        key={monthCell.key}
                        className={monthCell.className}
                        data-date={monthCell.dateTimestamp}
                        data-group-index={monthCell.groupIndex}
                        onClick={(e: MouseEvent<HTMLElement>) => handleCellClick(e, monthCell.date, true)}
                        onDoubleClick={(e: MouseEvent<HTMLElement>) => handleCellDoubleClick(e, monthCell.date, true)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { handleKeyDown(e, monthCell.date); }}
                    >
                        <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                            <div className={CSS_CLASSES.DATE_HEADER}>
                                {cellHeader ? (
                                    cellHeader({ date: monthCell.date })
                                ) : (
                                    <span
                                        className={isDayViewAvailable ? CSS_CLASSES.LINK : ''}
                                        onClick={(e: MouseEvent<HTMLElement>) => handleDateClick(e, monthCell.date)}
                                    >
                                        {monthCell.displayText}
                                    </span>
                                )}
                            </div>
                            {hasBlockIndicator(dateKey, resourceLeaf) && renderBlockIndicator()}
                        </div>
                        <div className={CSS_CLASSES.APPOINTMENT_WRAPPER}>
                            {renderEvents(monthCell.date, resourceLeaf, monthCell.groupIndex)}
                            {!rowAutoHeight && hasMoreIndicator(dateKey, resourceLeaf) && renderMoreIndicator(monthCell.date, resourceLeaf)}
                        </div>
                        {cell && cell({ date: monthCell.date, type: 'monthCell' })}
                    </div>
                );
            })}
        </div>
    );
};

export default MonthCells;
