# Syncfusion React Button Components

The Syncfusion React Buttons package provides a feature-rich collection of UI components, including Button, CheckBox, RadioButton, Switch, Chip, ChipList, and Floating Action Button, for building modern, interactive React applications.

## Setup

To install `buttons` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-buttons
```

## React Button

The Button component is designed to create highly customizable and interactive button elements with a variety of styling and functional options. It allows for tailored interactions through different configurations such as size, color, icon positioning, and toggle capability.

**Key features**

- **Color Variants:** Style buttons with distinct color options like 'warning', 'success', 'danger', and 'info' to fit your application's theme.

- **Icon Support:**  Integrate SVG icons within buttons for enhanced visual cues. Configure the icon's position to be left, right, top, or bottom relative to button text.

- **Toggle Functionality:** Use the button as a toggle to maintain and represent states within your application, enabling buttons to switch between active and inactive states upon user interaction.

- **Size Options:** Adjust button dimensions with size variants such as 'small', 'medium' and 'bigger', allowing for flexibility in different UI contexts.

- **Variant Styles:** Choose from various button styles like 'outlind', 'filled', and 'flat' to seamlessly integrate with your design language.

- **Selection Management:** Include prop configurations to set initial states, making it simple to handle selection states, especially useful for toggle buttons.

**Usage**

```tsx
import { Button } from '@syncfusion/react-buttons';

export default function App() {
  return (
    <Button>Default Button</Button>     
  );
};
```

**Resources**

- [Button Demo/Docs](https://react.syncfusion.com/react-ui/button)
- [Button API](https://react.syncfusion.com/api/button/overview)

## React Checkbox

The Checkbox component offers a flexible and user-friendly way to allow users to make binary selections. It supports various states and configurations to accommodate different use cases in applications.

**Key features**

- **Selection States:** The Checkbox component can be configured to be in checked, unchecked, or indeterminate states. This provides a visual cue for users to understand the current selection state.

- **Label Support:** Display informative text alongside the checkbox to clearly convey its purpose to users. The label can be positioned either before or after the checkbox element based on UI preferences.

- **Label Positioning:** Configure the label placement with the `labelPlacement` prop, choosing whether the label appears before or after the Checkbox.

**Usage**

```tsx
import { Checkbox } from '@syncfusion/react-buttons';

export default function App() {
    return (
      <Checkbox label='Checkbox' defaultChecked/>
    );
}
```

**Resources**

- [Checkbox Demo/Docs](https://react.syncfusion.com/react-ui/checkbox)
- [Checkbox API](https://react.syncfusion.com/api/checkbox/overview)

## React Chip

The Chip component represents information in a compact form, such as entity attribute, text, or action. It provides a versatile way to display content in a contained, interactive element.

**Key features**

- **Variants:** Display chips with different visual styles using either 'filled' or 'outlined' variants to match your design requirements.

- **Colors:** Customize the appearance with predefined color options including primary, info, danger, success, and warning.

- **Icons and Avatars:** Enhance visual representation with leading icons, trailing icons, or avatars to provide additional context.

**Usage**

```tsx
import { Chip } from '@syncfusion/react-buttons';

export default function App() {
    return (
      <Chip>Anne</Chip>
    );
}
```

**Resources**

- [Chip Demo/Docs](https://react.syncfusion.com/react-ui/chip)
- [Chip API](https://react.syncfusion.com/api/chip/overview)

## React ChipList

The ChipList component displays a collection of chips that can be used to represent multiple items in a compact form. It provides a flexible way to manage and interact with a group of chip elements.

**Key features**

- **Selection Modes:** Supports three selection types - 'single', 'multiple', and 'none' to control how users can select chips.

- **Data Binding:** Easily populate the ChipList with an array of strings, numbers, or custom chip configurations.

- **Customizable Chips:** Each chip can be individually styled with avatars, leading icons, trailing icons, and different variants.

- **Removable Chips:** Configure chips to be removable with built-in delete event handling.

- **Controlled & Uncontrolled Modes:** Supports both controlled and uncontrolled component patterns for selection and deletion.

**Usage**

```tsx
import { ChipList } from "@syncfusion/react-buttons";

export default function App() {
    return (
      <ChipList chips={['Apple', 'Banana', 'Cherry']} selection='Multiple' removable={true} />
    );
}
```

**Resources**

- [ChipList Demo/Docs](https://react.syncfusion.com/react-ui/chipList)
- [ChipList API](https://react.syncfusion.com/api/chipList/overview)

## React Floating Action Button

The Floating Action Button (FAB) component provides a prominent primary action within an application interface, positioned for high visibility and customizable with various styling options.

**Key features**

- **Color Variants:** Customizable color options such as 'warning', 'success', 'danger', and 'info' are available to help the FAB blend seamlessly with your application's color scheme.

- **Icon Customization:** Integrate SVG icons within buttons for enhanced visual appeal. Control icon placement relative to text with configurable options for positioning.

- **Visibility Control:** Easily manage the visibility of the FAB using the `isVisible` prop, deciding if it should be displayed based on application logic.

- **Positioning:** The FAB can be positioned flexibly with options like top-left, top-right, bottom-left, and bottom-right to fit different design requirements.

- **Size Options:** Modify the size of the FAB with options for 'small', 'medium' and 'bigger', accommodating different interface contexts.

- **Toggle Functionality:** Activate toggle behavior for the FAB to allow it to switch states on each user interaction, which can be useful for certain UI scenarios.

**Usage**

```tsx
import { Fab, Color, FabPosition } from "@syncfusion/react-buttons";

export default function App() {
    return (
      <Fab color={Color.Success} position={FabPosition.BottomLeft}>FAB</Fab>
    );
}
```

**Resources**

- [Floating Action Button Demo/Docs](https://react.syncfusion.com/react-ui/floating-action-button)
- [Floating Action Button API](https://react.syncfusion.com/api/floating-action-button/overview)

## React RadioButton

The RadioButton component enables users to select a single option from a group, offering a clear circular interface for making selections. It is a simple and efficient way to present mutually exclusive choices to users.

**Key features**

- **Selection State:** Easily configure the RadioButton to be in a checked or unchecked state, indicating selected or unselected options within a group.

- **Label Customization:** The RadioButton can be accompanied by a text label to describe its function, which helps users understand the purpose of the radio selection.

- **Label Positioning:** Flexibly position the label relative to the RadioButton with options available for placing it before or after the button, enhancing UI layout consistency.

- **Form Integration:** The value attribute of the RadioButton can be included as part of form data submitted to the server, facilitating efficient data processing.

**Usage**

```tsx
import { RadioButton } from "@syncfusion/react-buttons";

export default function App() {
    return (
      <RadioButton checked={true} label="Choose this option" name="choices" />
    );
}
```

**Resources**

- [RadioButton Demo/Docs](https://react.syncfusion.com/react-ui/radio-button)
- [RadioButton API](https://react.syncfusion.com/api/radio-button/overview)

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
