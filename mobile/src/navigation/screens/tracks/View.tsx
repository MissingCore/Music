// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";

import { useSortedTracks } from "~/data/track/queries";
import { useDelayedReady } from "~/hooks/useDelayedReady";

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
  //? Defer query to enable the header to mount (as the query will block
  //? the JS thread if the user has lots of tracks).
  const isReady = useDelayedReady(1);
  const { isPending, data } = useSortedTracks(isReady);

  const formattedData = useMemo(
    () =>
      data?.map((t) => ({
        id: t.id,
        imageSource: t.artwork,
        title: t.name,
        description: t.artistName ?? "—",
      })),
    [data],
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
      <PlayMediaListButton trackSource={trackSource} />
      <RepeatButton size="sm" />
      <ShuffleButton size="sm" />
    </>
  );
}
//#endregion
