# Syncfusion React Dropdown Components

The Syncfusion React Dropdowns package is a high-performance UI library delivering dropdown components for React applications. It features an enterprise-ready `Dropdown List`, `Autocomplete`, `ComboBox`, and `MultiSelect` built on a unified core for seamless data-binding, filtering, and UI templating. Optimized with built-in virtualization, it guarantees fluid rendering for massive datasets in single-value and multi-value selection forms.

## Setup

To install `dropdowns` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-dropdowns
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/drop-down-list/index.css';
```
> Note: For other themes, use the corresponding `index.css` files from their respective style folders.

## React Dropdown List

The React `Dropdown List` component lets users select a single option from a predefined list. It is commonly used for choosing categories, filtering data, or guiding users through a sequence of options.

### Key Features

- **[Primitive Data Binding:](https://react.syncfusion.com/react-ui/dropdown-list/#primitive-data-binding)** Bind the component to an array of strings or numbers by mapping the `dataSource` and `fields` properties, or to server-side data through the `DataManager` using the `query` property.

- **[Grouping:](https://react.syncfusion.com/react-ui/dropdown-list/#grouping)** Arrange related options into logical categories using the `groupBy` mapping in the `fields` property. `groupTemplate` customizes the appearance of the group headers.

- **[Filtering:](https://react.syncfusion.com/react-ui/dropdown-list/#filtering)** Enable the `filterable` property to narrow the list as the user types. Control responsiveness with `debounceDelay`, the match strategy with `filterType` (`StartsWith`, `Contains`, `EndsWith`), and international matching with `ignoreCase` and `ignoreAccent`.

- **[Virtualization:](https://react.syncfusion.com/react-ui/dropdown-list/#virtualization)** Render only visible rows for very large datasets through the `virtualization` property, which exposes `itemSize`, `pageSize`, `overscanCount`, `showSkeleton`, and `scrollMode` (`FetchViewPort` or `FetchAll`) for tuning rendering and remote fetch behavior.

- **[Cascading Dropdowns:](https://react.syncfusion.com/react-ui/dropdown-list/#cascading-dropdowns)** Compose the component so that the selection in one `Dropdown List` determines the `dataSource` of subsequent lists, for dependent pickers such as country, region, and city.

- **[Templates:](https://react.syncfusion.com/react-ui/dropdown-list/#custom-rendering)** Customize each part of the rendered output with `itemTemplate`, `groupTemplate`, `headerTemplate`, `footerTemplate`, `valueTemplate`, and `noRecordsTemplate`.

- **[Appearance and State:](https://react.syncfusion.com/react-ui/dropdown-list/#appearance)** Choose a visual `variant` (`Standard`, `Outlined`, `Filled`) and a `size`, control the floating label with `labelMode`, and manage state in controlled (`value` and `onChange`) or uncontrolled (`defaultValue`) mode. Use `disabled`, `readOnly`, and per-item `disabled` mapping to control interactivity, `clearButton` to reset the selection, and `prefix`/`suffix` to add adornments.

- **[Disabled Items:](https://react.syncfusion.com/react-ui/dropdown-list/#disabled-items)** Mark specific options as non-selectable by mapping a boolean property (such as `disabled`) to the `disabled` field in the `fields` configuration, keeping them visible while preventing selection.

- **[Forms and Validation:](https://react.syncfusion.com/react-ui/dropdown-list/#forms-support)** Integrate the component into forms with built-in validation using the `valid`, `validationMessage`, and `validityStyles` properties to control error state, messaging, and styling.

**Usage**

```tsx
import { DropDownList } from '@syncfusion/react-dropdowns';

const data = [
  { text: 'Apple', value: 'apple' },
  { text: 'Banana', value: 'banana' },
  { text: 'Cherry', value: 'cherry' }
];

