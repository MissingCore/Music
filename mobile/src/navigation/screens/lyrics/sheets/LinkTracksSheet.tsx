import { toast } from "@backpackapp-io/react-native-toast";

import { db } from "~/db";
import { tracksToLyrics } from "~/db/schema";

import i18next from "~/modules/i18n";
import { queries as q } from "~/queries/keyStore";

import { queryClient } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { ToastOptions } from "~/lib/toast";
import { DetachedSheet } from "~/components/Sheet/Detached";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import { SearchList } from "~/modules/search/components/SearchList";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { getArtistsString } from "~/api/artist.utils";
import { getTrackArtwork } from "~/api/track.utils";

export function LinkTracksSheet(props: { ref: TrueSheetRef; lyricId: string }) {
  const { data } = useAllMedia();
  return (
    <DetachedSheet
      ref={props.ref}
      onCleanup={() => {
        queryClient.invalidateQueries({ queryKey: q.lyrics._def });
      }}
      keyboardAndToast
      snapTop
    >
      <SearchList
        data={data?.track ?? []}
        keyExtractor={({ id }) => id}
        onFilterData={(_query, data) => {
          const query = _query.toLocaleLowerCase();

          // Copy over filtering strategy from `useSearch`.
          const filteredResults = data.filter(
            (i) =>
              i.name.toLocaleLowerCase().includes(query) ||
              // One of track's artist names starts with query.
              i.tracksToArtists.some(({ artistName }) =>
                artistName.toLocaleLowerCase().startsWith(query),
              ) ||
              // Track's album starts with query.
              i.album?.name.toLocaleLowerCase().startsWith(query),
          );

          // Have results that start with the query first.
          const goodMatch: typeof data = [];
          const partialMatch: typeof data = [];
          filteredResults.forEach((data) => {
            if (data.name.toLocaleLowerCase().startsWith(query))
              goodMatch.push(data);
            else partialMatch.push(data);
          });

          return goodMatch.concat(partialMatch);
        }}
        renderItem={({ item, index }) => (
          <SearchResult
            button
            type="track"
            title={item.name}
            description={getArtistsString(item.tracksToArtists)}
            imageSource={getTrackArtwork(item)}
            onPress={() =>
              linkTrackToLyric({
                name: item.name,
                trackId: item.id,
                lyricId: props.lyricId,
              })
            }
            className={cn("pr-4", { "mt-2": index > 0 })}
          />
        )}
        nestedScrollEnabled
        renderOnQuery
        contentContainerClassName="pb-4"
      />
    </DetachedSheet>
  );
}

//#region Utils
async function linkTrackToLyric(entry: {
  name: string;
  trackId: string;
  lyricId: string;
}) {
  const { name, ...trackLyricRel } = entry;

  // Upsert track-lyric relation.
  await db
    .insert(tracksToLyrics)
    .values(trackLyricRel)
    .onConflictDoUpdate({
      target: [tracksToLyrics.trackId],
      set: { lyricId: entry.lyricId },
    });

  queryClient.invalidateQueries({
    queryKey: q.lyrics.detail(entry.lyricId).queryKey,
  });
  toast(i18next.t("template.entryAdded", { name }), ToastOptions);
}
//#endregion
