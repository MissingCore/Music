import { toast } from "@backpackapp-io/react-native-toast";

import { db } from "~/db";
import { tracksToLyrics } from "~/db/schema";

import i18next from "~/modules/i18n";
import { queries as q } from "~/data/keyStore";

import { queryClient } from "~/lib/react-query";
import { ToastOptions } from "~/lib/toast";
import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import { SearchList } from "~/modules/search/components/SearchList";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { containSorter } from "~/modules/search/utils";

export function LinkTracksSheet(props: { ref: TrueSheetRef; lyricId: string }) {
  const { data } = useAllMedia();
  return (
    <DetachedSheet ref={props.ref} keyboardAndToast snapTop>
      <SearchList
        data={data?.track ?? []}
        keyExtractor={({ id }) => id}
        onFilterData={(query, data) => containSorter(data, query, "name")}
        renderItem={({ item }) => (
          <SearchResult
            button
            type="track"
            title={item.name}
            description={item.artists?.join(", ") ?? "—"}
            imageSource={item.artwork}
            onPress={() =>
              linkTrackToLyric({
                name: item.name,
                trackId: item.id,
                lyricId: props.lyricId,
              })
            }
            className="mb-2 pr-4"
          />
        )}
        nestedScrollEnabled
        shadowTransitionConfig={{ color: "surfaceBright" }}
        renderOnQuery
        className="-mb-2"
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
