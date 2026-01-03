import { useQuery } from "@tanstack/react-query";
import { inArray } from "drizzle-orm";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { db } from "~/db";
import type { HiddenTrack } from "~/db/schema";
import { hiddenTracks } from "~/db/schema";

import { VisibilityOff } from "~/resources/icons/VisibilityOff";

import { cn } from "~/lib/style";
import { bgWait } from "~/utils/promise";
import { FlashList, FlatList } from "~/components/Defaults";
import { Divider } from "~/components/Divider";
import { IconButton } from "~/components/Form/Button/Icon";
import { SegmentedList } from "~/components/List/Segmented";
import { Em, StyledText } from "~/components/Typography/StyledText";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";

export default function HiddenTracks() {
  const { isPending, data } = useHiddenTracks();
  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return <ScreenContents data={data ?? []} />;
}

function ScreenContents(props: { data: HiddenTrack[] }) {
  const [dataSnapshot, setDataSnapshot] = useState(props.data);
  const unHiddenTracks = useRef<string[]>([]);

  const groupedHiddenTracks = useMemo(() => {
    // Group data by month and year (data is in descending order by default).
    // const grouped
    const results: HiddenTracksGroup[] = [];

    const [first, ...remainingTracks] = dataSnapshot;
    if (!first) return [];

    const initGroupVal = getHiddenTrackDateContext(first);
    let newEntry: HiddenTracksGroup = {
      monthYearStr: initGroupVal.monthYearStr,
      dayEntries: [],
    };
    let newDayEntry = { day: initGroupVal.day, tracks: [first] };

    for (const hiddenTrack of remainingTracks) {
      const { monthYearStr, day } = getHiddenTrackDateContext(hiddenTrack);

      if (newEntry.monthYearStr === monthYearStr) {
        if (newDayEntry.day === day) newDayEntry.tracks.push(hiddenTrack);
        else {
          newEntry.dayEntries.push(newDayEntry);
          newDayEntry = { day, tracks: [hiddenTrack] };
        }
      } else {
        newEntry.dayEntries.push(newDayEntry);
        results.push(newEntry);

        newEntry = { monthYearStr, dayEntries: [] };
        newDayEntry = { day, tracks: [hiddenTrack] };
      }
    }

    // Cleanup unhandled new entry.
    newEntry.dayEntries.push(newDayEntry);
    results.push(newEntry);

    return results;
  }, [dataSnapshot]);

  const onShowTrack = useCallback((trackId: string) => {
    setDataSnapshot((prev) => prev.filter(({ id }) => id !== trackId));
    unHiddenTracks.current = [...unHiddenTracks.current, trackId];
  }, []);

  const handleOnUnmount = useCallback(() => {
    return () => {
      if (unHiddenTracks.current.length === 0) return;
      // Slight delay to allow navigation transition to finish as this
      // will block the thread.
      bgWait(1).then(() =>
        db
          .delete(hiddenTracks)
          .where(inArray(hiddenTracks.id, unHiddenTracks.current)),
      );
    };
  }, []);

  return (
    <FlashList
      ref={handleOnUnmount}
      data={groupedHiddenTracks}
      keyExtractor={({ monthYearStr }) => monthYearStr}
      renderItem={({ item, index }) => (
        <View className={cn("gap-2", { "mt-4": index > 0 })}>
          <Em className="text-xs">{item.monthYearStr}</Em>
          <SegmentedList>
            {item.dayEntries.map(({ day, tracks }) => (
              <SegmentedList.CustomItem
                key={`${item.monthYearStr}_${day}`}
                className="flex-row p-1"
              >
                <DayIndicator day={day} />
                <HiddenTrackList tracks={tracks} onShowTrack={onShowTrack} />
              </SegmentedList.CustomItem>
            ))}
          </SegmentedList>
        </View>
      )}
      ListEmptyComponent={
        <ContentPlaceholder errMsgKey="feat.hiddenTracks.extra.notFound" />
      }
      contentContainerClassName="p-4 pt-2"
    />
  );
}

//#region List Components
function DayIndicator({ day }: { day: number }) {
  return (
    <View className="size-12 items-center justify-center">
      <StyledText>{day}</StyledText>
    </View>
  );
}

function HiddenTrackList(props: {
  tracks: HiddenTrack[];
  onShowTrack: (trackId: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <FlatList
      data={props.tracks}
      keyExtractor={({ id }) => id}
      renderItem={({ item: { id, name, uri } }) => (
        <View className="flex-row items-center gap-2">
          <View className="shrink grow">
            <StyledText className="text-sm">{name}</StyledText>
            <StyledText dim className="text-xs">
              {uri}
            </StyledText>
          </View>
          <IconButton
            Icon={VisibilityOff}
            accessibilityLabel={t("template.entryShow", { name })}
            onPress={() => props.onShowTrack(id)}
          />
        </View>
      )}
      ItemSeparatorComponent={() => <Divider className="my-2 mr-3" />}
      className="shrink grow p-2 pr-0"
    />
  );
}
//#endregion

//#region Data Query
async function getHiddenTracks() {
  return db.query.hiddenTracks.findMany({
    orderBy: (fields, { desc }) => desc(fields.hiddenAt),
  });
}

const queryKey = ["settings", "hidden-tracks"];

function useHiddenTracks() {
  return useQuery({
    queryKey,
    queryFn: getHiddenTracks,
    staleTime: 0,
    gcTime: 0,
  });
}

type HiddenTracksGroup = {
  monthYearStr: string;
  dayEntries: Array<{ day: number; tracks: HiddenTrack[] }>;
};

function getHiddenTrackDateContext(track: HiddenTrack) {
  const date = new Date(track.hiddenAt);
  const monthYearStr = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });
  return { monthYearStr, day: date.getDate() };
}
//#endregion
