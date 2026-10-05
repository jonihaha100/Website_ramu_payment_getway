import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let withSentryConfig: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sentryConfig = require("@sentry/nextjs/config");
  withSentryConfig = sentryConfig.withSentryConfig || sentryConfig.default?.withSentryConfig;
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sentry = require("@sentry/nextjs");
    withSentryConfig = sentry.withSentryConfig;
  } catch {
    withSentryConfig = null;
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default typeof withSentryConfig === "function"
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : nextConfig;
