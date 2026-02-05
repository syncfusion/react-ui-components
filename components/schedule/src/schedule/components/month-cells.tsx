import { FC, ReactNode, MouseEvent, useEffect } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { MonthCellsProps, ProcessedEventsData } from '../types/internal-interface';
import { useMonthCells, MonthCell } from '../hooks/useMonthCells';
import { useMonthEvents } from '../hooks/useMonthEvents';
import { useNavigate } from '../hooks/useDateHeader';
import { DayEvent } from './day-event';
import { DateService } from '../services/DateService';
import { ErrorTreeviewIcon } from '@syncfusion/react-icons';
import { CSS_CLASSES } from '../common/constants';
import { MoreIndicator } from './more-indicator';
import useCellInteraction from '../hooks/useCellInteraction';

export const MonthCells: FC<MonthCellsProps> = (props: MonthCellsProps) => {
    const { weekRenderDates, hideOtherMonths, rowIndex, onHeightCalculated } = props;

    const {
        maxEventsPerRow = 2,
        cellHeaderTemplate,
        cellTemplate,
        rowAutoHeight
    } = useSchedulePropsContext();

    const {
        workCells,
        handleMoreClick
    } = useMonthCells(props);

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

    const renderMoreIndicator: (date: Date) => ReactNode = (date: Date): ReactNode => {
        return (
            <MoreIndicator
                date={date}
                count={getHiddenEventCount(DateService.generateDateKey(date))}
                onMoreClick={handleMoreClick}
            />
        );
    };

    const renderEvents: (date: Date) => ReactNode = (date: Date): ReactNode => {
        const dateKey: string = DateService.generateDateKey(date);
        const visibleEvents: ProcessedEventsData[] = getVisibleEvents(dateKey);

        if (hasAllDayBlock(dateKey)) {
            const event: ProcessedEventsData = getAlldayBlockEvent(dateKey);
            if (event && ((event.totalSegments && event.totalSegments > 1 && event.isFirstSegmentInRenderRange) ||
                (!event.totalSegments || event.totalSegments <= 1))) {
                return (
                    <DayEvent
                        key={event.eventKey || event.event.guid}
                        {...event}
                        weekRenderDates={weekRenderDates}
                        isBlockedEvent={true}
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

    useEffect(() => {
        onHeightCalculated(rowIndex, calculatedRowHeight);
    }, [calculatedRowHeight]);

    return (
        <div className={CSS_CLASSES.WORK_CELLS_ROW} style={{ height: rowAutoHeight ? calculatedRowHeight : '' }}>
            {workCells.map((cell: MonthCell): ReactNode => {
                if (hideOtherMonths && cell.className.includes('sf-other-month')) {
                    return (
                        <div key={cell.key} className={cell.className} />
                    );
                }

                const dateKey: string = DateService.generateDateKey(cell.date);

                return (
                    <div
                        key={cell.key}
                        className={cell.className}
                        data-date={cell.dateTimestamp}
                        onClick={(e: MouseEvent<HTMLElement>) => handleCellClick(e, cell.date, true)}
                        onDoubleClick={(e: MouseEvent<HTMLElement>) => handleCellDoubleClick(e, cell.date, true)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { handleKeyDown(e, cell.date); }}
                    >
                        <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                            <div className={`${CSS_CLASSES.DATE_HEADER} ${CSS_CLASSES.LINK}`} onClick={() => handleDateClick(cell.date)}>
                                {cellHeaderTemplate ?
                                    (typeof cellHeaderTemplate === 'function' ?
                                        cellHeaderTemplate({ date: cell.date, type: 'monthHeaderCell' }) :
                                        cellHeaderTemplate) :
                                    cell.displayText}
                            </div>
                            {hasBlockIndicator(dateKey) && renderBlockIndicator()}
                        </div>
                        <div className={CSS_CLASSES.APPOINTMENT_WRAPPER}>
                            {renderEvents(cell.date)}
                            {!rowAutoHeight && hasMoreIndicator(dateKey) && renderMoreIndicator(cell.date)}
                        </div>
                        {cellTemplate &&
                            (typeof cellTemplate === 'function' ?
                                cellTemplate({ date: cell.date, type: 'monthCell' }) :
                                cellTemplate
                            )
                        }
                    </div>
                );
            })}
        </div>
    );
};

export default MonthCells;
