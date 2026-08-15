import { findFocusTarget, focusElement } from './focus-target';

function host(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('findFocusTarget', () => {
  it('finds an element whose id is the full control path', () => {
    const root = host(`<input id="address.postalCode" />`);

    expect(findFocusTarget(root, 'address.postalCode')?.id).toBe('address.postalCode');
  });

  it('finds an element by data-nes-field for the full path', () => {
    const root = host(`<div data-nes-field="address.postalCode" id="x"></div>`);

    expect(findFocusTarget(root, 'address.postalCode')?.id).toBe('x');
  });

  it('falls back to formControlName on the leaf segment', () => {
    const root = host(`<input formControlName="postalCode" id="leaf" />`);

    expect(findFocusTarget(root, 'address.postalCode')?.id).toBe('leaf');
  });

  it('prefers an id match over the other strategies', () => {
    const root = host(`
      <input formControlName="email" id="by-name" />
      <input id="email" data-marker="by-id" />
    `);

    expect(findFocusTarget(root, 'email')?.getAttribute('data-marker')).toBe('by-id');
  });

  it('prefers a full-path data-nes-field match over a leaf formControlName match', () => {
    // A repeated field name inside a nested group must resolve to the right one.
    const root = host(`
      <input formControlName="line1" data-marker="wrong-group" />
      <div data-nes-field="address.line1" data-marker="right-group"></div>
    `);

    expect(findFocusTarget(root, 'address.line1')?.getAttribute('data-marker')).toBe('right-group');
  });

  it('returns the first input of a radio group', () => {
    const root = host(`
      <fieldset>
        <input type="radio" formControlName="colour" id="first" />
        <input type="radio" formControlName="colour" id="second" />
      </fieldset>
    `);

    expect(findFocusTarget(root, 'colour')?.id).toBe('first');
  });

  it('returns null when nothing matches', () => {
    const root = host(`<input id="other" />`);

    expect(findFocusTarget(root, 'missing')).toBeNull();
  });

  it('does not throw on a path containing selector metacharacters', () => {
    const root = host(`<input id="odd" />`);

    expect(() => findFocusTarget(root, 'weird"name')).not.toThrow();
    expect(() => findFocusTarget(root, 'back\\slash')).not.toThrow();
  });
});

describe('focusElement', () => {
  it('focuses a natively focusable element without adding tabindex', () => {
    const root = host(`<input id="email" />`);
    const input = root.querySelector<HTMLElement>('#email')!;

    focusElement(input);

    expect(document.activeElement).toBe(input);
    expect(input.hasAttribute('tabindex')).toBe(false);
  });

  it('makes a non-focusable element programmatically focusable', () => {
    const root = host(`<div id="group"></div>`);
    const div = root.querySelector<HTMLElement>('#group')!;

    focusElement(div);

    expect(div.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(div);
  });

  it('leaves an author-supplied tabindex alone', () => {
    const root = host(`<div id="group" tabindex="0"></div>`);
    const div = root.querySelector<HTMLElement>('#group')!;

    focusElement(div);

    expect(div.getAttribute('tabindex')).toBe('0');
  });
});
