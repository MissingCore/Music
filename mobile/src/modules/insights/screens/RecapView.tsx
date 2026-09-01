// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import {
  and,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import type { ActionDispatch } from "react";
import { useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";
import {
  albums,
  artists,
  tracks,
  tracksPlayEvents,
  tracksToArtists,
} from "~/db/schema";

import i18next from "~/modules/i18n";
import { Icon } from "~/resources/icons";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { ListLayout } from "~/navigation/layouts/ListLayout";

import { iAsc } from "~/lib/drizzle";
import { cn } from "~/lib/style";
import { formatSeconds } from "~/utils/number";
import { omitKeys } from "~/utils/object";
import { LegendList } from "~/components/Base/LegendList";
import { FlatList } from "~/components/Base/List";
import { Ripple } from "~/components/Base/Pressable";
import { Divider } from "~/components/Divider";
import { ListItem } from "~/components/List";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { StyledText, TStyledText } from "~/components/Typography/StyledText";
import { AccentText } from "~/components/Typography/AccentText";
import { MediaImage } from "~/modules/media/components/MediaImage";

//#region Recap Time Range
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

interface State {
  rangeLabel: string;
  startEpoch: number;
  endEpoch?: number;
}

type Action =
  | { type: "all-time" }
  | { type: "month"; payload: Date }
  | { type: "year"; payload: Date };

const recapRangeReducer = (_: State, action: Action): State => {
  if (action.type === "all-time") {
    return {
      rangeLabel: i18next.t("feat.recap.extra.allTime"),
      startEpoch: sessionStore.getState().recapStartEpoch,
      endEpoch: undefined,
    };
  } else if (action.type === "month") {
    const month = action.payload.getMonth();
    const year = action.payload.getFullYear();

    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;

    const startEpoch = new Date(year, month, 1).getTime();
    const endEpoch = new Date(endYear, endMonth, 1).getTime();

    return { rangeLabel: `${MONTHS[month]} ${year}`, startEpoch, endEpoch };
  }
  // `action.type === "year"`
  const year = action.payload.getFullYear();
  const startEpoch = new Date(year, 0, 1).getTime();
  const endEpoch = new Date(year + 1, 0, 1).getTime();
  return { rangeLabel: String(year), startEpoch, endEpoch };
};
//#endregion

export default function Recap() {
  const recapStartEpoch = useSessionStore((s) => s.recapStartEpoch);
  const [state, dispatch] = useReducer(recapRangeReducer, {
    rangeLabel: i18next.t("feat.recap.extra.allTime"),
    startEpoch: recapStartEpoch,
  });
  const timeRangeSheetRef = useSheetRef();

  return (
    <>
      <TimeRangeSheet ref={timeRangeSheetRef} dispatch={dispatch} />
      <ListLayout>
        <Ripple
          onPress={() => timeRangeSheetRef.current?.present()}
          className="flex-row justify-between gap-4 rounded-3xl bg-surfaceContainerLowest p-4"
        >
          <View className="gap-2">
            <TStyledText
              textKey="feat.recap.extra.timeRange"
              className="text-sm text-onSurfaceVariant"
            />
            <AccentText className="text-4xl leading-none!">
              {state.rangeLabel}
            </AccentText>
          </View>
          <Icon name="keyboard-arrow-down" />
        </Ripple>
        <RecapContent {...state} />
      </ListLayout>
    </>
  );
}

function RecapContent(props: { startEpoch: number; endEpoch?: number }) {
  const { t } = useTranslation();
  const { isPending, data } = useRecap(props.startEpoch, props.endEpoch);
  if (isPending || !data) return <ContentPlaceholder isPending={isPending} />;
  return (
    <>
      <QuickOverview {...data.overview} />
      <TopContent {...data.mostPlayed} />
      <TopList label={t("term.tracks")} data={data.topTracks} />
      <TopList label={t("term.artists")} data={data.topArtists} roundedImage />
      <TopList label={t("term.albums")} data={data.topAlbums} />
    </>
  );
}

function TimeRangeSheet(props: {
  ref: TrueSheetRef;
  dispatch: ActionDispatch<[action: Action]>;
}) {
  const recapStartEpoch = useSessionStore((s) => s.recapStartEpoch);

  const options = useMemo(() => {
    const startDate = new Date(recapStartEpoch);
    const endDate = new Date();

    let startMonth = startDate.getMonth();
    let startYear = startDate.getFullYear();
    const endMonth = endDate.getMonth();
    const endYear = endDate.getFullYear();

    const rangeOptions: Array<{
      label: string;
      payload: Date;
      type: "month" | "year";
    }> = [];

    do {
      while (startMonth < 12) {
        rangeOptions.unshift({
          label: `${MONTHS[startMonth]} ${startYear}`,
          payload: new Date(startYear, startMonth, 1),
          type: "month",
        });
        if (startYear === endYear && startMonth === endMonth) break;
        startMonth += 1;
      }

      rangeOptions.unshift({
        label: `${startYear}`,
        payload: new Date(startYear, 0, 1),
        type: "year",
      });
      startMonth = 0;
      startYear += 1;
    } while (startYear <= endYear);

    return rangeOptions;
  }, [recapStartEpoch]);

  return (
    <DetachedSheet ref={props.ref} contentContainerClassName="pb-0">
      <LegendList
        data={options}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <Ripple
            onPress={() => {
              props.dispatch(item);
              props.ref.current?.dismiss();
            }}
          >
            <StyledText className="text-lg">{item.label}</StyledText>
          </Ripple>
        )}
        ListHeaderComponent={
          <Ripple
            onPress={() => {
              props.dispatch({ type: "all-time" });
              props.ref.current?.dismiss();
            }}
          >
            <TStyledText
              textKey="feat.recap.extra.allTime"
              className="text-lg"
            />
          </Ripple>
        }
        nestedScrollEnabled
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}

