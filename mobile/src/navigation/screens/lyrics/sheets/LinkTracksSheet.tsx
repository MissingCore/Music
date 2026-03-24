import { getArtistsString } from "~/data/artist/utils";

import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import { SearchList } from "~/modules/search/components/SearchList";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { containSorter } from "~/modules/search/utils";
import { linkTrackToLyric } from "../helpers/linkTrackToLyric";

export function LinkTracksSheet(props: { ref: TrueSheetRef; lyricId: string }) {
  const { data } = useAllMedia();
  return (
    <DetachedSheet ref={props.ref} snapTop>
      <SearchList
        data={data?.track ?? []}
        keyExtractor={({ id }) => id}
        onFilterData={(query, data) => containSorter(data, query, "name")}
        renderItem={({ item }) => (
          <SearchResult
            type="track"
            title={item.name}
            description={getArtistsString(item.artists)}
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
