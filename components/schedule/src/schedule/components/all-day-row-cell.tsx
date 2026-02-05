import { FC, ReactNode, KeyboardEvent } from 'react';
import { ProcessedEventsData } from '../types/internal-interface';
import { DayEvent } from './day-event';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleLocalization } from '../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { DateService } from '../services/DateService';
import { useCellInteraction } from '../hooks/useCellInteraction';

interface AllDayRowCellProps {
    /**
     * Date for the cell
     */
    date: Date;

    /**
     * Visible events for this cell
     */
    visibleEvents: ProcessedEventsData[];

    /**
     * Number of hidden events in this cell
     */
    hiddenEventCount: number;

    /**
     * Handler for the more indicator click
     */
    onMoreIndicatorClick: () => void;
}

export const AllDayRowCell: FC<AllDayRowCellProps> = (props: AllDayRowCellProps): ReactNode => {
    const {
        date,
        visibleEvents,
        hiddenEventCount,
        onMoreIndicatorClick
    } = props;

    const { timeScale } = useSchedulePropsContext();
    const { locale } = useProviderContext();
    const { getString } = useScheduleLocalization(locale || 'en-US');
    const { handleCellClick, handleCellDoubleClick } = useCellInteraction();

    const renderMoreIndicator: () => ReactNode = (): ReactNode => {
        if (hiddenEventCount <= 0) {
            return null;
        }

        return (
            <div
                className={`${CSS_CLASSES.MORE_INDICATOR} ${CSS_CLASSES.LINK}`}
                onClick={onMoreIndicatorClick}
                role="button"
                tabIndex={0}
                aria-label={`${hiddenEventCount} more events`}
                onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        onMoreIndicatorClick();
                    }
                }}
            >
                +{hiddenEventCount} {getString('more')}
            </div>
        );
    };

    const renderEvents: () => ReactNode = (): ReactNode => {
        return visibleEvents.map((eventInfo: ProcessedEventsData) => {
            const { totalSegments, isFirstSegmentInRenderRange, event, eventKey } = eventInfo;

            if ((totalSegments && totalSegments > 1 && isFirstSegmentInRenderRange) ||
                ((!totalSegments || totalSegments <= 1) && event.isAllDay && !event.isBlock)) {
                return (
                    <DayEvent
                        key={eventKey}
                        {...eventInfo}
                    />
                );
            }
            return null;
        });
    };

    return (
        <div
            className={CSS_CLASSES.ALL_DAY_CELL}
            key={DateService.generateDateKey(date)}
            data-date={date.getTime()}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => handleCellClick(e, date, true)}
            onDoubleClick={(e: React.MouseEvent<HTMLDivElement>) => handleCellDoubleClick(e, date, true)}
        >
            {timeScale.enable && (
                <>
                    {renderEvents()}
                    {renderMoreIndicator()}
                </>
            )}
        </div>
    );
};

AllDayRowCell.displayName = 'AllDayRowCell';
export default AllDayRowCell;
