import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Sort } from "~/icons/Sort";
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

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracksForTrackCard();
  const listPresets = useTrackListPreset({
    ...{ data, trackSource, isPending },
    emptyMsgKey: "err.msg.noTracks",
  });
  const trackSortSheetRef = useSheetRef();

  const renderStickyAction = useMemo(
    () => (
      <TrackActions showSheet={() => trackSortSheetRef.current?.present()} />
    ),
    [trackSortSheetRef],
  );

  return (
    <>
      <StickyActionListLayout
        titleKey="term.tracks"
        StickyAction={renderStickyAction}
        estimatedActionSize={48}
        {...listPresets}
      />

      <TrackSortSheet sheetRef={trackSortSheetRef} />
    </>
  );
}

//#region Actions
/** Actions used on the `/track` screen. */
function TrackActions(props: { showSheet: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="w-full flex-row items-center justify-between rounded-md bg-surface">
      <IconButton
        kind="ripple"
        accessibilityLabel={t("feat.modalSort.title")}
        onPress={props.showSheet}
      >
        <Sort />
      </IconButton>
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion
