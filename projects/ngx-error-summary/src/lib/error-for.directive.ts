import { Directive, computed, effect, inject, input, signal } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { collectErrors, setControlLabel } from './collect-errors';
import { ERROR_SUMMARY_CONFIG, resolveErrorSummaryConfig } from './messages';

/**
 * Inline message for a single control, resolved through the exact same pipeline
 * as the summary block — so the two can never disagree about wording.
 *
 * ```html
 * <input id="email" formControlName="email" />
 * <span nesErrorFor="email" nesLabel="Email address"></span>
 * ```
 */
@Directive({
  selector: '[nesErrorFor]',
  host: {
    '[textContent]': 'message()',
    '[hidden]': '!message()',
    '[attr.role]': 'message() ? "alert" : null',
  },
})
export class ErrorForDirective {
  private readonly config =
    inject(ERROR_SUMMARY_CONFIG, { optional: true }) ?? resolveErrorSummaryConfig();
  private readonly container = inject(ControlContainer, { optional: true, skipSelf: true });

  /** Control name or dotted path, relative to the enclosing form group. */
  readonly nesErrorFor = input.required<string>();

  /** Label used when generating the message. Defaults to a humanised path. */
  readonly nesLabel = input<string>();

  /** Show before the user has touched the field. Off by default. */
  readonly nesEager = input(false);

  private readonly revision = signal(0);

  protected readonly message = computed<string>(() => {
    this.revision();

    const root = this.container?.control;
    if (!root) return '';

    const control = root.get(this.nesErrorFor());
    if (!control || control.valid || control.disabled) return '';
    if (!this.nesEager() && !control.touched && !control.dirty) return '';

    // Report only the first failure; stacking every validator on one field is
    // noise, and the summary already lists them all.
    return (
      collectErrors(control, this.config, {
        includeUntouched: true,
        basePath: this.nesErrorFor(),
      })[0]?.message ?? ''
    );
  });

  constructor() {
    effect((onCleanup) => {
      const root = this.container?.control;
      if (!root) return;
      const sub = root.events.subscribe(() => this.revision.update((r) => r + 1));
      onCleanup(() => sub.unsubscribe());
    });

    // Label registration is a write into shared state, so it stays out of the
    // computed and runs as an explicit effect instead.
    effect(() => {
      const label = this.nesLabel();
      const control = this.container?.control?.get(this.nesErrorFor());
      if (label && control) setControlLabel(control, label);
    });
  }
}
