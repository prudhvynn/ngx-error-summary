import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideErrorSummary } from 'ngx-error-summary';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideErrorSummary({
      heading: 'There is a problem with your submission',
      messages: {
        // Override a built-in default.
        required: ({ label }) => `Enter ${label.toLowerCase()}`,
        // Message for a bespoke validator key.
        productCode: () => 'Product code must look like AB-1234',
        dateRange: () => 'The end date must be after the start date',
      },
      resolvers: [
        // Resolvers win over the message map. This one handles every field in
        // the attendees array, which the map alone could not express.
        ({ path, key, label }) =>
          path.startsWith('attendees.') && key === 'required'
            ? `Enter a name for attendee ${Number(path.split('.')[1]) + 1} (${label})`
            : null,
      ],
    }),
  ],
};
