import { useState, useEffect, useMemo } from 'react';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { TimeSlotProps } from '../types/scheduler-types';
import { DateService } from '../services/DateService';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { TimeSlot } from '../types/internal-interface';

/**
 * Interface for the hook result containing time cells data
 */
interface UseTimeCellsResult {
    /**
     * Array of time slots to render
     */
    timeSlots: TimeSlot[];

    /**
     * Total number of slots
     */
    totalSlots: number;

    /**
     * The index of the slot that should hide its children (for current time indicator)
     */
    hiddenSlotIndex: number | null;

    /**
     * Formatted current time string
     */
    currentTimeString: string;
}

/**
 * Interface for the hook props
 */
interface UseTimeCellsProps {
    /**
     * The current time
     */
    currentTime?: Date;

    /**
     * The position of the current time indicator (percentage)
     */
    currentTimePosition?: number;

    /**
     * Whether the current time is within the visible time bounds
     */
    isTimeWithinBounds?: boolean;
}

export const useTimeCells: (props: UseTimeCellsProps) => UseTimeCellsResult = (props: UseTimeCellsProps): UseTimeCellsResult => {
    const { currentTime = new Date(), currentTimePosition = 0, isTimeWithinBounds = false } = props;

    const {
        startHour,
        endHour,
        timeFormat,
        timeScale
    } = useSchedulerPropsContext();

    const { locale } = useProviderContext();

    const [hiddenSlotIndex, setHiddenSlotIndex] = useState<number | null>(null);
    const [totalSlots, setTotalSlots] = useState<number>(0);

    const timeSlots: TimeSlot[] = useMemo(() => {
        const { interval, slotCount } = timeScale;
        const metadata: TimeSlot[] = DateService.getSlotMetadata(startHour, endHour, interval, slotCount);

        const slots: TimeSlot[] = metadata.map((item: TimeSlot) => {
            const { date, isMajorSlot, isLastSlotOfInterval, isLastSlotBeforeEnd, index } = item;
            const templateProps: TimeSlotProps = { date, type: isMajorSlot ? 'majorSlot' : 'minorSlot' };
            return {
                key: `${item.hour}-${item.minute}`, date, isMajorSlot, isLastSlotOfInterval, isLastSlotBeforeEnd,
                label: formatDate(date, { type: 'time', skeleton: 'h', format: timeFormat, locale: locale }), templateProps, index
            };
        });

        setTotalSlots(slots.length);
        return slots;
    }, [startHour, endHour, timeFormat, timeScale, locale]);

    // Update hidden slot when current time position changes
    useEffect(() => {
        if (!isTimeWithinBounds) {
            if (hiddenSlotIndex !== null) {
                setHiddenSlotIndex(null);
            }
            return;
        }

        const slotHeight: number = 100 / totalSlots;
        const overlappingSlotIndex: number = Math.floor(currentTimePosition / slotHeight);
        if (overlappingSlotIndex !== hiddenSlotIndex) {
            setHiddenSlotIndex(overlappingSlotIndex);
        }
    }, [currentTimePosition, hiddenSlotIndex, totalSlots, isTimeWithinBounds]);

    const currentTimeString: string = formatDate(currentTime, {
        type: 'time',
        skeleton: 'short',
        format: timeFormat,
        locale: locale
    });

    return {
        timeSlots,
        totalSlots,
        hiddenSlotIndex,
        currentTimeString
    };
};

export default useTimeCells;
