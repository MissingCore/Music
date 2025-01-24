import { FlashList } from "@shopify/flash-list";

import { useFavoriteTracksForScreen } from "~/queries/favorite";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { CurrentListLayout } from "~/layouts/CurrentList";

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
  const listPresets = useTrackListPreset({
    ...{ data: data?.tracks, trackSource },
    emptyMsgKey: "response.noTracks",
  });

  if (isPending || error) return <PagePlaceholder {...{ isPending }} />;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <FlashList
        {...listPresets}
        className="mx-4"
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
    </CurrentListLayout>
  );
}