//#region Quick Overview
const overviewStats = ["totalPlays", "uniqueTracks", "uniqueArtists"] as const;

function QuickOverview(
  props: Awaited<ReturnType<typeof getRecap>>["overview"],
) {
  return (
    <View className="gap-4 rounded-3xl bg-surfaceContainerLowest p-4">
      <View className="gap-2 rounded-3xl bg-secondary p-4">
        <TStyledText
          textKey="feat.recap.extra.totalListeningTime"
          className="text-sm text-onSecondaryVariant"
        />
        <AccentText className="text-4xl leading-none! text-onSecondary">
          {formatSeconds(props.totalListeningTime, false)}
        </AccentText>
      </View>
      <Divider />
      <View className="flex-row gap-4">
        {overviewStats.map((key) => (
          <View key={key} className="flex-1">
            <AccentText className="text-lg">{props[key]}</AccentText>
            <TStyledText textKey={`feat.recap.extra.${key}`} dim />
          </View>
        ))}
      </View>
    </View>
  );
}
//#endregion

//#region Top Content
function TopContent(props: Awaited<ReturnType<typeof getRecap>>["mostPlayed"]) {
  const { t } = useTranslation();
  return (["track", "artist", "album"] as const)
    .filter((content) => props[content] !== undefined)
    .map((content) => {
      const item = props[content]!;
      return (
        <View
          key={content}
          className="flex-row items-center gap-4 rounded-3xl bg-surfaceContainerLowest p-4"
        >
          <MediaImage type={content} source={item.imgSrc} size={64} />
          <View className="shrink grow">
            <StyledText dim className="text-primary">
              {t("feat.recap.extra.mostPlayed", { name: t(`term.${content}`) })}
            </StyledText>
            <StyledText numberOfLines={1} className="text-lg">
              {item.name}
            </StyledText>
            <StyledText numberOfLines={1} dim>
              {`${t("feat.recap.extra.playCount", { count: item.playCount })} • ${formatSeconds(item.totalTime)}`}
            </StyledText>
          </View>
        </View>
      );
    });
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
  const [previewLimit, setPreviewLimit] = useState(5);

  const canLimitPreview = props.data.length > 5;

  if (props.data.length === 0) return null;
  return (
    <View className="gap-2">
      <StyledText bold className="text-lg">
        {t("feat.recap.extra.top", { name: props.label })} ({props.data.length})
      </StyledText>
      <FlatList
        data={props.data.slice(0, previewLimit)}
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
                "rounded-b-sm":
                  index !== Math.min(props.data.length, previewLimit) - 1,
              },
            )}
            _overflow={false}
          />
        )}
        ListFooterComponent={
          canLimitPreview ? (
            <Ripple
              onPress={() =>
                setPreviewLimit((prev) => (prev === 5 ? props.data.length : 5))
              }
              className="rounded-full"
            >
              <StyledText className="text-sm text-primary">
                {previewLimit === 5
                  ? t("template.entryShowAll", {
                      name: props.label.toLocaleLowerCase(),
                    })
                  : t("template.entryShow", {
                      name: t("feat.recap.extra.top", {
                        name: 5,
                      }).toLocaleLowerCase(),
                    })}
              </StyledText>
            </Ripple>
          ) : null
        }
        scrollEnabled={false}
        contentContainerClassName="gap-[3px]"
      />
    </View>
  );
}
//#endregion

