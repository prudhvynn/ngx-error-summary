import { FormControl } from '@angular/forms';
import {
  DEFAULT_ERROR_MESSAGES,
  provideErrorSummary,
  ERROR_SUMMARY_CONFIG,
  resolveErrorSummaryConfig,
  resolveMessage,
} from './messages';
import { ErrorMessageContext } from './models';

function ctx(partial: Partial<ErrorMessageContext> = {}): ErrorMessageContext {
  return {
    path: 'email',
    key: 'required',
    error: true,
    control: new FormControl(''),
    label: 'Email address',
    ...partial,
  };
}

describe('resolveErrorSummaryConfig', () => {
  it('fills in defaults when given nothing', () => {
    const config = resolveErrorSummaryConfig();

    expect(config.heading).toBe('There is a problem');
    expect(config.resolvers).toEqual([]);
    expect(config.messages['required']).toBe(DEFAULT_ERROR_MESSAGES['required']);
  });

  it('merges custom messages over the defaults rather than replacing them', () => {
    const config = resolveErrorSummaryConfig({
      messages: { required: () => 'Custom required' },
    });

    expect(resolveMessage(ctx({ key: 'required' }), config)).toBe('Custom required');
    // An untouched default key must survive the merge.
    expect(resolveMessage(ctx({ key: 'email' }), config)).toBe(
      'Enter an email address in the correct format, like name@example.com',
    );
  });
});

describe('resolveMessage precedence', () => {
  it('prefers a resolver over the message map', () => {
    const config = resolveErrorSummaryConfig({
      messages: { required: () => 'from map' },
      resolvers: [() => 'from resolver'],
    });

    expect(resolveMessage(ctx(), config)).toBe('from resolver');
  });

  it('falls through resolvers that return null, first non-null wins', () => {
    const config = resolveErrorSummaryConfig({
      resolvers: [() => null, () => 'second', () => 'third'],
    });

    expect(resolveMessage(ctx(), config)).toBe('second');
  });

  it('falls back to the message map when every resolver returns null', () => {
    const config = resolveErrorSummaryConfig({
      messages: { required: () => 'from map' },
      resolvers: [() => null, () => null],
    });

    expect(resolveMessage(ctx(), config)).toBe('from map');
  });

  it('supports a plain string entry in the message map', () => {
    const config = resolveErrorSummaryConfig({ messages: { required: 'Just a string' } });

    expect(resolveMessage(ctx(), config)).toBe('Just a string');
  });

  it('never fails silently on an unknown validator key', () => {
    const config = resolveErrorSummaryConfig();

    expect(resolveMessage(ctx({ key: 'someBespokeValidator' }), config)).toBe(
      'Email address is invalid',
    );
  });

  it('hands the resolver the full context', () => {
    const seen: ErrorMessageContext[] = [];
    const config = resolveErrorSummaryConfig({
      resolvers: [
        (c) => {
          seen.push(c);
          return null;
        },
      ],
    });
    const control = new FormControl('x');

    resolveMessage(
      ctx({ path: 'a.b', key: 'minlength', error: { requiredLength: 3 }, control }),
      config,
    );

    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      path: 'a.b',
      key: 'minlength',
      error: { requiredLength: 3 },
      label: 'Email address',
    });
    expect(seen[0].control).toBe(control);
  });
});

describe('DEFAULT_ERROR_MESSAGES', () => {
  it('lower-cases the label in the required message', () => {
    const config = resolveErrorSummaryConfig();

    expect(resolveMessage(ctx({ key: 'required', label: 'Email address' }), config)).toBe(
      'Enter email address',
    );
  });

  it('reads the validator payload for length and range errors', () => {
    const config = resolveErrorSummaryConfig();

    expect(
      resolveMessage(
        ctx({ key: 'minlength', error: { requiredLength: 8 }, label: 'Password' }),
        config,
      ),
    ).toBe('Password must be 8 characters or more');

    expect(resolveMessage(ctx({ key: 'max', error: { max: 100 }, label: 'Score' }), config)).toBe(
      'Enter a number no higher than 100',
    );
  });
});

describe('provideErrorSummary', () => {
  it('provides a fully resolved config under the token', () => {
    const providers = provideErrorSummary({ heading: 'Fix these' });

    expect(providers).toEqual([
      expect.objectContaining({
        provide: ERROR_SUMMARY_CONFIG,
        useValue: expect.objectContaining({ heading: 'Fix these' }),
      }),
    ]);
  });
});
