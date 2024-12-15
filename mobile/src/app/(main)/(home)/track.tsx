import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Sort } from "@/icons";
import { useTracksForTrackCard } from "@/queries/track";
import { StickyActionListLayout } from "@/layouts";

import { IconButton } from "@/components/Form";
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
      titleKey="common.tracks"
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
