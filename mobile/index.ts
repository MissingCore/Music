/* Polyfills */
import "intl-pluralrules";

import TrackPlayer from "@weights-ai/react-native-track-player";
import { registerRootComponent } from "expo";

import App from "./src/App";
import { setupPlayer } from "./src/lib/react-native-track-player";
import { PlaybackService } from "./src/services/RNTPService";

registerRootComponent(App);
/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
setupPlayer(); // async
