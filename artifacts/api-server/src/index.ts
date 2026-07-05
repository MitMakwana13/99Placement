/**
 * Root entrypoint.
 * Delegates startup sequence bootstrap to the server coordinator.
 */
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure Sentry initializes before everything else to catch all possible errors.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

import "./server";
