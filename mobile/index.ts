/* Polyfills */
import "intl-pluralrules";

import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import "./src/db"; //? Ensure DB is setup on app launch to maybe fix those weird issues reported by Sentry.
import App from "./src/App";
import { initServices } from "./src/initServices";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
initServices();
registerWidgetTaskHandler(widgetTaskHandler);
