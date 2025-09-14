/* Polyfills */
import "intl-pluralrules";

import "expo-router/entry";
import TrackPlayer from "@weights-ai/react-native-track-player";
import { AppRegistry } from "react-native";

import App from "./src/App";
import { setupPlayer } from "./src/lib/react-native-track-player";
import { PlaybackService } from "./src/services/RNTPService";

AppRegistry.registerComponent("Music", () => App);
/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
setupPlayer(); // async
