/** Indicates whether the app is `__DEV__`. */
export const IS_DEV = __DEV__;

/** Configures if the "Check for Updates" setting is enabled by default. */
export const CHECK_FOR_UPDATES =
  process.env.EXPO_PUBLIC_CHECK_FOR_UPDATES === "true";

/** Whether Sentry should be initialized in JS. */
export const INITIALIZE_SENTRY = process.env.EXPO_PUBLIC_WITH_SENTRY === "true";

/** If Sentry events can be reported. */
export const CAN_SENTRY_REPORT = INITIALIZE_SENTRY && !IS_DEV;
