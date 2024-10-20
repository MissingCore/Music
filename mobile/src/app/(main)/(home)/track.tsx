import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { getTracks } from "@/db/queries";
import { formatTracksForTrack } from "@/db/utils/formatters";

import { Sort } from "@/resources/icons";
import { useTheme } from "@/hooks/useTheme";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { trackKeys } from "@/constants/QueryKeys";
import { Ripple } from "@/components/new/Form";
import { ReservedPlaylists } from "@/modules/media/constants";
import { MediaListControls, TrackList } from "@/modules/media/components";

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { t } = useTranslation();
  const { isPending, data } = useTracksForTrackCard();
  const { canvas } = useTheme();

  // Information about this track list.
  const trackSource = {
    type: "playlist",
    id: ReservedPlaylists.tracks,
  } as const;

  return (
    <TrackList
      {...{ data, trackSource }}
      isLoading={isPending}
      emptyMessage={t("response.noTracks")}
      renderScrollComponent={(props) => (
        <StickyActionLayout
          title={t("common.tracks")}
          StickyAction={
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
          }
          {...props}
        />
      )}
    />
  );
}

//#region Data
const useTracksForTrackCard = () =>
  useQuery({
    queryKey: trackKeys.all,
    queryFn: () => getTracks(),
    staleTime: Infinity,
    select: (data) => formatTracksForTrack({ type: "track", data }),
  });
//#endregion
