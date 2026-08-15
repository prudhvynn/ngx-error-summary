# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-08-14

No library code changed in this release. npm renders a package's README and
keywords from the published tarball, so the discoverability work landed in
0.2.0's repository but never reached the npm page; this publishes it.

### Changed

- README now leads with badges, a link to the live demo, and a short summary of
  what the library does, so the npm page answers "what is this and does it
  work" without scrolling.
- npm keywords broadened from ten to twenty, covering the terms people actually
  search for — `form-validation`, `angular-forms`, `screen-reader`, `aria`,
  `focus-management`, `validation-messages`.

## [0.2.0] - 2026-08-14

### Added

- The summary block is now fully themeable through CSS custom properties —
  colour, background, border, radius, padding, spacing, heading size, link
  colour and focus ring. Defaults are unchanged; every previously hard-coded
  value simply became a `var()` with that value as its fallback.

  Custom properties rather than documented class overrides, because the
  component uses emulated encapsulation: Angular rewrites `.nes-summary` to
  `.nes-summary[_ngcontent-xyz]`, which outranks a consumer's own
  `.nes-summary` rule. Restyling previously meant `::ng-deep` or `!important`.
  See the Styling section of the README for the full list.

- `headingLevel` input and matching `provideErrorSummary({ headingLevel })`
  option. The heading was a hard-coded `<h2>`, which silently broke the
  document outline whenever the summary sat under an existing `h2` — the outline
  screen reader users navigate by, in a library whose whole purpose is serving
  them. Levels 1–6 render real `<h1>`–`<h6>` elements rather than
  `role="heading"` with `aria-level`, because native semantics have better
  assistive-technology support. Defaults to `2`, so existing markup is
  unaffected.

## [0.1.1] - 2026-08-14

### Fixed

- `findFocusTarget`'s documented fallback order did not match its behaviour. It
  tries `id`, then `data-nes-field`, then `formControlName` — full-path matches
  before the leaf-name match, so a field name repeated across nested groups
  resolves to the right element. The code was already correct; the doc comment,
  which ships in the type definitions and appears on hover, was not. The order is
  now covered by a test.

### Changed

- The `>=19.0.0` peer range is now verified rather than asserted. CI builds a
  real application on Angular 19, 20, and 21 and AOT-compiles it against the
  packed tarball, so the consumer's Angular linker has to process every
  declaration in the package. No supported-version change: 19 and 20 both
  already worked.

## [0.1.0] - 2026-08-14

Initial release.

### Added

- `ErrorSummaryComponent` (`<nes-error-summary>`) — accessible validation summary
  that renders on submit, takes focus as it appears, and links each entry to its
  field. Emits `navigated` once focus has moved.
- `ErrorForDirective` (`[nesErrorFor]`) — inline per-field message resolved through
  the same pipeline as the summary, so the two cannot disagree about wording.
- `provideErrorSummary()` — app-wide configuration of heading copy, per-validator
  messages, and custom resolvers.
- `collectErrors()` — depth-first walk of a form returning every failed validator
  in declaration order, including cross-field errors on groups.
- Default messages for Angular's built-in validators (`required`, `requiredTrue`,
  `email`, `min`, `max`, `minlength`, `maxlength`, `pattern`).
- Convention-based focus targeting by `id`, `data-nes-field`, or `formControlName`.

[0.1.0]: https://github.com/prudhvynn/ngx-error-summary/releases/tag/v0.1.0
