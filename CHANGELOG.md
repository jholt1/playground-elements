# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

<!--
   PRs should document their user-visible changes (if any) in the
   Unreleased section, uncommenting the header as necessary.
-->

<!-- ## [X.Y.Z] - YYYY-MM-DD -->
<!-- ## Unreleased -->
<!-- ### Changed -->
<!-- ### Added -->
<!-- ### Fixed -->
<!-- ### Removed -->

## [0.3.6] - 2020-12-08

### Fixed

- Fix shifted/hidden code in Safari when line numbers are enabled.

## [0.3.5] - 2020-12-03

### Fixed

- Fix `mwc-tab` race condition bug (dependency version bump).

## [0.3.4] - 2020-12-03

### Changed

- The playground service worker now serves its own 404s when a file is not
  found, instead of forwarding the request to the server.

### Fixed

- Fix race condition where preview could load too early and 404.
- Fix race condition where preview could sometimes never load.
- Fix preview 404 that could occur after leaving page idle for some time.

## [0.3.3] - 2020-12-01

### Fixed

- Fix Safari scrolling bug by limiting preview max-height.

## [0.3.2] - 2020-11-30

### Fixed

- Fix installation error relating to missing `node_modules/puppeteer` directory.

### Changed

- Bumped and un-pinned `@material/mwc` dependencies.

### Removed

- Removed some unnecessary files from NPM package.

## [0.3.1] - 2020-11-11

### Fixed

- Remove debugging log statement.
- Remove unecessary file from NPM package.

## [0.3.0] - 2020-11-11

### Changed

- [**BREAKING**] `service-worker.js` has been renamed to
  `playground-service-worker.js`, `typescript-worker.js` has been renamed to
  `playground-typescript-worker.js`, and an additional file called
  `playground-service-worker-proxy.html` is now also required. This change may
  affect bundling configurations.

### Added

- Service Workers and scripts are now able and advised to run on a second
  origin, in order to isolate arbitrary script execution from sensitive actions
  or data on the host origin.

  The `sandboxBaseUrl` property (or `sandbox-base-url` attribute) has been added
  `<playground-ide>` and `<playground-project>` to control this origin.

  If the default same origin is used, a warning will be logged to the console.

## [0.2.0] - 2020-10-28

### Changed

- [**BREAKING**] Replaced `theme` property with new custom property based
  theming system (see below).

- [**BREAKING**] Renamed CSS custom properties:
  - `playground-code-color` -> `playground-code-default-color`
  - `playground-file-editor-background-color` -> `playground-code-background`
  - `playground-file-picker-background-color` -> `playground-file-picker-background`
  - `playground-preview-toolbar-background-color` -> `playground-preview-toolbar-background`

### Added

- Added CSS Custom Properties for configuring the CodeMirror theme.

  Includes broad properties like `--playground-code-background` and
  `--playground-selection-color`, as well as token-specific properties like
  `--playground-code-keyword-color` and `--playground-code-string-color`.

  See the `themes/` directory for more examples of what can be customized.

- Added `themes/` directory which includes CSS files and JS modules for each of
  the standard CodeMirror themes, adapted to use CSS Custom Properties.

  Use the configurator at https://polymerlabs.github.io/playground-elements/ to
  try out the available themes.

  To load a theme, load its stylesheet into your document or shadow root scope,
  and set the corresponding `playground-theme-NAME` class on any playground
  element or ancestor.

  In HTML:

  ```html
  <head>
    <link
      rel="stylesheet"
      href="/node_modules/playground-elements/themes/mbo.css"
    />
  </head>

  <body class="playground-theme-mbo">
    <playground-ide></playground-ide>
  </body>
  ```

  In a LitElement:

  ```js
  import mbo from 'playground-elements/themes/mbo.css.js';

  class MyElement extends LitElement {
    static styles = [mbo, css`...`];

    render() {
      return `
        <playground-ide class="playground-theme-mbo">
        </playground-ide>
      `;
    }
  }
  ```

### Fixed

- Fix inconsistent line-number guttter sizing.

## [0.1.1] - 2020-10-26

### Added

- Added `--playground-preview-size` CSS custom property to control the initial
  size of the RHS preview bar in `<playground-ide>`. The LHS editor will take up
  all additional space. Defaults to `30%`.

- Added `resizable` property/attribute which allows users to click and drag in
  the space between the LHS editor and RHS preview of `<playground-ide>` to
  change their relative sizes.

### Fixed

- Invalid module import paths.
- Reload button icon now respects `--playground-preview-toolbar-foreground-color`.

### Changed

- TypeScript decorator runtime is now imported from `tslib` instead of inlined.

## [0.1.0] - 2020-10-24

- [**BREAKING**] NPM package and GitHub repo renamed from `code-sample-editor`
  to `playground-elements`.

- [**BREAKING**] Renamed all elements:

  - `<code-sample> -> <playground-ide>`
  - `<code-sample-project>` -> `<playground-project>`
  - `<code-sample-editor>` -> `<playground-file-editor>`
  - `<codemirror-editor>` -> `<playground-code-editor>`

