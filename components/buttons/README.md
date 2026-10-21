# Syncfusion React Button Components

The Syncfusion React Buttons package provides a collection of button-based UI components for building modern, interactive React applications. It includes the Button, Checkbox, Chip, ChipList, Radio Button, Floating Action Button, and Switch components, each supporting consistent color, size, and icon APIs plus controlled and uncontrolled usage patterns.

## Setup

```sh
npm install @syncfusion/react-buttons
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/button/index.css';
```
> Note: For other components, use their corresponding index.css files from their respective style folders

## React Button

The Button component creates styled, interactive buttons with configurable variants, colors, icons, and toggle behavior.

### Key Features

- **[Variants](https://react.syncfusion.com/react-ui/button/#variants):** Render buttons with distinct styles using the `variant` property and the `Variant` enum: `Standard`, `Outlined`, and `Filled`. Set `isLink={true}` to render the button as an underlined hyperlink-style action.

- **[Button Sizes](https://react.syncfusion.com/react-ui/button/#button-sizes):** Adjust the button dimensions with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets for consistent sizing across interfaces.

- **[Color](https://react.syncfusion.com/react-ui/button/#color):** Apply distinct color styles with the `color` property and the `Color` enum, including `Primary`, `Secondary`, `Warning`, `Success`, `Error`, and `Info` to match your application theme.

- **[Icon and Label](https://react.syncfusion.com/react-ui/button/#icon-and-label):** Integrate SVG or class-based icons with the `icon` property and position them relative to the label with `iconPosition`, which accepts `Left`, `Right`, `Top`, or `Bottom` via the `Position` enum.

- **[Toggle Button](https://react.syncfusion.com/react-ui/button/#toggle-button):** Enable on/off behavior with `toggleable={true}` so the button switches between active and inactive states on each click, and set the initial state with the `selected` property.

- **[Customization](https://react.syncfusion.com/react-ui/button/#customization):** Override the default appearance with `className` or inline styles for dynamic theming, hover effects, and complex styled buttons with image backgrounds.

**Usage**

```tsx
import { Button, Color, Variant } from '@syncfusion/react-buttons';
import { SaveIcon } from '@syncfusion/react-icons';

export default function App() {
  return (
    <Button color={Color.Success} variant={Variant.Outlined} icon={<SaveIcon />}>
      Save
    </Button>
  );
}
```

**Resources**

- [Button Demo/Docs](https://react.syncfusion.com/react-ui/button/)
- [Button API](https://react.syncfusion.com/api/button/overview/)

## React Checkbox

The Checkbox component provides a binary selection control with customizable labels, colors, states, and form validation support.

### Key Features

- **[States](https://react.syncfusion.com/react-ui/checkbox/#types):** Render checked, unchecked, disabled, readonly, and invalid states. Manage state with `checked` for controlled usage and `defaultChecked` for uncontrolled usage, and set `disabled={true}` to make the checkbox inactive.

- **[Indeterminate State](https://react.syncfusion.com/react-ui/checkbox/#intermediate):** Set `indeterminate={true}` to present a mixed state that is neither checked nor unchecked, useful for parent-child relationships where the parent reflects its children's selections.

- **[Size](https://react.syncfusion.com/react-ui/checkbox/#size):** Customize checkbox dimensions with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets for different UI contexts.

- **[Label and Placement](https://react.syncfusion.com/react-ui/checkbox/#label):** Display descriptive text with the `label` property and control its position relative to the checkbox with `labelPlacement`, which accepts values from the `Position` enum.

- **[Customization](https://react.syncfusion.com/react-ui/checkbox/#customization):** Style the checkbox with the `color` property from the `Color` enum, and replace the default appearance with custom icons via `icon`, `checkedIcon`, and `indeterminateIcon`.

- **[Form Validation](https://react.syncfusion.com/react-ui/checkbox/#form-validation):** Validate user input before submission with the `required`, `valid`, and `validationMessage` properties, with visual invalid states controlled by `validityStyles`.

**Usage**

```tsx
import { Checkbox, Size } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <Checkbox label='Subscribe' defaultChecked size={Size.Small} />
  );
}
```

**Resources**

- [Checkbox Demo/Docs](https://react.syncfusion.com/react-ui/checkbox/)
- [Checkbox API](https://react.syncfusion.com/api/checkbox/overview/)

## React Chip

The Chip component displays discrete information, attributes, or actions in a compact, interactive element supporting icons, avatars, and removal.

### Key Features

- **[Removable Chip](https://react.syncfusion.com/react-ui/chip/#removable-chip):** Set `removable={true}` to show a delete icon and implement an `onDelete` handler to remove the chip, ideal for interfaces where users add and remove items dynamically.

- **[Disabled Chip](https://react.syncfusion.com/react-ui/chip/#disabled-chip):** Set `disabled={true}` to render non-interactive content that remains visible but cannot be selected, useful for showing unavailable options while maintaining context.

- **[Size](https://react.syncfusion.com/react-ui/chip/#size):** Customize chip dimensions with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets.

- **[Colors](https://react.syncfusion.com/react-ui/chip/#colors):** Apply predefined theme colors with the `color` property and the `ChipColor` type, which includes `Primary`, `Info`, `Error`, `Success`, and `Warning`.

- **[Variants](https://react.syncfusion.com/react-ui/chip/#customization):** Style chips with the `variant` property and the `ChipVariant` type, supporting `Filled` for solid backgrounds and `Outlined` for colored borders with transparent centers.

- **[Avatars and Icons](https://react.syncfusion.com/react-ui/chip/#avatar-and-icons):** Enhance chips with the `avatar`, `leadingIcon`, and `trailingIcon` properties, or use image URLs with `leadingIconUrl` and `trailingIconUrl`. Replace the default indicators with `selectIcon` and `removeIcon`.

**Usage**

```tsx
import { Chip } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <Chip variant="Filled" color="Success" removable>
      Anne
    </Chip>
  );
}
```

**Resources**

- [Chip Demo/Docs](https://react.syncfusion.com/react-ui/chip/)
- [Chip API](https://react.syncfusion.com/api/chip/overview/)

## React ChipList

The ChipList component manages a collection of Chip elements with consistent styling, selection modes, and controlled or uncontrolled behavior.

### Key Features

- **[Single Selection](https://react.syncfusion.com/react-ui/chiplist/#single-selection):** Set `selection="Single"` to allow exactly one chip to be active at a time, ideal for mutually exclusive choices such as filter categories or view modes.

- **[Multiple Selection](https://react.syncfusion.com/react-ui/chiplist/#multiple-selection):** Set `selection="Multiple"` to let users select several chips simultaneously, with `selectedChips` preselecting chips by index and `onSelect` reporting changes through the `ChipListSelectEvent` type.

- **[Removable Chips](https://react.syncfusion.com/react-ui/chiplist/#removable-chips):** Set `removable={true}` to add a delete icon to each chip, with `onDelete` reporting the remaining chip collection through the `ChipListDeleteEvent` type.

- **[Size](https://react.syncfusion.com/react-ui/chiplist/#size):** Customize chip dimensions across the list with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets.

- **[Data Binding and Customization](https://react.syncfusion.com/react-ui/chiplist/#customization):** Bind an array of strings or `ChipItemProps` objects to the `chips` property, and style individual chips with `className`, `selectIcon`, or `removeIcon` overrides per item.

- **[Controlled Mode](https://react.syncfusion.com/react-ui/chiplist/#controlled-mode):** Manage selection through React state by combining `selectedChips` with `onSelect`, or control the chip collection itself by binding `chips` to state and handling `onDelete`.

**Usage**

```tsx
import { ChipList } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <ChipList
      chips={['Apple', 'Banana', 'Cherry']}
      selection="Multiple"
      removable={true}
    />
  );
}
```

**Resources**

- [ChipList Demo/Docs](https://react.syncfusion.com/react-ui/chiplist/)
- [ChipList API](https://react.syncfusion.com/api/chiplist/overview/)

## React Floating Action Button

The Floating Action Button (FAB) component provides a prominent primary action within an interface, positioned with high visibility and customizable icons and colors.

### Key Features

- **[Color](https://react.syncfusion.com/react-ui/floating-action-button/#color):** Apply distinct color styles with the `color` property and the `Color` enum, including `Primary`, `Warning`, `Success`, `Error`, and `Info`.

- **[Icon and Text](https://react.syncfusion.com/react-ui/floating-action-button/#icon-and-text):** Customize the FAB with an SVG `icon` and label text, and position the icon relative to the text with `iconPosition`, which accepts `Left`, `Right`, `Top`, or `Bottom` via the `Position` enum.

- **[Size](https://react.syncfusion.com/react-ui/floating-action-button/#size):** Resize the FAB with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets for different layout contexts.

- **[Position](https://react.syncfusion.com/react-ui/floating-action-button/#position):** Place the FAB anywhere within its target using the `position` property and the `FabPosition` enum, which provides nine anchors from `TopLeft` through `BottomRight`.

- **[Disabled](https://react.syncfusion.com/react-ui/floating-action-button/#disabled):** Set `disabled={true}` to signal temporary unavailability; the FAB remains visible but cannot change its state.

- **Toggle and Visibility:** Enable toggle behavior with `toggleable={true}` to switch the FAB between active and inactive states on each click, and control display with `visible`, which defaults to `true`.

**Usage**

```tsx
import { Fab, Color, FabPosition } from '@syncfusion/react-buttons';
import { SaveIcon } from '@syncfusion/react-icons';

export default function App() {
  return (
    <Fab color={Color.Success} position={FabPosition.BottomRight} icon={<SaveIcon />}>
      Save
    </Fab>
  );
}
```

**Resources**

- [Floating Action Button Demo/Docs](https://react.syncfusion.com/react-ui/floating-action-button/)
- [Floating Action Button API](https://react.syncfusion.com/api/floating-action-button/overview/)

## React Radio Button

The Radio Button component lets users select a single option from a group of mutually exclusive choices, commonly used in forms and surveys.

### Key Features

- **[Label and Placement](https://react.syncfusion.com/react-ui/radio-button/#label-placement):** Describe each option with the `label` property and position it relative to the radio button with `labelPlacement`, which supports `Before`, `After`, and `Bottom` via the `LabelPlacement` type.

- **[Size](https://react.syncfusion.com/react-ui/radio-button/#size):** Customize the radio button dimensions with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets.

- **[Disabled State](https://react.syncfusion.com/react-ui/radio-button/#disabled):** Set `disabled={true}` to render an inactive radio button. Group buttons with the `name` prop and manage state with `checked` or `defaultChecked`.

- **[Customization](https://react.syncfusion.com/react-ui/radio-button/#customization):** Modify the appearance with the `color` property from the `Color` enum, including `Primary`, `Success`, `Info`, `Warning`, and `Error`.

- **[Form Validation](https://react.syncfusion.com/react-ui/radio-button/#form-validation):** Include the `value` attribute in form data submitted to the server, and validate grouped selections before submission to ensure complete input.

**Usage**

```tsx
import { RadioButton } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <RadioButton name="theme" value="light" defaultChecked label="Light Mode" />
      <RadioButton name="theme" value="dark" label="Dark Mode" />
      <RadioButton name="theme" value="system" label="System Default" />
    </div>
  );
}
```

**Resources**

- [Radio Button Demo/Docs](https://react.syncfusion.com/react-ui/radio-button/)
- [Radio Button API](https://react.syncfusion.com/api/radio-button/overview/)

## React Switch

The Switch component is a binary toggle control that lets users switch between ON and OFF states with customizable icons, labels, and colors.

### Key Features

- **[Switch States](https://react.syncfusion.com/react-ui/switch/#switch-states):** Present ON, OFF, disabled, and readonly states. Manage state with `checked` for controlled usage and `defaultChecked` for uncontrolled usage.

- **[Size](https://react.syncfusion.com/react-ui/switch/#size):** Customize the track and handle dimensions with the `size` property and the `Size` enum, which supports `Small`, `Medium`, and `Large` presets.

- **[Label and Placement](https://react.syncfusion.com/react-ui/switch/#label-placement):** Display descriptive text with the `label` property and place it on the left, right, top, or bottom of the track with `labelPlacement`, which uses the `Position` enum.

- **[Color](https://react.syncfusion.com/react-ui/switch/#color):** Style the ON-state track and handle with the `color` property and the `Color` enum, including `Primary`, `Secondary`, `Warning`, `Success`, `Error`, and `Info`.

- **[Track Label](https://react.syncfusion.com/react-ui/switch/#track-label):** Render custom text or icons inside the track for each state using the `onTrackLabel` and `offTrackLabel` properties, which accept any React node.

- **[Handler Icon](https://react.syncfusion.com/react-ui/switch/#handler-icon):** Customize the handle for each state with `checkedIcon` when the switch is ON and `uncheckedIcon` when it is OFF.

- **[Form Validation](https://react.syncfusion.com/react-ui/switch/#form-validation):** Submit the switch's form value through the `value` property when checked, and handle state toggles through the `onChange` event with the `SwitchChangeEvent` type.

**Usage**

```tsx
import { Switch, Color, Size } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <Switch label="Dark mode" defaultChecked color={Color.Success} size={Size.Medium} />
  );
}
```

**Resources**

- [Switch Demo/Docs](https://react.syncfusion.com/react-ui/switch/)
- [Switch API](https://react.syncfusion.com/api/switch/overview/)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/buttons/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
