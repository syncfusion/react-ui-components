import { CSSProperties, FC, useRef } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@syncfusion/react-icons';
import { CSS_CLASSES } from '../../common/constants';
import { useSchedulerPropsContext } from '../../context/scheduler-context';
import { TimelineResourceRowMeta } from '../../services/ResourceGroupingService';
import { useResourceGroupingContext } from '../../context/resource-grouping-context';
import { getResourceRowHeightStyle, getTimelineEventHeight } from '../../utils/dimension-util';

export const TimelineResourceColumn: FC = () => {
    const { isGroupingEnabled, visibleResourceHeaders, expandedState, toggleExpanded, resourceRowHeights } = useResourceGroupingContext();
    const { resourceHeader, rowAutoHeight, maxEventsStack } = useSchedulerPropsContext();
    const resourceColumnWrapperRef: React.RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const eventHeight: number = getTimelineEventHeight(resourceColumnWrapperRef.current);

    return (
        <div className={`${CSS_CLASSES.TIMELINE_RESOURCE_COLUMN}`} ref={resourceColumnWrapperRef}>
            {visibleResourceHeaders.map((row: TimelineResourceRowMeta) => {
                const isParent: boolean = (row.count ?? 0) > 0;
                const isCollapsed: boolean = !expandedState.get(row.groupIndex);
                const rowHeightStyle: CSSProperties | undefined = getResourceRowHeightStyle(
                    isGroupingEnabled, rowAutoHeight, resourceRowHeights, row.groupIndex, maxEventsStack, eventHeight
                );
                const rowStyle: CSSProperties = {
                    '--sf-scheduler-resource-level': `${(row.depth ?? 0) + 1}`, ...rowHeightStyle
                } as CSSProperties;

                return (
                    <div
                        key={`resource-row-${row.groupIndex}`}
                        className={`${CSS_CLASSES.TIMELINE_RESOURCE_ROW} ${isParent ? `${CSS_CLASSES.PARENT_NODE}` : `${CSS_CLASSES.LEAF_NODE}`}`}
                        data-group-index={row.groupIndex}
                        style={rowStyle}
                    >
                        {isParent && (
                            <div
                                className={`${CSS_CLASSES.RESOURCE_TREE_ICON} ${isCollapsed ? `${CSS_CLASSES.RESOURCE_COLLAPSED}` : `${CSS_CLASSES.RESOURCE_EXPANDED}`}`}
                                onClick={() => toggleExpanded?.(row.groupIndex)}
                            >
                                {isCollapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                            </div>
                        )}
                        {resourceHeader
                            ? resourceHeader({ resourceData: row.resourceData, resource: row.resource })
                            : (<div className={`${CSS_CLASSES.ELLIPSIS} ${CSS_CLASSES.RESOURCE_NAME}`}>{row.resourceName}</div>)
                        }
                    </div>
                );
            })}
        </div>
    );
};

export default TimelineResourceColumn;
