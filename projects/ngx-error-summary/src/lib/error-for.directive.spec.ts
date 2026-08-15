import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorForDirective } from './error-for.directive';
import { ErrorSummaryComponent } from './error-summary.component';
import { provideErrorSummary } from './messages';

@Component({
  imports: [ReactiveFormsModule, ErrorForDirective, ErrorSummaryComponent],
  template: `
    <form [formGroup]="form">
      <nes-error-summary [form]="form" [show]="true" />
      <input id="email" formControlName="email" />
      <span data-testid="email-msg" nesErrorFor="email" [nesLabel]="label()"></span>

      <input id="password" formControlName="password" />
      <span data-testid="password-msg" nesErrorFor="password" [nesEager]="eager()"></span>
    </form>
  `,
})
class HostComponent {
  readonly form = new FormGroup({
    email: new FormControl('', Validators.required),
    password: new FormControl('', Validators.minLength(8)),
  });
  readonly label = signal<string | undefined>(undefined);
  readonly eager = signal(false);
}

async function setup(
  providers = [provideErrorSummary()],
): Promise<ComponentFixture<HostComponent>> {
  TestBed.configureTestingModule({ imports: [HostComponent], providers });
  const fixture = TestBed.createComponent(HostComponent);
  await fixture.whenStable();
  return fixture;
}

function msg(fixture: ComponentFixture<HostComponent>, field: string): HTMLElement {
  return fixture.nativeElement.querySelector(`[data-testid="${field}-msg"]`);
}

describe('ErrorForDirective', () => {
  it('stays hidden while the field is untouched', async () => {
    const fixture = await setup();
    const el = msg(fixture, 'email');

    expect(el.hasAttribute('hidden')).toBe(true);
    expect(el.textContent).toBe('');
  });

  it('shows the message once the field is touched', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.get('email')!.markAsTouched();
    await fixture.whenStable();

    const el = msg(fixture, 'email');
    expect(el.hasAttribute('hidden')).toBe(false);
    expect(el.textContent).toBe('Enter email');
  });

  it('shows immediately when nesEager is set', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.get('password')!.setValue('abc');
    fixture.componentInstance.eager.set(true);
    await fixture.whenStable();

    expect(msg(fixture, 'password').textContent).toBe('Password must be 8 characters or more');
  });

  it('announces itself as an alert only while it has something to say', async () => {
    const fixture = await setup();
    const el = msg(fixture, 'email');
    expect(el.getAttribute('role')).toBeNull();

    fixture.componentInstance.form.get('email')!.markAsTouched();
    await fixture.whenStable();

    expect(el.getAttribute('role')).toBe('alert');
  });

  it('clears once the field becomes valid', async () => {
    const fixture = await setup();
    const control = fixture.componentInstance.form.get('email')!;
    control.markAsTouched();
    await fixture.whenStable();
    expect(msg(fixture, 'email').textContent).toBe('Enter email');

    control.setValue('a@b.com');
    await fixture.whenStable();

    expect(msg(fixture, 'email').textContent).toBe('');
    expect(msg(fixture, 'email').hasAttribute('hidden')).toBe(true);
  });

  it('uses nesLabel in the generated message', async () => {
    const fixture = await setup();
    fixture.componentInstance.label.set('Work email');
    fixture.componentInstance.form.get('email')!.markAsTouched();
    await fixture.whenStable();

    expect(msg(fixture, 'email').textContent).toBe('Enter work email');
  });

  it('reports only the first failure, leaving the rest to the summary', async () => {
    TestBed.resetTestingModule();
    const fixture = await setup();
    const control = fixture.componentInstance.form.get('password')!;
    control.addValidators(Validators.required);
    control.updateValueAndValidity();
    control.markAsTouched();
    await fixture.whenStable();

    expect(msg(fixture, 'password').textContent).toBe('Enter password');
  });
});

describe('summary and inline messages cannot drift', () => {
  it('renders identical wording in both places for the same failure', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.get('email')!.markAsTouched();
    await fixture.whenStable();

    const inline = msg(fixture, 'email').textContent;
    const summaryLinks: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nes-summary__link'),
    );
    const fromSummary = summaryLinks.find((a) => a.getAttribute('href') === '#email');

    expect(inline).toBe('Enter email');
    expect(fromSummary?.textContent?.trim()).toBe(inline);
  });

  it('keeps both in step when the app overrides the copy', async () => {
    const fixture = await setup([
      provideErrorSummary({
        messages: { required: ({ label }) => `${label} is required, please` },
      }),
    ]);
    fixture.componentInstance.form.get('email')!.markAsTouched();
    await fixture.whenStable();

    const inline = msg(fixture, 'email').textContent;
    const summaryLinks: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nes-summary__link'),
    );
    const fromSummary = summaryLinks.find((a) => a.getAttribute('href') === '#email');

    expect(inline).toBe('Email is required, please');
    expect(fromSummary?.textContent?.trim()).toBe(inline);
  });
});
