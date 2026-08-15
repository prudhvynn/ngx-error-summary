import { InjectionToken, Provider } from '@angular/core';
import { ErrorMessageContext, ErrorMessageMap, ErrorMessageResolver } from './models';

/** Messages for Angular's built-in validators. Override any of them via `provideErrorSummary`. */
export const DEFAULT_ERROR_MESSAGES: ErrorMessageMap = {
  required: ({ label }) => `Enter ${label.toLowerCase()}`,
  requiredTrue: ({ label }) => `Select ${label.toLowerCase()}`,
  email: () => 'Enter an email address in the correct format, like name@example.com',
  min: ({ error }) => `Enter a number no lower than ${(error as { min: number }).min}`,
  max: ({ error }) => `Enter a number no higher than ${(error as { max: number }).max}`,
  minlength: ({ label, error }) =>
    `${label} must be ${(error as { requiredLength: number }).requiredLength} characters or more`,
  maxlength: ({ label, error }) =>
    `${label} must be ${(error as { requiredLength: number }).requiredLength} characters or fewer`,
  pattern: ({ label }) => `${label} is not in the correct format`,
};

export interface ErrorSummaryConfig {
  /** Messages by validator key. Merged over `DEFAULT_ERROR_MESSAGES`. */
  readonly messages?: ErrorMessageMap;
  /** Resolvers run before the message map; first non-null wins. */
  readonly resolvers?: readonly ErrorMessageResolver[];
  /** Heading rendered above the summary list. */
  readonly heading?: string;
}

export const ERROR_SUMMARY_CONFIG = new InjectionToken<Required<ErrorSummaryConfig>>(
  'ERROR_SUMMARY_CONFIG',
);

/** Normalises a partial config, filling in defaults. */
export function resolveErrorSummaryConfig(
  config: ErrorSummaryConfig = {},
): Required<ErrorSummaryConfig> {
  return {
    messages: { ...DEFAULT_ERROR_MESSAGES, ...(config.messages ?? {}) },
    resolvers: config.resolvers ?? [],
    heading: config.heading ?? 'There is a problem',
  };
}

/** Registers app-wide error messages, resolvers and copy. */
export function provideErrorSummary(config: ErrorSummaryConfig = {}): Provider[] {
  return [{ provide: ERROR_SUMMARY_CONFIG, useValue: resolveErrorSummaryConfig(config) }];
}

/**
 * Resolves a message for one failed validator: custom resolvers first, then the
 * message map, then a last-resort fallback so a field never fails silently.
 */
export function resolveMessage(
  ctx: ErrorMessageContext,
  config: Required<ErrorSummaryConfig>,
): string {
  for (const resolver of config.resolvers) {
    const message = resolver(ctx);
    if (message !== null) return message;
  }

  const entry = config.messages[ctx.key];
  if (typeof entry === 'string') return entry;
  if (typeof entry === 'function') return entry(ctx);

  return `${ctx.label} is invalid`;
}
