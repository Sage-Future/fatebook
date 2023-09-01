// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://032132527a4f59861f03150a5b6facfc@o4505800000471040.ingest.sentry.io/4505800011218944",
  tracesSampleRate: 0,
  debug: false,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  integrations: [],
});
