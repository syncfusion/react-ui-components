# Changelog

## [Unreleased]

## 31.1.17 (2025-09-05)

### Dropdown Button

#### Breaking Changes

- The `IconPosition` `enum` in the Dropdown Button component has been renamed to `Position` `enum`.
- The `Danger` theme `color` in the Dropdown Button component has been renamed to `Error`.
- The `Flat` variant style in the Dropdown Button component has been renamed to `Standard`.

### Split Button

#### Breaking Changes

- The `IconPosition` `enum` in the Split Button component has been renamed to `Position` `enum`.
- The `Danger` theme `color` in the Split Button component has been renamed to `Error`.
- The `Flat` variant style in the Split Button component has been renamed to `Standard`.

## 29.2.4 (2025-05-14)

### Dropdown Button

The Dropdown Button component enhances user interfaces with a menu of actions or options that appears on button click, offering an intuitive dropdown mechanism for users.

Explore the demo <a href="https://react.syncfusion.com/dropdown-button" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Color Options:** Style the dropdown button using color variants such as 'warning', 'success', 'danger', and 'info' to align with application themes.

- **Icon Customization:** Integrate icons within the dropdown button using CSS classes or Pure React components (SVG). Adjust icon placement relative to button text with options for left, right, top, or bottom positioning.

- **Interactive Elements:** Configure the dropdown content using the `itemTemplate` prop for advanced functionality within dropdown items. Define action items and their properties for a seamless user interaction experience.

- **Responsive Design:** Adapt the dropdown button with size options — 'small' and 'large' — to fit different UI scenarios.

- **Popup Control:** The `isPopupCreatedOnClick` prop controls the dynamic creation of the popup for enhanced performance. Manage the button's open/close states with the `toggle` prop for precise control over user interactions.

### Split Button

The Split Button component combines a primary button action with a dropdown menu, allowing users to access additional options or actions from a compact interface, enhancing user interaction with contextual commands.

Explore the demo <a href="https://react.syncfusion.com/split-button" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Primary and Secondary Actions:** The Split Button provides a main action on the button itself, with secondary actions available in a dropdown list, offering ease of use and efficiency in accessing commands.

- **Customization Options:** Style the Split Button with various color options like 'warning', 'success', 'danger', and 'info', and integrate icons using CSS class names or Pure React components (SVG) to enhance visual appeal.

- **Icon Placement:** Configure the position of icons relative to button text, with options available for left, right, top, or bottom positioning, ensuring design consistency.

- **Popup Management:** Control the behavior of the dropdown popup with the `isPopupCreatedOnClick` prop for performance optimization and manage toggle states efficiently using the `toggle` prop.

- **Template Support:** Utilize the `itemTemplate` prop to customize the dropdown menu items, ensuring a tailored user experience that matches application needs.
