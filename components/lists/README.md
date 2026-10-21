# Syncfusion React Lists Components

The Syncfusion React Lists package provides the `ListView` component for rendering data-driven lists in React apps. It supports flexible data binding, grouping, sorting, custom templates, and windowed virtualization for large datasets, built from the ground up with React functional components and hooks.

### Key Features

- **[Data Binding:](https://react.syncfusion.com/react-ui/listview/#remote-data-binding)** Bind list data from a local array of objects, an array of primitives (auto-mapped to `text` and `id`), or a remote `DataManager` instance passed to `dataSource` for dynamic list population.

- **[Grouping:](https://react.syncfusion.com/react-ui/listview/#grouped-list)** Categorize items by assigning the grouping source key to the `fields.groupBy` field, so records under each value collapse beneath a generated group header.

- **[Sorting:](https://react.syncfusion.com/react-ui/listview/#sorted-list)** Control item (and group-header) order with `sortOrder` using `SortOrder.Ascending`, `SortOrder.Descending`, or `SortOrder.None`, and name the sort key via `fields.sortBy`.

- **[Virtualization:](https://react.syncfusion.com/react-ui/listview/#virtualization)**
Enable windowed rendering with the `virtualization` object: set the fixed `itemSize` and `pageSize`, tune `overscanCount` for smooth scrolling, supply `totalCount`, and toggle `showSkeleton` for placeholders during fetch.

- **[Templates:](https://react.syncfusion.com/react-ui/listview/#customization)** Render custom content with `itemTemplate` for each row, `groupTemplate` for group headers, and `headerTemplate` / `footerTemplate` for content above and below the list.

- **[Data and Scroll Events:](https://react.syncfusion.com/react-ui/listview/#custom-scrolling)** React to the data lifecycle with `onDataRequest` (args expose `data` and `query`) and `onDataLoad` (args expose the resolved `data`), plus `onScroll` passing `startIndex` and `count`.


## Setup

To install `lists` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-lists
```
Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/list-view/index.css';
```

**Usage**

```tsx
import { ListView } from '@syncfusion/react-lists';

export default function App() {
  const listData: { [key: string]: string }[] = [
    { id: '1', text: 'Artwork' },
    { id: '2', text: 'Abstract' },
    { id: '3', text: 'Modern Painting' },
    { id: '4', text: 'Ceramics' }
  ];

  return (
    <div className="component-section">
      <ListView dataSource={listData} fields={{ id: 'id', text: 'text' }} />
    </div>
  );
}
```

**Resources**

- [ListView Demo/Docs](https://react.syncfusion.com/react-ui/listview/)
- [ListView API](https://react.syncfusion.com/api/listview/overview/)

<p align="center">
Trusted by the world's leading companies
  <a href="https://www.syncfusion.com/">
    <img src="https://raw.githubusercontent.com/SyncfusionExamples/nuget-img/master/syncfusion/syncfusion-trusted-companies.webp" alt="Company logo">
  </a>
</p>

## Support

Product support is available through following mediums.

* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat

## Changelog

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/lists/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.