export default function App() {
  return (
    <DropDownList
      id="fruits"
      dataSource={data}
      fields={{ text: 'text', value: 'value' }}
      placeholder="Select a fruit"
    />
  );
}
```

**Resources**

- [Dropdown List Demo/Docs](https://react.syncfusion.com/react-ui/dropdown-list/)
- [Dropdown List API](https://react.syncfusion.com/api/dropdown-list/overview/)

## React Autocomplete

The React `Autocomplete` component is a text input that displays matching suggestions as the user types, combining free-form entry with guided selection.

### Key Features

- **[Autofill](https://react.syncfusion.com/react-ui/autocomplete/#autofill):** Enable the `autofill` property to complete the input with the first matching suggestion, highlighting the suggested portion so the user can accept it with `Enter` or continue typing.

- **[Auto Highlight](https://react.syncfusion.com/react-ui/autocomplete/#auto-highlight):** Enable `autoHighlight` to emphasize the portion of each suggestion that matches the current search text.

- **[Minimum Characters](https://react.syncfusion.com/react-ui/autocomplete/#minimum-length) and Maximum Suggestions:** Use `minLength` to require a threshold of characters before suggestions appear, and `maxSuggestions` to cap the number of rows displayed for large datasets.

- **[Custom Values](https://react.syncfusion.com/react-ui/autocomplete/#custom-value):** Enable `customValue` to let users commit free-form text that is not present in the `dataSource` by pressing `Enter`.

- **[Grouping](https://react.syncfusion.com/react-ui/autocomplete/#grouping) and Filtering:** Organize suggestions with the `groupBy` mapping, and tune filtering with `filterType`, `debounceDelay`, `ignoreCase`, and `ignoreAccent`.

- **[Virtualization](https://react.syncfusion.com/react-ui/autocomplete/#virtualization):** Use the `virtualization` property to render only visible rows and handle remote paging through `scrollMode` (`FetchViewPort` or `FetchAll`).

- **[Templates:](https://react.syncfusion.com/react-ui/autocomplete/#custom-rendering)** Customize rendering with `itemTemplate`, `groupTemplate`, `headerTemplate`, `footerTemplate`, `valueTemplate`, and `noRecordsTemplate`.

- **[Appearance:](https://react.syncfusion.com/react-ui/autocomplete/#appearance)** Adjust the look with `size` and `variant` (`Standard`, `Outlined`, `Filled`), control the floating label with `labelMode`, and add adornments through `prefix` and `suffix`.

- **[State and Guidance:](https://react.syncfusion.com/react-ui/autocomplete/#helper-text)** Support controlled (`value` and `onChange`) and uncontrolled (`defaultValue`) usage, reset the field with `clearButton`, and display contextual messages below the input with `helperText`.

- **[Resizable Popup:](https://react.syncfusion.com/react-ui/autocomplete/#resizable-popup)** Enable the `resizable` property to let users drag the corner of the popup to resize it, and handle updates through the `onResize` event.

- **[Forms and Validation:](https://react.syncfusion.com/react-ui/autocomplete/#forms-support)** Integrate the component into forms with built-in validation using the `valid`, `validationMessage`, and `validityStyles` properties to control error state, messaging, and styling.

**Usage**

```tsx
import { Autocomplete } from '@syncfusion/react-dropdowns';

const languages = [
  { text: 'JavaScript', value: 'js' },
  { text: 'TypeScript', value: 'ts' },
  { text: 'Python', value: 'python' }
];

export default function App() {
  return (
    <Autocomplete
      id="languages"
      dataSource={languages}
      fields={{ text: 'text', value: 'value' }}
      placeholder="Search language..."
      autofill={true}
      autoHighlight={true}
      minLength={1}
    />
  );
}
```

**Resources**

- [Autocomplete Demo/Docs](https://react.syncfusion.com/react-ui/autocomplete/)
- [Autocomplete API](https://react.syncfusion.com/api/auto-complete/overview/)

## React ComboBox

The React `ComboBox` component combines an editable input with a list of suggestions, allowing users to type a value or select a predefined option.

### Key Features

- **[Autofill](https://react.syncfusion.com/react-ui/combobox/#autofill):** Enable the `autofill` property to complete the input with the first matching suggestion, with the completed portion highlighted.

- **[Auto Highlight](https://react.syncfusion.com/react-ui/combobox/#auto-highlight):** Enable `autoHighlight` to display highlighted matching text within each suggestion based on the current input.

- **[Custom Values](https://react.syncfusion.com/react-ui/combobox/#custom-value):** Enable `customValue` to let users enter and commit text values that are not in the data source by pressing `Enter`.

- **[Filtering](https://react.syncfusion.com/react-ui/combobox/#filtering):** Control search capabilities with the `filterable` property, and tune responsiveness and match behavior with `debounceDelay`, `filterType`, `ignoreCase`, and `ignoreAccent`.

- **[Grouping](https://react.syncfusion.com/react-ui/combobox/#grouping) and Virtualization:** Organize options with the `groupBy` mapping, and use the `virtualization` property with `scrollMode` to handle large or remote data.

- **[Cascading ComboBoxes](https://react.syncfusion.com/react-ui/combobox/#cascading-comboboxes):** Link multiple `ComboBox` instances so that a selection in one list drives the `dataSource` of the next.

- **Icon, State, and Appearance:** Toggle the dropdown arrow with `dropdownIcon`, reset the field with `clearButton`, manage state with `value`/`onChange` or `defaultValue`, and adapt the look with `size`, `variant`, `labelMode`, `prefix`, and `suffix`. Add contextual guidance with `helperText` and customize rendering with the item, group, header, footer, value, and no-records templates.

- **[Resizable Popup:](https://react.syncfusion.com/react-ui/combobox/#resizable-popup)** Enable the `resizable` property to let users drag the corner of the popup to resize it, and handle updates through the `onResize` event.

- **[Forms and Validation:](https://react.syncfusion.com/react-ui/combobox/#forms-support)** Integrate the component into forms with built-in validation using the `valid`, `validationMessage`, and `validityStyles` properties to control error state, messaging, and styling.

**Usage**

```tsx
import { ComboBox } from '@syncfusion/react-dropdowns';

