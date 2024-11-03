import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import type { TrackWithAlbum } from "@/db/schema";
import { getTracks } from "@/db/queries";
import { getTrackCover } from "@/db/utils/formatters";

import { Sort } from "@/icons";
import { useSessionPreferencesStore } from "@/services/SessionPreferences";
import { StickyActionListLayout } from "@/layouts";

import { trackKeys } from "@/constants/QueryKeys";
import { IconButton } from "@/components/new/Form";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaListControls, TrackListPreset } from "@/modules/media/components";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useTracksForTrackCard();

  return (
    <StickyActionListLayout
      title={t("common.tracks")}
      StickyAction={<TrackActions />}
      estimatedActionSize={48}
      {...TrackListPreset({
        ...{ data, trackSource, isPending },
        emptyMessage: t("response.noTracks"),
      })}
    />
  );
}

//#region Actions
/** Actions used on the `/track` screen. */
function TrackActions() {
  const { t } = useTranslation();
  return (
    <View className="w-full flex-row items-center justify-between rounded-md bg-surface">
      <IconButton
        kind="ripple"
        accessibilityLabel={t("title.sort")}
        onPress={() => SheetManager.show("track-sort-sheet")}
      >
        <Sort />
      </IconButton>
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion

//#region Data
const useTracksForTrackCard = () => {
  const isAsc = useSessionPreferencesStore((state) => state.isAsc);
  const orderedBy = useSessionPreferencesStore((state) => state.orderedBy);

  return useQuery({
    queryKey: trackKeys.all,
    queryFn: () => getTracks(),
    staleTime: Infinity,
    select: (data) => {
      // FIXME: Once Hermes supports `toSorted` & `toReversed`, use those
      // instead of the in-place methods.
      let sortedTracks: TrackWithAlbum[] = [...data];
      // Order track by attribute.
      if (orderedBy === "alphabetical") {
        sortedTracks.sort((a, b) => a.name.localeCompare(b.name));
      } else if (orderedBy === "modified") {
        sortedTracks.sort((a, b) => a.modificationTime - b.modificationTime);
      }
      // Sort tracks in descending order.
      if (!isAsc) sortedTracks.reverse();

      // Format tracks.
      return sortedTracks.map((tk) => ({
        id: tk.id,
        title: tk.name,
        description: tk.artistName ?? "—",
        imageSource: getTrackCover(tk),
      }));
    },
  });
};
//#endregion
