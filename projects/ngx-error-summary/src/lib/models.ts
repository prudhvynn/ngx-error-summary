import { AbstractControl } from '@angular/forms';

/**
 * One validation failure, resolved to display-ready text.
 *
 * This is the protocol the whole library speaks: the summary block, the inline
 * message directive, and any custom renderer all consume this same shape, which
 * is what keeps summary text and inline text from drifting apart.
 */
export interface FieldError {
  /** Dotted reactive-form path, e.g. `address.postalCode` or `items.0.title`. */
  readonly path: string;
  /** The validator key that failed, e.g. `required`, `minlength`. */
  readonly key: string;
  /** Human-readable message. */
  readonly message: string;
  /** Raw validator payload, e.g. `{ requiredLength: 3, actualLength: 1 }`. */
  readonly error: unknown;
}

/** Context handed to a message resolver for a single failed validator. */
export interface ErrorMessageContext {
  readonly path: string;
  readonly key: string;
  readonly error: unknown;
  readonly control: AbstractControl;
  /**
   * Field label, when one can be determined — read from the control's
   * `nesLabel` metadata or falling back to a humanised path segment.
   */
  readonly label: string;
}

/**
 * Turns a failed validator into a message. Return `null` to defer to the next
 * resolver in the chain (and ultimately to the built-in defaults).
 */
export type ErrorMessageResolver = (ctx: ErrorMessageContext) => string | null;

/** Map of validator key to message or message factory. */
export type ErrorMessageMap = Record<
  string,
  string | ((ctx: ErrorMessageContext) => string)
>;
