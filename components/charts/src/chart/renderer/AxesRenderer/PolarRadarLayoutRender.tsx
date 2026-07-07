import { JSX } from 'react';
import { AxisModel, Chart, ChartAxisLayout, ChartSizeProps, ColumnProps, Rect, RowProps, TextStyleModel, VisibleLabel, VisibleRangeProps } from '../../chart-area/chart-interfaces';
import { measureText, valueToCoefficient } from '../../utils/helper';
import { calculateDoubleAxis } from './AxisTypeRenderer/DoubleAxisRenderer';
import { calculateCategoryAxis } from './AxisTypeRenderer/CategoryAxisRenderer';
import { calculateDateTimeAxis } from './AxisTypeRenderer/DateTimeAxisRenderer';
import { calculateLogarithmicAxis } from './AxisTypeRenderer/LogarithmicAxisRenderer';
import { ChartAxisLabelProps } from '../../chart-axis/base';
import { ChartLocationProps } from '../../base/interfaces';


/**
 * Measures the polar or radar axis layout and updates the chart axis layout state.
 * Initializes the chart axis layout when needed, measures row and column axes, and computes the final axis size.
 *
 * @param {Rect} rect - The available rectangle for the chart area.
 * @param {Chart} chart - The chart instance to update.
 * @returns {void} This function updates the chart layout in place.
 *
 * @private
 */
export function measurePolarRadarAxis(rect: Rect, chart: Chart): void {
    if (!chart) { return; }

    if (!chart.chartAxislayout) {
        chart.chartAxislayout = {
            initialClipRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            leftSize: 0,
            rightSize: 0,
            topSize: 0,
            bottomSize: 0,
            seriesClipRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        } as ChartAxisLayout;
    } else {
        chart.chartAxislayout.initialClipRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        chart.chartAxislayout.seriesClipRect = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        chart.chartAxislayout.leftSize = 0;
        chart.chartAxislayout.rightSize = 0;
        chart.chartAxislayout.topSize = 0;
        chart.chartAxislayout.bottomSize = 0;
    }

    measureRowAxis(chart, chart.chartAxislayout.initialClipRect);
    measureColumnAxis(chart, chart.chartAxislayout.initialClipRect);

    calculateAxisSize(chart, chart.chartAxislayout.initialClipRect);
}

/**
 * Calculates the row size for the polar or radar chart layout.
 *
 * @param {Chart} chart - The chart instance containing row definitions.
 * @param {Rect} rect - The rectangle used to calculate the row size.
 * @returns {void} This function updates the first row definition in place.
 *
 * @private
 */
export function calculateRowSize(chart: Chart, rect: Rect): void {
    const row: RowProps = chart.rows[0];
    (row as RowProps).computedHeight = rect.height / 2;
    (row as RowProps).computedTop = rect.y;
    chart.rows[0] = row;
}

/**
 * Calculates the column size for the polar or radar chart layout.
 *
 * @param {Chart} chart - The chart instance containing column definitions.
 * @param {Rect} rect - The rectangle used to calculate the column size.
 * @returns {void} This function updates the first column definition in place.
 *
 * @private
 */
export function calculateColumnSize(chart: Chart, rect: Rect): void {
    const column: ColumnProps = chart.columns[0];
    (column as ColumnProps).computedLeft = rect.x;
    (column as ColumnProps).computedWidth = rect.width;
    chart.columns[0] = column;
}

/**
 * Measures the row axis definitions using the computed row size.
 *
 * @param {Chart} chart - The chart instance containing row axes.
 * @param {Rect} rect - The rectangle used for measurement.
 * @returns {void} This function updates row axis measurements in place.
 *
 * @private
 */
export function measureRowAxis(chart: Chart, rect: Rect): void {
    calculateRowSize(chart, rect);
    const row: RowProps = chart.rows[0];
    measureDefinition(row, chart, { width: chart.availableSize.width, height: (row as RowProps).computedHeight });
}

/**
 * Measures the column axis definitions using the computed column size.
 *
 * @param {Chart} chart - The chart instance containing column axes.
 * @param {Rect} rect - The rectangle used for measurement.
 * @returns {void} This function updates column axis measurements in place.
 *
 * @private
 */
