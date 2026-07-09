// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { PlaybackControls } from "~/stores/Playback/actions";

import { AccentText } from "~/components/Typography/AccentText";
import { ReservedPlaylists } from "~/modules/media/constants";
import { SearchEngine } from "../components/SearchEngine";
import type { SearchCallbacks } from "../types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "artist", "folder", "playlist", "track"] as const;

export default function Search() {
  const { t } = useTranslation();
  const navigation = useNavigation("Search");

  /* Actions that we want to run when we click on a search item. */
  const searchCallbacks: SearchCallbacks = useMemo(
    () => ({
      /* Visit the media's page. */
      album: ({ id }) => navigation.navigate("Album", { id }),
      artist: ({ name }) => navigation.navigate("Artist", { id: name }),
      playlist: ({ name }) => navigation.navigate("Playlist", { id: name }),
      /* Play the specified track. */
      track: ({ id }) =>
        PlaybackControls.playFromList({
          trackId: id,
          source: { type: "playlist", id: ReservedPlaylists.tracks },
        }),
      /*
        Navigate to the folder route, meaning a "back" action won't bring us
        back to this screen.

        Although using `push()` works, things become a bit janky as:
          1. The navigation bar won't work the way we expect.
          2. If we use this pushed screen, at a certain point when using the
          "back" gesture, we'll end up back to this screen, which might be a
          bit unexpected.
      */
      folder: ({ path }) =>
        navigation.popTo("HomeScreens", {
          screen: "Folders",
          params: { path },
        }),
    }),
    [navigation],
  );

  return (
    <View className="shrink grow gap-6 px-4 pt-2">
      <AccentText>{t("feat.search.title")}</AccentText>
      <SearchEngine
        searchScope={searchScope}
        callbacks={searchCallbacks}
        withTrackActions
      />
    </View>
  );
}
