/* Polyfills */
import "intl-pluralrules";

import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import App from "./src/App";
import { initServices } from "./src/initServices";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
initServices();
registerWidgetTaskHandler(widgetTaskHandler);
