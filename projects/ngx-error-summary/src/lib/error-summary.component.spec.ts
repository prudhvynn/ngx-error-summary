import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorSummaryComponent } from './error-summary.component';
import { provideErrorSummary } from './messages';
import { FieldError, HeadingLevel } from './models';

@Component({
  imports: [ReactiveFormsModule, ErrorSummaryComponent],
  template: `
    <form [formGroup]="form">
      <nes-error-summary
        [form]="form"
        [show]="show()"
        [includeUntouched]="includeUntouched()"
        (navigated)="navigated.push($event)"
      />
      <input id="email" formControlName="email" />
      <input id="address.postalCode" formControlName="postalCode" />
    </form>
  `,
})
class HostComponent {
  readonly form = new FormGroup({
    email: new FormControl('', Validators.required),
    postalCode: new FormControl('', Validators.required),
  });
  readonly show = signal(false);
  readonly includeUntouched = signal(true);
  readonly navigated: FieldError[] = [];
}

async function setup(): Promise<ComponentFixture<HostComponent>> {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [provideErrorSummary()],
  });
  const fixture = TestBed.createComponent(HostComponent);
  await fixture.whenStable();
  return fixture;
}

function summary(fixture: ComponentFixture<HostComponent>): HTMLElement | null {
  return fixture.nativeElement.querySelector('.nes-summary');
}

function links(fixture: ComponentFixture<HostComponent>): HTMLAnchorElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('.nes-summary__link'));
}

describe('ErrorSummaryComponent', () => {
  it('renders nothing until show is true', async () => {
    const fixture = await setup();

    expect(summary(fixture)).toBeNull();
  });

  it('renders nothing when the form is valid, even when shown', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.setValue({ email: 'a@b.com', postalCode: 'SW1A' });
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    expect(summary(fixture)).toBeNull();
  });

  it('lists one entry per error once shown', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    expect(links(fixture).map((a) => a.textContent?.trim())).toEqual([
      'Enter email',
      'Enter postal code',
    ]);
  });

  it('carries the ARIA wiring the pattern depends on', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();
    const box = summary(fixture)!;

    expect(box.getAttribute('role')).toBe('alert');
    expect(box.getAttribute('tabindex')).toBe('-1');

    const headingId = box.getAttribute('aria-labelledby');
    expect(headingId).toBeTruthy();
    const heading = fixture.nativeElement.querySelector(`#${headingId}`);
    expect(heading?.textContent?.trim()).toBe('There is a problem');
  });

  it('moves focus to the summary as it appears', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();
    // The component defers the focus call by a microtask.
    await Promise.resolve();

    expect(document.activeElement).toBe(summary(fixture));
  });

  it('moves focus to the field when an entry is activated', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    links(fixture)[0].click();
    await fixture.whenStable();

    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#email'));
  });

  it('emits navigated with the activated error', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    links(fixture)[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.navigated).toHaveLength(1);
    expect(fixture.componentInstance.navigated[0]).toMatchObject({
      path: 'postalCode',
      key: 'required',
    });
  });

  it('links to the field by fragment so it degrades without JS', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    expect(links(fixture)[0].getAttribute('href')).toBe('#email');
  });

  it('updates live as the user fixes fields', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();
    expect(links(fixture)).toHaveLength(2);

    fixture.componentInstance.form.get('email')!.setValue('a@b.com');
    await fixture.whenStable();

    expect(links(fixture).map((a) => a.textContent?.trim())).toEqual(['Enter postal code']);
  });

  it('honours includeUntouched=false', async () => {
    const fixture = await setup();
    fixture.componentInstance.includeUntouched.set(false);
    fixture.componentInstance.form.get('postalCode')!.markAsTouched();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    expect(links(fixture).map((a) => a.textContent?.trim())).toEqual(['Enter postal code']);
  });

  it('marks the host empty when there is nothing to report', async () => {
    const fixture = await setup();
    const el = fixture.nativeElement.querySelector('nes-error-summary');
    fixture.componentInstance.form.setValue({ email: 'a@b.com', postalCode: 'SW1A' });
    await fixture.whenStable();

    expect(el.hasAttribute('data-empty')).toBe(true);
  });

  it('gives each instance a distinct heading id', async () => {
    const a = await setup();
    a.componentInstance.show.set(true);
    await a.whenStable();

    const b = TestBed.createComponent(HostComponent);
    b.componentInstance.show.set(true);
    await b.whenStable();

    expect(summary(a)!.getAttribute('aria-labelledby')).not.toBe(
      summary(b)!.getAttribute('aria-labelledby'),
    );
  });

  it('uses configured copy for the heading', async () => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideErrorSummary({ heading: 'Fix these problems' })],
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.nes-summary__heading').textContent.trim()).toBe(
      'Fix these problems',
    );
  });
});

