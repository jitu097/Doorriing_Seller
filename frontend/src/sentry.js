import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  environment: import.meta.env.MODE || "production",
});