export function measureColumnAxis(chart: Chart, rect: Rect): void {
    calculateColumnSize(chart, rect);
    const column: ColumnProps = chart.columns[0];
    measureDefinition(column, chart, { width: (column as ColumnProps).computedWidth, height: chart.availableSize.height });
}

/**
 * Measures each axis in the provided definition using the appropriate axis calculator.
 *
 * @param {RowProps | ColumnProps} definition - The row or column definition that contains axes.
 * @param {Chart} chart - The chart instance associated with the axes.
 * @param {ChartSizeProps} size - The available size for axis measurement.
 * @returns {void} This function updates each axis in place.
 *
 * @private
 */
export function measureDefinition(definition: RowProps | ColumnProps, chart: Chart, size: ChartSizeProps): void {
    for (const axis of definition.axes) {
        axis.chart = chart as Chart;
        switch (axis.valueType) {
        case 'Double':
            calculateDoubleAxis(size, axis, chart);
            break;
        case 'DateTime':
            calculateDateTimeAxis(size, axis, chart);
            break;
        case 'Category':
            calculateCategoryAxis(size, axis, chart);
            break;
        case 'Logarithmic':
            calculateLogarithmicAxis(size, axis, chart);
            break;
        }
    }
}

/**
 * Calculates the final axis size and updates the chart polar center, radius, and series clip rectangle.
 *
 * @param {Chart} chart - The chart instance to update.
 * @param {Rect} initialClipRect - The initial clipping rectangle used to compute the polar radius.
 * @returns {void} This function updates chart layout values in place.
 *
 * @private
 */
export function calculateAxisSize(chart: Chart, initialClipRect: Rect): void {
    const padding: number = 5;
    const centerX: number = initialClipRect.x + initialClipRect.width * 0.5;
    const centerY: number = initialClipRect.y + initialClipRect.height * 0.5;
    (chart as Chart).polarCenterX = centerX;
    (chart as Chart).polarCenterY = centerY;

    const xAxis: AxisModel | undefined = (chart.axisCollection).find((a: AxisModel) => a.name === 'primaryXAxis');
    const yAxis: AxisModel | undefined = (chart.axisCollection).find((a: AxisModel) => a.name === 'primaryYAxis');

    const majorTick: number = (xAxis?.majorTickLines?.height as number);
    const maxLabelHeight: number = (xAxis?.maxLabelSize?.height as number) || 0;
    const coefficient: number = Number((xAxis as AxisModel).coefficient as number);

    let radius: number = Math.min(initialClipRect.width, initialClipRect.height) / 2 - padding - majorTick - maxLabelHeight;
    radius = (coefficient * radius) / 100;
    (chart as Chart).radius = radius;

    const circleBox: Rect = { x: centerX - radius, y: centerY - radius, width: 2 * radius, height: 2 * radius };
    chart.chartAxislayout.seriesClipRect = circleBox;

    if (yAxis) { yAxis.rect = circleBox; yAxis.updatedRect = { ...circleBox }; }
    if (xAxis) { xAxis.rect = circleBox; xAxis.updatedRect = { ...circleBox }; }

    if (chart.rows && chart.rows.length > 0) {
        const row: RowProps = chart.rows[0];
        (row as RowProps).computedTop = circleBox.y;
        (row as RowProps).computedHeight = circleBox.height;
    }
    if (chart.columns && chart.columns.length > 0) {
        const column: ColumnProps = chart.columns[0];
        (column as ColumnProps).computedLeft = circleBox.x;
        (column as ColumnProps).computedWidth = circleBox.width;
    }
}

// -------------- POLAR/RADAR RENDERING HELPERS --------------

/**
 * Converts an axis value to a normalized coefficient in the range [0, 1].
 *
 * @param {number} value - The axis value to convert.
 * @param {AxisModel} axis - The axis model that contains the visible range.
 * @returns {number} The normalized coefficient for the given value.
 *
 * @private
 */
function valueToPolarCoefficient(value: number, axis: AxisModel): number {
    const range: VisibleRangeProps = axis.visibleRange;
    return (value - range.minimum) / (range.delta || 1);
}

/**
 * Converts a coefficient and start angle into a unit vector.
 *
 * @param {number} coefficient - The coefficient in the range [0, 1].
 * @param {number} startAngle - The starting angle in degrees.
 * @returns {ChartLocationProps} The unit vector representing the angle direction.
 *
 * @private
 */
