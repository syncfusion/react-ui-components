# React Chart Component

The Chart component is designed to deliver high-performance, interactive data visualizations with a wide range of chart types and customization options.

**Key features**

- **High Performance:** Optimized to render large datasets with minimal lag, ensuring smooth interactions and fast updates.

- **Comprehensive Chart Types:** Supports a wide range of chart types including Line, Column, Area, Bar, StackingColumn, StackingBar, StepLine, SplineArea, Scatter, Spline, and Bubble.

- **Flexible Axis Support:** Offers multiple axis types—numeric, datetime, logarithmic, and categorical—for diverse data plotting.

- **Rich Interactivity:** Includes tooltips, zooming, panning, clickable legends, and smooth animations to enhance user engagement.

- **Animation Support:** Delivers visually appealing transitions and effects that improve data storytelling and user experience.

- **Accessibility & Navigation:** Provides keyboard navigation and screen reader support for inclusive user experiences.

- **Customization Options:** Allows developers to tailor data points, series styles, and UI behaviors to meet specific application needs.

**Setup**

To install `@syncfusion/react-charts` and its dependent packages, use the following command:

```sh
npm install @syncfusion/react-charts
```

**Usage**

```tsx
import { Chart, ChartPrimaryXAxis, ChartSeries, ChartSeriesCollection } from '@syncfusion/react-charts';

export default function App() {
  return (
    <Chart>
      <ChartPrimaryXAxis valueType='Category' />
      <ChartSeriesCollection >
         <ChartSeries dataSource={categoryData} xField="x" yField="y" type="Line" />
      </ChartSeriesCollection >
    </Chart> 
  );
};
```

**Resources**

- [Chart Demo/Docs](https://react.syncfusion.com/react-ui/charts/overview)
- [Chart API](https://react.syncfusion.com/api/chart/overview)

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
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/chart/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

© Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
