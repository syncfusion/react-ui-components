# React Chart Component

The Chart component is designed to deliver high-performance, interactive data visualizations with a wide range of chart types and customization options.

## Key features

- **High performance.** Renders large data sets with smooth interaction and fast updates, so it suits live dashboards and streaming data.
- **50 Cartesian series types.** Line, spline, step, area, range, stacking, column, bar, scatter, bubble, financial, waterfall, histogram, Pareto, box-and-whisker, multi-colored, polar, and radar series. See [Supported chart types](#supported-chart-types).
- **Pie and donut charts.** A separate `PieChart` component with:
  - smart data labels, grouping of small slices, and exploded slices
  - start and end angles
  - a donut center label that updates on hover
- **Flexible axes.**
  - Numeric (`Double`), `DateTime`, `Logarithmic`, and `Category` axes.
  - Multiple named axes, multiple panes (rows and columns), and multi-level labels.
  - Strip lines, inversed and opposed axes, and axis crossing.
- **Rich interactivity.**
  - Tooltips (shared or per point, with templates), crosshair with axis tooltips, and point and series highlight.
  - Selection with fill patterns and clickable legends.
  - Zooming by selection, mouse wheel, or pinch, plus panning, a zoom toolbar, and scrollbars.
- **Chart elements.**
  - Data labels, markers, and annotations.
  - Trendlines, error bars, and series labels.
  - Last-value labels, stack labels, and 10 technical indicators.
- **Styling.**
  - Built-in Material, Tailwind, and Bootstrap themes, each with a dark variant.
  - Custom palettes and linear or radial gradient fills.
  - Range color mapping with range and gradient legends.
- **Animation.** Configurable series animation (`enable`, `duration`, `delay`) for clearer data storytelling.
- **Accessibility.** Keyboard navigation, ARIA roles and labels, configurable focus outlines, selection patterns that do not rely on color, and right-to-left (RTL) support through the `@syncfusion/react-base` `Provider`.
- **Globalization.** Locale-aware number and date formatting.
- **Export and print.**
  - One `exportChart` call exports images (SVG, PNG, JPG), PDF, or the chart **data** as Excel (XLSX) or CSV.
  - `print` opens the browser print dialog.

## Installation

Install the package with npm:

```sh
npm install @syncfusion/react-charts
```

The package's dependencies are installed automatically: `@syncfusion/react-base` (shared styles and licensing), `@syncfusion/react-data` (`DataManager` for remote data), and the PDF and Excel export libraries.

Import the theme stylesheet once, for example in `main.tsx` or `App.tsx`:

```tsx
import "@syncfusion/react-base/styles/material.css";
```

## Quick start

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-quick-start.png">
</p>

```tsx
import {
  Chart,
  ChartAxisTitle,
  ChartLegend,
  ChartMarker,
  ChartPrimaryXAxis,
  ChartPrimaryYAxis,
  ChartSeries,
  ChartSeriesCollection,
  ChartTitle,
  ChartTooltip,
} from "@syncfusion/react-charts";
import "@syncfusion/react-base/styles/material.css";

const categoryData = [
  { month: "Jan", sales: 35 }, { month: "Feb", sales: 28 }, { month: "Mar", sales: 34 },
  { month: "Apr", sales: 32 }, { month: "May", sales: 40 }, { month: "Jun", sales: 32 },
  { month: "Jul", sales: 35 }, { month: "Aug", sales: 55 }, { month: "Sep", sales: 38 },
  { month: "Oct", sales: 30 }, { month: "Nov", sales: 25 }, { month: "Dec", sales: 32 },
];

export default function App() {
  return (
    <Chart width="100%" height="420px">
      <ChartTitle text="Monthly Sales Analysis" />
      <ChartPrimaryXAxis valueType="Category" />
      <ChartPrimaryYAxis minimum={0} maximum={60} interval={10}>
        <ChartAxisTitle text="Sales (in thousands)" />
      </ChartPrimaryYAxis>
      <ChartTooltip enable={true} />
      <ChartLegend visible={true} />
      <ChartSeriesCollection>
        <ChartSeries
          dataSource={categoryData}
          xField="month"
          yField="sales"
          type="Line"
          name="Sales"
        >
          <ChartMarker visible={true} />
        </ChartSeries>
      </ChartSeriesCollection>
    </Chart>
  );
}
```

To change the visualization, change the series `type`, for example to `"Column"`, `"Spline"`, `"Area"`, or `"StepLine"`. Bind data with `dataSource` and map the fields with `xField` and `yField`. Some types need extra fields: `sizeField` for bubbles, `high`/`low` for ranges, and `open`/`high`/`low`/`close` for financial series.

## Supported chart types

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-types.png">
</p>

| Family | Series `type` values |
| --- | --- |
| Line | `Line`, `Spline`, `StepLine`, `StackingLine`, `StackingLine100`, `MultiColoredLine` |
| Area | `Area`, `SplineArea`, `StepArea`, `StackingArea`, `StackingArea100`, `StackingStepArea`, `MultiColoredArea` |
| Range | `RangeArea`, `SplineRangeArea`, `RangeStepArea`, `RangeColumn` |
| Column and bar | `Column`, `Bar`, `StackingColumn`, `StackingColumn100`, `StackingBar`, `StackingBar100` |
| Scatter and bubble | `Scatter`, `Bubble` |
| Financial | `Candle`, `Hilo`, `HiloOpenClose` |
| Statistical | `Histogram`, `Pareto`, `BoxAndWhisker`, `Waterfall` |
| Polar | `PolarLine`, `PolarSpline`, `PolarArea`, `PolarSplineArea`, `PolarStackingArea`, `PolarColumn`, `PolarStackingColumn`, `PolarRangeColumn`, `PolarScatter` |
| Radar | `RadarLine`, `RadarSpline`, `RadarArea`, `RadarSplineArea`, `RadarStackingArea`, `RadarColumn`, `RadarStackingColumn`, `RadarRangeColumn`, `RadarScatter` |
| Pie and donut | `PieChart` with `PieChartSeries`; set `innerRadius` (for example `"60%"`) for a donut |

Combine several series in one `ChartSeriesCollection` to build combination charts, such as columns with a line overlay.

## Pie and donut charts

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-pie-donut.png">
</p>


```tsx
import {
  PieChart,
  PieChartCenterLabel,
  PieChartDataLabel,
  PieChartLegend,
  PieChartSeries,
  PieChartSeriesCollection,
  PieChartTooltip,
} from "@syncfusion/react-charts";

const browserData = [
  { browser: "Chrome", share: 64 },
  { browser: "Safari", share: 19 },
  { browser: "Edge", share: 5 },
  { browser: "Firefox", share: 3 },
  { browser: "Other", share: 9 },
];

export function BrowserShare() {
  return (
    <PieChart>
      <PieChartLegend visible={true} position="Bottom" />
      <PieChartTooltip enable={true} format="${point.x}: ${point.y}%" />
      <PieChartCenterLabel
        label={[{ text: "Browsers" }, { text: "2026", textStyle: { fontSize: "24px", fontWeight: "600" } }]}
        hoverTextFormat="${point.x}<br>${point.y}%"
      />
      <PieChartSeriesCollection>
        <PieChartSeries dataSource={browserData} xField="browser" yField="share" innerRadius="62%">
          <PieChartDataLabel visible={true} position="Outside" />
        </PieChartSeries>
      </PieChartSeriesCollection>
    </PieChart>
  );
}
```

Remove `innerRadius` (or set it to `"0%"`) for a classic pie. `PieChartSelection`, `PieChartHighlight`, and `PieChartAnnotationCollection` add click selection, hover emphasis, and annotations.

## Interactivity

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-interactivity.png">
</p>


```tsx
<Chart>
  <ChartPrimaryXAxis valueType="Category" />
  <ChartTooltip enable={true} shared={true} />
  <ChartCrosshair enable={true} lineType="Both" />
  <ChartZoomSettings
    selectionZoom={true}
    mouseWheelZoom={true}
    pinchZoom={true}
    pan={true}
    mode="X"
    toolbar={{ visible: true, items: ["ZoomIn", "ZoomOut", "Pan", "Reset"] }}
  />
  <ChartLegend visible={true} toggleVisibility={true} />
  <ChartSeriesCollection>
    <ChartSeries dataSource={weather} xField="month" yField="newYork" type="Spline" name="New York" />
    <ChartSeries dataSource={weather} xField="month" yField="london" type="Spline" name="London" />
  </ChartSeriesCollection>
</Chart>
```

Here `weather` is an array of `{ month, newYork, london }` records.

Handle user actions with the root event props. These include:

- `onPointClick` and `onLegendClick`
- `onAxisLabelClick` and `onMultiLevelLabelClick`
- `onZoomStart` and `onZoomEnd`
- `onMouseMove` and `onResize`

`pointRender` customizes the color of each point.

## Axes and panes

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-multiple-panes.png">
</p>

```tsx
<Chart>
  <ChartRows>
    <ChartRow height="70%" />
    <ChartRow height="30%" />
  </ChartRows>
  <ChartPrimaryXAxis valueType="Category">
    <ChartMultiLevelLabels>
      <ChartMultiLevelLabel
        border={{ width: 1, color: "#B5B5B5" }}
        categories={[
          { start: -0.5, end: 3.5, text: "Week 1" },
          { start: 3.5, end: 7.5, text: "Week 2" },
        ]}
      />
    </ChartMultiLevelLabels>
  </ChartPrimaryXAxis>
  <ChartPrimaryYAxis rowIndex={0} />
  <ChartAxes>
    <ChartAxis name="volumeAxis" rowIndex={1} />
  </ChartAxes>
  <ChartSeriesCollection>
    <ChartSeries dataSource={stock} xField="day" yField="price" type="SplineArea" name="Price" />
    <ChartSeries dataSource={stock} xField="day" yField="volume" type="Column" name="Volume" yAxisName="volumeAxis" />
  </ChartSeriesCollection>
</Chart>
```

Here `stock` is an array of `{ day, price, volume }` records.

The following components and props control axes and panes:

- `ChartAxes` with named `ChartAxis` children adds axes, which series reach through `xAxisName` and `yAxisName`.
- `ChartRows` and `ChartColumns` split the plot area into panes.
- `ChartStripLines` highlights ranges or thresholds.
- `ChartAxisLabel` controls label format, rotation, wrapping, trimming, and overlap handling (`intersectAction`).

## Styling, color mapping, and export

<p align="center">
<img alt="React Chart Control" src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/react/pure-react-chart-range-colors-export.png">
</p>


```tsx
import { useRef } from "react";
import {
  Chart,
  ChartLegend,
  ChartPrimaryXAxis,
  ChartRangeColor,
  ChartRangeColorCollection,
  ChartSeries,
  ChartSeriesCollection,
  exportChart,
} from "@syncfusion/react-charts";
import type { IChart } from "@syncfusion/react-charts";

export function TemperatureChart({ data }: { data: { month: string; temp: number }[] }) {
  const chartRef = useRef<IChart | null>(null);

  return (
    <>
      <button type="button" onClick={() => chartRef.current && exportChart(chartRef.current, "PNG", "temperature")}>
        Download PNG
      </button>
      <button type="button" onClick={() => chartRef.current && exportChart(chartRef.current, "XLSX", "temperature")}>
        Download data
      </button>

      <Chart ref={chartRef} theme="Material">
        <ChartPrimaryXAxis valueType="Category" />
        <ChartRangeColorCollection>
          <ChartRangeColor start={0} end={10} fill="#3B82F6" label="Cold (0–10 °C)" />
          <ChartRangeColor start={11} end={20} fill="#F59E0B" label="Mild (11–20 °C)" />
          <ChartRangeColor start={21} end={40} fill="#DC2626" label="Hot (21–40 °C)" />
        </ChartRangeColorCollection>
        <ChartLegend visible={true} mode="Range" />
        <ChartSeriesCollection>
          <ChartSeries dataSource={data} xField="month" yField="temp" type="Column" name="Temperature" />
        </ChartSeriesCollection>
      </Chart>
    </>
  );
}
```

Ways to change the look:

- **Themes.** Set `theme` on `Chart` or `PieChart` to `Material`, `MaterialDark`, `Tailwind`, `TailwindDark`, `Bootstrap`, or `BootstrapDark`.
- **Colors.** Pass a custom `palettes` array, or give a series a `ChartLinearGradient` or `ChartRadialGradient` child for a gradient fill.
- **Export formats.** `exportChart` accepts `SVG`, `PNG`, `JPG`, `PDF`, `XLSX`, and `CSV`, for both `Chart` and `PieChart`.

## Accessibility

Charts are keyboard-navigable and expose ARIA roles and labels. You can configure accessibility on several elements:

- **`accessibility` prop:** set `ariaLabel`, `role`, `focusable`, and `tabIndex` on the chart, series, titles, legend, annotations, and zoom toolbar.
- **Focus outline:** customize it with `focusOutline`.
- **Non-color cues:** add marker shapes, dash patterns, and selection patterns so the chart does not rely on color alone.

**Resources**

- [Chart Demo/Docs](https://react.syncfusion.com/react-ui/charts/overview/?theme=material)
- [Chart API](https://react.syncfusion.com/api/chart/overview/)

<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted-companies.webp" alt="Syncfusion logo">
  </a>
</p>

## Support

Product support is available through following mediums.

* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat

## Changelog
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/charts/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

© Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.