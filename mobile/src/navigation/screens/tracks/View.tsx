import { useMemo } from "react";

import { useTracks } from "~/queries/track";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";

import { NScrollListLayout } from "~/navigation/layouts/NScrollLayout";
import { TracksViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";

import { ReservedPlaylists } from "~/modules/media/constants";
import {
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { PlayMediaListButton } from "~/modules/media/components/MediaListControls";
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
      Actions={<TrackActions />}
      {...presets}
    />
  );
}

//#region Actions
/** Actions used on the `/track` screen. */
function TrackActions() {
  return (
    <>
      <PlayMediaListButton
        trackSource={trackSource}
        size="sm"
        className="rounded-full"
      />
      <RepeatButton size="sm" />
      <ShuffleButton size="sm" />
    </>
  );
}
//#endregion
