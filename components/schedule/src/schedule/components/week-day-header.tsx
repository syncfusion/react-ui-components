import { FC, JSX } from 'react';
import { useSchedulePropsContext } from '../context/schedule-context';
import { useWeekDayHeader, WeekDayHeaderCell } from '../hooks/useWeekDayHeader';
import { CSS_CLASSES } from '../common/constants';

export const WeekDayHeader: FC = () => {

    const {
        showWeekNumber,
        weekDayTemplate
    } = useSchedulePropsContext();

    const { weekdayHeaderCells } = useWeekDayHeader();

    const renderWeekdayCell: (cell: WeekDayHeaderCell) => JSX.Element = (cell: WeekDayHeaderCell): JSX.Element => {
        return (
            <div
                key={cell.key}
                className={cell.className}
            >
                {weekDayTemplate ? (
                    typeof weekDayTemplate === 'function' ?
                        weekDayTemplate({ day: cell.day, type: 'weekDay' }) :
                        weekDayTemplate
                ) : (
                    <div className={CSS_CLASSES.HEADER_DAY}>{cell.day}</div>
                )}
            </div>
        );
    };

    return (
        <div className={CSS_CLASSES.HEADER_SECTION}>
            {showWeekNumber && (
                <div className={CSS_CLASSES.LEFT_INDENT}></div>
            )}
            <div className={CSS_CLASSES.RIGHT_SECTION}>
                <div className={CSS_CLASSES.DATE_HEADER_CONTAINER}>
                    <div className={CSS_CLASSES.DATE_HEADER}>
                        <div className={CSS_CLASSES.HEADER_ROW}>
                            {weekdayHeaderCells.map((cell: WeekDayHeaderCell) => renderWeekdayCell(cell))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

WeekDayHeader.displayName = 'WeekDayHeader';
export default WeekDayHeader;
