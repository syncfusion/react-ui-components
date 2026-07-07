import { FC } from 'react';
import { MonthCells } from './month-cells';
import { useResourceGroupingContext } from '../context/resource-grouping-context';
import { MonthCell, ResourceMonthCells, useMonthCells } from '../hooks/useMonthCells';

/**
 * Props for ResourceMonthWeekRow component
 *
 * @private
 */
interface ResourceMonthWeekRowProps {
    /**
     * Dates for this week
     */
    weekRenderDates: Date[];

    /**
     * Index of this row
     */
    rowIndex: number;

    /**
     * Callback when height is calculated
     */
    onHeightCalculated: (rowIndex: number, height: string) => void;
}

export const ResourceMonthWeekRow: FC<ResourceMonthWeekRowProps> = ({
    weekRenderDates,
    rowIndex,
    onHeightCalculated
}: ResourceMonthWeekRowProps) => {
    const { groupConfig } = useResourceGroupingContext();
    const { resourceCells, resourceByDateCells } = useMonthCells({
        weekRenderDates,
        rowIndex
    });

    const resourceMonthCells: MonthCell[] = groupConfig.byDate
        ? resourceByDateCells
        : resourceCells.flatMap((resourceCellData: ResourceMonthCells) => resourceCellData.cells);

    return (
        <MonthCells
            weekRenderDates={weekRenderDates}
            rowIndex={rowIndex}
            onHeightCalculated={onHeightCalculated}
            resourceWorkCells={resourceMonthCells}
        />
    );
};

export default ResourceMonthWeekRow;
