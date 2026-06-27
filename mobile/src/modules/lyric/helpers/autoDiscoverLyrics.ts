// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getLyric } from "@missingcore/react-native-metadata-retriever";
import { File } from "expo-file-system";

import { queries as q } from "~/data/keyStore";
import { getArtistsString } from "~/data/artist/utils";
import { createLyric } from "~/data/lyric/api";
import { playbackStore } from "~/stores/Playback/store";
import { lyricStore } from "../core/store";
import { fetchLyricFromProvider } from "../core/data";

import { queryClient } from "~/lib/react-query";
import { bgWait } from "~/utils/promise";
import { getSafeUri } from "~/utils/string";
import { linkTrackToLyric } from "./linkTrackToLyric";

const BUFFER_MS = 30000;
let lastRequestAt = 0;

/** Find lyrics for the current active track. */
export async function autoDiscoverLyrics(abortController: AbortController) {
  const { activeTrack } = playbackStore.getState();
  const { providers: lyricsProviders, checkEmbedded } = lyricStore.getState();

  if (!activeTrack || abortController.signal.aborted) return;
  try {
    let foundLyrics: string | null = null;

    //? 1. Start by looking for embedded lyrics.
    if (checkEmbedded) foundLyrics = await getLyric(activeTrack.uri);

    //? 2. Check for adjacent lyric files (`.lrc`).
    if (!foundLyrics?.trim()) {
      const fileSlug = activeTrack.uri.split(".").slice(0, -1).join(".");
      const adjacentLrcFile = new File(getSafeUri(`${fileSlug}.lrc`));
      if (adjacentLrcFile.exists) foundLyrics = await adjacentLrcFile.text();
    }

    //? 3. Check for online lyrics.
    if (!foundLyrics?.trim() && lyricsProviders.length > 0) {
      //? Wait for 2.5s before doing an online search to prevent accidental fires when
      //? spamming the controls. Applies if this gets called within 30s.
      const prevLastRequestAt = lastRequestAt;
      lastRequestAt = Date.now();
      if (Date.now() - prevLastRequestAt < BUFFER_MS) await bgWait(2500);

      for (const provider of lyricsProviders) {
        if (abortController.signal.aborted) return;
        foundLyrics = await fetchLyricFromProvider(
          activeTrack,
          provider,
          abortController,
        );
        if (foundLyrics) break;
      }
    }

    // Silently return if no lyrics are found.
    if (!foundLyrics?.trim() || abortController.signal.aborted) return;

    const lrcEntryName = [activeTrack.name];
    if (activeTrack.artists)
      lrcEntryName.push(getArtistsString(activeTrack.artists));
    if (activeTrack.albumName) lrcEntryName.push(activeTrack.albumName);

    const newLyric = await createLyric({
      name: lrcEntryName.join(" - "),
      lyrics: foundLyrics.trim(),
    });
    if (!newLyric) throw new Error("Lyric not returned after insertion.");
    await linkTrackToLyric(
      { name: activeTrack.name, trackId: activeTrack.id, lyricId: newLyric.id },
      false,
    );

    queryClient.invalidateQueries({ queryKey: q.lyrics._def });
  } catch (err) {
    console.log(err);
  }
}
