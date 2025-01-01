import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { playFromMediaList } from "@/modules/media/services/Playback";

import { AccentText } from "@/components/Typography/AccentText";
import { ReservedPlaylists } from "@/modules/media/constants";
import { SearchEngine } from "@/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "@/modules/search/types";

/** Screen for `/search` route. */
export default function SearchScreen() {
  const { t } = useTranslation();
  return (
    <View className="grow gap-6 px-4 pt-2">
      <AccentText className="text-4xl">{t("header.search")}</AccentText>
      <SearchEngine searchScope={searchScope} callbacks={searchCallbacks} />
    </View>
  );
}

/** List of media we want to appear in the search. */
const searchScope = ["album", "artist", "playlist", "track"] as const;

/** Actions that we want to run when we click on a search item. */
const searchCallbacks: SearchCallbacks = {
  /* Visit the media's page. */
  album: ({ id }) => router.push(`/album/${id}`),
  artist: ({ name }) => router.push(`/artist/${encodeURIComponent(name)}`),
  playlist: ({ name }) => router.push(`/playlist/${encodeURIComponent(name)}`),
  /* Play the specified track. */
  track: ({ id }) =>
    playFromMediaList({
      trackId: id,
      source: { type: "playlist", id: ReservedPlaylists.tracks },
    }),
};
