/* Polyfills */
import "intl-pluralrules";

import { GlyphToy } from "@missingcore/music-glyph-toys";
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import App from "./src/App";
import { setupBrowser } from "./src/lib/react-native-audio-browser";
import { PlaybackService } from "./src/services/RNTPService";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
GlyphToy.connect();
setupBrowser(PlaybackService);
registerWidgetTaskHandler(widgetTaskHandler);
