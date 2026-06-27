// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

let Sentry: any;

/*
  We can't use `INCLUDE_SENTRY` to dynamically import Sentry as tree-shaking
  won't work due to exporting that variable (causing the bundle size to be
  ~350KB larger).
*/
if (process.env.EXPO_PUBLIC_WITH_SENTRY === "true") {
  // Dynamically import Sentry if we want to use it.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Sentry = require("@sentry/react-native");
}

export { Sentry };
