# Syncfusion React Input Components

The Syncfusion React Input package is a feature-rich collection of UI components, including Form, NumericTextBox, TextArea, TextBox, and FileUpload, designed to capture user input in React applications.

## Setup

To install `@syncfusion/react-inputs` and its dependent packages, use the following command:

```sh
npm install @syncfusion/react-inputs
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/form/index.css';
```

> Note: For other themes, use the corresponding `index.css` files from their respective style folders.

## React Form

The Form is a powerful validation tool for React applications that manages form state, validation rules, and submission handling with a comprehensive set of built-in validation rules and customizable error messages.

### Key Features

- **[Built-in Validation Rules](https://react.syncfusion.com/react-ui/form/#built-in-validation-rules):** Comprehensive set of validation rules including `required`, `email`, `url`, `date`, `number`, `minLength`, `maxLength`, `range`, `regex`, and `equalTo` for password confirmation fields.

- **[Real-time Validation](https://react.syncfusion.com/react-ui/form/#real-time-validation):** Support for immediate validation on field changes by setting `validateOnChange` to `true`, providing instant feedback to users about field validity.

- **[Custom Validation Rules](https://react.syncfusion.com/react-ui/form/#custom-validation-rules):** Support for `customValidator` property to implement complex validation logic beyond built-in rules, such as password strength validation or domain-specific requirements.

- **[Conditional Validation](https://react.syncfusion.com/react-ui/form/#conditional-validation):** Dynamic validation rules that adapt based on values in other fields, enabling responsive forms that change validation requirements based on user choices.

- **[State Management](https://react.syncfusion.com/react-ui/form/#form-configuration):** Complete form state tracking through the `formState` object, providing access to `values`, `errors`, `allowSubmit` status, and methods like `onChange` and `onBlur`.

- **[Multi-step Form Wizard](https://react.syncfusion.com/react-ui/form/#multi-step-form-wizard):** Ability to split large forms into smaller steps with separate validation for each step, improving user experience for complex forms.

- **[Integration with Native HTML Inputs](https://react.syncfusion.com/react-ui/form/#integration-with-native-html-inputs):** Connects directly to standard HTML `<input>`, `<select>`, and `<checkbox>` elements while still delivering the full validation and state management behavior of the `Form` system.

- **[Custom Error Placement](https://react.syncfusion.com/react-ui/form/#custom-error-placement):** Control where validation feedback appears by reading `formState.errors` and rendering messages at the field level or centralizing them in an error summary.

- **[Initial Values](https://react.syncfusion.com/api/form/overview/#initialvalues):** Populate fields on load using the `initialValues` property, with validation applied against the pre-populated data.

**Usage**

```tsx
import { useState } from 'react';
import { Form, FormField, FormState, ValidationRules } from '@syncfusion/react-inputs';

export default function App() {
  const [formState, setFormState] = useState<FormState>();

  const validationRules: ValidationRules = {
    username: {
      required: [true, 'Username is required'],
      minLength: [3, 'Username must be at least 3 characters']
    },
    email: {
      required: [true, 'Email is required'],
      email: [true, 'Please enter a valid email address']
    }
  };

  return (
    <Form
      rules={validationRules}
      validateOnChange={true}
      onSubmit={(data) => console.log(data)}
      onFormStateChange={setFormState}
    >
      <FormField name="username">
        <input
          name="username"
          value={(formState?.values.username || '') as string}
          onChange={(e) => formState?.onChange('username', { value: e.target.value })}
          onBlur={() => formState?.onBlur('username')}
        />
        {formState?.errors?.username && (
          <div className="error">{formState.errors.username}</div>
        )}
      </FormField>

      <button type="submit" disabled={!formState?.allowSubmit}>Submit</button>
    </Form>
  );
}
```

**Resources**

- [Form Demo/Docs](https://react.syncfusion.com/react-ui/form/)
- [Form API](https://react.syncfusion.com/api/form/overview/)

## React Numeric TextBox

The NumericTextBox is a specialized input control for precise and flexible numeric data entry with validation, formatting, and increment/decrement capabilities.

### Key Features

- **[Step Configuration](https://react.syncfusion.com/react-ui/numeric-textbox/#steps):** Set precise increment values using the `step` property, enabling users to adjust numeric inputs with spin buttons or keyboard controls.

- **[Spin Buttons](https://react.syncfusion.com/react-ui/numeric-textbox/#spin-buttons):** Optional increment and decrement buttons controlled via the `spinButton` property (default `true`) that allow users to adjust values without typing.

- **[Number Formatting](https://react.syncfusion.com/react-ui/numeric-textbox/#formats):** Customize display format using the `format` property with support for decimal places, currency symbols, and percentage formatting.

- **[Value Range Constraint](https://react.syncfusion.com/react-ui/numeric-textbox/#value-range):** Use `min` and `max` properties to restrict input within specific numeric ranges, with `strictMode` to automatically correct out-of-range values.

- **[Floating Label](https://react.syncfusion.com/react-ui/numeric-textbox/#float-label):** Implement floating label functionality using the `labelMode` property with modes `Never`, `Auto`, and `Always` to enhance form usability.

- **[Mouse Wheel Support](https://react.syncfusion.com/react-ui/numeric-textbox/#mouse-wheel):** Enable mouse wheel scrolling via `mouseWheel` property to increment or decrement values, with `invertMouseWheel` to reverse scroll direction.

- **[Helper Text and Adornments](https://react.syncfusion.com/react-ui/numeric-textbox/#helper-text):** Support for `helperText` to display contextual messages and `prefix`/`suffix` properties for icons or unit labels such as currency symbols or percentage indicators.

- **[Value Parsing](https://react.syncfusion.com/react-ui/numeric-textbox/#value-parsing):** Define custom formatting and parsing methods to transform user input, for example converting miles to kilometers on the fly.

- **[Validate on Type](https://react.syncfusion.com/react-ui/numeric-textbox/#validate-on-type):** Restrict typing to the configured precision using the `validateOnType` property, ensuring decimal values conform to the specified number of decimal places as the user types.

- **[Sizes](https://react.syncfusion.com/react-ui/numeric-textbox/#sizes):** Control the input dimensions using the `size` property with options `Small`, `Medium` (default), and `Large`.

**Usage**

```tsx
import { NumericTextBox } from "@syncfusion/react-inputs";

export default function App() {
  return (
    <NumericTextBox
      placeholder="Enter value"
      defaultValue={100}
      min={0}
      max={1000}
      step={10}
      format="c2"
      spinButton={true}
      helperText="Enter a value between 0 and 1000"
    />
  );
}
```

**Resources**

- [Numeric TextBox Demo/Docs](https://react.syncfusion.com/react-ui/numeric-textbox/)
- [Numeric TextBox API](https://react.syncfusion.com/api/numeric-textbox/overview/)

## React TextArea

The TextArea component enables users to enter and display multiple lines of text with enhanced functionality for collecting longer text content.

### Key Features

- **[Variants](https://react.syncfusion.com/react-ui/textarea/#variants):** Three distinct visual styles using the `variant` property: `Standard` (default), `Outlined`, and `Filled` to match application design language.

- **[Resizing Options](https://react.syncfusion.com/react-ui/textarea/#resizing):** Control resize behavior using the `resizeMode` property with options `Both` (default), `Horizontal`, `Vertical`, and `None` for flexible layout control.

- **[Auto Resizing](https://react.syncfusion.com/react-ui/textarea/#auto-resizing):** Enable automatic height adjustment as users type by setting `autoResize` to `true`, providing dynamic content accommodation.

- **[Floating Label](https://react.syncfusion.com/react-ui/textarea/#float-label):** Implement floating label functionality using the `labelMode` property with modes `Never`, `Auto`, and `Always` for improved form usability.

- **[Character Constraints](https://react.syncfusion.com/react-ui/textarea/#maximum-length):** Set input limits using `rows`, `cols`, and `maxLength` properties to control textarea dimensions and character count.

- **[Helper Text and Adornments](https://react.syncfusion.com/react-ui/textarea/#helper-text):** Support for `helperText` to display contextual messages, with `helperTextDirection` alignment options and `prefix`/`suffix` properties for visual enhancements.

- **[Form Support](https://react.syncfusion.com/react-ui/textarea/#form-support):** Integrates seamlessly with the `Form` component for validation and state management, driven by the `value`, `defaultValue`, and `onChange` properties.

**Usage**

```tsx
import { TextArea } from '@syncfusion/react-inputs';

export default function App() {
  return (
    <TextArea
      defaultValue="Enter your feedback..."
      placeholder="Share your thoughts"
      rows={5}
      cols={40}
      variant="Outlined"
      labelMode="Auto"
      maxLength={500}
      helperText="Maximum 500 characters"
      autoResize={true}
    />
  );
}
```

**Resources**

- [TextArea Demo/Docs](https://react.syncfusion.com/react-ui/textarea/)
- [TextArea API](https://react.syncfusion.com/api/textarea/overview/)

## React TextBox

The TextBox component provides a feature-rich input field for collecting user text input with enhanced styling options and validation states.

### Key Features

- **[Variants](https://react.syncfusion.com/react-ui/textbox/#variants):** Three distinct visual styles using the `variant` property: `Standard` (default), `Outlined`, and `Filled` to match application design language.

- **[Size Options](https://react.syncfusion.com/react-ui/textbox/#sizes):** Control dimensions using the `size` property with options `Small`, `Medium` (default), and `Large` for different UI contexts.

- **[Validation Color States](https://react.syncfusion.com/react-ui/textbox/#color):** Visually communicate validation states using the `color` property with options `Success`, `Warning`, and `Error` for user feedback.

- **[Prefix and Suffix Adornments](https://react.syncfusion.com/react-ui/textbox/#adornments):** Add custom icons or elements at the beginning or end of the input using `prefix` and `suffix` properties for enhanced visual cues.

- **[Floating Label](https://react.syncfusion.com/react-ui/textbox/#float-label):** Implement floating label functionality using the `labelMode` property with modes `Never`, `Auto`, and `Always` for improved form usability.

- **[Helper Text](https://react.syncfusion.com/react-ui/textbox/#helper-text):** Display contextual messages using `helperText` property with `helperTextDirection` alignment and `helperTextOnFocus` visibility control.

- **[Adaptive Rendering](https://react.syncfusion.com/react-ui/textbox/#adaptive-rendering):** Provide context-sensitive behavior through the native `type` attribute, supporting `text`, `password`, `email`, and other HTML input types.

- **[Form Support](https://react.syncfusion.com/react-ui/textbox/#form-support):** Integrates seamlessly with the `Form` component for validation and state management, driven by the `value`, `defaultValue`, and `onChange` properties.

**Usage**

```tsx
import { TextBox } from "@syncfusion/react-inputs";

export default function App() {
  return (
    <TextBox
      placeholder="Enter your name"
      defaultValue=""
      variant="Outlined"
      size="Medium"
      labelMode="Auto"
      helperText="Full name required"
      color="Success"
    />
  );
}
```

**Resources**

- [TextBox Demo/Docs](https://react.syncfusion.com/react-ui/textbox/)
- [TextBox API](https://react.syncfusion.com/api/textbox/overview/)

## React FileUpload

The FileUpload component enables users to select and upload files to a server with support for drag-and-drop, validation, chunk upload, and various file selection modes.

### Key Features

- **[Drag-and-Drop](https://react.syncfusion.com/react-ui/file-upload/#drag-and-drop):** Support native drag-and-drop file selection via the `dragDropEnabled` property (default `true`), with optional custom drop target through the `dropArea` ref.

- **[File Validation](https://react.syncfusion.com/react-ui/file-upload/#validations):** Built-in validation using `accept` for file types, `maxFileSize` and `minFileSize` for size limits, and `maxFiles` for file count restrictions, surfaced through the `onValidationError` event.

- **[Upload Modes](https://react.syncfusion.com/react-ui/file-upload/#upload-types):** Support for single file upload via `multiple` property, directory upload via `directory` property, and sequential upload via `sequential` property for controlled processing.

- **[Chunk Upload](https://react.syncfusion.com/react-ui/file-upload/#chunk-upload):** Split large files into configurable chunks using `chunkSize` property for resilient, resumable uploads with per-chunk pause, resume, and cancel controls.

- **[Auto Upload](https://react.syncfusion.com/react-ui/file-upload/#auto-upload):** Upload files immediately on selection by setting `autoUpload` to `true`, or queue files for manual upload via action buttons.

- **[Composition API](https://react.syncfusion.com/react-ui/file-upload/#fileupload-layout):** Customize UI with compound children—`BrowseButton`, `DragHint`, `FileList`, and `Actions`—to tailor trigger, hint, list, and action buttons.

- **[Custom File List](https://react.syncfusion.com/react-ui/file-upload/#file-list):** Render each file with a custom template by passing a function-as-child to `FileList`, which receives the current `FileItem` plus a `helpers` bundle for per-row `retry`, `cancel`, `remove`, `pause`, and `resume` actions.

- **[Preloaded Files](https://react.syncfusion.com/react-ui/file-upload/#preload-files):** Display already-uploaded files or initial file data using the `defaultFiles` property, useful when editing existing records.

- **[Form Support](https://react.syncfusion.com/react-ui/file-upload/#form-support):** Integrates seamlessly with the `Form` component to include file uploads within a validated form submission.

**Usage**

```tsx
import { FileUpload, BrowseButton, DragHint, Actions, UploadButton, ClearButton } from "@syncfusion/react-inputs";

export default function App() {
  return (
    <FileUpload
      saveUrl="https://services.syncfusion.com/react/production/api/FileUploader/Save"
      removeUrl="https://services.syncfusion.com/react/production/api/FileUploader/Remove"
      accept=".pdf,.doc,.docx"
      maxFileSize={5242880}
      multiple={true}
      autoUpload={false}
    >
      <BrowseButton>Select Files</BrowseButton>
      <DragHint>Or drag and drop files here</DragHint>
      <Actions>
        <UploadButton />
        <ClearButton />
      </Actions>
    </FileUpload>
  );
}
```

**Resources**

- [FileUpload Demo/Docs](https://react.syncfusion.com/react-ui/file-upload/)
- [FileUpload API](https://react.syncfusion.com/api/file-upload/overview/)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/inputs/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
