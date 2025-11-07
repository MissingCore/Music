let Sentry: any;
const SENTRY_ENABLED = process.env.EXPO_PUBLIC_WITH_SENTRY === "true";

/*
  We can't use `SENTRY_ENABLED` to dynamically import Sentry as tree-shaking
  won't work due to exporting that variable (causing the bundle size to be
  ~350KB larger).
*/
if (process.env.EXPO_PUBLIC_WITH_SENTRY === "true") {
  // Dynamically import Sentry if we want to use it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require("@sentry/react-native");
}

export { SENTRY_ENABLED, Sentry };
