import { MouseEvent, FC, CSSProperties, useMemo } from 'react';
import { useProviderContext } from '@syncfusion/react-base';
import { WorkCell } from '../hooks/useWorkCells';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useSchedulerRenderDatesContext } from '../context/scheduler-render-dates-context';
import { useWorkCells } from '../hooks/useWorkCells';
import { CSS_CLASSES } from '../common/constants';
import useCellInteraction from '../hooks/useCellInteraction';
import { DateService } from '../services/DateService';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { getResourceRowHeightStyle } from '../utils/dimension-util';

export const WorkCells: FC<{ eventHeight?: number }> = ({ eventHeight }: { eventHeight?: number }) => {
    const { renderDates } = useSchedulerRenderDatesContext();
    const { workDays, workHours, cell, timeScale, startHour, endHour, viewType, timeFormat,
        isTimelineView, isMonthView, rowAutoHeight, maxEventsStack } = useSchedulerPropsContext();
    const { locale } = useProviderContext();
    const { isGroupingEnabled, resourceRowHeights } = useResourceGroupingContext();
    const { timeSlots } = useMemo(
        () => DateService.getTimelineSlots(viewType, startHour, endHour, timeScale, timeFormat, locale),
        [viewType, startHour, endHour, timeScale, timeFormat, locale]
    );
    const { workCellRows, renderCellTemplate } = useWorkCells({
        renderDates, workDays, workHours, cell, timeScale, startHour, endHour, isTimelineView, timeSlots, isMonthView
    });
    const { handleCellClick, handleCellDoubleClick, handleKeyDown } = useCellInteraction();

    return (
        <>
            {workCellRows.map((row: { key: string, dataAttribute?: string, cells: WorkCell[] }) => {
                const groupIndex: number | undefined = row.cells[0]?.groupIndex;
                const rowHeightStyle: CSSProperties | undefined = getResourceRowHeightStyle(
                    isGroupingEnabled, rowAutoHeight, resourceRowHeights, groupIndex, maxEventsStack, eventHeight, isTimelineView
                );
                return (
                    <div
                        key={row.key}
                        className={CSS_CLASSES.WORK_CELLS_ROW}
                        data-date={row.dataAttribute}
                        style={rowHeightStyle}
                    >
                        {row.cells.map((cell: WorkCell) => {
                            const colSpan: number = Math.max(1, cell.colSpan ?? 1);
                            const cellStyle: CSSProperties | undefined = colSpan > 1
                                ? ({ '--sf-scheduler-col-span': colSpan } as CSSProperties)
                                : undefined;
                            return (
                                <div
                                    key={cell.key}
                                    className={cell.className}
                                    style={cellStyle}
                                    data-date={cell.dataAttributes.date}
                                    data-date-key={cell.dataAttributes.dateKey}
                                    data-group-index={cell.dataAttributes.groupIndex}
                                    onClick={(e: MouseEvent<HTMLElement>) =>
                                        handleCellClick(e, cell.date, isMonthView, cell.endDate)}
                                    onDoubleClick={(e: MouseEvent<HTMLElement>) =>
                                        handleCellDoubleClick(e, cell.date, isMonthView, cell.endDate)}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
                                        handleKeyDown(e, cell.date, isMonthView, cell.endDate);
                                    }}
                                >
                                    {renderCellTemplate(cell.date)}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </>
    );
};

WorkCells.displayName = 'WorkCells';

export default WorkCells;
