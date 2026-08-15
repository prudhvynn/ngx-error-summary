import { AbstractControl, FormArray, FormGroup } from '@angular/forms';
import { ErrorSummaryConfig, resolveMessage } from './messages';
import { FieldError } from './models';

/** Labels attached via the `nesLabel` input, keyed by control. */
const LABELS = new WeakMap<AbstractControl, string>();

/** Associates a human-readable label with a control, used in generated messages. */
export function setControlLabel(control: AbstractControl, label: string): void {
  LABELS.set(control, label);
}

/** `address.postalCode` -> `Postal code`; `items.0.title` -> `Title`. */
export function humanisePath(path: string): string {
  const leaf =
    path
      .split('.')
      .filter((part) => !/^\d+$/.test(part))
      .pop() ?? path;
  const spaced = leaf
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    // Sentence case, not title case: the label is interpolated mid-sentence by
    // messages like `${label} must be 8 characters or more`.
    .toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function labelFor(control: AbstractControl, path: string): string {
  // The root itself has no path; cross-field errors on it read as form-level.
  return LABELS.get(control) ?? (path === '' ? 'This form' : humanisePath(path));
}

/**
 * Walks a form depth-first and returns every failed validator on every control,
 * in DOM-declaration order — which is the order the summary must list them in
 * for the "skip to the first problem" flow to make sense to a screen reader.
 *
 * Group-level errors (cross-field validators) are reported against the group's
 * own path, so a `dateRange` error on a group surfaces rather than vanishing.
 */
export function collectErrors(
  root: AbstractControl,
  config: Required<ErrorSummaryConfig>,
  options: { readonly includeUntouched?: boolean; readonly basePath?: string } = {},
): FieldError[] {
  const includeUntouched = options.includeUntouched ?? true;
  const out: FieldError[] = [];

  const visit = (control: AbstractControl, path: string): void => {
    // A disabled control is excluded from validation entirely; skip its subtree.
    if (control.disabled) return;

    if (control.errors && (includeUntouched || control.touched || control.dirty)) {
      const label = labelFor(control, path);
      for (const [key, error] of Object.entries(control.errors)) {
        out.push({
          path,
          key,
          error,
          message: resolveMessage({ path, key, error, control, label }, config),
        });
      }
    }

    if (control instanceof FormGroup) {
      for (const [name, child] of Object.entries(control.controls)) {
        visit(child, path ? `${path}.${name}` : name);
      }
    } else if (control instanceof FormArray) {
      control.controls.forEach((child, i) => visit(child, `${path}.${i}`));
    }
  };

  visit(root, options.basePath ?? '');
  return out;
}