function coefficientToVector(coefficient: number, startAngle: number): ChartLocationProps {
    startAngle = startAngle < 0 ? startAngle + 360 : startAngle;
    let angle: number = Math.PI * (1.5 + 2 * coefficient);
    angle = angle + (startAngle * Math.PI) / 180;
    return { x: Math.cos(angle), y: Math.sin(angle) };
}

/**
 * Gets the chart center and maximum radius derived from the current series clip rectangle.
 *
 * @param {Chart} chart - The chart instance.
 * @returns {{centerX: number, centerY: number, radiusMax: number}} The computed center and maximum radius.
 *
 * @private
 */
function getCenter(chart: Chart): { centerX: number; centerY: number; radiusMax: number } {
    const rect: Rect = chart.chartAxislayout.seriesClipRect;
    const centerX: number = (chart as Chart).polarCenterX as number ?? (rect.x + rect.width / 2);
    const centerY: number = (chart as Chart).polarCenterY as number ?? (rect.y + rect.height / 2);
    const radiusMax: number = (rect.width < rect.height ? rect.width : rect.height) / 2;
    return { centerX, centerY, radiusMax };
}

/**
 * Returns the visible labels for an axis, or synthesizes labels from the visible range when none are present.
 *
 * @param {AxisModel} axis - The axis model to inspect.
 * @returns {VisibleLabel[]} The labels available for rendering.
 *
 * @private
 */
function fallbackVisibleLabels(axis: AxisModel): VisibleLabel[] {
    if (axis.visibleLabels && axis.visibleLabels.length) { return axis.visibleLabels as VisibleLabel[]; }
    const minimum: number = axis.visibleRange?.minimum;
    const maximum: number = axis.visibleRange?.maximum;
    const interval: number = axis.visibleRange.interval;
    const labels: VisibleLabel[] = [];
    for (let v: number = minimum; v <= maximum + 1e-9; v += interval) {
        labels.push({
            text: String(v),
            value: v,
            labelStyle: axis.labelStyle as ChartAxisLabelProps,
            size: { width: 0, height: 0 },
            breakLabelSize: { width: 0, height: 0 },
            index: 1,
            originalText: String(v)
        } as VisibleLabel);
    }
    return labels;
}

// -------------- Y-AXIS (RADIAL VALUES) --------------
/**
 * Renders the radial grid lines for the Y axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The Y axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for Y-axis grid lines.
 *
 * @private
 */
