# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
