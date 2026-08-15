import { FormArray, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { collectErrors, humanisePath, setControlLabel } from './collect-errors';
import { resolveErrorSummaryConfig } from './messages';

const config = resolveErrorSummaryConfig();

describe('humanisePath', () => {
  it('takes the leaf segment of a dotted path', () => {
    expect(humanisePath('address.postalCode')).toBe('Postal code');
  });

  it('skips numeric array indices so items read as fields', () => {
    expect(humanisePath('items.0.title')).toBe('Title');
  });

  it('splits camelCase and capitalises', () => {
    expect(humanisePath('firstName')).toBe('First name');
  });

  it('treats underscores and hyphens as word breaks', () => {
    expect(humanisePath('postal_code')).toBe('Postal code');
    expect(humanisePath('postal-code')).toBe('Postal code');
  });

  it('handles a single segment unchanged apart from casing', () => {
    expect(humanisePath('email')).toBe('Email');
  });
});

describe('collectErrors', () => {
  it('returns an empty list for a valid form', () => {
    const form = new FormGroup({ email: new FormControl('a@b.com') });

    expect(collectErrors(form, config)).toEqual([]);
  });

  it('reports one entry per failed validator on a control', () => {
    const form = new FormGroup({
      password: new FormControl('x', [Validators.minLength(8), Validators.pattern(/\d/)]),
    });

    const errors = collectErrors(form, config);

    expect(errors.map((e) => e.key).sort()).toEqual(['minlength', 'pattern']);
    expect(errors.every((e) => e.path === 'password')).toBe(true);
  });

  it('walks nested groups and builds dotted paths', () => {
    const form = new FormGroup({
      address: new FormGroup({
        postalCode: new FormControl('', Validators.required),
      }),
    });

    const errors = collectErrors(form, config);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('address.postalCode');
    expect(errors[0].message).toBe('Enter postal code');
  });

  it('walks form arrays and indexes their paths', () => {
    const form = new FormGroup({
      items: new FormArray([
        new FormGroup({ title: new FormControl('ok') }),
        new FormGroup({ title: new FormControl('', Validators.required) }),
      ]),
    });

    const errors = collectErrors(form, config);

    expect(errors).toHaveLength(1);
    expect(errors[0].path).toBe('items.1.title');
  });

  it('preserves declaration order, which is the order the summary lists', () => {
    const form = new FormGroup({
      first: new FormControl('', Validators.required),
      second: new FormControl('', Validators.required),
      third: new FormControl('', Validators.required),
    });

    expect(collectErrors(form, config).map((e) => e.path)).toEqual(['first', 'second', 'third']);
  });

  it('surfaces cross-field errors against the group path', () => {
    const group = new FormGroup(
      { start: new FormControl(2), end: new FormControl(1) },
      {
        validators: (c): ValidationErrors | null =>
          (c.get('start')!.value as number) > (c.get('end')!.value as number)
            ? { dateRange: true }
            : null,
      },
    );
    const form = new FormGroup({ range: group });

    const errors = collectErrors(form, config);

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ path: 'range', key: 'dateRange' });
  });

  it('labels a root-level cross-field error as the form itself', () => {
    const form = new FormGroup(
      { a: new FormControl('') },
      { validators: (): ValidationErrors => ({ mismatch: true }) },
    );

    const errors = collectErrors(form, config);

    expect(errors[0].path).toBe('');
    expect(errors[0].message).toBe('This form is invalid');
  });

  it('skips disabled controls and their whole subtree', () => {
    const nested = new FormGroup({ postalCode: new FormControl('', Validators.required) });
    const form = new FormGroup({
      email: new FormControl('', Validators.required),
      address: nested,
    });
    nested.disable();

    expect(collectErrors(form, config).map((e) => e.path)).toEqual(['email']);
  });

  it('includes untouched controls by default', () => {
    const form = new FormGroup({ email: new FormControl('', Validators.required) });

    expect(collectErrors(form, config)).toHaveLength(1);
  });

  it('excludes untouched, pristine controls when includeUntouched is false', () => {
    const form = new FormGroup({
      touchedField: new FormControl('', Validators.required),
      untouchedField: new FormControl('', Validators.required),
    });
    form.get('touchedField')!.markAsTouched();

    const errors = collectErrors(form, config, { includeUntouched: false });

    expect(errors.map((e) => e.path)).toEqual(['touchedField']);
  });

  it('counts a dirty-but-untouched control as reportable', () => {
    const form = new FormGroup({ email: new FormControl('', Validators.required) });
    form.get('email')!.markAsDirty();

    expect(collectErrors(form, config, { includeUntouched: false })).toHaveLength(1);
  });

  it('prefixes paths with basePath when given', () => {
    const form = new FormGroup({ email: new FormControl('', Validators.required) });

    expect(collectErrors(form, config, { basePath: 'section' })[0].path).toBe('section.email');
  });

  it('prefers an explicitly set label over the humanised path', () => {
    const control = new FormControl('', Validators.required);
    const form = new FormGroup({ emailAddr: control });
    setControlLabel(control, 'Work email');

    expect(collectErrors(form, config)[0].message).toBe('Enter work email');
  });

  it('carries the raw validator payload through untouched', () => {
    const form = new FormGroup({
      password: new FormControl('ab', Validators.minLength(8)),
    });

    expect(collectErrors(form, config)[0].error).toEqual({
      requiredLength: 8,
      actualLength: 2,
    });
  });
});