export function drawPolarYAxisGridLines(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const isPolarChart: boolean = String(chart.visibleSeries?.[0]?.type).indexOf('Polar') > -1;
    const xAxis: AxisModel | undefined = chart.axisCollection.find((axisItem: AxisModel) => axisItem.name === 'primaryXAxis');
    const startAngle: number = (xAxis?.startAngle as number) || 0;

    const elements: JSX.Element[] = [];
    const gridStrokeWidth: number = Math.max(1, (axis.majorGridLines.width as number));
    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const isYAxisInverted: boolean = (axis.isAxisInverse as boolean) || false;
    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        let radialCoefficient: number = valueToPolarCoefficient(visibleLabels[labelIndex as number].value, axis);
        // Apply inversion for Y-axis (radial)
        if (isYAxisInverted) {
            radialCoefficient = 1 - radialCoefficient;
        }
        const radius: number = radiusMax * radialCoefficient;
        if (isPolarChart) {
            elements.push(
                <circle
                    key={`y-major-grid-${labelIndex}`}
                    cx={centerX}
                    cy={centerY}
                    r={radius}
                    stroke={axis.majorGridLines.color || chart.themeStyle.polarRadarGridLine}
                    strokeWidth={gridStrokeWidth}
                    fill="transparent"
                    strokeDasharray={axis.majorGridLines.dashArray}
                />
            );
        } else {
            const baseLabels: VisibleLabel[] = (xAxis?.visibleLabels && xAxis.visibleLabels.length) ? xAxis.visibleLabels :
                fallbackVisibleLabels(xAxis as AxisModel );
            const totalCount: number = baseLabels.length;
            const pathPoints: string = baseLabels.map((_xLabel: VisibleLabel, pointIndex: number) => {
                const coefficient: number = totalCount > 0 ? pointIndex / totalCount : 0;
                const vector: ChartLocationProps = coefficientToVector(coefficient, startAngle);
                const x: number = centerX + radius * vector.x;
                const y: number = centerY + radius * vector.y;
                return `${pointIndex === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ') + ' Z';
            elements.push(
                <path
                    key={`y-major-grid-${labelIndex}`}
                    d={pathPoints}
                    stroke={axis.majorGridLines.color || chart.themeStyle.polarRadarGridLine}
                    strokeWidth={axis.majorGridLines.width as number}
                    fill="transparent"
                />
            );
        }
    }
    return (
        <g id={`${chart.element.id}_Axis_${index}_Major_Grid_Lines`}>
            {elements}
        </g>
    );
}

/**
 * Renders the radial tick lines for the Y axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The Y axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for Y-axis tick lines.
 *
 * @private
 */
export function drawPolarYAxisTickLines(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const xAxis: AxisModel | undefined = chart.axisCollection.find((axisItem: AxisModel) => axisItem.name === 'primaryXAxis');
    const startAngle: number = (xAxis?.startAngle as number) || 0;
    // Use index-based positioning for first spoke to align with grid spokes (OnTicks positioning)
    let baseCoefficient: number;
    if (xAxis?.valueType === 'Category') {
        // For category axes, first spoke is always at index 0
        baseCoefficient = 0;
    } else {
        // For numeric axes, use value-based positioning
        baseCoefficient = valueToPolarCoefficient(
            xAxis?.visibleLabels?.[0]?.value ?? xAxis?.visibleRange.minimum as number,
            xAxis as AxisModel
        );
    }
    const spokeVector: ChartLocationProps = coefficientToVector(baseCoefficient, startAngle);
    const theta: number = Math.atan2(spokeVector.y, spokeVector.x);
    const normalX: number = -Math.sin(theta);
    const normalY: number =  Math.cos(theta);

    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const tickHeight: number = Math.max(1, Number(axis.majorTickLines.height));
    const tickDirection: number = axis.tickPosition === 'Inside' ? 1 : -1;
    const isYAxisInverted: boolean = (axis.isAxisInverse as boolean) || false;

    const elements: JSX.Element[] = [];
    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        let radialCoefficient: number = valueToPolarCoefficient(visibleLabels[labelIndex as number].value, axis);
        // Apply inversion for Y-axis (radial)
        if (isYAxisInverted) {
            radialCoefficient = 1 - radialCoefficient;
        }
        const radius: number = radiusMax * radialCoefficient;
        const x1: number = centerX + radius * Math.cos(theta);
        const y1: number = centerY + radius * Math.sin(theta);
        const x2: number = x1 + tickDirection * tickHeight * normalX;
        const y2: number = y1 + tickDirection * tickHeight * normalY;

        elements.push(
            <line
                key={`y-major-tick-${labelIndex}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={axis.majorTickLines.color || chart.themeStyle.polarRadarTickLine}
                strokeWidth={axis.majorTickLines.width || 1}
            />
        );
    }

    return <g id={`${chart.element.id}_Axis_${index}_Major_Ticks`}>{elements}</g>;
}

/**
 * Renders the radial labels for the Y axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The Y axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for Y-axis labels.
 *
 * @private
 */
export function drawPolarYAxisLabels(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const xAxis: AxisModel | undefined = chart.axisCollection.find((axisItem: AxisModel) => axisItem.name === 'primaryXAxis');
    const startAngle: number = (xAxis?.startAngle as number) || 0;
    const angleRad: number = (startAngle < 0 ? startAngle + 360 : startAngle) * Math.PI / 180;
    // Use index-based positioning for first spoke to align with grid spokes
    let directionCoefficient: number;
    if (xAxis?.valueType === 'Category') {
        // For category axes, first spoke is always at index 0
        directionCoefficient = 0;
    } else {
        // For numeric axes, use value-based positioning
        directionCoefficient = valueToPolarCoefficient(axis.visibleLabels?.[0]?.value ?? axis.visibleRange.minimum, axis);
    }
    const directionVector: ChartLocationProps = coefficientToVector(directionCoefficient, startAngle);
    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const elements: JSX.Element[] = [];
    const labelPosition: number = axis.labelStyle.position === 'Inside' ? 1 : -1;
    const rtlFactor: number = chart.enableRtl ? -1 : 1;
    const positionFactor: number = labelPosition * rtlFactor;
    const padding: number = 5;
    const tickHeight: number = Math.max(0, Number(axis.majorTickLines.height));
    const isYAxisInverted: boolean = (axis.isAxisInverse as boolean) || false;
    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        const label: VisibleLabel = visibleLabels[labelIndex as number];
        let radialCoefficient: number = valueToCoefficient(label.value, axis);
        // Apply inversion for Y-axis (radial)
        if (isYAxisInverted) {
            radialCoefficient = 1 - radialCoefficient;
        }
        const radius: number = radiusMax * radialCoefficient;
        const textSize: ChartSizeProps = measureText(String(label.text), axis.labelStyle as TextStyleModel, chart.themeStyle.axisLabelFont);
        let px: number = centerX + radius * directionVector.x;
        let py: number = centerY + radius * directionVector.y;
        px += (tickHeight + textSize.width / 2 + padding / 2) * Math.cos(angleRad) * positionFactor;
        py += (tickHeight + textSize.height / 2) * Math.sin(angleRad) * positionFactor;

        py += textSize.height / 4;

        elements.push(
            <text
                key={`y-label-${labelIndex}`}
                x={px}
                y={py}
                textAnchor="middle"
                fill={axis.labelStyle?.color || chart.themeStyle.axisLabelFont.color}
                fontFamily={axis.labelStyle?.fontFamily || chart.themeStyle.axisLabelFont.fontFamily}
                fontSize={axis.labelStyle?.fontSize || chart.themeStyle.axisLabelFont.fontSize}
                fontStyle={axis.labelStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle}
                fontWeight={axis.labelStyle?.fontWeight || chart.themeStyle.axisLabelFont.fontWeight}
                dominantBaseline="central"
            >
                {String(label.text)}
            </text>
        );
    }

    return <g id={`${chart.element.id}_Axis_${index}_Labels`}>{elements}</g>;
}