@Component({
  imports: [ReactiveFormsModule, ErrorSummaryComponent],
  template: `
    <form [formGroup]="form">
      <nes-error-summary [form]="form" [show]="true" [headingLevel]="level()" />
      <input id="email" formControlName="email" />
    </form>
  `,
})
class HeadingLevelHost {
  readonly form = new FormGroup({ email: new FormControl('', Validators.required) });
  readonly level = signal<HeadingLevel>(2);
}

/** Deliberately does not bind headingLevel, so the app-wide default applies. */
@Component({
  imports: [ReactiveFormsModule, ErrorSummaryComponent],
  template: `
    <form [formGroup]="form">
      <nes-error-summary [form]="form" [show]="true" />
      <input id="email" formControlName="email" />
    </form>
  `,
})
class UnboundLevelHost {
  readonly form = new FormGroup({ email: new FormControl('', Validators.required) });
}

describe('heading level', () => {
  async function levelSetup(
    providers = [provideErrorSummary()],
  ): Promise<ComponentFixture<HeadingLevelHost>> {
    TestBed.configureTestingModule({ imports: [HeadingLevelHost], providers });
    const fixture = TestBed.createComponent(HeadingLevelHost);
    await fixture.whenStable();
    return fixture;
  }

  function headingTag(fixture: ComponentFixture<HeadingLevelHost>): string {
    return fixture.nativeElement.querySelector('.nes-summary__heading').tagName;
  }

  it('renders an h2 by default', async () => {
    const fixture = await levelSetup();

    expect(headingTag(fixture)).toBe('H2');
  });

  it('renders a real heading element for every level', async () => {
    const fixture = await levelSetup();

    for (const level of [1, 2, 3, 4, 5, 6] as HeadingLevel[]) {
      fixture.componentInstance.level.set(level);
      await fixture.whenStable();
      expect(headingTag(fixture)).toBe(`H${level}`);
    }
  });

  it('keeps the aria-labelledby wiring intact at every level', async () => {
    const fixture = await levelSetup();
    fixture.componentInstance.level.set(4);
    await fixture.whenStable();

    const box = fixture.nativeElement.querySelector('.nes-summary');
    const heading = fixture.nativeElement.querySelector('.nes-summary__heading');
    expect(box.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.id).toBeTruthy();
  });

  it('takes the default from the app-wide config when the input is not bound', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UnboundLevelHost],
      providers: [provideErrorSummary({ headingLevel: 3 })],
    });
    const fixture = TestBed.createComponent(UnboundLevelHost);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.nes-summary__heading').tagName).toBe('H3');
  });

  it('lets the input override the app-wide config', async () => {
    TestBed.resetTestingModule();
    const fixture = await levelSetup([provideErrorSummary({ headingLevel: 3 })]);
    fixture.componentInstance.level.set(5);
    await fixture.whenStable();

    expect(headingTag(fixture)).toBe('H5');
  });
});

describe('style customisation', () => {
  it('exposes every painted value as an overridable custom property', async () => {
    const fixture = await setup();
    fixture.componentInstance.show.set(true);
    await fixture.whenStable();

    // Read the component's own stylesheet rather than computed values: jsdom
    // does not resolve custom properties, but the contract we care about is
    // that no hard-coded value is left unreachable to a consumer.
    const css = Array.from(document.querySelectorAll('style'))
      .map((s) => s.textContent ?? '')
      .join('');
    const summaryRule = css.slice(css.indexOf('.nes-summary'));

    for (const token of [
      '--nes-summary-color',
      '--nes-summary-background',
      '--nes-summary-border-width',
      '--nes-summary-border-color',
      '--nes-summary-padding',
      '--nes-summary-gap',
      '--nes-summary-heading-size',
      '--nes-summary-link-color',
    ]) {
      expect(summaryRule).toContain(token);
    }
  });
});
