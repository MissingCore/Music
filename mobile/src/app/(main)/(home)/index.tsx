import { router } from "expo-router";
import type { ScrollViewProps } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

import {
  useFavoriteListsForCards,
  useFavoriteTracksCount,
} from "~/queries/favorite";
import { useUserPreferencesStore } from "~/services/UserPreferences";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useRecentListStore } from "~/modules/media/services/RecentList";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { abbreviateNum } from "~/utils/number";
import { LegendList } from "~/components/Defaults";
import { Button } from "~/components/Form/Button";
import { AccentText } from "~/components/Typography/AccentText";
import { TEm, TStyledText } from "~/components/Typography/StyledText";
import { ReservedPlaylists } from "~/modules/media/constants";
import {
  MediaCard,
  MediaCardPlaceholderContent,
  useMediaCardListPreset,
} from "~/modules/media/components/MediaCard";

/** Screen for `/` route. */
export default function HomeScreen() {
  return (
    <StandardScrollLayout
      titleKey="term.home"
      contentContainerClassName="grow-0"
    >
      <RecentlyPlayed />
      <TEm textKey="term.favorites" className="-mb-4" />
      <Favorites />
    </StandardScrollLayout>
  );
}

//#region Recently Played List
/** Display list of media recently played. */
function RecentlyPlayed() {
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });
  const recentlyPlayedData = useRecentListStore((state) => state.recentList);
  const shouldShow = useUserPreferencesStore((state) => state.showRecent);

  if (!shouldShow) return null;
  return (
    <>
      <TEm textKey="feat.playedRecent.title" className="-mb-4" />
      <LegendList
        estimatedItemSize={width}
        horizontal
        data={recentlyPlayedData}
        keyExtractor={({ href }) => href}
        renderItem={({ item }) => <MediaCard {...item} size={width} />}
        ListEmptyComponent={
          <TStyledText
            textKey="feat.playedRecent.extra.empty"
            className="my-4"
          />
        }
        renderScrollComponent={CustomScrollComponent}
        columnWrapperStyle={{ columnGap: 12 }}
        // To avoid warning for the list having a height of 0.
        style={
          recentlyPlayedData.length > 0 ? { height: width + 39 } : undefined
        }
        className="-mx-4"
        contentContainerClassName="px-4"
      />
    </>
  );
}

function CustomScrollComponent(props: ScrollViewProps) {
  return <ScrollView {...props} />;
}
//#endregion

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
  const presets = useMediaCardListPreset({
    data: [MediaCardPlaceholderContent, ...(data ?? [])],
    RenderFirst: FavoriteTracks,
  });

  // Similar issue to the one with `<SearchEngine />` in which the first
  // change in the data causes nothing to render.
  return <LegendList {...presets} resetWithUndefined />;
}

/**
 * Displays the number of favorited tracks and opens up the playlist of
 * favorited tracks.
 */
function FavoriteTracks(props: { size: number }) {
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      onPress={() =>
        router.navigate(`/playlist/${ReservedPlaylists.favorites}`)
      }
      style={{ width: props.size, height: props.size, marginBottom: 39 }}
      className="gap-0 rounded-lg bg-red"
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <TStyledText textKey="term.tracks" className="text-neutral100" />
    </Button>
  );
}
//#endregion
