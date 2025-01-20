/* Polyfills */
import "intl-pluralrules";

import "expo-router/entry";
import TrackPlayer from "react-native-track-player";

import { PlaybackService } from "./src/services/RNTPService";

/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
