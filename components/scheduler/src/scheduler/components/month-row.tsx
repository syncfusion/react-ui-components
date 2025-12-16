import { FC, ReactNode, RefObject, useCallback, useRef, useEffect, useState } from 'react';
import { useMonthRows } from '../hooks/useMonthRows';
import { MonthCells } from './month-cells';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { CSS_CLASSES } from '../common/constants';

export const MonthRow: FC = () => {
    const {
        showWeekNumber,
        numberOfWeeks,
        rowAutoHeight
    } = useSchedulerPropsContext();

    const {
        weekNumbers,
        weeksToRender,
        contentTableStyle,
        additionalClass,
        hideOtherMonths
    } = useMonthRows();

    const rowHeightsRef: RefObject<string[]> = useRef<string[]>(new Array(weeksToRender.length).fill('124px'));

    const [weekRowHeights, setWeekRowHeights] = useState<string[]>([]);

    const handleHeightCalculated: (rowIndex: number, height: string) => void = useCallback((rowIndex: number, height: string) => {
        if (rowHeightsRef.current[Number(rowIndex)] !== height) {
            rowHeightsRef.current[Number(rowIndex)] = height;
            setWeekRowHeights([...rowHeightsRef.current]);
        }
    }, [weeksToRender.length]);

    useEffect(() => {
        rowHeightsRef.current = new Array(weeksToRender.length).fill('124px');
    }, [weeksToRender.length]);

    const renderWeekNumbers: () => ReactNode[] = useCallback(() => {
        return weekNumbers?.map((weekNumber: number, index: number) => {
            return (
                <div
                    key={`week-${index}`}
                    className={CSS_CLASSES.WEEK_NUMBER}
                    title={`Week ${weekNumber}`}
                    style={{ height: rowAutoHeight ? weekRowHeights[Number(index)] : '' }}
                >
                    {weekNumber}
                </div>
            );
        });
    }, [weekRowHeights, weekNumbers]);

    return (
        <>
            {showWeekNumber && (
                <div
                    className={`sf-left-indent ${numberOfWeeks ? 'sf-custom-weeks' : ''}`}
                    style={numberOfWeeks ? { '--week-count': numberOfWeeks } as React.CSSProperties : undefined}
                >
                    <div className={CSS_CLASSES.WEEK_NUMBER_WRAPPER}>
                        {renderWeekNumbers()}
                    </div>
                </div>
            )}
            <div
                className={`sf-content-table ${additionalClass}`}
                style={contentTableStyle}
            >
                {weeksToRender.map((weekRenderDates: Date[], rowIndex: number): ReactNode => (
                    <MonthCells
                        key={`week-${rowIndex}`}
                        weekRenderDates={weekRenderDates}
                        hideOtherMonths={hideOtherMonths}
                        rowIndex={rowIndex}
                        onHeightCalculated={handleHeightCalculated}
                    />
                ))}
            </div>
        </>
    );
};

export default MonthRow;
