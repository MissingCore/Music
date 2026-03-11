/* Polyfills */
import "intl-pluralrules";

import { GlyphToy } from "@missingcore/music-glyph-toys";
import TrackPlayer from "react-native-track-player";
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import App from "./src/App";
import { onAppStartUpInit } from "./src/lib/react-native-track-player";
import { PlaybackService } from "./src/services/RNTPService";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
GlyphToy.connect();
(async () => {
  await onAppStartUpInit;
})();
registerWidgetTaskHandler(widgetTaskHandler);
