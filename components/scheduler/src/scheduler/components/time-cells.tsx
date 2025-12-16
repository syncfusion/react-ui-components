import { FC, ReactNode } from 'react';
import { useTimeCells } from '../hooks/useTimeCells';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { TimeCellsProps, TimeSlot } from '../types/internal-interface';
import { CSS_CLASSES } from '../common/constants';

export const TimeCells: FC<TimeCellsProps> = (props: TimeCellsProps) => {
    const { currentTime, currentTimePosition = 0, isTimeWithinBounds = false } = props;
    const { showTimeIndicator, timeScale } = useSchedulerPropsContext();

    const { timeSlots, hiddenSlotIndex, currentTimeString } = useTimeCells({
        currentTime,
        currentTimePosition,
        isTimeWithinBounds
    });

    const renderTimeSlots: () => ReactNode[] = (): ReactNode[] => {
        return timeSlots.map((slot: TimeSlot): ReactNode => (
            <div
                key={slot.key}
                className={`${CSS_CLASSES.TIME_SLOTS} ${slot.isLastSlotOfInterval || slot.isLastSlotBeforeEnd ? 'sf-time-cells' : ''} ${
                    hiddenSlotIndex === slot.index ? 'sf-hide-children' : ''
                }`}
            >
                {slot.isMajorSlot ? (
                    timeScale.majorSlot ? timeScale.majorSlot(slot.templateProps)
                        : (<span>{slot.label}</span>)
                ) : timeScale.minorSlot ? timeScale.minorSlot(slot.templateProps) : null
                }
            </div>
        ));
    };

    return (
        <div className={CSS_CLASSES.LEFT_INDENT}>
            <div className={CSS_CLASSES.TIME_CELLS_WRAP}>
                <div className={CSS_CLASSES.SCHEDULER_TABLE}>
                    {renderTimeSlots()}
                </div>
                {showTimeIndicator && isTimeWithinBounds && (
                    <div className={CSS_CLASSES.CURRENT_TIME} style={{ top: `${currentTimePosition}%` }}>
                        {currentTimeString}
                    </div>
                )}
            </div>
        </div>
    );
};

TimeCells.displayName = 'TimeCells';

export default TimeCells;
