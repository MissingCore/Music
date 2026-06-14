import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { getMetadata } from "@missingcore/react-native-metadata-retriever";
import type { NavigationProp } from "@react-navigation/native";

import { db } from "~/db";

import { getTrack, updateTrack } from "~/data/track/api";

import { sessionStore } from "./store";
import type { PopStrategy } from "./types";

import { iAsc, throwIfNoResults } from "~/lib/drizzle";
import { wait } from "~/utils/promise";

//#region Track Sheet
/** Displays the global track sheet. */
export async function presentTrackSheet(trackId: string) {
  try {
    const sheetTrack = await getTrack(trackId);
    if (!sheetTrack.sampleRate) {
      const { sampleRate } = await getMetadata(sheetTrack.uri, ["sampleRate"]);
      sheetTrack.sampleRate = sampleRate;
      if (sampleRate) updateTrack(trackId, { sampleRate });
    }

    sessionStore.setState({ displayedTrack: sheetTrack });
    await wait(1);
    TrueSheet.present("TrackSheet");
  } catch {
    // If `getTrack()` fails, it throws an error, which is caught here.
    sessionStore.setState({ displayedTrack: null });
  }
}
//#endregion

//#region Artist Sheet
/** Displays the global artist sheet. */
export async function presentArtistsSheet(
  artistNames: string[],
  /** Optional screen popping strategy to navigate to the artist screen. */
  popStrategy?: PopStrategy,
) {
  try {
    const sheetArtists = await throwIfNoResults(
      db.query.artists.findMany({
        where: (fields, { inArray }) => inArray(fields.name, artistNames),
        orderBy: (fields) => iAsc(fields.name),
      }),
    );
    sessionStore.setState({
      displayedArtists: { artists: sheetArtists, popStrategy },
    });
    await wait(1);
    TrueSheet.present("ArtistsSheet");
  } catch {
    sessionStore.setState({ displayedArtists: null });
  }
}

export function navigateToArtist(
  navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState">,
  id: string,
  popStrategy?: PopStrategy,
) {
  // Pops current screen before navigating to artist screen.
  // Useful when used on "Now Playing" screen.
  if (popStrategy === "popScreen") navigation.goBack();
  // `pop` option is useful in the following navigation scenario:
  // "Artist" -> "Album" -> "Artist".
  navigation.navigate("Artist", { id }, { pop: popStrategy === "popTo" });
}
//#endregion

//#region Waveform
/** Find, return, and set the cached waveform data in the Session store. */
export async function findAndSetCachedWaveform(trackId: string) {
  const cachedWaveform = await db.query.waveformSamples.findFirst({
    where: (fields, { eq }) => eq(fields.trackId, trackId),
  });
  sessionStore.setState({ activeWaveformContext: cachedWaveform || null });
  return cachedWaveform;
}
//#endregion