- [**BREAKING**] Renamed all element JS modules:
  - `./lib/code-sample.js` -> `./playground-ide.js`
  - `./lib/code-sample-project.js` -> `./playground-project.js`
  - `./lib/code-sample-editor.js` -> `./playground-file-editor.js`
  - `./lib/codemirror-editor.js` -> `./playground-code-editor.js`

## [0.1.0-pre.4] - 2020-10-22

### Changed

- [**BREAKING**] Major refactor of elements to allow them to be more easily used
  independently. The new elements are:

  - `<code-sample>`: A single editor with file-selection bar and preview in
    side-by-side layout. If a different layout is required, the editor and
    preview elements can instead be used directly, along with a project element.
    New equivalent of what used to be `<code-sample-editor>`.

  - `<code-sample-project>`: New purely abstract element that coordinates
    between the service worker, editor elements, and preview elements.

  - `<code-sample-editor>`: An editor with file-selection bar, tied to a project
    element. New equivalent to the left-hand-side side of what used to be
    `<code-sample-editor>`.

  - `<code-sample-preview>`: A rendered HTML preview window, tied to a project
    element. New equivalent to the right-hand-side of what used to be
    `<code-sample-editor-preview>`.

  - `<codemirror-editor>`: A pure CodeMirror editor, mostly unchanged from
    previous version.

  Example usage without `<code-sample>`:

  ```html
  <code-sample-project
    id="myProject"
    project-src="/demo/typescript/project.json"
  ></code-sample-project>
  <code-sample-editor project="myProject"></code-sample-editor>
  <code-sample-preview project="myProject"></code-sample-preview>
  ```

  The `project` property can either be an ID in the host scope (as shown above)
  or a direct reference to a `<code-sample-project>` element (which would allow
  the elements to live in different scopes).

- Downgraded from CodeMirror v6 to v5 in order to gain support for nested
  highlighting of HTML and CSS inside JS/TS. See
  https://github.com/lezer-parser/javascript/issues/3. Will upgrade back to 6
  once support is ready.

- The caret is now only displayed when an editor is on focus (previously it was
  always displayed).

- The `<code-sample>` side-by-side layout is now consistently 70%/30% (widths can be
  changed using the `editor` and `preview` CSS shadow parts).

### Added

- Add syntax highlighting of TypeScript files.

- Add syntax highlighting of nested HTML and CSS inside JS/TS.

- Add `filename` property/attribute to `<code-sample-editor>` which allows
  getting and setting the currently selected file.

- Add `noFilePicker` property (`no-file-picker` attribute) to
  `<code-sample-editor>` which disables the top file selection tab-bar.

- Add `lineNumbers` property (`line-numbers` attribute) to `<code-sample>`,
  `<code-sample-editor>`, and `<codemirror-editor>` which enables the
  left-hand-side gutter with line numbers. Off by default.

- Add a `<slot>` to `<code-sample-editor>` which will be displayed until the
  file is loaded. This facilitates pre-rendering syntax-highlighted code before
  both the element has upgraded, and before the project file has been fetched.

- Add a `<slot>` to `<code-sample-preview>` which will be displayed until the
  preview iframe has loaded for the first time. This facilitates pre-rendering
  preview HTML both before both the element has upgraded, and before the live
  preview first renders.

- Add `label` property and attribute to project files. When set, the file picker
  will display this label instead of the filename.

- An animated progress bar now displays when a preview is loading.

- Added CSS Shadow Parts:

  - `<code-sample-editor>`: `file-picker`
  - `<code-sample-preview>`: `preview-toolbar`, `preview-location`, `preview-reload-button`, `preview-loading-indicator`
  - `<code-sample>`: `editor`, `preview`, `file-picker`, `preview-toolbar`, `preview-location`, `preview-reload-button`, `preview-loading-indicator`

- Added CSS Custom Properties:

  - `--playground-code-font-family`
  - `--playground-code-font-size`
  - `--playground-editor-background-color`
  - `--playground-file-picker-background-color`
  - `--playground-file-picker-foreground-color`
  - `--playground-preview-toolbar-background-color`
  - `--playground-preview-toolbar-foreground-color`
  - `--playground-border`
  - `--playground-highlight-color`
  - `--playground-bar-height`

- Added `theme` property to `<code-sample>`, `<code-sample-editor>`, and
  `<codemirror-editor>`, which sets the theme (currently only `default`,
  `monokai`, `ambiance`, `ayu-mirage` are available, but a way to load other
  themes will follow).

- Previews will now automatically reload on changes (0.5 second debounce).

- Added `readonly` property/attribute to `<codemirror-editor>` which disables
  the ability to edit.

### Fixed

- Fix absent CSS syntax highlighting.
- Fix various styling/layout glitches.
- Fix service worker and TypeScript worker URLs, which reached up too many
  parent directories.

## [0.1.0-pre.3] - 2020-10-05

### Fixed

- Fix missing CodeMirror styles on Firefox and Safari.
- Fix Safari crashes in `<mwc-tab>` code.

## [0.1.0-pre.2] - 2020-09-12

### Fixed

- Fix extra/missing files.

## [0.1.0-pre.1] - 2020-09-12

- Initial release.
