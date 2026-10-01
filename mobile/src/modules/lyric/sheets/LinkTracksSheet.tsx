// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getArtistsString } from "~/data/artist/utils";

import { DetachedSheet } from "~/components/Sheet";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import { SearchList } from "~/modules/search/components/SearchList";
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
          <ImageListItem
            label={item.name}
            supporting={getArtistsString(item.artists)}
            src={item.artwork}
            onPress={() =>
              linkTrackToLyric({
                name: item.name,
                trackId: item.id,
                lyricId: props.lyricId,
              })
            }
            spacing="none"
          />
        )}
        nestedScrollEnabled
        shadowTransitionConfig={{ color: "surfaceBright" }}
        renderOnQuery
        contentContainerClassName="gap-1.5 pb-4"
      />
    </DetachedSheet>
  );
}
