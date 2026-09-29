import { DataManager } from '@syncfusion/react-data';
import type { MutableRefObject } from 'react';
import { createContext } from 'react';
import { ConnectorType } from './enum';

/**
 * React context carrying a mutable ref whose `.current` is the live
 * `ExportSource` snapshot published by the post-process layout commit.
 *
 * Updated by the renderer at effect time only; read by `excelExport`
 * through the imperative handle on the root Chart / PieChart element.
 *
 * The default value is `null` so renderers without a provider can
 * detect the absence and silently skip the snapshot write.
 *
 * @private
 */
export const ExportSourceContext: React.Context<MutableRefObject<ExportSource | undefined> | null> =
    createContext<MutableRefObject<ExportSource | undefined> | null>(null);

/**
 * Defines the appearance of the focus outline for interactive UI elements.
 */
export interface FocusOutlineProps {

    /**
     * Customizes the focus border color.
     * If not specified, the default focus border color is used.
     *
     * @default ''
     */
    color?: string;

    /**
     * Customizes the focus border width.
     * If not specified, the default width is used.
     *
     * @default 1.5
     */
    width?: number;

    /**
     * Customizes the focus border margin.
     * If not specified, the default margin is used.
     *
     * @default 0
     */
    offset?: number;
}

/**
 * Defines animation settings for chart series in a React component.
 */
export interface Animation {

    /**
     * When set to `false`, animation is disabled during the initial rendering of the chart series.
     *
     * @default true
     */
    enable?: boolean;

    /**
     * Duration of the animation in milliseconds.
     * Controls how long the animation effect lasts.
     *
     * @default 1000
     */
    duration?: number;

    /**
     * Delay before the animation starts, in milliseconds.
     * Useful for sequencing animations or staggering effects.
     *
     * @default 0
     */
    delay?: number;
}

/**
 * Represents configuration options for connector lines in the chart.
 */
export interface ConnectorProps {

    /**
     * Specifies the type of connector line used in the chart.
     * The available options are:
     * - `Curve`: Renders a smooth curved connector line.
     * - `Line`: Renders a straight connector line.
     *
     * @default 'Curve'
     */
    type?: ConnectorType;

    /**
     * Specifies the color of the connector line.
     * Accepts any valid CSS color string (e.g., hex, rgba).
     *
     * @default ''
     */
    color?: string;

    /**
     * Specifies the width of the connector line in pixels.
     *
     * @default 1
     */
    width?: number;

    /**
     * Specifies the length of the connector line.
     * Accepts CSS length values such as pixel values (e.g., `'100px'`) or percentage values (e.g., `'50%'`).
     *
     * @default ''
     */
    length?: string;

    /**
     * Specifies the dash pattern of the connector line.
     *
     * @default ''
     */
    dashArray?: string;
}

/**
 * Identifies the registered Chart implementation.
 *
 * @private
 */
export type LiveChartKind =
    | 'chart'
    | 'piechart';

/**
 * Scalar value supported by the Chart data pipeline.
 *
 * @private
 */
export type ChartDataScalar =
    | string
    | number
    | boolean
    | Date
    | bigint
    | null
    | undefined;

/**
 * Runtime value supported by Chart points and data records.
 *
 * Arrays support specialized series values such as
 * BoxAndWhisker outliers.
 *
 * @private
 */
export type ChartDataValue =
    | ChartDataScalar
    | ChartDataScalar[];

/**
 * Dynamically indexed Chart data record.
 *
 * Field names are determined at runtime through xField,
 * yField, and sizeField.
 *
 * @private
 */
export type ChartDataRecord =
    Record<string, ChartDataValue>;

/**
 * Structural subset of a Chart point required by the
 * spreadsheet export pipeline.
 *
 * Specialized series expose additional values through
 * runtime keys such as high, low, open, close, maximum,
 * minimum, median, outliers, and size.
 *
 * @private
 */
export interface LivePointLike {
    index?: number;
    x?: ChartDataValue;
    y?: ChartDataValue;
    xValue?: ChartDataValue;
    yValue?: ChartDataValue;
    visible?: boolean;

    [key: string]:
    | ChartDataValue
    | boolean;
}

/**
 * Structural subset of a visible Chart series required by
 * spreadsheet export.
 *
 * @private
 */
export interface LiveSeriesLike {
    name?: string;
    visible?: boolean;
    type?: string;
    drawType?: string;
    category?: string;

    xField?: string;
    yField?: string;
    sizeField?: string;

    dataSource?:
    | ChartDataRecord[]
    | DataManager
    | null;

    currentViewData?:
    | ChartDataRecord[]
    | null;

    points?: LivePointLike[];
}

/**
 * Structural Chart view required by spreadsheet export.
 *
 * @private
 */
export interface LiveChartLike {
    visibleSeries: LiveSeriesLike[];
}

/**
 * Snapshot published by Chart and PieChart after the
 * post-process layout commit.
 *
 * The renderer is the sole writer. Callers such as
 * `excelExport` read it through the imperative handle on the
 * root component (`IChart.getExportSource()` /
 * `IPieChart.getExportSource()`) rather than through a registry.
 *
 * @private
 */
export interface ExportSource {
    kind: LiveChartKind;
    visibleSeries: LiveSeriesLike[];
    title?: string;
}

/**
 * Normalized cell value supported by the spreadsheet writers.
 *
 * Moved from `enum.tsx` so the spreadsheet data shape lives next
 * to the renderer-facing types it describes.
 *
 * @private
 */
export type ExportCellValue =
    | string
    | number
    | null;

/**
 * Describes a group of value columns belonging to one series.
 *
 * Used by XLSX to merge a series name across specialized value
 * columns such as high and low.
 *
 * Moved from `enum.tsx` so the spreadsheet data shape lives next
 * to the renderer-facing types it describes.
 *
 * @private
 */
export interface ExportHeaderGroup {
    /**
     * Series name displayed in the grouped header.
     */
    title: string;

    /**
     * Zero-based index of the first column in this group.
     *
     * The category column uses index 0, so the first series
     * normally starts at index 1.
     */
    startColumn: number;

    /**
     * Number of value columns covered by this group.
     */
    columnSpan: number;
}

/**
 * Normalized representation of Chart data used by the spreadsheet exporters.
 *
 * Moved from `enum.tsx` so the spreadsheet data shape lives next
 * to the renderer-facing types it describes.
 *
 * @private
 */
export interface ResolvedExportData {
    /**
     * User-supplied Chart or PieChart title.
     * XLSX emits this as the first worksheet row.
     */
    title?: string;

    /**
     * Header row used by XLSX and CSV outputs.
     *
     * When headerGroups is present, these values represent the
     * second XLSX header row, such as high and low.
     */
    headers: string[];

    /**
     * Optional XLSX grouped-header metadata.
     *
     * Each entry describes a series name that spans one or more
     * value columns. CSV continues to use the flat headers array.
     */
    headerGroups?: ExportHeaderGroup[];

    /**
     * Aligned data rows.
     */
    rows: ExportCellValue[][];

    /**
     * Number of visible series that contributed columns.
     */
    seriesCount: number;
}
