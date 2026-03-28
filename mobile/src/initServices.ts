import BackgroundTimer from "@boterop/react-native-background-timer";
import {
  GlyphButton,
  GlyphToy,
  MatrixAction,
} from "@missingcore/music-glyph-toys";
import { toast } from "@missingcore/toast";
import type {
  BrowserConfiguration,
  BrowserSource,
  ResolvedTrack,
} from "react-native-audio-browser";
import AudioBrowser from "react-native-audio-browser";

import { db } from "~/db";

import i18next from "~/modules/i18n";
import { getAlbum, getAlbumsSummary } from "~/data/album/api";
import { getArtistsString } from "~/data/artist/utils";
import { getPlaylist, getPlaylistsSummary } from "~/data/playlist/api";
import { addPlayedTrack } from "~/data/recent/api";
import { deleteTracks } from "~/data/track/api";
import { formatTrackforPlayer } from "~/data/track/utils";
import { playbackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { preferenceStore } from "~/stores/Preference/store";
import { sessionStore } from "~/stores/Session/store";
import { AppCleanUp } from "~/modules/scanning/helpers/cleanup";
import { router } from "~/navigation/utils/router";

import { PlaceholderImageFile } from "~/lib/file-system";
import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
import { clearAllQueries } from "~/lib/react-query";
import { bgWait } from "~/utils/promise";
import { getSafeUri } from "~/utils/string";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";
import type { PlayFromSource } from "~/stores/Playback/types";

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
export async function initServices() {
  GlyphToy.connect();

  //? Seems like we can setup the playback service in the background/headlessly.
  await AudioBrowser.setupPlayer();
  AudioBrowser.updateOptions(getAudioBrowserOptions());

  //#region Glyph Toy Events
  GlyphButton.onMount(() => GlyphToy.connect());

  GlyphButton.onTouchUp(async ({ action }) => {
    if (action === MatrixAction.PLAY_PAUSE) await PlaybackControls.playToggle();
    if (action === MatrixAction.SKIP) await PlaybackControls.next();
  });
  //#endregion

  //#region Media Events
  AudioBrowser.handleBeforeServiceKilled(async () => {
    if (!preferenceStore.getState().continuePlaybackOnDismiss)
      await revalidateWidgets({ openApp: true });
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
    AudioBrowser.add(formatTrackforPlayer(activeTrack));
  });

  // Called when "Smooth Playback Transition" doesn't trigger.
  AudioBrowser.onQueueEnded.addListener(async () => {
    const { playbackDelay } = preferenceStore.getState();
    if (playbackDelay > 0) await bgWait(playbackDelay * 1000);
    await PlaybackControls.next(true); // Prevent updating the repeat setting.
  });

  AudioBrowser.onActiveTrackChanged.addListener(async (e) => {
    if (e.index === undefined || e.track === undefined) return;
    const activeTrackUri = e.track.src;

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
    const erroredTrack = (queuedTrack || activeTrack) as AudioBrowser.Track;

    if (erroredTrack.src) {
      //! For some weird reason, `PlaybackError` may fire twice for a given track.
      if (erroredTrackUris.has(erroredTrack.src)) return;
      erroredTrackUris.add(erroredTrack.src);

      const erroredTrackObj = await db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.uri, erroredTrack.src!),
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
  async function fetchAlbums(): Promise<ResolvedTrack> {
    const allAlbums = await getAlbumsSummary(true);
    return {
      url: "/album",
      title: "Albums",
      children: allAlbums.map((album) => ({
        title: album.name,
        url: `/album/${album.id}`,
        artwork: album.artwork || PlaceholderImageFile,
        style: "grid" as const,
      })),
    };
  }

  async function fetchAlbum(id: string): Promise<ResolvedTrack> {
    const album = await getAlbum(id);
    return {
      url: `/album/${id}`,
      title: album.name,
      artwork: album.artwork || PlaceholderImageFile,
      children: album.tracks.map((track) => ({
        src: getSafeUri(track.uri),
        title: track.name,
        artist: getArtistsString(track.artists),
        artwork: album.artwork || PlaceholderImageFile,
        duration: track.duration,
      })),
    };
  }

  async function fetchPlaylists(): Promise<ResolvedTrack> {
    const allPlaylists = await getPlaylistsSummary(true);
    return {
      url: "/playlist",
      title: "Playlists",
      children: allPlaylists.map((playlist) => ({
        title: playlist.name,
        url: `/playlist/${playlist.id}`,
        artwork:
          (Array.isArray(playlist.artwork)
            ? playlist.artwork[0]
            : playlist.artwork) || PlaceholderImageFile,
        style: "grid" as const,
      })),
    };
  }

  async function fetchPlaylist(id: string): Promise<ResolvedTrack> {
    const playlist = await getPlaylist(id);
    return {
      url: `/playlist/${id}`,
      title: playlist.name,
      artwork:
        (Array.isArray(playlist.artwork)
          ? playlist.artwork[0]
          : playlist.artwork) || PlaceholderImageFile,
      children: playlist.tracks.map((track) => ({
        src: getSafeUri(track.uri),
        title: track.name,
        artist: getArtistsString(track.artists),
        artwork: track.artwork || PlaceholderImageFile,
        duration: track.duration,
      })),
    };
  }

  const listRoutes: Record<string, BrowserSource> = {
    "/album": () => fetchAlbums(),
    "/album/{id}": ({ routeParams }) => fetchAlbum(routeParams!.id!),
    "/playlist": () => fetchPlaylists(),
    "/playlist/{id}": ({ routeParams }) => fetchPlaylist(routeParams!.id!),
  };

  const configuration: BrowserConfiguration = {
    tabs: [
      {
        title: "Your Library",
        url: "/library",
      },
    ],
    routes: {
      ...listRoutes,
      "/library": {
        url: "/library",
        title: "Your Library",
        children: [
          {
            url: "/album",
            title: "Albums",
          },
          {
            url: "/playlist",
            title: "Playlists",
          },
        ],
      },
    },
    //* Only load a single track to be consistent with our playback strategy.
    singleTrack: true,
    //* Triggered when we select a track in Android Auto.
    handleTrackLoad: async (e) => {
      const trackUri = e.track.src;
      const androidAutoURL = e.track.url; // ie: `/album/srzxiew5ihjsxe6u706siqfq?__trackId=......`

      //? Fallback to playing the track in the Playback store if we don't
      //? have context on the selected track & list.
      if (!trackUri || !androidAutoURL) return PlaybackControls.play();

      //? Derive the `PlayFromSource` from the url.
      const [_, lType, lId] = androidAutoURL.split("?__trackId")[0]!.split("/");
      if (!lType || !lId) return PlaybackControls.play();
      const listSource = { type: lType, id: lId } as PlayFromSource;

      //? Get the id of the selected track since we can't pass it down.
      const activeTrack = await db.query.tracks.findFirst({
        where: (fields, { eq }) => eq(fields.uri, trackUri),
      });

      //? Simplist way of updating the Playback store when we change
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
