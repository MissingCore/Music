import { useFavoriteTracksForScreen } from "~/queries/favorite";
import { useBottomActionsInset } from "../../hooks/useBottomActions";
import { CurrentListLayout } from "../../layouts/CurrentList";

import { FlashList } from "~/components/Defaults";
import { ReservedPlaylists } from "~/modules/media/constants";
import { useTrackListPreset } from "~/modules/media/components/Track";
import { PagePlaceholder } from "../../components/Placeholder";

export default function FavoriteTracks() {
  // Information about this track list.
  const trackSource = {
    type: "playlist",
    id: ReservedPlaylists.favorites,
  } as const;

  const bottomInset = useBottomActionsInset();
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
      <FlashList
        contentContainerClassName="px-4 pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        {...presets}
      />
    </CurrentListLayout>
  );
}
