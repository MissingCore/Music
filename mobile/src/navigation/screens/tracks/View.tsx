import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Sort } from "~/resources/icons/Sort";
import { useTracksForTrackCard } from "~/queries/track";
import { StickyActionListLayout } from "~/layouts/StickyActionScroll";
import { TrackSortSheet } from "~/screens/Sheets/TrackSort";

import { IconButton } from "~/components/Form/Button";
import { useSheetRef } from "~/components/Sheet";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { useTrackListPreset } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function Tracks() {
  const { isPending, data } = useTracksForTrackCard();
  const presets = useTrackListPreset({ data, isPending, trackSource });
  const trackSortSheetRef = useSheetRef();

  return (
    <>
      <TrackSortSheet sheetRef={trackSortSheetRef} />
      <StickyActionListLayout
        titleKey="term.tracks"
        StickyAction={
          <TrackActions
            showSheet={() => trackSortSheetRef.current?.present()}
          />
        }
        estimatedActionSize={48}
        {...presets}
      />
    </>
  );
}

//#region Actions
/** Actions used on the `/track` screen. */
function TrackActions(props: { showSheet: VoidFunction }) {
  const { t } = useTranslation();
  return (
    <View className="w-full flex-row items-center justify-between rounded-md bg-surface">
      <IconButton
        Icon={Sort}
        accessibilityLabel={t("feat.modalSort.title")}
        onPress={props.showSheet}
      />
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion
