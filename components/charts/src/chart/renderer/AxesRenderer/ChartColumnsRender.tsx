import * as React from 'react';
import { useLayout } from '../../layout/LayoutContext';
import { Column } from '../../base/interfaces';
import { useEffect, useMemo } from 'react';
import { Chart, ColumnProps, Rect } from '../../chart-area/chart-interfaces';

/**
 * Props interface for the ChartColumnsRender component.
 * Defines the required properties for column layout management.
 */
interface ChartColumnsRenderProps {
    /**
     * Array of column configurations with width specification.
     */
    columns: Column[];
}

/**
 * A React component that manages column layout calculations for chart rendering.
 */

export const ChartColumnsRender: React.FC<ChartColumnsRenderProps> = ({ columns }: { columns: Column[] }) => {
    const { phase, triggerRemeasure } = useLayout();
    const columnWidths: string = useMemo(
        () => columns.map((column: Column) => column.width).join(','),
        [columns]
    );
    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [columnWidths]);
    return <></>;  /* This component manages row layout calculations without rendering visible content */
};

/**
 * Calculates and adjusts the size of columns within the given chart based on the provided rectangular area.
 *
 * @param {Rect} rect - The rectangular area used for column size calculations.
 * @param {Chart} chart - The chart for which column sizes are being adjusted.
 * @returns {void} This function does not return any value.
 * @private
 */
export function calculateColumnSize(rect: Rect, chart: Chart): void {
    let columnLeft: number = rect.x;
    let width: number = 0;
    let remainingWidth: number = Math.max(0, rect.width);

    for (let i: number = 0; i < chart.columns.length; i++) {
        const column: ColumnProps = chart.columns[i as number];
        if (column.width.includes('%')) {
            width = Math.min(remainingWidth, (rect.width * parseInt(column.width, 10) / 100));
        } else {
            width = Math.min(remainingWidth, parseInt(column.width, 10));
        }
        width = (i !== (chart.columns.length - 1)) ? width : remainingWidth;
        column.computedWidth = width;
        column.computedLeft = columnLeft;
        columnLeft += width;
        remainingWidth -= width;
    }
}
