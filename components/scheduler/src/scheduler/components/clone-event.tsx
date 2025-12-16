import { FC, JSX } from 'react';
import { createPortal } from 'react-dom';
import { DayEventClone } from './day-event-clone';
import { TimeSlotEventClone } from './time-slot-event-clone';
import { useCloneEventContext, CloneEventContextValue } from '../context/clone-event-context';
import { ProcessedEventsData } from '../types/internal-interface';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CSS_CLASSES } from '../common/constants';

export const CloneEvent: FC = () => {
    const state: CloneEventContextValue = useCloneEventContext();
    const { schedulerRef } = useSchedulerPropsContext();

    const container: HTMLElement = state.isDayEvent ?
        schedulerRef.current?.element?.querySelector(`.${CSS_CLASSES.DAY_CLONE_CONTAINER}`) :
        schedulerRef.current?.element?.querySelector(`.${CSS_CLASSES.TIME_SLOT_CLONE_CONTAINER}`);

    const content: JSX.Element = (
        <>
            {state.visible && state.segments.map((segment: ProcessedEventsData, index: number) => (
                state.isDayEvent ? (
                    <DayEventClone key={`${segment?.guid}-${index}`}
                        {...segment}
                    />
                ) : (
                    <TimeSlotEventClone key={`${segment?.guid}-${index}`}
                        {...segment}
                    />
                )
            ))}
        </>
    );

    return container ? createPortal(content, container) : null;
};

export default CloneEvent;
