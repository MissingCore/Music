// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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

  //? Seems like we can setup the playback service in the background/headlessly.
  await AudioBrowser.setupPlayer({
    android: {
      allowedArtworkParentPaths: [ImageDirectory, PlaceholderDirectory],
      downsamplingProcessor: true,
    },
  });
  AudioBrowser.updateOptions(getAudioBrowserOptions());

  registerEvents();
  AudioBrowser.configureBrowser(browserConfiguration);
}

/** Promise to setup AudioBrowser. */
export const headlessAudioBrowserSetup = setupAudioBrowser();