/**
 * Renders the radial axis line for the Y axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The Y axis model.
 * @param {number} _index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element | null} The rendered axis line, or null when the line width is zero or less.
 *
 * @private
 */
export function drawPolarYAxisLine(axis: AxisModel, _index: number, chart: Chart): JSX.Element | null {
    if ((axis.lineStyle?.width as number) <= 0) { return null; }
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const xAxis: AxisModel | undefined = chart.axisCollection.find((axisItem: AxisModel) => axisItem.name === 'primaryXAxis');
    const startAngle: number = (xAxis?.startAngle as number) || 0;
    // Use index-based positioning for first spoke to align with grid spokes
    let axisLineCoefficient: number;
    if (xAxis?.valueType === 'Category') {
        // For category axes, first spoke is always at index 0
        axisLineCoefficient = 0;
    } else {
        // For numeric axes, use value-based positioning
        axisLineCoefficient = valueToPolarCoefficient(
            xAxis?.visibleLabels?.[0]?.value ?? xAxis?.visibleRange.minimum ?? 0, xAxis as AxisModel);
    }
    const directionVector: ChartLocationProps = coefficientToVector(axisLineCoefficient, startAngle);
    const x2: number = centerX + radiusMax * directionVector.x;
    const y2: number = centerY + radiusMax * directionVector.y;
    const pathData: string = `M ${centerX} ${centerY} L ${x2} ${y2}`;
    return (
        <path d={pathData}
            stroke={axis.lineStyle?.color || chart.themeStyle.axisLine}
            strokeWidth={axis.lineStyle?.width}
            strokeDasharray={axis.lineStyle?.dashArray || ''}
        />
    );
}

// -------------- X-AXIS (ANGLES) --------------
/**
 * Renders the angular grid lines for the X axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The X axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for X-axis grid lines.
 *
 * @private
 */
