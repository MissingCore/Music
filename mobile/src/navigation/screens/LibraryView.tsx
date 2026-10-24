// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useEffectEvent, useState } from "react";

import { preferenceStore } from "~/stores/Preference/store";
import type { LibraryTab } from "~/stores/Preference/types";
import { useBackHandler } from "~/hooks/useBackHandler";

import Albums from "./albums/View";
import Artists from "./artists/View";
import Folders from "./folders/View";
import Genres from "./genres/View";
import Playlists from "./playlists/View";
import Tracks from "./tracks/View";
import { RootToolbar } from "../components/BottomActions/RootToolbar";

type Props = StaticScreenProps<{
  //? Internally, we support `undefined`.
  screen: LibraryTab;
  folderPath?: string;
}>;

const RootScreenComponents = {
  album: Albums,
  artist: Artists,
  folder: Folders,
  genre: Genres,
  playlist: Playlists,
  track: Tracks,
} as const;

export default function Library({
  route: {
    params: { screen, folderPath },
  },
}: Props) {
  const navigation = useNavigation("Library");
  const isFocused = useIsFocused();
  const [history, setHistory] = useState<LibraryTab[]>(() => [
    preferenceStore.getState().defaultLibraryTab,
  ]);

  //? Have back action pop from the Library "stack".
  useBackHandler(
    () => {
      if (history.length <= 1) return false;
      setHistory((prev) => prev.slice(0, -1));
      return true;
    },
    [history],
    isFocused,
  );

  const updateHistory = useEffectEvent(() => {
    const historyIdx = history.findIndex((tab) => tab === screen);
    if (historyIdx === -1) setHistory((prev) => [...prev, screen]);
    else setHistory((prev) => prev.slice(0, historyIdx + 1));
    navigation.setParams({ screen: undefined });
  });

  useEffect(() => {
    if (screen) updateHistory();
  }, [screen]);

  const currentTab = history.at(-1)!;
  const Screen = RootScreenComponents[currentTab];
  return (
    <>
      <RootToolbar libraryTab={currentTab} />
      <Screen path={folderPath} />
    </>
  );
}
