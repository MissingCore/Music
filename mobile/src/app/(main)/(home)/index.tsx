import { router } from "expo-router";
import { ScrollView } from "react-native-gesture-handler";

import {
  useFavoriteListsForCards,
  useFavoriteTracksCount,
} from "~/queries/favorite";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useRecentListStore } from "~/modules/media/services/RecentList";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { cn } from "~/lib/style";
import { abbreviateNum } from "~/utils/number";
import { FlashList } from "~/components/Defaults";
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
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });
  const recentlyPlayedData = useRecentListStore((state) => state.recentList);
  return (
    <>
      <TEm textKey="feat.playedRecent.title" className="-mb-4" />
      <FlashList
        key={`${recentlyPlayedData.length === 0}`}
        estimatedItemSize={width + 12} // Column width + gap from padding left
        horizontal
        data={recentlyPlayedData}
        keyExtractor={({ href }) => href}
        renderItem={({ item, index }) => (
          <MediaCard
            {...item}
            size={width}
            className={index > 0 ? "ml-3" : undefined}
          />
        )}
        ListEmptyComponent={
          <TStyledText
            textKey="feat.playedRecent.extra.empty"
            className="my-4"
          />
        }
        renderScrollComponent={ScrollView}
        className="-mx-4"
        contentContainerClassName="px-4"
      />
    </>
  );
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

  return <FlashList {...presets} />;
}

/**
 * Displays the number of favorited tracks and opens up the playlist of
 * favorited tracks.
 */
function FavoriteTracks(props: { size: number; className: string }) {
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      onPress={() =>
        router.navigate(`/playlist/${ReservedPlaylists.favorites}`)
      }
      style={{ width: props.size, height: props.size }}
      className={cn("gap-0 rounded-lg bg-red", props.className)}
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <TStyledText textKey="term.tracks" className="text-neutral100" />
    </Button>
  );
}
//#endregion
