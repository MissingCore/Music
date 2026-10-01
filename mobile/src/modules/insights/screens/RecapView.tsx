// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import type { ActionDispatch } from "react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import i18next from "~/modules/i18n";
import { sessionStore, useSessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { Epoch, Months, Seconds } from "~/utils/date";
import { LegendList } from "~/components/Base/LegendList";
import { FlatList } from "~/components/Base/List";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Card } from "~/components/next/base/card";
import { Divider } from "~/components/next/base/divider";
import { Icon } from "~/components/next/base/icon";
import { Button } from "~/components/next/blocks/button";
import { SequenceNumber } from "~/components/next/blocks/sequence-number";
import { Text, TText } from "~/components/next/base/typography";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { MediaImage } from "~/components/next/composed/media-image";
import { RECENT_DAY_RANGE } from "../core/constants";
import { generateRecapRange } from "../helpers/generateRecapRange";
import type { RecapResult } from "../helpers/useRecap";
import { useRecap } from "../helpers/useRecap";

//#region Recap Time Range
interface State {
  rangeLabel: string;
  startEpoch: number;
  endEpoch?: number;
}

type Action =
  | { type: "all-time" }
  | { type: "last-7-days" }
  | { type: "month"; payload: Date }
  | { type: "year"; payload: Date };

const recapRangeReducer = (_: State, action: Action): State => {
  if (action.type === "all-time") {
    return {
      rangeLabel: i18next.t("feat.recap.extra.allTime"),
      startEpoch: sessionStore.getState().recapStartEpoch,
      endEpoch: undefined,
    };
  } else if (action.type === "last-7-days") {
    return {
      rangeLabel: i18next.t("feat.recap.extra.lastDays", {
        amount: RECENT_DAY_RANGE,
      }),
      startEpoch: sessionStore.getState().lastDaysStartEpoch,
      endEpoch: undefined,
    };
  } else if (action.type === "month") {
    const month = action.payload.getMonth();
    const year = action.payload.getFullYear();

    const endMonth = month === 11 ? 0 : month + 1;
    const endYear = month === 11 ? year + 1 : year;

    return {
      rangeLabel: `${Months[month]} ${year}`,
      startEpoch: Epoch.from({ month, year }),
      endEpoch: Epoch.from({ month: endMonth, year: endYear }),
    };
  }
  // `action.type === "year"`
  const year = action.payload.getFullYear();
  return {
    rangeLabel: String(year),
    startEpoch: Epoch.from({ year }),
    endEpoch: Epoch.from({ year: year + 1 }),
  };
};
//#endregion

type Props = StaticScreenProps<{ last7Days?: boolean }>;

