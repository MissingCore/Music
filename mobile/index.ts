/* Polyfills */
import "intl-pluralrules";

import "expo-router/entry";
import { configureReanimatedLogger } from "react-native-reanimated";
import TrackPlayer from "react-native-track-player";

import { setupPlayer } from "./src/lib/react-native-track-player";
import { PlaybackService } from "./src/services/RNTPService";

/*
  v3.16 of `react-native-reanimated` set "strict mode" to `true`, causing
  the console to get spammed with warning.
*/
configureReanimatedLogger({ strict: false });

/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
setupPlayer(); // async
