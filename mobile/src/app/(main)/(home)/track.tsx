import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { SheetManager } from "react-native-actions-sheet";

import { Sort } from "~/icons/Sort";
import { useTracksForTrackCard } from "~/queries/track";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";

import { IconButton } from "~/components/Form/Button";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { useTrackListPreset } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracksForTrackCard();
  const presets = useTrackListPreset({ data, isPending, trackSource });

  return (
    <StickyActionListLayout
      titleKey="term.tracks"
      StickyAction={<TrackActions />}
      estimatedActionSize={48}
      {...presets}
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
        accessibilityLabel={t("feat.modalSort.title")}
        onPress={() => SheetManager.show("TrackSortSheet")}
      >
        <Sort />
      </IconButton>
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion
