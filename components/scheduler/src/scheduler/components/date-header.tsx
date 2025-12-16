import { FC, JSX, MouseEvent } from 'react';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { AllDayRow } from './all-day-row';
import { useDateHeader, DateHeaderCell, useNavigate } from '../hooks/useDateHeader';
import { ChevronDownIcon } from '@syncfusion/react-icons';
import { useSchedulerLocalization } from '../common/locale';
import { useProviderContext } from '@syncfusion/react-base';
import { CSS_CLASSES } from '../common/constants';
import useCellInteraction from '../hooks/useCellInteraction';

export const DateHeader: FC = () => {

    const {
        timeScale,
        dateHeader
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

    const renderDateCell: (headerCell: DateHeaderCell) => JSX.Element = (headerCell: DateHeaderCell): JSX.Element => {
        return (
            <div
                key={headerCell.key}
                className={headerCell.className}
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

    return (
        <div className={CSS_CLASSES.HEADER_SECTION}>
            {timeScale.enable && (
                <div className={CSS_CLASSES.LEFT_INDENT}>
                    {weekNumber && (
                        <div className={CSS_CLASSES.WEEK_NUMBER}>
                            <div title={`Week ${weekNumber}`}>{weekNumber}</div>
                        </div>
                    )}
                    {showAllDayToggle && renderAllDayToggle()}
                </div>
            )}
            <div className={CSS_CLASSES.RIGHT_SECTION}>
                <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                    <div className={CSS_CLASSES.DATE_HEADER}>
                        <div className={CSS_CLASSES.HEADER_ROW}>
                            {headerCells.map((cell: DateHeaderCell) => renderDateCell(cell))}
                        </div>
                        <div className={CSS_CLASSES.DAY_CLONE_CONTAINER}></div>
                        <AllDayRow
                            isCollapsed={isAllDayCollapsed}
                            onCollapseChange={toggleAllDayCollapse}
                            onMoreEventsChange={handleMoreEventsChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

DateHeader.displayName = 'DateHeader';
export default DateHeader;
