# Changelog

## [Unreleased]

## 31.1.17 (2025-09-05)

### Button

#### Breaking Changes

- The `IconPosition` `enum` in the Button component has been renamed to `Position` `enum`.
- The `Danger` theme `color` in the Button component has been renamed to `Error`.
- The `Flat` variant style in the Button component has been renamed to `Standard`.
- The `togglable` `method` in the Button component has been renamed to `toggleable`.

### Checkbox

#### Breaking Changes

- The `labelPlacement` property type has been changed from `LabelPlacement ('Before' | 'After')` to `Position ('Left' | 'Right' | 'Top' | 'Bottom')`.

### Chip

#### Breaking Changes

- The `DeleteEvent` interface has been renamed to `ChipDeleteEvent`.
- The `danger` color option in `ChipColor` has been renamed to `error`.
- The `ChipVariant` type values have been updated to use proper casing: `Filled` and `Outlined`.
- The `ChipColor` type values have been updated to use proper casing: `Primary`, `Info`, `Error`, `Success`, and `Warning`.

### ChipList

#### Breaking Changes

- The `chips` property type has been changed from `ChipData[]` to `string[] | ChipItemProps[]`.
- The `ChipDeleteEvent` interface has been renamed to `ChipListDeleteEvent`.
- The `ChipSelectEvent` interface has been renamed to `ChipListSelectEvent`.
- The `getSelectedChips()` method return type has been updated to return `string[] | ChipItemProps[]`.
- The `SelectionType` type values have been updated to use proper casing: `Single`, `Multiple`, and `None`.

## 29.2.4 (2025-05-14)

### Button

The Button component is designed to create highly customizable and interactive button elements with a variety of styling and functional options. It allows for tailored interactions through different configurations such as `size`, `color`, `icon` positioning, and toggle capability.

Explore the demo <a href="https://react.syncfusion.com/button" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Colour Variants:** Style buttons with distinct `color` options like 'warning', 'success', 'danger', and 'info' to fit your application's theme.

- **Icon Support:**  Integrate SVG icons within buttons for enhanced visual cues. Configure the icon's position to be left, right, top, or bottom relative to button text.

- **Toggle Functionality:** Use the button as a toggle to maintain and represent states within your application, enabling buttons to switch between active and inactive states upon user interaction.

- **Size Options:** Adjust button dimensions with size variants such as 'small', 'medium' and 'bigger', allowing for flexibility in different UI contexts.

- **Variant Styles:** Choose from various button styles like 'outlined', 'filled', and 'flat' to seamlessly integrate with your design language.

- **Selection Management:** Include prop configurations to set initial states, making it simple to handle selection states, especially useful for toggle buttons.

### Checkbox

The Checkbox component offers a flexible and user-friendly way to allow users to make binary selections. It supports various states and configurations to accommodate different use cases in applications.

Explore the demo <a href="https://react.syncfusion.com/checkbox" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Selection States:** The Checkbox component can be configured to be in checked, unchecked, or indeterminate states. This provides a visual cue for users to understand the current selection state.

- **Label Support:** Display informative text alongside the checkbox to clearly convey its purpose to users. The label can be positioned either before or after the checkbox element based on UI preferences.

- **Label Positioning:** Configure the label placement with the `labelPlacement` prop, choosing whether the label appears before or after the Checkbox.

### Chip

The Chip component represents information in a compact form, such as entity attribute, text, or action. It provides a versatile way to display content in a contained, interactive element.

Explore the demo <a href="https://react.syncfusion.com/chip" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Variants:** Display chips with different visual styles using either 'filled' or 'outlined' variants to match your design requirements.

- **Colours:** Customize the appearance with predefined `color` options including primary, info, danger, success, and warning.

- **Icons and Avatars:** Enhance visual representation with leading icons, trailing icons, or avatars to provide additional context.

### Chip List

The `ChipList` component displays a collection of chips that can be used to represent multiple items in a compact form. It provides a flexible way to manage and interact with a group of chip elements.

Explore the demo <a href="https://react.syncfusion.com/chiplist" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Selection Modes:** Supports three selection types - 'single', 'multiple', and 'none' to control how users can select chips.

- **Data Binding:** Easily populate the `ChipList` with an array of strings, numbers, or custom chip configurations.

- **Customizable Chips:** Each chip can be individually styled with avatars, leading icons, trailing icons, and different variants.

- **Removable Chips:** Configure chips to be removable with built-in delete event handling.

- **Controlled & Uncontrolled Modes:** Supports both controlled and uncontrolled component patterns for selection and deletion.

### Floating Action Button

The Floating Action Button (FAB) component provides a prominent primary action within an application interface, positioned for high visibility and customizable with various styling options.

Explore the demo <a href="https://react.syncfusion.com/floating-action-button" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Colour Variants:** Customizable `color` options such as 'warning', 'success', 'danger', and 'info' are available to help the FAB blend seamlessly with your application's `color` scheme.

- **Icon Customization:** Integrate SVG icons within buttons for enhanced visual appeal. Control icon placement relative to text with configurable options for positioning.

- **Visibility Control:** Easily manage the visibility of the FAB using the `isVisible` prop, deciding if it should be displayed based on application logic.

- **Positioning:** The FAB can be positioned flexibly with options like top-left, top-right, bottom-left, and bottom-right to fit different design requirements.

- **Size Options:** Modify the size of the FAB with options for 'small', 'medium' and 'bigger', accommodating different interface contexts.

- **Toggle Functionality:** Activate toggle `behavior` for the FAB to allow it to switch states on each user interaction, which can be useful for certain UI scenarios.


### Radio Button

The `RadioButton` component enables users to select a single option from a group, offering a clear circular interface for making selections. It is a simple and efficient way to present mutually exclusive choices to users.

Explore the demo <a href="https://react.syncfusion.com/radio-button" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Selection State:** Easily configure the `RadioButton` to be in a checked or unchecked state, indicating selected or unselected options within a group.

- **Label Customization:** The `RadioButton` can be accompanied by a text label to describe its function, which helps users understand the purpose of the radio selection.

- **Label Positioning:** Flexibly position the label relative to the `RadioButton` with options available for placing it before or after the button, enhancing UI layout consistency.

- **Form Integration:** The value attribute of the `RadioButton` can be included as part of form data submitted to the server, facilitating efficient data processing.
