# Changelog

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
