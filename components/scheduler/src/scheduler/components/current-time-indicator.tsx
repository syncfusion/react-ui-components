import { FC } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useTimeIndicator } from '../hooks/useTimeIndicator';
import { TimeIndicatorProps } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';

export const CurrentTimeIndicator: FC<TimeIndicatorProps> = (props: TimeIndicatorProps) => {
    const { onPositionUpdate } = props;
    const { renderDates } = useSchedulerRenderDatesContext();

    const {
        showTimeIndicator,
        startHour,
        endHour
    } = useSchedulerPropsContext();

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
                            width: `${column.columnWidth}%`,
                            insetInlineStart: `${column.leftPosition}%`
                        }}
                    />
                );
            })}
        </>
    );
};

export default CurrentTimeIndicator;
