// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { count, desc, eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

import { getArtistsString } from "~/data/artist/utils";
import { fromJSONArrayString } from "~/data/utils";
import { commonTrackColumns, structuredTracksView } from "~/data/views";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { getSubqueryFields, iAsc } from "~/lib/drizzle";
import { pickKeys } from "~/utils/object";
import { FlatList } from "~/components/Base/List";
import { Divider } from "~/components/Divider";
import { SegmentedList } from "~/components/List/Segmented";
import { StyledText } from "~/components/Typography/StyledText";

export default function MostPlayed() {
  const insets = useSafeAreaInsets();
  const { isPending, data } = useMostPlayedTracks();

  if (isPending || data?.length === 0) {
    return (
      <ContentPlaceholder isPending={isPending} errMsgKey="err.msg.noResults" />
    );
  }
  return (
    <SegmentedList
      scrollEnabled
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      contentContainerClassName="p-4"
    >
      {data?.map((item) => (
        <SegmentedList.CustomItem key={item.placement} className="flex-row p-1">
          <PlacementNumber placement={item.placement} />
          <PlayCountList tracks={item.tracks} />
        </SegmentedList.CustomItem>
      ))}
    </SegmentedList>
  );
}

//#region List Components
function PlacementNumber({ placement }: { placement: number }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{placement}</StyledText>
    </View>
  );
}

function PlayCountList({ tracks }: { tracks: TrackData[] }) {
  const { t } = useTranslation();
  return (
    <FlatList
      data={tracks}
      keyExtractor={({ id }) => id}
      renderItem={({
        item: { name, artistsString, albumName, playCount },
        index,
      }) => (
        <View className="gap-2">
          <View>
            <StyledText className="text-sm">{name}</StyledText>
            {artistsString ? (
              <StyledText dim className="text-onSurface/80">
                {artistsString}
              </StyledText>
            ) : null}
            {albumName ? <StyledText dim>{albumName}</StyledText> : null}
          </View>
          <Divider />
          {tracks.length - 1 === index ? (
            <StyledText numberOfLines={1} className="text-xs text-primary">
              {t("feat.mostPlayed.extra.playCount", { count: playCount })}
            </StyledText>
          ) : null}
        </View>
      )}
      className="shrink grow gap-2 p-2 pr-3"
    />
  );
}
//#endregion

//#region Data Query
type TrackData = {
  id: string;
  name: string;
  playCount: number;
  artistsString: string | null;
  albumName: string | null;
};

type MostPlayedPlacement = { placement: number; tracks: TrackData[] };

const aggregatedPlayCountView = db
  .select({
    ...commonTrackColumns,
    playCount: count(tracksPlayEvents.id).as("play_count"),
  })
  .from(tracksPlayEvents)
  .innerJoin(
    structuredTracksView,
    eq(tracksPlayEvents.trackId, structuredTracksView.id),
  )
  .groupBy(tracksPlayEvents.trackId)
  .as("aggregated_play_count");

const wantedPlayCountColumns = pickKeys(
  getSubqueryFields(aggregatedPlayCountView),
  ["id", "name", "playCount", "albumName", "artists"],
);

async function getMostPlayedTracks() {
  const mostPlayedTracks = await db
    .select(wantedPlayCountColumns)
    .from(aggregatedPlayCountView)
    .orderBy(
      desc(aggregatedPlayCountView.playCount),
      iAsc(aggregatedPlayCountView.name),
    )
    .limit(100);

  const groupedPlacement: MostPlayedPlacement[] = [];
  let recentPlacement: MostPlayedPlacement | undefined;
  mostPlayedTracks.forEach(({ artists, ...track }) => {
    const formattedTrack = {
      ...track,
      artistsString: getArtistsString(fromJSONArrayString(artists), null),
    };

    if (!recentPlacement) {
      recentPlacement = { placement: 1, tracks: [formattedTrack] };
      return;
    }

    // If the current track belongs in the same placement.
    if (recentPlacement.tracks.at(-1)!.playCount === formattedTrack.playCount) {
      recentPlacement.tracks.push(formattedTrack);
      return;
    }

    // If this track is of a lower placement.
    groupedPlacement.push(recentPlacement);
    recentPlacement = {
      placement: recentPlacement.placement + recentPlacement.tracks.length,
      tracks: [formattedTrack],
    };
  });

  // Push last placement.
  if (recentPlacement) groupedPlacement.push(recentPlacement);

  return groupedPlacement;
}

const queryKey = ["insights", "most-played"];

function useMostPlayedTracks() {
  return useQuery({
    queryKey,
    queryFn: getMostPlayedTracks,
    gcTime: 0,
    staleTime: 0,
  });
}
//#endregion