//#region Data Query
async function getRecap(startEpoch: number, endEpoch = Date.now()) {
  //? Identify range of data we care about.
  const scopedPlayEventView = db
    .select({
      ...omitKeys(getTableColumns(tracksPlayEvents), ["playTime"]),
      ...omitKeys(getTableColumns(tracks), ["id"]),
      //? Derive `playCount` from "completion ratio" for best representation based on
      //? track duration and play time.
      playCount:
        sql`ceil(sum(${tracksPlayEvents.playTime}) / ${tracks.duration})`
          .mapWith(Number)
          .as("play_count"),
      //? Derive aggregated play time for track.
      playTime: sql`sum(${tracksPlayEvents.playTime})`
        .mapWith(Number)
        .as("agg_play_time"),
    })
    .from(tracksPlayEvents)
    .where(
      and(
        gte(tracksPlayEvents.playedAt, startEpoch),
        lte(tracksPlayEvents.playedAt, endEpoch),
      ),
    )
    .innerJoin(tracks, eq(tracksPlayEvents.trackId, tracks.id))
    .groupBy(tracksPlayEvents.trackId)
    .as("scoped_play_events");

  //? Get "Overview" stats.
  const [overviewStats] = await db
    .select({
      totalListeningTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(
        Number,
      ),
      totalPlays:
        sql`coalesce(sum(${scopedPlayEventView.playCount}), 0)`.mapWith(Number),
      uniqueTracks: countDistinct(scopedPlayEventView.trackId),
    })
    .from(scopedPlayEventView);
  const [uniqueArtistsStat] = await db
    .select({
      uniqueArtists: countDistinct(tracksToArtists.artistName),
    })
    .from(scopedPlayEventView)
    .innerJoin(
      tracksToArtists,
      eq(scopedPlayEventView.trackId, tracksToArtists.trackId),
    );

  //? Get "Top Tracks" stats.
  const topTracks = await db
    .select({
      name: scopedPlayEventView.name,
      imgSrc: sql<
        string | null
      >`coalesce(${scopedPlayEventView.artwork}, ${albums.artwork})`,
      playCount: scopedPlayEventView.playCount,
      totalTime: scopedPlayEventView.playTime,
    })
    .from(scopedPlayEventView)
    .leftJoin(albums, eq(scopedPlayEventView.albumId, albums.id))
    .orderBy(
      desc(scopedPlayEventView.playCount),
      iAsc(scopedPlayEventView.name),
    );

  //? Get "Top Artists" stats.
  const topArtists = await db
    .select({
      name: artists.name,
      imgSrc: artists.artwork,
      playCount: sql`sum(${scopedPlayEventView.playCount})`.mapWith(Number),
      totalTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(Number),
    })
    .from(scopedPlayEventView)
    .innerJoin(
      tracksToArtists,
      eq(scopedPlayEventView.trackId, tracksToArtists.trackId),
    )
    .innerJoin(artists, eq(tracksToArtists.artistName, artists.name))
    .groupBy(artists.name)
    .orderBy(
      desc(sql`sum(${scopedPlayEventView.playCount})`),
      iAsc(artists.name),
    );

  //? Get "Top Albums" stats.
  const topAlbums = await db
    .select({
      name: albums.name,
      imgSrc: albums.artwork,
      playCount: sql`sum(${scopedPlayEventView.playCount})`.mapWith(Number),
      totalTime: sql`sum(${scopedPlayEventView.playTime})`.mapWith(Number),
    })
    .from(scopedPlayEventView)
    .innerJoin(albums, eq(scopedPlayEventView.albumId, albums.id))
    .groupBy(albums.id)
    .orderBy(
      desc(sql`sum(${scopedPlayEventView.playCount})`),
      iAsc(albums.name),
    );

  return {
    overview: { ...overviewStats!, ...uniqueArtistsStat! },
    mostPlayed: {
      album: topAlbums[0],
      artist: topArtists[0],
      track: topTracks[0],
    },
    topTracks,
    topArtists,
    topAlbums,
  };
}

const queryKey = ["insights", "most-played"];

function useRecap(startEpoch: number, endEpoch?: number) {
  return useQuery({
    queryKey: [...queryKey, { startEpoch, endEpoch }],
    queryFn: () => getRecap(startEpoch, endEpoch),
  });
}
//#endregion
