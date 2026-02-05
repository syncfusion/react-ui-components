import { MouseEvent, FC } from 'react';
import { WorkCell } from '../hooks/useWorkCells';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useScheduleRenderDatesContext } from '../context/schedule-render-dates-context';
import { useWorkCells } from '../hooks/useWorkCells';
import { CSS_CLASSES } from '../common/constants';
import useCellInteraction from '../hooks/useCellInteraction';

export const WorkCells: FC = () => {
    const { renderDates } = useScheduleRenderDatesContext();

    const {
        workDays,
        workHours,
        cellTemplate,
        timeScale,
        startHour,
        endHour
    } = useSchedulePropsContext();

    const {
        workCellRows,
        renderCellTemplate
    } = useWorkCells({
        renderDates,
        workDays,
        workHours,
        cellTemplate,
        timeScale,
        startHour,
        endHour
    });

    const { handleCellClick, handleCellDoubleClick, handleKeyDown } = useCellInteraction();

    return (
        <div className={CSS_CLASSES.CONTENT_TABLE}>
            {workCellRows.map((row: {key: string, dataAttribute?: string, cells: WorkCell[]}) => (
                <div
                    key={row.key}
                    className={CSS_CLASSES.WORK_CELLS_ROW}
                    data-date={row.dataAttribute}
                >
                    {row.cells.map((cell: WorkCell) => (
                        <div
                            key={cell.key}
                            className={cell.className}
                            data-date={cell.dataAttributes.date}
                            data-date-key={cell.dataAttributes.dateKey}
                            onClick={(e: MouseEvent<HTMLElement>) => handleCellClick(e, cell.date)}
                            onDoubleClick={(e: MouseEvent<HTMLElement>) => handleCellDoubleClick(e, cell.date)}
                            onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => { handleKeyDown(e, cell.date); }}
                        >
                            {renderCellTemplate(cell.date)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

WorkCells.displayName = 'WorkCells';

export default WorkCells;
