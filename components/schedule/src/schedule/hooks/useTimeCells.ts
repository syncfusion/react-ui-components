import { useState, useEffect, useMemo } from 'react';
import { useProviderContext, formatDate } from '@syncfusion/react-base';
import { TimeSlotTemplateProps } from '../types/schedule-types';
import { DateService, MINUTES_PER_HOUR } from '../services/DateService';
import { useSchedulePropsContext } from '../context/schedule-context';
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
    } = useSchedulePropsContext();

    const { locale } = useProviderContext();
    const { hours: startHours, minutes: startMinutes } = DateService.parseTimeString(startHour);
    const { hours: endHours, minutes: endMinutes } = DateService.parseTimeString(endHour);

    const [hiddenSlotIndex, setHiddenSlotIndex] = useState<number | null>(null);
    const [totalSlots, setTotalSlots] = useState<number>(0);

    const timeSlots: TimeSlot[] = useMemo(() => {
        const slots: TimeSlot[] = [];
        const startTimeInMinutes: number = startHours * MINUTES_PER_HOUR + startMinutes;
        const endTimeInMinutes: number = endHours * MINUTES_PER_HOUR + endMinutes;
        let intervalStartTime: number = startTimeInMinutes;

        while (intervalStartTime < endTimeInMinutes) {
            for (let slotIndex: number = 0; slotIndex < timeScale.slotCount; slotIndex++) {
                const slotTimeInMinutes: number = intervalStartTime + (slotIndex * (timeScale.interval / timeScale.slotCount));
                if (slotTimeInMinutes >= endTimeInMinutes) {
                    break;
                }

                const currentHourValue: number = Math.floor(slotTimeInMinutes / MINUTES_PER_HOUR);
                const currentMinuteValue: number = Math.floor(slotTimeInMinutes % MINUTES_PER_HOUR);
                const date: Date = new Date();
                date.setHours(currentHourValue, currentMinuteValue, 0, 0);

                const isMajorSlot: boolean = slotIndex === 0;
                const isLastSlotOfInterval: boolean = slotIndex === timeScale.slotCount - 1;
                const nextSlotTimeInMinutes: number = slotTimeInMinutes + (timeScale.interval / timeScale.slotCount);
                const isLastSlotBeforeEnd: boolean = nextSlotTimeInMinutes >= endTimeInMinutes;
                const slotType: string = isMajorSlot ? 'majorTimeSlot' : 'minorTimeSlot';
                const templateProps: TimeSlotTemplateProps = { date, type: slotType };

                slots.push({
                    key: `${currentHourValue}-${currentMinuteValue}`,
                    date,
                    isMajorSlot,
                    isLastSlotOfInterval,
                    isLastSlotBeforeEnd,
                    slotType,
                    label: formatDate(date, {
                        type: 'time',
                        skeleton: 'h',
                        format: timeFormat,
                        locale: locale
                    }),
                    templateProps,
                    index: slots.length
                });
            }
            intervalStartTime += timeScale.interval;
        }

        setTotalSlots(slots.length);
        return slots;
    }, [startHours, startMinutes, endHours, endMinutes, timeFormat, timeScale, locale]);

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
