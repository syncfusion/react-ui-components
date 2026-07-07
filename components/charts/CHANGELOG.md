# Changelog

## 34.1.29 (2026-07-06)

### Chart

#### Features

- **Stacked and 100% Stacked Line:** Introduces stacked and 100% stacked line series for visualizing cumulative values across categories, with configurable stacking groups and percentage normalization. View [Stacked and 100% Stacked Line ](https://react.syncfusion.com/react-ui/charts/line-charts/line-chart/?theme=material#stacked-line)demo.

- **Range and Stacked Step Area:** Introduces range step area and stacked step area series for visualizing step-wise data transitions with support for stacking and range-based rendering. View [Range and Stacked Step Area ](https://react.syncfusion.com/react-ui/charts/area-charts/range-area-chart/?theme=material#range-step-area)demo.

- **Box and Whisker :** Introduces the Box and Whisker (box plot) series for visualizing data distribution, including minimum, maximum, median, quartiles, and outliers. View [Box and Whisker ](https://react.syncfusion.com/react-ui/charts/box-and-whisker-chart/?theme=material)demo.

- **Cylindrical Column and Bar support:** Provides cylindrical rendering for column and bar series to enhance visual appearance with 3D-like styling. View [Cylindrical Column and Bar ](https://react.syncfusion.com/react-ui/charts/column-and-bar-charts/column-chart/?theme=material#cylindrical-column)demo.

- **Polar and Radar Series:** Introduces Polar and Radar chart types for visualizing multivariate data in a circular layout. View [Polar and Radar Series ](https://react.syncfusion.com/react-ui/charts/polar-and-radar-charts/polar/?theme=material)demo.

- **Technical Indicators:** Built-in financial indicators such as ATR, RSI, MACD, Bollinger Bands, SMA, EMA, and Stochastic are now available to support advanced analysis, trend evaluation, and technical insights. View [Technical Indicators ](https://react.syncfusion.com/react-ui/charts/chart-elements/indicators/?theme=material)demo.

- **Scrollbars:** Enables efficient navigation of large datasets through integrated scrollbars, ensuring smooth interaction and seamless coordination with zooming behavior. View[ Scrollbars ](https://react.syncfusion.com/react-ui/charts/interactivity/zooming-and-panning/?theme=material#scrollbar)demo.

- **Series Labels:** Supports displaying series-level labels directly within the chart area, improving readability and clear identification of multiple data series. View [Series Labels ](https://npmci-react.syncfusion.com/development-react-ui/charts/chart-elements/series-label/?theme=material)demo,

- **Last Value Labels:** Displays the last data point value for each series, with customizable formatting for improved clarity and data insight. View [Last Value Labels ](https://react.syncfusion.com/react-ui/charts/chart-elements/last-value-label/?theme=material)demo.

- **No Data Template Support:** Introduces customizable templates to display informative UI when no data is available. View [No Data Template ](https://npmci-react.syncfusion.com/react-ui/charts/layout-and-styling/?theme=material#no-data-template)demo.

- **Range Color Mapping:** Applies color variations based on value ranges or conditions to improve visual clarity and highlight patterns. View [Range Color Mapping ](https://react.syncfusion.com/react-ui/charts/layout-and-styling/?theme=material#range-color-mapping)demo.

- **Multi-level Labels:** Supports rendering hierarchical axis labels across multiple levels, improving readability and grouping of categorized data. View [Multi-level Labels ](https://react.syncfusion.com/react-ui/charts/axis-configuration/axis-labels/?theme=material#multilevel-labels)demo.

### Pie Chart

#### Features

- **Annotation:** Adds support for placing custom annotations such as text, images, or HTML elements at specific positions within pie and donut charts. View  [Annotation ](https://npmci-react.syncfusion.com/react-ui/charts/pie-charts/pie/?theme=material#pie-annotation)demo.

## 33.1.44 (2026-03-16)

### Chart

#### Features

- **Waterfall**: Introduces the Waterfall series for visualizing the cumulative effect of sequential positive and negative values on a running total. Supports automatic cumulative calculations, start/end totals, intermediate subtotals, and customizable rise, fall, and total segment colors. Includes styling options for connector lines, column width, borders, and data labels, and integrates fully with legend, tooltip, zooming, and panning interactions.

- **Histogram**: Adds the Histogram series for displaying the distribution of continuous numeric data by grouping values into bins. Supports automatic or manually defined bin widths, frequency or density modes, configurable bin boundaries, and full styling for gaps, borders, and fills. Compatible with numeric and datetime axes, and includes tooltip, crosshair/trackball, and animated transitions.

- **Multi‑colored Area**: Introduces the Multi‑colored Area series for rendering area charts where the fill or stroke color changes across defined ranges or conditions.

- **Pareto**: Adds the Pareto chart type, combining a column series with a cumulative‑percentage line to emphasize the most significant contributors based on the 80/20 principle. Automatically sorts categories in descending order, computes cumulative percentages, and renders the percentage line on a secondary axis. Supports reference lines (such as the 80% threshold) using striplines and offers independent styling for columns and lines with shared tooltips.

- **Trendlines**: Introduces built‑in Trendline support for analyzing data direction and forecasting patterns. Supports common trendline types such as Linear, Exponential, Polynomial, Logarithmic, and Power. Each trendline can be styled independently with customizable stroke, dash patterns, markers, and forward/backward forecast options. Fully integrated with legend, tooltip, and animation support.

### Pie Chart

#### Features

- **Highlight & Selection**: Adds highlight and selection interaction for Pie and Donut charts, enabling segment emphasis on hover or click. Supports point‑level selection with customizable fill, border, opacity, and pattern styles. Offers both single and multiple selection modes for enhanced user interaction and data exploration.

## 32.1.19 (2025-12-16)

### Chart

#### Features

- **Annotation**: Place any HTML element such as text, images, markers, or fully templated content at any data point or anywhere in the chart area.

- **Error Bar**: Visualize data variability and measurement uncertainty with fully customizable error margins. Supports percentage, standard deviation, or user-defined values for both positive and negative directions.

- **Highlight & Selection**: Emphasize or select data using Point, Series, and Cluster modes with customizable colors, opacity, and pattern styles.

- **Crosshair & Crosshair Tooltip**: Provides interactive reference lines that follow the cursor, along with axis-aligned tooltips for precise data inspection. This feature helps users accurately identify data points across multiple axes, improving readability and analysis in complex charts.

- **Cross Axis (crossAt) Support**: Position an axis at any custom value of another axis to create intersecting axes layouts.

- **Series**: Provides more than 10 series types, including financial, range, stacked, and multi-colored line series, with enhanced customization and support for advanced data visualization.

#### Breaking Changes

- The chart theme names have changed: `Material3` has been renamed to `Material`, and `Material3Dark` has been renamed to `MaterialDark`.

### Pie Chart

`The Pie Chart component` represents data as proportional slices of a circle, making it ideal for visualizing part-to-whole relationships. Each slice corresponds to a data point, with its size determined by its value relative to the total. Built using `Scalable Vector Graphics (SVG)`, it ensures crisp rendering and smooth animations across devices. The component offers extensive customization options, including slice colors, labels, legends, and interactive features such as tooltips, selection, and explode-on-click. Designed for modern React applications, it is perfect for dashboards and reports where clarity and aesthetics are essential.

**Key features**

- **Pie and Donut Variants:** Supports full pie, semi-pie, and donut charts for flexible data visualization.

- **Legend:** Displays legends to provide additional context for slices, with support for paging and customization.

- **Data Labels:** Supports inside or outside positioning with smart collision avoidance and connector lines, enabling clear annotation and highlighting of data points.

- **Rich Interactivity:** Includes tooltips, clickable legends, and smooth animations to enhance user engagement.

- **Animation Support:** Delivers visually appealing transitions and effects that improve data storytelling.

- **Accessibility & Navigation:** Provides keyboard navigation and screen reader support for inclusive experiences.

- **Customization Options:** Fine-grained control over slice colors, stroke, inner radius, start/end angles, and explode behavior for tailored chart designs.

## 31.2.12 (2025-11-18)

### Chart

#### Bug Fixes

- The zoom toolkit buttons are now functioning correctly based on the zoom in and zoom out actions.
- The shared tooltip with a fixed location is working as expected.

## 31.1.20 (2025-9-17)

### Chart

#### Bug Fixes

- The shared tooltip for the bar series now displays data from all series in the chart.

## 31.1.17 (2025-09-05)

### Chart

`The Chart component` is used to visualize data with interactivity and offers extensive customization options for configuring data presentation. All chart elements are rendered using `Scalable Vector Graphics (SVG)`, ensuring crisp visuals and smooth performance across devices. Designed for modern React applications, it supports a wide range of chart types and interactive features, making it suitable for dynamic dashboards and data-driven interfaces.

**Key features**

- **High Performance:** Optimized to render large datasets with minimal lag, enabling smooth interactions and fast updates.

- **Comprehensive Chart Types:** Supports 10 essential chart types including line, bar, area, spline, and scatter charts.

- **Flexible Axis Support:** Offers multiple axis types—numeric, datetime, logarithmic, and categorical—for diverse data plotting needs.

- **Axis Features:** Supports multiple axes, inverted axis, multiple panes, opposed position, strip lines, and smart labels for enhanced layout control.

- **Data Labels and Markers:** Supports data labels and markers to annotate and highlight specific data points for better clarity.

- **Legend:** Displays legends to provide additional context for chart series, with support for paging and customization.

- **Rich Interactivity:** Includes tooltips, zooming, panning, clickable legends, and smooth animations to enhance engagement.

- **Animation Support:** Delivers visually appealing transitions and effects that improve data storytelling.

- **Accessibility & Navigation:** Provides keyboard navigation and screen reader support for inclusive experiences.

- **Customization Options:** Enables configuration of data points, series styles, and UI behaviors to match specific visualization requirements.
