import { FC, useRef } from 'react';
import { WorkCells } from '../work-cells';
import { CSS_CLASSES } from '../../common/constants';
import { TimelineResourceRowMeta } from '../../services/ResourceGroupingService';
import TimelineEvent from './timeline-events';
import { useResourceGroupingContext } from '../../context/resource-grouping-context';
import { getTimelineEventHeight } from '../../utils/dimension-util';
import { JSX } from 'react/jsx-runtime';

/**
 * TimelineLayout component - renders the main date × hour grid.
 * Renders the background grid, event overlay(s), and drag/resize clone container.
 * Event rendering is delegated to TimelineEventsWrapper, which handles resource grouping.
 *
 * @private
 * @returns {React.ReactElement} Grid of date rows × hour columns with events
 */
export const TimelineLayout: FC = () => {
    const gridWrapperRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const eventHeight: number = getTimelineEventHeight(gridWrapperRef.current);
    const { isGroupingEnabled, visibleResourceHeaders } = useResourceGroupingContext();

    const renderTimelineEvents: () => JSX.Element | JSX.Element[] = () => {
        if (isGroupingEnabled) {
            return visibleResourceHeaders?.map(
                (resourceRow: TimelineResourceRowMeta) => (
                    <TimelineEvent
                        key={resourceRow.groupIndex}
                        eventHeight={eventHeight}
                        resourceRow={resourceRow}
                    />
                )
            );
        }

        return <TimelineEvent eventHeight={eventHeight} />;
    };

    return (
        <div
            ref={gridWrapperRef}
            className={CSS_CLASSES.TIMELINE_GRID}
        >
            <WorkCells eventHeight={eventHeight} />
            <div className={CSS_CLASSES.TIMELINE_EVENTS_CONTAINER}>
                {renderTimelineEvents()}
            </div>
            <div className={CSS_CLASSES.TIME_SLOT_CLONE_CONTAINER} />
        </div>
    );
};

TimelineLayout.displayName = 'TimelineLayout';

export default TimelineLayout;
