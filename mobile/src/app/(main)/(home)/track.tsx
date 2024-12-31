import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Sort } from "@/icons/Sort";
import { useTracksForTrackCard } from "@/queries/track";
import { StickyActionListLayout } from "@/layouts";

import { IconButton } from "@/components/Form";
import { ReservedPlaylists } from "@/modules/media/constants";
import {
  MediaListControls,
  useTrackListPreset,
} from "@/modules/media/components";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracksForTrackCard();
  const listPresets = useTrackListPreset({
    ...{ data, trackSource, isPending },
    emptyMsgKey: "response.noTracks",
  });

  return (
    <StickyActionListLayout
      titleKey="common.tracks"
      StickyAction={<TrackActions />}
      estimatedActionSize={48}
      {...listPresets}
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
        onPress={() => SheetManager.show("TrackSortSheet")}
      >
        <Sort />
      </IconButton>
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion
