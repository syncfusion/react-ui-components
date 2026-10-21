# Syncfusion React Notifications Components

The Syncfusion React Notifications package is a collection of UI components, including Message, Skeleton, and Toast, with animations, templates, and positioning to notify important information in React apps.

## Setup

```sh
npm install @syncfusion/react-notifications
```

Apply a theme by installing the corresponding theme package and importing its styles, for example with the [Material theme](https://www.npmjs.com/package/@syncfusion/react-material-theme):

```sh
npm install @syncfusion/react-material-theme
```

```css
/* App.css */
@import '../node_modules/@syncfusion/react-material-theme/styles/message/index.css';
```
> Note: For other components, use their corresponding index.css files from their respective style folders

## React Message

The Message component displays messages with visual severity levels, differentiating them with icons and colors to denote the importance and context of the message.

### Key Features

- **[Severity](https://react.syncfusion.com/react-ui/message/#severities):** Select the importance and context of the message to the user. Set the `severity` property to one of the `Normal`, `Success`, `Info`, `Warning`, or `Error` values, which also drive the icon and color.

- **[Variants](https://react.syncfusion.com/react-ui/message/#variants):** Choose a predefined appearance for the message. Set the `variant` property to `Standard`, `Outlined`, or `Filled` to control whether the severity is expressed through a light background, a border, or a dark background.

- **[Icons](https://react.syncfusion.com/react-ui/message/#icons):** Show, hide, or replace the icons on the message. Set the `icon` property to `false` to hide the severity icon, or pass a custom icon node. Set the `closeIcon` property to `true` or a custom node to display a dismiss button.

- **[Actions](https://react.syncfusion.com/react-ui/message/#actions):** Respond to user interaction with the `onClose` event, which triggers when the message is dismissed, so you can update state, log the interaction, or take follow-up actions.

- **[Customization](https://react.syncfusion.com/react-ui/message/#customization):** Adjust the content alignment to `center` or `right` with the built-in classes `sf-content-center` and `sf-content-right`, and override the default appearance by applying a custom class to the component.

- **[Template](https://react.syncfusion.com/react-ui/message/#template):** Customize the message content with a custom structure. Pass a string, a paragraph, or any HTML element as the child element of the Message component.

- **[Right-To-Left and Localization:](https://react.syncfusion.com/react-ui/message/#right-to-left)** Enable RTL rendering by setting the `dir` property to `rtl` in the `Provider` context, and localize the built-in text by setting the `locale` prop in the `Provider` context.

**Usage**

```tsx
import { Message, Severity } from '@syncfusion/react-notifications';

export default function App() {

  return (
    <Message severity={Severity.Success} closeIcon={true}>
      Your message has been sent successfully
    </Message>
  );
}
```

**Resources**

- [Message Demo/Docs](https://react.syncfusion.com/react-ui/message/)
- [Message API](https://react.syncfusion.com/api/message/overview/)

## React Toast

The Toast component displays temporary, non-intrusive notifications that appear briefly and dismiss automatically, so users are informed without their workflow being interrupted.

### Key Features

- **[Types](https://react.syncfusion.com/react-ui/toast/#types):** Display the Toast content with the distinct icons and colors that convey importance and context. Set the `severity` property to one of the `Success`, `Error`, `Warning`, or `Info` values.

- **[Placement](https://react.syncfusion.com/react-ui/toast/#toast-placement):** Position the Toast in a corner or a centered location on the screen. Configure the position with the `position` object using `xAxis` (`Left`, `Center`, or `Right`) and `yAxis` (`Top` or `Bottom`).

- **[Action Toast](https://react.syncfusion.com/react-ui/toast/#action-toast):** Add interactive buttons to the notification with the `actions` property to prompt the user for a response, such as `Undo` or `Confirm`, and run logic based on the choice.

- **Timeout and Progress Bar:** Configure how long the Toast stays visible before it auto-dismisses using the `timeout` property, and show a progress bar that tracks the remaining time with the `progressBar` and `progressDirection` properties. Pausing behavior is supported through the `extendedTimeout` property.

- **Animation Effects:** Apply entrance and exit motion when the Toast opens or closes. Configure the `animation` object with `show` and `hide` effects, each holding a `name`, `duration`, and `timingFunction`.

- **Multiple Stacking and Target:** Render several toasts at once and control their stacking order with the `newestOnTop` property. Render the Toast inside a specific element with the `target` property, or control its open state with the `open` property.

- **Toast Service:** Use the global `ToastProvider`, the `useToast` hook, or the imperative `show`/`hide` methods to display and manage Toasts from anywhere in the application without placing the component directly in the JSX.

**Usage**

```tsx
import { Toast } from "@syncfusion/react-notifications";

export default function App() {

  return (
    <Toast content="Operation completed successfully" open={true} position={{ xAxis: 'Right', yAxis: 'Bottom' }} />
  );
}
```

**Resources**

- [Toast Demo/Docs](https://react.syncfusion.com/react-ui/toast/)
- [Toast API](https://react.syncfusion.com/api/toast/overview/)

## React Skeleton

The Skeleton component renders a visual placeholder that simulates the layout of content while it is being loaded, improving the perceived performance of the application.

### Key Features

- **[Variants](https://react.syncfusion.com/react-ui/skeleton/#variants):** Choose from placeholder shapes that match the content being loaded. Set the `variant` property to one of the `Text`, `Circle`, `Square`, or `Rectangle` values.

- **[Animations](https://react.syncfusion.com/react-ui/skeleton/#animations):** Apply a loading animation for visual feedback during data retrieval. Set the `animation` property to `Wave`, `Fade`, `Pulse`, or `None`.

- **Customizable Dimensions:** Configure the size of the skeleton element with the `width` and `height` properties, accepting a pixel value or a CSS unit such as `'100px'` or `'50%'`.

- **[Color](https://react.syncfusion.com/react-ui/skeleton/#color):** Adjust the appearance of the placeholder by overriding the `background-color` CSS property.

**Usage**

```tsx
import { Skeleton, Variants, AnimationType } from '@syncfusion/react-notifications';

export default function App() {

  return (
    <Skeleton variant={Variants.Circle} width={50} height={50} animation={AnimationType.Wave} />
  );
}
```

**Resources**

- [Skeleton Demo/Docs](https://react.syncfusion.com/react-ui/skeleton/)
- [Skeleton API](https://react.syncfusion.com/api/skeleton/overview/)

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

Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/notifications/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2026 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential Studio® license and copyright applies to this distribution.