export function drawPolarXAxisGridLines(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const startAngle: number = (axis.startAngle as number) || 0;
    const elements: JSX.Element[] = [];
    const gridStrokeWidth: number = Math.max(1, (axis.majorGridLines.width as number) || 0);
    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const totalCount: number = visibleLabels.length;

    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        let coefficient: number;

        if (axis.valueType === 'Category' && totalCount > 0) {
            // Grid lines always at OnTicks for category axes (aligns with radar polygon and tick lines)
            coefficient = labelIndex / totalCount;
        } else {
            // For numeric axes
            const value: number = visibleLabels[labelIndex as number].value;
            coefficient = valueToPolarCoefficient(value, axis);
        }

        // Apply axis inversion if enabled (using the computed isAxisInverse property)
        const isInverted: boolean = (axis.isAxisInverse as boolean) || false;
        if (isInverted) {
            coefficient = 1 - coefficient;
        }

        const vector: ChartLocationProps = coefficientToVector(coefficient, startAngle);
        const x2: number = centerX + radiusMax * vector.x;
        const y2: number = centerY + radiusMax * vector.y;
        elements.push(
            <line
                key={`x-major-grid-${labelIndex}`}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke={axis.majorGridLines.color || chart.themeStyle.polarRadarGridLine}
                strokeWidth={gridStrokeWidth}
                strokeDasharray={axis.majorGridLines.dashArray}
            />
        );
    }
    return (
        <g id={`${chart.element.id}_Axis_${index}_Major_Grid_Lines`}>
            {elements}
        </g>
    );
}

/**
 * Renders the angular tick lines for the X axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The X axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for X-axis tick lines.
 *
 * @private
 */
