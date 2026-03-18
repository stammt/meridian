import * as Sentry from "@sentry/node";

Sentry.init({
  dsn:
    process.env.NODE_ENV === "production"
      ? process.env.SENTRY_BACKEND_DSN
      : undefined,

  // Send structured logs to Sentry
  enableLogs: true,
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
