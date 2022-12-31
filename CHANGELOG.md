
# Changelog

This package strictly follows [Semantic Versioning](https://semver.org).

## v2.0.3 (2022-12-31)

  * Fixed another broken HTML edge case that could result in the parser running very very slowly.

## v2.0.2 (2022-12-11)

  * Fixed multiple `<script>` parsing issues.
  * Fixed a few more HTML edge cases that were parsed much too slowly.

## v2.0.1 (2022-12-10)

  * Fixed a few broken HTML edge cases that could result in the parser running very very slowly.
  * Fixed a bug where strings like "<.>" were considered valid tags by the parser.

## v2.0.0 (2022-11-19)

### Breaking Changes

  * Switched from [parse5](https://www.npmjs.com/package/parse5) to a custom parser as default for HTML. This reduces
    the bundle size significantly for browser use. More spec compliant parsers are still supported with the new custom
    parser API.

### Features

  * Added support for custom parsers.

## v1.6.0 (2022-10-14)

### Features

  * Added boolean attribute support to `newTag` method (can be used like `DOM.newTag('input', {checked: true})`).

## v1.5.0 (2022-09-01)

### Features

  * Reduced dependencies so this package can also be used in browsers in the future.

## v1.4.0 (2022-06-21)

### Features

  * Switched to [@mojojs/util](https://www.npmjs.com/package/@mojojs/util) for utility functions.

## v1.3.0 (2022-06-11)

### Features

  * Added `replaceContent` method to `DOM` class.

## v1.2.0 (2022-02-13)

### Features

  * Added support for `SafeString` objects from [@mojojs/template](https://www.npmjs.com/package/@mojojs/template),
    which allow for strings to be excluded from HTML/XML escaping.

## v1.1.0 (2021-12-16)

### Features

  * Added support for deep cloning nodes.

### Bug Fixes

  * Fixed `<template>` tag rendering.

## v1.0.0 (2021-12-09)

First major release.
