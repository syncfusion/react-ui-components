# Changelog

## 34.1.29 (2026-09-28)

### Common

#### Features

- Standalone UI SDKs (v35.1 and Later)

   The Essential Studio UI Edition includes access to Standalone UI SDKs, providing all UI components across supported platforms. Organizations can choose from individual standalone component offerings or a comprehensive UI suite based on application requirements and licensing preferences.

- Consolidated Theme Styles via `index.css`

   The theme package now provides an `index.css` file in each component folder that loads all dependency styles, so importing it alone is sufficient instead of referring individual dependent styles for each component.

- LLM-Ready Documentation and AI Agent Support
    
   The [sample browser](https://react.syncfusion.com/react-ui/ai-and-smart-tooling/llms/) now includes LLM-ready documentation, making it easier for AI agents to discover and consume component APIs and samples. Published [skills](https://react.syncfusion.com/react-ui/ai-and-smart-tooling/skills/) for the SDK components are now available, and migration guidance is provided for moving from EJ2 React to the Pure React components.

#### Bug Fixes

- Updated component name casing in telemetry to ensure consistent event tracking and reporting

- Resolved the blocking License Purchase Banner Popup issue.

## 34.2.4 (2026-08-18)

### Common

#### Bug Fixes

- Improved telemetry tracking with standardized event reporting, enhanced identifier management, and optimized session deduplication.

## 34.2.2 (2026-08-05)

### Common

#### Features

- **Introducing Telemetry:** Starting with this release (v34.2.2), Syncfusion Pure React introduces telemetry (development-only) to help us better understand product usage, feature adoption, usage trends and make better product roadmap decisions.

   Telemetry is enabled by default and collects only a limited set of anonymous usage data while applications are running in a development environment. Telemetry is automatically disabled in production environments, and no telemetry is collected from deployed production applications or end users.

   For more details about Syncfusion Telemetry, including data collection practices, privacy information, and opt-out configuration, refer to the [Telemetry User Guide.](https://react.syncfusion.com/react-ui/telemetry)

## 34.1.29 (2026-07-06)

### Common

#### Production-ready components

The following Pure React components are production-ready:

- Chart
- DataGrid
- ListView
- **Buttons:** Button, ChipList, Chip, Floating Action Button, Radio Button, Split Button, Dropdown Button.
- **Calendars:** Calendar, DatePicker, TimePicker, DateTime Picker, DateRangePicker.
- **Dropdowns:** Autocomplete, ComboBox, Dropdown List, MultiSelect.
- **Inputs:** Checkbox, Form, Numeric Textbox, TextArea, TextBox.
- **Navigation:** Toolbar, Context Menu.
- **Notifications:** Message, Skeleton, Toast, Spinner.
- **Layout:** Tooltip, Dialog.

### Theme support

[Tailwind](https://react.syncfusion.com/react-ui/themes/tailwind/) and [Bootstrap](https://react.syncfusion.com/react-ui/themes/bootstrap/)
 themes have been added for Pure React components. Developers can apply these themes to components to match their projects’ design.

## 33.1.44 (2026-03-16)

### Common 

#### Features

- Introduced the `Animation` component, now including built‑in animations such as `Fade`, `Zoom`, `Slide`, and `Flip` to deliver smoother transitions and an improved user experience.
- Introduced new `Draggable` and `Droppable` components, enabling intuitive and flexible drag‑and‑drop interactions within the UI.

## 32.2.3 (2026-02-05)

### Common 

#### Features

- Added a dedicated `npx` command `npx syncfusion-react-license activate` to activate the license for Pure React components. This is especially useful for projects that use both EJ2 React and Pure React components together.

## 32.1.19 (2025-12-16)

### Common

#### Features

- Upgraded Sass to version 1.92.1.

- React components now automatically use the default currency code based on the active locale when no `currency` prop is provided.

- Added CSS variable support for typography customization.

- Added support for creating React applications using Pure React components in Visual Studio Code through the JavaScript Visual Studio Code extension.

#### Breaking Changes

- Renamed Material 3 theme file from `material3` to `material` for consistent theme naming.

## 31.1.17 (2025-09-05)

### Common

#### Breaking Changes

- The separate `Material 3 Dark` theme CSS file has been removed. Applications should now use the unified `Material 3` theme, which dynamically supports both light and dark modes to simplify theme management.
