import { FC, JSX } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useWeekDayHeader, WeekDayHeaderCell } from '../hooks/useWeekDayHeader';
import { CSS_CLASSES } from '../common/constants';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { CellData } from '../types/internal-interface';

export const WeekDayHeader: FC = () => {

    const { showWeekNumber, weekDay, resourceHeader } = useSchedulerPropsContext();
    const { weekdayHeaderCells, monthColumnLevels } = useWeekDayHeader();
    const { isGroupingEnabled } = useResourceGroupingContext();

    const renderWeekdayCell: (cell: WeekDayHeaderCell) => JSX.Element = (cell: WeekDayHeaderCell): JSX.Element => {
        return (
            <div
                key={cell.key}
                className={cell.className}
            >
                {weekDay ? weekDay({ day: cell.day })
                    : (
                        <div className={CSS_CLASSES.HEADER_DAY}>{cell.day}</div>
                    )
                }
            </div>
        );
    };

    const renderResourceHeader: () => JSX.Element = (): JSX.Element | null => {
        const lastLevelIndex: number = monthColumnLevels.length - 1;
        return (
            <>
                {monthColumnLevels.map((level: CellData[], levelIndex: number) => {
                    const isLastLevel: boolean = levelIndex === lastLevelIndex;
                    return (
                        <div
                            key={`${CSS_CLASSES.RESOURCE_HEADER}-${levelIndex}`}
                            className={`${CSS_CLASSES.RESOURCE_HEADER} ${isLastLevel ? `${CSS_CLASSES.RESOURCE_HEADER_LAST_LEVEL}` : ''}`}
                        >
                            {level.map((header: CellData, cellIndex: number) => {
                                const colSpan: number = header.colSpan || 1;
                                const cellStyle: React.CSSProperties = {
                                    '--sf-scheduler-col-span': colSpan
                                } as React.CSSProperties;

                                if (header.type === 'resourceHeader') {
                                    const resource: Record<string, any> = header.resourceData;
                                    const resourceNameField: string = header.resource?.textField || '';
                                    const resourceName: string = resource?.[`${resourceNameField}`] || '';

                                    return (
                                        <div
                                            key={`${levelIndex}-${cellIndex}`}
                                            className={`${CSS_CLASSES.RESOURCE_HEADER_CELL} ${header.cssClass || ''}`}
                                            style={cellStyle}
                                            title={resourceName}
                                        >
                                            {resourceHeader
                                                ? resourceHeader({ resourceData: header.resourceData, resource: header.resource })
                                                : (<div className={CSS_CLASSES.ELLIPSIS}>{resourceName}</div>)
                                            }
                                        </div>
                                    );
                                } else if (header.type === 'monthWeekday') {
                                    const dayName: string = header.dayName || '';

                                    return (
                                        <div
                                            key={`${levelIndex}-${cellIndex}`}
                                            className={`${CSS_CLASSES.RESOURCE_HEADER_CELL} ${header.className?.join(' ') || ''}`}
                                            style={cellStyle}
                                        >
                                            {weekDay ? weekDay({ day: dayName })
                                                : (
                                                    <div className={CSS_CLASSES.HEADER_DAY}>{dayName}</div>
                                                )
                                            }
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div className={`${CSS_CLASSES.HEADER_SECTION} ${isGroupingEnabled && monthColumnLevels ? `${CSS_CLASSES.RESOURCE_GROUP_MONTH_HEADER}` : ''}`}>
            {showWeekNumber && (
                <div className={CSS_CLASSES.LEFT_INDENT}></div>
            )}

            <div className={CSS_CLASSES.RIGHT_SECTION}>
                <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                    {isGroupingEnabled && monthColumnLevels ? (
                        renderResourceHeader()
                    ) : (
                        <div className={CSS_CLASSES.DATE_HEADER}>
                            <div className={CSS_CLASSES.HEADER_ROW}>
                                {weekdayHeaderCells.map((cell: WeekDayHeaderCell) => renderWeekdayCell(cell))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

WeekDayHeader.displayName = 'WeekDayHeader';
export default WeekDayHeader;
