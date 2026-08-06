# React Schedule Component

Welcome to the React Schedule Component repository! This repository help you get started quickly and maintain productivity.

## Prerequisites

Before you dive in, make sure your environment is set up correctly:

1. **Node.js**: Ensure you have version `v20.18.1 (LTS)` installed. This specific version guarantees compatibility with the tools and dependencies in this repository.

2. **Gulp**: Install globally or locally in your project.

You can verify your Node.js version by running:

```sh
node -v
```

If you need to install or switch to Node.js `v20.18.1 (LTS)`, tools like [nvm](https://github.com/coreybutler/nvm-windows) can help manage your versions.

## Compilation

Turning your TypeScript (TS) into JavaScript (JS) is a breeze:

1. Ensure you’ve got `gulp` installed (globally or locally).

2. Fire up this command:

    ```sh
    npm run build
    ```

Boom! Your JS files are generated from your TS source, and styles are compiled as well. Let’s build something awesome!

## Running Jest Tests

Ready to put your components to the test? Let’s make sure they’re solid:

1. First, compile your files with:

    ```sh
    npm run build
    ```

2. Then, run those tests:

    ```sh
    npm test
    ```

And that’s it! You’ll get detailed feedback, so your code stays top-notch.

## Using Storybook

Want to see your components in action? Storybook is here to help:

1. Start by building the project:

    ```sh
    npm run build
    ```

2. Then, launch Storybook:

    ```sh
    npm run samples
    ```

This kicks off a Storybook server where you can explore, tweak, and test your components right in the browser. It’s as fun as it is useful!
