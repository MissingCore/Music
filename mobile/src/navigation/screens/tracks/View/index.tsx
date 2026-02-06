import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { Sort } from "~/resources/icons/Sort";
import { useTracks } from "~/queries/track";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { TracksViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";

import { IconButton } from "~/components/Form/Button/Icon";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { useTrackListPreset } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function Tracks() {
  const { isPending, data } = useTracks();

  const sortedData = useViewOrder("track", data);
  const formattedData = useMemo(
    () =>
      sortedData.map((t) => ({
        id: t.id,
        imageSource: t.artwork,
        title: t.name,
        description: t.artistName ?? "—",
      })),
    [sortedData],
  );

  const presets = useTrackListPreset({
    data: formattedData,
    isPending,
    trackSource,
  });

  return (
    <NScrollListLayout
      titleKey="term.tracks"
      OptionsSheet={TracksViewOptionsSheet}
      {...presets}
    />
  );
}

//#region Actions
/** Actions used on the `/track` screen. */
function TrackActions(props: { showSheet: VoidFunction }) {
  const { t } = useTranslation();
  return (
    <View className="w-full flex-row items-center justify-between rounded-md bg-surfaceContainerLowest">
      <IconButton
        Icon={Sort}
        accessibilityLabel={t("feat.modalViewPreference.title")}
        onPress={props.showSheet}
      />
      <MediaListControls trackSource={trackSource} />
    </View>
  );
}
//#endregion
