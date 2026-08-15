import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { collectErrors } from './collect-errors';
import { findFocusTarget, focusElement } from './focus-target';
import { ERROR_SUMMARY_CONFIG, resolveErrorSummaryConfig } from './messages';
import { FieldError } from './models';

/**
 * Accessible validation summary for reactive forms.
 *
 * ```html
 * <form [formGroup]="form" (ngSubmit)="submit()">
 *   <nes-error-summary [form]="form" [show]="submitted()" />
 *   ...
 * </form>
 * ```
 *
 * Behaviour follows the established a11y pattern: the block is only rendered
 * once `show` is true, it takes focus the moment it appears, and each entry is a
 * real link that moves focus to the offending field.
 */
@Component({
  selector: 'nes-error-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-empty]': 'errors().length === 0 ? "" : null' },
  template: `
    @if (show() && errors().length) {
      <div #box class="nes-summary" role="alert" tabindex="-1" [attr.aria-labelledby]="headingId">
        <h2 class="nes-summary__heading" [id]="headingId">{{ heading() }}</h2>
        <ul class="nes-summary__list">
          @for (error of errors(); track error.path + error.key) {
            <li>
              <a
                class="nes-summary__link"
                [href]="'#' + error.path"
                (click)="goTo($event, error)"
                >{{ error.message }}</a
              >
            </li>
          }
        </ul>
      </div>
    }
  `,
  styles: `
    .nes-summary {
      border: 4px solid currentColor;
      padding: 1rem;
      margin-block-end: 1.5rem;
    }
    .nes-summary:focus-visible {
      outline: 3px solid;
      outline-offset: 2px;
    }
    .nes-summary__heading {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
    }
    .nes-summary__list {
      margin: 0;
      padding-inline-start: 1.25rem;
    }
  `,
})
export class ErrorSummaryComponent {
  private readonly config =
    inject(ERROR_SUMMARY_CONFIG, { optional: true }) ?? resolveErrorSummaryConfig();
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** The form (or any control) to report on. */
  readonly form = input.required<AbstractControl>();

  /** Render the summary. Drive this from your submitted flag. */
  readonly show = input(false);

  /** Overrides the app-wide heading. */
  readonly heading = input(this.config.heading);

  /** Report errors on untouched controls too — correct after a submit attempt. */
  readonly includeUntouched = input(true);

  /** Emits when a summary entry is activated, after focus has moved. */
  readonly navigated = output<FieldError>();

  protected readonly headingId = `nes-summary-heading-${nextId++}`;

  /** Bumped on every form status/value event so `errors` recomputes. */
  private readonly revision = signal(0);

  protected readonly errors = computed<FieldError[]>(() => {
    this.revision();
    return collectErrors(this.form(), this.config, {
      includeUntouched: this.includeUntouched(),
    });
  });

  constructor() {
    // Reactive forms are not signal-based, so bridge their event stream.
    effect((onCleanup) => {
      const sub = this.form().events.subscribe(() => this.revision.update((r) => r + 1));
      onCleanup(() => sub.unsubscribe());
    });

    // Move focus to the summary as it appears — without this a screen reader
    // user is left at the submit button with no idea the page changed.
    effect(() => {
      const visible = this.show() && this.errors().length > 0;
      if (!visible) return;
      untracked(() => {
        queueMicrotask(() => {
          const box = this.hostRef.nativeElement.querySelector<HTMLElement>('.nes-summary');
          box?.focus({ preventScroll: false });
        });
      });
    });
  }

  protected goTo(event: Event, error: FieldError): void {
    const host = this.hostRef.nativeElement.closest('form') ?? document;
    const target = findFocusTarget(host, error.path);
    if (!target) return; // no matching field — let the href fall through

    event.preventDefault();
    focusElement(target);
    this.navigated.emit(error);
  }
}

let nextId = 0;
