# Changelog

## [Unreleased]

## 31.1.17 (2025-09-05)

### Form

The Form component provides comprehensive form validation and state management functionality with built-in validation rules and field interaction tracking. It offers a powerful way to handle complex forms with real-time validation, error handling, and submission management.

Explore the demo <a href="https://react.syncfusion.com/form" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Built-in Validation Rules:** Comprehensive set of 15+ validation rules including required, email, URL, date, number, length constraints, ranges, and custom pattern matching.

- **Real-time Validation:** Support for immediate validation on field changes or validation on blur/submit.

- **State Management:** Complete form state tracking including field values, errors, touched/visited states, and modification tracking.

- **Custom Validation:** Support for custom validation functions with full access to field values for complex business logic validation.

- **Cross-field Validation:** EqualTo validation for comparing field values such as password confirmation fields.

- **Initial Values:** Support for pre-populated form fields with validation on initial load.

### NumericTextBox

#### Breaking Changes

- The `labelMode` property type has been changed from `FloatLabelType` to `LabelMode` for better type consistency across input components.

### TextArea

#### Breaking Changes

- The `labelMode` property type has been changed from `FloatLabelType` to `LabelMode` for better type consistency across input components.

### TextBox

#### Breaking Changes

- The `labelMode` property type has been changed from `FloatLabelType` to `LabelMode` for better type consistency across input components.

## 29.2.4 (2025-05-14)

### NumericTextBox

The NumericTextBox component provides a specialized input field for numeric values with validation, formatting, and increment/decrement capabilities. It offers precise control over numeric input with support for various number formats, validation rules, and user interaction patterns.

Explore the demo <a href="https://react.syncfusion.com/numeric-textbox" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Value constraints:** Set minimum and maximum allowed values to restrict user input within specific numeric ranges.

- **Step configuration:** Define increment/decrement step size for precise value adjustments using spin buttons or keyboard controls.

- **Spin buttons:** Optional increment and decrement buttons that allow users to adjust values without typing.

- **Number formatting:** Comprehensive formatting options including decimal places, currency symbols, and percentage formatting.
 
- **LabelMode** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Keyboard navigation:** Enhanced keyboard support for incrementing/decrementing values using arrow keys.

### TextArea

The TextArea component provides a multi-line text input field with enhanced functionality for collecting longer text content from users. It offers various customization options to adapt to different application requirements and design systems.

Explore the demo <a href="https://react.syncfusion.com/textarea" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Resizing options:** Supports multiple resize modes including Both, Horizontal, and Vertical to control how users can resize the input area.

- **LabelMode:** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Variants:** Offers multiple visual styles including Standard, Outlined, and Filled variants to match your application's design language.

- **Customizable dimensions:** Supports setting specific dimensions through rows and cols properties or through width styling.

- **Controlled and uncontrolled modes:** Supports both controlled mode (using the `value` prop) and uncontrolled mode (using the `defaultValue` prop) to accommodate different state management approaches.

### TextBox

The TextBox component provides a feature-rich input field for collecting user text input with enhanced styling options and validation states. It supports both controlled and uncontrolled input modes to fit various application requirements.

Explore the demo <a href="https://react.syncfusion.com/textbox" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Variants:** Offers multiple visual styles including Standard, Outlined, and Filled variants to match your application's design language.

- **Sizes:** Provides size options (Small and Medium) to control the component's dimensions for different UI contexts.

- **Color:** Supports different color schemes including Success, Warning, and Error to visually communicate validation states.

- **LabelMode:** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Prefix and suffix:** Supports adding custom icons at the beginning or end of the input field for enhanced visual cues.

- **Controlled and uncontrolled modes:** Supports both controlled mode (using the `value` prop) and uncontrolled mode (using the `defaultValue` prop) to accommodate different state management approaches.