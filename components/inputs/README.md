# React Input Components

The Syncfusion React Input package is a feature-rich collection of UI components, including Textbox, Textarea, Numeric-textbox and Form-validator, designed to capture user input in React applications.

## Setup

To install `inputs` and its dependent packages, use the following command,

```sh
npm install @syncfusion/react-inputs
```

## React Form

The Form component provides comprehensive form validation and state management functionality with built-in validation rules and field interaction tracking. It offers a powerful way to handle complex forms with real-time validation, error handling, and submission management.

**Key features**

- **Built-in Validation Rules:** Comprehensive set of 15+ validation rules including required, email, URL, date, number, length constraints, ranges, and custom pattern matching.

- **Real-time Validation:** Support for immediate validation on field changes or validation on blur/submit.

- **State Management:** Complete form state tracking including field values, errors, touched/visited states, and modification tracking.

- **Custom Validation:** Support for custom validation functions with full access to field values for complex business logic validation.

- **Cross-field Validation:** EqualTo validation for comparing field values such as password confirmation fields.

- **Initial Values:** Support for pre-populated form fields with validation on initial load.

**Usage**

```tsx
import React, { useState } from 'react';
import { Form, FormField, FormState } from '@syncfusion/react-inputs';

export default function App() {
  const [formState, setFormState] = useState<FormState>();

  return (
    <Form
      rules={{ username: { required: [true, 'Username is required'] } }}
      onSubmit={(data) => console.log(data)}
      onFormStateChange={setFormState}
    >
      <FormField name="username">
        <input
          name="username"
          value={(formState?.values.username || '') as string}
          onChange={(e) => formState?.onChange('username', { value: e.target.value })}
          onBlur={() => formState?.onBlur('username')}
          onFocus={() => formState?.onFocus('username')}
        />
        {formState?.errors?.username && (
          <div className="error">{formState.errors.username}</div>
        )}
      </FormField>

      <button type="submit">Submit</button>
    </Form>
  );
}
```

**Resources**

- [Form Demo/Docs](https://react.syncfusion.com/react-ui/form)
- [Form API](https://react.syncfusion.com/api/form/overview)

## React Numeric TextBox

The NumericTextBox component provides a specialized input field for numeric values with validation, formatting, and increment/decrement capabilities. It offers precise control over numeric input with support for various number formats, validation rules, and user interaction patterns.

**Key features**

- **Value constraints:** Set minimum and maximum allowed values to restrict user input within specific numeric ranges.

- **Step configuration:** Define increment/decrement step size for precise value adjustments using spin buttons or keyboard controls.

- **Spin buttons:** Optional increment and decrement buttons that allow users to adjust values without typing.

- **Number formatting:** Comprehensive formatting options including decimal places, currency symbols, and percentage formatting.
 
- **LabelMode** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Keyboard navigation:** Enhanced keyboard support for incrementing/decrementing values using arrow keys.

**Usage**

```tsx
import { NumericTextBox } from "@syncfusion/react-inputs";

export default function App() {
  return (
    <NumericTextBox defaultValue={100} min={0} max={1000} />
  );
}
```

**Resources**

- [Numeric TextBox Demo/Docs](https://react.syncfusion.com/react-ui/numeric-textbox)
- [Numeric TextBox API](https://react.syncfusion.com/api/numeric-textbox/overview)

## React TextArea

The TextArea component provides a multi-line text input field with enhanced functionality for collecting longer text content from users. It offers various customization options to adapt to different application requirements and design systems.

**Key features**

- **Resizing options:** Supports multiple resize modes including Both, Horizontal, and Vertical to control how users can resize the input area.

- **LabelMode:** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Variants:** Offers multiple visual styles including Standard, Outlined, and Filled variants to match your application's design language.

- **Customizable dimensions:** Supports setting specific dimensions through rows and cols properties or through width styling.

- **Controlled and uncontrolled modes:** Supports both controlled mode (using the `value` prop) and uncontrolled mode (using the `defaultValue` prop) to accommodate different state management approaches.

**Usage**

```tsx
import { TextArea } from '@syncfusion/react-inputs';

export default function App() {
  return (
    <TextArea defaultValue="Initial text" placeholder="Enter text" rows={5} cols={40} />
  );
}
```

**Resources**

- [TextArea Demo/Docs](https://react.syncfusion.com/react-ui/textarea)
- [TextArea API](https://react.syncfusion.com/api/textarea/overview)

## React TextBox

The TextBox component provides a feature-rich input field for collecting user text input with enhanced styling options and validation states. It supports both controlled and uncontrolled input modes to fit various application requirements.

**Key features**

- **Variants:** Offers multiple visual styles including Standard, Outlined, and Filled variants to match your application's design language.

- **Sizes:** Provides size options (Small and Medium) to control the component's dimensions for different UI contexts.

- **Color:** Supports different color schemes including Success, Warning, and Error to visually communicate validation states.

- **LabelMode:** Implements floating label functionality with configurable behavior modes to enhance form usability.

- **Prefix and suffix:** Supports adding custom icons at the beginning or end of the input field for enhanced visual cues.

- **Controlled and uncontrolled modes:** Supports both controlled mode (using the `value` prop) and uncontrolled mode (using the `defaultValue` prop) to accommodate different state management approaches.

**Usage**

```tsx
import { TextBox } from "@syncfusion/react-inputs";

export default function App() {
  return (
    <TextBox defaultValue="Initial text" placeholder="Enter text" />
  );
}
```

**Resources**

- [TextBox Demo/Docs](https://react.syncfusion.com/react-ui/textbox)
- [TextBox API](https://react.syncfusion.com/api/textbox/overview)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/inputs/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
