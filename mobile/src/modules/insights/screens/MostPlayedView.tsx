// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { desc, eq, sql } from "drizzle-orm";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";
import { tracksPlayEvents } from "~/db/schema";

import { getArtistsString } from "~/data/artist/utils";
import { fromJSONArrayString } from "~/data/utils";
import { commonTrackColumns, structuredTracksView } from "~/data/views";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ListLayout } from "~/navigation/layouts/ListLayout";

import { getSubqueryFields, iAsc } from "~/lib/drizzle";
import { getImageUri } from "~/lib/file-system";
import { cn } from "~/lib/style";
import { formatSeconds } from "~/utils/number";
import { pickKeys } from "~/utils/object";
import { FlatList } from "~/components/Base/List";
import { Divider } from "~/components/Divider";
import { ListItem } from "~/components/List";
import { SegmentedList } from "~/components/List/Segmented";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { AccentText } from "~/components/Typography/AccentText";
import { MediaImage } from "~/modules/media/components/MediaImage";

export default function MostPlayed() {
  const { t } = useTranslation();
  const { isPending, data } = useMostPlayedTracks();

  return (
    <ListLayout>
      <QuickOverView
        totalListeningTime={1000}
        totalPlays={10}
        uniqueSongs={5}
        uniqueArtists={1}
      />
      <TopList
        label={t("feat.recap.extra.top", { name: t("term.tracks") })}
        data={[]}
      />
      <TopList
        label={t("feat.recap.extra.top", { name: t("term.artists") })}
        data={[]}
        roundedImage
      />
      <TopList
        label={t("feat.recap.extra.top", { name: t("term.albums") })}
        data={[]}
      />
    </ListLayout>
  );

  // if (isPending || data?.length === 0) {
  //   return (
  //     <ContentPlaceholder isPending={isPending} errMsgKey="err.msg.noResults" />
  //   );
  // }
  // return (
  //   <SegmentedList
  //     scrollEnabled
  //     contentContainerClassName="p-4 pb-safe-offset-4"
  //   >
  //     {data?.map((item) => (
  //       <SegmentedList.CustomItem key={item.placement} className="flex-row p-1">
  //         <PlacementNumber placement={item.placement} />
  //         <PlayCountList tracks={item.tracks} />
  //       </SegmentedList.CustomItem>
  //     ))}
  //   </SegmentedList>
  // );
}

//#region Quick Overview
const overviewStats = ["totalPlays", "uniqueSongs", "uniqueArtists"] as const;

function QuickOverView(props: {
  totalListeningTime: number;
  totalPlays: number;
  uniqueSongs: number;
  uniqueArtists: number;
}) {
  return (
    <View className="gap-4 rounded-3xl bg-surfaceContainerLowest p-4">
      <View className="gap-2 rounded-3xl bg-secondary p-4">
        <TStyledText
          textKey="feat.recap.extra.totalListeningTime"
          className="text-sm text-onSecondaryVariant"
        />
        <AccentText className="text-4xl leading-none! text-onSecondary">
          {formatSeconds(props.totalListeningTime)}
        </AccentText>
      </View>
      <Divider />
      <View className="flex-row gap-4">
        {overviewStats.map((key) => (
          <View key={key} className="flex-1">
            <AccentText className="text-lg text-primary">
              {props[key]}
            </AccentText>
            <TStyledText textKey={`feat.recap.extra.${key}`} dim />
          </View>
        ))}
      </View>
    </View>
  );
}
//#endregion

//#region Top Lists
type TopItem = {
  name: string;
  imgSrc: string | null;
  playCount: number;
  totalTime: number;
};

function TopList(props: {
  label: string;
  data: TopItem[];
  roundedImage?: boolean;
}) {
  const { t } = useTranslation();
  if (props.data.length === 0) return null;
  return (
    <View className="gap-2">
      <StyledText bold className="text-lg">
        {props.label} ({props.data.length})
      </StyledText>
      <FlatList
        data={props.data}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <ListItem
            labelText={item.name}
            supportingText={`${t("feat.recap.extra.playCount", { count: item.playCount })} • ${formatSeconds(item.totalTime)}`}
            Leading={
              <>
                <View className="size-8 items-center justify-center">
                  <StyledText>{index + 1}</StyledText>
                </View>
                <MediaImage
                  type={props.roundedImage ? "artist" : "track"}
                  source={item.imgSrc}
                  size={48}
                />
              </>
            }
            className={cn(
              "gap-2 rounded-3xl bg-surfaceContainerLowest p-2 pr-4",
              {
                "rounded-t-sm": index !== 0,
                "rounded-b-sm": index !== props.data.length - 1,
              },
            )}
            _overflow={false}
          />
        )}
        scrollEnabled={false}
        contentContainerClassName="gap-[3px]"
      />
    </View>
  );
}
//#endregion

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
    //? Derive `playCount` from "completion ratio" for best representation based on
    //? track duration and play time.
    playCount:
      sql`ceil(sum(${tracksPlayEvents.playTime}) / ${structuredTracksView.duration})`
        .mapWith(Number)
        .as("play_count"),
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
