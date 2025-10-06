# Syncfusion React Data Grid Component

The **Syncfusion React Data Grid** is a high-performance, feature-rich component designed for building scalable, responsive, and data-intensive web applications. Engineered to meet the requirements of enterprise-grade solutions, it provides a robust architecture that supports dynamic data handling, seamless integration with modern react frameworks, and a highly customizable interface.

Ideal for react applications requiring structured data presentation, real-time interaction, and flexible configuration, the grid supports essential functionalities such as sorting, filtering, paging, and editing. Extensibility is achieved through custom templates and a comprehensive API surface, enabling integration with complex business logic and external systems.

**Key Features**

- **[Sorting](https://react.syncfusion.com/data-grid/sorting):**
  Enables column-based sorting with support for single and multi-column configurations. Sorting operations are optimized for performance and consistency, allowing structured data to be organized efficiently across large datasets.

- **[Filtering](https://react.syncfusion.com/data-grid/filtering/configuration):**
  Provides a built-in filter bar with customizable filter types per column. Supports text, number, date, and dropdown filters, enabling precise data segmentation and contextual filtering based on business logic.

- **[Editing](https://react.syncfusion.com/data-grid/editing/configuration):**
  Facilitates inline CRUD operations including add, edit, and delete actions. Editing is integrated with toolbar controls and supports validation, making it suitable for transactional data entry and real-time updates.

- **[Toolbar](https://react.syncfusion.com/data-grid/editing/configuration#adding-a-toolbar-for-editing):**
  Offers a configurable toolbar with built-in actions such as Add, Edit, Delete, and Search. Toolbar elements can be extended or replaced with custom components to align with specific operational workflows.

- **[Searching](https://react.syncfusion.com/data-grid/searching):**
  Includes a responsive search box within the toolbar for quick data lookup. Supports keyword-based filtering across multiple columns, improving accessibility to relevant records in large datasets.

- **[Paging](https://react.syncfusion.com/data-grid/paging):**
  Manages large volumes of data using built-in pagination. Supports both client-side and server-side paging strategies to ensure scalable performance and efficient data navigation in distributed environments.

- **[Customization](https://react.syncfusion.com/data-grid/columns/cell-customization):**
  Allows custom cell rendering, conditional styling, and layout adjustments. Enables integration with design systems and branding guidelines, supporting tailored visual experiences and functional enhancements.

- **[Template Extensibility](https://react.syncfusion.com/data-grid/columns/templates):**
  Supports column and row templates for embedding custom components, applying conditional formatting, and creating rich, interactive visual layouts. Template logic can be used to integrate charts, buttons, or nested views within grid cells.

- **[Aggregates](https://react.syncfusion.com/data-grid/aggregates):**
  Displays summary values such as totals, averages, minimums, and maximums using built-in aggregate functions. Aggregation logic can be customized to support analytical dashboards and reporting interfaces.

- **[Interactivity](https://react.syncfusion.com/data-grid/accessibility#keyboard-shortcuts):**
  Supports clickable headers, row selection, and keyboard navigation. Enhances engagement through responsive UI behavior and intuitive controls, suitable for complex data exploration scenarios.

- **[Accessibility](https://react.syncfusion.com/data-grid/accessibility):**
  Compliant with WCAG 2.1 standards, ensuring compatibility with screen readers, keyboard navigation, and assistive technologies. Designed to meet accessibility requirements for public sector and regulated environments.

- **[Globalization](https://react.syncfusion.com/data-grid/globalization):**
  Adapts dates, numbers, currencies, and text formats for international audiences. Includes built-in support for localization and internationalization (i18n), enabling deployment across multilingual and multicultural platforms.

- **[Robust API](https://react-api.syncfusion.com/data-grid/overview):**
  Provides a comprehensive and extensible API for programmatic control over grid behavior, data updates, and event handling. Supports integration with external systems, custom business logic, and advanced workflow automation.

**Setup**

To install `grid` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-grid
```  

**Usage**

```tsx
import { Grid, Columns, Column } from '@syncfusion/react-grid';

export default function App() {
  return (
    <Grid dataSource={data} pageSettings={{ enabled: true }}>
      <Columns>
        <Column field="OrderID" headerText="Order ID" width="120" textAlign="Right"/>
        <Column field="CustomerName" headerText="Customer Name" width="120"/>
        <Column field="Freight" format="C2" width="120" textAlign="Right"/>
        <Column field="OrderDate" headerText="Order Date" format="yMd" width="120" textAlign="Right"/>
        <Column field="ShipCountry" headerText="Ship Country" width="140"/>
      </Columns>
    </Grid>     
  );
};
```

**Resources**

- [Data Grid Demo/Docs](https://react.syncfusion.com/data-grid/overview)
- [Data Grid API](https://react-api.syncfusion.com/data-grid/overview)

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
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/grid/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2025 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
