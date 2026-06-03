import BackgroundTimer from "@boterop/react-native-background-timer";
import {
  GlyphButton,
  GlyphToy,
  MatrixAction,
} from "@missingcore/music-glyph-toys";
import { getR128Gain } from "@missingcore/react-native-metadata-retriever";
import { toast } from "@missingcore/ui/toast";
import AsyncStorage from "expo-sqlite/kv-store";
import type {
  BrowserConfiguration,
  BrowserSource,
  ResolvedTrack,
} from "react-native-audio-browser";
import AudioBrowser from "react-native-audio-browser";

import { db } from "~/db";

import i18next from "~/modules/i18n";
import { getAlbum, getAlbumsSummary } from "~/data/album/api";
import { getArtist, getArtistsSummary } from "~/data/artist/api";
import { getArtistsString } from "~/data/artist/utils";
import { getGenre, getGenresSummary } from "~/data/genre/api";
import { getPlaylist, getPlaylistsSummary } from "~/data/playlist/api";
import { addPlayedTrack } from "~/data/recent/api";
import { deleteTracks, getSortedTracks } from "~/data/track/api";
import { formatTrackforPlayer } from "~/data/track/utils";
import type { CommonTrack } from "~/data/types";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { sessionStore } from "~/stores/Session/store";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";
import { router } from "~/navigation/utils/router";

import {
  ImageDirectory,
  PlaceholderDirectory,
  PlaceholderImageFile,
} from "~/lib/file-system";
import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
import { clearAllQueries } from "~/lib/react-query";
import { bgWait } from "~/utils/promise";
import { capitalize, getSafeUri } from "~/utils/string";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaImage } from "~/modules/media/components/MediaImage";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";
import type { MediaType, PlayFromSource } from "~/stores/Playback/types";

//#region "Smooth Playback Transition" Constants
type PlaybackStoreFrame = Awaited<
  ReturnType<typeof PlaybackControls.getNextTrack>
>;

let gaplessPlaybackContext = {
  /** If we're preparing to load the next track / the track has been loaded. */
  buffering: false,
  /** Duration of current media. */
  duration: -1,
  /** State the Playback store will be in once the next track is played. */
  nextSnapshot: undefined as PlaybackStoreFrame | undefined,
};
//#endregion

//#region Play Count Tracking Constants
let playCountTimout: ReturnType<typeof BackgroundTimer.setTimeout> | null =
  null;
//#endregion

//#region Error Handling Constants
/** Errors which should cause us to "delete" a track. */
const ValidErrors = ["io-file-not-found", "failed-runtime-check"];

/** List of track URIs which have errored. */
const erroredTrackUris = new Set<string>();
//#endregion

/**
 * Register services in the `index.ts` file. Doesn't get called on next
 * app launch if "Continue Playback on Dismiss" is enabled.
 */
