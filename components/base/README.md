# React Base Library

The `@syncfusion/react-base` package is a foundational library for Syncfusion's Essential® Studio React components. It provides core utilities, providers, and functions to support the development of feature-rich React applications.

**Key Features**

- `Animation`: Smooth and customizable animations for UI components.
- `Ripple Effect`: The ripple effects for interactive elements.
- `Internationalization`: Support for multiple languages and locales.
- `Localization`: Adaptable content for region-specific requirements.
- `Right-to-Left (RTL)`: Built-in support for RTL languages like Arabic and Hebrew.

**Setup**

To install `@syncfusion/react-base` and its dependencies, run the following command:

```sh
npm install @syncfusion/react-base
```

**Usage**

This package serves as a dependency for other Syncfusion® React components. Import the necessary utilities or providers as needed in your React application. For example:

```tsx
import { Provider } from '@syncfusion/react-base';
import { Button } from '@syncfusion/react-buttons';

<Provider locale={'en-US'} dir={'ltr'} ripple={false}>
  <Button>Submit</Button>
</Provider>
```

**Resources**

- [Base Demo/Docs](https://react.syncfusion.com/common-features/right-to-left)
- [Base API](https://react-api.syncfusion.com/base/overview)

## Support

Product support is available through following mediums.

* [Support ticket](https://support.syncfusion.com/support/tickets/create) - Guaranteed Response in 24 hours | Unlimited tickets | Holiday support
* Live chat

## Changelog
Check the changelog [here](https://github.com/syncfusion/react-ui-components/blob/master/components/base/CHANGELOG.md). Get minor improvements and bug fixes every week to stay up to date with frequent updates.

## License and copyright

> This is a commercial product and requires a paid license for possession or use. Syncfusion’s licensed software, including this component, is subject to the terms and conditions of Syncfusion's [EULA](https://www.syncfusion.com/eula/es/). To acquire a license for [React UI components](https://www.syncfusion.com/react-components), you can [purchase](https://www.syncfusion.com/sales/products) or [start a free 30-day trial](https://www.syncfusion.com/account/manage-trials/start-trials).

> A [free community license](https://www.syncfusion.com/products/communitylicense) is also available for companies and individuals whose organizations have less than $1 million USD in annual gross revenue and five or fewer developers.

See [LICENSE FILE](https://github.com/syncfusion/react-ui-components/blob/master/license?utm_source=npm&utm_campaign=notification) for more info.

&copy; Copyright 2025 Syncfusion®, Inc. All Rights Reserved. The Syncfusion® Essential® Studio license and copyright applies to this distribution.
