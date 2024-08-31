import "expo-router/entry";
import TrackPlayer from "react-native-track-player";

import { PlaybackService } from "./src/constants/PlaybackService";

/*
  Create custom entry point to potentially fix issues with
  `react-native-track-player`.
*/
TrackPlayer.registerPlaybackService(() => PlaybackService);
