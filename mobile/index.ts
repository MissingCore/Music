// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/* Polyfills */
import "intl-pluralrules";

import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import "./src/db"; //? Ensure DB is setup on app launch to maybe fix those weird issues reported by Sentry.
import App from "./src/App";
import { onAppStartUpInit } from "./src/initServices";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
(async () => {
  await onAppStartUpInit;
})();
registerWidgetTaskHandler(widgetTaskHandler);
