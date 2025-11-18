import { useTranslation } from "react-i18next";

import { useFavoriteTracksForScreen } from "~/queries/favorite";
import { useBottomActionsInset } from "../../hooks/useBottomActions";
import { CurrentListLayout } from "../../layouts/CurrentList";

import { FlashList } from "~/components/Defaults";
import { ReservedPlaylists } from "~/modules/media/constants";
import { useTrackListPreset } from "~/modules/media/components/Track";
import { CurrentListMenu } from "../../components/CurrentListMenu";
import { PagePlaceholder } from "../../components/Placeholder";
import { ScreenOptions } from "../../components/ScreenOptions";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.favorites,
} as const;

export default function FavoriteTracks() {
  const { t } = useTranslation();
  const bottomInset = useBottomActionsInset();
  const { isPending, error, data } = useFavoriteTracksForScreen();
  const presets = useTrackListPreset({ data: data?.tracks, trackSource });

  if (isPending || error) return <PagePlaceholder isPending={isPending} />;

  return (
    <>
      <ScreenOptions
        headerRight={() => (
          <CurrentListMenu
            name={t("term.favoriteTracks")}
            trackIds={data.tracks.map(({ id }) => id)}
          />
        )}
      />
      <CurrentListLayout
        title={data.name}
        metadata={data.metadata}
        imageSource={data.imageSource}
        mediaSource={trackSource}
      >
        <FlashList
          {...presets}
          contentContainerClassName="px-4 pt-4"
          contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
        />
      </CurrentListLayout>
    </>
  );
}
