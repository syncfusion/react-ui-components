import { FC, useRef, useLayoutEffect, useState, useMemo } from 'react';
import { isNullOrUndefined } from '@syncfusion/react-base';
import { TimelineViewProps } from '../types/scheduler-types';
import { TimelineHeader } from '../components/timeline/timeline-header';
import { TimelineLayout } from '../components/timeline/timeline-layout';
import { TimelineResourceColumn } from '../components/timeline/timeline-resource-column';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { useTimelineEvents } from '../hooks/useTimelineEvents';
import { CSS_CLASSES } from '../common/constants';
import { DEFAULT_TIMELINE_EVENT_HEIGHT, DEFAULT_SCROLLBAR_HEIGHT, EVENTS_GAP, EventService } from '../services/EventService';
import { ViewService } from '../services/ViewService';
import { useSchedulerHeaderRowsContext } from '../context/scheduler-header-rows-context';
import CurrentTimeIndicator from '../components/current-time-indicator';
import { TimelineResourceRowMeta } from '../services/ResourceGroupingService';
import { useOnScroll } from '../hooks/useOnScroll';
import { MAX_EVENTS_STACK_TIMELINE } from '../utils/default-props';

/**
 * TimelineView component - internal layout for all timeline views.
 *
 * @private
 * @returns {JSX.Element} Complete timeline layout
 */
export const TimelineView: FC<TimelineViewProps> = () => {
    const { schedulerContentHeight, headerLastLevel } = useSchedulerHeaderRowsContext();
    const { maxEventsStack, rowAutoHeight, viewType, headerIndent, showTimeIndicator } = useSchedulerPropsContext();
    const { isGroupingEnabled, visibleResourceHeaders, resourceRowHeights, isCompact } = useResourceGroupingContext();
    const gridWrapperRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const viewClassName: string = ViewService.getTimelineViewClasses(viewType);
    const schedulerContainerRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);
    const { globalRowHeight, totalTimelineWidthPx } = useTimelineEvents(DEFAULT_TIMELINE_EVENT_HEIGHT);
    const { onScroll } =  useOnScroll();

    const calculatedTimelineHeight: number = useMemo(() => {
        if (rowAutoHeight && isGroupingEnabled && resourceRowHeights.size === visibleResourceHeaders.length) {
            return visibleResourceHeaders.reduce((total: number, row: TimelineResourceRowMeta) => total +
                (resourceRowHeights.get(row.groupIndex) || globalRowHeight), 0);
        }
        if (isGroupingEnabled && !isNullOrUndefined(maxEventsStack)) {
            return globalRowHeight * Math.max(1, visibleResourceHeaders.length);
        }
        return rowAutoHeight
            ? globalRowHeight
            : (DEFAULT_TIMELINE_EVENT_HEIGHT + EVENTS_GAP) * (maxEventsStack || MAX_EVENTS_STACK_TIMELINE);
    }, [rowAutoHeight, isGroupingEnabled, visibleResourceHeaders, resourceRowHeights, globalRowHeight, maxEventsStack]);

    useLayoutEffect(() => {
        if (schedulerContainerRef.current) {
            const headerElement: HTMLElement | null = schedulerContainerRef.current.querySelector(`.${CSS_CLASSES.STICKY_HEADER}`);
            const headerHeight: number = headerElement?.getBoundingClientRect().height || 0;
            const contentHeight: number = schedulerContainerRef.current.clientHeight - headerHeight;
            const scrollElement: HTMLElement | null = schedulerContainerRef.current.querySelector(`.${CSS_CLASSES.MAIN_SCROLL_CONTAINER}`);

            const contentHeightValue: number = EventService.calculateTimelineContentHeight(
                contentHeight,
                calculatedTimelineHeight,
                scrollElement,
                DEFAULT_SCROLLBAR_HEIGHT
            );
            schedulerContentHeight.current = contentHeightValue;
            setContentHeight(contentHeightValue);
        }
    }, [maxEventsStack, rowAutoHeight, calculatedTimelineHeight, viewType, totalTimelineWidthPx]);

    return (
        <div className={`${viewClassName}`} ref={schedulerContainerRef}>
            <div ref={gridWrapperRef}
                className={`${CSS_CLASSES.MAIN_SCROLL_CONTAINER} ${isGroupingEnabled && (rowAutoHeight || !isNullOrUndefined(maxEventsStack)) ? CSS_CLASSES.RESOURCE_ROW_AUTO_HEIGHT : ''}`}
                tabIndex={0}
                onScroll={onScroll}
            >
                <div className={CSS_CLASSES.STICKY_HEADER}>
                    {isGroupingEnabled && !isCompact && (
                        <div className={`${CSS_CLASSES.STICKY_HEADER} ${CSS_CLASSES.RESOURCE_LEFT_INDENT}`}>
                            {headerIndent ? (headerIndent()) : null}
                        </div>
                    )}
                    <TimelineHeader />
                </div>

                <div className={CSS_CLASSES.CONTENT_SECTION} style={{ height: `${contentHeight}px` }}>
                    {isGroupingEnabled && !isCompact && (
                        <div className={`${CSS_CLASSES.STICKY_HEADER} ${CSS_CLASSES.TIMELINE_RESOURCE_COLUMN_WRAPPER}`}>
                            <TimelineResourceColumn />
                        </div>
                    )}
                    <div className={`${CSS_CLASSES.TIMELINE_CONTAINER} ${CSS_CLASSES.CONTENT_TABLE}`}>
                        <TimelineLayout />

                        {showTimeIndicator && headerLastLevel?.[0]?.type === 'hourHeader' && (
                            <CurrentTimeIndicator viewMode='timeline' />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

TimelineView.displayName = 'TimelineView';

export default TimelineView;
