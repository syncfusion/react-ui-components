import { FC } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleRenderDatesContext } from '../context/schedule-render-dates-context';
import { useTimeIndicator } from '../hooks/useTimeIndicator';
import { TimeIndicatorProps } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';

export const CurrentTimeIndicator: FC<TimeIndicatorProps> = (props: TimeIndicatorProps) => {
    const { onPositionUpdate } = props;
    const { renderDates } = useScheduleRenderDatesContext();

    const {
        showTimeIndicator,
        startHour,
        endHour
    } = useSchedulePropsContext();

    const {
        position,
        isVisible,
        isWithinBounds,
        multiDayViewInfo
    } = useTimeIndicator({
        showTimeIndicator,
        startHour,
        endHour,
        renderDates,
        onPositionUpdate
    });

    if (!isVisible || !isWithinBounds || !multiDayViewInfo.isCurrentDayRendered) {
        return null;
    }

    if (!multiDayViewInfo.isMultiDayView || !multiDayViewInfo.hasValidRenderDates) {
        return (
            <div
                className={CSS_CLASSES.CURRENT_TIMELINE}
                style={{ top: `${position}%` }}
            />
        );
    }

    return (
        <>
            {/* Only render timeline for current or past days */}
            {multiDayViewInfo.columns.map((column: { key: number; isCurrentDay: boolean; leftPosition: number; columnWidth: number }) => {
                return (
                    <div
                        key={column.key}
                        className={column.isCurrentDay ? CSS_CLASSES.CURRENT_TIMELINE : CSS_CLASSES.PREVIOUS_TIMELINE}
                        style={{
                            top: `${position}%`,
                            left: `${column.leftPosition}%`,
                            width: `${column.columnWidth}%`
                        }}
                    />
                );
            })}
        </>
    );
};

export default CurrentTimeIndicator;
