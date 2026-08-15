// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { saveBundledAssetToURI } from "@missingcore/native-utils";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Directory, File } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useReducer } from "react";
import { Image } from "react-native";
import AudioBrowser from "react-native-audio-browser";

import { db, expoSQLiteDB } from "~/db";
import migrations from "~/db/drizzle/migrations";

import { IS_DEV } from "~/env";
import { playbackStore } from "~/stores/Playback/store";
import { preferenceStore } from "~/stores/Preference/store";
import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import { equalizerStore } from "~/modules/audio/equalizer/core/store";
import {
  _initEQStore,
  setEQPreset,
} from "~/modules/audio/equalizer/core/actions";
import { lyricStore } from "~/modules/lyric/core/store";

import {
  ImageDirectory,
  PlaceholderDirectory,
  PlaceholderImageFile,
} from "~/lib/file-system";
import { getAudioBrowserOptions } from "~/lib/react-native-audio-browser";
import { Stopwatch } from "~/utils/debug";
import { FontDirectory } from "~/modules/customization/font/core/data";
import { PlayedListsTracker } from "~/modules/insights/core/PlayedListsTracker";
import { checkForMigrations } from "~/modules/scanning/helpers/migrations";
import { revalidateWidgets } from "~/modules/widget/utils";
import { RepeatModes } from "~/stores/Playback/constants";
import { headlessAudioBrowserSetup } from "./audioBrowser";

interface State {
  success: boolean;
  error?: Error;
}

type Action =
  | { type: "start" }
  | { type: "completed"; payload: true }
  | { type: "error"; payload: Error };

const initState: State = { success: false, error: undefined };
const startupReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "start":
      return { ...initState };
    case "completed":
      return { ...initState, success: action.payload };
    case "error":
      return { ...initState, error: action.payload };
    default:
      return state;
  }
};

/** Systematically setup app to prevent timing issues. */
export function useStartup() {
  const [state, dispatch] = useReducer(startupReducer, initState);
  useDevOnly(expoSQLiteDB);

  useEffect(() => {
    dispatch({ type: "start" });
    startupFlow()
      .then(() => dispatch({ type: "completed", payload: true }))
      .catch((err) => dispatch({ type: "error", payload: err }));
  }, []);

  return state;
}

/** Only run Expo dev tools plugins during development. */
function useDevOnly(db: SQLiteDatabase | null) {
  const hook = IS_DEV ? useDrizzleStudio : () => {};
  return hook(db);
}

async function startupFlow() {
  const stopwatch = new Stopwatch();

  //? 1. Ensure all migrations are applied.
  await migrate(db, migrations);

  //? 2. Enable foreign key constraint after we're sure Drizzle migrations
  //? have completed.
  await expoSQLiteDB.execAsync("PRAGMA foreign_keys = ON;");

  //? 3. Ensure content directories are defined.
  const imgDir = new Directory(ImageDirectory);
  if (!imgDir.exists) imgDir.create();

  const placeholderDir = new Directory(PlaceholderDirectory);
  if (!placeholderDir.exists) placeholderDir.create();

  //? Save a bundled asset to the local file system as we can't pass a
  //? `require()` image to `react-native-audio-browser`.
  //? - Ref: https://github.com/expo/expo/issues/41996#issuecomment-3724350425
  try {
    const fallbackImg = new File(PlaceholderImageFile);
    if (fallbackImg.exists) return;
    await saveBundledAssetToURI(
      Image.resolveAssetSource(require("~/resources/images/music-glyph.png"))
        .uri,
      PlaceholderImageFile,
    );
  } catch (err) {
    console.log(err);
  }

  const fontDir = new Directory(FontDirectory);
  if (!fontDir.exists) fontDir.create();

  //? 4. Ensure all persisted stores are hydrated.
  //! The Playback store hydration can't be deferred due to a potential
  //! issue of being overriden if we play a track via Android Auto.
  if (!playbackStore.getState()._hasHydrated)
    await playbackStore.persist.rehydrate();
  await preferenceStore.persist.rehydrate();
  await equalizerStore.persist.rehydrate();
  await lyricStore.persist.rehydrate();
  await viewPreferenceStore.persist.rehydrate();

  //? 5. Ensure AudioBrowser is setup.
  await headlessAudioBrowserSetup;

  //? 6. Initialize services that relies on AudioBrowser being initialized.
  _initEQStore();

  // Prevent Android Auto from reading stale cached data on app launch
  // if it's reusing a prior session.
  //  - This should be enough as you shouldn't be changing anything
  //  in the current Android Auto session as should be driving.
  AudioBrowser.revalidateBrowser();

  // Ensure widget has up-to-date data as the Playback store isn't
  // immediately hydrated.
  await revalidateWidgets({ openApp: !playbackStore.getState().isPlaying });

  //? 7. Apply user preferences.
  const {
    repeat,
    playingFrom,
    activeKey,
    isReplayGainEnabled,
    restoreVolume,
    volume,
  } = playbackStore.getState();
  const { restoreLastPosition, continuePlaybackOnDismiss } =
    preferenceStore.getState();
  if (restoreLastPosition) {
    playbackStore.setState({ _restoredTrackKey: activeKey });
  } else {
    playbackStore.setState({ _hasRestoredPosition: true, lastPosition: 0 });
  }

  // Ensure correct AudioBrowser settings.
  AudioBrowser.updateOptions(
    getAudioBrowserOptions({ continuePlaybackOnDismiss }),
  );
  if (repeat === RepeatModes.REPEAT_ONE) AudioBrowser.setRepeatMode("track");
  if (restoreVolume) AudioBrowser.setVolume(volume);
  else playbackStore.setState({ volume: 1 }); //? Ensure it's reset after turning setting off.
  AudioBrowser.setReplayGainStatus(isReplayGainEnabled);

  // Ensure equalizer settings are loaded.
  const { enabled, preset } = equalizerStore.getState();
  if (enabled) {
    AudioBrowser.setEqualizerEnabled(true);
    setEQPreset(preset);
  }

  // Ensure the current list is at the top of recently played lists.
  if (playingFrom) await PlayedListsTracker.add(playingFrom);

  //? 8. Ensure migrations are applied.
  stopwatch.lapTime();
  await checkForMigrations();
  console.log(`Completed migrations in ${stopwatch.lapTime()}.`);

  console.log(`Completed setup in ${stopwatch.stop()}.`);
}
