import { useQuery } from "@tanstack/react-query";
import { inArray, isNotNull } from "drizzle-orm";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { tracks } from "~/db/schema";
import { getTracks } from "~/api/track";

import { VisibilityOff } from "~/resources/icons/VisibilityOff";

import { clearAllQueries } from "~/lib/react-query";
import { bgWait } from "~/utils/promise";
import { LegendList } from "~/components/Defaults";
import { IconButton } from "~/components/Form/Button/Icon";
import { SearchResult } from "~/modules/search/components/SearchResult";
import {
  ContentPlaceholder,
  PagePlaceholder,
} from "../../components/Placeholder";

export default function HiddenTracks() {
  const { isPending, data } = useHiddenTracks();
  if (isPending) return <PagePlaceholder isPending={isPending} />;
  return <ScreenContents data={data ?? []} />;
}

function ScreenContents(props: {
  data: Awaited<ReturnType<typeof getHiddenTracks>>;
}) {
  const { t } = useTranslation();
  const [dataSnapshot, setDataSnapshot] = useState(props.data);
  const unHiddenTracks = useRef<string[]>([]);

  const onShowTrack = useCallback((trackId: string) => {
    setDataSnapshot((prev) => prev.filter(({ id }) => id !== trackId));
    unHiddenTracks.current = [...unHiddenTracks.current, trackId];
  }, []);

  const handleOnUnmount = useCallback(() => {
    return () => {
      if (unHiddenTracks.current.length === 0) return;
      // Slight delay to allow navigation transition to finish as this
      // will block the thread.
      bgWait(1)
        .then(() =>
          db
            .update(tracks)
            .set({ hiddenAt: null })
            .where(inArray(tracks.id, unHiddenTracks.current)),
        )
        .then(() => clearAllQueries());
    };
  }, []);

  return (
    <LegendList
      ref={handleOnUnmount}
      getEstimatedItemSize={(index) => (index === 0 ? 48 : 56)}
      data={dataSnapshot}
      //? Removing the 1st item will lead the new 1st item to have extra top margin.
      keyExtractor={({ id }, index) => `${id}_${index}`}
      renderItem={({ item, index }) => (
        <SearchResult
          type="track"
          title={item.name}
          description={t("feat.hiddenTracks.extra.hiddenAt", {
            date: new Date(item.hiddenAt!).toDateString(),
          })}
          imageSource={item.artwork}
          RightElement={
            <IconButton
              Icon={VisibilityOff}
              accessibilityLabel={t("template.entryShow", { name: item.name })}
              onPress={() => onShowTrack(item.id)}
            />
          }
          className={index > 0 ? "mt-2" : undefined}
        />
      )}
      ListEmptyComponent={
        <ContentPlaceholder errMsgKey="feat.hiddenTracks.extra.notFound" />
      }
      contentContainerClassName="p-4"
    />
  );
}

//#region Data Query
async function getHiddenTracks() {
  return getTracks({
    where: [isNotNull(tracks.hiddenAt)],
    columns: ["id", "name", "artwork", "hiddenAt"],
    albumColumns: ["artwork"],
    withHidden: true,
  });
}

const queryKey = ["settings", "hidden-tracks"];

function useHiddenTracks() {
  return useQuery({
    queryKey,
    queryFn: getHiddenTracks,
    select: (data) => {
      // FIXME: Once Hermes supports `toSorted`, use it instead.
      // Both `hiddenAt` should technically be not `null`.
      data.sort((a, b) => b.hiddenAt! - a.hiddenAt!);
      return data;
    },
    staleTime: 0,
    gcTime: 0,
  });
}
//#endregion