async function initServices() {
  console.warn("[InitServices] Initializing services...");
  GlyphToy.connect();

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

  //#region Glyph Toy Events
  GlyphButton.onMount(() => GlyphToy.connect());

  GlyphButton.onTouchUp(async ({ action }) => {
    if (action === MatrixAction.PLAY_PAUSE) await PlaybackControls.playToggle();
    if (action === MatrixAction.SKIP) await PlaybackControls.next();
  });
  //#endregion

  //#region Media Events
  // This event gets called when `appKilledPlaybackBehavior = "stop-playback-and-remove-notification"`.
  AudioBrowser.handleBeforeServiceKilled(async (permanent) => {
    await revalidateWidgets({ openApp: true });
    if (permanent) {
      console.warn("[handleBeforeServiceKilled] Running aggressive cleanup...");
      GlyphToy.disconnect();
      AudioBrowser.reset();
    }
  });

  AudioBrowser.handleRemotePlay(PlaybackControls.play);
  AudioBrowser.handleRemotePause(PlaybackControls.pause);
  AudioBrowser.handleRemoteNext(PlaybackControls.next);
  AudioBrowser.handleRemotePrevious(PlaybackControls.prev);
  AudioBrowser.handleRemoteSeek(async ({ position }) => {
    await PlaybackControls.seekTo(position);
  });

  // Handle unexpected pauses (ie: disconnecting headphones).
  AudioBrowser.onPlaybackChanged.addListener((e) => {
    if (e.state === "paused") playbackStore.setState({ isPlaying: false });
  });

  AudioBrowser.onProgressUpdated.addListener(async (e) => {
    //? Ignore the 1st emitted event as it returns `duration = 0`.
    if (e.duration === 0) return;
    playbackStore.setState({ lastPosition: e.position });

    const { repeat } = playbackStore.getState();
    const { playbackDelay } = preferenceStore.getState();

    // Taking the playback speed into account when optimally loading the next track.
    const loadingFrame = 5 * Math.max(1, sessionStore.getState().playbackSpeed);
    if (
      //? Ignore if we're repeating the current track.
      repeat === RepeatModes.REPEAT_ONE ||
      //? "Natural Playback Delay" & "Smooth Playback Transition" are mutually exclusive features.
      playbackDelay > 0 ||
      //? Prevent recomputation.
      gaplessPlaybackContext.buffering ||
      //? Prevent early computation (when we're not near the end of the track).
      e.position + loadingFrame - gaplessPlaybackContext.duration < 0
    ) {
      return;
    }

    gaplessPlaybackContext.buffering = true;
    gaplessPlaybackContext.nextSnapshot = await PlaybackControls.getNextTrack();
    if (!gaplessPlaybackContext.nextSnapshot) return;
    const { activeTrack, queuePosition } = gaplessPlaybackContext.nextSnapshot;
    //? Ensure that we handle "No Repeat" mode cleanly (no sound bleed).
    if (queuePosition === 0 && repeat === RepeatModes.NO_REPEAT) return;

    // Load the next track into the queue for smoother playback.
    AudioBrowser.add(
      formatTrackforPlayer(activeTrack, await getR128Gain(activeTrack.uri)),
    );
  });

  // Called when "Smooth Playback Transition" doesn't trigger.
  AudioBrowser.onQueueEnded.addListener(async () => {
    const { playbackDelay } = preferenceStore.getState();
    if (playbackDelay > 0) await bgWait(playbackDelay * 1000);
    await PlaybackControls.next(true); // Prevent updating the repeat setting.
  });

  AudioBrowser.onActiveTrackChanged.addListener(async (e) => {
    if (e.index === undefined || e.track?.src === undefined) return;
    const activeTrackUri = decodeURIComponent(e.track.src);

    //* 🧪 Smooth Playback Transition
    try {
      if (e.index !== 0 && gaplessPlaybackContext.nextSnapshot) {
        playbackStore.setState(gaplessPlaybackContext.nextSnapshot);
        // Ensure the AudioBrowser Queue stores a single track.
        AudioBrowser.remove([...new Array(e.index).keys()]);
      } else {
        // Cleans up the AudioBrowser queue if we use the media controls within the track loading window.
        AudioBrowser.removeUpcomingTracks();
      }
    } catch (err) {
      console.log(err);
    }
    gaplessPlaybackContext = {
      buffering: false,
      duration: e.track.duration!,
      nextSnapshot: undefined,
    };

    //* Play Count Tracking
    const { lastPosition } = playbackStore.getState();
    if (playCountTimout !== null) BackgroundTimer.clearTimeout(playCountTimout);
    // Only mark a track as played after we pass the 10s mark. This prevents
    // the track being marked as "played" if we skip it.
    if (lastPosition < 10) {
      playCountTimout = BackgroundTimer.setTimeout(
        async () => await addPlayedTrack(activeTrackUri),
        (Math.min(e.track.duration!, 10) - lastPosition) * 1000,
      );
    }

    //? We now fallback to the path specified by `PlaceholderImageFile`
    //? if we have no embedded artwork.
    GlyphToy.setMatrixArtwork(e.track.artwork || null);

    await revalidateWidgets();
  });

  AudioBrowser.onPlaybackError.addListener(async ({ error: e }) => {
    if (!e) return;

    //? We don't know exactly what track caused the error, but we can
    //? infer based on the state of the queue.
    const [activeTrack, queuedTrack] = AudioBrowser.getQueue();
    const erroredTrack = queuedTrack || activeTrack;

    if (erroredTrack?.src) {
      const erroredTrackUri = decodeURIComponent(erroredTrack.src);
      //! For some weird reason, `PlaybackError` may fire twice for a given track.
      if (erroredTrackUris.has(erroredTrackUri)) return;
      erroredTrackUris.add(erroredTrackUri);

      const erroredTrackObj = await db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.uri, erroredTrackUri),
      });
      // Reset if the track doesn't exist in the database.
      if (!erroredTrackObj) return await playbackStore.getState().reset();

      //? If the errored track was queued, we need to update the store.
      if (queuedTrack) {
        const nextTrack = await PlaybackControls.getNextTrack();
        if (nextTrack) playbackStore.setState(nextTrack);
        gaplessPlaybackContext.nextSnapshot = undefined;
      }

      // Delete the track that caused the error from certain scenarios.
      //  - We've encountered no code when AudioBrowser naturally plays
      //  the next track that throws an error because it doesn't exist.
      if (ValidErrors.includes(e.code) || e.code === undefined) {
        let errorMessage = "File not found.";
        if (e.code === "failed-runtime-check")
          errorMessage =
            "Unexpected runtime error. For example, this may happen if the file has a sample rate greater than or equal to 352.8kHz.";

        await deleteTracks([
          {
            id: erroredTrackObj.id,
            errorInfo: { errorName: e.code, errorMessage },
          },
        ]);
        // Attempt to play the next track.
        await Queue.removeIds([erroredTrackObj.id]);
        await AppCleanUp.media();
        clearAllQueries();

        // If the queue is empty as a result of `Queue.removeIds()`, `reset()`
        // gets called internally, in which, we want to return to the Home screens.
        if (playbackStore.getState().queue.length === 0) {
          router.navigate("HomeScreens", undefined, { pop: true });
        }
      }

      toast.error(i18next.t("template.notFound", { name: erroredTrack.title }));
    } else {
      // If we get this event when there's no active track, just reset.
      await playbackStore.getState().reset();
    }
  });
  //#endregion

  //#region Android Auto
  const experimentalLabel = "🧪 This is an Experimental Feature. 🧪";

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
          url: `/${category}/${item.id ?? item.name}`,
          title: item.name,
          description:
            item.artistName ||
            i18next.t("plural.track", { count: item.trackCount }),
          artwork:
            (Array.isArray(artwork) ? artwork[0] : artwork) ||
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
      const id = routeParams!.id!;
      const data = await loader(id);
      // Only available for tracks in "Album" entry.
      const hasDiscLabel = (data.tracks.at(-1)?.disc ?? -1) > 1;

      return {
        url: category === "track" ? "/track" : `/${category}/${id}`,
        title: data.name,
        children: data.tracks.map((track) => ({
          src: getSafeUri(track.uri),
          title: track.name,
          artist: getArtistsString(track.artists),
          artwork: track.artwork || PlaceholderImageFile,
          duration: track.duration,
          groupTitle:
            hasDiscLabel && typeof track.disc === "number"
              ? `Disc ${track.disc}`
              : undefined,
        })),
      };
    };
  }

  const mediaListRoutes: Record<string, BrowserSource> = {
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
  };

  const configuration: BrowserConfiguration = {
    tabs: [
      {
        title: "Your Library",
        url: "/library",
      },
    ],
    routes: {
      ...mediaListRoutes,
      "/library": {
        url: "/library",
        title: "Your Library",
        children: ["Album", "Artist", "Genre", "Playlist", "Track"].map(
          (category) => ({
            url: `/${category.toLowerCase()}`,
            title: `${category}s`,
            groupTitle: experimentalLabel,
          }),
        ),
      },
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
      let listSource = { type: lType, id: lId } as PlayFromSource;
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

  AudioBrowser.configureBrowser(configuration);
  //#endregion
}

/** Promise to setup AudioBrowser. */
export const onAppStartUpInit = initServices();
