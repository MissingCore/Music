/* Polyfills */
import "intl-pluralrules";

import TrackPlayer from "@weights-ai/react-native-track-player";
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";

import App from "./src/App";
import { PlaybackService } from "./src/services/RNTPService";
import { widgetTaskHandler } from "./src/modules/widget/WidgetTaskHandler";

registerRootComponent(App);
/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
registerWidgetTaskHandler(widgetTaskHandler);
