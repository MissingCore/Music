import { useFavoriteTracksForScreen } from "~/queries/favorite";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { CurrentListLayout } from "~/layouts/CurrentList";

import { LegendList } from "~/components/Defaults";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { ReservedPlaylists } from "~/modules/media/constants";
import { useTrackListPreset } from "~/modules/media/components/Track";

/** Screen for displaying favorited tracks. */
export default function FavoriteTracksScreen() {
  // Information about this track list.
  const trackSource = {
    type: "playlist",
    id: ReservedPlaylists.favorites,
  } as const;

  const { bottomInset } = useBottomActionsContext();
  const { isPending, error, data } = useFavoriteTracksForScreen();
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <LegendList
        contentContainerClassName="px-4 pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        {...presets}
      />
    </CurrentListLayout>
  );
}
