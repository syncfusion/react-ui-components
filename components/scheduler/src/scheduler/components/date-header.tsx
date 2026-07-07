import { FC, JSX, MouseEvent } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { AllDayRow } from './all-day-row';
import { useDateHeader, DateHeaderCell, useNavigate } from '../hooks/useDateHeader';
import { ChevronDownIcon } from '@syncfusion/react-icons';
import { useSchedulerLocalization } from '../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import useCellInteraction from '../hooks/useCellInteraction';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { CellData } from '../types/internal-interface';

export const DateHeader: FC = () => {

    const {
        timeScale,
        dateHeader,
        headerIndent,
        resourceHeader
    } = useSchedulerPropsContext();

    const { handleDateClick } = useNavigate();

    const { locale } = useProviderContext();
    const { getString } = useSchedulerLocalization(locale || 'en-US');

    const {
        headerCells,
        isAllDayCollapsed,
        showAllDayToggle,
        weekNumber,
        toggleAllDayCollapse,
        handleMoreEventsChange
    } = useDateHeader();

    const { handleCellClick, handleCellDoubleClick } = useCellInteraction();
    const { isGroupingEnabled, columnLevels } = useResourceGroupingContext();

    const renderDateCell: (headerCell: DateHeaderCell, groupIndex?: number) => JSX.Element =
        (headerCell: DateHeaderCell, groupIndex?: number): JSX.Element => {
            return (
                <div
                    key={`${headerCell.key}-${groupIndex ?? 'base'}`}
                    className={headerCell.className}
                    data-date={headerCell.date ? headerCell.date.getTime() : undefined}
                    data-group-index={groupIndex ?? undefined}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => handleCellClick(e, headerCell.date, true)}
                    onDoubleClick={(e: React.MouseEvent<HTMLDivElement>) => handleCellDoubleClick(e, headerCell.date, true)}
                >
                    {dateHeader ? dateHeader({ date: headerCell.date })
                        : (
                            <>
                                <div className={CSS_CLASSES.HEADER_DAY}>{headerCell.dayName}</div>
                                <div
                                    className={`${CSS_CLASSES.HEADER_DATE} ${headerCell.isToday ? CSS_CLASSES.TODAY : ''}`}
                                    onClick={(e: MouseEvent<HTMLElement>) => handleDateClick(e, headerCell.date)}>
                                    {headerCell.dateNumber}
                                </div>
                            </>
                        )
                    }
                </div>
            );
        };

    const renderAllDayToggle: () => JSX.Element = (): JSX.Element => {
        return (
            <div
                className={CSS_CLASSES.ALL_DAY_APPOINTMENT_SECTION}
                onClick={toggleAllDayCollapse}
                role="button"
                tabIndex={0}
                aria-label={isAllDayCollapsed ? getString('expandAllDaySection') : getString('collapseAllDaySection')}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>): void => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        toggleAllDayCollapse();
                    }
                }}
            >
                <ChevronDownIcon
                    className={isAllDayCollapsed ? CSS_CLASSES.APPOINTMENT_EXPAND : CSS_CLASSES.APPOINTMENT_COLLAPSE}
                />
            </div>
        );
    };

    const renderResourceHeader: () => JSX.Element = (): JSX.Element | null => {
        const lastLevelIndex: number = columnLevels.length - 1;
        return (
            <>
                {columnLevels?.map((level: CellData[], levelIndex: number) => {
                    const isLastLevel: boolean = levelIndex === lastLevelIndex;
                    return (
                        <div
                            key={`${CSS_CLASSES.RESOURCE_HEADER}-${levelIndex}`}
                            className={`${CSS_CLASSES.RESOURCE_HEADER} ${isLastLevel ? `${CSS_CLASSES.RESOURCE_HEADER_LAST_LEVEL}` : ''}`}
                        >
                            {level.map((header: CellData, cellIndex: number) => {
                                const resource: Record<string, any> = header.resourceData;
                                const resourceNameField: string = header.resource?.textField || '';
                                const resourceName: string = resource?.[`${resourceNameField}`] || '';
                                const colSpan: number = header.colSpan || 1;

                                if (header.type === 'resourceHeader') {
                                    const cellStyle: React.CSSProperties = {
                                        '--sf-scheduler-col-span': colSpan
                                    } as React.CSSProperties;

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
                                } else if (header.type === 'dateHeader') {
                                    const matchingCell: DateHeaderCell = headerCells.find(
                                        (cell: DateHeaderCell) =>
                                            cell.date && header.date &&
                                            cell.date.getTime() === header.date.getTime()
                                    );

                                    return (
                                        matchingCell ? renderDateCell(matchingCell, header.groupIndex) : null
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
        <div className={`${CSS_CLASSES.HEADER_SECTION} ${isGroupingEnabled ? CSS_CLASSES.RESOURCE_GROUP_HEADER : ''}`}>
            {timeScale.enable && (
                <div className={CSS_CLASSES.LEFT_INDENT}>
                    {headerIndent ? (
                        headerIndent({ weekNumber })
                    ) : (
                        <>
                            {weekNumber && (
                                <div className={CSS_CLASSES.WEEK_NUMBER}>
                                    <div title={`Week ${weekNumber}`}>{weekNumber}</div>
                                </div>
                            )}
                        </>
                    )}
                    {showAllDayToggle && renderAllDayToggle()}
                </div>
            )}
            <div className={CSS_CLASSES.RIGHT_SECTION}>
                <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                    {isGroupingEnabled ? (
                        renderResourceHeader()
                    ) : (
                        <div className={CSS_CLASSES.DATE_HEADER}>
                            <div className={CSS_CLASSES.HEADER_ROW}>
                                {headerCells.map((cell: DateHeaderCell) => renderDateCell(cell))}
                            </div>
                        </div>
                    )}
                    <div className={CSS_CLASSES.DAY_CLONE_CONTAINER}></div>
                    <AllDayRow
                        isCollapsed={isAllDayCollapsed}
                        onCollapseChange={toggleAllDayCollapse}
                        onMoreEventsChange={handleMoreEventsChange}
                    />
                </div>
            </div>
        </div>
    );
};

DateHeader.displayName = 'DateHeader';
export default DateHeader;
