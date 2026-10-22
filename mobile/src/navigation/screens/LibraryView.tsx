// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";

import type { LibraryTab } from "~/stores/Preference/types";

import Albums from "./albums/View";
import Artists from "./artists/View";
import Folders from "./folders/View";
import Genres from "./genres/View";
import Playlists from "./playlists/View";
import Tracks from "./tracks/View";

type Props = StaticScreenProps<{ category: LibraryTab; folderPath?: string }>;

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
  const Screen = RootScreenComponents[category];
  return <Screen path={folderPath} />;
}
