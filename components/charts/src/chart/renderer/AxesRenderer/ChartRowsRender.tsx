import { useLayout } from '../../layout/LayoutContext';
import { Row } from '../../base/interfaces';
import { useEffect, useMemo } from 'react';
import { Chart, Rect, RowProps } from '../../chart-area/chart-interfaces';

/**
 * Props for the ChartRowsRender component.
 */
interface ChartRowsRenderProps {
    /** Array of row configurations defining chart layout rows. */
    rows: Row[];
}

/**
 * Manages chart row layout calculations and triggers re-measurement when needed.
 * This component doesn't render visible content but handles layout calculations.
 */

export const ChartRowsRender: React.FC<ChartRowsRenderProps> = ({ rows }: ChartRowsRenderProps) => {
    const { phase, triggerRemeasure } = useLayout();

    const rowHeights: string = useMemo(
        () => rows.map((row: Row) => row.height).join(','),
        [rows]
    );
    useEffect(() => {
        if (phase !== 'measuring') {
            triggerRemeasure();
        }
    }, [rowHeights]);
    return <></>; /* This component manages row layout calculations without rendering visible content */
};

/**
 * Calculates and adjusts the size of rows within the given chart based on the provided rectangular area.
 *
 * @param {Chart} chart - The chart for which the row sizes are calculated.
 * @param {Rect} rect - The rectangular area that influences the row size calculations.
 * @returns {void} This function does not return a value.
 * @private
 */
export function calculateRowSize(chart: Chart, rect: Rect): void {
    let rowTop: number = rect.y + rect.height;
    let remainingHeight: number = Math.max(0, rect.height);

    for (let i: number = 0; i < chart.rows.length; i++) {
        const row: RowProps = chart.rows[i as number];
        let height: number;

        if (row.height.includes('%')) {
            height = Math.min(remainingHeight, (rect.height * parseInt(row.height, 10)) / 100);
        } else {
            height = Math.min(remainingHeight, parseInt(row.height, 10));
        }

        height = (i !== (chart.rows.length - 1)) ? height : remainingHeight;
        row.computedHeight = height;
        rowTop -= height;
        row.computedTop = rowTop;
        remainingHeight -= height;
    }
}
