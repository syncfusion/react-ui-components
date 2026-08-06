import { FC } from 'react';
import { VerticalViewProps } from '../types/internal-interface';
import { CurrentTimeIndicator } from '../components/current-time-indicator';
import { useSchedulePropsContext } from '../context/schedule-context';
import { DateHeader } from '../components/date-header';
import { TimeCells } from '../components/time-cells';
import { WorkCells } from '../components/work-cells';
import { TimeSlotEvent } from '../components/time-slot-event';
import { useVerticalView } from '../hooks/useVerticalView';
import { CSS_CLASSES } from '../common/constants';

export const VerticalView: FC<VerticalViewProps> = (props: VerticalViewProps) => {
    const { viewType } = props;
    const {
        timeScale,
        showTimeIndicator
    } = useSchedulePropsContext();

    const {
        currentTime,
        currentTimePosition,
        isTimeWithinBounds,
        viewClassName,
        contentSectionClassName,
        handleTimePositionUpdate
    } = useVerticalView(viewType);

    return (
        <div className={`${CSS_CLASSES.VERTICAL_VIEW} ${viewClassName}`}>
            <div className={CSS_CLASSES.MAIN_SCROLL_CONTAINER}>
                <div className={CSS_CLASSES.STICKY_HEADER}>
                    <DateHeader />
                </div>
                <div className={`${CSS_CLASSES.CONTENT_SECTION} ${contentSectionClassName}` }>
                    {timeScale.enable && (
                        <TimeCells
                            currentTime={currentTime}
                            currentTimePosition={currentTimePosition}
                            isTimeWithinBounds={isTimeWithinBounds}
                        />
                    )}
                    <div className={CSS_CLASSES.WORK_CELLS_CONTAINER}>
                        <div className={CSS_CLASSES.TIME_SLOT_CLONE_CONTAINER}></div>
                        <div className={CSS_CLASSES.CONTENT_WRAP}>
                            <TimeSlotEvent />
                            <WorkCells />
                        </div>

                        {showTimeIndicator && timeScale.enable && (
                            <CurrentTimeIndicator
                                onPositionUpdate={handleTimePositionUpdate}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

VerticalView.displayName = 'VerticalView';

export default VerticalView;
