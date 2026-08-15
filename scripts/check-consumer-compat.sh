#!/bin/bash
#
# Verifies that a consumer on a given Angular major can AOT-compile against the
# library as it would actually be published.
#
#   ./scripts/check-consumer-compat.sh 19 /path/to/ngx-error-summary-0.1.1.tgz
#
# The package is built in partial-compilation mode, so the consumer's Angular
# linker — not ours — has to process its declarations. That is the thing this
# checks, and it can only be checked by really building a real app.
set -euo pipefail

V="${1:?usage: check-consumer-compat.sh <angular-major> <tarball>}"
TARBALL="${2:?usage: check-consumer-compat.sh <angular-major> <tarball>}"
TARBALL="$(cd "$(dirname "$TARBALL")" && pwd)/$(basename "$TARBALL")"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

echo "### [v$V] scaffolding a consumer with Angular CLI $V"
npx -y "@angular/cli@$V" new consumer \
  --defaults --skip-git --skip-tests --style=css --routing=false --ssr=false \
  --package-manager=npm >/dev/null 2>&1

cd consumer
echo "### [v$V] @angular/core: $(node -p "require('./node_modules/@angular/core/package.json').version")"

npm install "$TARBALL" --no-audit --no-fund --silent

# Touch every declaration in the package so the linker has to process all of them.
cat > src/app/app.component.ts <<'TS'
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ErrorForDirective, ErrorSummaryComponent, collectErrors } from 'ngx-error-summary';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ReactiveFormsModule, ErrorSummaryComponent, ErrorForDirective],
  template: `
    <form [formGroup]="form">
      <nes-error-summary [form]="form" [show]="true" (navigated)="onNav($event)" />
      <input id="email" formControlName="email" />
      <span nesErrorFor="email" nesLabel="Email address"></span>
      <div formGroupName="address">
        <input id="address.line1" formControlName="line1" />
        <span nesErrorFor="line1"></span>
      </div>
    </form>
  `,
})
export class AppComponent {
  private fb = new FormBuilder();
  form = this.fb.group({
    email: ['', Validators.required],
    address: this.fb.group({ line1: ['', Validators.required] }),
  });
  onNav(e: unknown) { console.log(e); }
  probe() { return collectErrors; }
}
TS

# Newer CLIs scaffold app.ts/App; older ones app.component.ts/AppComponent.
rm -f src/app/app.ts src/app/app.config.ts src/app/app.html src/app/app.css \
      src/app/app.component.html src/app/app.component.css 2>/dev/null || true

cat > src/main.ts <<'TS'
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
bootstrapApplication(AppComponent).catch((e) => console.error(e));
TS

echo "### [v$V] production AOT build"
npx ng build --configuration production 2>&1 | tail -12

echo "### [v$V] OK"
