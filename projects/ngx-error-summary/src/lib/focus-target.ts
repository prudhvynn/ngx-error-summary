/**
 * Finds the DOM element a summary entry should send focus to.
 *
 * Deliberately convention-based rather than registry-based: any markup works as
 * long as one of these holds, and nothing has to be wired up per field.
 *
 *   1. an element whose `id` is the control path (`address.postalCode`)
 *   2. an element carrying `[formControlName]` for the leaf segment
 *   3. an element carrying `[data-nes-field]` for the full path
 *
 * Radio groups and checkbox groups resolve to their first input, which is the
 * correct focus target for a fieldset.
 */
export function findFocusTarget(host: ParentNode, path: string): HTMLElement | null {
  const leaf = path.split('.').pop() ?? path;

  const byId = host.querySelector<HTMLElement>(`[id="${cssEscape(path)}"]`);
  if (byId) return byId;

  const byData = host.querySelector<HTMLElement>(`[data-nes-field="${cssEscape(path)}"]`);
  if (byData) return byData;

  const byControlName = host.querySelector<HTMLElement>(
    `[formControlName="${cssEscape(leaf)}"]`,
  );
  if (byControlName) return byControlName;

  return null;
}

/** Focuses an element, making it programmatically focusable if it is not already. */
export function focusElement(el: HTMLElement): void {
  if (!el.hasAttribute('tabindex') && !isNativelyFocusable(el)) {
    el.setAttribute('tabindex', '-1');
  }
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function isNativelyFocusable(el: HTMLElement): boolean {
  return /^(input|select|textarea|button|a)$/i.test(el.tagName);
}

/**
 * Values are always interpolated inside a quoted attribute selector, so only the
 * quote and backslash need escaping — `CSS.escape` is for bare identifiers and
 * would mangle the dots in a control path.
 */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, String.raw`\$&`);
}
