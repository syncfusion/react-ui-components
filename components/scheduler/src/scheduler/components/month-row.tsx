import { FC, ReactNode, RefObject, useCallback, useRef, useEffect, useState } from 'react';
import { useMonthRows } from '../hooks/useMonthRows';
import { MonthCells } from './month-cells';
import { useSchedulerPropsContext } from '../context/scheduler-context';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { CSS_CLASSES } from '../common/constants';
import { ResourceMonthWeekRow } from './resource-month-week-row';

export const MonthRow: FC = () => {
    const {
        showWeekNumber,
        numberOfWeeks,
        rowAutoHeight
    } = useSchedulerPropsContext();
    const { isGroupingEnabled } = useResourceGroupingContext();
    const {
        weekNumbers,
        weeksToRender,
        contentTableStyle,
        additionalClass,
        hideOtherMonths
    } = useMonthRows();

    const rowHeightsRef: RefObject<string[]> = useRef<string[]>([]);

    const [weekRowHeights, setWeekRowHeights] = useState<string[]>([]);

    const handleHeightCalculated: (rowIndex: number, height: string) => void = useCallback((rowIndex: number, height: string) => {
        if (rowHeightsRef.current[Number(rowIndex)] !== height) {
            rowHeightsRef.current[Number(rowIndex)] = height;
            setWeekRowHeights([...rowHeightsRef.current]);
        }
    }, []);

    useEffect(() => {
        const newLength: number = weeksToRender.length;
        const currentLength: number = rowHeightsRef.current.length;
        if (newLength !== currentLength) {
            const defaultHeight: string = rowHeightsRef.current[0];
            const newHeights: string[] = new Array(newLength).fill(defaultHeight).map((defaultHeight: string, index: number) =>
                rowHeightsRef.current[parseInt(index.toString(), 10)] || defaultHeight
            );
            rowHeightsRef.current = newHeights;
            setWeekRowHeights([...newHeights]);
        }
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
                <div className={CSS_CLASSES.DAY_CLONE_CONTAINER}></div>
                {weeksToRender.map((weekRenderDates: Date[], rowIndex: number): ReactNode => {
                    if (isGroupingEnabled) {
                        return (
                            <ResourceMonthWeekRow
                                key={`grouped-week-${rowIndex}`}
                                weekRenderDates={weekRenderDates}
                                rowIndex={rowIndex}
                                onHeightCalculated={handleHeightCalculated}
                            />
                        );
                    } else {
                        return (
                            <MonthCells
                                key={`week-${rowIndex}`}
                                weekRenderDates={weekRenderDates}
                                hideOtherMonths={hideOtherMonths}
                                rowIndex={rowIndex}
                                onHeightCalculated={handleHeightCalculated}
                            />
                        );
                    }
                })}
            </div>
        </>
    );
};

export default MonthRow;
