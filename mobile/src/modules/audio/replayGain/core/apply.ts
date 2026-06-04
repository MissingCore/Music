import { getR128Gain } from "@missingcore/react-native-metadata-retriever";
import type { Track as AddTrack } from "react-native-audio-browser";

import type { Track } from "~/data/track/types";
import { getArtistsString } from "~/data/artist/utils";
import { playbackStore } from "~/stores/Playback/store";

import { PlaceholderImageFile } from "~/lib/file-system";
import { getSafeUri } from "~/utils/string";
import { isNumber } from "~/utils/validation";

//! Only `applyReplayGainToTrack()` should be exported from this file to
//! minimize the risk of circular dependencies.

/** Returns a formatted Track object that AudioBrowser uses. */
export async function applyReplayGainToTrack(track: Track, apply = true) {
  const { isReplayGainEnabled, preAmpWTags, preAmpWOTags } =
    playbackStore.getState();
  const replayGain =
    isReplayGainEnabled && apply ? await getR128Gain(track.uri) : null;
  const finalDB = isNumber(replayGain)
    ? replayGain + preAmpWTags
    : preAmpWOTags;

  return {
    src: getSafeUri(track.uri),
    artwork: track.artwork || PlaceholderImageFile,
    title: track.name,
    artist: getArtistsString(track.artists, "No Artist"),
    album: track.albumName || undefined,
    duration: track.duration,
    replayGain: finalDB,
  } satisfies AddTrack;
}
