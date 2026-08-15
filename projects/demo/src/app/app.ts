import { JsonPipe } from '@angular/common';
import { Component, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ErrorForDirective, ErrorSummaryComponent, FieldError } from 'ngx-error-summary';

/** Bespoke validator whose key is wired to custom copy in app.config.ts. */
function productCode(control: AbstractControl): ValidationErrors | null {
  const value = (control.value as string) ?? '';
  return !value || /^[A-Z]{2}-\d{4}$/.test(value) ? null : { productCode: true };
}

/** Cross-field validator: reported against the group, not either child. */
function dateRange(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDate')?.value as string;
  const end = group.get('endDate')?.value as string;
  return start && end && end <= start ? { dateRange: true } : null;
}

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, ErrorSummaryComponent, ErrorForDirective, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly fb = new FormBuilder();

  readonly submitted = signal(false);
  readonly lastNavigation = signal<FieldError | null>(null);
  readonly submittedValue = signal<unknown>(null);

  readonly form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    sku: ['', [Validators.required, productCode]],
    address: this.fb.group({
      line1: ['', Validators.required],
      postalCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9 ]{3,8}$/)]],
    }),
    dates: this.fb.group(
      {
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
      },
      { validators: dateRange },
    ),
    attendees: this.fb.array([this.attendee()]),
  });

  get attendees(): FormArray {
    return this.form.get('attendees') as FormArray;
  }

  private attendee() {
    return this.fb.group({ name: ['', Validators.required] });
  }

  addAttendee(): void {
    this.attendees.push(this.attendee());
  }

  removeAttendee(index: number): void {
    this.attendees.removeAt(index);
  }

  submit(): void {
    this.submitted.set(true);
    this.submittedValue.set(null);

    if (this.form.invalid) {
      // Touch everything so the inline messages appear alongside the summary.
      this.form.markAllAsTouched();
      return;
    }

    this.submittedValue.set(this.form.value);
  }

  reset(): void {
    this.submitted.set(false);
    this.lastNavigation.set(null);
    this.submittedValue.set(null);
    this.form.reset();
  }
}
