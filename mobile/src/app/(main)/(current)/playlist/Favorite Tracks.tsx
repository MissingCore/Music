import { FlashList } from "@shopify/flash-list";
import { useTranslation } from "react-i18next";

import { useFavoriteTracksForScreen } from "@/queries/favorite";
import { useBottomActionsContext } from "@/hooks/useBottomActionsContext";
import { CurrentListLayout } from "@/layouts/CurrentList";

import { PagePlaceholder } from "@/components/Transition";
import { TrackListPreset } from "@/modules/media/components";

/** Screen for displaying favorited tracks. */
export default function FavoriteTracksScreen() {
  const { t } = useTranslation();
  const { bottomInset } = useBottomActionsContext();
  const { isPending, error, data } = useFavoriteTracksForScreen();

  if (isPending || error) return <PagePlaceholder {...{ isPending }} />;

  // Information about this track list.
  const trackSource = { type: "playlist", id: data.name } as const;

  return (
    <CurrentListLayout
      title={data.name}
      metadata={data.metadata}
      imageSource={data.imageSource}
      mediaSource={trackSource}
    >
      <FlashList
        {...TrackListPreset({
          ...{ data: data.tracks, trackSource },
          emptyMessage: t("response.noTracks"),
        })}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        className="mx-4"
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
      />
    </CurrentListLayout>
  );
}
