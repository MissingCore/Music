// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useEffectEvent, useState } from "react";

import { usePreferenceStore } from "~/stores/Preference/store";
import type { LibraryTab } from "~/stores/Preference/types";
import { useBackHandler } from "~/hooks/useBackHandler";

import Albums from "./albums/View";
import Artists from "./artists/View";
import Folders from "./folders/View";
import Genres from "./genres/View";
import Playlists from "./playlists/View";
import Tracks from "./tracks/View";

type Props = StaticScreenProps<{
  //? Internally, we support `undefined`.
  category: LibraryTab;
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
    params: { category, folderPath },
  },
}: Props) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const defaultLibraryTab = usePreferenceStore((s) => s.defaultLibraryTab);
  const [history, setHistory] = useState<LibraryTab[]>([defaultLibraryTab]);

  //? Have back action pop from the Library "stack".
  useBackHandler(
    () => {
      setHistory((prev) => prev.slice(0, -1));
      return true;
    },
    [],
    isFocused && history.length > 1,
  );

  const updateHistory = useEffectEvent(() => {
    const historyIdx = history.findIndex((tab) => tab === category);
    if (historyIdx === -1) setHistory((prev) => [...prev, category]);
    else setHistory((prev) => prev.slice(0, historyIdx + 1));
    // @ts-expect-error - Internally, we support `undefined`.
    navigation.setParams({ category: undefined });
  });

  useEffect(() => {
    if (category) updateHistory();
  }, [category]);

  const Screen = RootScreenComponents[history.at(-1)!];
  return <Screen path={folderPath} />;
}
