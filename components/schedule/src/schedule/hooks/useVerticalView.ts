import { useState, useCallback, useMemo } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { CSS_CLASSES } from '../common/constants';

/**
 * Result returned by the useVerticalView hook
 */
interface UseVerticalViewResult {
    /**
     * The current time
     */
    currentTime: Date;

    /**
     * Current time position as percentage
     */
    currentTimePosition: number;

    /**
     * Whether time is within schedule bounds
     */
    isTimeWithinBounds: boolean;

    /**
     * CSS class name for the view
     */
    viewClassName: string;

    /**
     * CSS class name for the content section
     */
    contentSectionClassName: string;

    /**
     * Handle time position updates from CurrentTimeIndicator
     */
    handleTimePositionUpdate: (position: number, isWithinBounds: boolean) => void;
}

/**
 * A hook to handle the logic for vertical view components
 * Separates positioning and state logic from rendering
 *
 * @param {string} viewType - The view type (Day, Week, WorkWeek)
 * @returns {UseVerticalViewResult} - Methods and state for vertical view
 */
export const useVerticalView: (viewType: string) => UseVerticalViewResult = (viewType: string): UseVerticalViewResult => {
    const { timeScale } = useSchedulePropsContext();
    const [currentTimePosition, setCurrentTimePosition] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isTimeWithinBounds, setIsTimeWithinBounds] = useState<boolean>(false);

    /**
     * Handle time position updates from the CurrentTimeIndicator component
     *
     * @param {number} position - Current time position as percentage
     * @param {boolean} isWithinBounds - Whether time is within schedule bounds
     */
    const handleTimePositionUpdate: (position: number, isWithinBounds: boolean) => void =
        useCallback((position: number, isWithinBounds: boolean): void => {
            setCurrentTimePosition(position);
            setCurrentTime(new Date());
            setIsTimeWithinBounds(isWithinBounds);
        }, []);

    /**
     * Get the CSS class for the current view type
     */
    const viewClassName: string = useMemo(() => {
        let className: string = '';

        switch (viewType) {
        case 'Day':
            className = CSS_CLASSES.DAY_VIEW;
            break;
        case 'Week':
            className = CSS_CLASSES.WEEK_VIEW;
            break;
        case 'WorkWeek':
            className = CSS_CLASSES.WORK_WEEK_VIEW;
            break;
        }

        return className;
    }, [viewType]);

    /**
     * Get CSS classes for the content section
     */
    const contentSectionClassName: string = useMemo(() => {
        return `${!timeScale.enable ? 'sf-timescale-disabled' : ''}`;
    }, [timeScale.enable]);

    return {
        currentTime,
        currentTimePosition,
        isTimeWithinBounds,
        viewClassName,
        contentSectionClassName,
        handleTimePositionUpdate
    };
};

export default useVerticalView;
