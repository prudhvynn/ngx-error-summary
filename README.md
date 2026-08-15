# ngx-error-summary

Accessible validation error summary for Angular reactive forms.

Signal-based, zoneless-safe, standalone. The summary block and the inline field
messages resolve through **one** pipeline, so they can't drift out of sync — which
is the failure mode that makes most hand-rolled validation displays inaccessible.

```bash
npm install ngx-error-summary
```

## Why

Angular ships validators but no story for _presenting_ failures accessibly. Teams
end up hand-writing a summary block, hand-writing inline messages, and letting the
two disagree. Screen reader users then get a summary that says one thing and a
field that says another — or no announcement at all, because focus never moved.

This library implements the established pattern (summary on submit, focus moves to
it, each entry links to its field) as a signal-driven primitive.

## Usage

Register your copy once:

```ts
import { provideErrorSummary } from 'ngx-error-summary';

bootstrapApplication(App, {
  providers: [
    provideErrorSummary({
      heading: 'There is a problem',
      messages: {
        required: ({ label }) => `Enter ${label.toLowerCase()}`,
        productCode: () => 'Product code must look like AB-1234',
      },
    }),
  ],
});
```

Then in the form:

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <nes-error-summary [form]="form" [show]="submitted()" />

  <label for="email">Email address</label>
  <input id="email" formControlName="email" />
  <span nesErrorFor="email" nesLabel="Email address"></span>

  <button type="submit">Continue</button>
</form>
```

```ts
protected readonly submitted = signal(false);

protected submit(): void {
  this.submitted.set(true);
  if (this.form.invalid) return;   // summary appears and takes focus
  // ...
}
```

## How fields are located

Summary entries move focus to the offending control. Resolution is
convention-based, so nothing needs registering — the first match wins:

1. `[id]` equal to the control path (`address.postalCode`)
2. `[data-nes-field]` equal to the control path
3. `[formControlName]` equal to the leaf segment

## Styling

Every painted value is a CSS custom property, so you restyle the summary from
anywhere in your app — no `::ng-deep`, no `!important`, no specificity fight:

```css
:root {
  --nes-summary-color: #b00020;
  --nes-summary-border-color: #b00020;
  --nes-summary-background: #fff5f5;
  --nes-summary-padding: 1.5rem;
}
```

Scope them like any other custom property — set them on `:root` for the whole
app, or on a wrapper to restyle one form.

| Custom property               | Default        | Applies to                     |
| ----------------------------- | -------------- | ------------------------------ |
| `--nes-summary-color`         | `inherit`      | Text colour of the whole block |
| `--nes-summary-background`    | `transparent`  | Block background               |
| `--nes-summary-border-width`  | `4px`          | Border thickness               |
| `--nes-summary-border-color`  | `currentColor` | Border colour                  |
| `--nes-summary-border-radius` | `0`            | Corner radius                  |
| `--nes-summary-padding`       | `1rem`         | Inner padding                  |
| `--nes-summary-gap`           | `1.5rem`       | Space below the block          |
| `--nes-summary-heading-size`  | `1.125rem`     | Heading font size              |
| `--nes-summary-heading-color` | `inherit`      | Heading colour                 |
| `--nes-summary-list-indent`   | `1.25rem`      | List indentation               |
| `--nes-summary-link-color`    | `inherit`      | Entry link colour              |
| `--nes-summary-focus-width`   | `3px`          | Focus ring thickness           |
| `--nes-summary-focus-color`   | `currentColor` | Focus ring colour              |
| `--nes-summary-focus-offset`  | `2px`          | Focus ring offset              |

Custom properties are used rather than plain class overrides because the
component uses emulated encapsulation: Angular rewrites `.nes-summary` to
`.nes-summary[_ngcontent-xyz]`, which outranks a consumer's own `.nes-summary`
rule. Custom properties inherit straight through that.

If you'd rather restyle from scratch, the markup carries stable class names —
`.nes-summary`, `.nes-summary__heading`, `.nes-summary__list`,
`.nes-summary__link` — and the host element gets `[data-empty]` when there is
nothing to report.

## Heading level

The summary renders a real heading element. Which level is right depends on the
page, not on the library — a summary inside a section already introduced by an
`h2` belongs at `h3`, or it breaks the document outline that screen reader users
navigate by.

```html
<nes-error-summary [form]="form" [show]="submitted()" [headingLevel]="3" />
```

Set the app-wide default through the provider, and override it per instance
where a page needs something different:

```ts
provideErrorSummary({ headingLevel: 3 });
```

Levels 1–6 render `<h1>`–`<h6>`; the default is `2`. Real heading elements are
used rather than `role="heading"` with `aria-level`, because native semantics
have better assistive-technology support.

## API

| Export                                                                                      | Purpose                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `<nes-error-summary [form] [show] [heading] [headingLevel] [includeUntouched] (navigated)>` | The summary block                                         |
| `[nesErrorFor]` + `[nesLabel]` `[nesEager]`                                                 | Inline message for one control                            |
| `provideErrorSummary(config)`                                                               | App-wide messages, resolvers, heading, heading level      |
| `collectErrors(control, config, opts)`                                                      | The walker, if you want to render your own UI             |
| `FieldError`                                                                                | `{ path, key, message, error }` — the shared protocol     |
| `ErrorMessageResolver`                                                                      | `(ctx) => string \| null`, chained before the message map |
| `HeadingLevel`                                                                              | `1 \| 2 \| 3 \| 4 \| 5 \| 6`                              |

Nested groups and `FormArray`s are walked depth-first in declaration order, so the
summary lists problems in the order they appear on screen. Group-level
(cross-field) errors are reported against the group's own path rather than being
dropped. Disabled subtrees are skipped, matching Angular's own validation.

## Licence

MIT
