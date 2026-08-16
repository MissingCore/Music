// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  BrowserConfiguration,
  BrowserSource,
  ResolvedTrack,
} from "react-native-audio-browser";

import { db } from "~/db";

import i18next from "~/modules/i18n";
import { getAlbum, getAlbumsSummary } from "~/data/album/api";
import { getArtist, getArtistsSummary } from "~/data/artist/api";
import { getArtistsString } from "~/data/artist/utils";
import { getGenre, getGenresSummary } from "~/data/genre/api";
import { getPlaylist, getPlaylistsSummary } from "~/data/playlist/api";
import { getSortedTracks } from "~/data/track/api";
import type { CommonTrack } from "~/data/types";
import { PlaybackControls } from "~/stores/Playback/actions";

import { getImageUri, PlaceholderImageFile } from "~/lib/file-system";
import { capitalize, getSafeUri } from "~/utils/string";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaImage } from "~/modules/media/components/MediaImage";
import type { MediaType, PlayFromSource } from "~/stores/Playback/types";

/** Structure to represent Android Auto. */
export const browserConfiguration: BrowserConfiguration = {
  tabs: [{ title: "Your Library", url: "/library" }],

  routes: {
    "/library": {
      url: "/library",
      title: "Your Library",
      children: ["Album", "Artist", "Genre", "Playlist", "Track"].map(
        (category) => ({
          url: `/${category.toLowerCase()}`,
          title: `${category}s`,
          groupTitle: "🧪 This is an Experimental Feature. 🧪",
        }),
      ),
    },

    //? Content Routes
    "/album": () => getMediaCategoryRoute("album", getAlbumsSummary),
    "/album/{id}": getMediaCategoryEntryRoute("album", getAlbum),
    "/artist": () => getMediaCategoryRoute("artist", getArtistsSummary),
    "/artist/{id}": getMediaCategoryEntryRoute("artist", getArtist),
    "/genre": () => getMediaCategoryRoute("genre", getGenresSummary),
    "/genre/{id}": getMediaCategoryEntryRoute("genre", getGenre),
    "/playlist": () => getMediaCategoryRoute("playlist", getPlaylistsSummary),
    "/playlist/{id}": getMediaCategoryEntryRoute("playlist", getPlaylist),
    "/track": getMediaCategoryEntryRoute("track", async () => {
      return { name: "Tracks", tracks: await getSortedTracks() };
    }),
  },

  //* Only load a single track to be consistent with our playback strategy.
  singleTrack: true,

  //* Triggered when we select a track in Android Auto.
  handleTrackLoad: async ({ track }) => {
    const trackUri = track.src ? decodeURIComponent(track.src) : undefined;
    const androidAutoURL = track.url; // ie: `/album/srzxiew5ihjsxe6u706siqfq?__trackId=......`

    //? Fallback to playing the track in the Playback store if we don't
    //? have context on the selected track & list.
    if (!trackUri || !androidAutoURL) return PlaybackControls.play();

    //? Derive the `PlayFromSource` from the url.
    const [_, lType, lId] = androidAutoURL.split("?__trackId")[0]!.split("/");
    let listSource = {
      type: lType,
      id: decodeURIComponent(lId ?? ""),
    } as PlayFromSource;
    //* We need to pay attention to the special case of playing from the "Tracks" list.
    if (lType === "track") {
      listSource = { type: "playlist", id: ReservedPlaylists.tracks };
    } else if (!lType || !lId) {
      return;
    }

    //? Get the id of the selected track since we can't pass it down.
    const activeTrack = await db.query.tracks.findFirst({
      where: (fields, { eq }) => eq(fields.uri, trackUri),
    });

    //? Simplest way of updating the Playback store when we change
    //? lists via Android Auto.
    return PlaybackControls.playFromList({
      source: listSource,
      trackId: activeTrack?.id,
    });
  },
};

//#region Internal Helpers

/** Generate route containing all lists of a given category. */
async function getMediaCategoryRoute(
  category: MediaType,
  loader: () => Promise<
    Array<{
      name: string;
      id?: string;
      artistName?: string;
      trackCount: number;
      artwork: MediaImage.ImageSource;
    }>
  >,
): Promise<ResolvedTrack> {
  const data = await loader();
  return {
    url: `/${category}`,
    title: `${capitalize(category)}s`,
    children: data.map(({ artwork, ...item }) => {
      return {
        url: `/${category}/${encodeURIComponent(item.id ?? item.name)}`,
        title: item.name,
        description:
          item.artistName ||
          i18next.t("plural.track", { count: item.trackCount }),
        artwork:
          getImageUri(Array.isArray(artwork) ? artwork[0] : artwork) ||
          PlaceholderImageFile,
      };
    }),
  };
}

/** Generate route for list in a given category. */
function getMediaCategoryEntryRoute(
  category: MediaType,
  loader: (id: string) => Promise<{
    name: string;
    tracks: Array<CommonTrack & { disc?: number | null }>;
  }>,
): BrowserSource {
  return async ({ routeParams }): Promise<ResolvedTrack> => {
    const id = routeParams!.id!; // Undefined for `/track`, but we return a fixed route.
    const data = await loader(decodeURIComponent(id));
    // Only available for tracks in "Album" entry.
    const hasDiscLabel = (data.tracks.at(-1)?.disc ?? -1) > 1;

    return {
      url: category === "track" ? "/track" : `/${category}/${id}`,
      title: data.name,
      children: data.tracks.map((track) => ({
        src: getSafeUri(track.uri),
        title: track.name,
        artist: getArtistsString(track.artists),
        artwork: getImageUri(track.artwork) || PlaceholderImageFile,
        duration: track.duration,
        groupTitle:
          hasDiscLabel && typeof track.disc === "number"
            ? `Disc ${track.disc}`
            : undefined,
      })),
    };
  };
}
//#endregion
