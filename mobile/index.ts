// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

/* Polyfills */
import "intl-pluralrules";

import { registerRootComponent } from "expo";
import {
  registerWidgetConfigurationScreen,
  registerWidgetTaskHandler,
} from "react-native-android-widget";

import "./src/db"; //? Ensure DB is setup on app launch to maybe fix those weird issues reported by Sentry.
import App from "./src/App";
import { onAppStartUpInit } from "./src/initServices";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";
import { WidgetConfigurationScreen } from "./src/modules/widget/WidgetConfigurationScreen";

registerRootComponent(App);
(async () => {
  await onAppStartUpInit;
})();
registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigurationScreen);
