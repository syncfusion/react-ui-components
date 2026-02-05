# Changelog

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
