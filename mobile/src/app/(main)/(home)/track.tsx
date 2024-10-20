import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getTracks } from "@/db/queries";
import { formatTracksForTrack } from "@/db/utils/formatters";

import { Sort } from "@/resources/icons";
import { useTheme } from "@/hooks/useTheme";
import { StickyActionListLayout } from "@/layouts/StickyActionLayout";

import { trackKeys } from "@/constants/QueryKeys";
import { Ripple } from "@/components/new/Form";
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
  const { canvas } = useTheme();

  return (
    <View className="w-full flex-row items-center justify-between rounded-md bg-surface">
      <Ripple
        preset="icon"
        accessibilityLabel={t("title.sort")}
        android_ripple={{ color: `${canvas}40` }}
        onPress={() => console.log("Opening sort modal...")}
      >
        <Sort />
      </Ripple>
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion

//#region Data
const useTracksForTrackCard = () =>
  useQuery({
    queryKey: trackKeys.all,
    queryFn: () => getTracks(),
    staleTime: Infinity,
    select: (data) => formatTracksForTrack({ type: "track", data }),
  });
//#endregion
