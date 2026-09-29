import { CSSProperties, FC } from 'react';
import { useTimeIndicator } from '../hooks/useTimeIndicator';
import { TimeIndicatorProps } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useSchedulerPropsContext } from '../context/scheduler-context';

export const CurrentTimeIndicator: FC<TimeIndicatorProps> = (props: TimeIndicatorProps) => {
    const { onPositionUpdate, viewMode = 'vertical' } = props;
    const { renderDates } = useSchedulerRenderDatesContext();
    const { showTimeIndicator, startHour, endHour, timezone } = useSchedulerPropsContext();
    const { position, isVisible, isWithinBounds, multiDayViewInfo } = useTimeIndicator({
        showTimeIndicator, startHour, endHour, renderDates, onPositionUpdate, timezone, viewMode
    });

    if (!isVisible || !isWithinBounds || !multiDayViewInfo.isCurrentDayRendered) {
        return null;
    }

    const isTimeline: boolean = viewMode === 'timeline';
    const isSingleDay: boolean = !multiDayViewInfo.isMultiDayView || !multiDayViewInfo.hasValidRenderDates;
    if (isTimeline || isSingleDay) {
        const style: CSSProperties = isTimeline ? { left: `${position}%`, right: `${position}%` } : { top: `${position}%` };
        return <div className={CSS_CLASSES.CURRENT_TIMELINE} style={style} />;
    }

    return (
        <>
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

CurrentTimeIndicator.displayName = 'CurrentTimeIndicator';

export default CurrentTimeIndicator;
