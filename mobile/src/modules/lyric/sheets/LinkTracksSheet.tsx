// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getArtistsString } from "~/data/artist/utils";

import type { SheetRef } from "~/components/next/base/sheet";
import { Sheet } from "~/components/next/base/sheet";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { useAllMedia } from "~/modules/search/hooks/useSearch";
import { Search } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";
import { linkTrackToLyric } from "../helpers/linkTrackToLyric";

export function LinkTracksSheet(props: { ref: SheetRef; lyricId: string }) {
  const { data } = useAllMedia();
  return (
    <Search.Provider>
      <Sheet ref={props.ref} snapTop>
        <Sheet.Header>
          <Search.Input />
        </Sheet.Header>
        <Search.List
          CustomList={Sheet.FlatList}
          data={data?.track ?? []}
          keyExtractor={({ id }) => id}
          onFilterData={(query, data) => containSorter(data, query, "name")}
          renderItem={({ item }) => (
            <ImageListItem
              src={item.artwork}
              label={item.name}
              supporting={getArtistsString(item.artists)}
              onPress={() =>
                linkTrackToLyric({
                  name: item.name,
                  trackId: item.id,
                  lyricId: props.lyricId,
                })
              }
              spacing="row"
            />
          )}
          renderOnQuery
          className="-mb-5.5"
        />
      </Sheet>
    </Search.Provider>
  );
}
