import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://581aa8053fd3bbe664949b65a9d49c22@o4511066194640896.ingest.us.sentry.io/4511066252247040",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