export default function Recap({
  route: {
    params: { last7Days = false },
  },
}: Props) {
  const defaultRecapRange = useSessionStore((s) => s.defaultRecapRange);
  const [state, dispatch] = useReducer(recapRangeReducer, defaultRecapRange);
  const [isReady, setIsReady] = useState(false);
  const timeRangeSheetRef = useSheetRef();

  useEffect(() => {
    if (last7Days) dispatch({ type: "last-7-days" });
    setIsReady(true);
  }, [last7Days]);

  if (!isReady) return null;
  return (
    <>
      <TimeRangeSheet ref={timeRangeSheetRef} dispatch={dispatch} />
      <ListLayout>
        <Button
          onPress={() => timeRangeSheetRef.current?.present()}
          filled
          className="justify-between"
        >
          <View className="gap-2">
            <TText textKey="feat.recap.extra.timeRange" muted size="sm" />
            <Text accent>{state.rangeLabel}</Text>
          </View>
          <Icon name="keyboard-arrow-down" />
        </Button>
        <RecapContent key={state.rangeLabel} {...state} />
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

//#region Time Range Sheet
function TimeRangeSheet(props: {
  ref: TrueSheetRef;
  dispatch: ActionDispatch<[action: Action]>;
}) {
  const { t } = useTranslation();
  const recapStartEpoch = useSessionStore((s) => s.recapStartEpoch);

  const options = useMemo(
    () =>
      generateRecapRange(recapStartEpoch, true).map(({ date, ...rest }) => ({
        payload: date,
        ...rest,
      })),
    [recapStartEpoch],
  );

  return (
    <DetachedSheet ref={props.ref} contentContainerClassName="pb-0">
      <LegendList
        data={options}
        keyExtractor={(item) => item.label}
        renderItem={({ item }) => (
          <Button
            onPress={() => {
              props.dispatch(item);
              props.ref.current?.dismiss();
            }}
            className="rounded-md p-0"
          >
            <Text size="lg">{item.label}</Text>
          </Button>
        )}
        ListHeaderComponent={
          <>
            <Button
              onPress={() => {
                props.dispatch({ type: "all-time" });
                props.ref.current?.dismiss();
              }}
              className="rounded-md p-0"
            >
              <TText textKey="feat.recap.extra.allTime" size="lg" />
            </Button>
            <Button
              onPress={() => {
                props.dispatch({ type: "last-7-days" });
                props.ref.current?.dismiss();
              }}
              className="rounded-md p-0"
            >
              <Text size="lg">
                {t("feat.recap.extra.lastDays", { amount: RECENT_DAY_RANGE })}
              </Text>
            </Button>
          </>
        }
        nestedScrollEnabled
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}
//#endregion

//#region Quick Overview
const overviewStats = ["totalPlays", "uniqueTracks", "uniqueArtists"] as const;

function QuickOverview(props: RecapResult["overview"]) {
  return (
    <Card className="gap-4">
      <Card intent="secondary" className="gap-2 rounded-lg">
        <TText
          textKey="feat.recap.extra.totalListeningTime"
          intent="secondary"
          muted
          size="sm"
        />
        <Text intent="secondary" accent>
          {Seconds.toReadableTime(props.totalListeningTime)}
        </Text>
      </Card>
      <Divider />
      <View className="flex-row gap-4">
        {overviewStats.map((key) => (
          <View key={key} className="flex-1">
            <Text accent size="lg">
              {props[key]}
            </Text>
            <TText textKey={`feat.recap.extra.${key}`} muted />
          </View>
        ))}
      </View>
    </Card>
  );
}
//#endregion

//#region Top Content
function TopContent(props: RecapResult["mostPlayed"]) {
  const { t } = useTranslation();
  return (["track", "artist", "album"] as const)
    .filter((content) => props[content] !== undefined)
    .map((content) => {
      const item = props[content]!;
      return (
        <Card key={content} className="flex-row items-center gap-4">
          <MediaImage src={item.imgSrc} size={64} className="rounded-lg" />
          <View className="shrink grow">
            <Text muted className="text-primary">
              {t("feat.recap.extra.mostPlayed", { name: t(`term.${content}`) })}
            </Text>
            <Text numberOfLines={1} size="lg">
              {item.name}
            </Text>
            <Text numberOfLines={1} muted>
              {`${t("feat.recap.extra.playCount", { count: item.playCount })} • ${Seconds.toReadableTime(item.totalTime)}`}
            </Text>
          </View>
        </Card>
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
      <Text bold size="lg">
        {t("feat.recap.extra.top", { name: props.label })} ({props.data.length})
      </Text>
      <FlatList
        data={props.data.slice(0, previewLimit)}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item, index }) => (
          <ImageListItem
            src={item.imgSrc}
            label={item.name}
            supporting={`${t("feat.recap.extra.playCount", { count: item.playCount })} • ${Seconds.toReadableTime(item.totalTime)}`}
            Leading={<SequenceNumber value={index + 1} className="-mr-2" />}
            applySpacing={false}
            leadingOverridesSrc={false}
            className={cn("rounded-xl bg-surfaceContainerLowest py-2", {
              "rounded-t-sm": index !== 0,
              "rounded-b-sm":
                index !== Math.min(props.data.length, previewLimit) - 1,
            })}
          />
        )}
        ListFooterComponent={
          canLimitPreview ? (
            <Button
              onPress={() =>
                setPreviewLimit((prev) => (prev === 5 ? props.data.length : 5))
              }
              className="rounded-full"
            >
              <Text size="sm" className="text-primary">
                {previewLimit === 5
                  ? t("template.entryShowAll", {
                      name: props.label.toLocaleLowerCase(),
                    })
                  : t("template.entryShow", {
                      name: t("feat.recap.extra.top", {
                        name: 5,
                      }).toLocaleLowerCase(),
                    })}
              </Text>
            </Button>
          ) : null
        }
        scrollEnabled={false}
        contentContainerClassName="gap-0.75"
      />
    </View>
  );
}
//#endregion
