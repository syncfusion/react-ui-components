# Changelog

## [Unreleased]

## 31.1.17 (2025-09-05)

### Toast

#### Breaking Changes

- The `PositionAxis` interface property names have been changed: `X` has been renamed to `xAxis` and `Y` has been renamed to `yAxis`.
- The `buttons` property has been renamed to `actions` for rendering template content at the bottom of the Toast.
- The animation configuration have been updated: `AnimationOptions` types for show and hide animations have been changed to `ToastAnimationProps`.

### Message

#### Breaking Changes

- The `Variant` enum value has been changed from `Text` to `Standard`. The available variants are now: Standard (previously Text), Outlined, Filled.

#### Features

- CSS for the Message component has been optimized.

## 29.2.4 (2025-05-14)

### Message

The Message component has an option to display the messages with severity by differentiating icons and colours to denote the importance and context of the message to the end user. The following key features are available in the Message component.

Explore the demo <a href="https://react.syncfusion.com/message" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Severity:** Provides an option to display the message with distinctive icons and colours based on the severity type. The available severity types such as Normal, Success, Info, Warning, and Error.

- **Variants:** Provides an option to display the message with predefined appearance variants. The available variants such as Text, Outlined, and Filled.

- **Visibility:** Provides an option to show or hide the message.

- **Template:** Provides an option to customize the content of the message.

### Skeleton

The Skeleton component provides a visual placeholder that simulates the layout of content while it's being loaded, improving the perceived performance of your application. It offers various shapes and animation effects to match your UI design needs.

Explore the demo <a href="https://react.syncfusion.com/skeleton" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Variants:** Choose from multiple placeholder shapes including Text, Circle, Square, and Rectangle to match the content being loaded.

- **Animation:**  Apply different loading animations such as Wave, Fade or Pulse to provide visual feedback during loading states.

- **Customizable Dimensions:** Easily configure the width and height of skeleton elements using CSS units or pixel values.

### Toast

The Toast component provides a non-intrusive way to display temporary notifications to users. It offers a flexible system for showing messages that automatically dismiss after a configurable timeout period.

Explore the demo <a href="https://react.syncfusion.com/toast" target="_blank" rel="noopener noreferrer">here</a>

**Key features**

- **Multiple Positions:** Position toasts at different locations on the screen (top-left, top-right, bottom-left, bottom-right, etc.) to suit your application's design.

- **Severity:** Display toasts with different severity levels (Success, Info, Warning, Error) with appropriate icons and colours to convey message importance.

- **Customizable Timeout:** Configure how long toasts remain visible before automatically dismissing.

- **Animation Effects:** Apply entrance and exit animations to enhance the user experience.

- **Global Toast Service:**  Use the ToastUtility or useToast hook to display toasts from anywhere in your application without needing to include the component in your JSX.