export function drawPolarXAxisTickLines(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const startAngle: number = (axis.startAngle as number) || 0;
    const elements: JSX.Element[] = [];
    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const totalCount: number = visibleLabels.length;

    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        let coefficient: number;

        if (axis.valueType === 'Category' && totalCount > 0) {
            // Tick lines always at OnTicks for category axes (aligns with grid spokes and polygon)
            coefficient = labelIndex / totalCount;
        } else {
            // For numeric axes
            const value: number = visibleLabels[labelIndex as number].value;
            coefficient = valueToPolarCoefficient(value, axis);
        }

        // Apply axis inversion if enabled (using the computed isAxisInverse property)
        const isInverted: boolean = (axis.isAxisInverse as boolean) || false;
        if (isInverted) {
            coefficient = 1 - coefficient;
        }

        const vector: ChartLocationProps = coefficientToVector(coefficient, startAngle);
        const x1: number = centerX + radiusMax * vector.x;
        const y1: number = centerY + radiusMax * vector.y;
        const direction: number = axis.tickPosition === 'Inside' ? -1 : 1;
        const x2: number = x1 + direction * (axis.majorTickLines.height as number) * vector.x;
        const y2: number = y1 + direction * (axis.majorTickLines.height as number) * vector.y;
        elements.push(
            <line
                key={`x-major-tick-${labelIndex}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={axis.majorTickLines.color || chart.themeStyle.polarRadarTickLine}
                strokeWidth={axis.majorTickLines.width || 1}
            />
        );
    }
    return (
        <g id={`${chart.element.id}_Axis_${index}_Major_Ticks`}>
            {elements}
        </g>
    );
}

/**
 * Renders the angular labels for the X axis in polar or radar charts.
 *
 * @param {AxisModel} axis - The X axis model.
 * @param {number} index - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG group for X-axis labels.
 *
 * @private
 */
export function drawPolarXAxisLabels(axis: AxisModel, index: number, chart: Chart): JSX.Element {
    const { centerX, centerY, radiusMax } = getCenter(chart);
    const startAngle: number = (axis.startAngle as number) || 0;
    const tickOffset: number = (axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks') ? 0.5 : 0;
    const isInside: boolean = axis.labelStyle.position === 'Inside';
    const padding: number = 5;
    const elements: JSX.Element[] = [];
    const visibleLabels: VisibleLabel[] = fallbackVisibleLabels(axis);
    const isCategoryBetween: boolean = axis.valueType === 'Category' && axis.labelStyle.placement === 'BetweenTicks';
    const totalCount: number = visibleLabels.length;
    for (let labelIndex: number = 0; labelIndex < visibleLabels.length; labelIndex++) {
        const label: VisibleLabel = visibleLabels[labelIndex as number];
        if (labelIndex === visibleLabels.length - 1 && axis.valueType !== 'Category') {
            elements.push(<text key={`x-label-${labelIndex}`} x={0} y={0} fill="transparent" />);
            continue;
        }
        let coefficient: number;
        if (isCategoryBetween) {
            // BetweenTicks for category: offset by 0.5 (position between tick marks)
            if (totalCount > 0) {
                coefficient = (labelIndex + 0.5) / totalCount;
            } else {
                coefficient = (label.value + 0.5) / (visibleLabels.length || 1);
            }
        } else if (axis.valueType === 'Category' && totalCount > 0) {
            // OnTicks for category: distribute labels evenly around the circle (same as grid/tick lines)
            coefficient = labelIndex / totalCount;
        } else {
            const value: number = label.value + tickOffset;
            coefficient = valueToPolarCoefficient(value, axis);
        }

        // Apply axis inversion if enabled (using the computed isAxisInverse property)
        const isInverted: boolean = (axis.isAxisInverse as boolean) || false;
        if (isInverted) {
            coefficient = 1 - coefficient;
        }

        const vector: ChartLocationProps = coefficientToVector(coefficient, startAngle);
        const radiusOffset: number = (axis.majorTickLines.height as number) + padding;
        const px: number = centerX + (radiusMax + (isInside ? -radiusOffset : radiusOffset)) * vector.x;
        const py: number = centerY + (radiusMax + (isInside ? -radiusOffset : radiusOffset)) * vector.y;
        let anchor: 'start' | 'middle' | 'end' = 'middle';
        const middleThreshold: number = 0.15;
        if (Math.abs(vector.x) > middleThreshold) {
            anchor = (vector.x > 0) === isInside ? 'end' : 'start';
        }
        elements.push(
            <text
                key={`x-label-${labelIndex}`}
                x={px}
                y={py}
                textAnchor={anchor}
                fill={axis.labelStyle?.color || chart.themeStyle.axisLabelFont.color}
                fontFamily={axis.labelStyle?.fontFamily || chart.themeStyle.axisLabelFont.fontFamily}
                fontSize={axis.labelStyle?.fontSize || chart.themeStyle.axisLabelFont.fontSize}
                fontStyle={axis.labelStyle?.fontStyle || chart.themeStyle.axisLabelFont.fontStyle}
                fontWeight={axis.labelStyle?.fontWeight || chart.themeStyle.axisLabelFont.fontWeight}
                dominantBaseline="central"
            >
                {String(label.text)}
            </text>
        );
    }
    return <g id={`${chart.element.id}_Axis_${index}_Labels`}>{elements}</g>;
}

/**
 * Renders the complete vertical axis group for polar or radar charts.
 * Includes grid lines, tick lines, labels, and the axis line.
 *
 * @param {AxisModel} axis - The Y axis model.
 * @param {number} idx - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG fragment for the vertical axis group.
 *
 * @private
 */
export function renderPolarVerticalAxisGroup(
    axis: AxisModel,
    idx: number,
    chart: Chart
): JSX.Element {
    const clipId: string = `${chart.element.id}_Axis_${idx}_Clip`;
    const clipRect: Rect = chart.chartAxislayout.seriesClipRect;

    return (
        <>
            <defs>
                <clipPath id={clipId}>
                    <rect
                        x={clipRect.x}
                        y={clipRect.y}
                        width={clipRect.width}
                        height={clipRect.height}
                    />
                </clipPath>
            </defs>
            <g >
                {drawPolarYAxisGridLines(axis, idx, chart)}
                {drawPolarYAxisTickLines(axis, idx, chart)}
                {drawPolarYAxisLabels(axis, idx, chart)}
                {drawPolarYAxisLine(axis, idx, chart)}
            </g>
        </>
    );
}

/**
 * Renders the complete horizontal axis group for polar or radar charts.
 * Includes grid lines, tick lines, and labels.
 *
 * @param {AxisModel} axis - The X axis model.
 * @param {number} idx - The axis index used to build element ids.
 * @param {Chart} chart - The chart instance.
 * @returns {JSX.Element} The rendered SVG fragment for the horizontal axis group.
 *
 * @private
 */
export function renderPolarHorizontalAxisGroup(
    axis: AxisModel,
    idx: number,
    chart: Chart
): JSX.Element {
    const clipId: string = `${chart.element.id}_Axis_${idx}_Clip`;
    const clipRect: Rect = chart.chartAxislayout.seriesClipRect;

    return (
        <>
            <defs>
                <clipPath id={clipId}>
                    <rect
                        x={clipRect.x}
                        y={clipRect.y}
                        width={clipRect.width}
                        height={clipRect.height}
                    />
                </clipPath>
            </defs>
            <g>
                {drawPolarXAxisGridLines(axis, idx, chart)}
                {drawPolarXAxisTickLines(axis, idx, chart)}
                {drawPolarXAxisLabels(axis, idx, chart)}
            </g>
        </>
    );
}
