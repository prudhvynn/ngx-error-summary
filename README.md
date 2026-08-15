# ngx-error-summary

Accessible validation error summary for Angular reactive forms.

Signal-based, zoneless-safe, standalone. The summary block and the inline field
messages resolve through **one** pipeline, so they can't drift out of sync — which
is the failure mode that makes most hand-rolled validation displays inaccessible.

```bash
npm install ngx-error-summary
```

## Why

Angular ships validators but no story for *presenting* failures accessibly. Teams
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

## API

| Export | Purpose |
| --- | --- |
| `<nes-error-summary [form] [show] [heading] [includeUntouched] (navigated)>` | The summary block |
| `[nesErrorFor]` + `[nesLabel]` `[nesEager]` | Inline message for one control |
| `provideErrorSummary(config)` | App-wide messages, resolvers, heading |
| `collectErrors(control, config, opts)` | The walker, if you want to render your own UI |
| `FieldError` | `{ path, key, message, error }` — the shared protocol |
| `ErrorMessageResolver` | `(ctx) => string \| null`, chained before the message map |

Nested groups and `FormArray`s are walked depth-first in declaration order, so the
summary lists problems in the order they appear on screen. Group-level
(cross-field) errors are reported against the group's own path rather than being
dropped. Disabled subtrees are skipped, matching Angular's own validation.

## Licence

MIT
