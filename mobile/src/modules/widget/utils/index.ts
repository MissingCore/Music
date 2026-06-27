// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { playbackStore } from "~/stores/Playback/store";
import { getArtistsString } from "~/data/artist/utils";

import { updateWidgets } from "./update";
import type { WidgetName } from "../constants/Widgets";
import type { PlayerWidgetData } from "../types";

export function getWidgetData(): PlayerWidgetData {
  try {
    const { activeTrack, isPlaying } = playbackStore.getState();
    let track: PlayerWidgetData["track"] = undefined;
    if (activeTrack) {
      track = {
        title: activeTrack.name,
        artist: getArtistsString(activeTrack.artists, null),
        artwork: activeTrack.artwork,
      };
    }
    return { track, isPlaying };
  } catch {
    // We'll end up here if the AudioBrowser service isn't set up yet.
    return { track: undefined, isPlaying: false };
  }
}

export async function revalidateWidgets(options?: {
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
  exclude?: WidgetName[];
}) {
  const musicContextData = getWidgetData();
  if (options?.openApp) musicContextData.isPlaying = false;

  await updateWidgets({ ...musicContextData, ...(options ?? {}) });
}
