// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import AsyncStorage from "expo-sqlite/kv-store";
import AudioBrowser from "react-native-audio-browser";

import { ImageDirectory, PlaceholderDirectory } from "~/lib/file-system";
import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
import { registerEvents } from "./registerEvents";
import { browserConfiguration } from "./setupAndroidAuto";

/**
 * Register services in the `index.ts` file. Doesn't get called on next
 * app launch if "Continue Playback on Dismiss" is enabled.
 */
async function setupAudioBrowser() {
  console.warn("[InitServices] Initializing services...");

  //* Fetch the value from `AsyncStorage` instead of `preferenceStore` as the
  //* store might not be hydrated in time (so if we turned it off, it might
  //* still be enabled due to the default value being `true`).
  const useDownsamplingProcessor =
    (await AsyncStorage.getItem("downsamplingProcessor")) ?? "true";

  //? Seems like we can setup the playback service in the background/headlessly.
  await AudioBrowser.setupPlayer({
    android: {
      allowedArtworkParentPaths: [ImageDirectory, PlaceholderDirectory],
      downsamplingProcessor: useDownsamplingProcessor === "true",
    },
  });
  AudioBrowser.updateOptions(getAudioBrowserOptions());

  registerEvents();
  AudioBrowser.configureBrowser(browserConfiguration);
}

/** Promise to setup AudioBrowser. */
export const headlessAudioBrowserSetup = setupAudioBrowser();