const cities = [
  { text: 'New York', value: 'ny' },
  { text: 'London', value: 'london' },
  { text: 'Tokyo', value: 'tokyo' }
];

export default function App() {
  return (
    <ComboBox
      id="cities"
      dataSource={cities}
      fields={{ text: 'text', value: 'value' }}
      placeholder="Select or type a city"
      filterable={true}
      clearButton={true}
    />
  );
}
```

**Resources**

- [ComboBox Demo/Docs](https://react.syncfusion.com/react-ui/combobox/)
- [ComboBox API](https://react.syncfusion.com/api/combo-box/overview/)

## React MultiSelect

The React `MultiSelect` component lets users select multiple options from a list, with support for checkboxes, selection limits, and chip or delimiter display modes.

### Key Features

- **[Display Modes](https://react.syncfusion.com/react-ui/multiselect/#mode):** Control how selections appear in the input with the `mode` property (`Box` for removable chips, `Delimiter` for `delimiterChar`-separated text, and `Auto` for chips on focus and text on blur).

- **[Checkbox and Select All](https://react.syncfusion.com/react-ui/multiselect/#checkbox):** Enable `checkbox` for explicit multi-selection, add bulk actions with `showSelectAll`, `selectAllText`, and `unSelectAllText`, and use `enableGroupedCheckBox` to select an entire group at once.


- **[Selection Limits and Hiding](https://react.syncfusion.com/react-ui/multiselect/#maximum-selection-length):** Restrict the number of selectable items with `maximumSelectionLength`, and remove picked items from the suggestion list with `hideSelectedItem`.

- **[Close on Select](https://react.syncfusion.com/react-ui/multiselect/#close-on-select):** Set `closeOnSelect` to false to keep the popup open for continuous multi-selection.

- **[Custom Values](https://react.syncfusion.com/react-ui/multiselect/#custom-value) and Add Tag on Blur:** Enable `customValue` to commit free-form entries with `Enter`, and set `addTagOnBlur` to add the typed text as a new chip when the field loses focus.

- **[Virtualization](https://react.syncfusion.com/react-ui/multiselect/#virtualization):** Use the `virtualization` property with `scrollMode` (`FetchViewPort` or `FetchAll`) to render large or remote data efficiently.

- **[Templates:](https://react.syncfusion.com/react-ui/multiselect/#custom-rendering)** Customize chips and rendering with `chipTemplate`, `valueTemplate`, `itemTemplate`, `groupTemplate`, `headerTemplate`, `footerTemplate`, and `noRecordsTemplate`.

- **[Appearance:](https://react.syncfusion.com/react-ui/multiselect/#appearance)** Adapt the look with `size`, `variant`, `labelMode`, `prefix`, and `suffix`, and display contextual messages below the input with `helperText`.

- **[Resizable Popup:](https://react.syncfusion.com/react-ui/multiselect/#resizable-popup)** Enable the `resizable` property to let users drag the corner of the popup to resize it, and handle updates through the `onResize` event.

- **[Forms and Validation:](https://react.syncfusion.com/react-ui/multiselect/#forms-support)** Integrate the component into forms with built-in validation using the `valid`, `validationMessage`, and `validityStyles` properties to control error state, messaging, and styling.

**Usage**

```tsx
import { MultiSelect, DisplayMode } from '@syncfusion/react-dropdowns';

const skills = [
  { text: 'JavaScript', value: 'js' },
  { text: 'React', value: 'react' },
  { text: 'TypeScript', value: 'ts' },
  { text: 'Node.js', value: 'nodejs' }
];

export default function App() {
  return (
    <MultiSelect
      id="skills"
      dataSource={skills}
      fields={{ text: 'text', value: 'value' }}
      placeholder="Select skills"
      checkbox={true}
      showSelectAll={true}
      mode={DisplayMode.Box}
      maximumSelectionLength={3}
    />
  );
}
```

**Resources**

- [MultiSelect Demo/Docs](https://react.syncfusion.com/react-ui/multiselect/)
- [MultiSelect API](https://react.syncfusion.com/api/multi-select/overview/)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/dropdowns/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.

