import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { playFromMediaList } from "~/modules/media/services/Playback";

import { AccentText } from "~/components/Typography/AccentText";
import { ReservedPlaylists } from "~/modules/media/constants";
import { SearchEngine } from "~/modules/search/components/SearchEngine";
import type { SearchCallbacks } from "~/modules/search/types";

/** List of media we want to appear in the search. */
const searchScope = ["album", "artist", "folder", "playlist", "track"] as const;

export default function Search() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  /* Actions that we want to run when we click on a search item. */
  const searchCallbacks: SearchCallbacks = useMemo(
    () => ({
      /* Visit the media's page. */
      album: ({ id }) => navigation.push("Album", { id }),
      artist: ({ name }) => navigation.push("Artist", { id: name }),
      playlist: ({ name }) => navigation.push("Playlist", { id: name }),
      /* Play the specified track. */
      track: ({ id }) =>
        playFromMediaList({
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
      <AccentText className="text-4xl">{t("feat.search.title")}</AccentText>
      <SearchEngine searchScope={searchScope} callbacks={searchCallbacks} />
    </View>
  );
}
